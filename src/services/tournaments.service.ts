import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Club, Tournament, TournamentParticipant } from '../types/database.types';
import { fallbackClubs } from '../data/scrapedData';

const DEMO_TOURNAMENT: Tournament = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Apex Champions League 2026',
  status: 'active',
  current_matchday: 1,
  started_at: new Date().toISOString(),
  finished_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const tournamentsService = {
  async getActiveTournament(): Promise<Tournament> {
    if (!isSupabaseConfigured()) {
      return DEMO_TOURNAMENT;
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEMO_TOURNAMENT;
    }

    return data as Tournament;
  },

  async getUserParticipant(tournamentId: string, userId: string): Promise<TournamentParticipant | null> {
    if (!isSupabaseConfigured()) {
      return {
        id: 'part-demo-1',
        tournament_id: tournamentId,
        user_id: userId,
        club_id: fallbackClubs[0].id,
        club_assigned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        club: fallbackClubs[0],
      };
    }

    const { data, error } = await supabase
      .from('tournament_participants')
      .select('*, club:clubs(*), profile:profiles(*)')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as TournamentParticipant;
  },

  async assignRandomClub(tournamentId: string): Promise<{ success: boolean; club: Club; message?: string }> {
    if (!isSupabaseConfigured()) {
      // Demo roulette selection: pick random club from fallback
      const randomIndex = Math.floor(Math.random() * fallbackClubs.length);
      const chosen = fallbackClubs[randomIndex];
      return { success: true, club: chosen, message: 'Club asignado en modo demo' };
    }

    const { data, error } = await supabase.rpc('assign_random_club', {
      p_tournament_id: tournamentId,
    });

    if (error) {
      console.warn('Error en RPC assign_random_club, recurriendo a fallback:', error);
      const chosen = fallbackClubs[Math.floor(Math.random() * fallbackClubs.length)];
      return { success: true, club: chosen, message: 'Asignado vía fallback' };
    }

    return {
      success: true,
      club: data.club as Club,
      message: data.status === 'already_assigned' ? 'Club previamente asignado' : 'Nuevo club asignado',
    };
  },

  async getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    if (!isSupabaseConfigured()) {
      return fallbackClubs.slice(0, 8).map((club, idx) => ({
        id: `part-${idx + 1}`,
        tournament_id: tournamentId,
        user_id: `user-${idx + 1}`,
        club_id: club.id,
        club_assigned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        club,
        profile: {
          id: `user-${idx + 1}`,
          display_name: `Capitán ${club.short_name}`,
          gamer_tag: `${club.short_name}_ProPlayer`,
          role: 'participant',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));
    }

    const { data, error } = await supabase
      .from('tournament_participants')
      .select('*, club:clubs(*), profile:profiles(*)')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data as unknown) as TournamentParticipant[];
  },
};
