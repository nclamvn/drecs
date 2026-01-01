# CONTRACT M2: DRONE EDGE (Multi-Link v2.0)

> **Version:** 2.0
> **Updated:** 01/01/2026
> **Status:** APPROVED

---

## 1. TỔNG QUAN

### Mô tả
Python software chạy trên Raspberry Pi, đóng vai trò **Edge Node** trong hệ thống DRECS. Cung cấp WiFi hotspot cho người dân gửi yêu cầu cứu trợ và relay dữ liệu về HQ qua **4 kênh truyền thông**.

### Tech Stack
| Component | Technology |
|-----------|------------|
| Language | Python 3.11+ |
| HTTP Server | FastAPI |
| Database | SQLite |
| WiFi AP | hostapd + dnsmasq |
| LoRa | RAK2245/SX1262 via SPI |
| 4G | SIM7600 via USB Serial |
| GPS | NEO-M8N via UART |

---

## 2. KIẾN TRÚC MULTI-LINK

```
┌─────────────────────────────────────────────────────────────┐
│                    DRONE EDGE NODE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ WiFi AP     │    │ HTTP Server │    │ Captive     │     │
│  │ (hostapd)   │───►│ (FastAPI)   │───►│ Portal      │     │
│  └─────────────┘    └──────┬──────┘    └─────────────┘     │
│                            │                                │
│                            ▼                                │
│                    ┌───────────────┐                       │
│                    │ Queue Manager │                       │
│                    │   (SQLite)    │                       │
│                    └───────┬───────┘                       │
│                            │                                │
│                            ▼                                │
│                    ┌───────────────┐                       │
│                    │  Link Manager │                       │
│                    └───────┬───────┘                       │
│                            │                                │
│         ┌──────────┬───────┼───────┬──────────┐            │
│         ▼          ▼       ▼       ▼          ▼            │
│    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│    │ LoRa   │ │ LoRa   │ │  4G    │ │ Mesh   │            │
│    │ Fixed  │ │ Mobile │ │ Module │ │ P2P    │            │
│    └────────┘ └────────┘ └────────┘ └────────┘            │
│        ①          ②          ③         ④                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. COMPONENTS

### 3.1 WiFi Hotspot Manager
```python
# /src/wifi/hotspot.py
class HotspotManager:
    """Quản lý WiFi Access Point"""

    SSID = "DRECS-RESCUE-{drone_id}"
    CHANNEL = 6

    def start() -> bool
    def stop() -> bool
    def get_connected_clients() -> List[Client]
    def is_running() -> bool
```

**Config files:**
- `/etc/hostapd/hostapd.conf`
- `/etc/dnsmasq.conf`

### 3.2 HTTP Server (FastAPI)
```python
# /src/server/main.py

# Endpoints:
POST /api/rescue          # Nhận rescue request
GET  /api/status          # Trạng thái drone
GET  /                    # Serve rescue-portal (PWA)
GET  /captive             # Captive portal redirect
```

### 3.3 Queue Manager
```python
# /src/queue/manager.py
class QueueManager:
    """SQLite-based queue với retry logic"""

    def add(request: RescueRequest) -> str  # Returns request_id
    def get_pending() -> List[RescueRequest]
    def mark_sent(id: str, channel: str) -> bool
    def mark_failed(id: str, error: str) -> bool
    def get_stats() -> QueueStats
```

**SQLite Schema:**
```sql
CREATE TABLE rescue_queue (
    id TEXT PRIMARY KEY,
    fingerprint TEXT UNIQUE,
    lat REAL,
    lng REAL,
    people INTEGER,
    urgency TEXT,
    phone TEXT,
    created_at INTEGER,
    sent_lora_fixed BOOLEAN DEFAULT FALSE,
    sent_lora_mobile BOOLEAN DEFAULT FALSE,
    sent_4g BOOLEAN DEFAULT FALSE,
    sent_mesh BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);

CREATE TABLE heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    battery INTEGER,
    connected_users INTEGER,
    queue_size INTEGER,
    link_status INTEGER
);
```

### 3.4 Link Manager (Smart Failover)
```python
# /src/links/manager.py
class LinkManager:
    """Quản lý 4 kênh truyền thông với failover"""

    def __init__(self):
        self.lora_fixed = LoRaLink(gateway_type="fixed")
        self.lora_mobile = LoRaLink(gateway_type="mobile")
        self.cellular = CellularLink()
        self.mesh = MeshLink()

    def send_rescue(request: RescueRequest) -> SendResult:
        """
        Gửi request qua TẤT CẢ các kênh available
        Priority: LoRa Fixed > LoRa Mobile > 4G > Mesh
        """
        results = {}

        # Always try LoRa channels (primary)
        if self.lora_fixed.is_available():
            results['lora_fixed'] = self.lora_fixed.send(request)

        if self.lora_mobile.is_available():
            results['lora_mobile'] = self.lora_mobile.send(request)

        # 4G for full data sync
        if self.cellular.is_available():
            results['4g'] = self.cellular.send_full(request)

        # Mesh as last resort
        if not any(results.values()) and self.mesh.has_neighbors():
            results['mesh'] = self.mesh.relay(request)

        return SendResult(results)

    def send_heartbeat() -> bool
    def get_link_status() -> LinkStatus
