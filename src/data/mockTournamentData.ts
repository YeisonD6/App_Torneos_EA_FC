import { Club, DisputeCase, Formation, Match, Player, StandingRow } from '../types/tournament';

export const CLUBS: Club[] = [
  { id: 'ars', name: 'Arsenal FC', shortName: 'ARS', color: '#EF0107', accentColor: '#B8FF2C', rating: 86, attack: 88, defense: 85, chemistry: 33, league: 'Premier League', isAssigned: true },
  { id: 'rma', name: 'Real Madrid', shortName: 'RMA', color: '#EEEEEF', accentColor: '#FEBE10', rating: 88, attack: 89, defense: 86, chemistry: 33, league: 'LaLiga' },
  { id: 'bar', name: 'FC Barcelona', shortName: 'BAR', color: '#A50044', accentColor: '#004D98', rating: 85, attack: 87, defense: 84, chemistry: 32, league: 'LaLiga' },
  { id: 'mci', name: 'Manchester City', shortName: 'MCI', color: '#6CABDD', accentColor: '#1C2C5B', rating: 88, attack: 89, defense: 87, chemistry: 33, league: 'Premier League' },
  { id: 'bay', name: 'FC Bayern München', shortName: 'BAY', color: '#DC052D', accentColor: '#0066B2', rating: 86, attack: 87, defense: 85, chemistry: 31, league: 'Bundesliga' },
  { id: 'liv', name: 'Liverpool FC', shortName: 'LIV', color: '#C8102E', accentColor: '#00B2A9', rating: 86, attack: 88, defense: 84, chemistry: 33, league: 'Premier League' },
  { id: 'int', name: 'Inter de Milán', shortName: 'INT', color: '#010E80', accentColor: '#22D3EE', rating: 84, attack: 85, defense: 84, chemistry: 30, league: 'Serie A' },
  { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', color: '#004170', accentColor: '#DA291C', rating: 85, attack: 86, defense: 83, chemistry: 31, league: 'Ligue 1' },
  { id: 'atm', name: 'Atlético de Madrid', shortName: 'ATM', color: '#CB3524', accentColor: '#272E61', rating: 84, attack: 84, defense: 85, chemistry: 31, league: 'LaLiga' },
  { id: 'dor', name: 'Borussia Dortmund', shortName: 'DOR', color: '#FDE100', accentColor: '#000000', rating: 83, attack: 84, defense: 81, chemistry: 29, league: 'Bundesliga' },
  { id: 'juv', name: 'Juventus FC', shortName: 'JUV', color: '#000000', accentColor: '#FFFFFF', rating: 83, attack: 82, defense: 84, chemistry: 29, league: 'Serie A' },
  { id: 'che', name: 'Chelsea FC', shortName: 'CHE', color: '#034694', accentColor: '#EE242C', rating: 83, attack: 83, defense: 82, chemistry: 30, league: 'Premier League' },
];

export const ARSENAL_SQUAD: Player[] = [
  // 4-3-3 Ofensiva
  { id: 'p1', name: 'D. Raya', number: 22, position: 'POR', rating: 84, role: 'Portero Cierre', x: 50, y: 90 },
  { id: 'p2', name: 'B. White', number: 4, position: 'LD', rating: 82, role: 'Lateral Invertido', x: 84, y: 72 },
  { id: 'p3', name: 'W. Saliba', number: 2, position: 'DFC', rating: 86, role: 'Central Tapón', x: 62, y: 75 },
  { id: 'p4', name: 'Gabriel', number: 6, position: 'DFC', rating: 85, role: 'Defensa con Salida', x: 38, y: 75 },
  { id: 'p5', name: 'J. Timber', number: 12, position: 'LI', rating: 82, role: 'Carrilero Mixto', x: 16, y: 72 },
  { id: 'p6', name: 'D. Rice', number: 41, position: 'MCD', rating: 87, role: 'Pivote Organizador', x: 50, y: 55 },
  { id: 'p7', name: 'M. Ødegaard', number: 8, position: 'MCO', rating: 88, role: 'Enganche Creativo (C)', x: 68, y: 40 },
  { id: 'p8', name: 'K. Havertz', number: 29, position: 'MC', rating: 83, role: 'Llegador Box-to-Box', x: 32, y: 42 },
  { id: 'p9', name: 'B. Saka', number: 7, position: 'ED', rating: 87, role: 'Extremo Hacia Adentro', x: 82, y: 22 },
  { id: 'p10', name: 'G. Jesus', number: 9, position: 'DC', rating: 84, role: 'Falso 9 Táctico', x: 50, y: 15 },
  { id: 'p11', name: 'G. Martinelli', number: 11, position: 'EI', rating: 84, role: 'Extremo Profundo', x: 18, y: 22 },
];

export const ARSENAL_BENCH: Player[] = [
  { id: 'b1', name: 'L. Trossard', number: 19, position: 'EI', rating: 83, x: 0, y: 0 },
  { id: 'b2', name: 'Jorginho', number: 20, position: 'MC', rating: 82, x: 0, y: 0 },
  { id: 'b3', name: 'R. Sterling', number: 30, position: 'ED', rating: 81, x: 0, y: 0 },
  { id: 'b4', name: 'M. Merino', number: 23, position: 'MC', rating: 82, x: 0, y: 0 },
  { id: 'b5', name: 'R. Calafiori', number: 33, position: 'DFC', rating: 80, x: 0, y: 0 },
  { id: 'b6', name: 'T. Tomiyasu', number: 18, position: 'LD', rating: 80, x: 0, y: 0 },
  { id: 'b7', name: 'Neto', number: 32, position: 'POR', rating: 79, x: 0, y: 0 },
];

export const FORMATIONS_COORDS: Record<Formation, { x: number; y: number }[]> = {
  '4-3-3 Ofensiva': [
    { x: 50, y: 90 }, // POR
    { x: 84, y: 72 }, // LD
    { x: 62, y: 75 }, // DFC
    { x: 38, y: 75 }, // DFC
    { x: 16, y: 72 }, // LI
    { x: 50, y: 55 }, // MCD
    { x: 68, y: 40 }, // MCO
    { x: 32, y: 42 }, // MC
    { x: 82, y: 22 }, // ED
    { x: 50, y: 15 }, // DC
    { x: 18, y: 22 }, // EI
  ],
  '4-2-3-1 Cerrada': [
    { x: 50, y: 90 },
    { x: 82, y: 74 },
    { x: 62, y: 76 },
    { x: 38, y: 76 },
    { x: 18, y: 74 },
    { x: 62, y: 58 },
    { x: 38, y: 58 },
    { x: 78, y: 36 },
    { x: 50, y: 34 },
    { x: 22, y: 36 },
    { x: 50, y: 16 },
  ],
  '4-4-2 Rombo': [
    { x: 50, y: 90 },
    { x: 82, y: 73 },
    { x: 62, y: 76 },
    { x: 38, y: 76 },
    { x: 18, y: 73 },
    { x: 50, y: 60 },
    { x: 74, y: 46 },
    { x: 26, y: 46 },
    { x: 50, y: 32 },
    { x: 64, y: 16 },
    { x: 36, y: 16 },
  ],
  '3-5-2 Directa': [
    { x: 50, y: 90 },
    { x: 74, y: 76 },
    { x: 50, y: 78 },
    { x: 26, y: 76 },
    { x: 88, y: 48 },
    { x: 62, y: 54 },
    { x: 38, y: 54 },
    { x: 12, y: 48 },
    { x: 50, y: 36 },
    { x: 62, y: 16 },
    { x: 38, y: 16 },
  ],
};

export const INITIAL_STANDINGS: StandingRow[] = [
  { position: 1, clubName: 'FC Barcelona', shortName: 'BAR', played: 7, won: 5, drawn: 2, lost: 0, goalsFor: 18, goalsAgainst: 7, goalDiff: 11, points: 17, form: ['W', 'W', 'W', 'D', 'W'] },
  { position: 2, clubName: 'Arsenal FC', shortName: 'ARS', played: 7, won: 5, drawn: 1, lost: 1, goalsFor: 16, goalsAgainst: 8, goalDiff: 8, points: 16, form: ['W', 'W', 'D', 'W', 'W'], isUserClub: true },
  { position: 3, clubName: 'Liverpool FC', shortName: 'LIV', played: 7, won: 4, drawn: 2, lost: 1, goalsFor: 14, goalsAgainst: 9, goalDiff: 5, points: 14, form: ['W', 'D', 'W', 'L', 'W'] },
  { position: 4, clubName: 'Manchester City', shortName: 'MCI', played: 7, won: 4, drawn: 1, lost: 2, goalsFor: 15, goalsAgainst: 10, goalDiff: 5, points: 13, form: ['L', 'W', 'W', 'W', 'D'] },
  { position: 5, clubName: 'Real Madrid', shortName: 'RMA', played: 7, won: 3, drawn: 3, lost: 1, goalsFor: 12, goalsAgainst: 8, goalDiff: 4, points: 12, form: ['W', 'D', 'D', 'W', 'L'] },
  { position: 6, clubName: 'FC Bayern München', shortName: 'BAY', played: 7, won: 3, drawn: 2, lost: 2, goalsFor: 13, goalsAgainst: 11, goalDiff: 2, points: 11, form: ['L', 'W', 'D', 'W', 'D'] },
  { position: 7, clubName: 'Inter de Milán', shortName: 'INT', played: 7, won: 2, drawn: 3, lost: 2, goalsFor: 9, goalsAgainst: 9, goalDiff: 0, points: 9, form: ['D', 'D', 'W', 'L', 'D'] },
  { position: 8, clubName: 'Paris Saint-Germain', shortName: 'PSG', played: 7, won: 2, drawn: 2, lost: 3, goalsFor: 10, goalsAgainst: 12, goalDiff: -2, points: 8, form: ['W', 'L', 'L', 'D', 'W'] },
  { position: 9, clubName: 'Atlético de Madrid', shortName: 'ATM', played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 8, goalsAgainst: 12, goalDiff: -4, points: 7, form: ['L', 'L', 'W', 'D', 'L'] },
  { position: 10, clubName: 'Borussia Dortmund', shortName: 'DOR', played: 7, won: 1, drawn: 2, lost: 4, goalsFor: 7, goalsAgainst: 14, goalDiff: -7, points: 5, form: ['L', 'D', 'L', 'L', 'W'] },
  { position: 11, clubName: 'Juventus FC', shortName: 'JUV', played: 7, won: 1, drawn: 1, lost: 5, goalsFor: 6, goalsAgainst: 15, goalDiff: -9, points: 4, form: ['D', 'L', 'L', 'W', 'L'] },
  { position: 12, clubName: 'Chelsea FC', shortName: 'CHE', played: 7, won: 0, drawn: 2, lost: 5, goalsFor: 5, goalsAgainst: 18, goalDiff: -13, points: 2, form: ['L', 'L', 'D', 'L', 'L'] },
];

export const INITIAL_MATCHES: Match[] = [
  // JORNADA 1 (Finalizada)
  { id: 'm1_1', matchday: 1, homeTeam: CLUBS[0], awayTeam: CLUBS[11], homeScore: 3, awayScore: 0, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', isUserMatch: true, events: [] },
  { id: 'm1_2', matchday: 1, homeTeam: CLUBS[1], awayTeam: CLUBS[10], homeScore: 2, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm1_3', matchday: 1, homeTeam: CLUBS[2], awayTeam: CLUBS[9], homeScore: 3, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm1_4', matchday: 1, homeTeam: CLUBS[3], awayTeam: CLUBS[8], homeScore: 2, awayScore: 0, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm1_5', matchday: 1, homeTeam: CLUBS[4], awayTeam: CLUBS[7], homeScore: 1, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm1_6', matchday: 1, homeTeam: CLUBS[5], awayTeam: CLUBS[6], homeScore: 2, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },

  // JORNADA 2 (Finalizada)
  { id: 'm2_1', matchday: 2, homeTeam: CLUBS[7], awayTeam: CLUBS[0], homeScore: 1, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', isUserMatch: true, events: [] },
  { id: 'm2_2', matchday: 2, homeTeam: CLUBS[8], awayTeam: CLUBS[1], homeScore: 1, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm2_3', matchday: 2, homeTeam: CLUBS[9], awayTeam: CLUBS[2], homeScore: 0, awayScore: 3, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm2_4', matchday: 2, homeTeam: CLUBS[10], awayTeam: CLUBS[3], homeScore: 1, awayScore: 4, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm2_5', matchday: 2, homeTeam: CLUBS[11], awayTeam: CLUBS[4], homeScore: 0, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm2_6', matchday: 2, homeTeam: CLUBS[6], awayTeam: CLUBS[5], homeScore: 1, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },

  // JORNADA 3 (Finalizada)
  { id: 'm3_1', matchday: 3, homeTeam: CLUBS[0], awayTeam: CLUBS[5], homeScore: 2, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', isUserMatch: true, events: [] },
  { id: 'm3_2', matchday: 3, homeTeam: CLUBS[1], awayTeam: CLUBS[4], homeScore: 3, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm3_3', matchday: 3, homeTeam: CLUBS[2], awayTeam: CLUBS[3], homeScore: 2, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm3_4', matchday: 3, homeTeam: CLUBS[6], awayTeam: CLUBS[11], homeScore: 2, awayScore: 0, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm3_5', matchday: 3, homeTeam: CLUBS[7], awayTeam: CLUBS[10], homeScore: 3, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm3_6', matchday: 3, homeTeam: CLUBS[8], awayTeam: CLUBS[9], homeScore: 1, awayScore: 0, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },

  // JORNADA 4 (Finalizada)
  { id: 'm4_1', matchday: 4, homeTeam: CLUBS[9], awayTeam: CLUBS[0], homeScore: 1, awayScore: 3, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', isUserMatch: true, events: [] },
  { id: 'm4_2', matchday: 4, homeTeam: CLUBS[10], awayTeam: CLUBS[1], homeScore: 0, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm4_3', matchday: 4, homeTeam: CLUBS[11], awayTeam: CLUBS[2], homeScore: 1, awayScore: 4, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm4_4', matchday: 4, homeTeam: CLUBS[5], awayTeam: CLUBS[4], homeScore: 2, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm4_5', matchday: 4, homeTeam: CLUBS[6], awayTeam: CLUBS[3], homeScore: 0, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm4_6', matchday: 4, homeTeam: CLUBS[7], awayTeam: CLUBS[8], homeScore: 1, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },

  // JORNADA 5 (Finalizada)
  { id: 'm5_1', matchday: 5, homeTeam: CLUBS[0], awayTeam: CLUBS[3], homeScore: 4, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', isUserMatch: true, events: [] },
  { id: 'm5_2', matchday: 5, homeTeam: CLUBS[1], awayTeam: CLUBS[2], homeScore: 1, awayScore: 2, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm5_3', matchday: 5, homeTeam: CLUBS[4], awayTeam: CLUBS[6], homeScore: 2, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm5_4', matchday: 5, homeTeam: CLUBS[5], awayTeam: CLUBS[7], homeScore: 3, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm5_5', matchday: 5, homeTeam: CLUBS[8], awayTeam: CLUBS[10], homeScore: 2, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },
  { id: 'm5_6', matchday: 5, homeTeam: CLUBS[9], awayTeam: CLUBS[11], homeScore: 2, awayScore: 1, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO', events: [] },

  // JORNADA 6 (ACTIVA - EN CURSO)
  {
    id: 'm6_user',
    matchday: 6,
    homeTeam: CLUBS[0], // Arsenal
    awayTeam: CLUBS[2], // Barcelona
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    minute: "68'",
    timeUTC: 'EN DIRECTO',
    date: 'HOY',
    isUserMatch: true,
    events: [
      { id: 'e1', type: 'goal', minute: "34'", team: 'home', playerName: 'Bukayo Saka', description: 'Golazo de zurda tras pase filtrado de Ødegaard' },
      { id: 'e2', type: 'goal', minute: "48'", team: 'away', playerName: 'Robert Lewandowski', description: 'Remate de cabeza cruzado a centro de Raphinha' },
      { id: 'e3', type: 'goal', minute: "61'", team: 'home', playerName: 'Martin Ødegaard', description: 'Disparo potente al ángulo superior derecho' },
      { id: 'e4', type: 'yellow_card', minute: "65'", team: 'away', playerName: 'Gavi', description: 'Falta táctica en el mediocampo' }
    ]
  },
  {
    id: 'm6_2',
    matchday: 6,
    homeTeam: CLUBS[1], // Real Madrid
    awayTeam: CLUBS[3], // Man City
    homeScore: 1,
    awayScore: 1,
    status: 'finished',
    minute: 'FINAL',
    timeUTC: 'FINALIZADO',
    date: 'HOY',
    events: []
  },
  {
    id: 'm6_3',
    matchday: 6,
    homeTeam: CLUBS[4], // Bayern
    awayTeam: CLUBS[5], // Liverpool
    homeScore: 0,
    awayScore: 2,
    status: 'finished',
    minute: 'FINAL',
    timeUTC: 'FINALIZADO',
    date: 'HOY',
    events: []
  },
  {
    id: 'm6_4',
    matchday: 6,
    homeTeam: CLUBS[6], // Inter
    awayTeam: CLUBS[7], // PSG
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    timeUTC: '21:00 UTC',
    date: 'HOY',
    events: []
  },
  {
    id: 'm6_5',
    matchday: 6,
    homeTeam: CLUBS[8], // Atletico
    awayTeam: CLUBS[9], // Dortmund
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    timeUTC: '22:15 UTC',
    date: 'HOY',
    events: []
  },
  {
    id: 'm6_6',
    matchday: 6,
    homeTeam: CLUBS[10], // Juventus
    awayTeam: CLUBS[11], // Chelsea
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    timeUTC: '23:00 UTC',
    date: 'MAÑANA',
    events: []
  },

  // JORNADA 7 (Programada)
  { id: 'm7_1', matchday: 7, homeTeam: CLUBS[1], awayTeam: CLUBS[0], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '18:00 UTC', isUserMatch: true, events: [] },
  { id: 'm7_2', matchday: 7, homeTeam: CLUBS[3], awayTeam: CLUBS[4], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '19:15 UTC', events: [] },
  { id: 'm7_3', matchday: 7, homeTeam: CLUBS[5], awayTeam: CLUBS[2], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '20:30 UTC', events: [] },
  { id: 'm7_4', matchday: 7, homeTeam: CLUBS[7], awayTeam: CLUBS[6], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '21:45 UTC', events: [] },
  { id: 'm7_5', matchday: 7, homeTeam: CLUBS[9], awayTeam: CLUBS[8], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '22:30 UTC', events: [] },
  { id: 'm7_6', matchday: 7, homeTeam: CLUBS[11], awayTeam: CLUBS[10], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '23:15 UTC', events: [] },

  // JORNADA 8 (Programada)
  { id: 'm8_1', matchday: 8, homeTeam: CLUBS[0], awayTeam: CLUBS[4], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '18:00 UTC', isUserMatch: true, events: [] },
  { id: 'm8_2', matchday: 8, homeTeam: CLUBS[2], awayTeam: CLUBS[1], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '19:15 UTC', events: [] },
  { id: 'm8_3', matchday: 8, homeTeam: CLUBS[6], awayTeam: CLUBS[3], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '20:30 UTC', events: [] },
  { id: 'm8_4', matchday: 8, homeTeam: CLUBS[8], awayTeam: CLUBS[5], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '21:45 UTC', events: [] },
  { id: 'm8_5', matchday: 8, homeTeam: CLUBS[10], awayTeam: CLUBS[7], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '22:30 UTC', events: [] },
  { id: 'm8_6', matchday: 8, homeTeam: CLUBS[11], awayTeam: CLUBS[9], homeScore: 0, awayScore: 0, status: 'scheduled', timeUTC: '23:15 UTC', events: [] },
];

export const INITIAL_DISPUTE: DisputeCase = {
  id: 'disp_001',
  matchId: 'm5_disp',
  homeTeamName: 'Arsenal FC',
  awayTeamName: 'FC Barcelona',
  reportedHomeScore: 2,
  reportedAwayScore: 1,
  claimedHomeScore: 2,
  claimedAwayScore: 1,
  status: 'pending',
  homeCaptainProofUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
  awayCaptainProofUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
  homeClaimReason: 'El rival desconectó la consola en el minuto 89 cuando iba perdiendo 2-1 y alega lag artificial.',
  awayClaimReason: 'Hubo una caída del servidor EA y el partido se congeló en el 89, solicitamos repetir el encuentro o computar 1-1.',
};
