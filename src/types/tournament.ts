export type Formation = '4-3-3 Ofensiva' | '4-2-3-1 Cerrada' | '4-4-2 Rombo' | '3-5-2 Directa';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  rating: number;
  role?: string;
  x: number; // Porcentaje en la cancha (0-100)
  y: number; // Porcentaje en la cancha (0-100)
  isStarter?: boolean;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  color: string;
  accentColor: string;
  rating: number;
  attack: number;
  defense: number;
  chemistry: number;
  league: string;
  badgeUrl?: string;
  logoUrl?: string;
  isAssigned?: boolean;
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub';
  minute: string;
  team: 'home' | 'away';
  playerName: string;
  description: string;
}

export interface Match {
  id: string;
  matchday: number;
  homeTeam: Club;
  awayTeam: Club;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'finished' | 'scheduled';
  minute?: string;
  timeUTC?: string;
  date?: string;
  isUserMatch?: boolean;
  events: MatchEvent[];
  proofScreenshotUrl?: string;
}

export interface StandingRow {
  position: number;
  clubName: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  isUserClub?: boolean;
}

export interface DisputeCase {
  id: string;
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  reportedHomeScore: number;
  reportedAwayScore: number;
  claimedHomeScore: number;
  claimedAwayScore: number;
  status: 'pending' | 'resolved';
  homeCaptainProofUrl: string;
  awayCaptainProofUrl: string;
  homeClaimReason: string;
  awayClaimReason: string;
  resolutionVerdict?: string;
}
