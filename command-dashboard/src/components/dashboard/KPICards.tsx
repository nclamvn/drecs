// ═══════════════════════════════════════════════════════════════
//                    DRECS - KPI Cards Component
// ═══════════════════════════════════════════════════════════════

import { Clock, CheckCircle, AlertTriangle, Radio } from 'lucide-react';
import { useRescueStore } from '@/stores/rescueStore';
import { useDroneStore } from '@/stores/droneStore';

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function KPICard({ title, value, icon, color, subtitle }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-label">{title}</p>
          <p className={`kpi-value ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KPICards() {
  const rescueStats = useRescueStore((state) => state.stats);
  const droneStats = useDroneStore((state) => state.stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Chờ xử lý"
        value={rescueStats?.byStatus.pending || 0}
        icon={<Clock className="w-6 h-6 text-red-600" />}
        color="text-red-600"
        subtitle={`${rescueStats?.alerts.critical || 0} khẩn cấp`}
      />
      
      <KPICard
        title="Đang cứu"
        value={(rescueStats?.byStatus.assigned || 0) + (rescueStats?.byStatus.inProgress || 0)}
        icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
        color="text-yellow-600"
        subtitle={`${rescueStats?.alerts.withInjured || 0} có thương`}
      />
      
      <KPICard
        title="Đã cứu"
        value={rescueStats?.byStatus.rescued || 0}
        icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        color="text-green-600"
        subtitle="Hôm nay"
      />
      
      <KPICard
        title="Drone hoạt động"
        value={droneStats?.byStatus.active || 0}
        icon={<Radio className="w-6 h-6 text-blue-600" />}
        color="text-blue-600"
        subtitle={`${droneStats?.aggregates.totalConnectedUsers || 0} người kết nối`}
      />
    </div>
  );
}

export default KPICards;
