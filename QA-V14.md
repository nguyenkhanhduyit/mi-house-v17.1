# QA — Mi House Spa CMS V14 (11/11/2026)

## Đã kiểm tra

| Phạm vi | Kết quả |
|---|---|
| Route gốc React | 27/27 có component |
| JSX import React | 39/39 |
| Phân tích cú pháp JS/JSX/MJS/CJS (TypeScript transpile) | 59/59, không lỗi cú pháp |
| API/CMS/Cloudinary mock | 21/21 |
| Logic nhóm nghiệp vụ CMS | 21/21 (`node scripts/test-business-v14.mjs`) |
| Ánh xạ nội dung CMS → frontend (DOM mock) | 13/13 (`node scripts/test-frontend-cms-mapping.mjs`) |
| Biên dịch 25 file frontend trong phạm vi (esbuild) | 25/25 (`node scripts/check-frontend-build.mjs`) |
| React 19 Server Render | 27 trang + trang mới Dịch vụ/Album |
| Trang chủ theo CMS: số dịch vụ 3→1; Nail 8→2; Không gian 12→0; Bảng giá 12→1 | Kết quả SSR khớp với dữ liệu |
| Nút Xem thêm Giới thiệu → `/gioi-thieu` | Có trong React SSR |
| Đổi image bảng giá | `full` (lightbox) được cập nhật cùng `image` |
| Không nhân đôi dịch vụ ở trang chủ | React làm chủ danh sách; bỏ logic append DOM cũ |
| Album Nail/Không gian | Giữ class Splide AutoScroll và bố cục template gốc |
| Media cũ chưa import | 159 file, khoảng 70.37 MiB; dry run xác nhận |
| Dữ liệu mẫu Legend Car Studio | Không nằm trong dữ liệu CMS gốc |
| Dashboard thống kê/SEO | Không có tab/menu quản trị; template dashboard bị loại |
| `npm run build` (Vite 7.3.8) | Thành công, 84 module, `dist/` sinh ra |

## Ánh xạ nghiệp vụ → frontend (đã đối chiếu)

| Nhóm | Trang | Nguồn dữ liệu | Trạng thái |
|---|---|---|---|
| Giới thiệu | `/gioi-thieu` | `sections.intro`: `title`, `description`, `body`, `image`, `alt`, `seoTitle`, `seoKeywords`, `seoDescription`, `focusKeyword`, `schemaJson` | Đã đúng + đã sửa (JSON-LD, focus keyword) |
| Giới thiệu (trang chủ) | `/` | `sections.intro.homeTitle`, `homeSubtitle`, `homeBody`, `homeImage` | Đã đúng |
| Dịch vụ | `/dich-vu`, `/dich-vu/<slug>` | `services[]` (`status`, `deleted`, `order`, `slug`, `sourceRoute`) | Đã đúng (loại draft/deleted, không trộn nhóm khác) |
| Bảng giá | `/bang-gia` | `collections.menu[]` (`image`, `full` cho lightbox) | Đã đúng (ảnh bị xóa/sửa cập nhật, không còn ảnh cũ) |
| Đào tạo | `/dao-tao`, `/dao-tao/<slug>` | `training[]` | Đã đúng |
| Tin tức | `/tin-tuc`, `/tin-tuc/<slug>` | `articles[]` | Đã đúng |
| Liên hệ | `/lien-he` | `sections.contact` + `settings` (tel/mailto/facebook/maps/zalo/booking) | Đã sửa (4 đoạn thông tin cập nhật tại chỗ, không mất link) |
| Album ảnh | `/album-anh`, `/album/<slug>`, `/nail-hottrend`, `/khong-gian` | `albumCategories[]` + `albumItems[]` + `collections.nail/space`, field `video` | Đã đúng |
| Slideshow | `/` | `collections.slides[]` | Đã đúng |
| Video | `/` | `collections.videos[]` | Đã đúng |
| Footer | mọi trang | `sections.footer` (`title`, `description`, `body`) | Đã đúng |

## Media → Cloudinary

- `npm run media:dry-run` → `Local content media: 159 files, 70.37 MiB. Not yet mapped: 159.` (không upload, không sửa file).
- `node scripts/migrate-media-cloudinary.mjs --execute` khi thiếu khóa → in `Cloudinary credentials missing. Nothing uploaded or modified.` và **thoát mã 2**, không đụng `public/`.
- Frontend luôn fallback về ảnh gốc: `resolveMedia(cms, url)` tra `mediaMap`, nếu không có bản ghi thì trả nguyên URL cũ → **không có ảnh vỡ** trước khi migrate.
- `mapManagedMedia` phủ `img[src]`, `video[src]`, `source[src]`, `audio[src]`, `iframe[src]`, `video[poster]`, `[data-bg-image]`, `[data-fancybox][data-src]`, `[data-src]:not([data-fancybox])`, `[srcset]`.
- Lệnh cần chạy khi có khóa thật: `npm run media:dry-run` → dừng server → sao lưu `server/data/content.json` → `npm run media:migrate`.

## Giới hạn

- Bộ thư viện `node_modules` thu được từ RAR dành cho Windows.
- Các phép thử SSR không thay thế đo tương đồng pixel và các hoạt ảnh chạy thực trong trình duyệt.
- Cloudinary API thử bằng mock. Chưa chạy upload hàng loạt hoặc xóa ảnh thật do thiếu khóa xác thực của chủ tài khoản.
- CSS và HTML nguồn được giữ để đối chiếu; giao diện admin mới dùng cùng cấu trúc biểu mẫu, nhưng phần vận hành ứng dụng dựa trên React/Node, không phải PHP gốc.
- Backend dùng file JSON, không hỗ trợ ghi lâu dài trên hệ thống file ephemeral như Vercel Functions nếu chưa chuyển sang database.
- Phép thử ánh xạ frontend dùng DOM giả lập nên không thay thế kiểm thử trình duyệt thật (Fancybox, Splide, autoplay).

## Thứ tự thử nghiệm production cần thực hiện

Đăng nhập admin → chỉnh Giới thiệu → mở trang chủ; sửa dịch vụ → kiểm tra trang chủ/danh mục/trang chi tiết; thêm bài Đào tạo/Tin tức → mở URL mới; thêm danh mục Album và ảnh → kiểm tra bộ sưu tập; xóa ảnh Bảng giá → kiểm tra lightbox; thay logo/favicon; nhập Cloudinary thật; thử sửa/xóa media dùng chung; thử menu/mobile và CTA khi deploy.