```

### 3.5 LoRa Transceiver
```python
# /src/links/lora.py
class LoRaLink:
    """LoRaWAN transceiver using RAK2245/SX1262"""

    FREQUENCY = 433_000_000  # 433MHz for Vietnam
    SF = 10  # Spreading Factor
    BW = 125_000  # Bandwidth

    def __init__(self, gateway_type: str):
        self.gateway_type = gateway_type  # "fixed" or "mobile"
        self.dev_eui = self._get_dev_eui()
        self.app_key = self._get_app_key()

    def send(self, request: RescueRequest) -> bool:
        """Gửi compact message (48 bytes)"""
        payload = self._encode_rescue(request)
        return self._transmit(payload)

    def _encode_rescue(self, req: RescueRequest) -> bytes:
        """Encode to compact format (48 bytes)"""
        # See DATA FORMAT in architecture doc
        pass

    def is_available(self) -> bool
    def get_rssi(self) -> int
    def get_snr(self) -> float
```

### 3.6 Cellular Module (4G)
```python
# /src/links/cellular.py
class CellularLink:
    """4G/LTE module using SIM7600"""

    BACKEND_URL = "https://api.drecs.vn"

    def __init__(self):
        self.serial = serial.Serial('/dev/ttyUSB0', 115200)

    def send_full(self, request: RescueRequest) -> bool:
        """Gửi full JSON qua HTTP POST"""
        response = requests.post(
            f"{self.BACKEND_URL}/api/rescues",
            json=request.to_dict(),
            headers={"X-Drone-ID": self.drone_id}
        )
        return response.status_code == 201

    def is_available(self) -> bool:
        """Check signal strength"""
        return self._get_signal() > 0

    def get_signal_strength(self) -> int  # 0-5
```

### 3.7 Mesh Protocol
```python
# /src/links/mesh.py
class MeshLink:
    """LoRa P2P mesh for drone-to-drone relay"""

    MESH_CHANNEL = 434_000_000  # Separate from LoRaWAN

    def discover_neighbors(self) -> List[DroneNode]
    def relay(self, request: RescueRequest) -> bool:
        """Relay to nearest neighbor with better link"""
        neighbors = self.discover_neighbors()
        best = self._select_best_neighbor(neighbors)
        return self._send_to_neighbor(best, request)

    def receive_relay(self) -> Optional[RescueRequest]
    def has_neighbors(self) -> bool
```

### 3.8 GPS Module
```python
# /src/sensors/gps.py
class GPSModule:
    """NEO-M8N GPS receiver"""

    def get_position(self) -> Tuple[float, float, float]:
        """Returns (lat, lng, altitude)"""
        pass

    def get_accuracy(self) -> float  # meters
    def is_fixed(self) -> bool
