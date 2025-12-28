# 🔄 HANDOVER: DRECS PROJECT

> **Ngày cập nhật:** 28/12/2025
> **Phiên bản:** 1.0
> **Repo:** https://github.com/nclamvn/drecs

---

## 📊 TRẠNG THÁI TỔNG QUAN

| Module | Status | Progress |
|--------|--------|----------|
| M1: rescue-portal | ✅ HOÀN THÀNH | 100% |
| M2: drone-edge | ⏳ CHƯA BẮT ĐẦU | 0% |
| M3: api-backend | ✅ HOÀN THÀNH | 100% |
| M4: command-dashboard | ✅ HOÀN THÀNH | 100% |

**Tổng tiến độ: 75% (3/4 modules)**

---

## ✅ ĐÃ HOÀN THÀNH

### M1: Rescue Portal (PWA)
- Captive Portal cho người dân
- Panic Button (1-tap emergency)
- Form thu thập thông tin
- GPS auto-detect
- Offline mode với Service Worker
- Mock mode để test

### M3: API Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- REST API đầy đủ endpoints
- WebSocket realtime
- Priority algorithm
- Fingerprint deduplication
- Docker setup cho database

### M4: Command Dashboard
- React + TypeScript + Vite
- Interactive map với Leaflet
- KPI Cards
- Rescue list với filters
- Assign mission modal
- Teams & Drones management
- WebSocket integration

---

## ⏳ CÔNG VIỆC CÒN LẠI

### M2: Drone Edge (Ưu tiên tiếp theo)
```
Mô tả: Python software chạy trên Raspberry Pi
- WiFi AP (hostapd + dnsmasq)
- HTTP Server (Flask/FastAPI)
- Queue Manager (SQLite)
- Uplink Manager (4G/Mesh/RTB)
- Heartbeat reporting
```

**Tech Stack:**
- Python 3.11+
- Flask hoặc FastAPI
- SQLite
- hostapd + dnsmasq

**Ước tính:** ~200 lines code chính

---

## 🚀 CÁCH CHẠY HỆ THỐNG

### Bước 1: Database
```bash
cd /Users/mac/AnhTrongMinh/api-backend
docker-compose up -d
```

### Bước 2: Backend API (Port 3001)
```bash
cd /Users/mac/AnhTrongMinh/api-backend
npm run dev
```

### Bước 3: Dashboard (Port 3005)
```bash
cd /Users/mac/AnhTrongMinh/command-dashboard
npm run dev
```

### Bước 4: Rescue Portal (Port 8000)
```bash
cd /Users/mac/AnhTrongMinh/rescue-portal
npx serve . -p 8000
```

---

## 🔗 LINKS

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3005 |
| API Backend | http://localhost:3001 |
| Rescue Portal | http://localhost:8000 |
| PostgreSQL | localhost:5433 |
| GitHub | https://github.com/nclamvn/drecs |

---

## 📁 CẤU TRÚC PROJECT

```
/Users/mac/AnhTrongMinh/
├── rescue-portal/          # M1: PWA
├── api-backend/            # M3: Backend
├── command-dashboard/      # M4: Dashboard
├── .gitignore
└── HANDOVER.md            # File này
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **PostgreSQL chạy trên port 5433** (không phải 5432) vì có local PostgreSQL conflict
2. **Dashboard port đã đổi thành 3005** theo yêu cầu
3. **API Backend có Mock data** - đã seed 5 teams, 4 drones, 3 rescue points
4. **Tất cả code đã push lên GitHub** - có thể pull về máy khác

---

## 🎯 KHI TIẾP TỤC (CONTINUE)

Nói **"tiếp tục"** hoặc **"continue"** để:

1. **Nếu muốn build M2 (drone-edge):**
   - Tạo Python project
   - Setup WiFi AP
   - HTTP Server
   - Queue management
   - Uplink logic

2. **Nếu muốn test/fix:**
   - Chạy lại các services
   - Test end-to-end flow
   - Fix bugs nếu có

3. **Nếu muốn deploy:**
   - Setup production environment
   - Docker compose cho tất cả services
   - SSL/HTTPS

---

## 📋 VIBECODE RULES (Nhắc lại)

Tôi là **THỢ XÂY** - tuân thủ Blueprint:
- ❌ KHÔNG thay đổi kiến trúc
- ❌ KHÔNG thêm features ngoài Blueprint
- ❌ KHÔNG đổi tech stack
- ✅ Gặp conflict → BÁO CÁO

---

## 🔑 CREDENTIALS (Dev only)

```
PostgreSQL:
  Host: localhost:5433
  User: drecs
  Pass: drecs_password
  DB: drecs_db

JWT Secret: your-super-secret-jwt-key-change-in-production
Drone API Key: drone-api-key-change-in-production
```

---

**Sẵn sàng tiếp tục bất cứ lúc nào!** 🚀
