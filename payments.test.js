"use strict";
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createApp } = require("../server");

const SECRET = "test_secret", WH = "wh_secret", KEY = "rzp_test_abc";
const hmac = (s, d) => crypto.createHmac("sha256", s).update(d).digest("hex");

function listen(app) {
  return new Promise((r) => { const s = http.createServer(app).listen(0, () => r({ s, url: "http://127.0.0.1:" + s.address().port })); });
}

async function setup() {
  // stand-in for api.razorpay.com so no real network/keys are needed
  let last;
  const rzp = await listen((req, res) => {
    let body = ""; req.on("data", (c) => (body += c));
    req.on("end", () => {
      last = { auth: req.headers.authorization, body: JSON.parse(body) };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ id: "order_TEST123", amount: last.body.amount, currency: "INR" }));
    });
  });
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "polar-"));
  const app = createApp({ keyId: KEY, keySecret: SECRET, webhookSecret: WH, apiBase: rzp.url, dataDir, rateLimit: { windowMs: 60000, max: 100 } });
  const srv = await listen(app);
  return { srv, rzp, dataDir, app, last: () => last };
}
const post = (url, body, headers) => fetch(url, { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, headers), body: typeof body === "string" ? body : JSON.stringify(body) });
const good = { amount: 500, cause: "open-data", name: "Asha Rao", email: "asha@example.com" };

test("payments backend", async (t) => {
  const ctx = await setup();
  const u = ctx.srv.url + "/api/v1/payments";
  t.after(() => { ctx.srv.s.close(); ctx.rzp.s.close(); });

  await t.test("config exposes no secrets", async () => {
    const c = await (await fetch(u + "/config")).json();
    assert.equal(c.enabled, true); assert.equal(c.mode, "test");
    assert.ok(!JSON.stringify(c).includes(SECRET));
  });

  await t.test("rejects bad input", async () => {
    for (const bad of [{ amount: 5 }, { amount: 500.5 }, { amount: "abc" }, { amount: 9999999 }, { amount: 500, cause: "nope" }, { amount: 500, cause: "open-data", name: "A" }, { amount: 500, cause: "open-data", name: "Asha", email: "x" }]) {
      const r = await post(u + "/orders", Object.assign({}, good, bad));
      assert.equal(r.status, 400, JSON.stringify(bad));
    }
  });

  await t.test("creates order in paise using server-side amount and basic auth", async () => {
    const r = await post(u + "/orders", good);
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.order_id, "order_TEST123"); assert.equal(j.amount, 50000); assert.equal(j.key_id, KEY);
    assert.equal(ctx.last().body.amount, 50000);
    assert.equal(ctx.last().auth, "Basic " + Buffer.from(KEY + ":" + SECRET).toString("base64"));
  });

  await t.test("verify accepts a valid signature and returns stored amount", async () => {
    const sig = hmac(SECRET, "order_TEST123|pay_ABC");
    const r = await post(u + "/verify", { razorpay_order_id: "order_TEST123", razorpay_payment_id: "pay_ABC", razorpay_signature: sig });
    const j = await r.json();
    assert.equal(r.status, 200); assert.equal(j.verified, true); assert.equal(j.amount, 500); assert.equal(j.cause_label, "Open polar data");
  });

  await t.test("verify rejects tampered or missing signatures", async () => {
    const r1 = await post(u + "/verify", { razorpay_order_id: "order_TEST123", razorpay_payment_id: "pay_EVIL", razorpay_signature: hmac(SECRET, "order_TEST123|pay_ABC") });
    assert.equal(r1.status, 400);
    const r2 = await post(u + "/verify", { razorpay_order_id: "order_TEST123" });
    assert.equal(r2.status, 400);
    const r3 = await post(u + "/verify", { razorpay_order_id: "o", razorpay_payment_id: "p", razorpay_signature: "short" });
    assert.equal(r3.status, 400);
  });

  await t.test("webhook checks signature and is idempotent", async () => {
    const body = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_X", order_id: "order_OTHER" } } } });
    const bad = await post(ctx.srv.url + "/api/v1/payments/webhook", body, { "x-razorpay-signature": "nope" });
    assert.equal(bad.status, 400);
    const ok = await post(ctx.srv.url + "/api/v1/payments/webhook", body, { "x-razorpay-signature": hmac(WH, body), "x-razorpay-event-id": "evt1" });
    assert.equal(ok.status, 200);
    const dup = await (await post(ctx.srv.url + "/api/v1/payments/webhook", body, { "x-razorpay-signature": hmac(WH, body), "x-razorpay-event-id": "evt1" })).json();
    assert.equal(dup.duplicate, true);
  });

  await t.test("a failed webhook never downgrades an already-paid order", async () => {
    const body = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_Z", order_id: "order_TEST123" } } } });
    await post(ctx.srv.url + "/api/v1/payments/webhook", body, { "x-razorpay-signature": hmac(WH, body) });
    assert.equal(ctx.app.locals.orders.get("order_TEST123").status, "paid");
  });

  await t.test("does not serve the server folder, even encoded", async () => {
    for (const p of ["/server/server.js", "/%73erver/server.js", "/server/.env", "/x/../server/package.json", "/server/data/payments.jsonl"]) {
      const r = await fetch(ctx.srv.url + p);
      assert.notEqual(r.status, 200, p);
    }
    assert.equal((await fetch(ctx.srv.url + "/index.html")).status, 200);
    assert.equal((await fetch(ctx.srv.url + "/support.html")).status, 200);
  });
});
