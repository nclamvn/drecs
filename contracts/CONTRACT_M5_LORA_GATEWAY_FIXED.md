# CONTRACT M5: LORA GATEWAY FIXED

> **Version:** 1.0
> **Created:** 01/01/2026
> **Status:** APPROVED

---

## 1. TỔNG QUAN

### Mô tả
LoRaWAN Gateway cố định đặt tại **Trung tâm chỉ huy (HQ)**. Nhận messages từ các Drone Edge và chuyển tiếp về Backend qua MQTT.

### Tech Stack
| Component | Technology |
|-----------|------------|
| Hardware | RAK7268 hoặc tự build |
| LoRaWAN Server | ChirpStack (self-hosted) |
| Message Broker | MQTT (Mosquitto) |
| Bridge | Python script |

---

## 2. KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────┐
│                  LORA GATEWAY FIXED (HQ)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   🛸 Drones ─── LoRaWAN ───► ┌─────────────────┐           │
│                              │ RAK7268 Gateway │           │
│                              └────────┬────────┘           │
│                                       │ UDP                │
│                                       ▼                    │
│                              ┌─────────────────┐           │
│                              │   ChirpStack    │           │
│                              │ Network Server  │           │
│                              └────────┬────────┘           │
│                                       │ MQTT               │
│                                       ▼                    │
│                              ┌─────────────────┐           │
│                              │  MQTT Broker    │           │
│                              │  (Mosquitto)    │           │
│                              └────────┬────────┘           │
│                                       │                    │
│                                       ▼                    │
│                              ┌─────────────────┐           │
│                              │  Bridge Script  │           │
│                              │    (Python)     │           │
│                              └────────┬────────┘           │
│                                       │ HTTP               │
│                                       ▼                    │
│                              ┌─────────────────┐           │
│                              │  M3: Backend    │           │
│                              └─────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. COMPONENTS

### 3.1 LoRaWAN Gateway Hardware
```
Option A: Commercial Gateway
- Model: RAK7268 WisGate Edge Lite 2
- Channels: 8
- LoRa: SX1302
- Backhaul: Ethernet / WiFi / 4G
- Price: ~$180

Option B: DIY Gateway
- Raspberry Pi 4
- RAK2245 Pi HAT (8-channel)
- Outdoor antenna (8dBi)
- Weatherproof enclosure
- Price: ~$150
```

### 3.2 ChirpStack Network Server
```yaml
# docker-compose.yml
version: "3"

services:
  chirpstack:
    image: chirpstack/chirpstack:4
    ports:
      - "8080:8080"  # Web UI
      - "1700:1700/udp"  # Gateway
    volumes:
      - ./config:/etc/chirpstack
    environment:
      - POSTGRESQL_HOST=postgres
      - REDIS_HOST=redis
      - MQTT_BROKER_HOST=mosquitto

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=chirpstack
      - POSTGRES_DB=chirpstack
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

volumes:
  postgres_data:
  redis_data:
```

### 3.3 MQTT → Backend Bridge
```python
# bridge/main.py
import paho.mqtt.client as mqtt
import httpx
import struct
from config import BACKEND_URL, MQTT_HOST

class LoRaBridge:
    """Bridge MQTT messages to Backend API"""

    def __init__(self):
        self.mqtt = mqtt.Client()
        self.mqtt.on_message = self.on_message
        self.http = httpx.Client(base_url=BACKEND_URL)

    def start(self):
        self.mqtt.connect(MQTT_HOST, 1883)
        self.mqtt.subscribe("application/+/device/+/event/up")
        self.mqtt.loop_forever()

    def on_message(self, client, userdata, msg):
        """Handle incoming LoRa message"""
        payload = json.loads(msg.payload)
        data = base64.b64decode(payload['data'])

        if self._is_rescue_request(data):
            rescue = self._decode_rescue(data)
            self._send_to_backend(rescue)
        elif self._is_heartbeat(data):
            heartbeat = self._decode_heartbeat(data)
            self._update_drone_status(heartbeat)

    def _decode_rescue(self, data: bytes) -> dict:
        """Decode compact rescue format (31 bytes)"""
        lat = struct.unpack('<i', data[0:4])[0] / 1_000_000
        lng = struct.unpack('<i', data[4:8])[0] / 1_000_000
        people = data[8]
        flags = data[9]
        phone_last4 = struct.unpack('<I', data[10:14])[0]
        timestamp = struct.unpack('<I', data[14:18])[0]
        fingerprint = struct.unpack('<Q', data[18:26])[0]
        drone_id = struct.unpack('<H', data[26:28])[0]
        seq_num = struct.unpack('<H', data[28:30])[0]

        return {
            'lat': lat,
            'lng': lng,
            'people': people,
            'urgency': self._decode_urgency(flags),
            'injured': bool(flags & 0x04),
            'water_level': self._decode_water_level(flags),
            'no_food': bool(flags & 0x20),
            'is_panic': bool(flags & 0x40),
            'phone': f"****{phone_last4:04d}",
            'fingerprint': hex(fingerprint),
            'source_drone': drone_id,
            'source_channel': 'lora_fixed'
        }

    def _send_to_backend(self, rescue: dict):
        """POST to Backend API"""
        response = self.http.post(
            "/api/rescues/lora",
            json=rescue,
            headers={"X-Source": "lora-gateway-fixed"}
        )
        if response.status_code == 201:
            logger.info(f"Rescue forwarded: {rescue['fingerprint']}")
        else:
            logger.error(f"Failed to forward: {response.text}")
```

