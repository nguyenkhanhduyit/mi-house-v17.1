# Mi House Spa — V15 Critical Repair & QA

**Ngày kiểm tra:** 12/11/2026 · **Nền:** `mi-house-spa-v14-repaired.zip` từ người dùng · **Đích đối chiếu:** `_home.html`, `pageadmin.rar`, yêu cầu trong `Pasted text.txt`.

## Kết luận thực tế

Đã sửa **nguyên nhân gốc** của lỗi lưu/đóng form vô cớ trong code Admin, khôi phục thứ tự ảnh gốc cho Nail Hottrend và Không gian, sửa một số lỗi media/album phát hiện thêm. **Không đánh dấu hoàn thành 100%** vì môi trường không có Vite dependencies để build và render toàn bộ React, không có Cloudinary thật hoặc deployment production, và thiếu font chữ gốc trong source. Kết quả PASS dưới đây là kết quả đúng trong phạm vi từng loại test — không được suy diễn thành end-to-end PASS của toàn website.

## A. Root cause: click tự lưu + tự đóng — PATCHED

**Nguồn:** `src/cms/SourceAdmin.jsx`.

- Form bị đặt `form.dataset.cmsAct = 'save-form'`. Hàm xử lý click dùng `evt.target.closest('[data-cms-act]')`. Vì mọi `input`, `textarea` và khoảng trống bên trong form đều là descendant của form, mỗi click không có action riêng bị hiểu thành `save-form`, tự chạy `saveForm()` rồi chuyển trang. Đúng lỗi người dùng mô tả.
- **Đã sửa:** xóa `data-cms-act` khỏi form; gán action lưu cho **nút submit hợp lệ**, kiểm tra nút một lần nữa trước khi gọi API, `onSubmit` chỉ nhận `evt.submitter` hợp lệ. `onInput`/`onChange` của trường nhập chỉ cập nhật dirty state, không tự lưu. Click ngoài form không tự đóng.
- Chặn việc nhấn Enter *ngầm* kích hoạt submit chỉ trong form chỉnh sửa của Admin đã xác thực, **không chặn Enter trong form login**.
- Thêm khóa `savingFormRef` chặn nhấn Lưu nhiều lần khi request đang chạy.
- Nếu PUT thất bại: giữ form/dữ liệu, giữ `data-cms-changed`, không điều hướng và có thể lưu lại. Với ảnh vừa upload: giữ URL Cloudinary tạm sau upload thành công; khi retry PUT không upload trùng media.
- Đổi `order` ở danh sách vẫn có hành động ghi dữ liệu riêng **sau khi xác nhận rõ ràng** bằng dialog; bấm Hủy giữ giá trị cũ. Không còn lưu âm thầm ngay khi `change`.
- Cơ chế xác nhận bỏ thay đổi đang được giữ lại trong `navigate()`.

**Bằng chứng:** 6/6 kiểm thử tương tác Chromium trên `onClick`/`onSubmit` trích trực tiếp từ source; 10/10 kiểm thử Chromium trên luồng `onClick` + `saveForm` (API thất bại, retry, double-submit, upload không lặp). Đây là kiểm thử *tách hàm với stub/mock kiểm soát*, **không phải thao tác E2E trên app React đã build**. Kiểm thử toàn bộ module theo màn hình thật: **NOT TESTED**.

## B. Nail Hottrend và Không gian — PATCHED; VISUAL NOT VERIFIED

**Nguồn:** `src/components/AlbumShowcase.jsx`, `src/cms/managedContent.js`, `src/hooks/sourceCarousels.js` và `public/source-fidelity.css`.

