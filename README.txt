LYNKORA v1.12 — ADSTERRA SMARTLINK

MỤC TIÊU
- Tích hợp Smartlink Adsterra vào go.html theo cách tối thiểu, dễ hoàn tác.
- Quảng cáo mở ở tab mới.
- Nút "Tiếp tục đến liên kết" và anti-fraud hiện tại giữ nguyên.
- Không tự động chuyển người dùng sang quảng cáo.
- Không ép người dùng phải mở quảng cáo.
- Không cộng tiền Lynkora chỉ vì người dùng mở quảng cáo.
- Không đổi SQL.
- Không đổi Edge Functions.
- Không đổi app.js, dashboard.html, admin.html hay config.js.

SMARTLINK ĐANG DÙNG
https://www.profitableratecpmnetwork.com/kg2wk57xit?key=1f9fd32078ba3a0ec46a5552571670b9

CÀI ĐẶT
1) GitHub: ghi đè go.html và styles.css.
2) Không chạy SQL.
3) Không deploy lại Edge Functions.
4) Không thay app.js/config.js.
5) Mở thử một short link Lynkora.
6) Kiểm tra:
   - Có thẻ "QUẢNG CÁO ĐỐI TÁC".
   - "Mở quảng cáo" mở tab mới.
   - Sau 5 giây, nút "Tiếp tục đến liên kết" vẫn hoạt động bình thường.
   - Link đích không bị thay bằng Smartlink.

CACHE
- styles.css trên go.html: v14
- app.js/config.js vẫn dùng v13 vì không sửa.

LƯU Ý
- Doanh thu hiển thị trong Adsterra mới là số liệu của Adsterra.
- Wallet/CPM nội bộ Lynkora hiện vẫn độc lập với doanh thu Adsterra.
