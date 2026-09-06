# Lynkora v1.0

Bản đầu chạy trên GitHub Pages + Supabase.

## Cài đặt
1. Tạo một Supabase project RIÊNG cho Lynkora.
2. SQL Editor: chạy `Lynkora-v1.0.sql`.
3. Sửa `config.js`: điền Project URL và publishable key.
4. Upload toàn bộ file web lên một GitHub repository mới.
5. Bật GitHub Pages từ branch `main`.

## Có trong v1.0
- Trang chủ responsive.
- Đăng ký/đăng nhập email + password.
- Dashboard.
- Tạo link ngắn.
- Trang trung gian countdown 5 giây.
- Ghi nhận lượt mở và lượt hoàn tất ở backend.
- RLS + RPC.

## Chưa có trong v1.0
- Không có payout/rút tiền thật.
- Chưa có tích hợp mạng quảng cáo.
- Chưa có chống bot nâng cao / IP fingerprint / geo.
- Chưa có admin panel.
- Chưa có kiểm tra URL qua dịch vụ reputation bên ngoài.

Lưu ý: `service_role` tuyệt đối không đặt trong frontend.
