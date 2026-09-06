LYNKORA v1.14 — DYNAMIC PUBLISHER CPM

Cài đặt:
1) Chạy toàn bộ Lynkora-v1.14.sql trong Supabase SQL Editor.
2) GitHub ghi đè đúng 3 file:
   - admin.html
   - dashboard.html
   - app.js
3) Không cần thay styles.css, config.js, go.html.
4) Không deploy lại Edge Functions.
5) Cache mới: v16.

Cách hoạt động:
Dynamic CPM = (doanh thu quảng cáo xác nhận × % chia Publisher)
              / tổng valid visits × 1000

Khi Admin bấm "Lưu Revenue Control", CPM được tính lại tự động.
Revenue Control v1.13 vẫn chặn earnings nếu ngân sách Publisher đã hết.
Earnings đã ghi trước đây không bị tính lại.

Hiện Adsterra Revenue đang 0:
- Confirmed revenue: 0 VND
- Earnings: để TẮT
- Dynamic CPM sẽ là 0 VND