```

---

## 4. DATA FORMATS

### 4.1 Rescue Request (Compact - 31 bytes for LoRa)
```
Bytes   Field           Type      Description
──────────────────────────────────────────────
0-3     lat             int32     lat × 1,000,000
4-7     lng             int32     lng × 1,000,000
8       people          uint8     1-255
9       flags           uint8     bit flags
10-13   phone_last4     uint32    4 số cuối SĐT
14-17   timestamp       uint32    Unix timestamp
18-25   fingerprint     uint64    Dedup hash
26-27   drone_id        uint16    ID drone
28-29   seq_num         uint16    Sequence number
30      checksum        uint8     CRC8
```

**Flags byte:**
```
bit 0: urgency_high
bit 1: urgency_medium
bit 2: injured
bit 3: water_level_high (>2m)
bit 4: water_level_medium (1-2m)
bit 5: no_food
bit 6: is_panic
bit 7: reserved
```

### 4.2 Heartbeat (Compact - 24 bytes)
```
Bytes   Field           Type      Description
──────────────────────────────────────────────
0-1     drone_id        uint16    ID drone
2-5     lat             int32     Vị trí drone
6-9     lng             int32
10-11   altitude        uint16    meters
12      battery         uint8     0-100%
13      signal          uint8     0-2
14-15   connected       uint16    Số user kết nối
16-17   queue_size      uint16    Requests chờ
18-21   timestamp       uint32    Unix timestamp
22      link_status     uint8     bit flags
23      checksum        uint8     CRC8
```

---

## 5. CẤU TRÚC THƯ MỤC

```
drone-edge/
├── src/
│   ├── __init__.py
│   ├── main.py              # Entry point
│   ├── config.py            # Configuration
│   ├── wifi/
│   │   ├── __init__.py
│   │   └── hotspot.py       # WiFi AP manager
│   ├── server/
│   │   ├── __init__.py
│   │   ├── app.py           # FastAPI app
│   │   └── routes.py        # API routes
│   ├── queue/
│   │   ├── __init__.py
│   │   └── manager.py       # SQLite queue
│   ├── links/
│   │   ├── __init__.py
│   │   ├── manager.py       # Link manager
│   │   ├── lora.py          # LoRa transceiver
│   │   ├── cellular.py      # 4G module
│   │   └── mesh.py          # Mesh protocol
│   ├── sensors/
│   │   ├── __init__.py
│   │   └── gps.py           # GPS module
│   └── utils/
│       ├── __init__.py
│       ├── encoder.py       # Binary encoder
│       └── crc.py           # CRC8 checksum
├── static/                   # rescue-portal files
├── config/
│   ├── hostapd.conf
│   └── dnsmasq.conf
├── tests/
│   ├── test_queue.py
│   ├── test_encoder.py
│   └── test_links.py
├── requirements.txt
├── setup.py
└── README.md
```

---

## 6. API ENDPOINTS

### POST /api/rescue
```python
Request:
{
    "lat": 16.0544,
    "lng": 108.2022,
    "people": 5,
    "urgency": "high",
    "phone": "0901234567",
    "water_level": 2,
    "injured": true,
    "no_food": false
}

Response:
{
    "success": true,
    "request_id": "REQ-001",
    "message": "Yêu cầu đã được ghi nhận",
    "queue_position": 3
}
```

### GET /api/status
```python
Response:
{
    "drone_id": "DRONE-01",
    "position": {"lat": 16.05, "lng": 108.20, "alt": 50},
    "battery": 85,
    "connected_users": 12,
    "queue_size": 5,
    "links": {
        "lora_fixed": true,
        "lora_mobile": true,
        "4g": false,
        "mesh_neighbors": 2
    },
    "uptime": 3600
}
```

---

## 7. HARDWARE REQUIREMENTS

| Component | Model | Interface | Ghi chú |
|-----------|-------|-----------|---------|
| SBC | Raspberry Pi 4 (4GB) | - | Main computer |
| LoRa | RAK2245 hoặc SX1262 HAT | SPI | 433MHz |
| 4G | SIM7600G-H | USB Serial | Global bands |
| GPS | NEO-M8N | UART | High precision |
| WiFi | External USB adapter | USB | High power AP |
| Storage | 32GB SD Card | - | Class 10 |

---

## 8. DEPENDENCIES

```txt
# requirements.txt
fastapi>=0.104.0
uvicorn>=0.24.0
python-multipart>=0.0.6
pyserial>=3.5
spidev>=3.6
RPi.GPIO>=0.7.1
pynmea2>=1.19.0
aiosqlite>=0.19.0
httpx>=0.25.0
pydantic>=2.5.0
python-dotenv>=1.0.0
structlog>=23.2.0
```

---

## 9. MOCK MODE

Để development/testing trên máy không có hardware:

```python
# config.py
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

if MOCK_MODE:
    from .mocks import MockLoRa, MockCellular, MockGPS
```

---

## 10. ACCEPTANCE CRITERIA

| # | Criteria | Test |
|---|----------|------|
| 1 | WiFi AP hoạt động | Kết nối được từ điện thoại |
| 2 | Captive portal redirect | Auto mở trang rescue |
| 3 | Form submit lưu vào queue | Check SQLite |
| 4 | LoRa gửi được message | Gateway nhận được |
| 5 | 4G sync khi có sóng | Backend nhận full data |
| 6 | Heartbeat mỗi 30s | Dashboard thấy drone |
| 7 | Failover hoạt động | Tắt 1 link, vẫn gửi được |
| 8 | Mesh relay | 2 drones relay được |

---

## 11. ESTIMATED LINES OF CODE

| Component | LoC |
|-----------|-----|
| WiFi Manager | ~50 |
| HTTP Server | ~80 |
| Queue Manager | ~100 |
| Link Manager | ~150 |
| LoRa Module | ~120 |
| Cellular Module | ~80 |
| Mesh Protocol | ~100 |
| GPS Module | ~40 |
| Utils (encoder, crc) | ~60 |
| Config + Main | ~50 |
| **TOTAL** | **~830** |

---

**CONTRACT APPROVED**

Signature: _________________
Date: 01/01/2026
