# HANDOFF — Mi House Spa V16

## Bắt đầu từ đây

Đọc `AUDIT_REPORT.md` để xem bằng chứng, test và các trạng thái chưa hoàn tất. Dự án được nhận từ `mi-house-spa-v15.rar`, dữ liệu hiện tại được giữ nguyên. **Không chép dữ liệu mẫu từ `pageadmin.rar` hoặc `pages.rar` vào database.**

## Chạy local

```bash
# Nên dùng Node.js 22 và npm sạch, không giữ lại node_modules Windows từ bản RAR cũ
npm install
cp .env.example .env
# Điền ADMIN_USERNAME/ADMIN_PASSWORD và thông số Cloudinary vào .env (KHÔNG commit)
npm run dev
# Website http://localhost:555 ; Admin http://localhost:555/admin
```

**Lưu ý:** Trên máy chạy Linux, xóa `node_modules` cũ trước `npm install`. `npm run build` hiện BLOCKED trong môi trường tạo bản bàn giao vì không tải được các binary Linux, không phải vì đã chứng minh lỗi mã nguồn.

## Bộ test

```bash
npm run check
node scripts/test-api.mjs
node scripts/test-business-v14.mjs
node scripts/test-frontend-cms-mapping.mjs
node scripts/test-regression-fixes.mjs
node scripts/test-critical-v15.mjs
# nếu cài Python playwright + Chromium:
python scripts/test-v16-browser.py
npm run build
```

## Nghiệm thu thực tế còn phải chạy

1. Đăng nhập Admin; ở mỗi module mở form, click input/textarea/ngoài form, nhập chữ, chuyển focus: không có PUT/không đóng; bấm Lưu duy nhất một lần; kiểm tra thông báo, reload và nội dung.
2. Trong Dịch vụ/Đào tạo/Tin tức: View bài gốc, Copy, View bản sao, đối chiếu body, ảnh, metadata, SEO, heading và CSS ở cùng viewport; reload lại.
3. Thêm, sửa, xóa, chọn nhiều, trạng thái ẩn, thứ tự, upload, hủy thay đổi ở tất cả module. Không xóa dữ liệu production để test; dùng staging.
4. `http://localhost:555/album-anh`: so sánh lưới 12 ảnh/trang + trang 2 với `pages.rar`; kiểm tra Nail 8 ảnh mẫu, Không gian 12 ảnh mẫu và ảnh người dùng thêm; thử lightbox.
5. Trong Admin Cloudinary, đăng nhập tài khoản có quyền để tải danh sách image/video theo `/resources/{kind}/upload`, `next_cursor`, upload, thay, xóa file được CMS sở hữu; xác minh file shared không bị xóa nhầm.
6. Gỡ frame map bằng Admin và xác minh frontend biến mất sau API update/reload; thêm lại embed hợp lệ và xác minh xuất hiện.
7. Trong editor, thử Visual/HTML, copy/paste, HTML dài, tab đổi qua lại, màu/font/list/table, Save/Reload; test payload XSS trong staging, kiểm tra console.
8. SEO: thay đổi SEO title/description/focus/robots/schema, Save, reload và xem thực tế `<head>` từng trang, kiểm tra Google có thấy metadata sau render không; không cam kết ranking từ điểm số.
9. SPA: Home → Nail Hottrend → Home → Không gian → Home → reload → Back/Forward. So sánh hiệu ứng slider, listener và layout shift; thử viewport 390, 768, 1440.
10. Build/deploy trên Vercel cần thiết kế API serverless/Node persistent storage hoặc backend riêng. JSON file không nên làm storage production trên Vercel Functions.

## Phạm vi bảo vệ

- `server/data/content.json` và `src/cms/initialContent.json` giữ nguyên, không dùng demo overwrite.
- `.env` chứa bí mật phải giữ tại server/người dùng, không xuất trong ZIP.
- Route và dữ liệu gốc giữ nguyên ngoài các logic vá tại báo cáo.
- Trạng thái được phép: PASS, FAIL, BLOCKED, NOT TESTED. Chỉ đánh PASS E2E khi đã chạy qua trình duyệt + backend thật.


## Bản V17 — Triển khai Vercel

Đọc `VERCEL_DEPLOYMENT.md` và `QA_VERCEL_V17.md` trước khi triển khai. V17 sử dụng Upstash Redis REST cho CMS, sessions, analytics; Vercel Node Function nhận `/api/*`, upload lớn dùng signed Cloudinary direct upload, file seed V16 là `server/seed-content.json` để khởi tạo Redis một lần. Cần cấu hình env và kiểm thử production trên tài khoản người dùng.
