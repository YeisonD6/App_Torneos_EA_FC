-- =============================================================================
-- EA FC TOURNAMENT COMPANION V2 — FULL DATABASE SETUP
-- Copia y pega TODO este archivo en el SQL Editor de Supabase y presiona Run
-- =============================================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 001_core_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 002_rls_policies.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- EA FC TOURNAMENT COMPANION V2 — ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 002_rls_policies.sql
-- =============================================================================

-- Habilitar RLS en todas las tablas del esquema público
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_result_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tactical_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tactical_positions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper function: Es admin?
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- Helper function: Es participante de un partido?
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_match_participant(p_match_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.tournament_participants tp_home ON tp_home.id = m.home_participant_id
    JOIN public.tournament_participants tp_away ON tp_away.id = m.away_participant_id
    WHERE m.id = p_match_id
      AND (tp_home.user_id = auth.uid() OR tp_away.user_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- 1. PROFILES
-- -----------------------------------------------------------------------------
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own_or_admin"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. LEAGUES & CLUBS & PLAYERS (Lectura global, escritura admin)
-- -----------------------------------------------------------------------------
CREATE POLICY "leagues_select_all" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "leagues_admin_all" ON public.leagues FOR ALL USING (public.is_admin());

CREATE POLICY "clubs_select_all" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "clubs_admin_all" ON public.clubs FOR ALL USING (public.is_admin());

CREATE POLICY "players_select_all" ON public.players FOR SELECT USING (true);
CREATE POLICY "players_admin_all" ON public.players FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. TOURNAMENTS
-- -----------------------------------------------------------------------------
CREATE POLICY "tournaments_select_all" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_admin_all" ON public.tournaments FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. TOURNAMENT PARTICIPANTS
-- -----------------------------------------------------------------------------
CREATE POLICY "participants_select_all"
  ON public.tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "participants_insert_own"
  ON public.tournament_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "participants_update_own"
  ON public.tournament_participants FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. MATCHDAYS & MATCHES
-- -----------------------------------------------------------------------------
CREATE POLICY "matchdays_select_all" ON public.matchdays FOR SELECT USING (true);
CREATE POLICY "matchdays_admin_all" ON public.matchdays FOR ALL USING (public.is_admin());

CREATE POLICY "matches_select_all" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_participant_or_admin_update"
  ON public.matches FOR UPDATE
  USING (public.is_match_participant(id) OR public.is_admin())
  WITH CHECK (public.is_match_participant(id) OR public.is_admin());

CREATE POLICY "matches_admin_all" ON public.matches FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. MATCH EVENTS
-- -----------------------------------------------------------------------------
CREATE POLICY "match_events_select_all"
  ON public.match_events FOR SELECT
  USING (true);

CREATE POLICY "match_events_insert_participant"
  ON public.match_events FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND (
      public.is_match_participant(match_id) OR public.is_admin()
    )
  );

CREATE POLICY "match_events_admin_all"
  ON public.match_events FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. RESULT PROPOSALS & DISPUTES
-- -----------------------------------------------------------------------------
CREATE POLICY "mrp_select_all"
  ON public.match_result_proposals FOR SELECT
  USING (true);

CREATE POLICY "mrp_insert_participant"
  ON public.match_result_proposals FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by AND (
      public.is_match_participant(match_id) OR public.is_admin()
    )
  );

CREATE POLICY "mrp_update_participant"
  ON public.match_result_proposals FOR UPDATE
  USING (
    public.is_match_participant(match_id) OR public.is_admin()
  )
  WITH CHECK (
    public.is_match_participant(match_id) OR public.is_admin()
  );

CREATE POLICY "disputes_select_all"
  ON public.match_disputes FOR SELECT
  USING (true);

CREATE POLICY "disputes_insert_participant"
  ON public.match_disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opened_by AND (
      public.is_match_participant(match_id) OR public.is_admin()
    )
  );

CREATE POLICY "disputes_admin_all"
  ON public.match_disputes FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. TACTICAL BOARDS & POSITIONS
-- -----------------------------------------------------------------------------
CREATE POLICY "tactical_boards_select_all"
  ON public.tactical_boards FOR SELECT
  USING (true);

CREATE POLICY "tactical_boards_modify_own"
  ON public.tactical_boards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tournament_participants tp
      WHERE tp.id = participant_id AND tp.user_id = auth.uid()
    ) OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournament_participants tp
      WHERE tp.id = participant_id AND tp.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "tactical_positions_select_all"
  ON public.tactical_positions FOR SELECT
  USING (true);

