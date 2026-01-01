# CONTRACT M6: LORA GATEWAY MOBILE

> **Version:** 1.0
> **Created:** 01/01/2026
> **Status:** APPROVED

---

## 1. TỔNG QUAN

### Mô tả
LoRaWAN Gateway di động, triển khai trên **xe cứu hộ** hoặc **trạm tiền phương**. Mở rộng vùng phủ sóng LoRa vào sâu trong vùng lũ, sử dụng 4G làm backhaul về HQ.

### Use Cases
1. **Xe cứu hộ**: Mang gateway đến gần vùng lũ
2. **Trạm tiền phương**: Đặt tại điểm cao gần vùng ảnh hưởng
3. **Boat relay**: Gắn trên thuyền cứu hộ

### Tech Stack
| Component | Technology |
|-----------|------------|
| Hardware | Raspberry Pi 4 + RAK2247 |
| LoRaWAN | Packet Forwarder |
| Backhaul | 4G/LTE (SIM7600) |
| Power | Solar + Battery |
| Enclosure | Pelican Case IP67 |

---

## 2. KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────┐
│              LORA GATEWAY MOBILE (Field Unit)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────────────────────────────────────────┐     │
│   │           PELICAN CASE (IP67)                    │     │
│   │                                                  │     │
│   │   ☀️ Solar ──► Battery ──► Raspberry Pi 4       │     │
│   │                              │                   │     │
│   │                    ┌─────────┴─────────┐        │     │
│   │                    │                   │        │     │
│   │              ┌─────────┐         ┌─────────┐    │     │
│   │              │ RAK2247 │         │ SIM7600 │    │     │
│   │              │ (LoRa)  │         │  (4G)   │    │     │
│   │              └────┬────┘         └────┬────┘    │     │
│   │                   │                   │         │     │
│   └───────────────────┼───────────────────┼─────────┘     │
│                       │                   │               │
│                       ▼                   ▼               │
│               ┌───────────┐        ┌───────────┐         │
│               │ LoRa      │        │ Internet  │         │
│               │ Antenna   │        │ (4G)      │         │
│               │ (Outdoor) │        └─────┬─────┘         │
│               └───────────┘              │               │
│                                          ▼               │
│   🛸 Drones ─── LoRaWAN ───────►    ChirpStack (HQ)     │
│                                          │               │
│                                          ▼               │
│                                    M3: Backend           │
│                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. HARDWARE DESIGN

### 3.1 Components List

| Component | Model | Qty | Price | Notes |
|-----------|-------|-----|-------|-------|
| SBC | Raspberry Pi 4 4GB | 1 | $55 | Main computer |
| LoRa | RAK2247 Mini Gateway | 1 | $100 | 8-channel SX1302 |
| 4G | SIM7600G-H HAT | 1 | $45 | Global bands |
| GPS | Built into SIM7600 | - | - | Location tracking |
| Battery | 20000mAh Power Bank | 1 | $40 | USB-C PD |
| Solar | 20W Foldable Panel | 1 | $30 | Portable |
| Antenna (LoRa) | Fiberglass 5dBi | 1 | $25 | With magnetic base |
| Antenna (4G) | LTE External | 1 | $15 | SMA connector |
| Case | Pelican 1200 | 1 | $50 | IP67 waterproof |
| Cables/Misc | - | - | $20 | SMA, USB, etc. |
| **TOTAL** | | | **$380** | |

### 3.2 Physical Layout
```
┌─────────────────────────────────────────┐
│           PELICAN CASE TOP VIEW         │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────┐    ┌─────────────┐   │
│   │   Pi 4 +    │    │  Battery    │   │
│   │  RAK2247    │    │  20000mAh   │   │
│   │  + SIM7600  │    │             │   │
│   └──────┬──────┘    └─────────────┘   │
│          │                              │
│    SMA   │  USB-C                       │
│    ──────┼──────                        │
│          │                              │
│   (Antenna pass-through)                │
│                                         │
└─────────────────────────────────────────┘

External:
- LoRa antenna on telescopic pole
- 4G antenna magnetic mount
- Solar panel with 5m cable
```

---

## 4. SOFTWARE COMPONENTS

