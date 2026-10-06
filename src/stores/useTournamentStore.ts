import { create } from 'zustand';
import { Club, Matchday, StandingsRow, Tournament, TournamentParticipant } from '../types/database.types';
import { tournamentsService } from '../services/tournaments.service';
import { standingsService } from '../services/standings.service';
import { matchesService } from '../services/matches.service';

interface TournamentState {
  tournament: Tournament | null;
  userParticipant: TournamentParticipant | null;
  assignedClub: Club | null;
  standings: StandingsRow[];
  matchdays: Matchday[];
  activeMatchdayNumber: number;
  isLoading: boolean;
  error: string | null;

  loadTournament: (userId?: string) => Promise<void>;
  assignClub: () => Promise<Club | null>;
  loadStandings: () => Promise<void>;
  loadMatchdays: () => Promise<void>;
  setActiveMatchday: (number: number) => void;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournament: null,
  userParticipant: null,
  assignedClub: null,
  standings: [],
  matchdays: [],
  activeMatchdayNumber: 2,
  isLoading: true,
  error: null,

  loadTournament: async (userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const tournament = await tournamentsService.getActiveTournament();
      let userParticipant: TournamentParticipant | null = null;
      let assignedClub: Club | null = null;

      if (userId) {
        userParticipant = await tournamentsService.getUserParticipant(tournament.id, userId);
        if (userParticipant?.club) {
          assignedClub = userParticipant.club;
        }
      }

      set({
        tournament,
        userParticipant,
        assignedClub,
        activeMatchdayNumber: tournament.current_matchday || 1,
        isLoading: false,
      });

      // Cargar clasificaciones y calendario
      get().loadStandings();
      get().loadMatchdays();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  assignClub: async () => {
    const { tournament } = get();
    if (!tournament) return null;
    const res = await tournamentsService.assignRandomClub(tournament.id);
    if (res.success && res.club) {
      set({ assignedClub: res.club });
      return res.club;
    }
    return null;
  },

  loadStandings: async () => {
    const { tournament } = get();
    if (!tournament) return;
    const standings = await standingsService.getStandings(tournament.id);
    set({ standings });
  },

  loadMatchdays: async () => {
    const { tournament } = get();
    if (!tournament) return;
    const matchdays = await matchesService.getMatchdays(tournament.id);
    set({ matchdays });
  },

  setActiveMatchday: (number: number) => {
    set({ activeMatchdayNumber: number });
  },
}));
