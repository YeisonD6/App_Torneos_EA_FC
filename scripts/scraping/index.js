/**
 * EA FC Scraper CLI Runner
 * Ejecuta la extracción, normalización y almacenamiento de las 5 grandes ligas europeas
 * Uso: node scripts/scraping/index.js [--supabase]
 */

const path = require('path');
const { LEAGUES } = require('./config');
const { parseClub, parsePlayer } = require('./parser');
const { exportToJsonAndSql, saveToSupabase } = require('./storage');

async function runScraper() {
  console.log('====================================================');
  console.log('⚽ EA FC TOURNAMENT COMPANION V2 — SCRAPER MODULAR');
  console.log('====================================================\n');

  const payload = {
    leagues: [],
    clubs: [],
    players: []
  };

  let totalClubs = 0;
  let totalPlayers = 0;

  for (const league of LEAGUES) {
    console.log(`[Liga] Procesando ${league.name} (${league.country})...`);
    payload.leagues.push({
      name: league.name,
      country: league.country,
      slug: league.slug,
      logo_url: league.logo_url
    });

    for (const rawClub of league.clubs) {
      const parsedClub = parseClub(rawClub, null);
      parsedClub.league_slug = league.slug;
      payload.clubs.push(parsedClub);
      totalClubs++;

      console.log(`  └─ Club: ${parsedClub.name} (${parsedClub.short_name}) - Med: ${parsedClub.rating} [ATK: ${parsedClub.attack} | DEF: ${parsedClub.defense}]`);

      if (rawClub.squad && rawClub.squad.length > 0) {
        for (const rawPlayer of rawClub.squad) {
          const parsedPlayer = parsePlayer(rawPlayer, null);
          parsedPlayer.club_slug = parsedClub.slug;
          payload.players.push(parsedPlayer);
          totalPlayers++;
        }
      }
    }
    console.log('');
  }

  console.log('----------------------------------------------------');
  console.log(`✓ Ligas procesadas: ${payload.leagues.length}`);
  console.log(`✓ Clubes totales: ${totalClubs} (5 por cada liga)`);
  console.log(`✓ Jugadores normalizados: ${totalPlayers}`);
  console.log('----------------------------------------------------\n');

  const outputDir = path.resolve(__dirname, '../../data');
  exportToJsonAndSql(payload, outputDir);

  const shouldSaveSupabase = process.argv.includes('--supabase');
  if (shouldSaveSupabase) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Scraper] Variables de Supabase no encontradas. Saltando guardado remoto directo.');
    } else {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await saveToSupabase(supabase, payload);
    }
  }

  console.log('[Scraper] Proceso finalizado exitosamente.\n');
}

if (require.main === module) {
  runScraper().catch((err) => {
    console.error('Error fatal en el scraper:', err);
    process.exit(1);
  });
}

module.exports = { runScraper };
