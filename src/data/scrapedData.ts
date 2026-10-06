import rawData from '../../data/scraped_dataset.json';
import { Club, League, Player } from '../types/database.types';

export const fallbackLeagues: League[] = rawData.leagues.map((l, index) => ({
  id: `league-${index + 1}`,
  name: l.name,
  country: l.country,
  slug: l.slug,
  logo_url: l.logo_url,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

const leagueMap = new Map(fallbackLeagues.map((l) => [l.slug, l]));

export const fallbackClubs: Club[] = rawData.clubs.map((c, index) => {
  const league = leagueMap.get(c.league_slug) || fallbackLeagues[0];
  return {
    id: `club-${index + 1}`,
    league_id: league.id,
    name: c.name,
    short_name: c.short_name,
    slug: c.slug,
    color: c.color,
    accent_color: c.accent_color,
    logo_url: c.logo_url,
    rating: c.rating,
    attack: c.attack,
    defense: c.defense,
    chemistry: c.chemistry,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    league,
  };
});

const clubMap = new Map(fallbackClubs.map((c) => [c.slug, c]));

export const fallbackPlayers: Player[] = rawData.players.map((p, index) => {
  const club = clubMap.get(p.club_slug) || fallbackClubs[0];
  return {
    id: `player-${index + 1}`,
    club_id: club.id,
    name: p.name,
    normalized_name: p.normalized_name,
    position: p.position,
    position_group: p.position_group as any,
    shirt_number: p.shirt_number,
    rating: p.rating,
    nationality: p.nationality,
    photo_url: p.photo_url,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

export function getFallbackSquad(clubIdOrSlugOrName: string): Player[] {
  const search = clubIdOrSlugOrName.toLowerCase();
  const club = fallbackClubs.find(
    (c) =>
      c.id.toLowerCase() === search ||
      c.slug.toLowerCase() === search ||
      c.short_name.toLowerCase() === search ||
      c.name.toLowerCase() === search
  );
  if (!club) {
    return fallbackPlayers.slice(0, 20);
  }
  return fallbackPlayers.filter((p) => p.club_id === club.id);
}

