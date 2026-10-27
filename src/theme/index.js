// Design tokens — the single theme module.
//
// Palette adapted from the shadcn/tweakcn theme supplied by the project owner
// (green, white, generous radius, soft ambient shadow, letter-spaced labels).
// Two deliberate departures from the source tokens:
//
//   1. The primary green is desaturated from S60 % to S44 % (#30BD2E → #43A942).
//      The source reads as neon on a phone held at arm's length.
//   2. `--radius: 1.875rem` (30px) is a web card radius. On a 360dp phone it
//      swallows the screen, so cards use 24 and controls 16.
//
// Dark mode is not wired up: components read tokens at import time, so a dark
// theme needs a context refactor rather than a second object.

export const colors = {
  // Primary action. Calmer than the source token on purpose.
  accent: '#43A942',
  accentPressed: '#38893A',
  accentSoft: '#E3F8E5',
  onAccent: '#FFFFFF',

  // Text
  ink: '#103C1F',
  inkSecondary: '#778D7E',
  inkTertiary: '#9AA79F',

  // Surfaces
  paper: '#FFFFFF',
  surface: '#FFFFFF',

  // Structure
  line: '#F0F0F0',
  lineStrong: '#E5E5E5',

  danger: '#C0342E',

  // Charts and macro meters: one family, ordered by lightness, so four shades
  // read as one measurement broken into parts rather than four unrelated hues.
  macro: {
    calories: '#1B5E35',
    protein: '#27904A',
    carbs: '#3FA55F',
    fat: '#6EC384',
  },

  // Secondary from the source theme, tempered from #66F06F.
  secondary: '#98E19D',
};

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 0.1 },
  // The source theme sets 0.075em tracking; these carry that weight at phone sizes.
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0.9 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.6 },
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const shadows = {
  // Cards keep the theme's hairline plus a soft ambient lift: the border carries
  // the structure at a glance, the shadow only separates white from white.
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

export const iconSize = { sm: 16, md: 20, lg: 24 };

export const paperTheme = {
  colors: {
    primary: colors.accent,
    onPrimary: colors.onAccent,
    primaryContainer: colors.accentSoft,
    onPrimaryContainer: colors.ink,
    secondary: colors.secondary,
    onSecondary: colors.ink,
    secondaryContainer: colors.accentSoft,
    onSecondaryContainer: colors.ink,
    background: colors.paper,
    onBackground: colors.ink,
    surface: colors.surface,
    onSurface: colors.ink,
    surfaceVariant: colors.line,
    onSurfaceVariant: colors.inkSecondary,
    outline: colors.lineStrong,
    outlineVariant: colors.line,
    error: colors.danger,
    onError: '#FFFFFF',
  },
  roundness: 16,
};

export const navigationTheme = {
  dark: false,
  colors: {
    primary: colors.accent,
    background: colors.paper,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.accent,
  },
};

export default paperTheme;
