// ═══════════════════════════════════════════════════════════════
//                    DRECS - Teams Page
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useTeamStore } from '@/stores/teamStore';
import { formatCoordinates } from '@/utils/formatters';
import { TEAM_TYPE_ICONS, TEAM_TYPE_LABELS, TEAM_STATUS_LABELS } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { MapPin, Users, Phone } from 'lucide-react';

export function TeamsPage() {
  const teams = useTeamStore((state) => state.teams);
  const isLoading = useTeamStore((state) => state.isLoading);
  const fetchTeams = useTeamStore((state) => state.fetchTeams);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'BUSY': return 'bg-yellow-100 text-yellow-800';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableCount = teams.filter(t => t.status === 'AVAILABLE').length;
  const busyCount = teams.filter(t => t.status === 'BUSY').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đội cứu hộ</h1>
          <p className="text-gray-500">
            Tổng: {teams.length} đội • Sẵn sàng: {availableCount} • Đang bận: {busyCount}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                    {TEAM_TYPE_ICONS[team.type]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-gray-500">{TEAM_TYPE_LABELS[team.type]}</p>
                  </div>
                </div>
                <span className={cn('badge', getStatusColor(team.status))}>
                  {TEAM_STATUS_LABELS[team.status]}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{formatCoordinates(team.lat, team.lng)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Sức chứa: {team.capacity} người</span>
                </div>
                {team.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{team.phone}</span>
                  </div>
                )}
                {team.leader && (
                  <p className="text-gray-500">Đội trưởng: {team.leader}</p>
                )}
              </div>

              {team.status === 'BUSY' && team.missions && team.missions.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-yellow-600">
                    🔄 Đang thực hiện {team.missions.length} nhiệm vụ
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamsPage;