### 4.1 Packet Forwarder
```bash
# Using Semtech UDP Packet Forwarder
# Forward to ChirpStack at HQ via 4G

{
    "gateway_conf": {
        "gateway_ID": "AA555A0000000001",
        "server_address": "chirpstack.drecs.vn",
        "serv_port_up": 1700,
        "serv_port_down": 1700
    }
}
```

### 4.2 Gateway Manager Service
```python
# /opt/lora-gateway/manager.py
import subprocess
import requests
from gps import GPSModule
from cellular import CellularLink

class GatewayManager:
    """Manage mobile gateway operations"""

    def __init__(self):
        self.gps = GPSModule()
        self.cellular = CellularLink()
        self.gateway_id = self._get_gateway_id()

    def start(self):
        """Start all services"""
        self._check_4g_connection()
        self._start_packet_forwarder()
        self._start_heartbeat()

    def _check_4g_connection(self):
        """Ensure 4G is connected before starting"""
        while not self.cellular.is_connected():
            self.cellular.connect()
            time.sleep(5)

    def _start_packet_forwarder(self):
        """Start lora_pkt_fwd"""
        subprocess.Popen([
            '/opt/lora-gateway/lora_pkt_fwd',
            '-c', '/opt/lora-gateway/global_conf.json'
        ])

    def _start_heartbeat(self):
        """Report status to HQ every 60s"""
        while True:
            status = {
                'gateway_id': self.gateway_id,
                'type': 'mobile',
                'position': self.gps.get_position(),
                'battery': self._get_battery_level(),
                '4g_signal': self.cellular.get_signal(),
                'packets_today': self._get_packet_count(),
                'uptime': self._get_uptime()
            }
            self._send_status(status)
            time.sleep(60)

    def _send_status(self, status):
        requests.post(
            'https://api.drecs.vn/api/gateways/status',
            json=status,
            headers={'X-Gateway-Key': os.getenv('GATEWAY_API_KEY')}
        )
```

### 4.3 Auto-Recovery Service
```python
# /opt/lora-gateway/watchdog.py
class Watchdog:
    """Auto-recover from failures"""

    def monitor(self):
        while True:
            # Check 4G connection
            if not self._ping_hq():
                self._restart_4g()

            # Check packet forwarder
            if not self._is_pkt_fwd_running():
                self._restart_pkt_fwd()

            # Check battery
            battery = self._get_battery()
            if battery < 10:
                self._send_low_battery_alert()

            time.sleep(30)
```

---

## 5. DEPLOYMENT MODES

### Mode 1: Vehicle Mount (Xe cứu hộ)
```
┌────────────────────────────────────────┐
│           VEHICLE DEPLOYMENT           │
├────────────────────────────────────────┤
│                                        │
│   - Gateway in Pelican case            │
│   - Antenna on roof rack (mag mount)   │
│   - Power from vehicle 12V             │
│   - Always-on when engine running      │
│                                        │
│   Range: 2-5km radius                  │
│   Mobility: High                       │
│   Setup time: 5 minutes                │
│                                        │
└────────────────────────────────────────┘
```

### Mode 2: Field Station (Trạm tiền phương)
```
┌────────────────────────────────────────┐
│           FIELD STATION                │
├────────────────────────────────────────┤
│                                        │
│   - Gateway on tripod/pole             │
│   - Solar panel deployed               │
│   - Battery for 24h operation          │
│   - Antenna at 3-5m height             │
│                                        │
│   Range: 5-10km radius                 │
│   Mobility: Low (semi-permanent)       │
│   Setup time: 30 minutes               │
│                                        │
└────────────────────────────────────────┘
```

### Mode 3: Boat Relay
```
┌────────────────────────────────────────┐
│           BOAT DEPLOYMENT              │
├────────────────────────────────────────┤
│                                        │
│   - Waterproof case essential          │
│   - Antenna on boat mast               │
│   - Power from boat battery            │
│   - GPS tracking enabled               │
│                                        │
│   Range: 2-3km radius (water)          │
│   Mobility: Highest                    │
│   Setup time: 10 minutes               │
│                                        │
└────────────────────────────────────────┘
```

---

## 6. POWER MANAGEMENT

### Power Budget
```
Component           Consumption
────────────────────────────────
Raspberry Pi 4      3.0W (idle) - 7.5W (active)
RAK2247             0.5W
SIM7600             1.0W (active)
────────────────────────────────
Total               4.5W - 9.0W
Average             6.0W
```

