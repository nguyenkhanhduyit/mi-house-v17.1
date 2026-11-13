# Mi House Spa V17 — Triển khai React + Vercel Functions + Upstash Redis + Cloudinary

## Kiến trúc đã chuyển

```
Vercel Static (React/Vite /dist)
       |
       +-- /api/* => api/index.js (Vercel Node.js Function)
                           |
                           +-- Upstash Redis REST: dữ liệu CMS, phiên đăng nhập, chống brute-force, thống kê
                           |
                           +-- Cloudinary Admin API: danh sách / xác minh / xóa file

Trình duyệt Admin --(ký upload từ /api/admin/media-sign)-->
Cloudinary direct upload --(xác minh qua /api/admin/media-register)--> Upstash Redis
```

Không cần máy chủ Node.js riêng hay ổ đĩa ghi tại Vercel. `server/index.mjs` được dùng chung cho local API và Vercel Function. Không đổi cấu trúc CMS/website đang có.

## Các bước triển khai Vercel

1. Giải nén ZIP V17 và đẩy toàn bộ **source** lên GitHub/GitLab/Bitbucket (không đẩy `node_modules/`, `.env`, `.env.local`). Import repository vào Vercel và chọn thư mục gốc dự án. Framework Preset: **Vite**; Build Command: `npm run build`; Output Directory: `dist`; Install Command: `npm ci` (mặc định). Nếu dự án hiện có đã kết nối Vercel, cập nhật source trong repository đó.
2. Vercel Dashboard → Storage/Marketplace → tạo hoặc liên kết **Upstash Redis**. Chọn vùng gần Function; lấy `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`. Vercel KV đời cũ không bắt buộc.
3. Vercel Dashboard → Project → Settings → Environment Variables. Khai báo các biến server-side (không có tiền tố `VITE_`):

   | Biến | Giá trị |
   | --- | --- |
   | `UPSTASH_REDIS_REST_URL` | HTTPS URL của Upstash Redis |
   | `UPSTASH_REDIS_REST_TOKEN` | REST token của Upstash Redis |
   | `ADMIN_USERNAME` | Tên đăng nhập quản trị |
   | `ADMIN_PASSWORD` | Mật khẩu dài, ngẫu nhiên; **không sử dụng giá trị mẫu** |
   | `CLOUDINARY_CLOUD_NAME` | Cloud name |
   | `CLOUDINARY_API_KEY` | API key |
   | `CLOUDINARY_API_SECRET` | API secret |
   | `CMS_REDIS_PREFIX` | Prefix chung, mặc định `mi-house` (không cần đặt nếu dùng mặc định) |

   Có thể thay 3 biến Cloudinary bằng **`CLOUDINARY_URL`** dạng `cloudinary://KEY:SECRET@CLOUD_NAME` (chỉ server đọc), nhưng nên dùng 3 biến rõ ràng. Trong Cloudinary, tài nguyên được quản lý trong prefix `mi-house/`.
4. Thiết lập biến môi trường cho **Production**, và nếu dùng Preview thì đặt credentials phù hợp. Backend tự gắn hậu tố theo `VERCEL_ENV` (`production`, `preview`, `development`/`local`), nên Preview không đè lên Production nếu dùng cùng Redis.
5. Bấm **Deploy/Redeploy** sau khi khai báo biến. URL kiểm tra: `https://<domain>/api/health` phải trả `ok: true`, `redisReady: true`, `cloudinaryReady: true`, `adminConfigured: true`. Đăng nhập `/admin` và thử chỉnh sửa một mục nhỏ, lưu, tải lại. Kiểm tra phiên đăng nhập trong nhiều lần tải lại và nhiều lần truy cập Function.
6. Upload thử một ảnh và một video lên Cloudinary qua Admin; xác minh item được đăng ký trong CMS, có thể copy URL, làm mới, gắn vào nội dung, lưu và tải lại. Kiểm tra xóa chỉ khi file không được dùng ở nơi khác.

## Khởi tạo nội dung thực tế (không reset database)

`server/seed-content.json` là ảnh chụp dữ liệu CMS V16 đã được giữ nguyên byte từ `server/data/content.json`. Khi Redis chưa có khóa CMS, API **chỉ một lần** khởi tạo từ file seed bằng thao tác nguyên tử `SET` có điều kiện trong Lua. Những lần deploy tiếp theo không ghi đè Redis; xóa một nội dung trong Admin cũng không tự tạo lại dữ liệu đã xóa.

