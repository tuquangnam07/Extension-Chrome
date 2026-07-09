
---

# 🚀 Garena Auto Register Pro v2.0

> **Tiện ích tự động đăng ký tài khoản Garena hàng loạt với xác thực OTP qua Gmail + Gửi log về Telegram**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/tuquangnam07/Extension-Chrome/tree/main/Garena%20Auto%20Register%20Pro%20Version%202.0.0)
[![Manifest](https://img.shields.io/badge/Manifest-v3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

---

## 📋 Tổng quan

**Garena Auto Register Pro v2.0** là phiên bản nâng cấp với hệ thống **Logger** và **Telegram Notification** giúp bạn theo dõi quá trình đăng ký từ xa một cách dễ dàng.

### 🎯 Tính năng mới v2.0

- 📨 **Gửi thông báo Telegram**: Nhận kết quả đăng ký ngay trên điện thoại
- 📝 **Hệ thống Logger**: Tự động tạo log chi tiết cho từng tài khoản
- 💾 **Lưu log local**: Lưu trữ log trong storage để xem lại sau
- 📎 **Gửi file log**: Tự động gửi file log qua Telegram
- 🔔 **Thông báo Batch**: Nhận thông báo khi bắt đầu và hoàn thành batch

---

## ✨ Tính năng nổi bật

- **Tự động hóa hoàn toàn**: Từ điền form, lấy OTP, đến xác nhận đăng ký
- **Xử lý hàng loạt**: Đăng ký nhiều tài khoản liên tục với interval tự động
- **Tự động F5**: Refresh trang sau mỗi tài khoản để reset form
- **Lưu trạng thái**: Khôi phục tiến độ khi extension bị đóng
- **Giao diện trực quan**: Popup hiển thị real-time stats và log chi tiết
- **Xóa email tự động**: Đánh dấu/xóa email Garena sau khi lấy OTP
- **📨 Telegram Integration**: Gửi thông báo kết quả qua Telegram Bot
- **📝 Logger chi tiết**: Ghi log từng bước cho mỗi tài khoản

---

## 🏗️ Kiến trúc

```
garena-auto-register-v2/
├── manifest.json          # Cấu hình extension (v3)
├── background.js          # Service worker - logic chính + tích hợp Telegram
├── content.js             # Content script - tương tác DOM Garena
├── popup.html             # Giao diện popup (có config Telegram)
├── popup.js               # Logic popup (quản lý Telegram config)
├── email_list.js          # Danh sách tài khoản và config Gmail
├── gmail.js               # Module lấy OTP và xóa email
├── logger.js              # 🆕 Hệ thống log chi tiết
├── telegram.js            # 🆕 Gửi thông báo qua Telegram Bot
└── README.md              # Tài liệu hướng dẫn
```

---

## 🔧 Cài đặt

### 1. Tải source code
```bash
git clone https://github.com/tuquangnam07/garena-auto-register-v2.git
cd garena-auto-register-v2
```

### 2. Cài đặt extension ở chế độ Developer
1. Mở Chrome và vào `chrome://extensions/`
2. Bật **Developer mode** (góc trên bên phải)
3. Click **Load unpacked**
4. Chọn thư mục chứa source code

### 3. Cấu hình Gmail (Quan trọng!)

Extension sử dụng **App Password** để truy cập Gmail:

1. Vào [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Đăng nhập và chọn:
   - **App**: `Mail`
   - **Device**: `Windows Computer`
3. Click **Generate** và copy mật khẩu 16 ký tự
4. Mở `email_list.js` và cập nhật:
   ```javascript
   export const GMAIL_CONFIG = {
     email: "your-email@gmail.com",
     password: "xxxx xxxx xxxx xxxx"  // App password mới tạo
   };
   ```

### 4. Cấu hình Telegram Bot (🆕)

Để nhận thông báo qua Telegram:

#### Bước 1: Tạo Bot
1. Mở Telegram, tìm **@BotFather**
2. Gửi lệnh: `/newbot`
3. Đặt tên bot và nhận **Bot Token** (ví dụ: `8893426208:AAGZb6FVaeF4X0ekIWSSw9uTDuyLAItqbQQ`)

#### Bước 2: Lấy Chat ID
1. Tìm **@userinfobot** trên Telegram
2. Gửi bất kỳ tin nhắn, bot sẽ trả về **Chat ID** (ví dụ: `7002992575`)

#### Bước 3: Cấu hình trong extension
1. Mở popup extension
2. Cuộn xuống phần **Cấu hình Telegram**
3. Nhập **Bot Token** và **Chat ID**
4. Click **💾 Lưu** và **📨 Test** để kiểm tra kết nối

### 5. Cấu hình danh sách tài khoản

Trong `email_list.js`, thêm tài khoản cần đăng ký:
```javascript
export const ACCOUNT_LIST = [
  {
    username: "your_username",
    password: "your_password",
    email: "your_email@domain.com"
  },
  // Thêm nhiều tài khoản...
];
```

---

## 🚀 Sử dụng

### Hướng dẫn nhanh

1. **Mở trang đăng ký Garena**: `https://sso.garena.com/register`
2. **Click icon extension** trên thanh công cụ Chrome
3. **Cấu hình Telegram** (nếu chưa có)
4. **Nhấn "BẮT ĐẦU"** để bắt đầu batch
5. **Theo dõi tiến trình** qua popup và Telegram

### Popup Interface

![Popup Interface](https://via.placeholder.com/450x600?text=Popup+v2.0)

Popup hiển thị:
- 📊 **Thống kê**: Thành công, thất bại, số còn lại
- 👤 **Tài khoản hiện tại**: Username đang xử lý
- 📝 **Log real-time**: Chi tiết từng bước xử lý
- 🎮 **Điều khiển**: Bắt đầu, Dừng, Reset
- 📨 **Telegram Config**: Cấu hình bot token và chat ID

### Các nút chức năng

| Nút | Chức năng |
|-----|-----------|
| **▶ BẮT ĐẦU** | Bắt đầu batch đăng ký với danh sách hiện tại |
| **⏹ DỪNG** | Dừng batch đang chạy |
| **🔄 RESET** | Reset danh sách về trạng thái ban đầu |
| **💾 Lưu** | Lưu cấu hình Telegram |
| **📨 Test** | Kiểm tra kết nối Telegram |

---

## 📝 Luồng hoạt động

```
1. Content script điền form (username, password, email)
   ↓
2. Click nút "NHẬN MÃ" (chỉ 1 lần duy nhất)
   ↓
3. Background đợi 30 giây cho OTP
   ↓
4. Gmail module lấy OTP từ email
   ↓
5. Điền OTP và click "Đăng Ký Ngay"
   ↓
6. Xóa email Garena để tránh đọc nhầm lần sau
   ↓
7. Logger ghi log chi tiết cho tài khoản
   ↓
8. Gửi thông báo Telegram (kết quả + file log)
   ↓
9. F5 trang và chuyển sang tài khoản tiếp theo
   ↓
10. Lặp lại cho đến hết danh sách
```

---

## 📨 Telegram Notifications

Extension sẽ gửi các thông báo sau qua Telegram:

### 1. Bắt đầu Batch
```html
🚀 BẮT ĐẦU BATCH ĐĂNG KÝ

📦 Số tài khoản: 5
⏰ Thời gian: 15/07/2024 14:30:25
```

### 2. Kết quả từng tài khoản
```html
🚀 GARENA AUTO REGISTER

📝 Tài khoản: tuquangnam07
🔑 Mật khẩu: tuquangnam07@
📧 Email: tuquangnam07@icloud.com
📊 Trạng thái: ✅ THÀNH CÔNG
⏰ Thời gian: 15/07/2024 14:31:15

📋 Log chi tiết:
[14:30:25] BẮT ĐẦU ĐĂNG KÝ: tuquangnam07
[14:30:25] ✅ Đã click NHẬN MÃ
[14:30:55] ✅ Đã lấy OTP: 123456
...
```

### 3. Hoàn thành Batch
```html
🎉 HOÀN THÀNH BATCH ĐĂNG KÝ

✅ Thành công: 4
❌ Thất bại: 1
📊 Tổng: 5
⏰ Hoàn thành: 15/07/2024 14:35:42
```

### 4. File Log (Tự động gửi)
Sau mỗi tài khoản, extension sẽ gửi file `.txt` chứa log chi tiết.

---

## ⚙️ Cấu hình nâng cao

### Điều chỉnh thời gian đợi

Trong `background.js`:
```javascript
// Thời gian đợi OTP (mặc định 30 giây)
await sleep(30000);

// Thời gian đợi sau mỗi tài khoản
await sleep(3000);
```

### Cấu hình Logger

Trong `logger.js`:
```javascript
// Giới hạn số lượng log (mặc định 10,000)
if (logEntries.length > 10000) {
  logEntries = logEntries.slice(-5000);
}

// Xóa log cũ (mặc định 7 ngày)
export async function clearOldLogs(days = 7)
```

### Cấu hình Telegram

Trong `telegram.js` (hoặc qua popup):
```javascript
let TELEGRAM_CONFIG = {
  botToken: 'YOUR_BOT_TOKEN',
  chatId: 'YOUR_CHAT_ID'
};
```

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi "Sai mật khẩu ứng dụng"
- **Nguyên nhân**: App password không đúng hoặc chưa được tạo
- **Giải pháp**: Tạo lại App Password trên Google và cập nhật trong `email_list.js`

### Lỗi Telegram "Unauthorized"
- **Nguyên nhân**: Bot Token hoặc Chat ID sai
- **Giải pháp**: Kiểm tra lại token từ @BotFather và chat ID từ @userinfobot

### Không nhận được thông báo Telegram
- **Nguyên nhân**: Chưa cấu hình hoặc bot bị block
- **Giải pháp**: 
  1. Mở popup, kiểm tra phần Telegram config
  2. Click "Test" để kiểm tra kết nối
  3. Đảm bảo đã start bot (gửi `/start` cho bot)

### Log quá dài không gửi được
- **Nguyên nhân**: Telegram giới hạn 4096 ký tự
- **Giải pháp**: Extension tự động cắt log khi vượt quá 3000 ký tự

---

## 📦 Đóng góp

Mọi đóng góp đều được hoan nghênh! 

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 🔒 Bảo mật

- **App Password**: Sử dụng mật khẩu ứng dụng thay vì mật khẩu chính Gmail
- **Local storage**: Thông tin chỉ lưu trên máy local
- **No tracking**: Không gửi dữ liệu ra ngoài (trừ Telegram đã cấu hình)

> ⚠️ **Cảnh báo**: Extension này chỉ nên sử dụng cho mục đích học tập và tự động hóa cá nhân. Không sử dụng để tạo tài khoản spam hoặc vi phạm điều khoản dịch vụ của Garena.

---

## 📊 Changelog

### v2.0.0 (7/2026)
- 🎉 Tích hợp hệ thống Logger chi tiết
- 📨 Tích hợp Telegram Bot Notification
- 💾 Lưu và xuất log file
- 🔔 Thông báo batch start/complete
- 📎 Gửi file log qua Telegram
- 🎨 Cập nhật giao diện popup với Telegram config

### v1.0.0 (6/2026)
- 🚀 Tự động đăng ký tài khoản Garena
- 🔐 Lấy OTP từ Gmail qua Atom Feed
- 📦 Đăng ký hàng loạt
- 🗑️ Xóa email tự động

---

## 📧 Liên hệ

- **Tác giả**: tuquangnam07
- **GitHub**: [@tuquangnam07](https://github.com/tuquangnam07)

---

<div align="center">
  <sub>Built with ❤️ for automation enthusiasts</sub>
</div>
