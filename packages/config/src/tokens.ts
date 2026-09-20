/**
 * Key Tech Solutions design tokens.
 *
 * Single source of truth for colour, type, spacing, radius, shadow, motion,
 * container and breakpoint values. The public site and the admin panel both
 * emit these as CSS custom properties, so a token change propagates to every
 * surface without touching component code.
 */

export const brandColors = {
  purple: '#6436A3',
  blue: '#416F9E',
  teal: '#2CA3A3',
  cyan: '#5BC3C6',
  ink: '#111426',
  navy: '#141827',
  white: '#FFFFFF',
  backgroundLight: '#F5F7FA',
  softPurple: '#F3EEFA',
  softTeal: '#EAF8F7',
  border: '#D9DFE8',
  textSecondary: '#5E6673',
  success: '#2E7D55',
  warning: '#C77B19',
  error: '#B94343',
} as const;

export const brandGradient = 'linear-gradient(135deg, #6436A3 0%, #416F9E 50%, #2CA3A3 100%)';

/** Semantic colour roles layered on top of the raw brand palette. */
export const semanticColors = {
  surface: brandColors.white,
  surfaceMuted: brandColors.backgroundLight,
  surfaceBrandSoft: brandColors.softPurple,
  surfaceAccentSoft: brandColors.softTeal,
  surfaceInverse: brandColors.ink,
  textPrimary: brandColors.ink,
  textSecondary: brandColors.textSecondary,
  textInverse: brandColors.white,
  textOnBrand: brandColors.white,
  borderDefault: brandColors.border,
  borderStrong: '#B9C3D1',
  focusRing: brandColors.purple,
  linkDefault: brandColors.purple,
  linkHover: brandColors.blue,
} as const;

/** 8 point spacing scale. Values are rem strings. */
export const spacing = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.5rem',
  '6': '2rem',
  '7': '2.5rem',
  '8': '3rem',
  '9': '4rem',
  '10': '5rem',
  '11': '6rem',
  '12': '8rem',
} as const;

export const radius = {
  xs: '6px',
  sm: '10px',
  md: '14px',
  lg: '18px',
  xl: '24px',
  pill: '999px',
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(17, 20, 38, 0.06)',
  sm: '0 2px 8px rgba(17, 20, 38, 0.07)',
  md: '0 8px 24px rgba(17, 20, 38, 0.09)',
  lg: '0 18px 48px rgba(17, 20, 38, 0.12)',
  brand: '0 18px 48px rgba(100, 54, 163, 0.22)',
  focus: '0 0 0 3px rgba(100, 54, 163, 0.35)',
} as const;

/** Responsive type scale driven by clamp() so there is no step-change reflow. */
export const typography = {
  fontFamilySans:
    "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontFamilyMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  sizes: {
    display: 'clamp(2.5rem, 1.6rem + 3.9vw, 4.5rem)',
    pageHeading: 'clamp(2.125rem, 1.5rem + 2.7vw, 3.5rem)',
    sectionHeading: 'clamp(1.75rem, 1.35rem + 1.8vw, 2.75rem)',
    cardHeading: 'clamp(1.25rem, 1.15rem + 0.45vw, 1.625rem)',
    lead: 'clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)',
    body: 'clamp(1rem, 0.97rem + 0.15vw, 1.125rem)',
    small: '0.9375rem',
    meta: '0.8125rem',
  },
  lineHeights: {
    tight: '1.08',
    heading: '1.16',
    snug: '1.35',
    body: '1.65',
    relaxed: '1.75',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  measure: {
    narrow: '38ch',
    default: '68ch',
    wide: '78ch',
  },
} as const;

