LYNKORA v1.10 — WALLET BALANCE CHUẨN

MỤC TIÊU
- Tách Tổng thu nhập / Đang chờ rút / Đã duyệt / Khả dụng.
- Khả dụng = Tổng thu nhập - Pending - Approved.
- Rejected không làm giảm số dư.
- Không thay đổi earnings đã ghi.
- Không thay đổi payout profile.
- Không cần redeploy Edge Functions.

CÀI ĐẶT
1) Supabase > SQL Editor > New query.
2) Chạy toàn bộ Lynkora-v1.10.sql SAU v1.9.
3) Nếu báo Success, lên GitHub ghi đè 4 file:
   - dashboard.html
   - admin.html
   - app.js
   - styles.css
4) config.js KHÔNG CẦN thay.
5) Trong go.html đổi cache app.js thành:
   <script src="app.js?v=12"></script>
6) Mở:
   dashboard.html?v=12
   admin.html?v=12

KIỂM TRA
- Dashboard:
  Tổng thu nhập = tổng earnings.
  Pending = tổng yêu cầu pending.
  Approved = tổng yêu cầu approved.
  Khả dụng = Tổng thu nhập - Pending - Approved.
- Admin:
  Tổng hệ thống và từng Publisher dùng cùng công thức.
- Khi từ chối một yêu cầu pending, số tiền đó phải trở lại Khả dụng.
- Khi duyệt pending, tiền chuyển từ Pending sang Approved nên Khả dụng không đổi tại thời điểm duyệt.

LƯU Ý
- Đây vẫn là workflow nội bộ/thủ công, không tự động chuyển tiền.
- Không lưu mật khẩu/PIN/OTP.
