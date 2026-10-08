/**
 * AgriSensa Garden Studio — Design System Tokens
 * Ported from agrisensa_eco/utils/styles.py
 * Used in globals.css via CSS custom properties and in TypeScript for dynamic styles.
 */

export const COLORS = {
  // Primary — Emerald Green (Sustainability)
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#34d399',

  // Secondary — Blue (Technology / Water)
  secondary: '#3b82f6',
  secondaryDark: '#2563eb',
  secondaryLight: '#60a5fa',

  // Accent — Amber (Highlight / Soil)
  accent: '#f59e0b',
  accentDark: '#d97706',
  accentLight: '#fbbf24',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Neutral
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',

  // Garden-specific
  plotBackground: '#f0fdf4',
  plotBorder: '#10b981',
  gridLine: 'rgba(16, 185, 129, 0.15)',
  gridLineMajor: 'rgba(16, 185, 129, 0.35)',
  excludedZone: 'rgba(239, 68, 68, 0.15)',
  excludedZoneBorder: '#ef4444',
  selectionHighlight: '#f59e0b',
  conflictHighlight: '#ef4444',
} as const;

export const FONTS = {
  primary: "'Inter', 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Consolas', monospace",
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

// ─── Facility Colors (for 2D canvas + 3D mesh) ────────────────────────────────
export const FACILITY_COLORS: Record<string, string> = {
  raised_bed: '#4ade80',
  hydroponic: '#38bdf8',
  pond: '#1d4ed8',
  chicken_coop: '#fbbf24',
  path: '#d4b483',
  water_source: '#6366f1',
  compost: '#a3a3a3',
  decorative: '#f9a8d4',
  fixed_object: '#78716c',
};

// ─── 3D Scene Colors ─────────────────────────────────────────────────────────
export const SCENE_COLORS = {
  plotGround: '#c8b898',
  plotBorder: '#8b7355',
  gridLine: '#a0a0a0',
  sky: '#87ceeb',
  ambient: '#ffffff',
} as const;
