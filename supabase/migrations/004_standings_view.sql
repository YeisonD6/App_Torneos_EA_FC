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
