export const Colors = {
  // Canvas & Surfaces (Stitch Apex Esports Dark)
  background: '#080B10',
  surface: '#101319',
  surfaceLow: '#191C21',
  surfaceContainer: '#1D2025',
  surfaceHigh: '#272A30',
  surfaceHighest: '#32353B',
  surfaceBright: '#36393F',

  // Outlines & Borders
  border: '#27303D',
  borderLight: '#344052',
  borderVariant: '#424934',

  // Competitive Accents
  primary: '#B8FF2C', // Competition Lime
  primaryPressed: '#9FE51D',
  primaryDim: '#99DA00',
  primaryContainer: '#B1F722',
  onPrimary: '#131F00',

  secondary: '#22D3EE', // Broadcast Cyan
  secondaryBright: '#5DE6FF',
  secondaryContainer: '#00CBE6',
  onSecondary: '#00363E',

  // Status & Feedback
  success: '#39D98A',
  warning: '#FFC928',
  danger: '#FF4655', // Red Card / Disqualification
  errorContainer: '#93000A',
  info: '#38BDF8',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#A0A9B8',
  textMuted: '#697386',
  onSurfaceVariant: '#C2CAAE',
};

export const Shadows = {
  limeGlow: {
    shadowColor: '#B8FF2C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cyanGlow: {
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
};
