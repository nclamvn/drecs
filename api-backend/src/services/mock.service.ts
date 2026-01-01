// ═══════════════════════════════════════════════════════════════
//                    DRECS - Mock Data Service
//        Fallback data when database is unavailable
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// MOCK RESCUE POINTS
// ─────────────────────────────────────────────────────────────────

export const mockRescuePoints = [
  {
    id: 'rp-001',
    fingerprint: 'fp-mock-001',
    lat: 16.0544,
    lng: 108.2022,
    people: 5,
    urgency: 3,
    injured: true,
    waterLevel: '>2m',
    foodAvailable: false,
    phone: '0901234567',
    status: 'PENDING',
    priorityScore: 95,
    sourceDrone: 'D01',
    sourceChannel: '4g',
    isPanic: true,
    createdAt: new Date(Date.now() - 30 * 60000),
    updatedAt: new Date(),
    missions: [],
    sources: [{ channel: '4g', receivedAt: new Date() }]
  },
  {
    id: 'rp-002',
    fingerprint: 'fp-mock-002',
    lat: 16.0612,
    lng: 108.2156,
    people: 3,
    urgency: 2,
    injured: false,
    waterLevel: '1-2m',
    foodAvailable: true,
    phone: '0912345678',
    status: 'ASSIGNED',
    priorityScore: 65,
    sourceDrone: 'D02',
    sourceChannel: 'lora_fixed',
    isPanic: false,
    createdAt: new Date(Date.now() - 45 * 60000),
    updatedAt: new Date(),
    missions: [],
    sources: [{ channel: 'lora_fixed', receivedAt: new Date() }]
  },
  {
    id: 'rp-003',
    fingerprint: 'fp-mock-003',
    lat: 16.0478,
    lng: 108.1889,
    people: 8,
    urgency: 3,
    injured: true,
    waterLevel: '>2m',
    foodAvailable: false,
    phone: '0923456789',
    status: 'IN_PROGRESS',
    priorityScore: 88,
    sourceDrone: 'D01',
    sourceChannel: '4g',
    isPanic: false,
    createdAt: new Date(Date.now() - 60 * 60000),
    updatedAt: new Date(),
    missions: [],
    sources: [
      { channel: '4g', receivedAt: new Date(Date.now() - 60 * 60000) },
      { channel: 'lora_fixed', receivedAt: new Date(Date.now() - 55 * 60000) }
    ]
  },
  {
    id: 'rp-004',
    fingerprint: 'fp-mock-004',
    lat: 16.0701,
    lng: 108.2234,
    people: 2,
    urgency: 1,
    injured: false,
    waterLevel: '0.5-1m',
    foodAvailable: true,
    phone: '0934567890',
    status: 'RESCUED',
    priorityScore: 30,
    sourceDrone: 'D03',
    sourceChannel: 'lora_mobile',
    isPanic: false,
    createdAt: new Date(Date.now() - 120 * 60000),
    updatedAt: new Date(),
    missions: [],
    sources: [{ channel: 'lora_mobile', receivedAt: new Date() }]
  }
];

// ─────────────────────────────────────────────────────────────────
// MOCK TEAMS
// ─────────────────────────────────────────────────────────────────

