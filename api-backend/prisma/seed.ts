// ═══════════════════════════════════════════════════════════════
//                    DRECS - Database Seed
// ═══════════════════════════════════════════════════════════════

import { PrismaClient, TeamType, TeamStatus, DroneStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─────────────────────────────────────────────────────────────────
  // TEAMS - Đội cứu hộ mẫu
  // ─────────────────────────────────────────────────────────────────
  
  const teams = [
    {
      id: 'team-001',
      name: 'Đội Xuồng Miền Trung 01',
      type: TeamType.BOAT,
      capacity: 8,
      lat: 16.4637,
      lng: 107.5909,
      status: TeamStatus.AVAILABLE,
      phone: '0901234001',
      leader: 'Nguyễn Văn An'
    },
    {
      id: 'team-002',
      name: 'Đội Xuồng Miền Trung 02',
      type: TeamType.BOAT,
      capacity: 6,
      lat: 16.4700,
      lng: 107.6000,
      status: TeamStatus.AVAILABLE,
      phone: '0901234002',
      leader: 'Trần Văn Bình'
    },
    {
      id: 'team-003',
      name: 'Đội Trực Thăng QK4',
      type: TeamType.HELICOPTER,
      capacity: 4,
      lat: 16.4500,
      lng: 107.5500,
      status: TeamStatus.AVAILABLE,
      phone: '0901234003',
      leader: 'Lê Văn Cường'
    },
    {
      id: 'team-004',
      name: 'Đội Bộ Binh Xã Hương Trà',
      type: TeamType.FOOT,
      capacity: 10,
      lat: 16.4800,
      lng: 107.6200,
      status: TeamStatus.AVAILABLE,
      phone: '0901234004',
      leader: 'Phạm Văn Dũng'
    },
    {
      id: 'team-005',
      name: 'Đội Xe Cứu Hộ TP Huế',
      type: TeamType.TRUCK,
      capacity: 15,
      lat: 16.4637,
      lng: 107.5909,
      status: TeamStatus.OFFLINE,
      phone: '0901234005',
      leader: 'Hoàng Văn Em'
    }
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: team,
      create: team
    });
  }
  console.log(`✅ Created ${teams.length} teams`);

  // ─────────────────────────────────────────────────────────────────
  // DRONES - Drone mẫu
  // ─────────────────────────────────────────────────────────────────
  
  const drones = [
    {
      id: 'D01',
      name: 'Drone Alpha',
      lat: 16.4650,
      lng: 107.5920,
      altitude: 50,
      batteryPercent: 85,
      signalStrength: 'strong',
      connectedUsers: 0,
      queueSize: 0,
      status: DroneStatus.IDLE
    },
    {
      id: 'D02',
      name: 'Drone Beta',
      lat: 16.4700,
      lng: 107.6000,
      altitude: 45,
      batteryPercent: 72,
      signalStrength: 'medium',
      connectedUsers: 3,
      queueSize: 2,
      status: DroneStatus.ACTIVE
    },
    {
      id: 'D03',
      name: 'Drone Gamma',
      lat: 16.4550,
      lng: 107.5800,
      altitude: 0,
      batteryPercent: 20,
      signalStrength: 'weak',
      connectedUsers: 0,
      queueSize: 0,
      status: DroneStatus.RETURNING
    },
    {
      id: 'D04',
      name: 'Drone Delta',
      lat: null,
      lng: null,
      altitude: null,
      batteryPercent: null,
      signalStrength: null,
      connectedUsers: 0,
      queueSize: 0,
      status: DroneStatus.OFFLINE
    }
  ];

  for (const drone of drones) {
    await prisma.drone.upsert({
      where: { id: drone.id },
      update: drone,
      create: drone
    });
  }
  console.log(`✅ Created ${drones.length} drones`);

  // ─────────────────────────────────────────────────────────────────
  // SAMPLE RESCUE POINTS (for testing)
  // ─────────────────────────────────────────────────────────────────
  
  const rescuePoints = [
    {
      fingerprint: 'SAMPLE001',
      lat: 16.4680,
      lng: 107.5950,
      people: 5,
      urgency: 3,
      injured: true,
      waterLevel: '1-2m',
      foodAvailable: false,
      phone: '0912345678',
      priorityScore: 95,
      sourceDrone: 'D02',
      isPanic: false
    },
    {
      fingerprint: 'SAMPLE002',
      lat: 16.4720,
      lng: 107.6050,
      people: 3,
      urgency: 2,
      injured: false,
      waterLevel: '0.5-1m',
      foodAvailable: true,
      phone: '0923456789',
      priorityScore: 65,
      sourceDrone: 'D02',
      isPanic: false
    },
    {
      fingerprint: 'SAMPLE003',
      lat: 16.4600,
      lng: 107.5850,
      people: 8,
      urgency: 3,
      injured: true,
      waterLevel: '>2m',
      foodAvailable: false,
      phone: null,
      priorityScore: 120,
      sourceDrone: 'D01',
      isPanic: true
    }
  ];

  for (const point of rescuePoints) {
    await prisma.rescuePoint.upsert({
      where: { fingerprint: point.fingerprint },
      update: point,
      create: point
    });
  }
  console.log(`✅ Created ${rescuePoints.length} sample rescue points`);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - Teams: ${teams.length}`);
  console.log(`  - Drones: ${drones.length}`);
  console.log(`  - Rescue Points: ${rescuePoints.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
