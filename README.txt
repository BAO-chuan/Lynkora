LYNKORA v1.15 — REVENUE CYCLES

1. Chạy Lynkora-v1.15.sql trong Supabase SQL Editor.
2. GitHub ghi đè:
   - admin.html
   - dashboard.html
   - app.js
3. Không thay styles.css, config.js, go.html.
4. Không deploy lại Edge Functions.
5. Cache mới: v17.

v1.15 đổi cách ghi earnings:
- Valid visit vẫn được anti-fraud xác minh như cũ.
- Không cộng earnings ngay khi visit valid.
- Admin tạo chu kỳ theo ngày/tháng, nhập doanh thu quảng cáo xác nhận và % Publisher.
- Sau khi kỳ đã kết thúc, Admin bấm Chốt kỳ.
- Hệ thống lấy đúng valid visits trong kỳ chưa từng được trả, tính CPM và ghi earnings một lần.
- Earnings cũ giữ nguyên.
