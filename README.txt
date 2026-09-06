LYNKORA v1.17 — PUBLISHER EARNINGS MODEL

1) Supabase SQL Editor: chạy Lynkora-v1.17.sql sau v1.15.
2) GitHub: ghi đè đúng 3 file: admin.html, dashboard.html, app.js.
3) Không sửa: go.html, styles.css, config.js, Edge Functions.
4) Mở admin.html?v=19 và dashboard.html?v=19 để tránh cache Safari.

Mô hình:
- Valid visit không tự cộng tiền.
- Admin tạo Revenue Cycle theo đúng kỳ.
- Nhập doanh thu quảng cáo đã xác nhận và tỷ lệ Publisher.
- Chỉ chốt sau khi kỳ kết thúc.
- Khi chốt, earnings chỉ phân bổ cho valid visits trong kỳ chưa từng được trả.
- CPM là kết quả phân bổ của từng kỳ, không phải mức cam kết cố định.
- Earnings/withdrawals cũ được giữ nguyên.

Lưu ý: v1.17 không tự đọc Adsterra API. Doanh thu xác nhận vẫn do Admin nhập thủ công.