export const motion = {
  duration: {
    instant: '80ms',
    fast: '160ms',
    base: '240ms',
    slow: '420ms',
    slower: '640ms',
  },
  easing: {
    standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
    entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  stagger: {
    tight: 45,
    base: 80,
    loose: 120,
  },
} as const;

export const layout = {
  containerMax: '1200px',
  containerWide: '1360px',
  containerNarrow: '760px',
  gutterMobile: '16px',
  gutterTablet: '24px',
  gutterDesktop: '40px',
  headerHeight: '72px',
  headerHeightCompact: '60px',
  touchTarget: '44px',
  touchTargetLarge: '48px',
} as const;

export const breakpoints = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1440,
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  header: 200,
  dropdown: 300,
  overlay: 400,
  drawer: 500,
  modal: 600,
  toast: 700,
  skipLink: 900,
} as const;

export const formControls = {
  height: '48px',
  heightCompact: '40px',
  paddingX: '14px',
  radius: radius.sm,
  borderWidth: '1px',
  fontSize: '1rem',
} as const;

export const sectionThemeTokens = {
  WHITE: {
    background: brandColors.white,
    text: brandColors.ink,
    muted: brandColors.textSecondary,
    border: brandColors.border,
  },
  LIGHT: {
    background: brandColors.backgroundLight,
    text: brandColors.ink,
    muted: brandColors.textSecondary,
    border: brandColors.border,
  },
  SOFT_PURPLE: {
    background: brandColors.softPurple,
    text: brandColors.ink,
    muted: brandColors.textSecondary,
    border: '#E1D6F2',
  },
  SOFT_TEAL: {
    background: brandColors.softTeal,
    text: brandColors.ink,
    muted: brandColors.textSecondary,
    border: '#CBE9E7',
  },
  DARK: {
    background: brandColors.ink,
    text: brandColors.white,
    muted: '#A8B0BF',
    border: 'rgba(255,255,255,0.14)',
  },
  BRAND_GRADIENT: {
    background: brandGradient,
    text: brandColors.white,
    muted: 'rgba(255,255,255,0.82)',
    border: 'rgba(255,255,255,0.22)',
  },
} as const;

export type SectionThemeKey = keyof typeof sectionThemeTokens;

/**
 * Emits every token as a CSS custom property declaration block.
 * Injected once at the document root by each application's global stylesheet.
 */
export function buildCssVariables(): string {
  const lines: string[] = [];
  const push = (name: string, value: string | number) => lines.push(`  --kt-${name}: ${value};`);

  Object.entries(brandColors).forEach(([k, v]) => push(`color-${kebab(k)}`, v));
  Object.entries(semanticColors).forEach(([k, v]) => push(`${kebab(k)}`, v));
  push('gradient-brand', brandGradient);
  Object.entries(spacing).forEach(([k, v]) => push(`space-${k}`, v));
  Object.entries(radius).forEach(([k, v]) => push(`radius-${k}`, v));
  Object.entries(shadows).forEach(([k, v]) => push(`shadow-${k}`, v));
  push('font-sans', typography.fontFamilySans);
  push('font-mono', typography.fontFamilyMono);
  Object.entries(typography.sizes).forEach(([k, v]) => push(`text-${kebab(k)}`, v));
  Object.entries(typography.lineHeights).forEach(([k, v]) => push(`leading-${k}`, v));
  Object.entries(typography.weights).forEach(([k, v]) => push(`weight-${k}`, v));
  Object.entries(typography.measure).forEach(([k, v]) => push(`measure-${k}`, v));
  Object.entries(motion.duration).forEach(([k, v]) => push(`duration-${k}`, v));
  Object.entries(motion.easing).forEach(([k, v]) => push(`ease-${k}`, v));
  Object.entries(layout).forEach(([k, v]) => push(kebab(k), v));
  Object.entries(zIndex).forEach(([k, v]) => push(`z-${kebab(k)}`, v));
  Object.entries(formControls).forEach(([k, v]) => push(`control-${kebab(k)}`, v));

  return `:root {\n${lines.join('\n')}\n}`;
}

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export const designTokens = {
  brandColors,
  brandGradient,
  semanticColors,
  spacing,
  radius,
  shadows,
  typography,
  motion,
  layout,
  breakpoints,
  zIndex,
  formControls,
  sectionThemeTokens,
};