- Xác nhận `_home.html`: Nail Hottrend có **8 ảnh**, tiêu đề **trước** dải ảnh; Không gian có **12 ảnh**, tiêu đề **sau** dải ảnh. Ảnh vuông kích thước khai báo `360×360`; hai dải ảnh liền nhau với khoảng cách nhỏ. Trang chủ gốc **không** gắn Fancybox vào các ảnh album.
- Khớp thông số Splide đã được giữ trong source: `type:loop`, `drag:free`, `focus:center`, `perPage:7`, `gap:2`, breakpoint 321/577/851/1025/1201 và AutoScroll `speed:+2` cho Nail, `speed:-2` cho Không gian. Không thay thư viện hoặc áp animation mới.
- Khôi phục thứ tự dự phòng theo `_home.html` khi hàng dữ liệu có `order=0`/trống; thứ tự do Admin chỉ định vẫn được ưu tiên. Không sửa/ghi đè dữ liệu seed hay dữ liệu thật.
- Sửa fallback `group.images` chứa object `{src,alt}` để không tạo URL ảnh `[object Object]` khi CMS chưa tải được.
- Không tự suy diễn `.png` thành ảnh full-resolution khi file HTML chỉ cung cấp ảnh `.webp` thumbnail; ưu tiên URL `row.full` khi CMS cung cấp, còn không sử dụng URL ảnh chắc chắn đang có.
- Với trang con, tránh tự chèn tên danh mục dưới mọi ảnh nếu HTML gốc không có caption; giữ mapping nội dung từ CMS.
- Đã đối chiếu phần album trong Chromium bằng **offline HTML fixture** sử dụng class/ảnh/CSS và source gốc, ở viewport 1440px, 390px. Tuy nhiên fixture **không được render từ React bundle thật**, font SVN-Gilroy không có trong bộ tài nguyên, có sai khác typography và giao diện kiểm thử chưa đủ đại diện. Kết luận: **không có bằng chứng xác nhận pixel-perfect/animation 100%**.
- `_home.html` chỉ là HTML của **trang chủ**, không phải file HTML độc lập của hai **trang con**. Không có cơ sở để xác nhận trang con khớp hoàn toàn với nguồn không được đính kèm.

## C. Kiểm thử đã chạy thành công

| Kiểm thử | Kết quả | Mức độ |
|---|---:|---|
| `node scripts/verify.mjs` | PASS: 26 route/26 JSX page, danh sách thiếu rỗng | Static |
| `node scripts/test-regression-fixes.mjs` | 18/18 PASS | Static/logic, kiểm tra parse 38 JSX |
| `node scripts/test-business-v14.mjs` | 21/21 PASS | Unit/business |
| `node scripts/test-frontend-cms-mapping.mjs` | 13/13 PASS | DOM giả lập |
| `node scripts/test-api.mjs` | 33/33 PASS | Backend qua HTTP, Cloudinary mock |
| `node scripts/test-critical-v15.mjs` | 10/10 PASS | Static + dữ liệu Album thực của bản ZIP |
| Chromium event-flow `onClick`/`onSubmit` | 6/6 PASS | Component logic tách từ JSX, stub |
| Chromium `saveForm`/API failure/retry | 10/10 PASS | Component logic tách từ JSX, mock failure |
| Dữ liệu `server/data/content.json` và `src/cms/initialContent.json` so với ZIP đầu vào | 2 file byte-identical | File integrity |

**Tổng 111 kiểm tra PASS** trên các bộ test nói trên; đây **không phải** 111 bài kiểm thử End-to-End thực tế.

## D. Kiểm toán chủ động và giới hạn cần xử lý

