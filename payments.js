/* POLAR CONNECT — support / payment page logic.

   Live mode  : browser → POST /api/v1/payments/orders → Razorpay Checkout → POST /api/v1/payments/verify
   Demo mode  : used automatically when the backend (server/) is not reachable or has no keys.
                A simulated checkout lets you test success and failure paths; no money moves.

   Amounts are whole rupees here; the server converts to paise and re-validates everything. */
(function () {
  "use strict";

  var API = (window.POLAR_PAY_API || "") + "/api/v1/payments";
  var inr = new Intl.NumberFormat("en-IN");
  var CAUSES = { "open-data": "Open polar data", "student-outreach": "Student outreach", "field-instruments": "Field & instruments" };

  var state = { amount: 500, cause: "open-data", min: 50, max: 100000, mode: "demo", busy: false, config: null };

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    chips: $("amountChips"), custom: $("amountCustom"), hint: $("amountHint"),
    name: $("donorName"), email: $("donorEmail"), phone: $("donorPhone"),
    err: $("payError"), btn: $("payBtn"), btnLabel: $("payBtnLabel"),
    form: $("payForm"), ok: $("paySuccess"), banner: $("modeBanner"), causes: $("causeList"),
    modal: $("demoModal"), demoAmount: $("demoAmount")
  };
  if (!el.btn) return;

  function rupee(n) { return "₹" + inr.format(n); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(m) { if (window.showToast) window.showToast(m); }

  /* ---------- amount ---------- */
  function setAmount(n, fromChip) {
    state.amount = n;
    Array.prototype.forEach.call(el.chips.querySelectorAll(".chip"), function (c) {
      c.setAttribute("aria-checked", String(fromChip && Number(c.dataset.amt) === n));
    });
    if (fromChip) el.custom.value = "";
    el.btnLabel.textContent = n >= state.min ? "Contribute " + rupee(n) : "Contribute";
    el.hint.textContent = "Minimum " + rupee(state.min) + ", maximum " + rupee(state.max) + " per payment.";
    el.hint.classList.toggle("bad", !!n && (n < state.min || n > state.max));
  }
  el.chips.addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    setAmount(Number(b.dataset.amt), true); clearError();
  });
  el.custom.addEventListener("input", function () {
    var digits = el.custom.value.replace(/\D/g, "").slice(0, 7);
    el.custom.value = digits ? inr.format(Number(digits)) : "";
    setAmount(Number(digits) || 0, false); clearError();
  });

  /* ---------- cause ---------- */
  el.causes.addEventListener("click", function (e) {
    var b = e.target.closest(".cause"); if (!b) return;
    state.cause = b.dataset.cause;
    Array.prototype.forEach.call(el.causes.querySelectorAll(".cause"), function (c) {
      c.setAttribute("aria-checked", String(c === b));
    });
  });

  /* ---------- errors / busy ---------- */
  function showError(msg) { el.err.textContent = msg; el.err.hidden = false; }
  function clearError() { el.err.hidden = true; el.err.textContent = ""; }
  function setBusy(b) {
    state.busy = b; el.btn.disabled = b; el.btn.classList.toggle("busy", b);
    if (b) el.btnLabel.textContent = "Processing…"; else setAmount(state.amount, isChipAmount());
  }
  function isChipAmount() { return !el.custom.value; }

  function validate() {
    var name = el.name.value.trim(), email = el.email.value.trim();
    if (!state.amount || state.amount < state.min || state.amount > state.max)
      return "Enter an amount between " + rupee(state.min) + " and " + rupee(state.max) + ".";
    if (name.length < 2) { el.name.focus(); return "Please enter your name."; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { el.email.focus(); return "Please enter a valid email address."; }
    return null;
  }
  function payload() {
    return { amount: state.amount, cause: state.cause, name: el.name.value.trim(), email: el.email.value.trim(), phone: el.phone.value.trim() };
  }

  /* ---------- backend helpers ---------- */
  function api(path, body) {
    return fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Request failed"); return j; }); });
  }
  function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = res; s.onerror = function () { rej(new Error("Could not load the secure checkout. Check your connection and try again.")); };
      document.head.appendChild(s);
    });
  }

  /* ---------- pay ---------- */
  el.btn.addEventListener("click", function () {
    if (state.busy) return;
    clearError();
    var v = validate(); if (v) return showError(v);
    setBusy(true);
    if (state.mode === "demo") {
      if (location.protocol === "file:" || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return openDemo();
      setBusy(false); return showError("Payments are temporarily unavailable. Please try again shortly.");
    }
    startLive();
  });

  function startLive() {
    var data = payload();
    Promise.all([api("/orders", data), loadRazorpay()]).then(function (r) {
      var order = r[0];
      var rzp = new window.Razorpay({
        key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency,
        name: "POLAR CONNECT", description: CAUSES[data.cause],
        prefill: { name: data.name, email: data.email, contact: data.phone },
        notes: { cause: data.cause },
        theme: { color: "#2196c9" },
        modal: { ondismiss: function () { setBusy(false); toast("Payment cancelled. You have not been charged."); } },
        handler: function (resp) {
          api("/verify", {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature
          }).then(function (v) {
            showSuccess({ amount: v.amount || data.amount, cause: v.cause_label || CAUSES[data.cause], id: v.payment_id, at: v.paid_at, email: data.email, demo: false });
          }).catch(function () {
            setBusy(false);
            showError("We couldn't confirm this payment yet, so it has not been recorded. Please don't pay again. If money was debited from your account, keep this payment ID and contact us: " + resp.razorpay_payment_id);
          });
        }
      });
      rzp.on("payment.failed", function (e) {
        setBusy(false);
        showError((e && e.error && e.error.description) || "The payment failed. You have not been charged. Please try again.");
      });
      rzp.open();
    }).catch(function (err) { setBusy(false); showError(err.message || "Something went wrong. Please try again."); });
  }

  /* ---------- demo checkout ---------- */
  var lastFocus = null;
  function openDemo() {
    lastFocus = document.activeElement;
    el.demoAmount.textContent = rupee(state.amount) + " · " + CAUSES[state.cause];
    el.modal.hidden = false; requestAnimationFrame(function () { el.modal.classList.add("show"); });
    $("demoOk").focus();
  }
  function closeDemo() {
    el.modal.classList.remove("show"); el.modal.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("demoOk").addEventListener("click", function () {
    var id = "pay_" + Math.random().toString(36).slice(2, 10).toUpperCase();
    closeDemo();
    showSuccess({ amount: state.amount, cause: CAUSES[state.cause], id: id, at: new Date().toISOString(), email: el.email.value.trim(), demo: true });
  });
  $("demoFail").addEventListener("click", function () {
    closeDemo(); setBusy(false);
    showError("The bank declined this payment. You have not been charged.");
  });
  $("demoCancel").addEventListener("click", function () { closeDemo(); setBusy(false); toast("Payment cancelled."); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el.modal.hidden) { closeDemo(); setBusy(false); } });
  el.modal.addEventListener("click", function (e) { if (e.target === el.modal) { closeDemo(); setBusy(false); } });

  /* ---------- success / receipt ---------- */
  function showSuccess(r) {
    var when = r.at ? new Date(r.at) : new Date();
    var date = when.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    el.ok.innerHTML =
      '<div class="success-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12.5 9.5 17 19 7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<h2>Thank you' + (r.demo ? "" : "!") + '</h2>' +
      (r.demo ? '' : "") +
      '<p class="section-intro">Your contribution of <b>' + esc(rupee(r.amount)) + '</b> will support <b>' + esc(r.cause) + '</b>.' +
      (r.email && !r.demo ? " A receipt is on its way to " + esc(r.email) + "." : "") + '</p>' +
      '<dl class="receipt"><div><dt>Amount</dt><dd>' + esc(rupee(r.amount)) + '</dd></div>' +
      '<div><dt>Cause</dt><dd>' + esc(r.cause) + '</dd></div>' +
      '<div><dt>Date</dt><dd>' + esc(date) + '</dd></div>' +
      '<div><dt>Payment ID</dt><dd class="mono">' + esc(r.id || "—") + '</dd></div></dl>' +
      '<div class="buttons"><button type="button" class="btn" id="copyId">Copy payment ID</button><button type="button" class="btn secondary" id="again">Contribute again</button></div>' +
      '<p class="small" style="margin-top:14px">See what this helps measure: <a href="live.html" style="color:var(--glacier-deep);text-decoration:underline">Polar Live</a></p>';
    el.form.hidden = true; el.ok.hidden = false; el.ok.focus();
    $("copyId").addEventListener("click", function () {
      if (navigator.clipboard) navigator.clipboard.writeText(r.id || "").then(function () { toast("Payment ID copied."); });
    });
    $("again").addEventListener("click", function () {
      el.ok.hidden = true; el.form.hidden = false; setBusy(false); clearError(); el.btn.focus();
    });
  }

  /* ---------- boot: detect live vs demo ---------- */
  function applyConfig(c) {
    if (c) { state.min = c.min || state.min; state.max = c.max || state.max; }
    var live = !!(c && c.enabled);
    state.mode = live ? "live" : "demo";
    el.banner.hidden = false;
    el.banner.className = "mode-banner " + (live ? (c.mode === "live" ? "live" : "test") : "demo");
    el.banner.textContent = live
      ? (c.mode === "live" ? "Live payments are on." : "Test mode: use Razorpay test cards/UPI. No real money moves.")
      : "";
    if (!live) el.banner.hidden = true;
    setAmount(state.amount, true);
  }
  setAmount(state.amount, true);
  var ctl = ("AbortController" in window) ? new AbortController() : null;
  var t = setTimeout(function () { if (ctl) ctl.abort(); }, 2500);
  fetch(API + "/config", ctl ? { signal: ctl.signal } : undefined)
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (c) { clearTimeout(t); applyConfig(c); })
    .catch(function () { clearTimeout(t); applyConfig(null); });
})();
