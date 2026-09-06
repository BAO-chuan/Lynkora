LYNKORA v1.8 — WITHDRAWAL REQUESTS

- Publisher tạo yêu cầu rút từ số dư khả dụng.
- Pending và approved được trừ khỏi số dư khả dụng để chống yêu cầu vượt số dư.
- Admin duyệt hoặc từ chối thủ công, có ghi chú.
- Có lịch sử yêu cầu cho Publisher và danh sách quản trị cho Admin.
- KHÔNG tự động chuyển tiền/ngân hàng trong v1.8.
- Không cần deploy lại Edge Functions.

Cập nhật:
1. Chạy Lynkora-v1.8.sql sau v1.7.
2. GitHub ghi đè dashboard.html, admin.html, app.js, styles.css.
3. config.js không đổi.
4. go.html đổi app.js cache thành ?v=10 để đồng bộ.
5. Test dashboard.html?v=10 và admin.html?v=10.
