# WordFlow Vocabulary Dashboard

Dashboard học từ vựng chạy hoàn toàn trong trình duyệt, có thể deploy lên Vercel như một static site.

## Chức năng

- Ôn theo chủ đề hoặc tất cả chủ đề.
- Lọc theo level A1-C1.
- Ôn Anh → Việt hoặc Việt → Anh.
- Từ trả lời sai quay lại cuối hàng đợi; đạt 100% mới hoàn thành lượt ôn.
- Giọng đọc Anh-Mỹ bằng Web Speech API của trình duyệt.
- Thêm, sửa, xóa và tìm kiếm từ vựng.
- Thống kê số từ theo level, số từ đã học và tiến độ theo chủ đề.
- Xuất/nhập JSON để sao lưu hoặc chuyển dữ liệu.
- Dữ liệu lưu bằng IndexedDB.

## Chạy trên máy

Mở thư mục bằng một static server, ví dụ:

```bash
npx serve .
```

Sau đó mở địa chỉ mà terminal hiển thị.

## Deploy lên Vercel

1. Đưa toàn bộ thư mục này lên một GitHub repository.
2. Trong Vercel chọn **Add New → Project** và import repository.
3. Framework Preset: **Other**.
4. Không cần Build Command.
5. Output Directory: `.`
6. Nhấn **Deploy**.

`vercel.json` đã cấu hình để phục vụ static site và fallback về `index.html`.

## Lưu ý về database

Phiên bản này dùng IndexedDB: dữ liệu tồn tại lâu dài trên cùng trình duyệt và thiết bị, không mất khi tải lại trang. Hãy dùng nút **Xuất dữ liệu** để sao lưu định kỳ.

Để đồng bộ giữa nhiều thiết bị hoặc nhiều tài khoản, phiên bản tiếp theo nên dùng Supabase/PostgreSQL và thêm đăng nhập. Lớp dữ liệu hiện được tách qua các hàm IndexedDB trong `app.js`, nên có thể thay bằng API/Supabase mà không cần thiết kế lại giao diện.