**Lưu ý:** Nếu nội dung tại website thực tế đã có thay đổi mới hơn file V16, cần thay `server/seed-content.json` bằng bản xuất dữ liệu mới trước lần triển khai đầu tiên. Đừng xóa Redis đang có dữ liệu để thử nghiệm. Nên sao lưu Redis trước bất cứ thao tác migration/restore thủ công nào.

## Giới hạn và bảo mật

- Vercel Functions có giới hạn 4.5 MB cho request body. V17 cho phép trình duyệt upload file trực tiếp lên Cloudinary bằng signature cấp qua API bảo vệ. Mọi tài nguyên được `media-register` xác minh lần nữa qua Cloudinary Admin API trước khi ghi CMS. Giới hạn form V17 là 100 MB/file; giới hạn thực tế có thể thấp hơn tùy Cloudinary plan.
- CMS state sử dụng Redis REST + Lua CAS theo phiên bản để từ chối ghi đè từ hai request đồng thời (HTTP 409). Session token được lưu ở Redis với TTL 8 giờ, HttpOnly, SameSite Strict; chức năng logout xóa token trên Redis.
- Thông tin đăng nhập, Cloudinary Secret, Redis Token không được đặt trong `VITE_*` hoặc mã React. `.env.example` chỉ là mẫu tên biến.
- Redis namespace mặc định sẽ có hậu tố môi trường. `api/health` không tiết lộ giá trị bí mật.
- Phần analytics hiện được duy trì trên Redis (nếu bật). Với IP, backend dùng mã SHA-256 để không ghi IP thô vào Redis.
- Source có sẵn fallback local JSON cho `npm run dev` *khi không chạy trên Vercel*. Khi Vercel thiếu Redis, API trả 503, không tự ghi file tạm và cũng không giả vờ lưu thành công.
- Không xác nhận production cho đến khi deployment thực tế qua được login, CRUD, upload và dữ liệu còn sau redeploy.

## Local development

```bash
npm ci
cp .env.example .env
# Thay các giá trị mẫu bằng credentials thực; có thể bỏ Redis để dùng local JSON.
npm run dev
# website http://localhost:555 ; local API http://localhost:5551
```

Để thử Vercel Functions trên máy local mà không cần Vercel CLI, chạy `npm run test:serverless` (mock Redis/Cloudinary; không phải kiểm thử service thật). Để deploy và kiểm tra routing Vercel thật, có thể dùng `vercel dev` và `vercel deploy` sau khi liên kết project.

## Xử lý lỗi thường gặp

| Lỗi | Hướng xử lý |
| --- | --- |
| `/api/health` 503 “Chưa cấu hình…” | Cấu hình đủ URL/token Upstash cho môi trường hiện tại và Redeploy. |
| `/api/*` trả HTML/404 | Kiểm tra `vercel.json` và đường dẫn `api/index.js`; đừng thay thứ tự rewrite, xem Functions logs. |
| 401 khi dùng Admin | Kiểm tra `ADMIN_USERNAME`, `ADMIN_PASSWORD` và cookie trong trình duyệt. |
| 409 khi lưu | Một phiên khác đã lưu dữ liệu mới; tải lại bản mới trước khi lưu. |
| Cloudinary 412 | Kiểm tra Cloud name/key/secret; không đưa API Secret lên frontend. |
| Cloudinary upload xong nhưng không đăng ký | Kiểm tra Redis và Cloudinary Admin permissions; có thể thử đăng ký lại mà không upload thêm, file đã upload nằm trong `mi-house/`. |
| Build thiếu native Rollup | Không upload `node_modules` từ máy Windows; để Vercel chạy `npm ci` sạch trên Linux. |
| Dữ liệu CMS không giống nội dung hiện tại | Kiểm tra seed trước **lần deploy đầu tiên** và prefix Redis của môi trường; không xóa Redis đã có dữ liệu. |

## Tham khảo tài liệu kỹ thuật

- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/marketplace-storage
- https://upstash.com/docs/redis/features/restapi
- https://cloudinary.com/documentation/upload_images#signed_uploads
