// ═══════════════════════════════════════════════════════════════
//                    DRECS - Rescue Store (Zustand)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { RescuePoint, RescueStats } from '@/types';
import * as api from '@/services/api';

interface RescueState {
  // Data
  rescuePoints: RescuePoint[];
  stats: RescueStats | null;
  selectedPoint: RescuePoint | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filter: {
    status: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  
  // Actions
  fetchRescuePoints: () => Promise<void>;
  fetchStats: () => Promise<void>;
  selectPoint: (point: RescuePoint | null) => void;
  setFilter: (filter: Partial<RescueState['filter']>) => void;
  addRescuePoint: (point: RescuePoint) => void;
  updateRescuePoint: (point: RescuePoint) => void;
  clearError: () => void;
}

export const useRescueStore = create<RescueState>((set, get) => ({
  // Initial state
  rescuePoints: [],
  stats: null,
  selectedPoint: null,
  isLoading: false,
  error: null,
  filter: {
    status: null,
    sortBy: 'priorityScore',
    sortOrder: 'desc',
  },
  
  // Fetch rescue points
  fetchRescuePoints: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filter } = get();
      const response = await api.getRescuePoints({
        status: filter.status || undefined,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
        limit: 100,
      });
      set({ rescuePoints: response.data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch rescue points',
        isLoading: false 
      });
    }
  },
  
  // Fetch stats
  fetchStats: async () => {
    try {
      const response = await api.getRescueStats();
      set({ stats: response.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },
  
  // Select point
  selectPoint: (point) => {
    set({ selectedPoint: point });
  },
  
  // Set filter
  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
    // Re-fetch with new filter
    get().fetchRescuePoints();
  },
  
  // Add new rescue point (from WebSocket)
  addRescuePoint: (point) => {
    set((state) => ({
      rescuePoints: [point, ...state.rescuePoints],
      stats: state.stats ? {
        ...state.stats,
        total: state.stats.total + 1,
        byStatus: {
          ...state.stats.byStatus,
          pending: state.stats.byStatus.pending + 1,
        },
      } : null,
    }));
  },
  
  // Update rescue point (from WebSocket)
  updateRescuePoint: (point) => {
    set((state) => ({
      rescuePoints: state.rescuePoints.map((p) =>
        p.id === point.id ? point : p
      ),
      selectedPoint: state.selectedPoint?.id === point.id ? point : state.selectedPoint,
    }));
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useRescueStore;
