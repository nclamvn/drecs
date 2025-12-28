// ═══════════════════════════════════════════════════════════════
//                    DRECS - Drones Page
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useDroneStore } from '@/stores/droneStore';
import { formatCoordinates, formatRelativeTime } from '@/utils/formatters';
import { DRONE_STATUS_LABELS } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { Battery, Wifi, Users, Clock, Radio } from 'lucide-react';

export function DronesPage() {
  const drones = useDroneStore((state) => state.drones);
  const stats = useDroneStore((state) => state.stats);
  const isLoading = useDroneStore((state) => state.isLoading);
  const fetchDrones = useDroneStore((state) => state.fetchDrones);
  const fetchStats = useDroneStore((state) => state.fetchStats);

  useEffect(() => {
    fetchDrones();
    fetchStats();
  }, [fetchDrones, fetchStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'IDLE': return 'bg-blue-100 text-blue-800';
      case 'RETURNING': return 'bg-yellow-100 text-yellow-800';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryColor = (percent: number | null) => {
    if (percent === null) return 'text-gray-400';
    if (percent > 50) return 'text-green-500';
    if (percent > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSignalIcon = (strength: string | null) => {
    switch (strength) {
      case 'strong': return '📶';
      case 'medium': return '📶';
      case 'weak': return '📶';
      default: return '❌';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drone</h1>
          <p className="text-gray-500">
            Tổng: {stats?.total || 0} • 
            Hoạt động: {stats?.byStatus.active || 0} • 
            Offline: {stats?.byStatus.offline || 0}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.aggregates.totalConnectedUsers}</p>
                <p className="text-sm text-gray-500">Người đang kết nối</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Radio className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.aggregates.totalQueueSize}</p>
                <p className="text-sm text-gray-500">Yêu cầu trong queue</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Battery className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.aggregates.avgBattery}%</p>
                <p className="text-sm text-gray-500">Pin trung bình</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drone List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drones.map((drone) => (
            <div key={drone.id} className={cn(
              'card p-4',
              drone.status === 'OFFLINE' && 'opacity-60'
            )}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center text-2xl">
                    📡
                  </div>
                  <div>
                    <h3 className="font-semibold">{drone.name || drone.id}</h3>
                    <p className="text-sm text-gray-500">ID: {drone.id}</p>
                  </div>
                </div>
                <span className={cn('badge', getStatusColor(drone.status))}>
                  {DRONE_STATUS_LABELS[drone.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Battery */}
                <div className="flex items-center gap-2">
                  <Battery className={cn('w-4 h-4', getBatteryColor(drone.batteryPercent))} />
                  <span>{drone.batteryPercent !== null ? `${drone.batteryPercent}%` : '---'}</span>
                </div>

                {/* Signal */}
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-gray-400" />
                  <span>{getSignalIcon(drone.signalStrength)} {drone.signalStrength || '---'}</span>
                </div>

                {/* Connected Users */}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{drone.connectedUsers} kết nối</span>
                </div>

                {/* Queue Size */}
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-gray-400" />
                  <span>{drone.queueSize} queue</span>
                </div>
              </div>

              {/* Location & Last Heartbeat */}
              <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                {drone.lat && drone.lng && (
                  <p>📍 {formatCoordinates(drone.lat, drone.lng)}</p>
                )}
                {drone.lastHeartbeat && (
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Heartbeat: {formatRelativeTime(drone.lastHeartbeat)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DronesPage;
