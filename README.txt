LYNKORA v1.11 — LINK ANALYTICS

TÍNH NĂNG
- Thống kê riêng từng link:
  + lượt mở
  + lượt hợp lệ
  + lượt không hợp lệ
  + tỷ lệ hợp lệ
  + doanh thu đã ghi
- Chọn từng link để xem biểu đồ 7 ngày.
- Biểu đồ chi tiết hiển thị lượt mở / hợp lệ và tổng doanh thu 7 ngày.
- Không đổi Edge Functions.
- Không đổi wallet, payout profile hay withdrawal logic.

CÀI ĐẶT
1. Supabase > SQL Editor > New query.
2. Chạy toàn bộ Lynkora-v1.11.sql SAU v1.10.
3. GitHub ghi đè 4 file:
   - dashboard.html
   - admin.html
   - app.js
   - styles.css
4. config.js KHÔNG CẦN thay.
5. go.html đổi cache:
   <script src="app.js?v=13"></script>
6. Mở thử:
   dashboard.html?v=13
   admin.html?v=13

KIỂM TRA
- Dashboard có panel "Hiệu suất từng link".
- Mỗi link hiện Opens / Valid / Invalid / Valid rate / Revenue.
- Chọn link khác trong ô chọn hoặc bấm "7 ngày" để đổi biểu đồ.
- Nút Làm mới cập nhật cả analytics.
