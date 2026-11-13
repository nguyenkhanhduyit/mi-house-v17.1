## V17 — Vercel + Upstash Redis + Cloudinary

Đã thêm kiến trúc Vercel Functions/Upstash/Cloudinary. Xem **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** để triển khai, tạo Redis, nhập biến môi trường và nghiệm thu production. Xem **[QA_VERCEL_V17.md](QA_VERCEL_V17.md)** để phân biệt kiểm thử đạt và phần chưa xác minh. Lệnh mới: `npm run test:serverless` (REST mock, không kết nối dịch vụ thật).

---

> **V16 — 13/11/2026:** Đã vá Album page, View/Copy, endpoint Cloudinary, HTML editor, SEO/robots, dữ liệu custom và frame Google Maps. Báo cáo mới nhất: [AUDIT_REPORT.md](AUDIT_REPORT.md), hướng dẫn nghiệm thu: [HANDOFF.md](HANDOFF.md). **Bản bàn giao chưa xác nhận build React, Cloudinary thật và production.**

> **V15 CRITICAL FIX (12/11/2026)**: Đã sửa nguyên nhân Admin tự lưu/tự đóng do `data-cms-act` gắn trên `<form>`; sửa thứ tự/đường dẫn ảnh Album, giữ logic carousel của HTML gốc, và bổ sung test hồi quy. Xem [QA-CRITICAL-V15-2026-11-12.md](QA-CRITICAL-V15-2026-11-12.md). **Vẫn cần chạy E2E React/visual/Cloudinary trên môi trường có thể build ứng dụng.**

> **Bản sửa ngày 12/11/2026:** Xem `QA-REPAIR-2026-11-12.md` để biết các thay đổi và giới hạn kiểm thử. `QA-V14.md` là báo cáo cũ, không phản ánh toàn bộ bản sửa mới nhất.

# Mi House Spa — React + Nasani-style CMS (V14)

Dự án dùng HTML, CSS và các class gốc từ `pages.rar` và `pageadmin.rar`, giữ giao diện và hiệu ứng của website Mi House Spa. Trang chủ và 25 trang con được viết bằng React 19; backend CMS là Node.js thuần, port `5551`. Server Vite phát triển port `555`.

## Khởi chạy

Yêu cầu Node.js 22 và npm có kết nối đến registry chính thức khi cài lần đầu:

```bash
npm install
cp .env.example .env
# Điền ADMIN_PASSWORD, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong .env
npm run dev
```

- Website: http://localhost:555
- Quản trị: http://localhost:555/admin
- `npm run start` dùng máy chủ Node để phục vụ bản `dist/` sau khi `npm run build`.
- Không commit `.env`, API secret, `node_modules`, hoặc các thư mục thử nghiệm.

## Nhóm quản trị

- **Giới thiệu**: tiêu đề, mô tả, nội dung HTML, ảnh đại diện, ảnh/nội dung giới thiệu trang chủ, SEO. Khởi tạo từ nội dung Mi House Spa trong HTML gốc.
- **Dịch vụ**: danh sách bản ghi gốc và thêm mới, sửa/xóa, URL, ảnh, nội dung, SEO, trạng thái, thứ tự. Trang chủ và trang danh sách sử dụng cùng nguồn.
- **Bảng giá**: mỗi ảnh có bản ghi riêng, thêm/sửa/ẩn/xóa, thay ảnh và mở lightbox từ bản đã lưu.
- **Đào tạo**: bài đào tạo có đường dẫn và biểu mẫu tương tự Tin tức.
- **Album**: danh mục cấp 1 (Nail Hottrend, Không gian và mục mới) + ảnh thuộc từng danh mục; giữ Splide AutoScroll hai chiều của trang chủ.
- **Tin tức**: bài gốc và bài mới, slug, nội dung, ảnh, trạng thái, thứ tự, ngày hiển thị và thông tin SEO.
- **Liên hệ**: thông tin cơ sở, liên kết gọi điện, Zalo, mạng xã hội, website, Google Maps.
- **Slideshow, Video, Footer** và **Thư viện Cloudinary**: quản lý độc lập.
- **Cấu hình**: logo, favicon, domain và các link website.
- Không có menu thống kê truy cập, Tổng quan hay dashboard SEO.

