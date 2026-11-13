# AUDIT REPORT — Mi House Spa V16

**Ngày thực hiện:** 13/11/2026  
**Nền:** `mi-house-spa-v15.rar` do người dùng cung cấp; so sánh `pageadmin.rar`, `pages.rar` và ảnh chụp localhost.  
**Phạm vi:** frontend React 19, HTML/CSS/JS tham chiếu, CMS Admin iframe, Node API, lưu trữ JSON, SEO/Schema, thư viện Cloudinary và các luồng CRUD.

## 1. Kết luận kiểm chứng

Các lỗi trong source liên quan Album, View, Cloudinary endpoint, lưu dữ liệu mới và khung Google Maps cố định đã được **chỉnh sửa trực tiếp**. Các bài kiểm thử trên mã nguồn, DOM Chromium tách riêng và backend tạm đã đạt. **Không đủ bằng chứng để công bố toàn bộ hệ thống đã nghiệm thu**: chưa chạy được Vite build hoặc trình duyệt với ứng dụng React hoàn chỉnh, chưa kết nối Cloudinary thật, chưa kiểm thử Vercel. Mỗi PASS dưới đây chỉ có giá trị trong phạm vi được nêu.

**Trạng thái:** PASS = có kiểm thử đạt trong phạm vi nêu; PATCHED / NOT VERIFIED = đã sửa code nhưng chưa E2E thực; BLOCKED = thiếu môi trường; NOT TESTED = chưa thử thực tế.

## 2. Danh sách chức năng kiểm kê

