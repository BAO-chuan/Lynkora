LYNKORA v1.6 — ANTI-FRAUD ADMIN LOGS

Mới:
- Admin xem tối đa 100 lượt bị từ chối gần nhất.
- Hiện thời gian, mã link, chủ sở hữu, lý do, client key.
- Thống kê nhanh rapid_repeat / too_fast / expired / khác.
- Tỷ lệ bị từ chối trên tổng lượt mở.
- Mobile hiển thị dạng card.

Cập nhật:
1) Supabase SQL Editor: chạy Lynkora-v1.6.sql sau v1.5.
2) GitHub ghi đè: admin.html, app.js, styles.css.
3) dashboard.html chỉ tăng version/cache; có thể ghi đè để đồng bộ.
4) go.html KHÔNG cần đổi: vẫn app.js?v=7 được nếu bạn chỉ quan tâm go flow,
   nhưng để đồng bộ cache toàn site nên đổi go.html -> app.js?v=8.
5) Không cần deploy lại 2 Edge Functions.
6) Test admin.html?v=8.

v1.6 chỉ thêm quan sát/log Admin, không thay cơ chế anti-fraud v1.5.