| Hạng mục | Trạng thái | Lý do |
|---|---|---|
| Click/blur/outside click không tự lưu | **PASS (test tách hàm)** | Đã tái hiện và sửa nguyên nhân gốc, kiểm thử Chromium riêng |
| Save/Cancel, API lỗi, retry, double-save | **PASS (test tách hàm)** | API mock để kiểm thử trường hợp lỗi một cách an toàn |
| Toàn bộ module Giới thiệu/Dịch vụ/Bảng giá/Đào tạo/Album/Tin tức/... trên UI React | **NOT TESTED** | Không chạy được React bundle/điều hướng thực tế |
| Đồng bộ CRUD và persistence backend | **PASS (mock API test)** | Backend test trên dữ liệu tạm, chưa kiểm tra production |
| Cloudinary thật: upload/list/replace/delete | **BLOCKED** | Chưa có credentials thật; không tác động tài khoản người dùng |
| So sánh Admin đúng ảnh `pageadmin.rar` | **PARTIAL** | Có template Admin trong source + danh sách 3.086 file ở RAR; không có end-to-end screenshot Admin thật |
| HTML/CSS/hiệu ứng Nail/Không gian | **PARTIAL** | Mapping và motion có kiểm thử tĩnh, offline comparison chưa xác nhận visual |
| Font, icon nguyên mẫu | **BLOCKED** | Thiếu bộ font gốc SVN-Gilroy, không thể cam kết typography trùng khớp |
| `npm ci`, `npm run build` | **BLOCKED** | NPM registry/DNS không khả dụng và cache thiếu Vite; chưa có production build sạch |
| Vercel production | **BLOCKED** | Node backend ghi JSON cần storage bền vững; chưa chuyển API sang serverless + DB hoặc xác thực trên server riêng |
| Browser E2E đầy đủ, Console/Network/Visual Regression production | **NOT TESTED** | Phải chạy ở môi trường cài dependencies và truy cập được app |

## E. Tệp thay đổi trong bản V15

- `src/cms/SourceAdmin.jsx` — xử lý lưu theo nút, bảo vệ Enter ở login, chống double submit, giữ asset trên retry, xác nhận thay đổi thứ tự.
- `src/cms/managedContent.js` — sắp xếp Album dựa trên HTML khi `order=0`, URL ảnh an toàn và caption trang con.
- `src/components/AlbumShowcase.jsx` — fallback ảnh object, URL ảnh gốc và không gắn Fancybox không có trong mẫu trang chủ.
- `public/source-fidelity.css` — căn chỉnh khoảng cách/typography Album (font thực vẫn bị thiếu).
- `public/route-repairs-v7.css` — sửa mobile scrollbar gutter.
- `scripts/test-critical-v15.mjs` — thêm 10 regression assertions mới.
- `QA-CRITICAL-V15-2026-11-12.md`, `README.md`, `package.json` — báo cáo và tài liệu kiểm thử.

**Không thay đổi** `server/data/content.json`, `src/cms/initialContent.json`, khóa API hay mật khẩu. Không xóa file Cloudinary, không ghi lên hệ thống production.

## F. Hướng dẫn kiểm chứng khi chạy thực tế

1. Sao lưu CMS, giữ .env trên server, khởi chạy ở môi trường Node 22 có npm registry; chạy `npm ci`, `npm run build`, toàn bộ scripts QA.
2. Trong mọi module Admin, thực hiện: mở sửa → click vào từng input, vùng trống, ngoài form, chuyển focus, scroll, nhấn Enter → **không request PUT /api/admin/state**, form vẫn mở.
3. Thực hiện sửa → Lưu, kiểm tra API success + reload. Ngắt mạng hoặc trả HTTP 500 → form phải giữ dữ liệu, không điều hướng. Double click Lưu chỉ phát một request.
4. Trên trang chủ, so ảnh `_home.html` ở viewport desktop/mobile: Nail 8 ảnh +2, Không gian 12 ảnh -2; title trước/sau; hover, scroll, tốc độ, responsive, font, images; trang con dùng source tương ứng nếu có.
5. Kiểm tra tất cả CRUD và quyền đăng nhập, Cloudinary thật, dữ liệu reload, SEO/route và ảnh trên production. Chỉ đánh dấu **PASS** các phần sau khi đã chạy và lưu bằng chứng.

**Kết quả bàn giao:** mã nguồn đã sửa lỗi có nguyên nhân rõ ràng và đi kèm bộ kiểm thử. **Chưa nghiệm thu 100% UI/UX và không cam kết hệ thống đã hết lỗi trên production.**