- **Website:** 26 URL trong `src/routeManifest.json`, 26 trang JSX chuyển từ `pages.rar`, Navbar, Footer, slideshow, carousel, gallery lightbox, TOC, back to top, giao diện thiết bị, typography, SEO metadata, robots, JSON-LD, điều hướng SPA.
- **Admin:** Giới thiệu, Dịch vụ, Bảng giá, Đào tạo, danh mục Album cấp 1, ảnh Album, Tin tức, Liên hệ cấu hình, Slideshow, Video, Footer, Media/Cloudinary, Cấu hình, đăng nhập. Phần quản trị sử dụng HTML tham chiếu trong iframe và bộ xử lý sự kiện chung `SourceAdmin.jsx`.
- **Thao tác kiểm kê:** danh sách, tìm kiếm, lọc, phân trang, xem, thêm, sửa, sao chép, xóa, xóa hàng loạt, chọn, cập nhật thứ tự, trạng thái xuất bản, lưu/hủy, file picker, upload/replace/delete media, Visual/HTML editor, SEO, Robots, Schema JSON.
- **API:** `/api/public`, `/api/health`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/session`, `/api/admin/state`, `/api/admin/media-library`, `/api/admin/media`, `/api/admin/media-import`, `/api/admin/media/usage`, `/api/admin/media-cleanup`, `/api/admin/analytics`, `/api/analytics/pageview`, các route media theo ID. Điều này là kiểm kê *route định nghĩa*, không phải toàn bộ route được E2E chứng nhận.

## 3. Ma trận 17 lỗi V16

| ID | Hiện tượng / đối chiếu | Nguyên nhân và thay đổi | Trạng thái |
|---|---|---|---|
| 01 | `/album-anh` hiện 2 ô lớn thay vì gallery | `managedContent.js`: thay thẻ category bằng gallery 12 ảnh/trang, phân trang và thứ tự đúng theo `pages.rar`; không xóa ảnh user đã bổ sung | PATCHED / NOT VERIFIED visual |
| 02 | View không chạy | `SourceAdmin.jsx`: tạo URL theo item ID/slug/sourceRoute và xử lý View, không để `href="#"` cho View nghiệp vụ | PATCHED / NOT VERIFIED end-to-end |
| 03 | Copy sai nội dung hiển thị | `businessModel.js` giữ `sourceTemplateRoute`; `App.jsx` chọn đúng JSX template gốc cho bản sao; `managedContent.js` lấy nội dung theo slug; backend giữ trường tùy biến. Đối chiếu dữ liệu gốc/copy cần chạy trên browser thật | PATCHED / NOT VERIFIED E2E |
| 04 | Cloudinary thiếu tham số `type` | `server/index.mjs`: Admin API `/resources/image/upload` hoặc `/resources/video/upload`; giữ `prefix=mi-house/`, `next_cursor`. Unit API mock kiểm tra URL type | PASS mock / BLOCKED real |
| 05 | Thư viện Cloudinary và bốn nút PHP chết | Admin hiển thị tabs Ảnh/Video, thumbnail, tác vụ, cursor, refresh/upload; ẩn chức năng quản lý *thư mục PHP* không tương thích với Cloudinary, tránh nút không có tác dụng | PATCHED / NOT VERIFIED UI |
| 06 | Nội dung (vi) sai editor | Visual/HTML, định dạng cơ bản, font, màu, H1–H6, link, ảnh, bảng; Chromium test 11 tình huống editor và robots; lọc HTML nguy hiểm ở editor và frontend | PASS widget DOM / NOT VERIFIED all modules |
| 07 | Input/textarea/button thao tác hỏng | Kiểm kê handler dùng chung; sửa View, media, form. Chưa duyệt được tất cả màn hình trong app đã build | PARTIAL / NOT TESTED complete |
| 08 | Lưu xong đơ/không phản hồi | Dùng khóa request, chờ API xác nhận, thông báo và state mới từ V15; vẫn cần kiểm tra browser thật và API chậm thực tế | PASS unit / NOT VERIFIED E2E |
| 09 | Trường dữ liệu không lưu | Backend giữ metadata tùy biến ở collection; test vòng PUT → GET API cho bản sao, map, SEO, schema và ảnh; dữ liệu khởi tạo giữ nguyên | PASS backend test |
| 10 | SEO Tiếng Việt + phân tích | `SourceAdmin.jsx`: mapping SEO title/keywords/description/focus + counter/checklist tính từ dữ liệu, giữ quy tắc 70/70/160 | PATCHED / NOT VERIFIED UI |
| 11 | Nâng cao Robots Meta | Select Index/No Index và Follow/No Follow; các flag riêng; lưu field `robots`; `App.jsx` xuất meta robots từ CMS | PASS widget+API / NOT VERIFIED public browser |
| 12 | SEO toàn module không đồng nhất | Editor/mapping dùng chung; `App.jsx` title/desc/keywords/robots/schema/canonical. SSR/crawler access và UI mọi module chưa E2E | PARTIAL |
| 13 | Admin xóa map vẫn hiện | `SharedShell.jsx`: bỏ Google Maps iframe hardcoded; chỉ render nếu CMS có HTTPS Google embed URL hợp lệ | PATCHED / NOT VERIFIED E2E |
| 14 | Back to Top trang con | Source sử dụng logic scroll global; chưa browser kiểm tra mọi route | NOT TESTED |
| 15 | Hover nút Đặt lịch ngay | CSS hiện có cần đối chiếu ở các trạng thái; chưa browser đủ | NOT TESTED |
| 16 | Font dropdown lỗi | Thiếu nhiều font assets gốc và chưa render app thật để đối chiếu | BLOCKED |
| 17 | Nail/Không gian sai khi điều hướng qua lại | Hook có mount/cleanup từ V15; source CSS/carousel chưa chạy end-to-end toàn bộ chuỗi route | NOT TESTED |

## 4. Legacy bug regressions

- **Tự lưu/tự đóng form:** bản V15 đã sửa `data-cms-act` ở form và chống implicit submit; V16 giữ nguyên, widget Chromium còn kiểm tra form không mang `save-form`. Chưa kiểm tra từng form khi React đang chạy.
- **Reload module:** giữ logic khôi phục URL từ V15, chưa browser E2E.
- **Sao chép nội dung:** V16 có sửa nguồn hiển thị copy cũ/mới và metadata lưu lại, nhưng chưa xác minh screenshot sau reload.
- **Menu Album, mục lục, Cloudinary, Font, điều hướng, Liên hệ:** giữ các bản sửa V15, đối chiếu source nơi liên quan; chưa đủ bằng chứng xác nhận toàn bộ.

## 5. Lỗi ẩn tự tìm thấy

1. **Bản sao dùng template khác bài gốc** dù body JSON có vẻ đúng: `App.jsx` hiện tái dùng JSX của bài nguồn theo `sourceTemplateRoute`; bản sao V15 tồn tại được nhận diện theo nội dung body hoặc slug gốc. Không ghi đè 4 bản sao hiện có.
2. **Dữ liệu Album có thêm ảnh thực tế** so với tám ảnh Nail nguồn: kiểm thử đối chiếu ảnh mẫu chỉ kiểm tra thứ tự các ảnh chuẩn; giữ ảnh được thêm bởi quản trị, không biến mất khi sửa UI.
3. **Tài nguyên thư viện không do CMS sở hữu:** chỉ cho copy URL; khóa Replace/Delete tránh vô tình sửa tài nguyên ngoài hệ thống.
4. **HTML người dùng có thể chứa script/SVG/CSS URL nguy hiểm:** bổ sung lọc HTML trước khi render; cần security pentest chuyên sâu đối với các vector XSS khác.
5. **Vercel và nguồn dữ liệu:** `vercel.json` hiện chỉ rewrite về `index.html`, backend JSON phụ thuộc ổ đĩa ghi. Production **không tự hoạt động** với Node server chỉ bằng Vercel static deploy. Cần backend persistent storage và API routes phù hợp trước khi xác nhận production.

## 6. Kết quả test đã chạy

| Bộ test | Lệnh | Số đạt | Giới hạn |
|---|---|---:|---|
| Backend + API | `node scripts/test-api.mjs` | **37 PASS** | Mock Cloudinary; DB và port riêng; không dùng dữ liệu thật |
| Business CMS | `node scripts/test-business-v14.mjs` | **21 PASS** | Unit / nghiệp vụ |
| Frontend mapping | `node scripts/test-frontend-cms-mapping.mjs` | **13 PASS** | JS/DOM mapping tách riêng |
| Regression | `node scripts/test-regression-fixes.mjs` | **18 PASS** | Unit / source |
| Critical | `node scripts/test-critical-v15.mjs` | **10 PASS** | Logic / source V15 |
| Editor + Robots bằng Chromium | `python scripts/test-v16-browser.py` | **11 PASS** | Helper thực tách khỏi React build; không đại diện E2E |

**Tổng 110 case PASS ở các cấp độ trên, không phải 110 bài E2E.** Test `Cloudinary` dùng mock thực có request/response, không dùng để giả dữ liệu website production. Cần chạy lại toàn bộ test sau khi `npm install` trên máy triển khai.

### Điểm chặn

- **Build Vite:** thư viện `node_modules` nằm trong RAR dành cho Windows, không có binary Rollup/esbuild Linux tương ứng. Môi trường kiểm thử không thể tải npm từ registry. Vì vậy **BLOCKED**, không phải PASS.
- **So sánh pixel và hiệu ứng:** cần khởi động Vite thành công, chạy HTML gốc và React cùng viewport; **BLOCKED**.
- **Cloudinary thực:** không dùng API credentials của người dùng; **BLOCKED**.
- **Vercel production:** không có deployment/DB và quyền truy cập; **BLOCKED**.
- **Fonts:** CSS tham chiếu nhiều font assets không có trong bundle đã nhận; giao diện có thể sai font; cần bổ sung nguồn được cấp phép.

## 7. File đã thay đổi/tạo

`server/index.mjs`; `src/cms/businessModel.js`; `src/cms/SourceAdmin.jsx`; `src/cms/managedContent.js`; `src/App.jsx`; `src/components/CmsManagedPage.jsx`; `src/components/SharedShell.jsx`; `public/cms-controls-v16.css`; `scripts/test-api.mjs`; `scripts/test-critical-v15.mjs`; `scripts/test-frontend-cms-mapping.mjs`; `scripts/test-v16-browser.py`; `AUDIT_REPORT.md`; `HANDOFF.md`; `README.md`.

**Bảo vệ dữ liệu:** không chỉnh/sửa/reset `server/data/content.json` và `src/cms/initialContent.json`; không đóng gói `.env`/secret. Không deploy production, không xóa bất kỳ media thật nào.
