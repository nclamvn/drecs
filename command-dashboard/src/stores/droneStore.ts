// ═══════════════════════════════════════════════════════════════
//                    DRECS - Drone Store (Zustand)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Drone, DroneStats } from '@/types';
import * as api from '@/services/api';

interface DroneState {
  drones: Drone[];
  stats: DroneStats | null;
  selectedDrone: Drone | null;
  isLoading: boolean;
  error: string | null;
  
  fetchDrones: () => Promise<void>;
  fetchStats: () => Promise<void>;
  selectDrone: (drone: Drone | null) => void;
  updateDrone: (drone: Drone) => void;
  clearError: () => void;
}

export const useDroneStore = create<DroneState>((set) => ({
  drones: [],
  stats: null,
  selectedDrone: null,
  isLoading: false,
  error: null,
  
  fetchDrones: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getDrones();
      set({ drones: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch drones',
        isLoading: false,
      });
    }
  },
  
  fetchStats: async () => {
    try {
      const response = await api.getDroneStats();
      set({ stats: response.data });
    } catch (error) {
      console.error('Failed to fetch drone stats:', error);
    }
  },
  
  selectDrone: (drone) => {
    set({ selectedDrone: drone });
  },
  
  updateDrone: (drone) => {
    set((state) => ({
      drones: state.drones.map((d) => (d.id === drone.id ? drone : d)),
      selectedDrone: state.selectedDrone?.id === drone.id ? drone : state.selectedDrone,
    }));
  },
  
  clearError: () => {
    set({ error: null });
  },
}));

export default useDroneStore;
