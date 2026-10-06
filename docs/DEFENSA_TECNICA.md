# 🎓 GUÍA MAESTRA DE DEFENSA TÉCNICA — EA FC TOURNAMENT COMPANION V2

> **Documento de preparación para sustentación ante jurados y evaluadores.**  
> Cada sección contiene la explicación ejecutiva, el fundamento de bajo nivel, los archivos fuente exactos, la función clave y la **pregunta trampa del profesor con su respuesta blindada**.

---

## 📑 Índice de Temas
1. [Arquitectura General](#1-arquitectura-general)
2. [Flujo de Autenticación](#2-flujo-de-autenticación)
3. [Cómo funciona Supabase Auth](#3-cómo-funciona-supabase-auth)
4. [Qué es Row-Level Security (RLS)](#4-qué-es-row-level-security-rls)
5. [Políticas RLS Utilizadas](#5-políticas-rls-utilizadas)
6. [Por qué la seguridad no puede depender del Frontend](#6-por-qué-la-seguridad-no-puede-depender-del-frontend)
7. [Cómo funciona la Ruleta](#7-cómo-funciona-la-ruleta)
8. [Cómo se conserva el Club Asignado](#8-cómo-se-conserva-el-club-asignado)
9. [Cómo se genera el Calendario Ida y Vuelta](#9-cómo-se-genera-el-calendario-ida-y-vuelta)
10. [Fórmula del Número de Partidos](#10-fórmula-del-número-de-partidos)
11. [Cómo se calculan los Puntos de la Tabla](#11-cómo-se-calculan-los-puntos-de-la-tabla)
12. [Cómo funciona Supabase Realtime](#12-cómo-funciona-supabase-realtime)
13. [Qué es un WebSocket](#13-qué-es-un-websocket)
14. [Cómo viaja un Evento de Partido de Jugador A a Jugador B](#14-cómo-viaja-un-evento-de-partido-de-jugador-a-a-jugador-b)
15. [Cómo funciona el Handshake de Validación de Resultados](#15-cómo-funciona-el-handshake-de-validación-de-resultados)
16. [Cómo funciona el Tribunal de Disputas (VAR)](#16-cómo-funciona-el-tribunal-de-disputas-var)
17. [Cómo se evitan las Condiciones de Carrera (Race Conditions)](#17-cómo-se-evitan-las-condiciones-de-carrera-race-conditions)
18. [Manejo del Estado Global](#18-manejo-del-estado-global)
19. [Flujo Asíncrono y Ciclo de Vida](#19-flujo-asíncrono-y-ciclo-de-vida)
20. [Sincronización y Contingencia Offline](#20-sincronización-y-contingencia-offline)
21. [Implementación de Drag & Drop Táctico](#21-implementación-de-drag--drop-táctico)
22. [Sistema de Coordenadas de la Cancha](#22-sistema-de-coordenadas-de-la-cancha)
23. [Cómo se evita que los Jugadores salgan de la Cancha](#23-cómo-se-evita-que-los-jugadores-salgan-de-la-cancha)
24. [Optimización de Performance a 60 FPS](#24-optimización-de-performance-a-60-fps)
25. [Manejo Seguro de Variables de Entorno](#25-manejo-seguro-de-variables-de-entorno)
26. [Por qué NUNCA debe incluirse `service_role` en Expo Móvil](#26-por-qué-nunca-debe-incluirse-service_role-en-expo-móvil)

---

### 1. Arquitectura General
- **Explicación Corta:** Es una arquitectura desacoplada: frontend móvil en React Native con Expo Go y backend serverless en Supabase PostgreSQL con WebSockets y Procedimientos Almacenados (RPC).
- **Explicación Técnica:** Expo Router maneja el enrutamiento declarativo basado en sistema de archivos (`src/app/`). La capa de datos se abstrae en `src/services/` comunicándose mediante `@supabase/supabase-js` con transporte HTTPS para llamadas RPC/REST y WSS para Realtime Channels. Un modo fallback autónomo en `src/data/scrapedData.ts` garantiza operatividad offline.
- **Archivo Principal:** `src/app/_layout.tsx` y `src/lib/supabase/client.ts`.
- **Función Principal:** `RootLayout()` y `createClient<Database>()`.
- **Pregunta del Profesor:** *¿Qué ventajas tiene usar Expo Router sobre React Navigation tradicional en este proyecto?*
- **Respuesta Correcta:** Expo Router es el estándar moderno de Expo que mapea rutas directamente a archivos con tipado estático (`typedRoutes: true`), optimiza el code-splitting nativo y permite transiciones fluidas de modales y tabs sin declarar manualmente árboles anidados de Stack Navigators.

---

### 2. Flujo de Autenticación
- **Explicación Corta:** El usuario ingresa correo y contraseña; Supabase genera un token de acceso JWT y crea automáticamente su perfil público de competidor mediante un trigger en base de datos.
- **Explicación Técnica:** La función `authService.signUp` envía la petición a GoTrue Auth (`auth.users`). PostgreSQL ejecuta de forma síncrona el trigger `on_auth_user_created` que llama a la función `handle_new_user()`, insertando una fila en `public.profiles` con rol `'participant'` y su `gamer_tag`.
- **Archivo Principal:** `src/services/auth.service.ts` y `supabase/migrations/001_core_schema.sql`.
- **Función Principal:** `authService.signUp()` y función PL/pgSQL `handle_new_user()`.
- **Pregunta del Profesor:** *¿Qué ocurre si el registro en `auth.users` tiene éxito pero falla la creación en `profiles`?*
- **Respuesta Correcta:** Al estar implementado mediante un trigger `AFTER INSERT` en PostgreSQL dentro de la misma transacción, si la inserción en `public.profiles` falla, toda la transacción hace `ROLLBACK`, evitando que queden usuarios huérfanos sin perfil.

---

### 3. Cómo funciona Supabase Auth
- **Explicación Corta:** Emplea JSON Web Tokens (JWT) firmados asimétricamente que viajan en la cabecera `Authorization: Bearer <token>` de cada petición para identificar al usuario en la base de datos.
- **Explicación Técnica:** Cuando el cliente se autentica, Supabase emite un Access Token (vida corta) y un Refresh Token (vida larga). El SDK móvil almacena automáticamente estos tokens en `AsyncStorage` de React Native y los renueva de forma transparente antes de que expiren (`autoRefreshToken: true`).
- **Archivo Principal:** `src/lib/supabase/client.ts`.
- **Función Principal:** `createClient` con configuración `storage: AsyncStorage`.
- **Pregunta del Profesor:** *¿Por qué en React Native no se pueden usar cookies como en Next.js para Supabase Auth?*
- **Respuesta Correcta:** Las cookies son un mecanismo del protocolo HTTP de navegadores web con dominio de origen. En React Native no existe un motor de navegador nativo manejando peticiones automáticas de cookies; por eso se utiliza un almacén de clave-valor nativo (`AsyncStorage`) para persistir el JWT y enviarlo en el header `Authorization`.

---

### 4. Qué es Row-Level Security (RLS)
- **Explicación Corta:** Es un cortafuegos a nivel de fila dentro del motor de PostgreSQL que restringe qué registros puede leer, insertar, editar o borrar cada usuario.
- **Explicación Técnica:** RLS evalúa dinámicamente cláusulas booleanas `USING` y `WITH CHECK` para cada sentencia SQL que llega a la tabla. La variable de contexto `auth.uid()` extrae la identidad del usuario a partir del token JWT criptográficamente verificado en la capa de base de datos.
- **Archivo Principal:** `supabase/migrations/002_rls_policies.sql`.
- **Función Principal:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Pregunta del Profesor:** *¿Si un atacante modifica el código de la app móvil y cambia su `user_id` en una petición, qué sucede?*
- **Respuesta Correcta:** La petición es rechazada de inmediato por PostgreSQL. El motor de base de datos no confía en los parámetros enviados en el cuerpo JSON, sino en la función `auth.uid()` derivada del JWT firmado con la clave secreta del servidor.

---

### 5. Políticas RLS Utilizadas
- **Explicación Corta:** Políticas de aislamiento donde los datos del torneo son públicos para lectura, pero las mutaciones solo las realiza el dueño del recurso o un administrador auditado.
- **Explicación Técnica:**
  - `profiles_select_all`: `USING (true)` permite ver perfiles y tablas de posiciones.
  - `profiles_update_own`: `USING (auth.uid() = id OR is_admin())` restringe edición.
  - `matches_insert_admin_only`: Solo administradores pueden programar partidos.
  - `match_events_insert_participant`: Solo los usuarios participantes del partido pueden registrar eventos de su propio club.
- **Archivo Principal:** `supabase/migrations/002_rls_policies.sql`.
- **Función Principal:** Sentencias `CREATE POLICY ... ON public.<table>`.
- **Pregunta del Profesor:** *¿Por qué la política de lectura en `profiles` tiene `USING (true)` y no es una vulnerabilidad?*
- **Respuesta Correcta:** Porque `profiles` solo almacena información pública de competencia (nombre, avatar y GamerTag) necesaria para renderizar la tabla de posiciones y emparejamientos. Los datos sensibles como contraseñas y hashes residen exclusivamente en el esquema privado `auth.users`, el cual nunca es accesible por el cliente.

---

### 6. Por qué la seguridad no puede depender del Frontend
- **Explicación Corta:** Porque cualquier cliente móvil puede ser interceptado, descompilado o emulado con herramientas como Postman, cURL o Frida.
- **Explicación Técnica:** Esconder un botón de "Eliminar Partido" o "Activar Jornada" en la interfaz gráfica es simplemente una conveniencia visual de UX. Un atacante puede extraer el endpoint REST y enviar directamente peticiones `POST` o `DELETE`. La seguridad real debe residir de forma no eludible en los constraints y políticas RLS del motor PostgreSQL.
- **Archivo Principal:** `docs/RLS.md` y `supabase/migrations/002_rls_policies.sql`.
- **Función Principal:** Políticas RLS y validaciones `IF NOT public.is_admin() THEN RAISE EXCEPTION`.
- **Pregunta del Profesor:** *¿Cómo demostraste en la auditoría que la seguridad está en la base de datos?*
- **Respuesta Correcta:** Mediante el test automatizado `RLS-005` y `RLS-006` en `scripts/audit_suite.js`, donde un cliente anónimo invocó directamente la función `activate_matchday` vía RPC y la base de datos rechazó la llamada con error `42501 (Solo administradores pueden activar jornadas)`.

---

### 7. Cómo funciona la Ruleta
- **Explicación Corta:** La animación gráfica desacelera mientras en paralelo un procedimiento almacenado en PostgreSQL selecciona atómicamente un club libre y lo asigna al usuario.
- **Explicación Técnica:** El cliente invoca la función RPC `assign_random_club(p_tournament_id)`. La base de datos ejecuta `SELECT id FROM clubs WHERE id NOT IN (...) ORDER BY random() LIMIT 1 FOR UPDATE SKIP LOCKED`, asigna el club a `tournament_participants` y devuelve la entidad completa a la interfaz para detener la ruleta exactamente en dicho equipo.
- **Archivo Principal:** `supabase/migrations/003_functions_and_rpc.sql` y `src/app/roulette.tsx`.
- **Función Principal:** `assign_random_club(p_tournament_id UUID)`.
- **Pregunta del Profesor:** *¿Qué pasa si la animación visual se detiene en el Real Madrid pero el backend asignó el Barcelona?*
- **Respuesta Correcta:** Es imposible en nuestra implementación. La animación no determina el club; la ruleta invoca primero el RPC de base de datos, obtiene el club ganador y utiliza el índice de ese club para calcular el ángulo final exacto del puntero (`targetAngle`). La base de datos es la única fuente de verdad.

---

### 8. Cómo se conserva el Club Asignado
- **Explicación Corta:** Se almacena en la tabla relacional `tournament_participants` vinculando el `user_id` con el `club_id`.
- **Explicación Técnica:** Cuando el usuario vuelve a abrir la app o llama nuevamente a la ruleta, la función `assign_random_club` consulta: `SELECT club_id FROM tournament_participants WHERE user_id = auth.uid()`. Si encuentra un club previamente asignado, aborta cualquier nueva selección aleatoria y devuelve el club existente con el estado `'already_assigned'`.
- **Archivo Principal:** `supabase/migrations/003_functions_and_rpc.sql` (líneas 35-47).
- **Función Principal:** Bloque condicional `IF v_already_assigned IS NOT NULL THEN`.
- **Pregunta del Profesor:** *¿Un usuario puede cambiar de club haciendo logout y login de nuevo?*
- **Respuesta Correcta:** No. La asignación queda grabada en el servidor de PostgreSQL en la fila de su usuario. Sin importar el dispositivo o si reinstala la aplicación, la base de datos siempre recuperará su mismo club asignado.

---

### 9. Cómo se genera el Calendario Ida y Vuelta
- **Explicación Corta:** Utiliza el algoritmo round-robin de Berger, fijando un participante y rotando cíclicamente a los demás en cada fecha para asegurar que todos jueguen contra todos como local y visitante.
- **Explicación Técnica:** Para $N$ competidores, se crean $N - 1$ fechas en la primera vuelta y se repiten con localía invertida para la vuelta. En cada fecha $r$, se empareja el elemento $i$ con el elemento $N - i + 1$. Al finalizar la fecha, el arreglo de participantes se rota con `array[v_round_participants[1]] || array[v_round_participants[N]] || v_round_participants[2:N-1]`.
- **Archivo Principal:** `supabase/migrations/003_functions_and_rpc.sql` (líneas 92-214).
- **Función Principal:** `generate_round_robin_schedule(p_tournament_id UUID)`.
- **Pregunta del Profesor:** *¿Cómo manejas si el número de participantes inscritos es impar?*
- **Respuesta Correcta:** El procedimiento añade un competidor ficticio con valor `NULL`. El participante que resulte emparejado con `NULL` en esa jornada obtiene una fecha de descanso ("bye") y no se genera ningún partido, manteniendo la simetría perfecta del fixture.

---

### 10. Fórmula del Número de Partidos
- **Explicación Corta:** La fórmula matemática exacta para un torneo todos contra todos de ida y vuelta es $N \times (N - 1)$, donde $N$ es la cantidad de participantes.
- **Explicación Técnica:** En un torneo de solo ida, el número de combinaciones de parejas sin importar el orden es $\binom{N}{2} = \frac{N(N-1)}{2}$. Al ser ida y vuelta (cada pareja debe jugar obligatoriamente una vez como local y otra como visitante), multiplicamos por 2: $2 \times \frac{N(N-1)}{2} = N(N-1)$.
- **Archivo Principal:** `docs/VALIDATION_REPORT.md` (caso `BERG-001`).
- **Función Principal:** `calculateBergerMatches(n) => n * (n - 1)`.
- **Pregunta del Profesor:** *Si se inscriben 8 jugadores al torneo, ¿cuántos partidos deben jugarse en total y cuántas fechas habrá?*
- **Respuesta Correcta:** Habrá $8 \times (8 - 1) = 56$ partidos en total. Como en cada jornada juegan 4 partidos simultáneos ($8/2$), habrá $56 / 4 = 14$ fechas (7 fechas de ida y 7 fechas de vuelta).

---

### 11. Cómo se calculan los Puntos de la Tabla
- **Explicación Corta:** Victoria otorga 3 puntos, Empate otorga 1 punto y Derrota otorga 0 puntos. La diferencia de gol es $DG = GF - GC$.
- **Explicación Técnica:** Se implementa mediante una vista SQL (`public.standings_view`) que realiza un `UNION ALL` agregando las estadísticas de cada partido con estado `'confirmed'` tanto en el rol de local como de visitante, agrupando por participante con `SUM(CASE WHEN ...)`. El ordenamiento estricto se define con `ORDER BY points DESC, goal_difference DESC, goals_for DESC`.
- **Archivo Principal:** `supabase/migrations/004_standings_view.sql`.
- **Función Principal:** Vista SQL `CREATE OR REPLACE VIEW public.standings_view`.
- **Pregunta del Profesor:** *¿Qué propiedad matemática debe cumplirse siempre entre los partidos jugados y los resultados de un club?*
- **Respuesta Correcta:** Debe cumplirse obligatoriamente que $PJ = PG + PE + PP$. Si la suma de victorias, empates y derrotas no coincide exactamente con los partidos jugados, la vista está corrompida. Nuestra vista garantiza esta invariante.

---

### 12. Cómo funciona Supabase Realtime
- **Explicación Corta:** Transmite en milisegundos a todos los celulares conectados los cambios que ocurren en las tablas de la base de datos sin necesidad de hacer polling o refrescar.
- **Explicación Técnica:** Supabase Realtime escucha el Write-Ahead Log (WAL) del replication slot de PostgreSQL. Cuando ocurre un `INSERT` en `match_events` o un `UPDATE` en `matches`, el motor Realtime serializa el evento y lo distribuye a los clientes conectados a ese canal de WebSocket.
- **Archivo Principal:** `src/hooks/useLiveMatchEvents.ts` y `supabase/migrations/004_realtime_setup.sql`.
- **Función Principal:** `supabase.channel('match-...').on('postgres_changes', ...).subscribe()`.
- **Pregunta del Profesor:** *¿Qué problemas de rendimiento puede generar Realtime en una app móvil y cómo los resolviste?*
- **Respuesta Correcta:** Puede causar fugas de memoria y reconexiones infinitas si los canales no se eliminan al salir de la pantalla. Lo resolvimos implementando una función de limpieza en el `useEffect` que ejecuta `supabase.removeChannel(channel)` al desmontar la vista.

---

### 13. Qué es un WebSocket
- **Explicación Corta:** Es un protocolo de comunicación bidireccional y persistente sobre una única conexión TCP entre el cliente y el servidor.
- **Explicación Técnica:** A diferencia de HTTP donde cada solicitud requiere un handshake TCP nuevo y cabeceras repetitivas (Request/Response), WebSocket inicia con un HTTP Upgrade y mantiene un canal abierto full-duplex de muy baja latencia para streaming de eventos en tiempo real.
- **Archivo Principal:** `src/lib/supabase/client.ts`.
- **Función Principal:** Capa `realtime` de `@supabase/supabase-js`.
- **Pregunta del Profesor:** *¿Por qué no usar simplemente `setInterval` con peticiones HTTP cada 2 segundos en lugar de WebSockets?*
- **Respuesta Correcta:** El polling con `setInterval` consume excesiva batería en el celular, gasta datos móviles inútilmente cuando el partido no tiene novedades y genera sobrecarga masiva de peticiones concurrentes en el servidor. WebSocket solo transmite datos cuando ocurre un evento real.

---

### 14. Cómo viaja un Evento de Partido de Jugador A a Jugador B
- **Explicación Corta:** Jugador A registra un gol -> Guarda en `match_events` en Supabase -> PostgreSQL emite el evento -> Supabase lo envía por WebSocket al celular del Jugador B -> La interfaz de B se actualiza al instante.
- **Explicación Técnica:** Jugador A ejecuta `matchEventsService.createEvent`. La política RLS valida que A pertenezca al encuentro. La fila se inserta en PostgreSQL. El daemon Realtime captura el cambio en la publicación `supabase_realtime` y emite un payload JSON al canal `match:{id}`. El hook `useLiveMatchEvents` en el celular de B recibe el payload, verifica que no sea duplicado por UUID y lo añade a su estado React.
- **Archivo Principal:** `src/services/matchEvents.service.ts` y `src/hooks/useLiveMatchEvents.ts`.
- **Función Principal:** `createEvent()` y `channel.on(...)`.
- **Pregunta del Profesor:** *¿Cómo evitas que un evento se duplique en la pantalla de quien lo emitió?*
- **Respuesta Correcta:** Mediante deduplicación por UUID primario: cuando llega un evento por WebSocket, el reductor de estado verifica `if (prev.some(e => e.id === newEvent.id)) return prev;`, ignorando la inserción si el ID ya existe localmente.

---

### 15. Cómo funciona el Handshake de Validación de Resultados
- **Explicación Corta:** El local propone el marcador final subiendo su captura de pantalla; el partido queda en "Pendiente"; el visitante recibe la notificación y puede Aprobar (marcador confirmado) o Rechazar (abre disputa VAR).
- **Explicación Técnica:** Se implementa en dos pasos atómicos:
  1. `submit_match_result`: Inserta en `match_result_proposals` con estado `'pending'` y actualiza el partido a `'pending_confirmation'`.
  2. `respond_to_match_result`: Valida que quien responda NO sea quien reportó (`v_user_id != v_prop.submitted_by`). Si aprueba, cambia el partido a `'confirmed'` y activa el cómputo en la tabla de posiciones.
- **Archivo Principal:** `supabase/migrations/003_functions_and_rpc.sql` (líneas 259-412).
- **Función Principal:** `submit_match_result` y `respond_to_match_result`.
- **Pregunta del Profesor:** *¿Puede el usuario local autovalidarse el resultado para ganar sin esperar al rival?*
- **Respuesta Correcta:** No. La función `respond_to_match_result` tiene una validación explícita en PostgreSQL: `IF v_user_id = v_prop.submitted_by AND NOT public.is_admin() THEN RAISE EXCEPTION 'No puedes validar tu propia propuesta'`.

---

### 16. Cómo funciona el Tribunal de Disputas (VAR)
- **Explicación Corta:** Si el contrincante rechaza el marcador reportado, el partido pasa automáticamente al estado de Disputa y un administrador examina las capturas de pantalla de ambos para emitir un fallo inapelable.
- **Explicación Técnica:** Al rechazar el resultado, `respond_to_match_result` inserta una fila en `public.match_disputes` con estado `'open'`. En la pantalla `/dispute`, el administrador inspecciona ambas fotos con zoom modal y ejecuta `resolve_match_dispute(dispute_id, home_score, away_score, verdict)`. El RPC valida `is_admin()`, actualiza el marcador definitivo, cambia el partido a `'confirmed'` y cierra la disputa como `'resolved'`.
- **Archivo Principal:** `src/app/dispute.tsx` y `supabase/migrations/003_functions_and_rpc.sql`.
- **Función Principal:** `resolve_match_dispute(...)`.
- **Pregunta del Profesor:** *¿Qué opciones de veredicto tiene el tribunal VAR?*
- **Respuesta Correcta:** Cuenta con 4 veredictos vinculantes: 1) Aprobar captura del Local, 2) Corregir según captura del Visitante, 3) Anular el partido y ordenar repetición, 4) Victoria por Walkover/Descalificación (3-0).

---

### 17. Cómo se evitan las Condiciones de Carrera (Race Conditions)
- **Explicación Corta:** Empleando transacciones con bloqueo pesimista en base de datos (`FOR UPDATE SKIP LOCKED`) en lugar de validaciones frágiles en el celular.
- **Explicación Técnica:** Si dos usuarios giran la ruleta en el mismo milisegundo o intentan validar un resultado simultáneamente, una arquitectura cliente basada en `SELECT` previo seguido de `UPDATE` sufriría una vulnerabilidad TOCTOU (Time-Of-Check to Time-Of-Use). Al ejecutar `FOR UPDATE SKIP LOCKED` dentro de un procedimiento PL/pgSQL atómico, el primer hilo adquiere el lock de la fila y el segundo hilo toma la siguiente fila disponible sin colisión.
- **Archivo Principal:** `supabase/migrations/003_functions_and_rpc.sql` (líneas 63 y 345).
- **Función Principal:** Cláusula `FOR UPDATE SKIP LOCKED;`.
- **Pregunta del Profesor:** *¿Cuál es la diferencia entre `FOR UPDATE` y `FOR UPDATE SKIP LOCKED`?*
- **Respuesta Correcta:** `FOR UPDATE` bloquea el registro haciendo que los demás hilos esperen en cola hasta que el primero termine (pudiendo generar cuellos de botella o timeouts). `SKIP LOCKED` salta las filas que ya están siendo bloqueadas por otra transacción en curso, garantizando concurrencia inmediata sin bloqueos mutuos.

---

### 18. Manejo del Estado Global
- **Explicación Corta:** Utilizamos Zustand y React Context para desacoplar el estado de sesión (`useAuthStore`) y el estado de la competencia (`useTournament`).
- **Explicación Técnica:** Zustand gestiona el estado inmutable sin boilerplate de Redux mediante hooks reactivos basados en subscripción de selectores (`useAuthStore((state) => state.profile)`). El `TournamentContext` provee despacho de acciones para eventos en vivo, alineaciones y persistencia con `AsyncStorage`.
- **Archivo Principal:** `src/stores/useAuthStore.ts` y `src/features/tournament/TournamentContext.tsx`.
- **Función Principal:** `create<AuthStore>()` y `TournamentProvider`.
- **Pregunta del Profesor:** *¿Qué pasa con el estado global cuando un usuario cierra sesión?*
- **Respuesta Correcta:** La función `signOut` de `useAuthStore` invoca la limpieza de credenciales en Supabase, borra el token persistido en `AsyncStorage` y reinicia el store con `set({ session: null, profile: null })` para evitar que un nuevo usuario herede datos en memoria del anterior.

---

### 19. Flujo Asíncrono y Ciclo de Vida
- **Explicación Corta:** Cada llamada a la red se encapsula en promesas asíncronas con indicadores de carga (`ActivityIndicator`), manejo de errores en bloques `try/catch` y banderas de desmontaje.
- **Explicación Técnica:** Para cumplir con la regla estricta de React 19, nunca se ejecutan `setState` sincrónicos durante el cuerpo raíz de los efectos. Cada `useEffect` define una variable booleana `let isMounted = true` que previene fugas de memoria y advertencias de actualización de componentes ya desmontados.
- **Archivo Principal:** `src/app/live-match.tsx` y `src/services/matches.service.ts`.
- **Función Principal:** Patrón `let isMounted = true; ... return () => { isMounted = false; }`.
- **Pregunta del Profesor:** *¿Por qué React 19 marca error al invocar `setState` sincrónico dentro del cuerpo de un `useEffect`?*
- **Respuesta Correcta:** Porque genera cascadas de renders innecesarios en el mismo ciclo de pintado y viola el modelo de concurrencia de React Compiler. Los cambios de estado deben ocurrir en callbacks de promesas o responder a eventos directos del usuario.

---

### 20. Sincronización y Contingencia Offline
- **Explicación Corta:** Si la conexión a Supabase no está configurada o se cae internet, la app entra en modo contingencia usando un dataset embebido con 513 jugadores reales de 25 clubes.
- **Explicación Técnica:** Los servicios consultan `isSupabaseConfigured()`. Si la red falla o las variables no están presentes, la aplicación redirige transparentemente las consultas hacia los proveedores en `src/data/scrapedData.ts` (`getFallbackSquad`, `fallbackClubs`), permitiendo que el usuario pruebe ruleta, tácticas y calendario de forma 100% interactiva.
- **Archivo Principal:** `src/lib/supabase/client.ts` y `src/data/scrapedData.ts`.
- **Función Principal:** `isSupabaseConfigured()` y `getFallbackSquad()`.
- **Pregunta del Profesor:** *¿La app tiene sincronización bidireccional offline cuando regresa internet?*
- **Respuesta Correcta:** No simula sincronización fantasma: los datos generados en modo demo se mantienen en el sandbox local; al recuperar la conexión con credenciales válidas, la aplicación consulta a PostgreSQL como la única fuente autoritativa de verdad del torneo oficial.

---

### 21. Implementación de Drag & Drop Táctico
- **Explicación Corta:** Cada jugador en la cancha es un nodo táctico arrastrable con el dedo mediante el motor nativo de gestos `PanResponder`.
- **Explicación Técnica:** El componente `DraggablePin` mide el tamaño del campo con `onLayout` y utiliza `PanResponder.create()` para escuchar `onPanResponderMove`. Convierte el delta de píxeles (`gesture.dx`, `gesture.dy`) a porcentajes relativos (`(dx / pitchWidth) * 100`) y actualiza la posición del jugador sin lag.
- **Archivo Principal:** `src/components/tactics/SoccerPitch.tsx`.
- **Función Principal:** `PanResponder.create()` en `DraggablePin`.
- **Pregunta del Profesor:** *¿Cómo diferencias entre un toque rápido para ver la ficha del jugador y un arrastre para cambiarlo de posición?*
- **Respuesta Correcta:** En `onPanResponderRelease`, evaluamos el desplazamiento acumulado: si $\sqrt{dx^2 + dy^2} \le 4$ píxeles, se interpreta como un tap y se dispara `onSelect()`. Si superó ese umbral, se ejecuta el movimiento táctico `onMove()`.

---

### 22. Sistema de Coordenadas de la Cancha
- **Explicación Corta:** Las posiciones tácticas no usan píxeles fijos sino coordenadas porcentuales normalizadas de $0\%$ a $100\%$, haciéndolas responsivas en cualquier celular o tablet.
- **Explicación Técnica:** Un mediocampista ofensivo se define con `{ x: 50, y: 38 }`. Al renderizar, se posiciona con `left: ${currentX}%` y `top: ${currentY}%` con un offset de corrección `transform: [{ translateX: -20 }, { translateY: -20 }]` para centrar exactamente el pin del jugador sobre el punto táctico.
- **Archivo Principal:** `src/components/tactics/SoccerPitch.tsx` y `src/data/mockTournamentData.ts`.
- **Función Principal:** Definiciones en `FORMATIONS_COORDS`.
- **Pregunta del Profesor:** *¿Qué ventajas tiene normalizar las coordenadas a porcentajes en la base de datos?*
- **Respuesta Correcta:** Que la táctica diseñada en un celular compacto de 5 pulgadas se verá idéntica en proporción cuando se abra en un iPhone Max o en una tablet de 11 pulgadas, sin descalibrar las distancias entre líneas de juego.

---

### 23. Cómo se evita que los Jugadores salgan de la Cancha
- **Explicación Corta:** Aplicamos una función matemática de "clamping" que limita estrictamente los valores mínimos y máximos en ambos ejes.
- **Explicación Técnica:** Durante cada frame de arrastre y al soltar el dedo, las coordenadas se evalúan con:  
  `const currentX = Math.min(92, Math.max(8, player.x + dragOffset.x));`  
  `const currentY = Math.min(94, Math.max(6, player.y + dragOffset.y));`  
  Esto confina el pin del jugador estrictamente dentro de las líneas de cal de la cancha de fútbol.
- **Archivo Principal:** `src/components/tactics/SoccerPitch.tsx` (líneas 50-65).
- **Función Principal:** Clamping con `Math.min` y `Math.max`.
- **Pregunta del Profesor:** *¿Por qué los límites son [8%, 92%] en lugar de [0%, 100%]?*
- **Respuesta Correcta:** Porque el pin del jugador tiene un ancho y alto físico de 40 píxeles. Si permitiéramos llegar al 0% o al 100%, la mitad de la tarjeta y el nombre del jugador quedarían cortados fuera del marco de la cancha. El margen del 8% absorbe el radio visual del nodo.

---

### 24. Optimización de Performance a 60 FPS
- **Explicación Corta:** Eliminamos renders innecesarios aislando el arrastre en componentes hoja (`DraggablePin`), usando `useMemo` y evitando re-renderizar todo el árbol en cada frame.
- **Explicación Técnica:** Mientras el usuario arrastra un jugador, el estado de desplazamiento temporal (`dragOffset`) vive localmente en ese único pin. El estado global del equipo en `TournamentContext` solo se actualiza una sola vez al soltar el dedo (`onPanResponderRelease`), evitando 60 actualizaciones de estado global por segundo.
- **Archivo Principal:** `src/components/tactics/SoccerPitch.tsx`.
- **Función Principal:** Aislamiento de estado en `DraggablePin`.
- **Pregunta del Profesor:** *¿Cómo verificaste que la app no tenga fugas de memoria ni degradación de FPS?*
- **Respuesta Correcta:** Manteniendo cero advertencias en `npx expo lint`, eliminando lecturas de refs durante el render (cumpliendo con React Compiler) y asegurando que las listas complejas utilicen componentes optimizados con claves primarias UUID estables.

---

### 25. Manejo Seguro de Variables de Entorno
- **Explicación Corta:** Solo se exponen al cliente móvil variables públicas con prefijo `EXPO_PUBLIC_`. Las claves secretas nunca entran al código de la app.
- **Explicación Técnica:** Expo compila en tiempo de empaquetado (bundling) todas las variables con prefijo `EXPO_PUBLIC_` incrustándolas en el bundle JavaScript. Por ello, en [.env](file:///c:/Users/ACER/Documents/2026-2/App_Torneos_EA_FC/.env) solo existen `EXPO_PUBLIC_SUPABASE_URL` y la clave pública Publishable `EXPO_PUBLIC_SUPABASE_ANON_KEY`. El archivo `.env` está expresamente ignorado en `.gitignore`.
- **Archivo Principal:** `.env.example`, `.env` y `.gitignore`.
- **Función Principal:** Reglas en `.gitignore` y lectura mediante `process.env.EXPO_PUBLIC_*`.
- **Pregunta del Profesor:** *¿Si alguien descompila el APK o IPA y encuentra la Publishable Key, puede hackear la base de datos?*
- **Respuesta Correcta:** No. La Publishable Key no otorga privilegios administrativos; solo identifica el proyecto. El acceso a cada dato está controlado por las políticas de Row-Level Security (RLS) en PostgreSQL, las cuales evalúan el usuario autenticado real.

---

### 26. Por qué NUNCA debe incluirse `service_role` en Expo Móvil
- **Explicación Corta:** Porque la clave `service_role` es la llave maestra de Supabase que desactiva por completo el RLS.
- **Explicación Técnica:** La clave `service_role` (o `sb_secret_`) se salta todas las políticas de Row-Level Security en PostgreSQL. Si se incluye en una aplicación móvil, cualquier usuario puede extraerla mediante ingeniería inversa e inyectar, alterar o borrar cualquier tabla de la base de datos sin restricción alguna. Su uso está estrictamente restringido a scripts backend protegidos (`scripts/scraping/`).
- **Archivo Principal:** `docs/RLS.md` y `src/lib/supabase/client.ts`.
- **Función Principal:** Garantía arquitectónica de cliente seguro.
- **Pregunta del Profesor:** *¿Dónde es el único lugar donde estaría permitido usar `service_role` en este proyecto?*
- **Respuesta Correcta:** Únicamente en scripts locales o servidores backend seguros (como `scripts/scraping/run_ingest.js`), ejecutados directamente por los administradores de la infraestructura desde la consola del servidor y fuera del alcance del teléfono móvil.
