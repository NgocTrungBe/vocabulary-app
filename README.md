# Từ Vựng — App ôn luyện từ vựng tiếng Anh

Ứng dụng web ôn luyện từ vựng tiếng Anh theo chủ đề, xây bằng Next.js 14 + TypeScript + Tailwind CSS.
Dữ liệu được lưu **trực tiếp trong trình duyệt** bằng IndexedDB (qua thư viện Dexie) — không cần server,
không cần cấu hình database, deploy lên Vercel là chạy được ngay.

> **Lưu ý về lưu trữ:** vì dữ liệu nằm trong IndexedDB của trình duyệt, từ vựng bạn thêm sẽ **gắn với từng
> thiết bị/trình duyệt cụ thể**, không tự đồng bộ giữa điện thoại và máy tính. Nếu sau này bạn cần dùng
> chung nhiều thiết bị, mình có thể nâng cấp lên một database thật (Postgres/Supabase/Turso...).

## Tính năng

- **Tab Quản lý từ**
  - Thêm từng từ một: tiếng Anh, tiếng Việt, phiên âm IPA, trình độ CEFR (A1–C2), câu ví dụ.
  - **Nhập nhiều từ cùng lúc** theo định dạng markdown đơn giản (xem bên dưới), có xem trước trước khi lưu.
  - Sửa / xoá từng từ, đổi tên hoặc xoá cả chủ đề.
  - Nút "Nhập dữ liệu mẫu" để dùng thử ngay khi chưa có dữ liệu.
- **Tab Ôn tập**
  - Chọn ôn theo 1 chủ đề hoặc "Tất cả (lộn xộn)".
  - Chọn chiều ôn: Anh → Việt hoặc Việt → Anh, có ô nhập đáp án.
  - Trả lời sai sẽ được đánh dấu và **hỏi lại ở cuối lượt**; chỉ khi trả lời đúng 100% (kể cả những từ
    từng sai) thì chủ đề mới được đánh dấu **hoàn thành** cho chiều ôn đó.
  - Có nút loa phát âm bằng giọng đọc trình duyệt (Web Speech API), chọn được Anh-Mỹ (en-US) hoặc
    Anh-Anh (en-GB) ở góc trên bên phải.
- **Tab Thống kê**
  - Tổng số từ, số chủ đề, số chủ đề đã hoàn thành.
  - Biểu đồ số từ theo từng trình độ CEFR (A1–C2).
  - Bảng tiến độ hoàn thành từng chủ đề theo cả hai chiều ôn.

## Định dạng nhập nhiều từ cùng lúc

Dán vào ô nhập, mỗi dòng một từ, các trường cách nhau bằng dấu `|`:

```
## Du lịch
airport | sân bay | /ˈeəpɔːt/ | A1 | We arrived at the airport early.
passport | hộ chiếu | /ˈpɑːspɔːt/ | A1
luggage | hành lý | | A2

## Công việc
deadline | hạn chót | /ˈdedlaɪn/ | A2
```

- Dòng bắt đầu bằng `## ` sẽ mở một **chủ đề mới**, các từ phía sau thuộc chủ đề đó.
- Mỗi dòng từ: `tiếng anh | tiếng việt | phiên âm | trình độ | câu ví dụ`
  — chỉ **tiếng anh** và **tiếng việt** là bắt buộc, các trường còn lại có thể để trống.
- Trình độ không hợp lệ hoặc để trống sẽ mặc định là `A1`.
- Mẹo: nếu một từ có nhiều nghĩa/nhiều cách viết đúng, có thể viết cách nhau bằng `/`, ví dụ
  `sân bay/phi trường` — khi ôn tập, gõ đúng một trong các đáp án đều được tính đúng.

## Chạy thử ở máy local

Yêu cầu: Node.js 18.18 trở lên (khuyến nghị Node 20).

```bash
npm install
npm run dev
```

Mở http://localhost:3000

Build production để kiểm tra trước khi deploy:

```bash
npm run build
npm run start
```

## Deploy lên Vercel

**Cách 1 — qua GitHub (khuyến nghị):**

1. Đẩy thư mục này lên một repo GitHub mới.
2. Vào https://vercel.com → **Add New Project** → chọn repo vừa tạo.
3. Vercel tự nhận diện đây là dự án Next.js, để nguyên cấu hình mặc định và bấm **Deploy**.
4. Xong — không cần khai báo biến môi trường nào vì toàn bộ dữ liệu lưu ở trình duyệt người dùng.

**Cách 2 — qua Vercel CLI:**

```bash
npm i -g vercel
vercel        # lần đầu sẽ hỏi vài câu để liên kết project
vercel --prod # deploy bản chính thức
```

## Cấu trúc thư mục

```
app/                  App Router: layout, trang chính (ghép 3 tab)
components/
  WordsTab.tsx        Quản lý từ (thêm/sửa/xoá/nhập nhiều)
  PracticeTab.tsx      Ôn tập (logic hỏi-đáp, đánh dấu hoàn thành)
  StatsTab.tsx         Thống kê
  ui/                  Button, LevelBadge, SpeakButton dùng chung
lib/
  types.ts             Định nghĩa kiểu dữ liệu
  db.ts                Schema IndexedDB (Dexie) + các hàm CRUD
  importParser.ts       Parser cho định dạng nhập nhiều từ
  tts.ts               Phát âm bằng Web Speech API
  sampleData.ts         Dữ liệu mẫu để dùng thử
```

## Vài hướng cải tiến có thể làm thêm sau này

- **Ôn tập ngắt quãng (spaced repetition)**: dùng lại bảng `progress` đã có sẵn (đếm đúng/sai, thời gian
  ôn gần nhất) để tính lịch ôn lại kiểu Leitner/SM-2 thay vì ôn theo chủ đề đơn thuần.
- **Đồng bộ nhiều thiết bị**: thêm đăng nhập + một database thật (Postgres/Supabase/Turso) khi cần dùng
  chung giữa điện thoại và máy tính.
- **Trắc nghiệm 4 đáp án** bên cạnh kiểu gõ đáp án hiện tại, phù hợp khi mới học từ mới.
- **Xuất/nhập file .json hoặc .csv** để sao lưu và chuyển dữ liệu giữa các trình duyệt.
- **Ghi âm giọng đọc thật** (thay vì Web Speech API) cho những từ khó phát âm.
