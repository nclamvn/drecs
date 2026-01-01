# CONTRACT M3: BACKEND UPDATE (Multi-Source v2.0)

> **Version:** 2.0
> **Updated:** 01/01/2026
> **Status:** APPROVED

---

## 1. TỔNG QUAN

### Thay đổi từ v1.0
Backend cần cập nhật để nhận dữ liệu từ **nhiều nguồn** thay vì chỉ 4G HTTP:

| Source | Protocol | Data Format |
|--------|----------|-------------|
| 4G (Drone) | HTTP POST | Full JSON |
| LoRa Fixed | MQTT → HTTP | Compact decoded |
| LoRa Mobile | MQTT → HTTP | Compact decoded |
| Mesh (via Drone) | HTTP POST | Full JSON |

### Existing Stack (Không đổi)
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- WebSocket (Socket.IO)

---

## 2. KIẾN TRÚC CẬP NHẬT

```
┌─────────────────────────────────────────────────────────────┐
│                    M3: BACKEND v2.0                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│   │ 4G/HTTP   │  │LoRa MQTT  │  │ Gateway   │              │
│   │ Endpoint  │  │ Subscriber│  │ Status    │              │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘              │
│         │              │              │                     │
│         └──────────────┼──────────────┘                     │
│                        │                                    │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │ Ingestion Layer │                           │
│              │ (Normalize All) │                           │
│              └────────┬────────┘                           │
│                       │                                     │
│                       ▼                                     │
│              ┌─────────────────┐                           │
│              │  Deduplication  │                           │
│              │    Engine       │                           │
│              └────────┬────────┘                           │
│                       │                                     │
│                       ▼                                     │
│              ┌─────────────────┐                           │
│              │ Priority Queue  │                           │
│              └────────┬────────┘                           │
│                       │                                     │
│         ┌─────────────┼─────────────┐                      │
│         ▼             ▼             ▼                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│   │ Database │  │ WebSocket│  │ Dashboard│                │
│   │ (Prisma) │  │ Broadcast│  │   API    │                │
│   └──────────┘  └──────────┘  └──────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. NEW COMPONENTS

### 3.1 LoRa Ingestion Route
```typescript
// src/routes/lora.ts
import { Router } from 'express';
import { loraAuth } from '../middlewares/loraAuth';
import { rescueService } from '../services/rescue.service';

const router = Router();

/**
 * POST /api/rescues/lora
 * Receives decoded LoRa messages from Gateway Bridge
 */
router.post('/rescues/lora', loraAuth, async (req, res) => {
    const loraData = req.body;

    // Normalize LoRa format to standard format
    const normalized = normalizeLoraRescue(loraData);

    // Process through standard pipeline
    const result = await rescueService.createFromLora(normalized);

    res.status(201).json({
        success: true,
        id: result.id,
        source: loraData.source_channel
    });
});

/**
 * POST /api/gateways/status
 * Receives gateway status updates
 */
router.post('/gateways/status', loraAuth, async (req, res) => {
    const status = req.body;
    await gatewayService.updateStatus(status);
    res.status(200).json({ success: true });
});

function normalizeLoraRescue(lora: LoraRescue): RescueInput {
    return {
        lat: lora.lat,
        lng: lora.lng,
        peopleCount: lora.people,
        urgency: lora.urgency,
        phone: lora.phone,  // Already masked "****1234"
        waterLevel: lora.water_level,
        hasInjured: lora.injured,
        noFood: lora.no_food,
        isPanic: lora.is_panic,
        fingerprint: lora.fingerprint,
        sourceDroneId: lora.source_drone,
        sourceChannel: lora.source_channel  // 'lora_fixed' | 'lora_mobile'
    };
}
```

### 3.2 Enhanced Deduplication
```typescript
// src/services/dedup.service.ts
export class DedupService {
    /**
     * Multi-source deduplication
     * Same fingerprint from different channels = same request
     */
    async checkDuplicate(fingerprint: string): Promise<DedupResult> {
        const existing = await prisma.rescue.findFirst({
            where: { fingerprint },
            orderBy: { createdAt: 'desc' }
        });

        if (!existing) {
            return { isDuplicate: false };
        }

        // Calculate time since first report
        const ageMinutes = (Date.now() - existing.createdAt.getTime()) / 60000;

        if (ageMinutes < 30) {
            // Recent duplicate - just log the additional source
            await this.logAdditionalSource(existing.id, sourceChannel);
            return {
                isDuplicate: true,
                originalId: existing.id,
                sources: await this.getSources(existing.id)
            };
        }

        // Old enough to be a new request
        return { isDuplicate: false };
    }

