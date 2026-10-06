export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type UserRole = 'participant' | 'admin';
export type TournamentStatus = 'draft' | 'registration' | 'active' | 'finished';
export type MatchdayStatus = 'locked' | 'active' | 'completed';
export type MatchStatus = 'scheduled' | 'active' | 'pending_confirmation' | 'disputed' | 'confirmed';
export type EventType = 'goal' | 'yellow_card' | 'red_card';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';
export type DisputeStatus = 'open' | 'resolved';
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

export type Profile = {
  id: string;
  display_name: string;
  gamer_tag: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type League = {
  id: string;
  name: string;
  country: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Club = {
  id: string;
  league_id: string;
  name: string;
  short_name: string;
  slug: string;
  color: string;
  accent_color: string;
  logo_url: string | null;
  source_url?: string | null;
  rating: number;
  attack: number;
  defense: number;
  chemistry: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  league?: League;
};

export type Player = {
  id: string;
  club_id: string;
  name: string;
  normalized_name: string;
  position: string;
  position_group: PositionGroup;
  shirt_number: number | null;
  rating: number;
  nationality: string | null;
  photo_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Tournament = {
  id: string;
  name: string;
  status: TournamentStatus;
  current_matchday: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TournamentParticipant = {
  id: string;
  tournament_id: string;
  user_id: string;
  club_id: string | null;
  club_assigned_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  club?: Club;
};

export type Matchday = {
  id: string;
  tournament_id: string;
  number: number;
  status: MatchdayStatus;
  activated_at: string | null;
  closed_at: string | null;
  created_at: string;
  matches?: Match[];
};

export type Match = {
  id: string;
  tournament_id: string;
  matchday_id: string;
  home_participant_id: string;
  away_participant_id: string;
  home_club_id: string;
  away_club_id: string;
  status: MatchStatus;
  reported_home_score: number;
  reported_away_score: number;
  final_home_score: number | null;
  final_away_score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  home_club?: Club;
  away_club?: Club;
  home_participant?: TournamentParticipant;
  away_participant?: TournamentParticipant;
  events?: MatchEvent[];
};

export type MatchEvent = {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  event_type: EventType;
  minute: number;
  client_event_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  player?: Player;
  team?: Club;
};

export type MatchResultProposal = {
  id: string;
  match_id: string;
  submitted_by: string;
  home_score: number;
  away_score: number;
  proof_screenshot_url: string | null;
  status: ProposalStatus;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
};

export type MatchDispute = {
  id: string;
  match_id: string;
  opened_by: string;
  reason: string;
  status: DisputeStatus;
  resolved_by: string | null;
  resolution_verdict: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type TacticalBoard = {
  id: string;
  participant_id: string;
  formation: string;
  pitch_width: number;
  pitch_depth: number;
  created_at: string;
  updated_at: string;
  positions?: TacticalPosition[];
};

export type TacticalPosition = {
  id: string;
  board_id: string;
  player_id: string;
  x: number; // 0.000 to 1.000
  y: number; // 0.000 to 1.000
  is_starter: boolean;
  player?: Player;
};

export type StandingsRow = {
  tournament_id: string;
  participant_id: string;
  user_id: string;
  player_name: string;
  gamer_tag: string | null;
  avatar_url: string | null;
  club_id: string;
  club_name: string;
  club_short_name: string;
  club_slug: string;
  club_logo: string | null;
  club_color: string;
  club_accent_color: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  rank: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; display_name: string };
        Update: Partial<Profile>;
        Relationships: GenericRelationship[];
      };
      leagues: {
        Row: League;
        Insert: Partial<League> & { name: string; country: string; slug: string };
        Update: Partial<League>;
        Relationships: GenericRelationship[];
      };
      clubs: {
        Row: Club;
        Insert: Partial<Club> & { league_id: string; name: string; short_name: string; slug: string };
        Update: Partial<Club>;
        Relationships: GenericRelationship[];
      };
      players: {
        Row: Player;
        Insert: Partial<Player> & { club_id: string; name: string; normalized_name: string; position: string; position_group: PositionGroup };
        Update: Partial<Player>;
        Relationships: GenericRelationship[];
      };
      tournaments: {
        Row: Tournament;
        Insert: Partial<Tournament> & { name: string };
        Update: Partial<Tournament>;
        Relationships: GenericRelationship[];
      };
      tournament_participants: {
        Row: TournamentParticipant;
        Insert: Partial<TournamentParticipant> & { tournament_id: string; user_id: string };
        Update: Partial<TournamentParticipant>;
        Relationships: GenericRelationship[];
      };
      matchdays: {
        Row: Matchday;
        Insert: Partial<Matchday> & { tournament_id: string; number: number };
        Update: Partial<Matchday>;
        Relationships: GenericRelationship[];
      };
      matches: {
        Row: Match;
        Insert: Partial<Match> & { tournament_id: string; matchday_id: string; home_participant_id: string; away_participant_id: string; home_club_id: string; away_club_id: string };
        Update: Partial<Match>;
        Relationships: GenericRelationship[];
      };
      match_events: {
        Row: MatchEvent;
        Insert: Partial<MatchEvent> & { match_id: string; team_id: string; player_id: string; event_type: EventType; minute: number; created_by?: string };
        Update: Partial<MatchEvent>;
        Relationships: GenericRelationship[];
      };
      match_result_proposals: {
        Row: MatchResultProposal;
        Insert: Partial<MatchResultProposal> & { match_id: string; submitted_by: string; home_score: number; away_score: number };
        Update: Partial<MatchResultProposal>;
        Relationships: GenericRelationship[];
      };
      match_disputes: {
        Row: MatchDispute;
        Insert: Partial<MatchDispute> & { match_id: string; opened_by: string; reason: string };
        Update: Partial<MatchDispute>;
        Relationships: GenericRelationship[];
      };
      tactical_boards: {
        Row: TacticalBoard;
        Insert: Partial<TacticalBoard> & { participant_id: string };
        Update: Partial<TacticalBoard>;
        Relationships: GenericRelationship[];
      };
      tactical_positions: {
        Row: TacticalPosition;
        Insert: Partial<TacticalPosition> & { board_id: string; player_id: string; x: number; y: number; is_starter?: boolean };
        Update: Partial<TacticalPosition>;
        Relationships: GenericRelationship[];
      };
    };
    Views: {
      standings_view: {
        Row: StandingsRow;
        Relationships: GenericRelationship[];
      };
    };
    Functions: {
      assign_random_club: {
        Args: { p_tournament_id: string };
        Returns: { success: boolean; club?: Club; status?: string };
      };
      generate_round_robin_schedule: {
        Args: { p_tournament_id: string };
        Returns: { success: boolean; total_rounds: number; matches_created: number };
      };
      activate_matchday: {
        Args: { p_tournament_id: string; p_matchday_number: number };
        Returns: { success: boolean; active_matchday: number };
      };
      submit_match_result: {
        Args: {
          p_match_id: string;
          p_home_score: number;
          p_away_score: number;
          p_screenshot_url?: string | null;
        };
        Returns: { success: boolean; proposal_id?: string };
      };
      respond_to_match_result: {
        Args: { p_proposal_id: string; p_approved: boolean };
        Returns: { success: boolean; match_status?: string };
      };
      resolve_match_dispute: {
        Args: {
          p_dispute_id: string;
          p_final_home_score: number;
          p_final_away_score: number;
          p_verdict: string;
        };
        Returns: { success: boolean };
      };
    };
    Enums: {
      user_role: UserRole;
      position_group: PositionGroup;
      tournament_status: TournamentStatus;
      matchday_status: MatchdayStatus;
      match_status: MatchStatus;
      event_type: EventType;
      proposal_status: ProposalStatus;
      dispute_status: DisputeStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
