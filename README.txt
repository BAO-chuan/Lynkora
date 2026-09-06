LYNKORA v1.5 — EDGE VERIFICATION

QUAN TRỌNG: v1.5 có thêm Supabase Edge Functions, không chỉ SQL + GitHub Pages.

A. SUPABASE SQL
1) Chạy Lynkora-v1.5.sql.

B. EDGE FUNCTIONS
Deploy 2 function:
- supabase/functions/lynkora-open/index.ts
- supabase/functions/lynkora-complete/index.ts
Cả hai là public endpoint nên verify_jwt=false, nhưng chúng chỉ gọi DB bằng secret key ở môi trường server.
KHÔNG copy secret/service_role vào GitHub hoặc app.js.

CLI:
supabase login
supabase link --project-ref kchuozpzvletryzfotbq
supabase functions deploy lynkora-open
supabase functions deploy lynkora-complete

C. GITHUB
Ghi đè dashboard.html, admin.html, app.js, styles.css.
Sửa go.html để nạp app.js?v=7.

D. TEST
- Lượt đầu: chờ >=5 giây -> valid.
- Mở lại cùng link trong <60 giây -> rejected.
- Dashboard/Admin vẫn chạy.
