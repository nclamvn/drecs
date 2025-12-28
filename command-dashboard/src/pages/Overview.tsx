// ═══════════════════════════════════════════════════════════════
//                    DRECS - Overview Page
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { KPICards } from '@/components/dashboard/KPICards';
import { RescueMap } from '@/components/map/RescueMap';
import { RescueList } from '@/components/rescue/RescueList';
import { useRescueStore } from '@/stores/rescueStore';
import { useTeamStore } from '@/stores/teamStore';
import { useDroneStore } from '@/stores/droneStore';
import * as socket from '@/services/socket';

export function Overview() {
  const fetchRescuePoints = useRescueStore((state) => state.fetchRescuePoints);
  const fetchStats = useRescueStore((state) => state.fetchStats);
  const addRescuePoint = useRescueStore((state) => state.addRescuePoint);
  const updateRescuePoint = useRescueStore((state) => state.updateRescuePoint);
  const fetchTeams = useTeamStore((state) => state.fetchTeams);
  const fetchDrones = useDroneStore((state) => state.fetchDrones);
  const fetchDroneStats = useDroneStore((state) => state.fetchStats);

  // Initial fetch
  useEffect(() => {
    fetchRescuePoints();
    fetchStats();
    fetchTeams();
    fetchDrones();
    fetchDroneStats();

    // Connect WebSocket
    socket.connect();

    // Subscribe to events
    socket.on('rescue:new', addRescuePoint);
    socket.on('rescue:updated', updateRescuePoint);

    // Cleanup
    return () => {
      socket.off('rescue:new', addRescuePoint);
      socket.off('rescue:updated', updateRescuePoint);
    };
  }, []);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchDroneStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-500">Trung tâm điều hành cứu hộ khẩn cấp</p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Map Section */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold">Bản đồ cứu hộ</h2>
          <Link to="/map" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
            Xem toàn màn hình <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4">
          <RescueMap height="400px" />
        </div>
      </div>

      {/* Priority List */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold">Danh sách ưu tiên</h2>
          <Link to="/rescue" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4">
          <RescueList limit={5} showFilters={false} />
        </div>
      </div>
    </div>
  );
}

export default Overview;