    async logAdditionalSource(rescueId: string, channel: string) {
        await prisma.rescueSource.create({
            data: {
                rescueId,
                channel,  // '4g' | 'lora_fixed' | 'lora_mobile' | 'mesh'
                receivedAt: new Date()
            }
        });
    }

    async getSources(rescueId: string): Promise<string[]> {
        const sources = await prisma.rescueSource.findMany({
            where: { rescueId },
            select: { channel: true }
        });
        return sources.map(s => s.channel);
    }
}
```

### 3.3 Gateway Service
```typescript
// src/services/gateway.service.ts
export class GatewayService {
    async updateStatus(status: GatewayStatus) {
        await prisma.gateway.upsert({
            where: { gatewayId: status.gateway_id },
            update: {
                type: status.type,  // 'fixed' | 'mobile'
                lat: status.position?.lat,
                lng: status.position?.lng,
                battery: status.battery,
                signal4g: status.signal_4g,
                packetsToday: status.packets_today,
                devicesSeen: status.devices_seen,
                lastSeen: new Date()
            },
            create: {
                gatewayId: status.gateway_id,
                type: status.type,
                lat: status.position?.lat,
                lng: status.position?.lng,
                battery: status.battery,
                signal4g: status.signal_4g,
                packetsToday: status.packets_today,
                devicesSeen: status.devices_seen,
                lastSeen: new Date()
            }
        });

        // Broadcast to dashboard
        this.io.emit('gateway:update', status);
    }

    async getActiveGateways(): Promise<Gateway[]> {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return prisma.gateway.findMany({
            where: {
                lastSeen: { gte: fiveMinutesAgo }
            }
        });
    }
}
```

### 3.4 LoRa Auth Middleware
```typescript
// src/middlewares/loraAuth.ts
export function loraAuth(req: Request, res: Response, next: NextFunction) {
    const sourceHeader = req.headers['x-source'];
    const apiKey = req.headers['x-gateway-key'];

    // Validate source is from known gateway
    const validSources = ['lora-gateway-fixed', 'lora-gateway-mobile'];
    if (!validSources.includes(sourceHeader as string)) {
        return res.status(401).json({ error: 'Invalid source' });
    }

    // Validate API key
    if (apiKey !== process.env.LORA_GATEWAY_API_KEY) {
        return res.status(401).json({ error: 'Invalid gateway key' });
    }

    next();
}
```

---

## 4. DATABASE CHANGES

### 4.1 New Prisma Schema Additions
```prisma
// prisma/schema.prisma

// Add to Rescue model
model Rescue {
    // ... existing fields ...

    sourceChannel   String    @default("4g")  // '4g' | 'lora_fixed' | 'lora_mobile' | 'mesh'
    sources         RescueSource[]
}

// New model for tracking multiple sources
model RescueSource {
    id          String    @id @default(uuid())
    rescueId    String
    rescue      Rescue    @relation(fields: [rescueId], references: [id])
    channel     String    // '4g' | 'lora_fixed' | 'lora_mobile' | 'mesh'
    receivedAt  DateTime  @default(now())

    @@index([rescueId])
}

// New model for gateways
model Gateway {
    id              String    @id @default(uuid())
    gatewayId       String    @unique
    type            String    // 'fixed' | 'mobile'
    name            String?
    lat             Float?
    lng             Float?
    battery         Int?
    signal4g        Int?
    packetsToday    Int       @default(0)
    devicesSeen     Int       @default(0)
    lastSeen        DateTime  @default(now())
    createdAt       DateTime  @default(now())

    @@index([type])
    @@index([lastSeen])
}
```

### 4.2 Migration
```bash
npx prisma migrate dev --name add_multi_source_support
```

---

## 5. NEW API ENDPOINTS

### 5.1 LoRa Rescue Ingestion
```
POST /api/rescues/lora
Headers:
    X-Source: lora-gateway-fixed | lora-gateway-mobile
    X-Gateway-Key: <api_key>
