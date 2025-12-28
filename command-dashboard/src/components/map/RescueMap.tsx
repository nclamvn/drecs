// ═══════════════════════════════════════════════════════════════
//                    DRECS - Rescue Map Component
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER, MAP_ZOOM } from '@/utils/constants';
import { useRescueStore } from '@/stores/rescueStore';
import { useTeamStore } from '@/stores/teamStore';
import { useDroneStore } from '@/stores/droneStore';
import { formatCoordinates, formatRelativeTime } from '@/utils/formatters';
import { STATUS_LABELS, URGENCY_LABELS, TEAM_TYPE_ICONS } from '@/utils/constants';
import type { RescuePoint, Team, Drone } from '@/types';

// ─────────────────────────────────────────────────────────────────
// CUSTOM ICONS
// ─────────────────────────────────────────────────────────────────

const createIcon = (color: string, pulse: boolean = false) => {
  return L.divIcon({
    className: `custom-marker ${pulse ? 'marker-critical' : ''}`,
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const rescueIcons = {
  1: createIcon('#22c55e'), // Low - green
  2: createIcon('#f59e0b'), // Medium - yellow
  3: createIcon('#ef4444', true), // High - red with pulse
};

const teamIcon = L.divIcon({
  className: 'team-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: #2563eb;
      border: 3px solid white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">🚤</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const droneIcon = L.divIcon({
  className: 'drone-marker',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #0891b2;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">📡</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ─────────────────────────────────────────────────────────────────
// MAP CONTROLLER
// ─────────────────────────────────────────────────────────────────

function MapController({ center }: { center?: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 });
    }
  }, [center, map]);
  
  return null;
}

// ─────────────────────────────────────────────────────────────────
// RESCUE MARKER
// ─────────────────────────────────────────────────────────────────

function RescueMarker({ point, onSelect }: { point: RescuePoint; onSelect: (p: RescuePoint) => void }) {
  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={rescueIcons[point.urgency]}
      eventHandlers={{
        click: () => onSelect(point),
      }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <div className="font-bold text-lg mb-2">#{point.fingerprint}</div>
          <div className="space-y-1 text-sm">
            <p>📍 {formatCoordinates(point.lat, point.lng)}</p>
            <p>👥 {point.people} người</p>
            <p>🚨 {URGENCY_LABELS[point.urgency]}</p>
            {point.injured && <p className="text-red-600">🩺 Có người bị thương</p>}
            {point.waterLevel && <p>🌊 Mực nước: {point.waterLevel}</p>}
            <p>📊 Trạng thái: {STATUS_LABELS[point.status]}</p>
            <p className="text-gray-500">⏱️ {formatRelativeTime(point.createdAt)}</p>
          </div>
          <button
            onClick={() => onSelect(point)}
            className="btn btn-primary btn-sm w-full mt-3"
          >
            Xem chi tiết
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

// ─────────────────────────────────────────────────────────────────
// TEAM MARKER
// ─────────────────────────────────────────────────────────────────

function TeamMarker({ team }: { team: Team }) {
  return (
    <Marker position={[team.lat, team.lng]} icon={teamIcon}>
      <Popup>
        <div className="min-w-[180px]">
          <div className="font-bold">{TEAM_TYPE_ICONS[team.type]} {team.name}</div>
          <div className="space-y-1 text-sm mt-2">
            <p>📍 {formatCoordinates(team.lat, team.lng)}</p>
            <p>👥 Sức chứa: {team.capacity}</p>
            <p>📊 {team.status === 'AVAILABLE' ? '✅ Sẵn sàng' : '🔄 Đang bận'}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// ─────────────────────────────────────────────────────────────────
// DRONE MARKER
// ─────────────────────────────────────────────────────────────────

function DroneMarker({ drone }: { drone: Drone }) {
  if (!drone.lat || !drone.lng) return null;
  
  return (
    <Marker position={[drone.lat, drone.lng]} icon={droneIcon}>
      <Popup>
        <div className="min-w-[180px]">
          <div className="font-bold">📡 {drone.name || drone.id}</div>
          <div className="space-y-1 text-sm mt-2">
            <p>🔋 Pin: {drone.batteryPercent}%</p>
            <p>👥 Kết nối: {drone.connectedUsers}</p>
            <p>📤 Queue: {drone.queueSize}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN MAP COMPONENT
// ─────────────────────────────────────────────────────────────────

interface RescueMapProps {
  height?: string;
  showTeams?: boolean;
  showDrones?: boolean;
  center?: [number, number];
  onSelectPoint?: (point: RescuePoint) => void;
}

export function RescueMap({
  height = '500px',
  showTeams = true,
  showDrones = true,
  center,
  onSelectPoint,
}: RescueMapProps) {
  const rescuePoints = useRescueStore((state) => state.rescuePoints);
  const selectPoint = useRescueStore((state) => state.selectPoint);
  const teams = useTeamStore((state) => state.teams);
  const drones = useDroneStore((state) => state.drones);

  const handleSelectPoint = (point: RescuePoint) => {
    selectPoint(point);
    onSelectPoint?.(point);
  };

  // Filter only active rescue points
  const activePoints = rescuePoints.filter(
    (p) => p.status === 'PENDING' || p.status === 'ASSIGNED' || p.status === 'IN_PROGRESS'
  );

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden shadow-sm">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} />
        
        {/* Rescue Points */}
        {activePoints.map((point) => (
          <RescueMarker
            key={point.id}
            point={point}
            onSelect={handleSelectPoint}
          />
        ))}
        
        {/* Teams */}
        {showTeams && teams.map((team) => (
          <TeamMarker key={team.id} team={team} />
        ))}
        
        {/* Drones */}
        {showDrones && drones
          .filter((d) => d.status !== 'OFFLINE' && d.lat && d.lng)
          .map((drone) => (
            <DroneMarker key={drone.id} drone={drone} />
          ))
        }
      </MapContainer>
    </div>
  );
}

export default RescueMap;
