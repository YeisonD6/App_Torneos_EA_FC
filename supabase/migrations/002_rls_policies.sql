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