Body:
{
    "lat": 16.0544,
    "lng": 108.2022,
    "people": 5,
    "urgency": "high",
    "injured": true,
    "water_level": 2,
    "no_food": false,
    "is_panic": false,
    "phone": "****1234",
    "fingerprint": "0x1a2b3c4d5e6f7890",
    "source_drone": 1,
    "source_channel": "lora_fixed"
}

Response: 201
{
    "success": true,
    "id": "rescue-uuid",
    "source": "lora_fixed",
    "is_duplicate": false
}
```

### 5.2 Gateway Status
```
POST /api/gateways/status
Headers:
    X-Gateway-Key: <api_key>
Body:
{
    "gateway_id": "GW-MOBILE-001",
    "type": "mobile",
    "position": { "lat": 16.05, "lng": 108.20 },
    "battery": 75,
    "signal_4g": 4,
    "packets_today": 127,
    "devices_seen": 5
}

Response: 200
{ "success": true }
```

### 5.3 Get Gateways (Dashboard)
```
GET /api/gateways

Response: 200
{
    "gateways": [
        {
            "id": "GW-FIXED-001",
            "type": "fixed",
            "name": "HQ Gateway",
            "status": "online",
            "packets_today": 523
        },
        {
            "id": "GW-MOBILE-001",
            "type": "mobile",
            "name": "Rescue Vehicle A",
            "position": { "lat": 16.05, "lng": 108.20 },
            "battery": 75,
            "status": "online"
        }
    ]
}
```

---

## 6. WEBSOCKET EVENTS (New)

### gateway:update
```typescript
// Emitted when gateway status changes
socket.on('gateway:update', (data) => {
    // data: GatewayStatus
});
```

### rescue:source_added
```typescript
// Emitted when duplicate arrives via different channel
socket.on('rescue:source_added', (data) => {
    // data: { rescueId, channel, sources: string[] }
});
```

---

## 7. ENV VARIABLES (New)

```env
# Add to .env
LORA_GATEWAY_API_KEY=your-lora-gateway-api-key

# MQTT (if subscribing directly instead of via bridge)
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USER=drecs
MQTT_PASS=mqtt_password
```

---

## 8. FILE CHANGES

### New Files
```
src/routes/lora.ts              # LoRa ingestion routes
src/routes/gateway.ts           # Gateway management routes
src/services/gateway.service.ts # Gateway service
src/middlewares/loraAuth.ts     # LoRa authentication
```

### Modified Files
```
src/app.ts                      # Add new routes
src/services/rescue.service.ts  # Add createFromLora()
src/services/dedup.service.ts   # Multi-source dedup
prisma/schema.prisma            # New models
```

---

## 9. ESTIMATED CHANGES

| File | Lines Changed |
|------|---------------|
| routes/lora.ts (new) | +80 |
| routes/gateway.ts (new) | +60 |
| services/gateway.service.ts (new) | +100 |
| middlewares/loraAuth.ts (new) | +30 |
| services/rescue.service.ts | +40 |
| services/dedup.service.ts | +60 |
| app.ts | +10 |
| schema.prisma | +30 |
| **TOTAL** | **~410 lines** |

---

## 10. ACCEPTANCE CRITERIA

| # | Criteria | Test |
|---|----------|------|
| 1 | LoRa endpoint works | POST /api/rescues/lora → 201 |
| 2 | Dedup across channels | Same fingerprint, different source → logged |
| 3 | Gateway status saved | POST /api/gateways/status → DB |
| 4 | Dashboard sees gateways | GET /api/gateways returns list |
| 5 | WebSocket broadcasts | New gateway → dashboard updates |
| 6 | Auth works | Invalid key → 401 |

---

**CONTRACT APPROVED**

Signature: _________________
Date: 01/01/2026
