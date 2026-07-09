# 🚀 Garena Auto Register Pro

> **Tiện ích tự động đăng ký tài khoản Garena hàng loạt với xác thực OTP qua Gmail**

[![Version](https://img.shields.io/badge/version-4.1-blue.svg)](https://github.com/yourusername/garena-auto-register)
[![Manifest](https://img.shields.io/badge/Manifest-v3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

## 📋 Tổng quan

**Garena Auto Register Pro** là một extension Chrome tự động hóa quy trình đăng ký tài khoản Garena. Extension này hỗ trợ:

- ⚡ Tự động điền thông tin đăng ký
- 🔐 Tự động lấy mã OTP từ Gmail qua IMAP/Atom Feed
- 📦 Đăng ký hàng loạt với danh sách tài khoản
- 🗑️ Tự động xóa email Garena sau khi đọc để tránh nhầm lẫn
- 📊 Theo dõi tiến độ real-time qua popup

## ✨ Tính năng nổi bật

- **Tự động hóa hoàn toàn**: Từ điền form, lấy OTP, đến xác nhận đăng ký
- **Xử lý hàng loạt**: Đăng ký nhiều tài khoản liên tục với interval tự động
- **Tự động F5**: Refresh trang sau mỗi tài khoản để reset form
- **Lưu trạng thái**: Khôi phục tiến độ khi extension bị đóng
- **Giao diện trực quan**: Popup hiển thị real-time stats và log chi tiết
- **Xóa email tự động**: Đánh dấu/xóa email Garena sau khi lấy OTP

## 🏗️ Kiến trúc

```
garena-auto-register/
├── manifest.json          # Cấu hình extension
├── background.js           # Service worker - xử lý logic chính
├── content.js              # Content script - tương tác với DOM Garena
├── popup.html              # Giao diện popup
├── popup.js                # Logic popup
├── email_list.js           # Danh sách tài khoản và config Gmail
├── gmail.js                # Module lấy OTP và xóa email
└── README.md               # Tài liệu hướng dẫn
```

## 🔧 Cài đặt

### 1. Tải source code
```bash
git clone https://github.com/yourusername/garena-auto-register.git
cd garena-auto-register
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

### 4. Cấu hình danh sách tài khoản

Trong `email_list.js`, thêm tài khoản cần đăng ký:
```javascript
export const ACCOUNT_LIST = [
  {
    username: "your_username",
    password: "your_password",
    email: "your_email@domain.com"  // Email nhận OTP (có thể khác Gmail chính)
  },
  // Thêm nhiều tài khoản...
];
```

> **Lưu ý**: `email` trong ACCOUNT_LIST là email nhận OTP từ Garena, có thể khác với `GMAIL_CONFIG.email` (email dùng để lấy OTP).

## 🚀 Sử dụng

### Hướng dẫn nhanh

1. **Mở trang đăng ký Garena**: `https://sso.garena.com/register`
2. **Click icon extension** trên thanh công cụ Chrome
3. **Nhấn "BẮT ĐẦU"** để bắt đầu batch
4. **Theo dõi tiến trình** qua popup

### Popup Interface

![Popup Interface](https://via.placeholder.com/420x500?text=Popup+Preview)

Popup hiển thị:
- 📊 **Thống kê**: Thành công, thất bại, số còn lại
- 👤 **Tài khoản hiện tại**: Username và email đang xử lý
- 📝 **Log real-time**: Chi tiết từng bước xử lý
- 🎮 **Điều khiển**: Bắt đầu, Dừng, Reset

### Các nút chức năng

| Nút | Chức năng |
|-----|-----------|
| **▶ BẮT ĐẦU** | Bắt đầu batch đăng ký với danh sách hiện tại |
| **⏹ DỪNG** | Dừng batch đang chạy |
| **🔄 RESET** | Reset danh sách về trạng thái ban đầu |

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
7. F5 trang và chuyển sang tài khoản tiếp theo
   ↓
8. Lặp lại cho đến hết danh sách
```

## ⚙️ Cấu hình nâng cao

### Điều chỉnh thời gian đợi

Trong `background.js`, bạn có thể điều chỉnh:
```javascript
// Thời gian đợi OTP (mặc định 30 giây)
await sleep(30000);

// Thời gian đợi sau mỗi tài khoản
await sleep(3000);
```

### Thay đổi số lần thử lấy OTP

```javascript
// background.js - Tăng số lần thử nếu cần
for (let i = 0; i < 6; i++) {  // Mặc định 6 lần
  otp = await getOTPFromGmail(...);
  if (otp) break;
  await sleep(5000);
}
```

## 🔒 Bảo mật

- **App Password**: Sử dụng mật khẩu ứng dụng thay vì mật khẩu chính Gmail
- **Local storage**: Thông tin chỉ lưu trên máy local
- **No tracking**: Không gửi dữ liệu ra ngoài

> ⚠️ **Cảnh báo**: Extension này chỉ nên sử dụng cho mục đích học tập và tự động hóa cá nhân. Không sử dụng để tạo tài khoản spam hoặc vi phạm điều khoản dịch vụ của Garena.

## 🐛 Xử lý lỗi thường gặp

### Lỗi "Sai mật khẩu ứng dụng"
- **Nguyên nhân**: App password không đúng hoặc chưa được tạo
- **Giải pháp**: Tạo lại App Password trên Google và cập nhật trong `email_list.js`

### Lỗi "Không tìm thấy nút NHẬN MÃ"
- **Nguyên nhân**: Garena thay đổi giao diện hoặc trang chưa load xong
- **Giải pháp**: Refresh trang và thử lại, hoặc kiểm tra URL có đúng là trang đăng ký không

### Không lấy được OTP
- **Nguyên nhân**: Email OTP chưa đến hoặc bị spam
- **Giải pháp**: Tăng thời gian đợi hoặc số lần thử trong `background.js`

## 📦 Đóng góp

Mọi đóng góp đều được hoan nghênh! 

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📧 Liên hệ

- **Tác giả**: tuquangnam07
- **GitHub**: [yourusername](https://github.com/tuquangnam07)

---

<div align="center">
  <sub>Built with ❤️ for automation enthusiasts</sub>
</div>
