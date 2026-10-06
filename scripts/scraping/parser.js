/**
 * EA FC Scraper Parser
 * Parses squads, players and club statistics
 */

const { removeAccents, slugify, clampRating, normalizePosition } = require('./normalizer');

function parseClub(rawClub, leagueId) {
  return {
    league_id: leagueId,
    name: rawClub.name.trim(),
    short_name: (rawClub.short_name || rawClub.name.substring(0, 3)).toUpperCase().trim(),
    slug: rawClub.slug || slugify(rawClub.name),
    color: rawClub.color || '#B8FF2C',
    accent_color: rawClub.accent_color || '#22D3EE',
    logo_url: rawClub.logo_url || null,
    rating: clampRating(rawClub.rating, 50, 99, 82),
    attack: clampRating(rawClub.attack, 50, 99, 82),
    defense: clampRating(rawClub.defense, 50, 99, 82),
    chemistry: clampRating(rawClub.chemistry, 0, 33, 33),
    active: true
  };
}

function parsePlayer(rawPlayer, clubId) {
  const posInfo = normalizePosition(rawPlayer.position);
  return {
    club_id: clubId,
    name: rawPlayer.name.trim(),
    normalized_name: removeAccents(rawPlayer.name),
    position: posInfo.position,
    position_group: posInfo.group,
    shirt_number: rawPlayer.number ? clampRating(rawPlayer.number, 1, 99, 10) : null,
    rating: clampRating(rawPlayer.rating, 40, 99, 80),
    nationality: rawPlayer.nationality ? rawPlayer.nationality.trim() : null,
    photo_url: rawPlayer.photo_url || null,
    active: true
  };
}

module.exports = {
  parseClub,
  parsePlayer
};
