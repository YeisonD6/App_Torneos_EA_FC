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
