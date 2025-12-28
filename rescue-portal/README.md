# 🆘 DRECS Rescue Portal

**Phiên bản:** 1.0  
**Module:** M1 - Rescue Portal (PWA)

Giao diện người dân cho hệ thống cứu hộ khẩn cấp DRECS.

---

## 🎯 Tổng quan

Rescue Portal là PWA (Progressive Web App) được thiết kế để:

- Hoạt động **offline-first** - không cần Internet liên tục
- **Không cần cài đặt** - mở trình duyệt là dùng được
- **Giao diện cực kỳ đơn giản** - phù hợp người dùng hoảng loạn
- **Nhẹ** - dưới 200KB, load nhanh trên mạng yếu

---

## 🚀 Cách chạy

### Option 1: Mở trực tiếp (đơn giản nhất)

```bash
# Mở file index.html trong trình duyệt
open index.html
# hoặc
xdg-open index.html  # Linux
start index.html     # Windows
```

### Option 2: Local server (khuyến nghị để test PWA)

```bash
# Dùng npx serve
npx serve .

# Hoặc Python
python -m http.server 8000

# Hoặc PHP
php -S localhost:8000
```

Sau đó mở: http://localhost:8000

### Option 3: Deploy lên drone

Copy toàn bộ thư mục vào `/var/www/html` trên drone edge.

---

## 📱 Tính năng

### 1. Panic Button
- Nút đỏ lớn chiếm 50% màn hình
- 1 tap = gửi GPS + mức khẩn cấp tối đa
- Dành cho trường hợp quá hoảng loạn

### 2. Form chi tiết
- Vị trí (GPS tự động)
- Số người cần cứu
- Mức độ khẩn cấp
- Có người bị thương?
- Mực nước hiện tại
- Còn lương thực?
- Số điện thoại (tùy chọn)

### 3. Offline mode
- Dữ liệu được cache bởi Service Worker
- Yêu cầu được lưu vào queue nếu offline
- Tự động gửi khi có mạng

### 4. Nhận phản hồi
- Hiển thị thời gian đội cứu hộ đến
- Hướng dẫn chuẩn bị
- Push notification (nếu được phép)

---

## 📁 Cấu trúc thư mục

```
rescue-portal/
├── index.html          # Entry point - SPA
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── css/
│   └── styles.css     # Custom styles
├── js/
│   ├── app.js         # Main controller
│   ├── screens.js     # Screen navigation
│   ├── form.js        # Form handling
│   ├── gps.js         # GPS utilities
│   ├── storage.js     # LocalStorage queue
│   ├── api.js         # API client
│   └── i18n.js        # Vietnamese text
├── assets/
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── favicon.ico
├── CODER-PACK.md      # Hướng dẫn cho coder
└── README.md          # File này
```

---

## 🔌 Tích hợp với Drone

### API Endpoints cần có từ drone:

```
POST /api/rescue-request
Body: {
  lat, lng, people, urgency, injured,
  water_level, food_available, phone, timestamp
}
Response: { success, request_id, message }

GET /api/notifications/:request_id
Response: {
  request_id, type, eta_minutes, team_type,
  direction, message, instructions[]
}

POST /api/acknowledge
Body: { request_id, acknowledged_at }
```

### Mock Mode

File `api.js` có `MOCK_MODE = true` để test mà không cần drone thật.
Đổi thành `false` khi deploy.

---

## 🧪 Test checklist

- [ ] Mở trên mobile (Chrome/Safari)
- [ ] Panic button hoạt động
- [ ] GPS tự detect
- [ ] Form submit thành công
- [ ] Hiển thị màn confirmation
- [ ] Offline mode hoạt động (tắt WiFi, thử submit)
- [ ] PWA install prompt hiện (trên mobile)
- [ ] Service Worker đăng ký thành công

---

## 🔧 Customize

### Đổi màu

Sửa trong `index.html`:
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                danger: '#DC2626',  // Đổi màu đỏ
                primary: '#2563EB', // Đổi màu xanh
            }
        }
    }
}
```

### Đổi API endpoint

Sửa trong `js/api.js`:
```javascript
const API_CONFIG = {
    baseUrl: 'http://your-drone-ip',
    ...
};
```

### Tắt Mock Mode

Sửa trong `js/api.js`:
```javascript
const MOCK_MODE = false;
```

---

## 📝 Ghi chú kỹ thuật

- **Không dùng framework** - Vanilla JS để giảm bundle size
- **Tailwind via CDN** - Không cần build step
- **Service Worker** - Cache tất cả assets
- **LocalStorage** - Queue requests khi offline
- **No build step** - Copy & paste để deploy

---

## 🆘 Troubleshooting

### GPS không hoạt động

1. Kiểm tra trình duyệt cho phép truy cập vị trí
2. Thử trên HTTPS (required cho GPS trên một số browser)
3. Cho phép nhập tọa độ tay

### PWA không cài được

1. Cần serve qua HTTPS
2. Kiểm tra manifest.json valid
3. Kiểm tra Service Worker đăng ký thành công

### Offline mode không hoạt động

1. Mở DevTools > Application > Service Workers
2. Kiểm tra SW đã registered
3. Kiểm tra Cache Storage có files

---

## 📄 License

DRECS Project - Emergency Rescue System

---

*Được tạo bởi VIBECODE KIT v4.0*
