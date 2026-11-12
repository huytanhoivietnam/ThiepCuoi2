# Thiệp cưới Quang Huy & Ngọc Lan

Hai thiệp HTML dùng chung ảnh, font, nhạc và một ứng dụng Google Apps Script.

## Chạy trên máy

Từ thư mục repository, chạy máy chủ tĩnh bằng Python:

```sh
python -m http.server 8080 --directory dist
```

- Thiệp nhà trai: http://localhost:8080/
- Thiệp nhà gái: http://localhost:8080/nha-gai.html

## Các tệp chính

- `dist/index.html`: thiệp nhà trai, tiệc 10:00 và lễ thành hôn 15:00 ngày 29/11/2026.
- `dist/nha-gai.html`: thiệp nhà gái, tiệc 09:00 và lễ Vu Quy 13:00 ngày 29/11/2026.
- `dist/loi-chuc.js`: đọc lời chúc từ Sheets và tạo dải lời chúc cuộn liên tục.
- `dist/anh/`: ảnh đã tối ưu cho web. Album dùng `album-1.jpg` đến `album-8.jpg`. Ảnh bìa, chân dung và ảnh cuối thiệp có tệp riêng.
- `dist/fonts/` và `dist/nhac/`: font và nhạc dùng trong thiệp.
- `apps-script/Code.gs`: mã Google Apps Script nhận xác nhận tham dự và đọc lời chúc.
- `thiep-cuoi.html`, `loi-chuc.js` và các thư mục tài nguyên ở thư mục gốc là các tệp nguồn đang lưu trong project. Các ảnh gốc ở `anh/` khác bản đã tối ưu trong `dist/anh/`.

## Google Sheets

Ứng dụng Apps Script dùng hai tab trong cùng một file Google Sheets:

| Thiệp | Tham số của ứng dụng web | Tab dữ liệu |
| --- | --- | --- |
| Nhà trai | Mặc định hoặc `side=nha-trai` | Xác nhận tham dự |
| Nhà gái | `side=nha-gai` | Xác nhận tham dự-Nhà gái |

`doPost` ghi xác nhận. `doGet?action=wishes` trả về tên và lời chúc của tab được chọn.

Để thiết lập trên file Google Sheets của bạn:

1. Mở Apps Script từ menu Tiện ích mở rộng của bảng.
2. Đặt nội dung `apps-script/Code.gs` vào dự án, đảm bảo chỉ có một hàm `doGet` và một hàm `doPost`.
3. Chạy `setupNhaGai` một lần để cấu hình file và tạo tab nhà gái với cùng cấu trúc, định dạng.
4. Triển khai ứng dụng web, thực thi dưới tư cách chủ bảng, cho phép bất kỳ ai truy cập.
5. Gắn URL ứng dụng web vào `WEDDING.rsvpEndpoint` của mỗi HTML. Thiệp nhà gái dùng thêm `?side=nha-gai`.

Khi sửa mã của ứng dụng đang dùng, tạo phiên bản mới trong **Triển khai → Quản lý bản triển khai**.

## Cloudflare Pages

Thư mục xuất bản là **`dist`**. Project là HTML tĩnh và có thể xuất bản trực tiếp thư mục này.

Nếu tải ZIP lên Cloudflare, nén nội dung bên trong `dist` để `index.html` nằm ngay ở gốc ZIP.

- Trang chính `/` mở thiệp nhà trai.
- Đường dẫn `/nha-gai` mở thiệp nhà gái.

Ảnh mới dùng đúng tên tệp trong `dist/anh`. Khi thay ảnh cùng tên, cập nhật tham số phiên bản `?v=...` tại các đường dẫn ảnh trong HTML.
