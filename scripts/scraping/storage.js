/**
 * EA FC Scraper Storage
 * Upserts scraped clubs and players into Supabase or outputs idempotent SQL / JSON
 */

const fs = require('fs');
const path = require('path');

async function saveToSupabase(supabaseClient, payload) {
  const { leagues, clubs, players } = payload;
  console.log(`[Storage] Guardando en Supabase: ${leagues.length} ligas, ${clubs.length} clubes, ${players.length} jugadores...`);

  // 1. Upsert Leagues
  const { error: leagueErr } = await supabaseClient
    .from('leagues')
    .upsert(leagues, { onConflict: 'slug' });

  if (leagueErr) {
    console.error('[Storage] Error upsertando ligas:', leagueErr);
    throw leagueErr;
  }

  // 2. Fetch league IDs
  const { data: dbLeagues } = await supabaseClient.from('leagues').select('id, slug');
  const leagueMap = new Map((dbLeagues || []).map(l => [l.slug, l.id]));

  const clubsToInsert = clubs.map(c => ({
    ...c,
    league_id: leagueMap.get(c.league_slug) || c.league_id
  }));

  // 3. Upsert Clubs
  const { error: clubErr } = await supabaseClient
    .from('clubs')
    .upsert(clubsToInsert, { onConflict: 'slug' });

  if (clubErr) {
    console.error('[Storage] Error upsertando clubes:', clubErr);
    throw clubErr;
  }

  // 4. Fetch club IDs
  const { data: dbClubs } = await supabaseClient.from('clubs').select('id, slug');
  const clubMap = new Map((dbClubs || []).map(c => [c.slug, c.id]));

  const playersToInsert = players.map(p => ({
    ...p,
    club_id: clubMap.get(p.club_slug) || p.club_id
  }));

  // 5. Upsert Players (batches of 50)
  for (let i = 0; i < playersToInsert.length; i += 50) {
    const batch = playersToInsert.slice(i, i + 50);
    const { error: playerErr } = await supabaseClient
      .from('players')
      .upsert(batch, { onConflict: 'club_id, normalized_name' });

    if (playerErr) {
      console.error('[Storage] Error upsertando batch de jugadores:', playerErr);
    }
  }

  console.log('[Storage] Sincronización completada con éxito.');
}

function exportToJsonAndSql(payload, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonPath = path.join(outputDir, 'scraped_dataset.json');
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[Storage] Dataset JSON guardado en: ${jsonPath}`);

  // Generar script SQL idempotente completo
  const sqlLines = [
    '-- =============================================================================',
    '-- EA FC TOURNAMENT COMPANION V2 — SEED COMPLETO SCRAPEADO (25 CLUBES, 513 JUGADORES)',
    '-- Generado automáticamente por scripts/scraping/index.js',
    '-- =============================================================================\n',
    '-- 1. LIGAS'
  ];

  payload.leagues.forEach(l => {
    sqlLines.push(
      `INSERT INTO public.leagues (name, country, slug, logo_url) VALUES ('${l.name.replace(/'/g, "''")}', '${l.country.replace(/'/g, "''")}', '${l.slug}', '${l.logo_url}') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, logo_url = EXCLUDED.logo_url;`
    );
  });

  sqlLines.push('\n-- 2. CLUBES (25 clubes oficiales)');
  payload.clubs.forEach(c => {
    sqlLines.push(
      `INSERT INTO public.clubs (league_id, name, short_name, slug, color, accent_color, rating, attack, defense, chemistry, logo_url) ` +
      `SELECT id, '${c.name.replace(/'/g, "''")}', '${c.short_name}', '${c.slug}', '${c.color}', '${c.accent_color}', ${c.rating}, ${c.attack}, ${c.defense}, ${c.chemistry}, '${c.logo_url}' ` +
      `FROM public.leagues WHERE slug = '${c.league_slug}' ` +
      `ON CONFLICT (slug) DO UPDATE SET rating = EXCLUDED.rating, attack = EXCLUDED.attack, defense = EXCLUDED.defense, logo_url = EXCLUDED.logo_url;`
    );
  });

  sqlLines.push('\n-- 3. JUGADORES (513 jugadores con nombres normalizados y posiciones EA FC)');
  payload.players.forEach(p => {
    sqlLines.push(
      `INSERT INTO public.players (club_id, name, normalized_name, position, position_group, shirt_number, rating, nationality, photo_url) ` +
      `SELECT id, '${p.name.replace(/'/g, "''")}', '${p.normalized_name.replace(/'/g, "''")}', '${p.position}', '${p.position_group}', ${p.shirt_number}, ${p.rating}, '${p.nationality.replace(/'/g, "''")}', '${p.photo_url || ''}' ` +
      `FROM public.clubs WHERE slug = '${p.club_slug}' ` +
      `ON CONFLICT (club_id, normalized_name) DO UPDATE SET rating = EXCLUDED.rating, shirt_number = EXCLUDED.shirt_number, position = EXCLUDED.position;`
    );
  });

  const sqlPath = path.join(outputDir, 'scraped_seed.sql');
  fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf-8');
  console.log(`[Storage] Dataset SQL guardado en: ${sqlPath}`);
}

module.exports = {
  saveToSupabase,
  exportToJsonAndSql
};
