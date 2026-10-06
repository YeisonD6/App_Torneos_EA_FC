import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { StandingsRow } from '../types/database.types';
import { fallbackClubs } from '../data/scrapedData';

function generateDemoStandings(tournamentId: string): StandingsRow[] {
  // Generate lively initial standings using top 8 clubs
  const topClubs = fallbackClubs.slice(0, 8);
  const presets = [
    { played: 3, won: 3, drawn: 0, lost: 0, gf: 9, ga: 2, pts: 9 },
    { played: 3, won: 2, drawn: 1, lost: 0, gf: 7, ga: 3, pts: 7 },
    { played: 3, won: 2, drawn: 0, lost: 1, gf: 6, ga: 4, pts: 6 },
    { played: 3, won: 1, drawn: 1, lost: 1, gf: 4, ga: 4, pts: 4 },
    { played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 5, pts: 3 },
    { played: 3, won: 1, drawn: 0, lost: 2, gf: 2, ga: 6, pts: 3 },
    { played: 3, won: 0, drawn: 1, lost: 2, gf: 2, ga: 5, pts: 1 },
    { played: 3, won: 0, drawn: 1, lost: 2, gf: 1, ga: 5, pts: 1 },
  ];

  return topClubs.map((club, idx) => {
    const stat = presets[idx] || { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
    return {
      tournament_id: tournamentId,
      participant_id: `part-${club.id}`,
      user_id: `user-${idx + 1}`,
      player_name: idx === 0 ? 'David Morales' : `Gamer_${club.short_name}`,
      gamer_tag: idx === 0 ? 'xFalcon_FC' : `FC_${club.short_name}`,
      avatar_url: null,
      club_id: club.id,
      club_name: club.name,
      club_short_name: club.short_name,
      club_slug: club.slug,
      club_logo: club.logo_url,
      club_color: club.color,
      club_accent_color: club.accent_color,
      played: stat.played,
      won: stat.won,
      drawn: stat.drawn,
      lost: stat.lost,
      goals_for: stat.gf,
      goals_against: stat.ga,
      goal_difference: stat.gf - stat.ga,
      points: stat.pts,
      rank: idx + 1,
    };
  });
}

export const standingsService = {
  async getStandings(tournamentId: string): Promise<StandingsRow[]> {
    if (!isSupabaseConfigured()) {
      return generateDemoStandings(tournamentId);
    }

    const { data, error } = await supabase
      .from('standings_view')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('rank');

    if (error || !data || data.length === 0) {
      return generateDemoStandings(tournamentId);
    }

    return data as StandingsRow[];
  },
};
