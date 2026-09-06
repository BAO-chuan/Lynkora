LYNKORA v1.9 — PAYOUT PROFILE + WITHDRAWAL CONFIG

MỚI
- Admin đặt mức rút tối thiểu (mặc định 50.000 VND).
- Publisher lưu phương thức nhận tiền: Ngân hàng / MoMo / ZaloPay / Khác.
- Lưu tên người nhận, số tài khoản/SĐT/ID và nhà cung cấp/ngân hàng.
- Khi tạo yêu cầu rút, thông tin nhận tiền được snapshot vào yêu cầu.
- Đổi payout profile sau này không làm thay đổi yêu cầu cũ.
- Không nhập/lưu mật khẩu, PIN hoặc OTP.
- Không tự động chuyển tiền.

CẬP NHẬT
1) Chạy Lynkora-v1.9.sql sau v1.8.
2) GitHub ghi đè dashboard.html, admin.html, app.js, styles.css.
3) config.js không đổi.
4) Không deploy lại Edge Functions.
5) go.html đổi app.js cache thành ?v=11 để đồng bộ.
6) Test dashboard.html?v=11 và admin.html?v=11.

LƯU Ý
- Bản app.js này được xây từ hotfix v1.8 đang dùng, không phải app.js v1.8 lỗi ban đầu.
