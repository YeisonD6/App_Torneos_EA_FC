# DESIGN SYSTEM SPECIFICATION — APEX ESPORTS DARK (STITCH REFERENCE)

## 1. Brand & Aesthetic Overview
Este sistema de diseño entrega una experiencia táctica de grado broadcast para la gestión de torneos y competiciones oficiales de EA Sports FC 25.
Combina una estética **High-Contrast Neon Tech** con **Refined Dark Minimalism**:
- **Tonalidad base**: Voids oceánicos y carbón de estadio (`#080B10`).
- **Acentos de alta energía**: Lima de competición quirúrgica (`#B8FF2C`) y Cian de transmisión (`#22D3EE`).
- **Estados críticos / disciplina**: Carmesí peligro (`#FF4655`) y Ámbar de advertencia / VAR (`#FFC928`).
- **Objetivo visual**: Interfaces densas, legibles a un solo golpe de vista en partidas en vivo, sin fricción táctil a una mano en teléfonos móviles.

---

## 2. Color Palette & Tokens

### Canvas & Superficies
- `Background Primary` (`#080B10`): Negro estadio profundo; capa base de todas las pantallas.
- `Background Secondary` (`#0D1118`): Superficie de tab bar, modales y navegación inferior.
- `Surface` (`#101319`): Tarjetas de partido, fixtures y bloques de tabla.
- `Surface Low` (`#191C21`): Fondos de inputs, ranuras de timeline y filas alternas.
- `Surface Container` (`#1D2025`): Contenedores elevados, escudos y avatares.
- `Surface High` (`#272A30`): Chips de selección activa, pestañas modales.
- `Surface Highest` (`#32353B`): Bordes activos y elementos destacados.

### Acentos de Competición
- `Primary / Competition Lime` (`#B8FF2C`): Botones de acción principal (CTA), marcadores ganadores, temporizadores activos.
- `Primary Pressed` (`#9FE51D`): Feedback táctil para elementos primarios.
- `Secondary / Broadcast Cyan` (`#22D3EE`): Insignias de transmisión, minutos oficiales, tarjetas de partido en vivo.
- `Secondary Bright` (`#5DE6FF`): Badges y enlaces destacados.

### Semántica y Estados
- `Success` (`#39D98A`): Resultados confirmados, actas validadas.
- `Warning / VAR` (`#FFC928`): Amonestaciones, tarjetas amarillas, expedientes arbitrales en revisión.
- `Danger / Red Card` (`#FF4655`): Expulsiones directas, derrotas, impugnaciones y rechazos.
- `Border Primary` (`#27303D`): Líneas divisorias estructurales y contornos de tarjetas (1px hard line).
- `Border Light` (`#344052`): Contornos de modales elevados y hojas inferiores.

### Tipografía y Contraste
- `Text Primary` (`#F8FAFC`): Nombres de clubes, dígitos de marcadores, títulos principales.
- `Text Secondary` (`#A0A9B8`): Subtítulos, metadatos, nombres de ligas.
- `Text Muted` (`#697386`): Minutos secundarios, marcas de tiempo, etiquetas secundarias.

---

## 3. Tipografía

1. **Headlines y Títulos Tácticos**:
   - Tipografía: Sans-serif geométrica pesada (`900` / `800` / `700`).
   - Tracking / Letter Spacing: Ajustado (`0.5px` a `0.8px`).
   - Uso: Títulos de sala, encabezados de fecha, nombres de escuadras.

2. **Dígitos de Marcador y Timers**:
   - Monospace tabular para evitar salto visual durante ticks de minutos (`90+2'`) y marcadores (`2 : 1`).

3. **Etiquetas y Badges**:
   - Mayúsculas sostenidas (`textTransform: 'uppercase'`), tamaño `9px` - `12px`, peso `800`.

---

## 4. Elevación, Sombras y Glows

- **Hard Stroke Discipline**: Todo contenedor o card interactivo mantiene un borde nítido de `1px` en `#27303D`.
- **Lime Focus Glow**:
  ```ts
  shadowColor: '#B8FF2C',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 6
  ```
- **Cyan Live Glow**:
  ```ts
  shadowColor: '#22D3EE',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.40,
  shadowRadius: 8,
  elevation: 6
  ```

---

## 5. Geometría y Radios de Borde

- `sm` (`6px` - `8px`): Badges, botones de jugador en modal, píldoras de minutos.
- `md` (`10px` - `12px`): Tarjetas de partido, filas de clasificación, botones de acción.
- `lg` (`16px`): Cancha táctica, tarjetas hero de partido en vivo.
- `xl` (`20px` - `24px`): Hojas modales inferiores, panel de incidentes.
- `pill` (`999px`): Indicadores de beacon en vivo, chips de estado del servidor.
