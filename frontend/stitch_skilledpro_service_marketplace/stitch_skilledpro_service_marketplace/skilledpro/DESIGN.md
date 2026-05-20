---
name: SkilledPro
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777e'
  outline-variant: '#c6c6ce'
  surface-tint: '#525e7f'
  primary: '#182442'
  on-primary: '#ffffff'
  primary-container: '#2e3a59'
  on-primary-container: '#98a4c9'
  inverse-primary: '#bac6ec'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#312300'
  on-tertiary: '#ffffff'
  tertiary-container: '#4a380c'
  on-tertiary-container: '#bca26c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#bac6ec'
  on-primary-fixed: '#0d1a38'
  on-primary-fixed-variant: '#3a4666'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#fddfa4'
  tertiary-fixed-dim: '#dfc38b'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#574417'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  h2:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  h3:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  container-max: 1280px
---

## Brand & Style

The design system is engineered to project unwavering competence and high-tier professionalism. The visual language balances institutional stability with modern agility, catering to a target audience of high-value service providers and discerning clients. 

The aesthetic is categorized as **Corporate Modern with Glassmorphism**. It utilizes a structured hierarchy to instill trust while employing contemporary translucency for overlays to maintain a sense of lightness and technical sophistication. Every interaction is designed to feel deliberate, secure, and precise, avoiding any unnecessary decorative elements that could detract from the brand's authoritative voice.

## Colors

The color palette is anchored by a deep Slate Blue, which serves as the foundation for all primary actions and structural elements. This choice communicates maturity and intelligence. To signify achievement and verification, a vibrant Emerald Green is used, providing a high-contrast signal of success that feels fresh rather than institutional.

Neutral tones are strictly derived from slate and cool gray scales to maintain a cohesive environment. Purple tones are strictly prohibited; any secondary accents must remain within the cool blue or neutral spectrum to avoid compromising the professional integrity of the interface.

## Typography

This design system utilizes **Manrope** across all instances to ensure a clean, geometric, yet highly legible experience. The typeface's open counters and modern proportions support the brand’s accessible-professionalism narrative.

Headlines use tighter tracking and heavier weights to anchor pages with authority. Body text maintains a generous line height to ensure readability in information-dense professional profiles or service descriptions. Capitalized labels are used sparingly for metadata to provide visual distinction without adding weight.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** system to provide a sense of order and reliability. A 12-column grid is used for desktop layouts, with a standard 24px gutter to ensure sufficient negative space between functional blocks.

A strict 8px spatial rhythm governs all padding and margins. This modularity ensures that components align perfectly, reinforcing the "precision" aspect of the professional services brand. Whitespace should be used intentionally to separate content clusters, favoring "airy" layouts that prevent cognitive overload.

## Elevation & Depth

Visual hierarchy in this design system is established through **Tonal Layers** and **Subtle Shadows**. Elements that sit directly on the background use a fine 1px border (#E2E8F0) to define their boundaries.

For overlays, modals, and dropdown menus, the design system employs **Glassmorphism**. These elements feature a semi-transparent white background with a 12px backdrop blur, creating a sense of depth and focus without disconnecting the user from the underlying context. Shadows are highly diffused (low opacity, large blur radius) and tinted with the primary Slate Blue to ensure they feel like natural extensions of the UI rather than "dirty" gray drops.

## Shapes

The shape language is defined by a consistent **8px corner radius (roundedness level 2)**. This specific radius is soft enough to feel approachable and modern, yet sharp enough to maintain a business-like discipline.

This 8px rule applies to buttons, input fields, cards, and image containers. For smaller elements like tags or badges, the radius may scale down to 4px to maintain visual proportion, but "pill-shaped" or "sharp" corners are generally avoided to keep the system cohesive.

## Components

### Buttons
Primary buttons use the Slate Blue background with white text. Success actions or "Verified" CTAs utilize the Emerald Green. All buttons have an 8px radius and a subtle bottom-heavy shadow to indicate affordance.

### Input Fields
Inputs feature a light gray background (#F1F5F9) and a 1px border that shifts to Slate Blue on focus. Error states use a professional crimson (no purple tones) while success states use Emerald Green.

### Cards
Cards are the primary container for professional profiles. They should feature a white background, a subtle 1px border, and a soft ambient shadow that intensifies slightly on hover.

### Glass Overlays
Modals and popovers must use the glassmorphism treatment: `background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3);`.

### Verified Badges
A signature component for this system is the "Verified Pro" badge. It consists of a small Emerald Green shield or checkmark icon with a light green tinted background (10% opacity) to signify trust and high-tier status.