---

## 4. MESSAGE TYPES

### 4.1 Uplink: Rescue Request
```
Topic: application/{app_id}/device/{dev_eui}/event/up
Payload (base64 decoded): 31 bytes compact format
```

### 4.2 Uplink: Heartbeat
```
Topic: application/{app_id}/device/{dev_eui}/event/up
Payload (base64 decoded): 24 bytes compact format
```

### 4.3 Downlink: Command (Future)
```
Topic: application/{app_id}/device/{dev_eui}/command/down
Payload: Command bytes
```

---

## 5. DEVICE PROVISIONING

### ChirpStack Device Profile
```json
{
    "name": "DRECS-Drone",
    "region": "AS923",  // Vietnam
    "macVersion": "1.0.3",
    "regParamsRevision": "A",
    "supportsOTAA": true,
    "supportsClassC": false,
    "classBTimeout": 0,
    "payloadCodec": "CUSTOM_JS",
    "payloadDecoderScript": "// decoder.js"
}
```

### Decoder Script (ChirpStack)
```javascript
// decoder.js
function decodeUplink(input) {
    var data = input.bytes;

    if (data.length === 31) {
        // Rescue Request
        return {
            data: {
                type: "rescue",
                lat: readInt32LE(data, 0) / 1000000,
                lng: readInt32LE(data, 4) / 1000000,
                people: data[8],
                flags: data[9],
                urgency: decodeUrgency(data[9]),
                injured: (data[9] & 0x04) !== 0,
                water_level: decodeWaterLevel(data[9]),
                fingerprint: readUint64Hex(data, 18)
            }
        };
    } else if (data.length === 24) {
        // Heartbeat
        return {
            data: {
                type: "heartbeat",
                drone_id: readUint16LE(data, 0),
                lat: readInt32LE(data, 2) / 1000000,
                lng: readInt32LE(data, 6) / 1000000,
                altitude: readUint16LE(data, 10),
                battery: data[12],
                connected: readUint16LE(data, 14),
                queue_size: readUint16LE(data, 16),
                link_status: data[22]
            }
        };
    }

    return { errors: ["Unknown payload format"] };
}
```

---

## 6. CẤU TRÚC THƯ MỤC

```
lora-gateway-fixed/
├── docker-compose.yml
├── chirpstack/
│   ├── chirpstack.toml
│   └── region_as923.toml
├── mosquitto/
│   └── mosquitto.conf
├── bridge/
│   ├── __init__.py
│   ├── main.py
│   ├── decoder.py
│   ├── config.py
│   └── requirements.txt
├── scripts/
│   ├── provision_device.py
│   └── test_gateway.py
├── monitoring/
│   └── grafana-dashboard.json
└── README.md
```

---

## 7. MONITORING

### Metrics to track:
- Gateway online/offline
- Messages received per hour
- RSSI/SNR per device
- Packet loss rate
- Queue depth

### Grafana Dashboard
```
┌─────────────────────────────────────────────────────────┐
│              LORA GATEWAY - FIXED (HQ)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STATUS: 🟢 ONLINE      UPTIME: 15d 4h 32m             │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Messages/h  │  │ Avg RSSI    │  │ Packet Loss │     │
│  │    127      │  │  -85 dBm    │  │    0.3%     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  Active Devices: 5/5 drones                            │
│  Last Message: 2s ago                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. HARDWARE INSTALLATION

### Antenna Placement
```
- Height: Minimum 10m above ground
- Location: Rooftop with clear line of sight
- Antenna: Outdoor fiberglass 8dBi
- Cable: LMR400 low-loss (max 10m)
- Lightning: Surge protector required
```

### Power
```
- Input: 12V DC or PoE
- Consumption: ~5W
- UPS: Minimum 4 hours backup
```

---

## 9. ACCEPTANCE CRITERIA

| # | Criteria | Test |
|---|----------|------|
| 1 | Gateway online | ChirpStack UI shows connected |
| 2 | Receive LoRa packet | Send test from drone |
| 3 | Decode correctly | Check decoded payload |
| 4 | Forward to Backend | Backend receives rescue |
| 5 | Range test | 5km with clear LOS |
| 6 | Monitoring works | Grafana shows metrics |

---

## 10. ESTIMATED EFFORT

| Component | Hours |
|-----------|-------|
| ChirpStack setup | 4 |
| Bridge script | 6 |
| Decoder script | 2 |
| Monitoring | 4 |
| Testing | 4 |
| Documentation | 2 |
| **TOTAL** | **22 hours** |

---

**CONTRACT APPROVED**

Signature: _________________
Date: 01/01/2026
