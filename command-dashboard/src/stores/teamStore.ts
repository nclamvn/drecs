// ═══════════════════════════════════════════════════════════════
//                    DRECS - Team Store (Zustand)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Team } from '@/types';
import * as api from '@/services/api';

interface TeamState {
  teams: Team[];
  availableTeams: Team[];
  selectedTeam: Team | null;
  isLoading: boolean;
  error: string | null;
  
  fetchTeams: () => Promise<void>;
  fetchAvailableTeams: (lat: number, lng: number) => Promise<void>;
  selectTeam: (team: Team | null) => void;
  updateTeam: (team: Team) => void;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  availableTeams: [],
  selectedTeam: null,
  isLoading: false,
  error: null,
  
  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getTeams();
      set({ teams: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch teams',
        isLoading: false,
      });
    }
  },
  
  fetchAvailableTeams: async (lat, lng) => {
    try {
      const response = await api.getAvailableTeams(lat, lng);
      set({ availableTeams: response.data });
    } catch (error) {
      console.error('Failed to fetch available teams:', error);
    }
  },
  
  selectTeam: (team) => {
    set({ selectedTeam: team });
  },
  
  updateTeam: (team) => {
    set((state) => ({
      teams: state.teams.map((t) => (t.id === team.id ? team : t)),
      availableTeams: state.availableTeams.map((t) => (t.id === team.id ? team : t)),
    }));
  },
  
  clearError: () => {
    set({ error: null });
  },
}));

export default useTeamStore;
