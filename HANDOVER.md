# HANDOVER: DRECS PROJECT v2.0

> **Ngay cap nhat:** 01/01/2026
> **Phien ban:** 2.0 (Multi-Link Communication + Mock Mode)
> **Repo:** https://github.com/nclamvn/drecs

---

## TRANG THAI TONG QUAN

| Module | Status | Progress |
|--------|--------|----------|
| M1: rescue-portal | HOAN THANH | 100% |
| M2: drone-edge | CONTRACT READY | 0% |
| M3: api-backend | **HOAN THANH + MOCK MODE** | 100% |
| M4: command-dashboard | **HOAN THANH + RESPONSIVE** | 100% |
| M5: lora-gateway-fixed | CONTRACT READY | 0% |
| M6: lora-gateway-mobile | CONTRACT READY | 0% |

**Tong tien do: 67% (4/6 modules)**

---

## TINH NANG MOI - SESSION NAY

### 1. MOCK MODE (Quan trong!)
- **Tat ca features hoat dong KE CA KHI KHONG CO DATABASE**
- Mock data tu dong khi DB unavailable
- Response tra ve `"mode": "mock"` de biet dang dung mock
- Auto-reconnect khi DB quay lai (30s interval)

### 2. M3 Backend Update (HOAN THANH)
- LoRa ingestion endpoint: `POST /api/rescues/lora`
- Gateway management: `GET/POST /api/gateways`
- Multi-source tracking (RescueSource model)
- Mock service voi 4 rescue points, 5 teams, 4 drones, 3 gateways

### 3. UI Fixes
- Responsive layout tren Settings page
- Dropdown width fix ("Cao -> Thap")
- CORS ho tro nhieu ports

---

## KIEN TRUC v2.0 - MULTI-LINK COMMUNICATION

```
                          VUNG LU (Disaster Zone)

   User ---WiFi---> DRONE (Edge Node)
                         |
                         |---(1) LoRaWAN ---> Gateway Fixed (HQ)
                         |                          |
                         |---(2) LoRaWAN ---> Gateway Mobile (Xe cuu ho)
                         |                          |
                         |---(3) 4G/LTE ----------> Internet
                         |                          |
                         |---(4) Mesh -------> Drone khac ---> (1,2,3)
                                                    |
                                               +---------+
                                               |   HQ    |
                                               | Backend |
                                               |Dashboard|
                                               +---------+
```

---

## CACH CHAY HE THONG

### KHONG CAN DATABASE (Mock Mode)
```bash
# Terminal 1: Backend (Port 3002)
cd /Users/mac/AnhTrongMinh/api-backend
npm run dev

# Terminal 2: Dashboard (Port 3005)
cd /Users/mac/AnhTrongMinh/command-dashboard
npm run dev

# Terminal 3: Rescue Portal (Port 65235)
cd /Users/mac/AnhTrongMinh/rescue-portal
npx serve . -p 65235
```

### VOI DATABASE (Full Mode)
```bash
# Buoc 0: Start PostgreSQL
cd /Users/mac/AnhTrongMinh/api-backend
docker-compose up -d

# Sau do chay Backend va Dashboard nhu tren
```

---

## PORTS HIEN TAI

| Service | Port | URL |
|---------|------|-----|
| API Backend | 3002 | http://localhost:3002 |
| Command Dashboard | 3005 | http://localhost:3005 |
| Rescue Portal | 65235 | http://localhost:65235 |
| PostgreSQL | 5433 | localhost:5433 |

**LUU Y:** Port 3000, 3001 da duoc su dung boi ung dung khac

---

## CAU TRUC PROJECT

```
/Users/mac/AnhTrongMinh/
├── rescue-portal/              # M1: PWA (DONE)
├── api-backend/                # M3: Backend (DONE + MOCK MODE)
│   ├── src/
│   │   ├── services/
│   │   │   ├── mock.service.ts    # NEW: Mock data
│   │   │   ├── gateway.service.ts # NEW: Gateway management
│   │   │   └── priority.service.ts
│   │   ├── routes/
│   │   │   ├── lora.ts            # NEW: LoRa ingestion
│   │   │   ├── gateways.ts        # NEW: Gateway CRUD
│   │   │   └── rescue-points.ts   # Updated with mock fallback
│   │   ├── middlewares/
│   │   │   └── loraAuth.ts        # NEW: LoRa authentication
│   │   └── config/
│   │       └── database.ts        # Updated: graceful DB failure
│   └── .env                       # Updated CORS origins
├── command-dashboard/          # M4: Dashboard (DONE + RESPONSIVE)
│   └── src/pages/
│       └── SettingsPage.tsx    # Fixed: responsive layout
├── contracts/                  # Contracts for remaining modules
│   ├── CONTRACT_M2_DRONE_EDGE.md
│   ├── CONTRACT_M3_BACKEND_UPDATE.md
│   ├── CONTRACT_M5_LORA_GATEWAY_FIXED.md
│   └── CONTRACT_M6_LORA_GATEWAY_MOBILE.md
├── .gitignore
└── HANDOVER.md
```

