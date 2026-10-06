# 🎮 EA Sports FC Tournament Companion App V2

> **Aplicación móvil de alto rendimiento para gestión, seguimiento en vivo, tácticas y resolución de torneos competitivos de EA Sports FC.**  
> Construida con **Expo SDK 57**, **React Native 0.86 (React 19)**, **Expo Router**, **Supabase PostgreSQL** con Row-Level Security (RLS) y arquitectura **Offline-First / Demo Fallback**.

---

## 📑 Tabla de Contenidos
1. [Características Principales](#-características-principales)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Diseño Visual: Apex Esports Dark](#-diseño-visual-apex-esports-dark)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Requisitos Previos e Instalación](#-requisitos-previos-e-instalación)
6. [Ejecución en Expo Go](#-ejecución-en-expo-go)
7. [Configuración de Base de Datos y Supabase](#-configuración-de-base-de-datos-y-supabase)
8. [Dataset Scrapeado y Modo Offline/Demo](#-dataset-scrapeado-y-modo-offlinedemo)
9. [Guía de Pruebas de Flujos Completos (Testing Walkthrough)](#-guía-de-pruebas-de-flujos-completos-testing-walkthrough)
10. [Seguridad, RLS y Procedimientos Atómicos](#-seguridad-rls-y-procedimientos-atómicos)
11. [Comandos de Verificación y Calidad](#-comandos-de-verificación-y-calidad)

---

## 🚀 Características Principales

- **Ruleta Criptográfica de Asignación de Clubes**: Selección equitativa de clubes con algoritmo atómico en base de datos (`FOR UPDATE SKIP LOCKED`) y animación física desacelerada con selección auditada.
- **Pizarra Táctica Interactiva Dinámica**: Formaciones tácticas competitivas (`4-3-3`, `4-2-3-1`, `4-4-2`, `5-3-2`), sliders de profundidad y anchura, banco de suplentes dinámico extraído del club asignado e inspección de estadísticas EA FC.
- **Matchroom en Tiempo Real (Live Match)**: Cronómetro interactivo de partido (0 a 90'+), marcador en vivo, registro de eventos (Goles, Asistencias, Tarjetas Amarillas/Rojas, Lesiones, Autogoles) con búsqueda predictiva optimizada de jugadores y suscripción a Supabase Realtime Channels.
- **Validación Digital de Resultados & Carga de Evidencia Fotográfica**: Carga de capturas de pantalla de la pantalla final de EA FC mediante selector de galería de dispositivo (`expo-image-picker`) o presets de alta fidelidad, con generación de firma criptográfica SHA-256 inmutable.
- **Sala VAR y Tribunal de Resolución de Disputas**: Inspección fotográfica dual con zoom táctil modal, auditoría de discrepancias de marcador y panel de 4 resoluciones vinculantes administradas.
- **Panel Administrativo Competitivo**: Inicialización y reseteo de temporadas, generador automático de fixtures mediante algoritmo round-robin de Berger, activación de jornadas (J1 a J8) y resolución sumaria de controversias.
- **Soporte Completo Expo Go**: Funciona de inmediato sin necesidad de compilar código nativo en local.
- **Safe Area Insets Generosos**: Padding adaptativo en notched devices y barra inferior de gestos en iOS/Android.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
| :--- | :--- | :--- |
| **Framework Base** | Expo SDK / Managed Workflow | `~57.0.26` |
| **Runtime Móvil** | React Native / React | `0.86.3` / `19.2.3` |
| **Enrutamiento** | Expo Router (File-based Routing) | `~57.0.24` |
| **Base de Datos & Auth** | Supabase PostgreSQL + GoTrue Auth + Realtime | `^2.109.0` |
| **Estado Global** | Zustand | `^5.0.15` |
| **Caché y Fetching** | TanStack React Query | `^5.104.1` |
| **Tratamiento Multimedia** | Expo Image + Expo Image Picker | `~57.0.5` / `~57.0.20` |
| **Diseño y Vectores** | Expo Vector Icons + Linear Gradient + Safe Area Context | Latest SDK Compatible |
| **Tipado Estricto** | TypeScript | `~6.0.3` |

---

## 🎨 Diseño Visual: Apex Esports Dark

El proyecto implementa el sistema de diseño **Apex Esports Dark**, optimizado para el ecosistema competitivo de EA Sports FC:

- **Fondo Primario (`#080B10`)**: Profundidad oscura OLED sin reflejos.
- **Fondo Elevado / Cards (`#0F141C`)**: Contraste sutil para componentes modulares.
- **Acento Primario (`#B8FF2C`)**: Lima neón para acciones principales, llamadas a la acción y estados activos.
- **Acento Secundario (`#22D3EE`)**: Cian digital para estadísticas, métricas y detalles técnicos.
- **Acento Alerta / Peligro (`#FF4655`)**: Rojo carmesí para tarjetas rojas, disputas VAR y acciones destructivas.
- **Bordes y Superficies (`#1E2638`)**: Delineado sutil con efecto glassmorphism.

---

## 📁 Estructura del Proyecto

```text
App_Torneos_EA_FC/
├── .env.example                 # Plantilla de variables de entorno públicas y privadas
├── assets/                      # Emblemas, logos y recursos gráficos oficiales
├── data/
│   └── scraped_dataset.json     # 513 jugadores oficiales en 25 clubes y 5 ligas
├── docs/                        # Documentación técnica de arquitectura
│   ├── DATABASE.md              # Esquema relacional, triggers y funciones
│   ├── DATA_FLOW.md             # Diagramas de flujo de datos y ciclo de vida
│   ├── DEFENSE_GUIDE.md         # Guía de defensa técnica para evaluación
│   ├── DESIGN.md                # Sistema de diseño y tokens visuales
│   └── RLS.md                   # Políticas de Row-Level Security explicadas
├── scripts/
│   └── scraping/                # Pipeline modular de scraping de planteles EA FC
├── src/
│   ├── app/                     # Enrutamiento basado en Expo Router
│   │   ├── _layout.tsx          # Layout raíz, QueryClient y StatusBar
│   │   ├── (tabs)/              # Navegación por pestañas principal
│   │   │   ├── _layout.tsx      # Barra inferior con Safe Area y estética Esports
│   │   │   ├── index.tsx        # Dashboard principal / Hub de competición
│   │   │   ├── calendar.tsx     # Calendario de jornadas J1..J8 y filtros
│   │   │   ├── tactics.tsx      # Pizarra táctica, formaciones y banco interactivo
│   │   │   ├── standings.tsx    # Tabla de posiciones en vivo y goleadores
│   │   │   └── profile.tsx      # Perfil de jugador, GamerTag y estadísticas
│   │   ├── admin.tsx            # Panel de control de administración y ligas
│   │   ├── assigned-club.tsx    # Confirmación de club obtenido
│   │   ├── dispute.tsx          # Tribunal VAR y resolución de controversias
│   │   ├── live-match.tsx       # Matchroom en tiempo real con cronómetro y eventos
│   │   ├── login.tsx            # Pantalla de inicio de sesión
│   │   ├── register.tsx         # Registro con generación de GamerTag
│   │   ├── roulette.tsx         # Ruleta competitiva de asignación
│   │   └── validation.tsx       # Carga de acta de partido y firma criptográfica
│   ├── components/              # Componentes visuales desacoplados
│   │   ├── common/              # Headers, Safe Area Wrappers, Cards
│   │   ├── match/               # Cronómetros, selectores de eventos, modales
│   │   ├── roulette/            # Ruleta física y tarjetas de club
│   │   └── tactics/             # Cancha interactiva y slots tácticos
│   ├── data/
│   │   └── scrapedData.ts       # Runtime provider con fallback offline de 513 jugadores
│   ├── hooks/                   # Hooks personalizados (clubs, live events, search)
│   ├── lib/
│   │   └── supabase/            # Cliente Supabase tipado y configuración
│   ├── services/                # Capa de servicios y llamadas a base de datos
│   ├── stores/                  # Stores globales Zustand (authStore, etc.)
│   └── types/                   # Tipos TypeScript estrictos y Database Types
└── supabase/
    └── migrations/              # 5 migraciones SQL completas (esquema, RLS, seeds, triggers)
```

---

## 💻 Requisitos Previos e Instalación

### 1. Requisitos
- **Node.js**: v18.0.0 o superior (recomendado v20 LTS).
- **npm** o **bun**.
- Dispositivo móvil con la aplicación **Expo Go** instalada (disponible en Google Play Store y Apple App Store) o un emulador configurado.

### 2. Instalación de Dependencias
Ejecuta en la raíz del proyecto:

```bash
npm install
```

---

## 📱 Ejecución en Expo Go

Para iniciar el servidor de desarrollo compatible al 100% con **Expo Go**:

```bash
npx expo start
```

1. Se generará un código QR en la terminal.
2. Abre **Expo Go** en tu dispositivo físico (en Android escanea el QR directamente; en iOS escanea con la app Cámara nativa).
3. La aplicación se cargará de inmediato con recarga rápida (Fast Refresh).

---

## 🗄️ Configuración de Base de Datos y Supabase

### 1. Variables de Entorno
Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configura tus credenciales de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-publica
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-privada
```

### 2. Ejecución de Migraciones SQL
En el panel de control de tu proyecto Supabase (**SQL Editor**), ejecuta en orden secuencial los scripts ubicados en `supabase/migrations/`:

1. `001_core_schema.sql`: Extensiones `pgcrypto`, `pg_trgm`, `unaccent`, tablas maestras y triggers de normalización.
2. `002_rls_policies.sql`: Políticas de Row-Level Security para aislamiento de participantes y permisos de administrador.
3. `003_rpc_assign_club.sql`: Procedimiento almacenado atómico `assign_random_club` con bloqueo de concurrencia `FOR UPDATE SKIP LOCKED`.
4. `004_realtime_setup.sql`: Publicación en `supabase_realtime` para `matches`, `match_events` y `standings`.
5. `005_seed_initial_data.sql`: Carga de las 5 ligas mayores, los 25 clubes competitivos y el torneo de apertura.

---

## 🌐 Dataset Scrapeado y Modo Offline/Demo

La aplicación cuenta con una arquitectura de **doble capa**:
- **Capa Conectada**: Conecta con Supabase PostgreSQL para persistencia multiusuario, autenticación federada y canal Realtime.
- **Capa Offline/Demo (Resiliente)**: Si no se configuran variables de entorno o si se pierde la conexión de red, la aplicación entra automáticamente en modo autónomo utilizando el dataset embebido en `src/data/scrapedData.ts` con **513 jugadores reales** de las 5 ligas europeas principales:
  - 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Premier League**: Arsenal, Chelsea, Liverpool, Manchester City, Manchester United.
  - 🇪🇸 **LaLiga EA Sports**: Atlético de Madrid, FC Barcelona, Real Madrid, Real Sociedad, Sevilla FC.
  - 🇮🇹 **Serie A**: Inter, Juventus, AC Milan, Napoli, AS Roma.
  - 🇩🇪 **Bundesliga**: Bayer Leverkusen, Bayern München, Borussia Dortmund, RB Leipzig, VfB Stuttgart.
  - 🇫🇷 **Ligue 1**: AS Monaco, Lille OSC, Olympique Lyonnais, Olympique de Marseille, Paris Saint-Germain.

---

## 🧪 Guía de Pruebas de Flujos Completos (Testing Walkthrough)

### 1. Flujo de Autenticación & Asignación de Club (Ruleta)
1. Inicia en `/login` o presiona *"Crear cuenta"* para ir a `/register`.
2. Completa tu nombre, correo, contraseña y GamerTag de EA FC (ej. `xX_SniperFC_Xx`).
3. Al registrarte o presionar *"Continuar como Invitado / Demo"*, serás redirigido a `/roulette`.
4. Presiona el botón verde **"GIRAR RULETA COMPETITIVA"**. La ruleta iniciará una desaceleración cinemática y seleccionará un club disponible sin repetir.
5. Se abrirá la pantalla de confirmación `/assigned-club` detallando el escudo, estadísticas de Ataque/Defensa y Química. Presiona **"IR AL CENTRO DE TORNEO"** para entrar al Dashboard.

### 2. Flujo de Dashboard & Pizarra Táctica
1. En el Dashboard `/(tabs)/index.tsx`, verifica tu saludo personalizado con GamerTag, el Hero Match en vivo y el resumen de tu posición en la tabla.
2. Navega a la pestaña **Tácticas** `/(tabs)/tactics.tsx`:
   - Cambia la formación activa mediante el selector superior (`4-3-3`, `4-2-3-1`, `4-4-2`, `5-3-2`).
   - Toca cualquier jugador en el campo para inspeccionar su ficha técnica detallada (Ritmo, Tiro, Pase, Regate, Defensa, Físico).
   - Ajusta los controles deslizantes de **Anchura del Equipo** y **Profundidad Defensiva**.
   - Revisa el banco de suplentes dinámico que refleja la plantilla real de tu club asignado.

### 3. Flujo de Calendario & Matchroom en Tiempo Real (Live Match)
1. Navega a la pestaña **Calendario** `/(tabs)/calendar.tsx`:
   - Alterna entre jornadas **J1 a J8**.
   - Filtra partidos por estado (*Todos*, *En Juego*, *Completados*, *Pendientes*).
2. Toca un partido con estado *"En Juego"* para ingresar a `/live-match`:
   - El cronómetro se sincroniza en vivo con selector de cuartos y botones de reproducción/pausa.
   - Presiona el botón verde **"+ REGISTRAR EVENTO"**: selecciona tipo de evento (Gol, Tarjeta, Lesión, etc.), club y utiliza el campo de búsqueda predictiva con debounce de 350 ms para seleccionar el jugador del plantel.
   - El evento se estampa inmediatamente en la línea de tiempo del partido.
   - Presiona **"FINALIZAR PARTIDO & REGISTRAR ACTA"** para pasar a la validación.

### 4. Flujo de Validación de Resultado & Carga de Evidencia
1. En `/validation.tsx`:
   - Ajusta el resultado final si es necesario (ej. `3 - 1`).
   - Sube la captura de pantalla de la consola/PC tocando el botón de cámara o selecciona uno de los 3 presets competitivos de EA FC disponibles.
   - Toca la imagen para previsualizarla con zoom en pantalla completa.
   - Observa la generación automática de la **Firma Digital SHA-256** del acta.
   - Si ambos jugadores están conformes, activa el switch *"Rival de acuerdo con el acta"*; esto completará el partido y actualizará la tabla de posiciones. Si se desmarca, se abrirá la opción de remitir al **Tribunal VAR / Disputas**.

### 5. Flujo de Disputas & Tribunal VAR
1. Ingresa a `/dispute`:
   - Inspecciona los argumentos del demandante y del demandado.
   - Abre la evidencia fotográfica de cada participante en el visor modal comparativo.
   - Como juez o árbitro, selecciona uno de los **4 veredictos vinculantes**:
     - *Aprobar marcador según Captura A*.
     - *Corregir marcador a Captura B*.
     - *Anular partido y ordenar repetición inmediata*.
     - *Derrota por descalificación / Walkover (3-0)*.
   - Al confirmar el fallo, se asienta la resolución definitiva en la auditoría del torneo.

### 6. Flujo de Administración
1. Dirígete a `/admin` tocando el acceso de configuración o perfil:
   - Visualiza las estadísticas de la temporada activa (total inscritos, partidos y disputas).
   - Presiona **"Generar Fixture Oficial (Berger)"** para crear los enfrentamientos automatizados round-robin.
   - Activa o cierra jornadas de competición con un solo toque.

---

## 🔒 Seguridad, RLS y Procedimientos Atómicos

Para una descripción exhaustiva de las políticas de seguridad, consulta [docs/RLS.md](file:///c:/Users/ACER/Documents/2026-2/App_Torneos_EA_FC/docs/RLS.md) y [docs/DEFENSE_GUIDE.md](file:///c:/Users/ACER/Documents/2026-2/App_Torneos_EA_FC/docs/DEFENSE_GUIDE.md).

- **Principio de Mínimo Privilegio**: La clave anónima (`anon key`) solo puede consultar datos públicos y mutar los registros que pertenezcan a `auth.uid()`.
- **Inmutabilidad de Resultados Cerrados**: Los partidos validados (`completed`) tienen bloqueada la modificación por políticas RLS y triggers de auditoría.
- **Asignación Libre de Condiciones de Carrera**: La asignación de clubes se ejecuta en una función PL/pgSQL atómica (`assign_random_club`) con `SELECT ... FOR UPDATE SKIP LOCKED`, previniendo que dos usuarios simultáneos reciban el mismo club.
- **Firma Criptográfica**: Cada acta de partido genera un hash inmutable SHA-256 que garantiza que el reporte de partido no fue alterado tras su validación.

---

## 🔍 Comandos de Verificación y Calidad

El proyecto mantiene un estándar de cero errores y cero advertencias:

```bash
# 1. Comprobación de tipos en TypeScript (Estricto)
npx tsc --noEmit

# 2. Análisis estático y linter de Expo
npx expo lint

# 3. Diagnóstico integral de compatibilidad de dependencias y SDK
npx expo-doctor
```

---

<p align="center">
  <b>Desarrollado con pasión para la comunidad competitiva de EA Sports FC.</b>
</p>
