// ═══════════════════════════════════════════════════════════════
//                    DRECS - Sidebar Component
// ═══════════════════════════════════════════════════════════════

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  List,
  Users,
  Radio,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useRescueStore } from '@/stores/rescueStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/map', icon: Map, label: 'Bản đồ' },
  { to: '/rescue', icon: List, label: 'Danh sách' },
  { to: '/teams', icon: Users, label: 'Đội cứu hộ' },
  { to: '/drones', icon: Radio, label: 'Drone' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
];

export function Sidebar() {
  const stats = useRescueStore((state) => state.stats);
  const pendingCount = stats?.byStatus.pending || 0;
  const criticalCount = stats?.alerts.critical || 0;

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">DRECS</h1>
            <p className="text-xs text-gray-400">Trung tâm điều hành</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                
                {/* Badge for pending items */}
                {item.to === '/rescue' && pendingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Alert Summary */}
      {criticalCount > 0 && (
        <div className="p-4 border-t border-gray-700">
          <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {criticalCount} khẩn cấp
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-center">
        <p className="text-xs text-gray-500">DRECS v1.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;
