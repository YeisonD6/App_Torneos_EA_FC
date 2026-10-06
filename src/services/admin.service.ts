import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export const adminService = {
  async generateRoundRobinSchedule(tournamentId: string) {
    if (!isSupabaseConfigured()) {
      return { success: true, total_rounds: 5, matches_created: 10 };
    }

    const { data, error } = await supabase.rpc('generate_round_robin_schedule', {
      p_tournament_id: tournamentId,
    });

    if (error) throw error;
    return data;
  },

  async activateMatchday(tournamentId: string, matchdayNumber: number) {
    if (!isSupabaseConfigured()) {
      return { success: true, active_matchday: matchdayNumber };
    }

    const { data, error } = await supabase.rpc('activate_matchday', {
      p_tournament_id: tournamentId,
      p_matchday_number: matchdayNumber,
    });

    if (error) throw error;
    return data;
  },

  async resolveMatchDispute(
    disputeId: string,
    finalHomeScore: number,
    finalAwayScore: number,
    verdict: string
  ) {
    if (!isSupabaseConfigured()) {
      return { success: true, dispute_id: disputeId, verdict };
    }

    const { data, error } = await supabase.rpc('resolve_match_dispute', {
      p_dispute_id: disputeId,
      p_final_home_score: finalHomeScore,
      p_final_away_score: finalAwayScore,
      p_verdict: verdict,
    });

    if (error) throw error;
    return data;
  },

  async getOpenDisputes() {
    if (!isSupabaseConfigured()) {
      return [
        {
          id: 'disp-demo-1',
          match_id: 'match-2-1',
          opened_by: '00000000-0000-0000-0000-000000000002',
          reason: 'El rival desconectó la consola en el minuto 88 tras el penal concedido.',
          status: 'open' as const,
          resolved_by: null,
          resolution_verdict: null,
          resolved_at: null,
          created_at: new Date().toISOString(),
          home_club_name: 'Real Madrid CF',
          away_club_name: 'FC Barcelona',
          reported_home_score: 2,
          reported_away_score: 1,
        },
      ];
    }

    const { data, error } = await supabase
      .from('match_disputes')
      .select('*, match:matches(*, home_club:clubs(*), away_club:clubs(*))')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
