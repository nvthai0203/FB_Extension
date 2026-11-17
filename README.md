# FB Clean — Tùy chỉnh giao diện Facebook

Chrome extension (Manifest V3) giúp ẩn các thành phần gây xao nhãng trên Facebook: tin (Stories), quảng cáo, Reels, cột phải, khung chat, gợi ý, Watch, hoặc toàn bộ bảng tin.

## Tính năng

| Tùy chọn | Mô tả | Mặc định |
|---|---|---|
| Ẩn tin (Stories) | Thanh Stories trên đầu feed | Bật |
| Ẩn quảng cáo | Bài Sponsored / Được tài trợ | Bật |
| Ẩn Reels | Lối tắt Reels + bài Reels trong feed | Tắt |
| Ẩn cột phải | Right rail (contacts, ads…) | Tắt |
| Ẩn khung chat | Popup Messenger góc phải | Tắt |
| Ẩn bảng tin | Chế độ tập trung — ẩn toàn bộ feed | Tắt |
| Ẩn gợi ý | Nhóm / người bạn có thể biết | Tắt |
| Ẩn Watch | Lối tắt Video / Watch | Tắt |

Cài đặt được đồng bộ qua `chrome.storage.sync`.

## Cài đặt (chế độ developer)

1. Clone repo hoặc tải mã nguồn về máy.
2. Mở Chrome → `chrome://extensions`
3. Bật **Developer mode** (góc trên bên phải).
4. Chọn **Load unpacked** → trỏ vào thư mục gốc của repo (chứa `manifest.json`).
5. Mở [facebook.com](https://www.facebook.com), bấm icon extension trên thanh công cụ và bật/tắt từng mục.

Nếu vừa cài xong mà chưa thấy hiệu lực: reload lại tab Facebook.

## Cấu trúc

```
manifest.json
background/service-worker.js   # khởi tạo settings mặc định
content/content.js             # ẩn phần tử + theo dõi DOM
content/content.css            # CSS theo class trên <html>
popup/popup.html|css|js        # giao diện bật/tắt
icons/                         # icon 16 / 48 / 128
```

## Cách hoạt động

- Các khối ổn định (Stories, cột phải, Watch…) được ẩn bằng CSS dựa trên class gắn vào thẻ `<html>`.
- Quảng cáo và nội dung động được phát hiện bằng `MutationObserver`, dựa trên `aria-label`, `data-pagelet` và chữ «Sponsored» / «Được tài trợ» — tránh phụ thuộc class name bị Facebook đổi thường xuyên.

## Lưu ý

Facebook thay đổi DOM thường xuyên. Một số selector có thể cần cập nhật theo thời gian. Extension chỉ chạy trên `*.facebook.com`, `*.fb.com`, `*.messenger.com`.

## License

MIT