CREATE POLICY "tactical_positions_modify_own"
  ON public.tactical_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tactical_boards tb
      JOIN public.tournament_participants tp ON tp.id = tb.participant_id
      WHERE tb.id = board_id AND tp.user_id = auth.uid()
    ) OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tactical_boards tb
      JOIN public.tournament_participants tp ON tp.id = tb.participant_id
      WHERE tb.id = board_id AND tp.user_id = auth.uid()
    ) OR public.is_admin()
  );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 003_functions_and_rpc.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- EA FC TOURNAMENT COMPANION V2 — STORED PROCEDURES & RPCs
-- Migration: 003_functions_and_rpc.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. assign_random_club: Asignación atómica de club mediante ruleta
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_random_club(p_tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_participant_id UUID;
  v_already_assigned UUID;
  v_selected_club RECORD;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '28000';
  END IF;

  -- 1. Verificar si el usuario está inscrito en el torneo
  SELECT id, club_id INTO v_participant_id, v_already_assigned
  FROM public.tournament_participants
  WHERE tournament_id = p_tournament_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Inscribir automáticamente al participante si el torneo lo permite
    INSERT INTO public.tournament_participants (tournament_id, user_id)
    VALUES (p_tournament_id, v_user_id)
    RETURNING id, club_id INTO v_participant_id, v_already_assigned;
  END IF;

  IF v_already_assigned IS NOT NULL THEN
    -- Ya tiene club asignado; devolverlo sin cambiarlo
    SELECT c.id, c.name, c.short_name, c.slug, c.color, c.accent_color,
           c.rating, c.attack, c.defense, c.chemistry, c.logo_url
    INTO v_selected_club
    FROM public.clubs c WHERE c.id = v_already_assigned;

    RETURN jsonb_build_object(
      'status', 'already_assigned',
      'participant_id', v_participant_id,
      'club', to_jsonb(v_selected_club)
    );
  END IF;

  -- 2. Seleccionar un club activo no asignado aún en este torneo (atómico con lock)
  SELECT c.id, c.name, c.short_name, c.slug, c.color, c.accent_color,
         c.rating, c.attack, c.defense, c.chemistry, c.logo_url
  INTO v_selected_club
  FROM public.clubs c
  WHERE c.active = true
    AND c.id NOT IN (
      SELECT tp.club_id
      FROM public.tournament_participants tp
      WHERE tp.tournament_id = p_tournament_id
        AND tp.club_id IS NOT NULL
    )
  ORDER BY random()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_selected_club.id IS NULL THEN
    RAISE EXCEPTION 'No hay clubes disponibles sin asignar para este torneo' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Actualizar registro del participante
  UPDATE public.tournament_participants
  SET club_id = v_selected_club.id,
      club_assigned_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = v_participant_id;

  -- 4. Crear tablero táctico inicial si no existe
  INSERT INTO public.tactical_boards (participant_id, formation, pitch_width, pitch_depth)
  VALUES (v_participant_id, '4-3-3 Ofensiva', 75, 80)
  ON CONFLICT (participant_id) DO NOTHING;

  RETURN jsonb_build_object(
    'status', 'assigned',
    'participant_id', v_participant_id,
    'club', to_jsonb(v_selected_club)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 2. generate_round_robin_schedule: Calendario Todos contra Todos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_round_robin_schedule(p_tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_participants UUID[];
  v_count INT;
  v_num_rounds INT;
  v_matches_per_round INT;
  v_round INT;
  v_match_idx INT;
  v_home_idx INT;
  v_away_idx INT;
  v_home_part_id UUID;
  v_away_part_id UUID;
  v_home_club_id UUID;
  v_away_club_id UUID;
  v_matchday_id UUID;
  v_matches_created INT := 0;
  v_temp_participant_id UUID;
  v_round_participants UUID[];
BEGIN
  -- Verificar admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden generar el calendario' USING ERRCODE = '42501';
  END IF;

  -- Obtener participantes confirmados con club asignado
  SELECT array_agg(id ORDER BY created_at)
  INTO v_participants
  FROM public.tournament_participants
  WHERE tournament_id = p_tournament_id
    AND club_id IS NOT NULL;

  v_count := coalesce(array_length(v_participants, 1), 0);
  IF v_count < 2 THEN
    RAISE EXCEPTION 'Se requieren al menos 2 participantes con club asignado para generar el calendario (actual: %)', v_count USING ERRCODE = 'P0001';
  END IF;

  -- Si es impar, agregamos un placeholder NULL para rondas libres
  IF v_count % 2 != 0 THEN
    v_participants := array_append(v_participants, NULL::UUID);
    v_count := v_count + 1;
  END IF;

  v_num_rounds := v_count - 1;
  v_matches_per_round := v_count / 2;

  -- Limpiar matchdays anteriores si estaban en draft
  DELETE FROM public.matchdays WHERE tournament_id = p_tournament_id;

  v_round_participants := v_participants;

  -- Generación de fechas usando algoritmo de Berger (Round-Robin)
  FOR v_round IN 1..v_num_rounds LOOP
    -- Crear Jornada
    INSERT INTO public.matchdays (tournament_id, number, status, activated_at)
    VALUES (
      p_tournament_id,
      v_round,
      CASE WHEN v_round = 1 THEN 'active' ELSE 'locked' END,
      CASE WHEN v_round = 1 THEN timezone('utc'::text, now()) ELSE NULL END
    )
    RETURNING id INTO v_matchday_id;

    FOR v_match_idx IN 1..v_matches_per_round LOOP
      v_home_part_id := v_round_participants[v_match_idx];
      v_away_part_id := v_round_participants[v_count - v_match_idx + 1];

      -- Si alguno es NULL (bye por número impar), saltar
      IF v_home_part_id IS NOT NULL AND v_away_part_id IS NOT NULL THEN
        -- Alternar localía en rondas pares para mayor balance
        IF v_round % 2 = 0 AND v_match_idx = 1 THEN
          v_temp_participant_id := v_home_part_id;
          v_home_part_id := v_away_part_id;
          v_away_part_id := v_temp_participant_id;
        END IF;

        -- Obtener clubes de los participantes
        SELECT club_id INTO v_home_club_id FROM public.tournament_participants WHERE id = v_home_part_id;
        SELECT club_id INTO v_away_club_id FROM public.tournament_participants WHERE id = v_away_part_id;

        INSERT INTO public.matches (
          tournament_id,
          matchday_id,
          home_participant_id,
          away_participant_id,
          home_club_id,
          away_club_id,
          status
        ) VALUES (
          p_tournament_id,
          v_matchday_id,
          v_home_part_id,
          v_away_part_id,
          v_home_club_id,
          v_away_club_id,
          'scheduled'
        );

        v_matches_created := v_matches_created + 1;
      END IF;
    END LOOP;

    -- Rotar participantes excepto el primero (algoritmo estándar Berger)
    v_round_participants := array[v_round_participants[1]] ||
                            array[v_round_participants[v_count]] ||
                            v_round_participants[2:v_count - 1];
  END LOOP;

  -- Actualizar estado del torneo
  UPDATE public.tournaments
  SET status = 'active',
      current_matchday = 1,
      started_at = COALESCE(started_at, timezone('utc'::text, now())),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_rounds', v_num_rounds,
    'matches_created', v_matches_created
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 3. activate_matchday: Habilitar jornada en disputa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_matchday(
  p_tournament_id UUID,
  p_matchday_number INT
)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden activar jornadas' USING ERRCODE = '42501';
  END IF;

  -- Completar jornadas anteriores
  UPDATE public.matchdays
  SET status = 'completed',
      closed_at = timezone('utc'::text, now())
  WHERE tournament_id = p_tournament_id
    AND number < p_matchday_number
    AND status = 'active';

  -- Activar la jornada seleccionada
  UPDATE public.matchdays
  SET status = 'active',
      activated_at = timezone('utc'::text, now())
  WHERE tournament_id = p_tournament_id
    AND number = p_matchday_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jornada % no encontrada para el torneo', p_matchday_number USING ERRCODE = 'P0001';
  END IF;

  -- Actualizar puntero en torneo
  UPDATE public.tournaments
  SET current_matchday = p_matchday_number,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_tournament_id;

  RETURN jsonb_build_object('success', true, 'active_matchday', p_matchday_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4. submit_match_result: Reporte de resultado por un participante
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_match_result(
  p_match_id UUID,
  p_home_score INT,
  p_away_score INT,
  p_screenshot_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match RECORD;
  v_proposal_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '28000';
  END IF;

  SELECT m.*, tp_home.user_id AS home_user_id, tp_away.user_id AS away_user_id
  INTO v_match
  FROM public.matches m
  JOIN public.tournament_participants tp_home ON tp_home.id = m.home_participant_id
  JOIN public.tournament_participants tp_away ON tp_away.id = m.away_participant_id
  WHERE m.id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido no encontrado' USING ERRCODE = 'P0001';
  END IF;

  IF v_user_id != v_match.home_user_id AND v_user_id != v_match.away_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un participante del encuentro o admin puede reportar el resultado' USING ERRCODE = '42501';
  END IF;

  -- Crear la propuesta de resultado
  INSERT INTO public.match_result_proposals (
    match_id, submitted_by, home_score, away_score, proof_screenshot_url, status
  ) VALUES (
    p_match_id, v_user_id, p_home_score, p_away_score, p_screenshot_url, 'pending'
  )
  RETURNING id INTO v_proposal_id;

  -- Actualizar el partido con el estado pendiente y los marcadores reportados
  UPDATE public.matches
  SET status = 'pending_confirmation',
      reported_home_score = p_home_score,
      reported_away_score = p_away_score,
      submitted_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_match_id;

  RETURN jsonb_build_object(
    'success', true,
    'proposal_id', v_proposal_id,
    'match_id', p_match_id,
    'status', 'pending_confirmation'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 5. respond_to_match_result: Validación o Rechazo del contrincante
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_to_match_result(
  p_proposal_id UUID,
  p_approved BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_prop RECORD;
  v_match RECORD;
  v_dispute_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '28000';
  END IF;

  SELECT mrp.*, m.home_participant_id, m.away_participant_id,
         tp_h.user_id AS home_user_id, tp_a.user_id AS away_user_id
  INTO v_prop
  FROM public.match_result_proposals mrp
  JOIN public.matches m ON m.id = mrp.match_id
  JOIN public.tournament_participants tp_h ON tp_h.id = m.home_participant_id
  JOIN public.tournament_participants tp_a ON tp_a.id = m.away_participant_id
  WHERE mrp.id = p_proposal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Propuesta de resultado no encontrada' USING ERRCODE = 'P0001';
  END IF;

  IF v_prop.status != 'pending' THEN
    RAISE EXCEPTION 'Esta propuesta ya fue procesada (%s)', v_prop.status USING ERRCODE = 'P0001';
  END IF;

  -- El usuario que responde debe ser el contrincante o admin
  IF v_user_id = v_prop.submitted_by AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'No puedes validar tu propia propuesta' USING ERRCODE = '42501';
  END IF;

  IF p_approved THEN
    -- APROBAR: Marcador oficial confirmado
    UPDATE public.match_result_proposals
    SET status = 'approved',
        responded_by = v_user_id,
        responded_at = timezone('utc'::text, now())
    WHERE id = p_proposal_id;

    UPDATE public.matches
    SET status = 'confirmed',
        final_home_score = v_prop.home_score,
        final_away_score = v_prop.away_score,
        confirmed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_prop.match_id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'confirmed',
      'match_id', v_prop.match_id,
      'final_home_score', v_prop.home_score,
      'final_away_score', v_prop.away_score
    );
  ELSE
    -- RECHAZAR: Abrir disputa automática
    UPDATE public.match_result_proposals
    SET status = 'rejected',
        responded_by = v_user_id,
        responded_at = timezone('utc'::text, now())
    WHERE id = p_proposal_id;

    UPDATE public.matches
    SET status = 'disputed',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_prop.match_id;

    INSERT INTO public.match_disputes (
      match_id, opened_by, reason, status
    ) VALUES (
      v_prop.match_id, v_user_id, 'Resultado rechazado por el contrincante', 'open'
    )
    RETURNING id INTO v_dispute_id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'disputed',
      'match_id', v_prop.match_id,
      'dispute_id', v_dispute_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 6. resolve_match_dispute: Resolución arbitral administrativa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_match_dispute(
  p_dispute_id UUID,
  p_final_home_score INT,
  p_final_away_score INT,
  p_verdict TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_dispute RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden resolver disputas' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_dispute
  FROM public.match_disputes
  WHERE id = p_dispute_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Disputa no encontrada' USING ERRCODE = 'P0001';
  END IF;

  -- Actualizar disputa
  UPDATE public.match_disputes
  SET status = 'resolved',
      resolved_by = auth.uid(),
      resolution_verdict = p_verdict,
      resolved_at = timezone('utc'::text, now())
  WHERE id = p_dispute_id;

  -- Confirmar partido con veredicto final
  UPDATE public.matches
  SET status = 'confirmed',
      final_home_score = p_final_home_score,
      final_away_score = p_final_away_score,
      confirmed_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = v_dispute.match_id;

  RETURN jsonb_build_object(
    'success', true,
    'dispute_id', p_dispute_id,
    'match_id', v_dispute.match_id,
    'final_home_score', p_final_home_score,
    'final_away_score', p_final_away_score,
    'verdict', p_verdict
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 004_standings_view.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- EA FC TOURNAMENT COMPANION V2 — STANDINGS VIEW (TABLA DE POSICIONES)
-- Migration: 004_standings_view.sql
-- =============================================================================

CREATE OR REPLACE VIEW public.standings_view AS
WITH match_stats AS (
  -- Rendimiento como Local
  SELECT
    m.tournament_id,
    m.home_participant_id AS participant_id,
    1 AS played,
    CASE WHEN m.final_home_score > m.final_away_score THEN 1 ELSE 0 END AS won,
    CASE WHEN m.final_home_score = m.final_away_score THEN 1 ELSE 0 END AS drawn,
    CASE WHEN m.final_home_score < m.final_away_score THEN 1 ELSE 0 END AS lost,
    m.final_home_score AS goals_for,
    m.final_away_score AS goals_against,
    CASE
      WHEN m.final_home_score > m.final_away_score THEN 3
      WHEN m.final_home_score = m.final_away_score THEN 1
      ELSE 0
    END AS points
  FROM public.matches m
  WHERE m.status = 'confirmed'

  UNION ALL

  -- Rendimiento como Visitante
  SELECT
    m.tournament_id,
    m.away_participant_id AS participant_id,
    1 AS played,
    CASE WHEN m.final_away_score > m.final_home_score THEN 1 ELSE 0 END AS won,
    CASE WHEN m.final_away_score = m.final_home_score THEN 1 ELSE 0 END AS drawn,
    CASE WHEN m.final_away_score < m.final_home_score THEN 1 ELSE 0 END AS lost,
    m.final_away_score AS goals_for,
    m.final_home_score AS goals_against,
    CASE
      WHEN m.final_away_score > m.final_home_score THEN 3
      WHEN m.final_away_score = m.final_home_score THEN 1
      ELSE 0
    END AS points
  FROM public.matches m
  WHERE m.status = 'confirmed'
),
aggregated_stats AS (
  SELECT
    tp.tournament_id,
    tp.id AS participant_id,
    tp.user_id,
    tp.club_id,
    COALESCE(SUM(ms.played), 0)::INTEGER AS played,
    COALESCE(SUM(ms.won), 0)::INTEGER AS won,
    COALESCE(SUM(ms.drawn), 0)::INTEGER AS drawn,
    COALESCE(SUM(ms.lost), 0)::INTEGER AS lost,
    COALESCE(SUM(ms.goals_for), 0)::INTEGER AS goals_for,
    COALESCE(SUM(ms.goals_against), 0)::INTEGER AS goals_against,
    (COALESCE(SUM(ms.goals_for), 0) - COALESCE(SUM(ms.goals_against), 0))::INTEGER AS goal_difference,
    COALESCE(SUM(ms.points), 0)::INTEGER AS points
  FROM public.tournament_participants tp
  LEFT JOIN match_stats ms
    ON ms.tournament_id = tp.tournament_id
   AND ms.participant_id = tp.id
  GROUP BY tp.tournament_id, tp.id, tp.user_id, tp.club_id
)
SELECT
  s.tournament_id,
  s.participant_id,
  s.user_id,
  p.display_name AS player_name,
  p.gamer_tag,
  p.avatar_url,
  c.id AS club_id,
  c.name AS club_name,
  c.short_name AS club_short_name,
  c.slug AS club_slug,
  c.logo_url AS club_logo,
  c.color AS club_color,
  c.accent_color AS club_accent_color,
  s.played,
  s.won,
  s.drawn,
  s.lost,
  s.goals_for,
  s.goals_against,
  s.goal_difference,
  s.points,
  ROW_NUMBER() OVER (
    PARTITION BY s.tournament_id
    ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC, c.name ASC
  )::INTEGER AS rank
FROM aggregated_stats s
JOIN public.profiles p ON p.id = s.user_id
JOIN public.clubs c ON c.id = s.club_id;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 005_seed_initial_data.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- EA FC TOURNAMENT COMPANION V2 — SEED DATA (5 LIGAS, 25 CLUBES, PLANTELES)
-- Migration: 005_seed_initial_data.sql
-- =============================================================================

-- 1. LIGAS
INSERT INTO public.leagues (id, name, country, slug, logo_url)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Premier League', 'Inglaterra', 'premier-league', 'https://media.api-sports.io/football/leagues/39.png'),
  ('11111111-1111-1111-1111-111111111102', 'LaLiga EA Sports', 'España', 'laliga-ea-sports', 'https://media.api-sports.io/football/leagues/140.png'),
  ('11111111-1111-1111-1111-111111111103', 'Serie A Enilive', 'Italia', 'serie-a', 'https://media.api-sports.io/football/leagues/135.png'),
  ('11111111-1111-1111-1111-111111111104', 'Bundesliga', 'Alemania', 'bundesliga', 'https://media.api-sports.io/football/leagues/78.png'),
  ('11111111-1111-1111-1111-111111111105', 'Ligue 1 McDonald''s', 'Francia', 'ligue-1', 'https://media.api-sports.io/football/leagues/61.png')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  logo_url = EXCLUDED.logo_url;

-- 2. 25 CLUBES (5 por liga)
INSERT INTO public.clubs (id, league_id, name, short_name, slug, color, accent_color, rating, attack, defense, chemistry, logo_url)
VALUES
  -- Premier League
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Manchester City', 'MCI', 'manchester-city', '#6CABDD', '#B8FF2C', 86, 88, 85, 33, 'https://media.api-sports.io/football/teams/50.png'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Arsenal FC', 'ARS', 'arsenal', '#EF0107', '#22D3EE', 84, 85, 84, 33, 'https://media.api-sports.io/football/teams/42.png'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Liverpool FC', 'LIV', 'liverpool', '#C8102E', '#F6B93B', 85, 86, 84, 33, 'https://media.api-sports.io/football/teams/40.png'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'Chelsea FC', 'CHE', 'chelsea', '#034694', '#22D3EE', 82, 83, 81, 33, 'https://media.api-sports.io/football/teams/49.png'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111101', 'Aston Villa', 'AVL', 'aston-villa', '#95BFE5', '#670E36', 81, 82, 80, 33, 'https://media.api-sports.io/football/teams/66.png'),

  -- LaLiga EA Sports
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111102', 'Real Madrid CF', 'RMA', 'real-madrid', '#FFFFFF', '#B8FF2C', 87, 89, 85, 33, 'https://media.api-sports.io/football/teams/541.png'),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111102', 'FC Barcelona', 'BAR', 'fc-barcelona', '#004D98', '#A50044', 85, 86, 83, 33, 'https://media.api-sports.io/football/teams/529.png'),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111102', 'Atlético de Madrid', 'ATM', 'atletico-madrid', '#CB3524', '#22D3EE', 83, 84, 83, 33, 'https://media.api-sports.io/football/teams/530.png'),
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111102', 'Athletic Club', 'ATH', 'athletic-club', '#EE2524', '#000000', 81, 82, 80, 33, 'https://media.api-sports.io/football/teams/531.png'),
  ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111102', 'Girona FC', 'GIR', 'girona', '#CD1318', '#FFFFFF', 80, 81, 79, 33, 'https://media.api-sports.io/football/teams/547.png'),

  -- Serie A
  ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111103', 'Inter de Milán', 'INT', 'inter-milan', '#001489', '#B8FF2C', 85, 86, 85, 33, 'https://media.api-sports.io/football/teams/505.png'),
  ('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111103', 'Juventus FC', 'JUV', 'juventus', '#000000', '#FFFFFF', 83, 83, 83, 33, 'https://media.api-sports.io/football/teams/496.png'),
  ('22222222-2222-2222-2222-222222222213', '11111111-1111-1111-1111-111111111103', 'AC Milan', 'MIL', 'ac-milan', '#FB090B', '#000000', 83, 84, 82, 33, 'https://media.api-sports.io/football/teams/489.png'),
  ('22222222-2222-2222-2222-222222222214', '11111111-1111-1111-1111-111111111103', 'Atalanta BC', 'ATA', 'atalanta', '#1E71B8', '#000000', 82, 83, 81, 33, 'https://media.api-sports.io/football/teams/499.png'),
  ('22222222-2222-2222-2222-222222222215', '11111111-1111-1111-1111-111111111103', 'AS Roma', 'ROM', 'as-roma', '#8E1F2F', '#F0BC42', 81, 82, 80, 33, 'https://media.api-sports.io/football/teams/497.png'),

  -- Bundesliga
  ('22222222-2222-2222-2222-222222222216', '11111111-1111-1111-1111-111111111104', 'Bayern Múnich', 'BAY', 'bayern-munich', '#DC052D', '#0066B2', 86, 88, 84, 33, 'https://media.api-sports.io/football/teams/157.png'),
  ('22222222-2222-2222-2222-222222222217', '11111111-1111-1111-1111-111111111104', 'Bayer 04 Leverkusen', 'B04', 'bayer-leverkusen', '#E32221', '#000000', 84, 85, 83, 33, 'https://media.api-sports.io/football/teams/168.png'),
  ('22222222-2222-2222-2222-222222222218', '11111111-1111-1111-1111-111111111104', 'Borussia Dortmund', 'BVB', 'borussia-dortmund', '#FDE100', '#000000', 82, 83, 81, 33, 'https://media.api-sports.io/football/teams/165.png'),
  ('22222222-2222-2222-2222-222222222219', '11111111-1111-1111-1111-111111111104', 'RB Leipzig', 'RBL', 'rb-leipzig', '#ED1B24', '#0C2340', 81, 82, 80, 33, 'https://media.api-sports.io/football/teams/173.png'),
  ('22222222-2222-2222-2222-222222222220', '11111111-1111-1111-1111-111111111104', 'Eintracht Frankfurt', 'SGE', 'eintracht-frankfurt', '#E1000F', '#000000', 80, 80, 79, 33, 'https://media.api-sports.io/football/teams/169.png'),

  -- Ligue 1
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111105', 'Paris Saint-Germain', 'PSG', 'paris-saint-germain', '#004170', '#DA291C', 85, 87, 83, 33, 'https://media.api-sports.io/football/teams/85.png'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111105', 'AS Monaco', 'ASM', 'as-monaco', '#ED1C24', '#FFFFFF', 81, 82, 79, 33, 'https://media.api-sports.io/football/teams/91.png'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111105', 'Olympique de Marseille', 'OM', 'olympique-marseille', '#2FAEE0', '#FFFFFF', 80, 81, 79, 33, 'https://media.api-sports.io/football/teams/81.png'),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111105', 'LOSC Lille', 'LIL', 'lille-osc', '#E01E13', '#11224D', 80, 80, 79, 33, 'https://media.api-sports.io/football/teams/79.png'),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111105', 'OGC Nice', 'NIC', 'ogc-nice', '#000000', '#DA291C', 79, 79, 79, 33, 'https://media.api-sports.io/football/teams/84.png')
ON CONFLICT (slug) DO UPDATE SET
  rating = EXCLUDED.rating,
  attack = EXCLUDED.attack,
  defense = EXCLUDED.defense,
  logo_url = EXCLUDED.logo_url;

-- 3. JUGADORES DESTACADOS POR CLUB (Ejemplo para Man City, Real Madrid, Arsenal, Barcelona, PSG, Bayern)
INSERT INTO public.players (club_id, name, normalized_name, position, position_group, shirt_number, rating, nationality)
VALUES
  -- Manchester City
  ('22222222-2222-2222-2222-222222222201', 'Ederson', 'ederson', 'POR', 'GK', 31, 88, 'Brasil'),
  ('22222222-2222-2222-2222-222222222201', 'Rúben Dias', 'ruben dias', 'DFC', 'DEF', 3, 88, 'Portugal'),
  ('22222222-2222-2222-2222-222222222201', 'Josko Gvardiol', 'josko gvardiol', 'LI', 'DEF', 24, 83, 'Croacia'),
  ('22222222-2222-2222-2222-222222222201', 'Kyle Walker', 'kyle walker', 'LD', 'DEF', 2, 84, 'Inglaterra'),
  ('22222222-2222-2222-2222-222222222201', 'Rodri', 'rodri', 'MCD', 'MID', 16, 91, 'España'),
  ('22222222-2222-2222-2222-222222222201', 'Kevin De Bruyne', 'kevin de bruyne', 'MC', 'MID', 17, 90, 'Bélgica'),
  ('22222222-2222-2222-2222-222222222201', 'Bernardo Silva', 'bernardo silva', 'MC', 'MID', 20, 88, 'Portugal'),
  ('22222222-2222-2222-2222-222222222201', 'Phil Foden', 'phil foden', 'ED', 'FWD', 47, 88, 'Inglaterra'),
  ('22222222-2222-2222-2222-222222222201', 'Erling Haaland', 'erling haaland', 'DC', 'FWD', 9, 91, 'Noruega'),
  ('22222222-2222-2222-2222-222222222201', 'Jack Grealish', 'jack grealish', 'EI', 'FWD', 10, 84, 'Inglaterra'),
  ('22222222-2222-2222-2222-222222222201', 'Jérémy Doku', 'jeremy doku', 'EI', 'FWD', 11, 80, 'Bélgica'),

  -- Real Madrid
  ('22222222-2222-2222-2222-222222222206', 'Thibaut Courtois', 'thibaut courtois', 'POR', 'GK', 1, 89, 'Bélgica'),
  ('22222222-2222-2222-2222-222222222206', 'Dani Carvajal', 'dani carvajal', 'LD', 'DEF', 2, 86, 'España'),
  ('22222222-2222-2222-2222-222222222206', 'Éder Militão', 'eder militao', 'DFC', 'DEF', 3, 85, 'Brasil'),
  ('22222222-2222-2222-2222-222222222206', 'Antonio Rüdiger', 'antonio rudiger', 'DFC', 'DEF', 22, 88, 'Alemania'),
  ('22222222-2222-2222-2222-222222222206', 'Ferland Mendy', 'ferland mendy', 'LI', 'DEF', 23, 82, 'Francia'),
  ('22222222-2222-2222-2222-222222222206', 'Federico Valverde', 'federico valverde', 'MC', 'MID', 8, 88, 'Uruguay'),
  ('22222222-2222-2222-2222-222222222206', 'Aurélien Tchouaméni', 'aurelien tchouameni', 'MCD', 'MID', 14, 85, 'Francia'),
  ('22222222-2222-2222-2222-222222222206', 'Jude Bellingham', 'jude bellingham', 'MCO', 'MID', 5, 90, 'Inglaterra'),
  ('22222222-2222-2222-2222-222222222206', 'Rodrygo', 'rodrygo', 'ED', 'FWD', 11, 86, 'Brasil'),
  ('22222222-2222-2222-2222-222222222206', 'Kylian Mbappé', 'kylian mbappe', 'DC', 'FWD', 9, 91, 'Francia'),
  ('22222222-2222-2222-2222-222222222206', 'Vinícius Júnior', 'vinicius junior', 'EI', 'FWD', 7, 90, 'Brasil'),

  -- Arsenal FC
  ('22222222-2222-2222-2222-222222222202', 'David Raya', 'david raya', 'POR', 'GK', 22, 83, 'España'),
  ('22222222-2222-2222-2222-222222222202', 'William Saliba', 'william saliba', 'DFC', 'DEF', 2, 87, 'Francia'),
  ('22222222-2222-2222-2222-222222222202', 'Gabriel Magalhães', 'gabriel magalhaes', 'DFC', 'DEF', 6, 86, 'Brasil'),
  ('22222222-2222-2222-2222-222222222202', 'Declan Rice', 'declan rice', 'MCD', 'MID', 41, 87, 'Inglaterra'),
  ('22222222-2222-2222-2222-222222222202', 'Martin Ødegaard', 'martin odegaard', 'MCO', 'MID', 8, 89, 'Noruega'),
  ('22222222-2222-2222-2222-222222222202', 'Bukayo Saka', 'bukayo saka', 'ED', 'FWD', 7, 87, 'Inglaterra'),
  ('22222222-2222-2222-2222-222222222202', 'Kai Havertz', 'kai havertz', 'DC', 'FWD', 29, 83, 'Alemania'),
  ('22222222-2222-2222-2222-222222222202', 'Gabriel Martinelli', 'gabriel martinelli', 'EI', 'FWD', 11, 83, 'Brasil'),

  -- FC Barcelona
  ('22222222-2222-2222-2222-222222222207', 'Marc-André ter Stegen', 'marc-andre ter stegen', 'POR', 'GK', 1, 89, 'Alemania'),
  ('22222222-2222-2222-2222-222222222207', 'Jules Koundé', 'jules kounde', 'LD', 'DEF', 23, 85, 'Francia'),
  ('22222222-2222-2222-2222-222222222207', 'Pau Cubarsí', 'pau cubarsi', 'DFC', 'DEF', 2, 78, 'España'),
  ('22222222-2222-2222-2222-222222222207', 'Pedri', 'pedri', 'MC', 'MID', 8, 86, 'España'),
  ('22222222-2222-2222-2222-222222222207', 'Gavi', 'gavi', 'MC', 'MID', 6, 83, 'España'),
  ('22222222-2222-2222-2222-222222222207', 'Dani Olmo', 'dani olmo', 'MCO', 'MID', 20, 84, 'España'),
  ('22222222-2222-2222-2222-222222222207', 'Lamine Yamal', 'lamine yamal', 'ED', 'FWD', 19, 81, 'España'),
  ('22222222-2222-2222-2222-222222222207', 'Robert Lewandowski', 'robert lewandowski', 'DC', 'FWD', 9, 88, 'Polonia'),
  ('22222222-2222-2222-2222-222222222207', 'Raphinha', 'raphinha', 'EI', 'FWD', 11, 84, 'Brasil')
ON CONFLICT DO NOTHING;

-- 4. TORNEO DEMO ACTIVO
INSERT INTO public.tournaments (id, name, status, current_matchday, started_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Apex Champions League 2026',
  'active',
  1,
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;


