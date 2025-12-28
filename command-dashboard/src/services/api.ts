// ═══════════════════════════════════════════════════════════════
//                    DRECS - API Service
// ═══════════════════════════════════════════════════════════════

import { API_BASE_URL } from '@/utils/constants';
import type {
  RescuePoint,
  Team,
  Mission,
  Drone,
  RescueStats,
  DroneStats,
  ApiResponse,
} from '@/types';

// ─────────────────────────────────────────────────────────────────
// BASE FETCH
// ─────────────────────────────────────────────────────────────────

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  
  return response.json();
}

// ─────────────────────────────────────────────────────────────────
// RESCUE POINTS
// ─────────────────────────────────────────────────────────────────

export async function getRescuePoints(params?: {
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ApiResponse<RescuePoint[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  
  const query = searchParams.toString();
  return fetchApi(`/api/v1/rescue-points${query ? `?${query}` : ''}`);
}

export async function getRescuePoint(id: string): Promise<ApiResponse<RescuePoint>> {
  return fetchApi(`/api/v1/rescue-points/${id}`);
}

export async function getRescueStats(): Promise<ApiResponse<RescueStats>> {
  return fetchApi('/api/v1/rescue-points/stats');
}

export async function updateRescuePoint(
  id: string,
  data: Partial<RescuePoint>
): Promise<ApiResponse<RescuePoint>> {
  return fetchApi(`/api/v1/rescue-points/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────
// TEAMS
// ─────────────────────────────────────────────────────────────────

export async function getTeams(params?: {
  status?: string;
  type?: string;
}): Promise<ApiResponse<Team[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);
  
  const query = searchParams.toString();
  return fetchApi(`/api/v1/teams${query ? `?${query}` : ''}`);
}

export async function getAvailableTeams(
  lat: number,
  lng: number
): Promise<ApiResponse<Team[]>> {
  return fetchApi(`/api/v1/teams/available?lat=${lat}&lng=${lng}`);
}

export async function getTeam(id: string): Promise<ApiResponse<Team>> {
  return fetchApi(`/api/v1/teams/${id}`);
}

export async function updateTeam(
  id: string,
  data: Partial<Team>
): Promise<ApiResponse<Team>> {
  return fetchApi(`/api/v1/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────
// MISSIONS
// ─────────────────────────────────────────────────────────────────

export async function getMissions(params?: {
  status?: string;
}): Promise<ApiResponse<Mission[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  return fetchApi(`/api/v1/missions${query ? `?${query}` : ''}`);
}

export async function getActiveMissions(): Promise<ApiResponse<Mission[]>> {
  return fetchApi('/api/v1/missions/active');
}

export async function createMission(data: {
  rescuePointId: string;
  teamId: string;
  notes?: string;
}): Promise<ApiResponse<Mission>> {
  return fetchApi('/api/v1/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMission(
  id: string,
  data: Partial<Mission>
): Promise<ApiResponse<Mission>> {
  return fetchApi(`/api/v1/missions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────
// DRONES
// ─────────────────────────────────────────────────────────────────

export async function getDrones(params?: {
  status?: string;
}): Promise<ApiResponse<Drone[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  return fetchApi(`/api/v1/drones${query ? `?${query}` : ''}`);
}

export async function getDrone(id: string): Promise<ApiResponse<Drone>> {
  return fetchApi(`/api/v1/drones/${id}`);
}

export async function getDroneStats(): Promise<ApiResponse<DroneStats>> {
  return fetchApi('/api/v1/drones/stats');
}

// ─────────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<any> {
  return fetchApi('/api/health');
}

export async function getHealthDetailed(): Promise<any> {
  return fetchApi('/api/health/detailed');
}

export default {
  getRescuePoints,
  getRescuePoint,
  getRescueStats,
  updateRescuePoint,
  getTeams,
  getAvailableTeams,
  getTeam,
  updateTeam,
  getMissions,
  getActiveMissions,
  createMission,
  updateMission,
  getDrones,
  getDrone,
  getDroneStats,
  getHealth,
  getHealthDetailed,
};
