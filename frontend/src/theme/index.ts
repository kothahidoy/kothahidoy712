// Mfixit Premium Theme — Deep Indigo & Orange accent palette
// Design System for high-converting home services app

export const colors = {
  // Primary (Deep Indigo - Trust)
  primary: "#1E3A8A",
  primaryDark: "#1E40AF",
  primaryLight: "#DBEAFE",
  primaryForeground: "#FFFFFF",

  // Accent (Orange - CTA emphasis)
  accent: "#F97316",
  accentDark: "#EA580C",
  accentLight: "#FFF7ED",
  accentForeground: "#FFFFFF",

  // Backgrounds
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  // Secondary
  secondary: "#EFF6FF",
  secondaryForeground: "#1E40AF",

  // Text
  textMain: "#0F172A",
  textBody: "#334155",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",

  // Borders
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",

  // Status colors
  success: "#16A34A",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",

  // Special
  star: "#F59E0B",
  overlay: "rgba(15, 23, 42, 0.55)",
  
  // Trust badges
  verified: "#059669",
  verifiedLight: "#D1FAE5",
};

// 8pt grid spacing system
export const spacing = {
  xs: 4,   // 4px
  sm: 8,   // 8px
  md: 12,  // 12px
  lg: 16,  // 16px
  xl: 24,  // 24px
  xxl: 32, // 32px
  xxxl: 40, // 40px
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

// Typography scale with clear hierarchy
export const typography = {
  // Headings
  h1: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "700" as const, letterSpacing: -0.2, lineHeight: 24 },
  h4: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  
  // Body
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: "500" as const, lineHeight: 22 },
  bodySemibold: { fontSize: 15, fontWeight: "600" as const, lineHeight: 22 },
  
  // Small
  small: { fontSize: 13, fontWeight: "500" as const, lineHeight: 18 },
  smallBold: { fontSize: 13, fontWeight: "700" as const, lineHeight: 18 },
  
  // Tiny
  tiny: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.3, lineHeight: 14 },
  tinyBold: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.5, lineHeight: 14 },
  
  // Labels
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.2, lineHeight: 16 },
  labelBold: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.3, lineHeight: 16 },
};

export const shadow = {
  // Subtle card shadow
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  // Medium elevation
  cardHover: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  // Floating elements
  floating: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  // Bottom navigation
  bottomNav: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 8,
  },
  // Sticky CTA button
  stickyCta: {
    shadowColor: "#F97316",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
};
