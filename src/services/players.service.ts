import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Player } from '../types/database.types';
import { fallbackPlayers } from '../data/scrapedData';

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const playersService = {
  async getSquadByClub(clubId: string): Promise<Player[]> {
    if (!isSupabaseConfigured()) {
      return fallbackPlayers.filter((p) => p.club_id === clubId);
    }

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .eq('active', true)
      .order('rating', { ascending: false });

    if (error || !data || data.length === 0) {
      return fallbackPlayers.filter((p) => p.club_id === clubId);
    }

    return data as Player[];
  },

  async searchPlayersByClub(clubId: string, query: string): Promise<Player[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getSquadByClub(clubId);
    }

    const normalized = normalizeText(trimmed);

    if (!isSupabaseConfigured()) {
      return fallbackPlayers.filter(
        (p) => p.club_id === clubId && normalizeText(p.name).includes(normalized)
      );
    }

    // Búsqueda en Supabase usando normalized_name con ILIKE
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .ilike('normalized_name', `%${normalized}%`)
      .order('rating', { ascending: false })
      .limit(15);

    if (error || !data || data.length === 0) {
      return fallbackPlayers.filter(
        (p) => p.club_id === clubId && normalizeText(p.name).includes(normalized)
      );
    }

    return data as Player[];
  },
};
