LYNKORA v1.4 — ANTI-FRAUD CƠ BẢN

1. Chạy Lynkora-v1.4.sql sau v1.3.1.
2. GitHub ghi đè: dashboard.html, admin.html, app.js, styles.css.
3. QUAN TRỌNG: go.html của bản cũ vẫn nạp app.js theo cache cũ. Hãy sửa trong go.html:
   app.js?v=3 (hoặc app.js?v=4/v=5) -> app.js?v=6
   config.js có thể giữ nguyên.
4. Test go.html bằng một link thật, chờ đủ 5 giây.
5. Mở lại cùng link trong vòng 60 giây trên cùng browser: lượt thứ hai sẽ không được tính hợp lệ.

Không thay Auth/tạo link. Không dùng IP/fingerprint xâm lấn.
Đây chưa phải anti-bot production; trước quảng cáo thật nên chuyển open/complete sang Edge Function + rate limit server-side.
