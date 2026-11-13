# Báo cáo kỹ thuật V17 — 2026-11-13

## Mục tiêu
Chuyển V16 sang **Vercel Static React/Vite + Node.js Functions + Upstash Redis REST + Cloudinary** mà không thay đổi dữ liệu CMS hiện tại hoặc yêu cầu máy chủ Node/ổ đĩa ghi production.

## Kết quả sửa

| Thành phần | Thay đổi | Xác minh |
| --- | --- | --- |
| API | `api/index.js` tiếp nhận `/api/*`, dùng `server/index.mjs` chung | Test HTTP giả lập có rewrite: PASS; Vercel CDN thực: NOT TESTED |
| Routing | `vercel.json` ưu tiên API rồi fallback SPA | Static config kiểm tra: PASS; deploy thật: NOT TESTED |
| CMS Database | `server/redis.mjs`: Redis REST, Lua load/initialize/CAS | 20 bài contract mock: PASS; Upstash thật: NOT TESTED |
| Dữ liệu gốc | Seed `server/seed-content.json` trùng 100% byte với `server/data/content.json` V16 | SHA-256: PASS |
| Session | Lưu token hash Redis, TTL 8h; login throttle; logout | HTTP mock: PASS; production: NOT TESTED |
| Cloudinary | Upload ký server → browser gửi Cloudinary trực tiếp → backend verify/register | Contract mock: PASS; Cloudinary thật: NOT TESTED |
| Cloudinary list | Admin API server-side, image/video; pagination cursor | `scripts/test-api.mjs`: PASS; API thật: NOT TESTED |
| CMS concurrency | Lua CAS từ chối cập nhật state lỗi thời | 409 test: PASS |
| Analytics | Redis key TTL và HINCRBY; local JSON khi dev | Kiểm thử local backend: PASS; external Redis analytics: PARTIALLY TESTED |
| React frontend | Chỉ sửa upload flow, giữ các module còn lại | Các bộ static/regression: PASS; build sạch: BLOCKED |

## Kiểm thử đã chạy

- `node scripts/test-api.mjs`: **37/37 PASS** trên backend local và mock Cloudinary.
- `node scripts/test-vercel-serverless.mjs`: **20/20 PASS** cho giao tiếp Vercel handler/Upstash giả lập/Cloudinary xác minh.
- `node scripts/verify.mjs`: PASS.
- `node scripts/test-business-v14.mjs`: PASS.
- `node scripts/test-frontend-cms-mapping.mjs`: PASS.
- `node scripts/test-regression-fixes.mjs`: PASS.
- `node scripts/test-critical-v15.mjs`: PASS.
- `node --check server/index.mjs`, `server/redis.mjs`, `api/index.js`: PASS.

## Hạn chế và trạng thái chính xác

- **BUILD BLOCKED:** Máy kiểm thử không tải được dependencies từ npm registry và `node_modules` V16 có Rollup native Windows. `vite build` hiện chưa xác minh trên Linux/Vercel. File ZIP bàn giao **không** chứa `node_modules`; phải để Vercel cài sạch.
- **LIVE DATABASE BLOCKED:** Chưa có thông tin kết nối Upstash Redis thật. Các kiểm tra Redis là mô phỏng REST/Lua có kiểm soát, không thể khẳng định dịch vụ thật PASS.
- **LIVE CLOUDINARY BLOCKED:** Chưa có Cloud name, API key/secret thật. Các API giả lập không thay thế kiểm thử upload ảnh/video thật.
- **VERCEL DEPLOYMENT BLOCKED:** Chưa có kết nối/quyền triển khai vào dự án Vercel của người dùng. Routing/rewrite/CDN/Function bundle chưa được đo trên deployment thật.
- **FRONTEND E2E NOT TESTED:** Chưa kiểm tra toàn bộ giao diện Admin qua trình duyệt sau deploy.

## Độ an toàn dữ liệu

- Không xóa/reset database production.
- Không sửa `server/data/content.json` hoặc `src/cms/initialContent.json`.
- File seed đi kèm bản bàn giao chứa dữ liệu CMS V16 và không có thông tin Redis/Cloudinary secret.
- Thao tác cập nhật CMS trong Redis dùng CAS nhằm tránh mất cập nhật đồng thời; dữ liệu chỉ được khởi tạo khi Redis chưa có CMS.
- Không công bố 100% production-ready khi các kết nối thật chưa được nghiệm thu.

## Những việc phải hoàn thành trên tài khoản của người dùng

Liên kết Vercel project → cài Upstash Redis qua Marketplace → nhập env Cloudinary và Admin → deploy → kiểm tra `/api/health` → login/CRUD/reload → upload ảnh/video → redeploy và xác minh dữ liệu vẫn còn. Xem `VERCEL_DEPLOYMENT.md`.
