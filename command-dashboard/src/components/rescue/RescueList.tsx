// ═══════════════════════════════════════════════════════════════
//                    DRECS - Rescue List Component
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { MapPin, Users, Droplets, Clock, ChevronRight } from 'lucide-react';
import { useRescueStore } from '@/stores/rescueStore';
import { cn } from '@/utils/cn';
import {
  formatRelativeTime,
  formatCoordinates,
  getStatusBadgeClass,
  getPriorityColor,
} from '@/utils/formatters';
import {
  STATUS_LABELS,
  URGENCY_LABELS,
  URGENCY_COLORS,
} from '@/utils/constants';
import type { RescuePoint } from '@/types';
import { AssignModal } from './AssignModal';

interface RescueCardProps {
  point: RescuePoint;
  onSelect: (point: RescuePoint) => void;
  onAssign: (point: RescuePoint) => void;
}

function RescueCard({ point, onSelect, onAssign }: RescueCardProps) {
  return (
    <div
      className={cn(
        'card p-4 hover:shadow-md transition-shadow cursor-pointer',
        point.urgency === 3 && point.status === 'PENDING' && 'border-l-4 border-l-red-500'
      )}
      onClick={() => onSelect(point)}
    >
      <div className="flex items-start justify-between">
        {/* Left side */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('badge', URGENCY_COLORS[point.urgency])}>
              {URGENCY_LABELS[point.urgency]}
            </span>
            <span className={cn('badge', getStatusBadgeClass(point.status))}>
              {STATUS_LABELS[point.status]}
            </span>
            {point.injured && (
              <span className="badge bg-red-100 text-red-800">🩺 Thương</span>
            )}
            {point.isPanic && (
              <span className="badge bg-red-600 text-white">🚨 PANIC</span>
            )}
          </div>

          {/* ID & Priority */}
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-lg">#{point.fingerprint}</span>
            <span className={cn('text-sm font-medium', getPriorityColor(point.priorityScore))}>
              Điểm: {point.priorityScore}
            </span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{formatCoordinates(point.lat, point.lng)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{point.people} người</span>
            </div>
            {point.waterLevel && (
              <div className="flex items-center gap-1">
                <Droplets className="w-4 h-4" />
                <span>{point.waterLevel}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatRelativeTime(point.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-col items-end gap-2">
          {point.status === 'PENDING' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(point);
              }}
              className="btn btn-primary btn-sm"
            >
              Gán đội
            </button>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN LIST COMPONENT
// ─────────────────────────────────────────────────────────────────

interface RescueListProps {
  limit?: number;
  showFilters?: boolean;
}

export function RescueList({ limit, showFilters = true }: RescueListProps) {
  const [assigningPoint, setAssigningPoint] = useState<RescuePoint | null>(null);
  
  const rescuePoints = useRescueStore((state) => state.rescuePoints);
  const filter = useRescueStore((state) => state.filter);
  const setFilter = useRescueStore((state) => state.setFilter);
  const selectPoint = useRescueStore((state) => state.selectPoint);
  const isLoading = useRescueStore((state) => state.isLoading);

  const displayedPoints = limit ? rescuePoints.slice(0, limit) : rescuePoints;

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="flex gap-4 mb-4">
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ status: e.target.value || null })}
            className="select w-40"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="ASSIGNED">Đã gán</option>
            <option value="IN_PROGRESS">Đang cứu</option>
            <option value="RESCUED">Đã cứu</option>
          </select>

          <select
            value={filter.sortBy}
            onChange={(e) => setFilter({ sortBy: e.target.value })}
            className="select w-40"
          >
            <option value="priorityScore">Ưu tiên</option>
            <option value="createdAt">Thời gian</option>
            <option value="urgency">Mức độ</option>
          </select>

          <select
            value={filter.sortOrder}
            onChange={(e) => setFilter({ sortOrder: e.target.value as 'asc' | 'desc' })}
            className="select w-36"
          >
            <option value="desc">Cao → Thấp</option>
            <option value="asc">Thấp → Cao</option>
          </select>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : displayedPoints.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Không có điểm cứu hộ nào
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPoints.map((point) => (
            <RescueCard
              key={point.id}
              point={point}
              onSelect={selectPoint}
              onAssign={setAssigningPoint}
            />
          ))}
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

export default RescueList;
