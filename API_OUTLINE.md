# Production API outline

GET /api/v1/observations?domain=ocean&parameter=ph&region=arctic
GET /api/v1/observations?domain=ice&parameter=thickness&feature_id=...
GET /api/v1/stations
GET /api/v1/research
GET /api/v1/media
GET /api/v1/expeditions
GET /api/v1/glaciers/{id}/change
GET /api/v1/species/distribution
POST /api/v1/questions
GET /api/v1/scientists
POST /api/v1/ai/query

GET  /api/v1/payments/config
POST /api/v1/payments/orders    (server-validated amount, creates Razorpay order)
POST /api/v1/payments/verify    (HMAC signature check)
POST /api/v1/payments/webhook   (Razorpay events, signature-checked)

Every scientific response should carry:
{
  "source": "...",
  "dataset_id": "...",
  "observed_at": "...",
  "updated_at": "...",
  "unit": "...",
  "quality_flag": "...",
  "provenance": "..."
}
