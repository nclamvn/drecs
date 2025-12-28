# 🖥️ DRECS Command Dashboard

**Phiên bản:** 1.0  
**Module:** M4 - Command Dashboard

Dashboard điều hành cho hệ thống cứu hộ khẩn cấp DRECS.

---

## 🎯 Tổng quan

Dashboard cung cấp:

- **Bản đồ realtime** - Xem vị trí điểm cứu hộ, đội, drone
- **Danh sách ưu tiên** - Sắp xếp theo điểm priority
- **Gán nhiệm vụ** - Chọn đội cứu hộ cho điểm cần cứu
- **Theo dõi drone** - Trạng thái, pin, số người kết nối
- **Realtime updates** - Cập nhật qua WebSocket

---

## 🚀 Cài đặt

### 1. Cài dependencies

```bash
cd command-dashboard
npm install
```

### 2. Chạy development server

```bash
npm run dev
```

Dashboard chạy tại: http://localhost:3000

### 3. Build production

```bash
npm run build
npm run preview
```

---

## 📁 Cấu trúc thư mục

```
command-dashboard/
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Routes setup
│   ├── index.css          # Global styles + Tailwind
│   ├── components/
│   │   ├── layout/        # Sidebar, Header, MainLayout
│   │   ├── dashboard/     # KPICards
│   │   ├── map/           # RescueMap với Leaflet
│   │   └── rescue/        # RescueList, AssignModal
│   ├── pages/
│   │   ├── Overview.tsx
│   │   ├── MapView.tsx
│   │   ├── RescueListPage.tsx
│   │   ├── TeamsPage.tsx
│   │   ├── DronesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── stores/            # Zustand stores
│   ├── services/          # API, WebSocket
│   ├── types/             # TypeScript types
│   └── utils/             # Helpers, constants
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔌 Kết nối với Backend

Dashboard tự động proxy requests đến backend:

```typescript
// vite.config.ts
proxy: {
  '/api': 'http://localhost:3001',
  '/socket.io': { target: 'http://localhost:3001', ws: true }
}
```

**Yêu cầu:** M3 (api-backend) phải chạy tại port 3001.

---

## 🗺️ Các trang

| Route | Trang | Mô tả |
|-------|-------|-------|
| `/` | Overview | Tổng quan, KPIs, mini map |
| `/map` | Map View | Bản đồ toàn màn hình |
| `/rescue` | Rescue List | Danh sách đầy đủ với filters |
| `/teams` | Teams | Quản lý đội cứu hộ |
| `/drones` | Drones | Theo dõi drone |
| `/settings` | Settings | Trạng thái hệ thống |

---

## 🎨 Design System

### Colors

- **Primary:** `#1E40AF` (Blue)
- **Danger:** `#DC2626` (Red)
- **Success:** `#059669` (Green)
- **Warning:** `#D97706` (Yellow)

### Status Badges

| Status | Color | CSS Class |
|--------|-------|-----------|
| PENDING | Red | `badge-pending` |
| ASSIGNED | Yellow | `badge-assigned` |
| IN_PROGRESS | Blue | `badge-in-progress` |
| RESCUED | Green | `badge-rescued` |

---

## 📡 WebSocket Events

Dashboard lắng nghe các events:

```typescript
socket.on('rescue:new', ...)      // Điểm mới
socket.on('rescue:updated', ...)  // Cập nhật
socket.on('team:moved', ...)      // Đội di chuyển
socket.on('drone:status', ...)    // Drone status
socket.on('mission:assigned', ...)
socket.on('mission:completed', ...)
```

---

## 🧪 Test

Để test với data mẫu:

1. Chạy M3 backend: `cd api-backend && npm run dev`
2. Seed data: `npm run db:seed`
3. Chạy dashboard: `cd command-dashboard && npm run dev`
4. Mở http://localhost:3000

---

## 📝 Ghi chú

- Sử dụng **Leaflet** với OpenStreetMap (free)
- **Zustand** cho state management (nhẹ hơn Redux)
- **Tailwind CSS** cho styling
- Responsive cho tablet trở lên (1024px+)

---

## 📄 License

DRECS Project - Emergency Rescue System

---

*Được tạo bởi VIBECODE KIT v4.0*
