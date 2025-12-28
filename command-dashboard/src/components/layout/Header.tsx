// ═══════════════════════════════════════════════════════════════
//                    DRECS - Header Component
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Search, Bell, Wifi, WifiOff, User } from 'lucide-react';
import { useRescueStore } from '@/stores/rescueStore';
import * as socket from '@/services/socket';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const stats = useRescueStore((state) => state.stats);
  const isConnected = socket.isConnected();
  
  const alertCount = (stats?.byStatus.pending || 0) + (stats?.alerts.withInjured || 0);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Đã kết nối</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Mất kết nối</span>
            </>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">Điều hành viên</p>
          </div>
          <button className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
