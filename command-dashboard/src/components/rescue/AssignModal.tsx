// ═══════════════════════════════════════════════════════════════
//                    DRECS - Assign Mission Modal
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { X, MapPin, Users, Clock } from 'lucide-react';
import { useTeamStore } from '@/stores/teamStore';
import { useRescueStore } from '@/stores/rescueStore';
import * as api from '@/services/api';
import { formatCoordinates, formatDistance, formatETA } from '@/utils/formatters';
import { TEAM_TYPE_ICONS, TEAM_TYPE_LABELS, URGENCY_LABELS } from '@/utils/constants';
import type { RescuePoint, Team } from '@/types';

interface AssignModalProps {
  point: RescuePoint;
  onClose: () => void;
}

export function AssignModal({ point, onClose }: AssignModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTeams = useTeamStore((state) => state.availableTeams);
  const fetchAvailableTeams = useTeamStore((state) => state.fetchAvailableTeams);
  const fetchRescuePoints = useRescueStore((state) => state.fetchRescuePoints);

  useEffect(() => {
    fetchAvailableTeams(point.lat, point.lng);
  }, [point.lat, point.lng, fetchAvailableTeams]);

  const handleSubmit = async () => {
    if (!selectedTeamId) {
      setError('Vui lòng chọn đội cứu hộ');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createMission({
        rescuePointId: point.id,
        teamId: selectedTeamId,
        notes: notes || undefined,
      });
      fetchRescuePoints();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimateETA = (distance: number, type: string): number => {
    const speeds: Record<string, number> = { HELICOPTER: 150, BOAT: 25, TRUCK: 40, FOOT: 5 };
    return Math.ceil((distance / (speeds[type] || 20)) * 60) + 10;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Gán đội cứu hộ</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Điểm cứu hộ: #{point.fingerprint}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{formatCoordinates(point.lat, point.lng)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{point.people} người</span>
              </div>
              <div><span className="text-red-600">🚨 {URGENCY_LABELS[point.urgency]}</span></div>
              {point.injured && <div><span className="text-red-600">🩺 Có thương</span></div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn đội:</label>
            {availableTeams.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Không có đội nào sẵn sàng</div>
            ) : (
              <div className="space-y-2">
                {availableTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTeamId === team.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked={selectedTeamId === team.id} onChange={() => {}} className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{TEAM_TYPE_ICONS[team.type]} {team.name}</div>
                          <div className="text-sm text-gray-500">{TEAM_TYPE_LABELS[team.type]} • Sức chứa: {team.capacity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {team.distance && <div className="text-sm font-medium">{formatDistance(team.distance)}</div>}
                        {team.distance && <div className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatETA(estimateETA(team.distance, team.type))}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú:</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="VD: Ưu tiên người già..." className="input h-20 resize-none" />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
        </div>

        <div className="flex gap-3 p-4 border-t">
          <button onClick={onClose} className="btn btn-secondary flex-1">Hủy</button>
          <button onClick={handleSubmit} disabled={isSubmitting || !selectedTeamId} className="btn btn-primary flex-1 disabled:opacity-50">
            {isSubmitting ? 'Đang gán...' : 'Gán nhiệm vụ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignModal;
