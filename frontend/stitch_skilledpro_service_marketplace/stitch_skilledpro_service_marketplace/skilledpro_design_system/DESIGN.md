---
name: SkilledPro Design System
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
  tertiary: '#372000'
  on-tertiary: '#ffffff'
  tertiary-container: '#553300'
  on-tertiary-container: '#e59300'
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
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is engineered to project unwavering authority and modern efficiency for a high-stakes professional marketplace. The brand personality is grounded in the "Expert Facilitator" archetype—reliable, transparent, and sophisticated. 

The aesthetic direction blends **Corporate Modern** with **Subtle Glassmorphism**. This combination uses the structural integrity of a traditional professional platform but layers in translucent surfaces and soft depth to feel cutting-edge. The goal is to evoke a sense of high-trust security while maintaining the fluid, fast-paced nature of a digital gig economy.

## Colors
The palette is led by **Deep Indigo**, a color chosen to establish immediate institutional authority and "boardroom" seriousness. **Emerald Green** is utilized strategically for "Verified" markers, successful transaction states, and "Open" project statuses, signaling growth and safety.

**Slate Grays** form the structural skeleton of the UI, providing neutral boundaries and secondary text hierarchies without the harshness of pure black. An accent of **Amber (#F59E0B)** is reserved strictly for "In Progress" states and cautionary alerts, ensuring users can scan complex dashboards for urgent items instantly.

## Typography
This design system utilizes a dual-font approach to balance personality with utility. **Manrope** is used for headlines to provide a refined, modern geometric character that feels premium. **Inter** is the workhorse for all body copy, data points, and labels, selected for its exceptional legibility and neutral, systematic tone.

Tight tracking is applied to large headlines to maintain a professional "editorial" look, while body copy maintains standard spacing to ensure readability during long browsing sessions of professional profiles or project briefs.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to ensure content density remains controlled and professional, centered within a 1280px container. A 12-column system is used with generous 24px gutters to prevent information density from feeling overwhelming.

Spacing follows a strict 4px/8px linear scale. Large vertical margins (40px+) are used between sections to emphasize the "clean" aesthetic and provide breathing room for critical data points.

## Elevation & Depth
This design system utilizes a "layered glass" approach. Depth is communicated through three specific tiers:

1.  **Base Layer:** The light slate background (#F8FAFC), representing the floor of the application.
2.  **Surface Layer (Cards):** Pure white surfaces with a very soft, highly diffused 15% opacity Indigo shadow (Y: 4px, Blur: 20px). These hold primary content.
3.  **Glass Layer (Overlays/Navigation):** Semi-transparent white (80% opacity) with a 20px backdrop blur and a 1px white inner border. This creates a sense of sophistication and transparency in the platform's operations.

## Shapes
A **Rounded (0.5rem)** strategy is applied to balance approachability with professional structure. While sharp corners feel too aggressive and pill-shapes feel too casual/mobile-first, the 8px (0.5rem) radius provides a modern, "App-like" feel that fits within the SaaS and Marketplace sector. Larger cards use 1rem (16px) to emphasize their container status.

## Components

### Buttons
Buttons are large and "tap-friendly" (minimum 48px height). The Primary button uses the Deep Indigo background with white text. Secondary buttons utilize a ghost style with a 1px Slate border. Success actions (e.g., "Hire Now") may use the Emerald Green to signify a positive progression.

### Status-Aware Badges
Badges use a "soft-fill" style: a high-saturation text color on a low-opacity background of the same hue.
- **Open:** Emerald Green text on 10% Emerald background.
- **In Progress:** Amber text on 10% Amber background.
- **Completed:** Slate Gray text on 10% Slate background.

### Profile Strength Meters
A custom horizontal meter using a segmented bar approach. As the profile completion increases, the segments transition from Slate to Emerald Green, providing visual dopamine and a clear "Success" path for the user.

### Structured Cards
Cards must always include a subtle 1px border (#E2E8F0) in addition to their soft shadows to maintain definition on high-brightness displays. Header areas within cards are separated by a subtle horizontal rule to organize metadata effectively.

### Input Fields
Inputs use a white background with a 1px Slate-200 border. On focus, the border transitions to Deep Indigo with a soft 4px Indigo glow to signal active engagement.