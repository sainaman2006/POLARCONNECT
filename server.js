"use strict";
/*
 * POLAR CONNECT — payments backend (Razorpay Standard Checkout)
 *
 * Flow
 *   1. Browser  → POST /api/v1/payments/orders   amount + donor details
 *      Server validates, creates a Razorpay order for that exact amount, returns order_id + key_id.
 *   2. Browser opens Razorpay Checkout with the order_id (card / UPI / netbanking / wallets).
 *   3. Browser  → POST /api/v1/payments/verify   razorpay_{order_id,payment_id,signature}
 *      Server recomputes HMAC-SHA256(order_id|payment_id, KEY_SECRET) and compares.
 *   4. Razorpay → POST /api/v1/payments/webhook  (source of truth if the browser tab closes early)
 *
 * The key SECRET only ever lives here. The browser never sees it.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

function loadEnv() {
  try { process.loadEnvFile(path.join(__dirname, ".env")); } catch (_) { /* no .env — rely on real env vars */ }
}

const CAUSES = {
  "open-data": "Open polar data",
  "student-outreach": "Student outreach",
  "field-instruments": "Field & instruments"
};

function createApp(overrides) {
  const cfg = Object.assign({
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    apiBase: process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1",
    minInr: parseInt(process.env.MIN_INR || "50", 10),
    maxInr: parseInt(process.env.MAX_INR || "100000", 10),
    anthropicKey: process.env.ANTHROPIC_API_KEY || "",
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    anthropicBase: process.env.ANTHROPIC_API_BASE || "https://api.anthropic.com",
    dataDir: path.join(__dirname, "data"),
    staticRoot: path.join(__dirname, ".."),
    rateLimit: { windowMs: 10 * 60 * 1000, max: 20 }
  }, overrides || {});

  const enabled = Boolean(cfg.keyId && cfg.keySecret);
  const mode = cfg.keyId.startsWith("rzp_live_") ? "live" : "test";

  /* ---------- tiny persistence: JSONL append log + in-memory index ---------- */
  fs.mkdirSync(cfg.dataDir, { recursive: true });
  const logFile = path.join(cfg.dataDir, "payments.jsonl");
  const orders = new Map();      // order_id -> record
  const seenEvents = new Set();  // webhook idempotency
  try {
    fs.readFileSync(logFile, "utf8").split("\n").filter(Boolean).forEach((l) => {
      try { const r = JSON.parse(l); orders.set(r.order_id, Object.assign(orders.get(r.order_id) || {}, r)); } catch (_) {}
    });
  } catch (_) { /* first run */ }

  function save(orderId, patch) {
    const rec = Object.assign(orders.get(orderId) || { order_id: orderId }, patch, { updated_at: new Date().toISOString() });
    orders.set(orderId, rec);
    fs.appendFile(logFile, JSON.stringify(rec) + "\n", () => {});
    return rec;
  }

  /* ---------- helpers ---------- */
  function hmac(secret, data) { return crypto.createHmac("sha256", secret).update(data).digest("hex"); }
  function safeEqual(a, b) {
    const x = Buffer.from(String(a), "utf8"), y = Buffer.from(String(b), "utf8");
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  }
  const hits = new Map();
  function limited(ip) {
    const now = Date.now(), w = cfg.rateLimit.windowMs;
    const arr = (hits.get(ip) || []).filter((t) => now - t < w);
    arr.push(now); hits.set(ip, arr);
    return arr.length > cfg.rateLimit.max;
  }
  const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  /* ---------- webhook (needs the RAW body, so mount before express.json) ---------- */
  app.post("/api/v1/payments/webhook", express.raw({ type: "*/*", limit: "1mb" }), (req, res) => {
    if (!cfg.webhookSecret) return res.status(503).json({ error: "Webhook secret not configured" });
    const sig = req.get("x-razorpay-signature") || "";
    if (!Buffer.isBuffer(req.body) || !safeEqual(sig, hmac(cfg.webhookSecret, req.body))) {
      return res.status(400).json({ error: "Invalid signature" });
    }
    const eventId = req.get("x-razorpay-event-id");
    if (eventId && seenEvents.has(eventId)) return res.json({ ok: true, duplicate: true });
    if (eventId) seenEvents.add(eventId);

    let evt;
    try { evt = JSON.parse(req.body.toString("utf8")); } catch (_) { return res.status(400).json({ error: "Bad JSON" }); }
    const pay = evt.payload && evt.payload.payment && evt.payload.payment.entity;
    if (pay && pay.order_id) {
      if (evt.event === "payment.captured" || evt.event === "order.paid") {
        save(pay.order_id, { status: "paid", payment_id: pay.id, method: pay.method, paid_via: "webhook" });
      } else if (evt.event === "payment.failed") {
        const cur = orders.get(pay.order_id);
        if (!cur || cur.status !== "paid") save(pay.order_id, { status: "failed", payment_id: pay.id });
      }
    }
    res.json({ ok: true });
  });

  app.use("/api/v1/payments", express.json({ limit: "10kb" }));

  app.get("/api/v1/payments/config", (req, res) => {
    res.json({ enabled, mode, currency: "INR", min: cfg.minInr, max: cfg.maxInr, causes: CAUSES });
  });

  /* ---------- 1. create order ---------- */
  app.post("/api/v1/payments/orders", async (req, res) => {
    if (!enabled) return res.status(503).json({ error: "Payments are not configured on this server." });
    if (limited(req.ip)) return res.status(429).json({ error: "Too many attempts. Please try again in a few minutes." });

    const b = req.body || {};
    const amount = Number(b.amount);
    const cause = clean(b.cause, 40);
    const name = clean(b.name, 80);
    const email = clean(b.email, 120);
    const phone = clean(b.phone, 20).replace(/[^\d+]/g, "");

    if (!Number.isInteger(amount) || amount < cfg.minInr || amount > cfg.maxInr)
      return res.status(400).json({ error: `Amount must be a whole number between ₹${cfg.minInr} and ₹${cfg.maxInr.toLocaleString("en-IN")}.` });
    if (!CAUSES[cause]) return res.status(400).json({ error: "Please choose a valid cause." });
    if (name.length < 2) return res.status(400).json({ error: "Please enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });

    try {
      const rp = await fetch(cfg.apiBase + "/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(cfg.keyId + ":" + cfg.keySecret).toString("base64")
        },
        body: JSON.stringify({
          amount: amount * 100,                       // Razorpay works in paise
          currency: "INR",
          receipt: "polar_" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex"),
          notes: { cause, name, email }
        })
      });
      const data = await rp.json().catch(() => ({}));
      if (!rp.ok || !data.id) {
        console.error("Razorpay order error:", rp.status, data && data.error);
        return res.status(502).json({ error: "Could not start the payment. Please try again." });
      }
      save(data.id, { status: "created", amount, cause, name, email, phone, created_at: new Date().toISOString() });
      res.json({ order_id: data.id, amount: data.amount, currency: data.currency, key_id: cfg.keyId });
    } catch (err) {
      console.error("Order creation failed:", err.message);
      res.status(502).json({ error: "Payment service unreachable. Please try again." });
    }
  });

  /* ---------- 3. verify signature ---------- */
  app.post("/api/v1/payments/verify", (req, res) => {
    if (!enabled) return res.status(503).json({ error: "Payments are not configured on this server." });
    const b = req.body || {};
    const oid = clean(b.razorpay_order_id, 64), pid = clean(b.razorpay_payment_id, 64), sig = clean(b.razorpay_signature, 128);
    if (!oid || !pid || !sig) return res.status(400).json({ verified: false, error: "Missing payment details." });

    if (!safeEqual(sig, hmac(cfg.keySecret, oid + "|" + pid))) {
      const cur = orders.get(oid);
      if (cur && cur.status !== "paid") save(oid, { status: "verification_failed", payment_id: pid });
      return res.status(400).json({ verified: false, error: "Payment could not be verified." });
    }
    const rec = save(oid, { status: "paid", payment_id: pid, paid_via: (orders.get(oid) || {}).paid_via || "checkout" });
    res.json({
      verified: true,
      order_id: oid,
      payment_id: pid,
      amount: rec.amount || null,
      cause: rec.cause || null,
      cause_label: CAUSES[rec.cause] || null,
      paid_at: rec.updated_at
    });
  });

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

  /* ---------- PolarAI: LLM chat grounded in parameters.js ---------- */
  const aiKey = cfg.anthropicKey, aiModel = cfg.anthropicModel;
  let kb = "";
  try {
    const vm = require("vm"), ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(cfg.staticRoot, "parameters.js"), "utf8"), ctx);
    kb = Object.values(ctx.window.POLAR_PARAMS).map((p) =>
      `- ${p.name} (${p.unit}): ${p.what} Why: ${p.why} India: ${p.india} Measured by: ${p.how}`).join("\n");
  } catch (_) { /* knowledge base optional */ }
  const SYSTEM = "You are PolarAI, the assistant for POLAR CONNECT, an Indian polar science outreach portal (stations: Maitri and Bharati in Antarctica, Himadri in the Arctic; data from NPDC/NCPOR). " +
    "Answer clearly for students and the public in under 200 words. Separate established science from what the site's sample data shows, state uncertainty, and never invent measurements, dates or citations; " +
    "the values on the Polar Live page are sample placeholders until live feeds are connected. If asked something outside polar science, briefly steer back. Knowledge base:\n" + kb;

  app.get("/api/v1/ai/status", (req, res) => res.json({ enabled: Boolean(aiKey), model: aiModel }));
  app.post("/api/v1/ai/chat", express.json({ limit: "32kb" }), async (req, res) => {
    if (!aiKey) return res.status(503).json({ error: "AI not configured" });
    if (limited("ai:" + req.ip)) return res.status(429).json({ error: "Too many requests" });
    const msgs = (Array.isArray(req.body && req.body.messages) ? req.body.messages : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: clean(m.content, 2000) })).filter((m) => m.content).slice(-10);
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return res.status(400).json({ error: "Bad request" });
    try {
      const r = await fetch(cfg.anthropicBase + "/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": aiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: aiModel, max_tokens: 600, system: SYSTEM, messages: msgs })
      });
      const j = await r.json();
      if (!r.ok) return res.status(502).json({ error: "AI service error" });
      const reply = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      res.json({ reply });
    } catch (_) { res.status(502).json({ error: "AI service unreachable" }); }
  });

  /* ---------- static site (the parent folder) — never serve this server folder ---------- */
  app.use((req, res, next) => {
    let p;
    try { p = path.posix.normalize(decodeURIComponent(req.path)).toLowerCase(); }
    catch (_) { return res.status(400).end(); }
    if (p === "/server" || p.startsWith("/server/") || p.includes("node_modules")) return res.status(404).end();
    next();
  });
  app.use(express.static(cfg.staticRoot, { extensions: ["html"], dotfiles: "ignore" }));

  app.use((err, req, res, next) => {            // malformed JSON etc.
    if (res.headersSent) return next(err);
    res.status(err.status && err.status < 500 ? err.status : 500).json({ error: "Bad request" });
  });

  app.locals.orders = orders;
  return app;
}

module.exports = { createApp, CAUSES };

if (require.main === module) {
  loadEnv();
  const port = parseInt(process.env.PORT || "3000", 10);
  const app = createApp();
  app.listen(port, () => {
    const on = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
    console.log(`POLAR CONNECT on http://localhost:${port}`);
    console.log(process.env.ANTHROPIC_API_KEY ? "PolarAI: live LLM enabled" : "PolarAI: no ANTHROPIC_API_KEY → using built-in knowledge-base answers.");
    console.log(on ? `Razorpay: ${process.env.RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "LIVE" : "test"} mode`
                   : "Razorpay keys not set → payments are unavailable until keys are added.");
  });
}