### Battery Life
```
Battery: 20000mAh @ 5V = 100Wh
Consumption: 6W average
Runtime: 100Wh / 6W = 16.6 hours

With 20W solar (6h sun):
- Solar input: 20W × 6h = 120Wh
- Consumption: 6W × 24h = 144Wh
- Deficit: 24Wh (need larger battery for 24/7)

Recommendation: 40000mAh for 24/7 operation
```

---

## 7. CẤU TRÚC THƯ MỤC

```
lora-gateway-mobile/
├── software/
│   ├── manager.py           # Main gateway manager
│   ├── watchdog.py          # Auto-recovery
│   ├── cellular.py          # 4G module control
│   ├── gps.py               # GPS reading
│   ├── config.py            # Configuration
│   └── requirements.txt
├── packet-forwarder/
│   ├── lora_pkt_fwd         # Compiled binary
│   ├── global_conf.json     # LoRa config
│   └── local_conf.json      # Gateway-specific
├── systemd/
│   ├── lora-gateway.service
│   ├── gateway-manager.service
│   └── gateway-watchdog.service
├── scripts/
│   ├── setup.sh             # Initial setup
│   ├── update.sh            # OTA update
│   └── diagnose.sh          # Troubleshooting
├── docs/
│   ├── assembly-guide.md
│   ├── deployment-guide.md
│   └── troubleshooting.md
└── README.md
```

---

## 8. API ENDPOINTS (Backend integration)

### POST /api/gateways/status
```json
{
    "gateway_id": "GW-MOBILE-001",
    "type": "mobile",
    "position": {
        "lat": 16.0544,
        "lng": 108.2022
    },
    "battery": 75,
    "signal_4g": 4,
    "packets_today": 127,
    "devices_seen": 5,
    "uptime": 3600,
    "last_packet": "2026-01-01T10:30:00Z"
}
```

### Dashboard Display
```
┌─────────────────────────────────────────────────────────┐
│              MOBILE GATEWAYS STATUS                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  GW-MOBILE-001          GW-MOBILE-002                  │
│  📍 Rescue Vehicle A    📍 Field Station B             │
│  🔋 75%                 🔋 92%                         │
│  📶 4G: Strong          📶 4G: Medium                  │
│  📡 5 drones in range   📡 3 drones in range           │
│  📦 127 packets today   📦 89 packets today            │
│                                                         │
│  [Map showing gateway positions and coverage]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 9. ACCEPTANCE CRITERIA

| # | Criteria | Test |
|---|----------|------|
| 1 | 4G connects automatically | Boot and check |
| 2 | Packet forwarder starts | ChirpStack sees gateway |
| 3 | Receives drone packets | Send test from 1km |
| 4 | GPS position accurate | Compare with phone |
| 5 | Battery lasts 12h+ | Discharge test |
| 6 | Survives rain | IP67 spray test |
| 7 | Auto-recovery works | Kill process, check restart |
| 8 | HQ sees status | Dashboard shows gateway |

---

## 10. ASSEMBLY GUIDE (Quick)

### Step 1: Prepare Components
```
□ Raspberry Pi 4 with heatsink
□ RAK2247 + Pi adapter
□ SIM7600G-H HAT
□ 32GB SD Card with OS
□ Antennas (LoRa + 4G)
□ Battery pack
□ Pelican case
```

### Step 2: Assemble
```
1. Mount RAK2247 on Pi GPIO
2. Stack SIM7600 HAT (using spacers)
3. Insert SIM card
4. Connect antennas (BEFORE powering on!)
5. Flash SD card with gateway image
6. Insert SD card
7. Cable management
8. Mount in Pelican case
9. Drill holes for antenna pass-through
10. Seal with waterproof grommets
```

### Step 3: Configure
```bash
# SSH into gateway
ssh pi@gateway.local

# Edit configuration
sudo nano /opt/lora-gateway/global_conf.json

# Set gateway ID, server address

# Start services
sudo systemctl enable lora-gateway
sudo systemctl start lora-gateway
```

---

## 11. ESTIMATED EFFORT

| Component | Hours |
|-----------|-------|
| Hardware assembly | 4 |
| Software setup | 6 |
| Manager script | 8 |
| Watchdog service | 4 |
| Testing | 6 |
| Documentation | 4 |
| **TOTAL** | **32 hours** |

---

**CONTRACT APPROVED**

Signature: _________________
Date: 01/01/2026
