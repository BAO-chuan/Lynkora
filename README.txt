LYNKORA v1.7 — INTERNAL WALLET & EARNINGS

MỚI
- Sổ cái doanh thu lynkora_earnings.
- Mỗi lượt chuyển sang hợp lệ tạo 1 dòng doanh thu theo CPM tại thời điểm đó.
- Đổi CPM sau này không tính lại các dòng doanh thu cũ.
- Dashboard: số dư nội bộ + lịch sử 50 phát sinh gần nhất.
- Admin: tổng số dư Publisher + số dư từng tài khoản.
- Backfill các lượt hợp lệ cũ khi chạy SQL v1.7.
- Không có rút tiền thật / payout.

CẬP NHẬT
1) Supabase SQL Editor: chạy Lynkora-v1.7.sql.
2) GitHub ghi đè:
   - dashboard.html
   - admin.html
   - app.js
   - styles.css
3) config.js không đổi.
4) Không cần deploy lại lynkora-open / lynkora-complete.
5) Để đồng bộ cache, go.html có thể đổi app.js?v=7 hoặc ?v=8 thành app.js?v=9.
6) Test dashboard.html?v=9 và admin.html?v=9.

LƯU Ý
- Số dư v1.7 là số dư nội bộ.
- Các lượt hợp lệ tồn tại trước v1.7 được backfill theo CPM hiện tại tại thời điểm chạy SQL.
- Nếu xóa link sau này, lịch sử doanh thu đã ghi vẫn được giữ.
