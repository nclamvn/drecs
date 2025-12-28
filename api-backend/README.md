# 🔧 DRECS API Backend

**Phiên bản:** 1.0  
**Module:** M3 - API Backend

Backend API cho hệ thống cứu hộ khẩn cấp DRECS.

---

## 🎯 Tổng quan

API Backend xử lý:

- Nhận và lưu trữ yêu cầu cứu hộ từ drone
- Tính toán độ ưu tiên cứu hộ
- Quản lý đội cứu hộ và nhiệm vụ
- Theo dõi trạng thái drone
- Gửi thông báo cho người dân
- Cung cấp dữ liệu realtime qua WebSocket

---

## 🚀 Cài đặt

### 1. Cài dependencies

```bash
npm install
```

### 2. Khởi động Database

```bash
# Sử dụng Docker
docker-compose up -d

# Hoặc cài PostgreSQL thủ công và tạo database
createdb drecs_db
```

### 3. Cấu hình môi trường

```bash
cp .env.example .env
# Sửa .env theo môi trường của bạn
```

### 4. Tạo database schema

```bash
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed sample data
```

### 5. Chạy server

```bash
# Development (với hot reload)
npm run dev

# Production
npm run build
npm start
```

Server chạy tại: http://localhost:3001

---

## 📡 API Endpoints

### Rescue Points (Điểm cứu hộ)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/rescue-points` | Tạo yêu cầu cứu hộ mới |
| GET | `/api/v1/rescue-points` | Danh sách điểm cứu hộ |
| GET | `/api/v1/rescue-points/:id` | Chi tiết 1 điểm |
| PATCH | `/api/v1/rescue-points/:id` | Cập nhật trạng thái |
| GET | `/api/v1/rescue-points/stats` | Thống kê |

### Teams (Đội cứu hộ)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/teams` | Danh sách đội |
| POST | `/api/v1/teams` | Tạo đội mới |
| GET | `/api/v1/teams/:id` | Chi tiết đội |
| PATCH | `/api/v1/teams/:id` | Cập nhật |
| GET | `/api/v1/teams/available` | Đội đang rảnh |

### Missions (Nhiệm vụ)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/missions` | Tạo nhiệm vụ (gán đội) |
| GET | `/api/v1/missions` | Danh sách nhiệm vụ |
| GET | `/api/v1/missions/:id` | Chi tiết nhiệm vụ |
| PATCH | `/api/v1/missions/:id` | Cập nhật tiến độ |
| GET | `/api/v1/missions/active` | Nhiệm vụ đang thực hiện |

### Drones

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/drones/heartbeat` | Drone gửi trạng thái |
| GET | `/api/v1/drones` | Danh sách drone |
| GET | `/api/v1/drones/:id` | Chi tiết drone |
| GET | `/api/v1/drones/stats` | Thống kê drone |

### Notifications

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/notifications` | Tạo thông báo |
| GET | `/api/v1/notifications/:requestId` | Lấy thông báo |
| POST | `/api/v1/notifications/acknowledge` | Xác nhận đã đọc |

### Health

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Health check cơ bản |
| GET | `/api/health/detailed` | Health check chi tiết |

---

## 🔌 WebSocket Events

Kết nối: `ws://localhost:3001/socket.io`

### Server → Client

| Event | Mô tả |
|-------|-------|
| `rescue:new` | Có yêu cầu cứu hộ mới |
| `rescue:updated` | Yêu cầu được cập nhật |
| `team:moved` | Đội cứu hộ di chuyển |
| `drone:status` | Drone cập nhật trạng thái |
| `mission:assigned` | Nhiệm vụ được gán |
| `mission:completed` | Nhiệm vụ hoàn thành |

### Client → Server

| Event | Mô tả |
|-------|-------|
| `subscribe:area` | Đăng ký theo dõi khu vực |
| `subscribe:rescue` | Theo dõi 1 điểm cứu hộ |
| `subscribe:drone` | Theo dõi 1 drone |

---

## 🧮 Priority Algorithm

```javascript
priority = (urgency × 30) 
         + (injured × 25) 
         + (water_level_score × 20) 
         + (no_food × 15) 
         + (people × 2) 
         - (distance_km × 5)
```

| Yếu tố | Điểm |
|--------|------|
| Urgency 3 (khẩn cấp) | +90 |
| Có thương | +25 |
| Nước >2m | +30 |
| Hết thức ăn | +15 |
| 10 người | +20 |
| Panic button | +50 |

---

## 📁 Cấu trúc thư mục

```
api-backend/
├── src/
│   ├── index.ts           # Entry point
│   ├── app.ts             # Express app
│   ├── config/
│   │   ├── env.ts         # Environment config
│   │   └── database.ts    # Prisma client
│   ├── routes/
│   │   ├── rescue-points.ts
│   │   ├── teams.ts
│   │   ├── missions.ts
│   │   ├── drones.ts
│   │   ├── notifications.ts
│   │   └── health.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── validate.ts
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   ├── services/
│   │   ├── priority.service.ts
│   │   └── realtime.service.ts
│   ├── schemas/
│   │   └── rescue-point.schema.ts
│   ├── websocket/
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       └── helpers.ts
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Seed data
├── docker-compose.yml     # PostgreSQL + Adminer
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🔒 Authentication

### Drone API Key

```http
X-Drone-Key: your-drone-api-key
X-Drone-Id: D01
```

### Dashboard JWT

```http
Authorization: Bearer <jwt-token>
```

---

## 🧪 Test

```bash
# Chạy tests
npm test

# Với coverage
npm run test:coverage
```

---

## 🛠️ Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Development với hot reload |
| `npm run build` | Build TypeScript |
| `npm start` | Production server |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Mở Prisma Studio |

---

## 📄 License

DRECS Project - Emergency Rescue System

---

*Được tạo bởi VIBECODE KIT v4.0*
