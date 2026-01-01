// ═══════════════════════════════════════════════════════════════
//                    DRECS - Settings Page
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import * as api from '@/services/api';
import * as socket from '@/services/socket';

export function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHealthDetailed();
      setHealth(data);
    } catch (error) {
      setHealth({ status: 'error', error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const wsConnected = socket.isConnected();

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-500">Thông tin hệ thống và cấu hình</p>
      </div>

      {/* System Health */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold">Trạng thái hệ thống</h2>
          <button
            onClick={checkHealth}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Kiểm tra
          </button>
        </div>
        <div className="card-body space-y-4">
          {/* API Status */}
          <div className="flex items-center justify-between">
            <span>API Server</span>
            {health?.status === 'healthy' ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" /> Hoạt động
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" /> Lỗi
              </span>
            )}
          </div>

          {/* Database Status */}
          <div className="flex items-center justify-between">
            <span>Database</span>
            {health?.services?.database?.status === 'up' ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" /> Hoạt động ({health.services.database.latency})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" /> Lỗi
              </span>
            )}
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center justify-between">
            <span>WebSocket</span>
            {wsConnected ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" /> Đã kết nối
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" /> Ngắt kết nối
              </span>
            )}
          </div>

          {/* Version */}
          {health?.version && (
            <div className="flex items-center justify-between">
              <span>Phiên bản</span>
              <span className="text-gray-600">{health.version}</span>
            </div>
          )}

          {/* Uptime */}
          {health?.uptime && (
            <div className="flex items-center justify-between">
              <span>Uptime</span>
              <span className="text-gray-600">{Math.round(health.uptime / 60)} phút</span>
            </div>
          )}
        </div>
      </div>

      {/* Data Summary */}
      {health?.counts && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Dữ liệu hiện tại</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{health.counts.rescuePoints}</p>
                <p className="text-sm text-gray-500">Điểm cứu hộ</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{health.counts.teams}</p>
                <p className="text-sm text-gray-500">Đội cứu hộ</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{health.counts.drones}</p>
                <p className="text-sm text-gray-500">Drone</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{health.counts.activeMissions}</p>
                <p className="text-sm text-gray-500">Nhiệm vụ đang chạy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold">Về DRECS</h2>
        </div>
        <div className="card-body text-sm text-gray-600">
          <p className="mb-2">
            <strong>DRECS</strong> - Drone Relay Edge Rescue Coordination System
          </p>
          <p>Hệ thống điều phối cứu hộ khẩn cấp sử dụng drone làm node trung gian.</p>
          <p className="mt-4 text-gray-400">Phiên bản 1.0 • Vibecode Kit v4.0</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
