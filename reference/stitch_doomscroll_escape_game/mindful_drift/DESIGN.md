---
name: Mindful Drift
colors:
  surface: '#fff8f5'
  surface-dim: '#e2d8d2'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2eb'
  surface-container: '#f6ece6'
  surface-container-high: '#f0e6e0'
  surface-container-highest: '#eae1da'
  on-surface: '#1f1b17'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#342f2b'
  inverse-on-surface: '#f9efe8'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#bc0b3b'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff7886'
  on-tertiary-container: '#780021'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#fff8f5'
  on-background: '#1f1b17'
  surface-variant: '#eae1da'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1.25rem
  margin-sm: 1rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system powers a modern mobile hybrid scavenger game experience that balances active real-world engagement with ambient digital calm. Designed to counter addictive, hyper-stimulating feed mechanics, the interface projects an airy, restorative, and tactfully gameful environment. It blends soft Scandinavian minimalism with modern mobile game ergonomics: generous breathing room, calm focus zones, and tactile, friendly elements.

The emotional signature is calming, clear, and reassuring—transforming screen time into a deliberate compass rather than an endless loop. Visual aesthetics prioritize gentle tactile feedback, softly pillowed cards, muted pastel signaling, and ultra-crisp typographic hierarchy.

## Colors
The palette is rooted in warm eggshell neutrals and soft mineral pastels, intentionally stepping away from high-contrast neon gaming tropes to soothe cognitive load:

- **Canvas & Backgrounds:** Base canvas sits at warm eggshell `#FAFAF9` (Stone 50), elevated by pristine pure white surfaces (`#FFFFFF`) for interactable cards and modal sheets.
- **Primary (Sage Mint):** Driven by `#10B981` with pastel highlight layers at `#34D399` and tinted wash grounds (`#ECFDF5`). Used for positive reinforcement, completed mission nodes, progress indicators, and affirmative CTAs.
- **Secondary (Subtle Lavender):** Anchored by muted soft violet `#8B5CF6` with a tranquil pastel aura (`#EDE9FE`). Serves as the marker for sensory discovery, location whispers, and narrative logs.
- **Tertiary (Warm Coral):** Anchored by muted coral `#F43F5E` paired with `#FFE4E6` tint layers for alerts, focus timers, and urgent field objectives.
- **Neutrals:** Soft stone shades spanning dark slate charcoal `#1C1917` for crisp text, `#78716C` for secondary captions, and `#E7E5E4` for subtle hairline borders.

## Typography
The typographic architecture pairs the friendly, humanist geometric geometry of Plus Jakarta Sans for titles and dynamic badges with the clinical, high-legibility precision of Inter for navigational instructions, objectives, and body copy.

All mobile display scales feature snug line heights and slight negative tracking (`-0.01em` to `-0.02em`) to maintain editorial punch on smaller screens without visual clutter. Numerical data, coordinate strings, and game countdown timers benefit from tabular figures (`tnum`) in Inter.

## Layout & Spacing
Built for a mobile-first native viewport using a fluid columnar framework with flexible safe-area margins:

- **Grid Model:** Fluid 4-column layout on portrait mobile screens with `1.25rem` screen margins and `1rem` gutters. Expands to 8 columns on tablet devices (`margin-lg: 2rem`).
- **Component Padding & Gaps:** Follows a strict 4px/8px modular rhythm using `space-xs` through `space-xl`.
- **Field Ergonomics:** Primary operational hubs, compass dials, and clue cards are anchored within the thumb-accessible bottom two-thirds of the viewport, maintaining minimum 48px touch targets for rapid single-handed play.

## Elevation & Depth
Elevation eschews dense, high-contrast drop shadows in favor of ambient multi-stop diffusion and delicate low-contrast structural borders:

- **Level 0 (Floor):** Solid `#FAFAF9` canvas without borders or cast shadows.
- **Level 1 (Resting Tiles & Cards):** `#FFFFFF` surfaces with a micro hairline border of `1px solid rgba(231, 229, 228, 0.7)` and an airy shadow: `0 4px 20px -2px rgba(120, 113, 108, 0.06), 0 2px 6px -1px rgba(120, 113, 108, 0.04)`.
- **Level 2 (Floating Action Panels & Sheets):** Backdrop-filtered floating white sheets (`rgba(255, 255, 255, 0.94)`, 12px blur) with `0 12px 32px -4px rgba(120, 113, 108, 0.10)`.
- **Level 3 (Modal Alerts & Clue Reveal Overlays):** Deep ambient diffusion `0 24px 48px -8px rgba(28, 25, 23, 0.12)` layered above a soft warm backdrop wash of `rgba(28, 25, 23, 0.25)`.

## Shapes
A pillowy, inviting shape language defined by pill-shaped geometries and hyper-rounded radii (Level 3):

- **Interactive Primary Elements:** Buttons, search pills, and active status tags use full capsules (`rounded-full`).
- **Surface Enclosures:** Cards and modal panels deploy `rounded-2xl` (1.5rem) and `rounded-3xl` (2rem) corner radii, eliminating aggressive vertices to reinforce safety and friendly tactile usability.
- **Interior Insets:** Progress tracks, badge containers, and clue imagery frames adapt proportional rounding at `1rem` (`rounded-lg`) to maintain concentric alignment with parent containers.

## Components
- **Buttons:**
  - *Primary:* Pill-shaped, `#10B981` sage background, pure white bold text, subtle inner top glow (`inset 0 1px 0 rgba(255, 255, 255, 0.3)`), scaling down 2% (`scale(0.98)`) on press with soft haptic timing.
  - *Secondary / Ghost:* Crisp white or tinted pastel surface (`#EDE9FE` for lavender or `#ECFDF5` for sage) with matching saturated foreground text and a 1px matching tinted outline.
- **Chips & Status Tags:**
  - Compact pill forms (`rounded-full`), `space-xs` vertical padding, `space-sm` horizontal padding. Pastel fill paired with dark complementary text (e.g., Lavender tint `#EDE9FE` with deep violet `#6D28D9` for clue discovery statuses).
- **Cards & Quest Sheets:**
  - Generous `rounded-3xl` corners, pure white background, hairline `#E7E5E4` perimeter stroke. Interior padding defaults to `space-lg`. Media or compass viewports inside cards retain nested `rounded-2xl` forms.
- **Input Fields:**
  - High-comfort pill text inputs with warm off-white fill (`#F5F5F4`), subtle inset shadow, and clear sage-focus ring (`2px solid #34D399`). Trailing discovery icons or clear triggers remain within the rounded envelope.
- **Checkboxes & Mission Toggles:**
  - Generous rounded squares (`rounded-lg`) or circular checkboxes (`rounded-full`), smooth animated scale-and-fill transition to `#10B981` featuring a crisp white SVG check icon.
- **Game-Specific Components (Radar / Clue Compass):**
  - Ambient radial sweeps with pastel sage and lavender rings, soft pulse keyframes using gentle opacity shifts, and high-legibility proximity tags positioned cleanly outside active touch zones.