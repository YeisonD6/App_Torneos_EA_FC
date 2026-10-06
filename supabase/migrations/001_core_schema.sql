-- =============================================================================
-- EA FC TOURNAMENT COMPANION V2 — CORE SCHEMA MIGRATION
-- Migration: 001_core_schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- -----------------------------------------------------------------------------
-- 1. PROFILES (1:1 con auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  gamer_tag TEXT,
  role TEXT NOT NULL CHECK (role IN ('participant', 'admin')) DEFAULT 'participant',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Función y trigger para auto-creación de perfil al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, gamer_tag, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'gamer_tag', split_part(NEW.email, '@', 1)),
    'participant',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. LEAGUES & CLUBS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leagues_slug ON public.leagues(slug);

CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#B8FF2C',
  accent_color TEXT NOT NULL DEFAULT '#22D3EE',
  logo_url TEXT,
  source_url TEXT,
  rating INTEGER NOT NULL DEFAULT 82 CHECK (rating >= 50 AND rating <= 99),
  attack INTEGER NOT NULL DEFAULT 82 CHECK (attack >= 50 AND attack <= 99),
  defense INTEGER NOT NULL DEFAULT 82 CHECK (defense >= 50 AND defense <= 99),
  chemistry INTEGER NOT NULL DEFAULT 33 CHECK (chemistry >= 0 AND chemistry <= 33),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clubs_league_id ON public.clubs(league_id);
CREATE INDEX IF NOT EXISTS idx_clubs_slug ON public.clubs(slug);
CREATE INDEX IF NOT EXISTS idx_clubs_name ON public.clubs(name);

-- -----------------------------------------------------------------------------
-- 3. PLAYERS (Planteles completos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  position TEXT NOT NULL,
  position_group TEXT NOT NULL CHECK (position_group IN ('GK', 'DEF', 'MID', 'FWD')),
  shirt_number INTEGER CHECK (shirt_number >= 1 AND shirt_number <= 99),
  rating INTEGER NOT NULL DEFAULT 80 CHECK (rating >= 40 AND rating <= 99),
  nationality TEXT,
  photo_url TEXT,
  source_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_players_club_id ON public.players(club_id);
CREATE INDEX IF NOT EXISTS idx_players_position_group ON public.players(position_group);
CREATE INDEX IF NOT EXISTS idx_players_normalized_trgm ON public.players USING gin (normalized_name gin_trgm_ops);

-- Trigger para normalizar nombres de jugador automáticamente
CREATE OR REPLACE FUNCTION public.normalize_player_name()
RETURNS trigger AS $$
BEGIN
  NEW.normalized_name := lower(public.unaccent(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_player_name ON public.players;
CREATE TRIGGER trg_normalize_player_name
  BEFORE INSERT OR UPDATE OF name ON public.players
  FOR EACH ROW EXECUTE PROCEDURE public.normalize_player_name();

-- -----------------------------------------------------------------------------
-- 4. TOURNAMENTS & PARTICIPANTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'registration', 'active', 'finished')) DEFAULT 'registration',
  current_matchday INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE RESTRICT,
  club_assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tournament_user UNIQUE (tournament_id, user_id),
  CONSTRAINT uq_tournament_club UNIQUE (tournament_id, club_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_tournament_id ON public.tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_user_id ON public.tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tp_club_id ON public.tournament_participants(club_id);

-- -----------------------------------------------------------------------------
-- 5. MATCHDAYS & MATCHES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matchdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number >= 1),
  status TEXT NOT NULL CHECK (status IN ('locked', 'active', 'completed')) DEFAULT 'locked',
  activated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tournament_matchday UNIQUE (tournament_id, number)
);

CREATE INDEX IF NOT EXISTS idx_matchdays_tourn_number ON public.matchdays(tournament_id, number);

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  matchday_id UUID NOT NULL REFERENCES public.matchdays(id) ON DELETE CASCADE,
  home_participant_id UUID NOT NULL REFERENCES public.tournament_participants(id),
  away_participant_id UUID NOT NULL REFERENCES public.tournament_participants(id),
  home_club_id UUID NOT NULL REFERENCES public.clubs(id),
  away_club_id UUID NOT NULL REFERENCES public.clubs(id),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'pending_confirmation', 'disputed', 'confirmed')) DEFAULT 'scheduled',
  reported_home_score INTEGER DEFAULT 0 CHECK (reported_home_score >= 0),
  reported_away_score INTEGER DEFAULT 0 CHECK (reported_away_score >= 0),
  final_home_score INTEGER CHECK (final_home_score >= 0),
  final_away_score INTEGER CHECK (final_away_score >= 0),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_matchday_id ON public.matches(matchday_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_participant ON public.matches(home_participant_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_participant ON public.matches(away_participant_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- -----------------------------------------------------------------------------
-- 6. MATCH EVENTS (Goles, Tarjetas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.clubs(id),
  player_id UUID NOT NULL REFERENCES public.players(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'yellow_card', 'red_card')),
  minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 130),
  client_event_id UUID UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON public.match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_team_id ON public.match_events(team_id);

-- -----------------------------------------------------------------------------
-- 7. RESULT PROPOSALS & DISPUTES (Handshake de validación)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_result_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  home_score INTEGER NOT NULL CHECK (home_score >= 0),
  away_score INTEGER NOT NULL CHECK (away_score >= 0),
  proof_screenshot_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mrp_match_id ON public.match_result_proposals(match_id);

CREATE TABLE IF NOT EXISTS public.match_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved')) DEFAULT 'open',
  resolved_by UUID REFERENCES auth.users(id),
  resolution_verdict TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_disputes_match_id ON public.match_disputes(match_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.match_disputes(status);

-- -----------------------------------------------------------------------------
-- 8. TACTICAL BOARDS & POSITIONS (Coordenadas normalizadas 0.0 - 1.0)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tactical_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.tournament_participants(id) ON DELETE CASCADE,
  formation TEXT NOT NULL DEFAULT '4-3-3 Ofensiva',
  pitch_width INTEGER NOT NULL DEFAULT 75 CHECK (pitch_width >= 0 AND pitch_width <= 100),
  pitch_depth INTEGER NOT NULL DEFAULT 80 CHECK (pitch_depth >= 0 AND pitch_depth <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_participant_tactical_board UNIQUE (participant_id)
);

CREATE TABLE IF NOT EXISTS public.tactical_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.tactical_boards(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  x NUMERIC(4,3) NOT NULL CHECK (x >= 0.000 AND x <= 1.000),
  y NUMERIC(4,3) NOT NULL CHECK (y >= 0.000 AND y <= 1.000),
  is_starter BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_board_player UNIQUE (board_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_tactical_positions_board ON public.tactical_positions(board_id);
CREATE INDEX IF NOT EXISTS idx_tactical_positions_player ON public.tactical_positions(player_id);
