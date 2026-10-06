import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Match, Matchday, MatchResultProposal } from '../types/database.types';
import { fallbackClubs } from '../data/scrapedData';

function generateDemoMatchdays(tournamentId: string): Matchday[] {
  const matchdays: Matchday[] = [];
  const totalRounds = 5;

  for (let round = 1; round <= totalRounds; round++) {
    const mdId = `md-${round}`;
    const matches: Match[] = [];

    // Pair clubs for demo matches
    for (let i = 0; i < 4; i++) {
      const homeClub = fallbackClubs[(i * 2 + round) % fallbackClubs.length];
      const awayClub = fallbackClubs[(i * 2 + 1 + round) % fallbackClubs.length];
      const isPast = round < 2;
      const isCurrent = round === 2;

      matches.push({
        id: `match-${round}-${i + 1}`,
        tournament_id: tournamentId,
        matchday_id: mdId,
        home_participant_id: `part-${homeClub.id}`,
        away_participant_id: `part-${awayClub.id}`,
        home_club_id: homeClub.id,
        away_club_id: awayClub.id,
        status: isPast ? 'confirmed' : isCurrent && i === 0 ? 'active' : 'scheduled',
        reported_home_score: isPast ? 2 : 0,
        reported_away_score: isPast ? 1 : 0,
        final_home_score: isPast ? 2 : null,
        final_away_score: isPast ? 1 : null,
        started_at: isCurrent ? new Date().toISOString() : null,
        submitted_at: null,
        confirmed_at: isPast ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        home_club: homeClub,
        away_club: awayClub,
      });
    }

    matchdays.push({
      id: mdId,
      tournament_id: tournamentId,
      number: round,
      status: round === 1 ? 'completed' : round === 2 ? 'active' : 'locked',
      activated_at: round <= 2 ? new Date().toISOString() : null,
      closed_at: round === 1 ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      matches,
    });
  }

  return matchdays;
}

export const matchesService = {
  async getMatchdays(tournamentId: string): Promise<Matchday[]> {
    if (!isSupabaseConfigured()) {
      return generateDemoMatchdays(tournamentId);
    }

    const { data, error } = await supabase
      .from('matchdays')
      .select('*, matches(*, home_club:clubs!matches_home_club_id_fkey(*), away_club:clubs!matches_away_club_id_fkey(*))')
      .eq('tournament_id', tournamentId)
      .order('number');

    if (error || !data || data.length === 0) {
      return generateDemoMatchdays(tournamentId);
    }

    return data as Matchday[];
  },

  async getMatchesByMatchday(matchdayId: string): Promise<Match[]> {
    if (!isSupabaseConfigured()) {
      const demo = generateDemoMatchdays('demo');
      const found = demo.find((m) => m.id === matchdayId);
      return found?.matches || [];
    }

    const { data, error } = await supabase
      .from('matches')
      .select('*, home_club:clubs!matches_home_club_id_fkey(*), away_club:clubs!matches_away_club_id_fkey(*)')
      .eq('matchday_id', matchdayId)
      .order('created_at');

    if (error || !data) return [];
    return data as Match[];
  },

  async getMatchById(matchId: string): Promise<Match | null> {
    if (!isSupabaseConfigured()) {
      const demo = generateDemoMatchdays('demo');
      for (const md of demo) {
        const found = md.matches?.find((m) => m.id === matchId);
        if (found) return found;
      }
      return demo[1].matches![0];
    }

    const { data, error } = await supabase
      .from('matches')
      .select('*, home_club:clubs!matches_home_club_id_fkey(*), away_club:clubs!matches_away_club_id_fkey(*)')
      .eq('id', matchId)
      .maybeSingle();

    if (error || !data) {
      const demo = generateDemoMatchdays('demo');
      return demo[1].matches![0];
    }

    return data as Match;
  },

  async submitMatchResult(
    matchId: string,
    homeScore: number,
    awayScore: number,
    screenshotUrl?: string
  ) {
    if (!isSupabaseConfigured()) {
      return { success: true, status: 'pending_confirmation', proposal_id: 'mock-prop-1' };
    }

    const { data, error } = await supabase.rpc('submit_match_result', {
      p_match_id: matchId,
      p_home_score: homeScore,
      p_away_score: awayScore,
      p_screenshot_url: screenshotUrl || null,
    });

    if (error) throw error;
    return data;
  },

  async respondToMatchResult(proposalId: string, approved: boolean) {
    if (!isSupabaseConfigured()) {
      return { success: true, status: approved ? 'confirmed' : 'disputed' };
    }

    const { data, error } = await supabase.rpc('respond_to_match_result', {
      p_proposal_id: proposalId,
      p_approved: approved,
    });

    if (error) throw error;
    return data;
  },

  async getPendingProposalForMatch(matchId: string): Promise<MatchResultProposal | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('match_result_proposals')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error || !data) return null;
    return data as MatchResultProposal;
  },
};
