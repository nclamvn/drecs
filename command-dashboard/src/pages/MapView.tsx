// ═══════════════════════════════════════════════════════════════
//                    DRECS - Full Map View Page
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { RescueMap } from '@/components/map/RescueMap';
import { AssignModal } from '@/components/rescue/AssignModal';
import { useRescueStore } from '@/stores/rescueStore';
import { formatCoordinates, formatRelativeTime, getStatusBadgeClass } from '@/utils/formatters';
import { STATUS_LABELS, URGENCY_LABELS, URGENCY_COLORS } from '@/utils/constants';
import { X, MapPin, Users, Droplets, Phone } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RescuePoint } from '@/types';

export function MapView() {
  const [assigningPoint, setAssigningPoint] = useState<RescuePoint | null>(null);
  const selectedPoint = useRescueStore((state) => state.selectedPoint);
  const selectPoint = useRescueStore((state) => state.selectPoint);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Map */}
      <div className="flex-1">
        <RescueMap
          height="100%"
          center={selectedPoint ? [selectedPoint.lat, selectedPoint.lng] : undefined}
        />
      </div>

      {/* Detail Panel */}
      {selectedPoint && (
        <div className="w-96 card overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h2 className="font-bold text-lg">#{selectedPoint.fingerprint}</h2>
            <button
              onClick={() => selectPoint(null)}
              className="p-1 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={cn('badge', URGENCY_COLORS[selectedPoint.urgency])}>
                {URGENCY_LABELS[selectedPoint.urgency]}
              </span>
              <span className={cn('badge', getStatusBadgeClass(selectedPoint.status))}>
                {STATUS_LABELS[selectedPoint.status]}
              </span>
              {selectedPoint.injured && (
                <span className="badge bg-red-100 text-red-800">🩺 Thương</span>
              )}
              {selectedPoint.isPanic && (
                <span className="badge bg-red-600 text-white">🚨 PANIC</span>
              )}
            </div>

            {/* Priority */}
            <div className="bg-gray-100 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-gray-500">Điểm ưu tiên</p>
              <p className="text-3xl font-bold text-gray-900">{selectedPoint.priorityScore}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Vị trí</p>
                  <p className="font-medium">{formatCoordinates(selectedPoint.lat, selectedPoint.lng)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Số người</p>
                  <p className="font-medium">{selectedPoint.people} người</p>
                </div>
              </div>

              {selectedPoint.waterLevel && (
                <div className="flex items-start gap-3">
                  <Droplets className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Mực nước</p>
                    <p className="font-medium">{selectedPoint.waterLevel}</p>
                  </div>
                </div>
              )}

              {selectedPoint.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Điện thoại</p>
                    <p className="font-medium">{selectedPoint.phone}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500">
                  Tạo lúc: {formatRelativeTime(selectedPoint.createdAt)}
                </p>
                {selectedPoint.sourceDrone && (
                  <p className="text-sm text-gray-500">
                    Nguồn: Drone {selectedPoint.sourceDrone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t">
            {selectedPoint.status === 'PENDING' ? (
              <button
                onClick={() => setAssigningPoint(selectedPoint)}
                className="btn btn-primary w-full"
              >
                Gán đội cứu hộ
              </button>
            ) : (
              <div className="text-center text-sm text-gray-500">
                {selectedPoint.status === 'RESCUED' 
                  ? '✅ Đã cứu hộ thành công'
                  : '🔄 Đang được xử lý'
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigningPoint && (
        <AssignModal
          point={assigningPoint}
          onClose={() => setAssigningPoint(null)}
        />
      )}
    </div>
  );
}

export default MapView;
