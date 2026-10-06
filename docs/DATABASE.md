# EA FC TOURNAMENT COMPANION V2 — ARQUITECTURA DE BASE DE DATOS

## 1. Visión General
La base de datos está implementada sobre **PostgreSQL en Supabase**, diseñada bajo los principios de integridad referencial estricta, unicidad federada, concurrencia atómica (`FOR UPDATE SKIP LOCKED`) y cómputo dinámico de estadísticas deportivas.

---

## 2. Extensiones Habilitadas
- `pgcrypto`: Generación de UUIDs v4 criptográficos (`gen_random_uuid()`).
- `pg_trgm`: Búsqueda difusa y coincidencia por trigramas de alto rendimiento.
- `unaccent`: Normalización fonética y eliminación de tildes/diacríticos.

---

## 3. Modelo Entidad-Relación y Tablas

### `profiles` (1:1 con `auth.users`)
- **Propósito**: Datos de usuario federado, gamer tag y rol.
- **Campos**:
  - `id`: UUID (PK, FK `auth.users(id)` ON DELETE CASCADE).
  - `display_name`: TEXT NOT NULL.
  - `gamer_tag`: TEXT.
  - `role`: TEXT ('participant' | 'admin') DEFAULT 'participant'.
  - `avatar_url`: TEXT.
  - `created_at`, `updated_at`: TIMESTAMPTZ.
- **Trigger**: `on_auth_user_created` sincroniza automáticamente la creación de usuarios desde `auth.users` mediante `handle_new_user()`.

### `leagues`
- **Propósito**: Ligas oficiales representadas (Premier League, LaLiga, Serie A, Bundesliga, Ligue 1).
- **Campos**: `id`, `name`, `country`, `slug` (UNIQUE), `logo_url`, `created_at`, `updated_at`.

### `clubs`
- **Propósito**: Franquicias de fútbol con atributos competitivos EA FC.
- **Campos**:
  - `id`: UUID PK.
  - `league_id`: UUID FK `leagues(id)`.
  - `name`, `short_name`, `slug` (UNIQUE).
  - `color`, `accent_color`: Hexadecimals para estilizado reactivo UI.
  - `rating`, `attack`, `defense`: INTEGER (50..99).
  - `chemistry`: INTEGER (0..33).
  - `active`: BOOLEAN.

### `players`
- **Propósito**: Planteles completos normalizados por club.
- **Campos**:
  - `id`: UUID PK.
  - `club_id`: UUID FK `clubs(id)` ON DELETE CASCADE.
  - `name`: TEXT NOT NULL.
  - `normalized_name`: TEXT NOT NULL (indexado con trigrama GIN).
  - `position`: TEXT NOT NULL (ej. POR, DFC, MC, DC).
  - `position_group`: TEXT ('GK' | 'DEF' | 'MID' | 'FWD').
  - `shirt_number`: INTEGER (1..99).
  - `rating`: INTEGER (40..99).
  - `nationality`: TEXT.
- **Trigger**: `trg_normalize_player_name` ejecuta `lower(unaccent(NEW.name))` antes de cada INSERT o UPDATE.

### `tournaments` & `tournament_participants`
- **Propósito**: Torneo activo e inscripciones con restricción estricta de no repetición de clubes.
- **Unicidad**:
  - `UNIQUE(tournament_id, user_id)`: Un participante por torneo.
  - `UNIQUE(tournament_id, club_id)`: Cada franquicia solo puede ser jugada por un participante a la vez.

### `matchdays` & `matches`
- **Propósito**: Jornadas y enfrentamientos individuales con trazabilidad de marcadores.
- **Estados de Partido**:
  - `scheduled`: Calendario fijado.
  - `active`: Partido en disputa en vivo.
  - `pending_confirmation`: Marcador enviado por un capitán, pendiente de firma del rival.
  - `disputed`: Rechazado por desacuerdo; remitido a arbitraje.
  - `confirmed`: Acta oficial cerrada y validada.

### `match_events`
- **Propósito**: Minuto a minuto de goles y amonestaciones.
- **Campos**: `match_id`, `team_id`, `player_id`, `event_type` ('goal' | 'yellow_card' | 'red_card'), `minute`, `client_event_id`, `created_by`.

### `match_result_proposals` & `match_disputes`
- **Propósito**: Protocolo de apretón de manos (handshake) y controversias de partido.
- **Flujo**:
  - Si el rival aprueba la propuesta -> `matches` pasa a `confirmed`.
  - Si el rival rechaza la propuesta -> `matches` pasa a `disputed` y se inserta automáticamente un expediente en `match_disputes`.

### `tactical_boards` & `tactical_positions`
- **Propósito**: Esquemas tácticos con coordenadas normalizadas entre `0.000` y `1.000`.
- **Ventaja**: Garantiza consistencia geométrica sin importar si el usuario usa un iPhone mini, Android de gama media o tablet.

---

## 4. Vista de Clasificación Oficial (`standings_view`)
Calcula en tiempo real la tabla de posiciones con los desempates oficiales:
$$\text{PTS} = (\text{PG} \times 3) + (\text{PE} \times 1)$$
$$\text{DIF} = \text{GF} - \text{GC}$$
**Criterio de ordenación**:
1. `points DESC`
2. `goal_difference DESC`
3. `goals_for DESC`
4. `club_name ASC`
