// ═══════════════════════════════════════════════════════════════
//                    DRECS - Rescue List Page
// ═══════════════════════════════════════════════════════════════

import { RescueList } from '@/components/rescue/RescueList';
import { useRescueStore } from '@/stores/rescueStore';

export function RescueListPage() {
  const stats = useRescueStore((state) => state.stats);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách cứu hộ</h1>
          <p className="text-gray-500">
            Tổng: {stats?.total || 0} điểm • 
            Chờ: {stats?.byStatus.pending || 0} • 
            Đang cứu: {(stats?.byStatus.assigned || 0) + (stats?.byStatus.inProgress || 0)}
          </p>
        </div>
      </div>

      {/* List with filters */}
      <div className="card p-4">
        <RescueList showFilters={true} />
      </div>
    </div>
  );
}

export default RescueListPage;