---

## MOCK DATA CO SAN

### Rescue Points (4)
| ID | Urgency | Status | People |
|----|---------|--------|--------|
| rp-001 | 3 (Critical) | PENDING | 5 |
| rp-002 | 2 (Medium) | ASSIGNED | 3 |
| rp-003 | 3 (Critical) | IN_PROGRESS | 8 |
| rp-004 | 1 (Low) | PENDING | 2 |

### Teams (5)
- Doi Ca no 1 (AVAILABLE)
- Doi Ca no 2 (BUSY)
- Doi Y te (AVAILABLE)
- Doi Bo doi (AVAILABLE)
- Doi Tinh nguyen (BUSY)

### Drones (4)
- DRONE-001 (ACTIVE, 85%)
- DRONE-002 (ACTIVE, 72%)
- DRONE-003 (IDLE, 95%)
- DRONE-004 (OFFLINE, 15%)

### Gateways (3)
- GW-FIXED-001 (HQ, ONLINE)
- GW-MOBILE-001 (Mobile, ONLINE)
- GW-MOBILE-002 (Mobile, OFFLINE)

---

## API ENDPOINTS

### Rescue Points
```
GET  /api/v1/rescue-points     # List all (mock or DB)
POST /api/v1/rescue-points     # Create new
GET  /api/v1/rescue-points/:id # Get one
PUT  /api/v1/rescue-points/:id # Update
```

### LoRa Ingestion (NEW)
```
POST /api/rescues/lora
Headers:
  X-Gateway-Key: lora-gateway-api-key-change-in-production
  X-Source: lora_fixed | lora_mobile

Body: { lat, lng, people, urgency, injured, phone, ... }
```

### Gateways (NEW)
```
GET  /api/gateways             # List all
POST /api/gateways             # Register new
PUT  /api/gateways/:id/status  # Update status
```

### Teams & Drones
```
GET /api/v1/teams
GET /api/v1/drones
GET /api/v1/drones/stats
```

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
LoRa Gateway Key: lora-gateway-api-key-change-in-production
```

---

## KHI TIEP TUC (NEXT STEPS)

### Option 1: Build M2 (Drone Edge) - RECOMMENDED
```
Doc: contracts/CONTRACT_M2_DRONE_EDGE.md
Tao: drone-edge/ voi Python project
Implement: WiFi Hotspot, HTTP Server, LoRa Links, 4G Fallback
Hardware: Raspberry Pi 4 + LoRa HAT + 4G Module
```

### Option 2: Build M5 (Gateway Fixed)
```
Doc: contracts/CONTRACT_M5_LORA_GATEWAY_FIXED.md
Setup: ChirpStack Docker
Hardware: RAK7268 Gateway
```

### Option 3: Build M6 (Gateway Mobile)
```
Doc: contracts/CONTRACT_M6_LORA_GATEWAY_MOBILE.md
Hardware: Raspberry Pi + RAK2247 + Solar
```

### Option 4: Test Full System
```
1. Chay Backend + Dashboard (mock mode)
2. Mo Dashboard: http://localhost:3005
3. Test cac chuc nang: Map, Rescue List, Teams, Drones
4. Kiem tra responsive tren cac man hinh
```

---

## GIT COMMITS GAN DAY

```
e6845ac Fix responsive layout on Settings page
adcf39c DRECS v2.0: Multi-link communication & Mock mode
d7cbe44 Add HANDOVER.md for project continuity
d609998 Initial commit: DRECS - Drone Relay Emergency Coordination System
```

---

## LUU Y QUAN TRONG

1. **Mock Mode mac dinh** - Khong can database de test
2. **Port 3002** cho Backend (khong phai 3001)
3. **Port 3005** cho Dashboard
4. **PostgreSQL port 5433** (khong phai 5432)
5. **curl dung --http1.1** neu gap loi exit code 52

---

## VIBECODE RULES

Tuan thu Blueprint (Contracts):
- KHONG thay doi kien truc
- KHONG them features ngoai Contract
- KHONG doi tech stack
- Gap conflict -> BAO CAO

---

**San sang tiep tuc! Chi can noi "doc handover de tiep tuc"**
