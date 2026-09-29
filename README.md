# POLAR CONNECT — Multi-Page Light Blue Edition

Pages:
- index.html — Home
- live.html — Polar Live dashboard
- explorer.html — OpenStreetMap + CesiumJS explorer
- research.html — Research knowledge repository
- media.html — Photos, videos and outreach
- scientists.html — Scientist directory + question workflow
- scientist-chat.html — Student ↔ scientist chat
- ai.html — PolarAI research assistant
- support.html — Contribute / payment page (Razorpay: UPI, cards, netbanking, wallets)

## Important
This is a front-end site (payments have a real backend in `server/`, see below). Scientist chat is simulated locally and do not send real messages. Connect authentication, a messaging backend, moderation, scientist availability, NPDC/NCPOR ingestion and an LLM/RAG service for production.

## Suggested production AI flow
NPDC/NCPOR + approved datasets + publications → ingestion/validation → PostgreSQL/PostGIS + object storage + vector index → RAG API → PolarAI UI.

## Suggested scientist workflow
Student account → scientist search/profile → question or direct chat → moderation/consent → secure message store → scientist response → notification → conversation history.

## Payments (Razorpay)
`support.html` + `payments.js` (browser) and `server/` (Node backend). Without the backend the page runs in **demo mode**
(simulated checkout, no money moves), so you can still open the HTML files directly.

Run it for real (test mode first):
1. `cd server && npm install`
2. `cp .env.example .env` and add your Razorpay **test** keys (Dashboard → Account & Settings → API Keys)
3. `npm start` → open http://localhost:3000/support.html (the server also serves the whole site)
4. Pay with Razorpay's test cards/UPI. `npm test` runs the backend tests (no real keys needed).

How it stays safe: the browser only sends the amount *request*; the server validates it, creates the Razorpay order in paise,
and after payment recomputes the HMAC signature with the secret key before marking anything paid. The secret never reaches
the browser. The webhook (`/api/v1/payments/webhook`) is the source of truth if a user closes the tab mid-payment.
Orders are logged to `server/data/payments.jsonl` (replace with a real database for production).

Before going live: complete Razorpay account activation (KYC) for the entity that will receive funds; publish Terms, Privacy,
Refund/Cancellation and Contact pages (Razorpay typically asks for these); confirm with the organisation whether receipts,
80G or FCRA rules apply to contributions; serve over HTTPS; set the webhook URL and secret in the Razorpay dashboard;
swap test keys for live keys. The three "causes" in `server/server.js` and `support.html` are placeholders. Edit them
to match how funds will really be used.

## Parameter explainers
`parameters.js` holds the "why we measure this" copy for every Polar Live parameter (what it is, why it is measured, why it
matters for India, how it is typically measured). `live.js` renders it. Deep links: `live.html?d=ice&p=glaciervel`.
Have a domain scientist review the wording before publishing.

## PolarAI (ai.html + ai.js)
Works out of the box: it answers from the parameter knowledge base in `parameters.js` (all 28 parameters, stations, domains).
For real LLM answers, add `ANTHROPIC_API_KEY` to `server/.env` and run `npm start`; the page then calls `/api/v1/ai/chat`
(key stays on the server) and falls back to the built-in answers if the call fails. The badge in the chat header shows which mode replied.

## Parameters added
Sea-water temperature, dissolved oxygen (Ocean); ice melt rate, ice formation rate (Ice); air temperature, UV index, air pressure, wind (Atmosphere); nutrient concentration (Biodiversity).
Values on Polar Live are sample placeholders until NPDC/NCPOR feeds are connected.
