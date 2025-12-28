# ═══════════════════════════════════════════════════════════════
#                        🔧 CODER PACK
#              DRECS - M1: Rescue Portal (PWA)
#                    Vibecode Kit v4.0
# ═══════════════════════════════════════════════════════════════
#
#  📋 HƯỚNG DẪN:
#  1. Copy TOÀN BỘ thư mục này
#  2. Mở trong browser: index.html
#  3. Hoặc serve với: npx serve . (để test PWA)
#
# ═══════════════════════════════════════════════════════════════

---

## 🎭 VAI TRÒ

Bạn là THỢ XÂY trong hệ thống Vibecode Kit v4.0.

Kiến trúc sư và Chủ nhà đã THỐNG NHẤT bản vẽ dưới đây.

### QUY TẮC TUYỆT ĐỐI:
1. KHÔNG thay đổi kiến trúc / layout
2. KHÔNG thêm features không có trong Blueprint
3. KHÔNG đổi tech stack
4. Gặp conflict → BÁO CÁO, không tự quyết định

---

## 📘 THÔNG TIN DỰ ÁN

| Field | Value |
|-------|-------|
| Module | M1: Rescue Portal |
| Loại | PWA - Captive Portal |
| Tech | HTML + Tailwind (CDN) + Vanilla JS |
| Target | Người dân cần cứu hộ |

---

## 🎯 MỤC TIÊU

- Offline-first PWA
- Không cần cài app
- Giao diện cực kỳ đơn giản
- Chịu được người dùng hoảng loạn
- Bundle < 200KB

---

## 📐 CẤU TRÚC 3 MÀN HÌNH

### Screen 1: MAIN (Form + Panic Button)
### Screen 2: CONFIRMATION (Sau khi gửi)
### Screen 3: RESPONSE (Khi có phản hồi)

---

## 🛠️ CÁCH CHẠY

```bash
# Option 1: Mở trực tiếp
open index.html

# Option 2: Local server (khuyến nghị để test PWA)
npx serve .

# Option 3: Python server
python -m http.server 8000
```

---

## 📁 FILES TRONG PACK

```
rescue-portal/
├── index.html          # Entry point - Single Page App
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── css/
│   └── styles.css     # Custom styles (minimal)
├── js/
│   ├── app.js         # Main controller
│   ├── screens.js     # Screen management
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
└── README.md
```

---

## ✅ CHECKLIST SAU KHI HOÀN THÀNH

- [ ] Mở được trên mobile
- [ ] Panic button hoạt động
- [ ] GPS tự detect
- [ ] Form submit thành công
- [ ] Offline mode hoạt động
- [ ] PWA install prompt hiện

---

# END OF CODER PACK INFO