export const mockTeams = [
  {
    id: 'team-001',
    name: 'Đội cứu hộ Alpha',
    type: 'BOAT',
    capacity: 8,
    lat: 16.0520,
    lng: 108.2100,
    status: 'AVAILABLE',
    phone: '0901111111',
    leader: 'Nguyễn Văn A',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'team-002',
    name: 'Đội cứu hộ Bravo',
    type: 'BOAT',
    capacity: 6,
    lat: 16.0580,
    lng: 108.2050,
    status: 'BUSY',
    phone: '0902222222',
    leader: 'Trần Văn B',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'team-003',
    name: 'Đội trực thăng Charlie',
    type: 'HELICOPTER',
    capacity: 4,
    lat: 16.0450,
    lng: 108.1950,
    status: 'AVAILABLE',
    phone: '0903333333',
    leader: 'Lê Văn C',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'team-004',
    name: 'Đội bộ Delta',
    type: 'FOOT',
    capacity: 10,
    lat: 16.0650,
    lng: 108.2200,
    status: 'AVAILABLE',
    phone: '0904444444',
    leader: 'Phạm Văn D',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'team-005',
    name: 'Đội xe tải Echo',
    type: 'TRUCK',
    capacity: 20,
    lat: 16.0400,
    lng: 108.2300,
    status: 'OFFLINE',
    phone: '0905555555',
    leader: 'Hoàng Văn E',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ─────────────────────────────────────────────────────────────────
// MOCK DRONES
// ─────────────────────────────────────────────────────────────────

export const mockDrones = [
  {
    id: 'D01',
    name: 'Drone Alpha',
    lat: 16.0550,
    lng: 108.2030,
    altitude: 50,
    batteryPercent: 85,
    signalStrength: 'strong',
    connectedUsers: 12,
    queueSize: 3,
    status: 'ACTIVE',
    lastHeartbeat: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'D02',
    name: 'Drone Bravo',
    lat: 16.0620,
    lng: 108.2150,
    altitude: 45,
    batteryPercent: 72,
    signalStrength: 'medium',
    connectedUsers: 8,
    queueSize: 2,
    status: 'ACTIVE',
    lastHeartbeat: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'D03',
    name: 'Drone Charlie',
    lat: 16.0480,
    lng: 108.1900,
    altitude: 55,
    batteryPercent: 45,
    signalStrength: 'weak',
    connectedUsers: 5,
    queueSize: 1,
    status: 'RETURNING',
    lastHeartbeat: new Date(Date.now() - 60000),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'D04',
    name: 'Drone Delta',
    lat: 16.0700,
    lng: 108.2250,
    altitude: 0,
    batteryPercent: 20,
    signalStrength: 'weak',
    connectedUsers: 0,
    queueSize: 0,
    status: 'OFFLINE',
    lastHeartbeat: new Date(Date.now() - 600000),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ─────────────────────────────────────────────────────────────────
// MOCK GATEWAYS
// ─────────────────────────────────────────────────────────────────

export const mockGateways = [
  {
    id: 'gw-001',
    gatewayId: 'GW-FIXED-001',
    type: 'FIXED',
    name: 'HQ Gateway',
    lat: 16.0500,
    lng: 108.2000,
    battery: null,
    signal4g: null,
    packetsToday: 523,
    devicesSeen: 4,
    lastSeen: new Date(),
    status: 'online',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'gw-002',
    gatewayId: 'GW-MOBILE-001',
    type: 'MOBILE',
    name: 'Xe cứu hộ A',
    lat: 16.0580,
    lng: 108.2120,
    battery: 75,
    signal4g: 4,
    packetsToday: 127,
    devicesSeen: 2,
    lastSeen: new Date(),
    status: 'online',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'gw-003',
    gatewayId: 'GW-MOBILE-002',
    type: 'MOBILE',
    name: 'Trạm tiền phương B',
    lat: 16.0420,
    lng: 108.1850,
    battery: 92,
    signal4g: 3,
    packetsToday: 89,
    devicesSeen: 1,
    lastSeen: new Date(Date.now() - 120000),
    status: 'online',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ─────────────────────────────────────────────────────────────────
// MOCK MISSIONS
// ─────────────────────────────────────────────────────────────────

export const mockMissions = [
  {
    id: 'mission-001',
    rescuePointId: 'rp-002',
    teamId: 'team-002',
    etaMinutes: 15,
    status: 'IN_PROGRESS',
    notes: 'Đang di chuyển đến điểm cứu hộ',
    startedAt: new Date(Date.now() - 10 * 60000),
    completedAt: null,
    createdAt: new Date(Date.now() - 15 * 60000),
    updatedAt: new Date(),
    team: mockTeams[1],
    rescuePoint: mockRescuePoints[1]
  },
  {
    id: 'mission-002',
    rescuePointId: 'rp-003',
    teamId: 'team-001',
    etaMinutes: 8,
    status: 'IN_PROGRESS',
    notes: 'Gần đến nơi',
    startedAt: new Date(Date.now() - 20 * 60000),
    completedAt: null,
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(),
    team: mockTeams[0],
    rescuePoint: mockRescuePoints[2]
  }
];

// ─────────────────────────────────────────────────────────────────
// STATISTICS
// ─────────────────────────────────────────────────────────────────

export const mockStats = {
  rescuePoints: {
    total: mockRescuePoints.length,
    byStatus: {
      pending: mockRescuePoints.filter(r => r.status === 'PENDING').length,
      assigned: mockRescuePoints.filter(r => r.status === 'ASSIGNED').length,
      inProgress: mockRescuePoints.filter(r => r.status === 'IN_PROGRESS').length,
      rescued: mockRescuePoints.filter(r => r.status === 'RESCUED').length,
      unreachable: 0
    },
    alerts: {
      critical: mockRescuePoints.filter(r => r.urgency === 3 && r.status === 'PENDING').length,
      withInjured: mockRescuePoints.filter(r => r.injured && ['PENDING', 'ASSIGNED'].includes(r.status)).length
    }
  },
  teams: {
    total: mockTeams.length,
    available: mockTeams.filter(t => t.status === 'AVAILABLE').length,
    busy: mockTeams.filter(t => t.status === 'BUSY').length,
    offline: mockTeams.filter(t => t.status === 'OFFLINE').length
  },
  drones: {
    total: mockDrones.length,
    active: mockDrones.filter(d => d.status === 'ACTIVE').length,
    connectedUsers: mockDrones.reduce((sum, d) => sum + d.connectedUsers, 0),
    queueTotal: mockDrones.reduce((sum, d) => sum + d.queueSize, 0)
  },
  gateways: {
    total: mockGateways.length,
    online: mockGateways.filter(g => g.status === 'online').length,
    packetsToday: mockGateways.reduce((sum, g) => sum + g.packetsToday, 0)
  }
};

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

let mockIdCounter = 100;

export function generateMockId(prefix: string): string {
  return `${prefix}-${++mockIdCounter}`;
}

export function addMockRescuePoint(data: any) {
  const newPoint = {
    id: generateMockId('rp'),
    fingerprint: data.fingerprint || `fp-${Date.now()}`,
    lat: data.lat,
    lng: data.lng,
    people: data.people || 1,
    urgency: data.urgency || 2,
    injured: data.injured || false,
    waterLevel: data.water_level || '0.5-1m',
    foodAvailable: data.food_available !== false,
    phone: data.phone || null,
    status: 'PENDING',
    priorityScore: data.priorityScore || 50,
    sourceDrone: data.source_drone || null,
    sourceChannel: data.source_channel || '4g',
    isPanic: data.is_panic || false,
    createdAt: new Date(),
    updatedAt: new Date(),
    missions: [],
    sources: [{ channel: data.source_channel || '4g', receivedAt: new Date() }]
  };
  mockRescuePoints.unshift(newPoint);
  return newPoint;
}

export function updateMockRescuePoint(id: string, data: any) {
  const index = mockRescuePoints.findIndex(r => r.id === id);
  if (index >= 0) {
    mockRescuePoints[index] = { ...mockRescuePoints[index], ...data, updatedAt: new Date() };
    return mockRescuePoints[index];
  }
  return null;
}

export default {
  rescuePoints: mockRescuePoints,
  teams: mockTeams,
  drones: mockDrones,
  gateways: mockGateways,
  missions: mockMissions,
  stats: mockStats,
  addRescuePoint: addMockRescuePoint,
  updateRescuePoint: updateMockRescuePoint
};
