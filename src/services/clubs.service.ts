import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Club } from '../types/database.types';
import { fallbackClubs } from '../data/scrapedData';

export const clubsService = {
  async getClubs(): Promise<Club[]> {
    if (!isSupabaseConfigured()) {
      return fallbackClubs;
    }

    const { data, error } = await supabase
      .from('clubs')
      .select('*, league:leagues(*)')
      .eq('active', true)
      .order('name');

    if (error || !data || data.length === 0) {
      return fallbackClubs;
    }

    return data as Club[];
  },

  async getClubById(clubId: string): Promise<Club | null> {
    if (!isSupabaseConfigured()) {
      return fallbackClubs.find((c) => c.id === clubId || c.slug === clubId) || fallbackClubs[0];
    }

    const { data, error } = await supabase
      .from('clubs')
      .select('*, league:leagues(*)')
      .eq('id', clubId)
      .maybeSingle();

    if (error || !data) {
      return fallbackClubs.find((c) => c.id === clubId || c.slug === clubId) || null;
    }

    return data as Club;
  },

  async getClubsByLeague(leagueId: string): Promise<Club[]> {
    const all = await this.getClubs();
    return all.filter((c) => c.league_id === leagueId);
  },
};