### Cơ chế cập nhật

Lần đầu backend chạy sẽ **khởi tạo một lần** nội dung gốc Mi House Spa từ `src/cms/initialContent.json`, sau đó lưu ở `server/data/content.json`. Admin gửi thay đổi qua `/api/admin/state`; trang công khai đọc `/api/public`, kiểm tra revision khi quay lại tab và sau mỗi 20 giây. Khi xóa một mục gốc, bản ghi được ẩn/xóa khỏi danh sách công khai thay vì lấy lại từ seed. Trang mới dùng đường dẫn `/dich-vu/<slug>`, `/dao-tao/<slug>`, `/tin-tuc/<slug>` hoặc `/album/<slug>`. Dữ liệu và SEO được sửa theo từng nhóm. Tệp JSON là storage chạy trên **máy chủ Node có ổ đĩa ghi bền vững**, không phải storage phù hợp để chạy trực tiếp trên Vercel Functions.

### Cloudinary và media cũ

Ảnh/video mới được upload qua backend với khóa ký máy chủ. Thay file ở **Thư viện Cloudinary** sẽ cập nhật URL dùng trong nội dung; xóa được chặn khi file còn được tham chiếu. Media không còn sử dụng được dọn hoặc đưa vào danh sách thử xóa lại nếu Cloudinary tạm lỗi. Nội dung cũ vẫn có bản sao cục bộ để phòng lỗi chuyển đổi.

**Bắt buộc chạy riêng một lần nếu muốn chuyển media cũ sang Cloudinary:**

```bash
npm run media:dry-run
# DỪNG server CMS trước khi thao tác, sao lưu server/data/content.json
npm run media:migrate
```

Script nhập 159 file media cục bộ vào Cloudinary, cập nhật các URL `mediaMap` đã thành công, hỗ trợ chạy lại các file còn thiếu. Cần có `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` thực. **Chưa chạy import trong bản bàn giao do không có quyền truy cập Cloudinary của bạn**. Không được xóa thư mục ảnh gốc khi chưa kiểm tra tất cả URL sau nhập.

Khi chưa có khóa, `--execute` dừng ngay với thông báo `Cloudinary credentials missing. Nothing uploaded or modified.` và mã thoát `2`; `--dry-run` chỉ báo số file/dung lượng. Frontend luôn tra `mediaMap` qua `resolveMedia()` và **giữ nguyên URL cũ khi chưa có bản ghi**, nên trước khi migrate toàn bộ ảnh vẫn hiển thị bình thường.

## Kiểm tra

```bash
npm run check
npm run check:react
node scripts/test-business-v14.mjs
node scripts/test-frontend-cms-mapping.mjs
node scripts/check-frontend-build.mjs
npm run test:api
npm run build
```

Các phép thử API dùng **Cloudinary mô phỏng**, không chứng minh tài khoản Cloudinary production hoạt động. Thử lại mọi thao tác thêm/sửa/xóa thực trên Vite/Cloudinary trước khi deploy.

## Nâng cấp dữ liệu

1. Sao lưu `.env` và `server/data/content.json` ở phiên bản trước.
2. Giải nén V14 vào thư mục riêng.
3. Chép `server/data/content.json` vào dự án mới nếu muốn giữ chỉnh sửa đã lưu; backend tự bổ sung nhóm nghiệp vụ mới và giữ revision.
4. Tạo `.env` tương ứng, cài dependencies và chạy ứng dụng.
5. Kiểm tra admin có nội dung theo nhóm và cập nhật thử trên frontend trước khi chuyển tên miền.

## Ghi chú kiểm chứng

Bố cục nguồn và class từ RAR được giữ lại tối đa; không có cơ sở để cam kết giống **100% từng pixel** hoặc không có bug khi chưa kiểm thử trực tiếp toàn bộ thao tác trên bản build Vite và Cloudinary thật. Xem `QA-V14.md`.
