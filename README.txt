LYNKORA v1.13 — REVENUE CONTROL

MỤC TIÊU
- Chặn nghĩa vụ trả Publisher vượt quá ngân sách quảng cáo đã xác nhận.
- Admin nhập doanh thu Adsterra đã quy đổi sang VND.
- Admin chọn tỷ lệ chia Publisher.
- Admin bật/tạm dừng ghi earnings mới.
- Valid visit vẫn hoạt động bình thường khi earnings tạm dừng.
- Không đổi Edge Functions.

CÀI ĐẶT
1. Chạy toàn bộ Lynkora-v1.13.sql trong Supabase SQL Editor.
   Lưu ý: SQL chủ động đặt publisher_earnings_enabled = 0 để an toàn.
2. GitHub ghi đè:
   - admin.html
   - dashboard.html
   - app.js
   - styles.css
   - go.html
3. config.js KHÔNG CẦN thay.
4. Không deploy lại Edge Functions.
5. Cache mới: v15.

SAU KHI CÀI
- Vào Admin > Revenue Control.
- Khi Adsterra chưa có doanh thu xác nhận: để Earnings TẮT.
- Khi có doanh thu: quy đổi số đã xác nhận sang VND, nhập vào ô doanh thu.
- Chọn % chia Publisher (ví dụ 70% chỉ là lựa chọn kinh doanh của bạn, không phải mặc định bắt buộc).
- Chỉ bật Earnings khi bạn muốn bắt đầu ghi thu nhập mới.
- Hệ thống tự dừng ghi earnings nếu ngân sách Publisher đã hết.

CÔNG THỨC
Publisher budget = Confirmed ad revenue VND × Publisher share %
Remaining budget = Publisher budget − tổng earnings đã ghi

LƯU Ý
- Earnings cũ không bị xóa.
- Withdrawal cũ không bị thay đổi.
- v1.13 chưa tự đồng bộ API Adsterra; doanh thu xác nhận được Admin nhập thủ công.
