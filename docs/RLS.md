# POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)

## 1. Filosofía de Seguridad Zero-Trust
Cada operación en la base de datos se valida a nivel de motor PostgreSQL mediante **Row Level Security (RLS)**. Ningún cliente móvil puede manipular marcadores, asignaciones de clubes o expedientes arbitrales sin autorización criptográfica directa emanada de `auth.uid()`.

---

## 2. Funciones de Seguridad en Base de Datos

### `public.is_admin()`
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```
Permite elevar privilegios exclusivamente a usuarios con rol `admin` verificado en la tabla `profiles`.

### `public.is_match_participant(p_match_id UUID)`
```sql
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
```
Asegura que únicamente los capitanes vinculados al encuentro o un administrador puedan enviar incidencias o marcadores.

---

## 3. Matriz de Políticas por Tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Público (`true`) | Propio (`auth.uid() = id`) | Propio o Admin | Solo Admin |
| `leagues` | Público (`true`) | Solo Admin | Solo Admin | Solo Admin |
| `clubs` | Público (`true`) | Solo Admin | Solo Admin | Solo Admin |
| `players` | Público (`true`) | Solo Admin | Solo Admin | Solo Admin |
| `tournaments` | Público (`true`) | Solo Admin | Solo Admin | Solo Admin |
| `tournament_participants` | Público (`true`) | Propio o Admin | Propio o Admin | Solo Admin |
| `matchdays` | Público (`true`) | Solo Admin | Solo Admin | Solo Admin |
| `matches` | Público (`true`) | Solo Admin | Participantes del partido o Admin | Solo Admin |
| `match_events` | Público (`true`) | Participantes del partido | Solo Admin | Solo Admin |
| `match_result_proposals` | Público (`true`) | Capitán del partido | Capitán rival o Admin | Solo Admin |
| `match_disputes` | Público (`true`) | Participante del partido | Solo Admin (resolución) | Solo Admin |
| `tactical_boards` | Público (`true`) | Propietario o Admin | Propietario o Admin | Propietario o Admin |
| `tactical_positions` | Público (`true`) | Propietario o Admin | Propietario o Admin | Propietario o Admin |

---

## 4. Protección contra Ataques Comunes
1. **Falsificación de Resultados**: Un usuario ajeno al partido no puede reportar marcadores ni alterar propuestas (`is_match_participant`).
2. **Auto-Aprobación**: Un capitán no puede aprobar su propia propuesta de resultado gracias a la validación condicional en `respond_to_match_result`.
3. **Condición de Carrera en la Ruleta**: `assign_random_club()` emplea bloqueos a nivel de fila (`FOR UPDATE SKIP LOCKED`), garantizando que dos usuarios girando la ruleta simultáneamente nunca reciban la misma franquicia.
