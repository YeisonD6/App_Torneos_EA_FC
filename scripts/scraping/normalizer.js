/**
 * EA FC Scraper Normalizer
 * Normalizes strings, accents, positions, and ratings
 */

function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function slugify(text) {
  return removeAccents(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function clampRating(val, min = 40, max = 99, defaultVal = 75) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
}

function normalizePosition(rawPos) {
  if (!rawPos) return { position: 'MC', group: 'MID' };
  const pos = rawPos.toUpperCase().trim();

  // Goalkeeper
  if (['POR', 'GK', 'ARQ', 'GOALKEEPER', 'PT'].includes(pos)) {
    return { position: 'POR', group: 'GK' };
  }

  // Defenders
  if (['DFC', 'CB', 'CENTRAL', 'DEF'].includes(pos)) {
    return { position: 'DFC', group: 'DEF' };
  }
  if (['LD', 'RB', 'LATERAL DERECHO'].includes(pos)) {
    return { position: 'LD', group: 'DEF' };
  }
  if (['LI', 'LB', 'LATERAL IZQUIERDO'].includes(pos)) {
    return { position: 'LI', group: 'DEF' };
  }
  if (['CAD', 'RWB'].includes(pos)) {
    return { position: 'CAD', group: 'DEF' };
  }
  if (['CAI', 'LWB'].includes(pos)) {
    return { position: 'CAI', group: 'DEF' };
  }

  // Midfielders
  if (['MCD', 'CDM', 'DM', 'PIVOTE'].includes(pos)) {
    return { position: 'MCD', group: 'MID' };
  }
  if (['MC', 'CM', 'MEDIO'].includes(pos)) {
    return { position: 'MC', group: 'MID' };
  }
  if (['MCO', 'CAM', 'ENGANCHE', 'MP'].includes(pos)) {
    return { position: 'MCO', group: 'MID' };
  }
  if (['MD', 'RM'].includes(pos)) {
    return { position: 'MD', group: 'MID' };
  }
  if (['MI', 'LM'].includes(pos)) {
    return { position: 'MI', group: 'MID' };
  }

  // Forwards
  if (['DC', 'ST', 'CF', 'DELANTERO', 'PUNTA'].includes(pos)) {
    return { position: 'DC', group: 'FWD' };
  }
  if (['ED', 'RW'].includes(pos)) {
    return { position: 'ED', group: 'FWD' };
  }
  if (['EI', 'LW'].includes(pos)) {
    return { position: 'EI', group: 'FWD' };
  }
  if (['SD', 'SS', 'SEGUNDO DELANTERO'].includes(pos)) {
    return { position: 'SD', group: 'FWD' };
  }

  return { position: pos.slice(0, 4), group: 'MID' };
}

module.exports = {
  removeAccents,
  slugify,
  clampRating,
  normalizePosition
};
