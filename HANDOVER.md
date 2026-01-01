# HANDOVER: DRECS PROJECT v2.0

> **Ngày cập nhật:** 01/01/2026
> **Phiên bản:** 2.0 (Multi-Link Communication)
> **Repo:** https://github.com/nclamvn/drecs

---

## TRẠNG THÁI TỔNG QUAN

| Module | Status | Progress |
|--------|--------|----------|
| M1: rescue-portal | HOÀN THÀNH | 100% |
| M2: drone-edge | CONTRACT READY | 0% |
| M3: api-backend | HOÀN THÀNH (cần update) | 100% |
| M4: command-dashboard | HOÀN THÀNH | 100% |
| M5: lora-gateway-fixed | CONTRACT READY | 0% |
| M6: lora-gateway-mobile | CONTRACT READY | 0% |

**Tổng tiến độ: 50% (3/6 modules)**

---

## KIẾN TRÚC v2.0 - MULTI-LINK COMMUNICATION

```
                          VÙNG LŨ (Disaster Zone)

   User ---WiFi---> DRONE (Edge Node)
                         |
                         |---(1) LoRaWAN ---> Gateway Fixed (HQ)
                         |                          |
                         |---(2) LoRaWAN ---> Gateway Mobile (Xe cứu hộ)
                         |                          |
                         |---(3) 4G/LTE ----------> Internet
                         |                          |
                         |---(4) Mesh -------> Drone khác ---> (1,2,3)
                                                    |
                                               +---------+
                                               |   HQ    |
                                               | Backend |
                                               |Dashboard|
                                               +---------+
```

### 4 Kênh truyền thông:

| # | Kênh | Priority | Data | Range |
|---|------|----------|------|-------|
| 1 | LoRaWAN -> Gateway Fixed | Primary | 31 bytes | 2-15km |
| 2 | LoRaWAN -> Gateway Mobile | Backup | 31 bytes | 2-15km |
| 3 | 4G/LTE | Full Sync | Unlimited | BTS |
| 4 | Drone Mesh | Last Resort | 31 bytes | 1-5km |

---

## ĐÃ HOÀN THÀNH

### M1: Rescue Portal (PWA)
- Captive Portal cho người dân
- Panic Button (1-tap emergency)
- Form thu thập thông tin
- GPS auto-detect
- Offline mode với Service Worker

### M3: API Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- REST API đầy đủ endpoints
- WebSocket realtime
- Priority algorithm
- Fingerprint deduplication

### M4: Command Dashboard
- React + TypeScript + Vite
- Interactive map với Leaflet
- KPI Cards
- Rescue list với filters
- Assign mission modal
- Teams & Drones management

---

## CONTRACTS ĐÃ TẠO (Sẵn sàng build)

### contracts/CONTRACT_M2_DRONE_EDGE.md
- Python software cho Raspberry Pi
- Multi-link communication (LoRa + 4G + Mesh)
- WiFi Hotspot + Captive Portal
- Smart Failover Logic
- **~830 lines of code**

### contracts/CONTRACT_M3_BACKEND_UPDATE.md
- LoRa ingestion endpoint
- Multi-source deduplication
- Gateway management API
- **~410 lines of code**

### contracts/CONTRACT_M5_LORA_GATEWAY_FIXED.md
- ChirpStack setup (Docker)
- MQTT -> Backend Bridge
- Monitoring dashboard
- **~22 hours work**

### contracts/CONTRACT_M6_LORA_GATEWAY_MOBILE.md
- Portable Raspberry Pi kit
- Solar/Battery powered
- 4G Backhaul
- **~32 hours work**

---

## CÁCH CHẠY HỆ THỐNG (v1.0)

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

## LINKS

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3005 |
| API Backend | http://localhost:3001 |
| Rescue Portal | http://localhost:8000 |
| PostgreSQL | localhost:5433 |
| GitHub | https://github.com/nclamvn/drecs |

---

## CẤU TRÚC PROJECT

```
/Users/mac/AnhTrongMinh/
├── rescue-portal/              # M1: PWA (DONE)
├── api-backend/                # M3: Backend (DONE, needs update)
├── command-dashboard/          # M4: Dashboard (DONE)
├── contracts/                  # Contracts for all modules
│   ├── CONTRACT_M2_DRONE_EDGE.md
│   ├── CONTRACT_M3_BACKEND_UPDATE.md
│   ├── CONTRACT_M5_LORA_GATEWAY_FIXED.md
│   └── CONTRACT_M6_LORA_GATEWAY_MOBILE.md
├── drone-edge/                 # M2: (TO BE CREATED)
├── lora-gateway-fixed/         # M5: (TO BE CREATED)
├── lora-gateway-mobile/        # M6: (TO BE CREATED)
├── .gitignore
└── HANDOVER.md
```

---

## LƯU Ý QUAN TRỌNG

1. **PostgreSQL chạy trên port 5433** (không phải 5432)
2. **Dashboard port: 3005**
3. **API có Mock data** - 5 teams, 4 drones, 3 rescue points
4. **Contracts đã được phê duyệt** - sẵn sàng build

---

## KHI TIẾP TỤC (CONTINUE)

### Option 1: Build M2 (Drone Edge)
```
Đọc: contracts/CONTRACT_M2_DRONE_EDGE.md
Tạo: drone-edge/ với Python project
Implement: WiFi, HTTP Server, Queue, Links
```

### Option 2: Update M3 (Backend)
```
Đọc: contracts/CONTRACT_M3_BACKEND_UPDATE.md
Thêm: LoRa routes, Gateway service
Update: Prisma schema
```

### Option 3: Build M5 (Gateway Fixed)
```
Đọc: contracts/CONTRACT_M5_LORA_GATEWAY_FIXED.md
Setup: ChirpStack Docker
Create: Bridge script
```

### Option 4: Build M6 (Gateway Mobile)
```
Đọc: contracts/CONTRACT_M6_LORA_GATEWAY_MOBILE.md
Assemble: Hardware
Install: Software
```

---

## HARDWARE BOM (Bill of Materials)

### Per Drone Unit: $210
- Raspberry Pi 4 (4GB): $55
- LoRa HAT: $40
- 4G Module: $45
- GPS Module: $15
- WiFi Adapter: $10
- Power Management: $25
- Case + Cables: $20

### Gateway Fixed: $300
- RAK7268: $180
- Antenna: $30
- Mounting: $40
- UPS: $50

### Gateway Mobile: $380
- Raspberry Pi 4: $55
- RAK2247: $100
- SIM7600: $45
- Solar + Battery: $70
- Antenna + Case: $110

### Total System (5 drones, 1 fixed, 2 mobile):
- 5x Drone: $1,050
- 1x Fixed Gateway: $300
- 2x Mobile Gateway: $760
- Spare parts: $200
- **TOTAL: $2,310**

---

## CREDENTIALS (Dev only)

```
PostgreSQL:
  Host: localhost:5433
  User: drecs
  Pass: drecs_password
  DB: drecs_db

JWT Secret: your-super-secret-jwt-key-change-in-production
Drone API Key: drone-api-key-change-in-production
LoRa Gateway Key: lora-gateway-api-key (NEW)
```

---

## VIBECODE RULES

Tuân thủ Blueprint (Contracts):
- KHÔNG thay đổi kiến trúc
- KHÔNG thêm features ngoài Contract
- KHÔNG đổi tech stack
- Gặp conflict -> BÁO CÁO

---

**Sẵn sàng tiếp tục!**
