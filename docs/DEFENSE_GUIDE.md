# GUÍA DE DEFENSA TÉCNICA — EA FC TOURNAMENT COMPANION V2

## 1. Resumen Ejecutivo del Proyecto
La aplicación **EA FC Tournament Companion V2** es una solución móvil integral de alto rendimiento diseñada para la gestión, arbitraje y seguimiento en tiempo real de torneos presenciales y online de EA Sports FC 25.

Construida con la estética deportiva **Apex Esports Dark** (importada desde Google Stitch), el sistema combina una experiencia de usuario inmersiva con una arquitectura backend sobre **PostgreSQL en Supabase**, reforzada con seguridad criptográfica mediante **Row Level Security (RLS)** y transacciones atómicas mediante procedimientos almacenados en **PL/pgSQL**.

---

## 2. Decisiones de Arquitectura y Justificaciones

### A. Expo SDK 57 + Expo Go
- **Por qué**: Permite desarrollo ágil y despliegue instantáneo en dispositivos físicos sin compilar código nativo en Xcode o Android Studio.
- **Cumplimiento**: 100% libre de bibliotecas nativas incompatibles; validado con `npx expo-doctor` (21/21 verificaciones aprobadas).

### B. PostgreSQL + Procedimientos Almacenados (RPCs)
- **Asignación de Clubes Atómica**: El sorteo en la ruleta utiliza `FOR UPDATE SKIP LOCKED`. Esto previene condiciones de carrera cuando decenas de jugadores giran la ruleta en el mismo segundo; la base de datos bloquea la fila candidata y jamás asigna el mismo club a dos capitanes.
- **Generación Berger**: Algoritmo matemático para rondas Todos contra Todos (`generate_round_robin_schedule`) ejecutado íntegramente en el motor relacional.
- **Protocolo de Apretón de Manos**: El registro de marcadores no es unilateral. Exige confirmación del rival (`match_result_proposals`) o escalamiento automático al VAR (`match_disputes`).

### C. Estrategia DB-First, Realtime-Second
- **Integridad Garantizada**: Los eventos no se emiten como mensajes efímeros que pueden perderse si hay microcortes de red. Cada gol o tarjeta se inserta primero en la tabla `match_events`, y el evento de réplica de PostgreSQL desencadena la notificación WebSocket a los clientes conectados.

### D. Búsqueda de Jugadores Acotada por Trigramas
- En el modal de incidencias, el campo de búsqueda filtra exclusivamente por el `club_id` involucrado y ejecuta búsquedas sin distinción de acentos con debouncing de 350ms, evitando saturar la red y previniendo que un capitán asigne un gol a un jugador de otro equipo.

### E. Coordenadas Tácticas Normalizadas (0.000 - 1.000)
- En lugar de almacenar píxeles absolutos, las posiciones de los futbolistas se guardan como porcentajes normalizados $X, Y \in [0, 1]$. De este modo, la pizarra táctica se reproduce con exactitud geométrica en cualquier tamaño de pantalla.

---

## 3. Resiliencia y Modo Demo / Offline
Para garantizar que cualquier evaluador pueda ejecutar la aplicación sin configurar previamente variables de entorno en Supabase:
- El cliente detecta si las credenciales son de desarrollo/placeholder.
- Si no hay conexión remota, el sistema activa automáticamente un **dataset normalizado offline** con las 5 grandes ligas europeas, 25 clubes y casi 200 futbolistas procesados por el scraper modular (`data/scraped_dataset.json`).
- Si se conectan las credenciales reales de Supabase, la aplicación se comunica directamente con las tablas y vistas remotas sin alterar una sola línea de código del frontend.

---

## 4. Guía de Ejecución y Pruebas

### Paso 1: Ejecutar el Scraper (Opcional para actualizar datos)
```bash
node scripts/scraping/index.js
```

### Paso 2: Verificar Tipos y Calidad de Código
```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

### Paso 3: Iniciar la Aplicación en Expo Go
```bash
npx expo start
```
Escanea el código QR desde la aplicación **Expo Go** en Android o iOS, o presiona `a` para emulador Android o `w` para navegador web.
