Lynkora v1.18 — Pending Earnings

1) Run Lynkora-v1.18-Pending-Earnings.sql in Supabase SQL Editor.
2) Upload/overwrite dashboard.html and app.js on GitHub.
3) No changes to config.js, styles.css, go.html, Edge Functions.
4) dashboard.html loads app.js?v=20 to avoid Safari cache.

Expected Dashboard panel:
- Valid chưa thanh toán: number of valid visits owned by the Publisher that have no lynkora_earnings row yet.
- No estimated VND amount is shown.
- After Admin settles a Revenue Cycle, those paid visits leave the pending count and appear in earnings/wallet.
