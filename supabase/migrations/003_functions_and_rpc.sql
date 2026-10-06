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
