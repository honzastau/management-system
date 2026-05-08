---
name: Management System
description: Personal business management — clients, orders, invoices, time, expenses.
colors:
  surface-void: "#09090f"
  surface-base: "#0b0b14"
  surface-raised: "#0f1118"
  surface-input: "#13151f"
  border-default: "#1a1f2e"
  text-primary: "#e2e8f0"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  text-label: "#475569"
  accent: "#f59e0b"
  accent-deep: "#d97706"
  success: "#10b981"
  success-bg: "#062016"
  success-border: "#0d3a25"
  error: "#ef4444"
  error-bg: "#2d0a0a"
  error-border: "#3f1515"
  info: "#3b82f6"
  time: "#8b5cf6"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.07em"
  mono:
    fontFamily: "'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "20px"
spacing:
  xs: "8px"
  sm: "13px"
  md: "20px"
  lg: "28px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface-void}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.surface-void}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-ghost:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-ghost-hover:
    backgroundColor: "{colors.border-default}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-danger:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  input:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.md}"
    padding: "20px"
  modal:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "28px"
---

# Design System: Management System

## 1. Overview

**Creative North Star: "The Control Room"**

The Management System is an operator's tool, not a product showcase. Every screen opens to its essentials — the overview surfaces what matters right now, the modules hold the full picture. The interface is dark, precise, and unhurried. The surface reads like a room where the lights are intentionally low so the data can glow.

Density is controlled but never cramped. Labels are small and uppercase. Numbers are large and monospaced. The hierarchy is clear without being loud. There is no onboarding flow, no empty-state illustration, no celebration animation when a record is saved. The tool assumes competence and respects the user's time.

This system explicitly rejects the SaaS dashboard reflex: no hero metrics with gradient accents, no pastel card grids, no startup-cute illustrations, no Dribbble-template aesthetics. Darkness here is functional, not atmospheric.

**Key Characteristics:**
- Dark tonal layering across four surface levels, no shadows
- Single amber accent used as a signal, not decoration
- Monospaced font for every numeric value
- Uppercase, tight-tracked labels; never decorative heading chrome
- Gently rounded corners (10px inputs, 14px cards), never sharp, never pill-shaped
- Transitions at 150ms; state changes only, no choreography

## 2. Colors: The Low-Light Palette

A restrained strategy: four dark surface layers occupy 85%+ of every screen. Amber is the single voice. Four semantic colors each own exactly one role and are never borrowed.

### Primary
- **Operator Amber** (`#f59e0b`): The primary accent. Active navigation state, all monetary amounts, primary action buttons, progress fills, and focus glows. Hover deepens to `#d97706`. This color answers two questions and nothing else: "where am I?" and "what has monetary value?"

### Secondary
- **Deep Amber** (`#d97706`): Amber hover state only. Not used independently anywhere in the interface.

### Neutral
- **Void** (`#09090f`): The canvas. Body background, boot screen, timer bar backdrop.
- **Base** (`#0b0b14`): Sidebar. One step lighter than void; establishes the navigation plane.
- **Raised** (`#0f1118`): Cards, modals, setup box. The primary content surface.
- **Input** (`#13151f`): Form fields, hover states, table row hover. Visually distinguishes interactive surfaces from static ones.
- **Border** (`#1a1f2e`): All dividers, borders, and progress track backgrounds. Never used as fill.
- **Text Primary** (`#e2e8f0`): All body copy, headings, interactive labels.
- **Text Secondary** (`#94a3b8`): Ghost button text, metadata, supporting details.
- **Text Muted** (`#64748b`): Navigation items (inactive), placeholder text, secondary metadata.
- **Text Label** (`#475569`): Uppercase section labels, table headers, form field labels.

### Semantic (locked roles)
- **Success Green** (`#10b981`): Paid invoices, completed orders, success toasts, positive states. Background: `#062016`. Border: `#0d3a25`.
- **Error Red** (`#ef4444`): Overdue, danger actions, error states, delete buttons. Background: `#2d0a0a`. Border: `#3f1515`.
- **Client Blue** (`#3b82f6`): Client count stat card. Info toasts.
- **Time Purple** (`#8b5cf6`): Time tracking stat card and duration displays.

### Named Rules
**The One Signal Rule.** Amber appears on no more than 15% of any screen. Its rarity is the signal. When everything is amber, nothing is.

**The Semantic Lock Rule.** Green is paid/success. Red is overdue/danger. Blue is clients. Purple is time. These are not decorative assignments. Using green for anything other than a success state, or red for anything other than danger, breaks the operator's reading of the interface at a glance.

## 3. Typography

**Body Font:** System UI stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`)
**Mono Font:** `'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace`

**Character:** No web fonts loaded. The system inherits the OS's native sans-serif. This is a deliberate choice: this is a tool, not a brand expression. The mono stack carries all numeric weight; the distinction between prose and numbers is typographic, not just visual.

### Hierarchy
- **Display** (800 weight, 28px, line-height 1.1, -0.04em tracking): Page titles. Used once per view, at the top. "Přehled", "Klienti", "Zakázky".
- **Headline** (800 weight, 22px, line-height 1.2, -0.03em tracking): Section titles within a view, modal headings, large numeric totals when displayed as text.
- **Title** (700 weight, 15px, line-height 1.3): Card headings, order names, client names in lists.
- **Body** (400 weight, 13px, line-height 1.5): All descriptive text, form help text, metadata rows.
- **Label** (700 weight, 11px, line-height 1, 0.07em tracking, uppercase): Section labels, form field labels, table column headers, navigation badges. Always uppercase, always tracked.
- **Mono** (400 weight, 13px, line-height 1.5): Every currency amount, duration, count, invoice number, date in data tables. The mono stack is the data voice.

### Named Rules
**The Mono Rule.** Every numeric value uses the mono stack. Amounts, durations, counts, dates in tables. Never body font for numbers. The distinction is semantic: prose is context, mono is fact.

**The Label Rule.** Labels are uppercase and tracked at 0.07em. Never title-case for secondary chrome. The small, quiet label is how the system communicates structure without competing with the data it labels.

## 4. Elevation

The system is flat by architecture. No `box-shadow` is used for elevation anywhere. Depth is communicated entirely through the four surface colors: Void → Base → Raised → Input. A card is "above" the page not because it has a shadow but because `#0f1118` is visually lighter than the `#09090f` canvas behind it.

Borders (`#1a1f2e`) mark separation where tonal contrast alone is insufficient — input fields on card backgrounds, sidebar against the main content area.

### Named Rules
**The Shadow Ban Rule.** No `box-shadow` for elevation. The single permitted glow is the focus ring: `border-color: #f59e0b55` on focused inputs. This is a state signal, not decoration.

**The Backdrop Rule.** Modals and overlays use `backdrop-filter: blur(6–10px)` over a `#000000 88–99%` scrim. This is the only permitted blur in the system. It signals a blocking layer, not aesthetic texture.

## 5. Components

### Buttons

Compact and immediate. Font-size 13px, font-weight 600. All variants share 10px border-radius and 150ms transition. No loading spinners inline; the sync indicator (`#sync`) handles system-level feedback globally.

- **Primary** (`.bp`): `#f59e0b` background, `#09090f` text. Hover: `#d97706`. Used for the single most important action on a form or screen.
- **Ghost** (`.bg`): `#13151f` background, `#94a3b8` text, `1px solid #1a1f2e` border. Hover brightens border and text to `#e2e8f0`. Default for secondary actions, navigation CTAs, "back" buttons.
- **Danger** (`.bd`): `#2d0a0a` background, `#f87171` text, `1px solid #3f1515` border. Delete and destructive actions only.
- **Success** (`.bs`): `#062016` background, `#34d399` text, `1px solid #0d3a25` border. Confirmatory actions: "Start timer", "Mark paid".
- **Small variant** (`.btn-sm`): 5px/11px padding, 12px font-size. Used inside cards, table rows, and data-dense contexts.

### Inputs / Fields

- **Style:** `#13151f` background, `1px solid #1a1f2e` border, 10px radius, 10px/14px padding, 13px body font.
- **Focus:** Border shifts to `#f59e0b55` (amber at 33% opacity). No outline, no glow beyond the border change.
- **Labels:** Always the `.lbl` class — 11px, 700 weight, uppercase, 0.07em tracking, `#475569` color. Always above the input, never inside as placeholder-only.
- **Placeholder text:** For guidance only, never as a substitute for a label.

### Cards / Containers

- **Corner style:** 14px radius (`.card`). Consistent across all data cards.
- **Background:** `#0f1118` (Raised surface).
- **Border:** `1px solid #1a1f2e`.
- **Internal padding:** 20px uniform.
- **Shadow strategy:** None. Elevation through surface color.
- **Stat cards** (`.sc`): Same shape, hover state lifts border to `#f59e0b44`. Used for dashboard summary numbers.

### Navigation

- **Sidebar:** 220px fixed width, `#0b0b14` background, items at 14px/500 weight.
- **Inactive state:** `#64748b` text, transparent background.
- **Hover state:** `#13151f` background, `#cbd5e1` text.
- **Active state:** `#151720` background, `#f59e0b` amber text. The amber here is the primary wayfinding signal.
- **Badges:** `#1a1f2e` background, `#64748b` text, 10px font, 6px radius. Count-only, no labels.
- **Mobile:** Sidebar slides in from left at 250px width; hamburger button (42px, 10px radius) at top-left.

### Progress Bar

- **Track:** 3px height, `#1a1f2e` background, 2px radius.
- **Fill:** Amber (`#f59e0b`) by default; shifts to `#ef4444` when fill exceeds 85% (deadline pressure signal).
- **Usage:** Order completion progress within deadline span. Not for loading states.

### Toast Notifications

Three semantic variants, each matching the semantic color system:
- **Success:** `#062016` background, `#34d399` text, `#0d3a25` border.
- **Error:** `#2d0a0a` background, `#f87171` text, `#3f1515` border.
- **Info:** `#0c1a3d` background, `#60a5fa` text, `#1e3a5f` border.

Toasts appear at top-right, slide in on `transform: translateX`, disappear after 3s. No stacking beyond what fits the viewport.

## 6. Do's and Don'ts

### Do:
- **Do** use `#f59e0b` exclusively for monetary values, the active nav item, primary buttons, and active progress. These are its only valid contexts.
- **Do** use the mono stack (`SFMono-Regular`, etc.) for every number: amounts, durations, dates in tables, invoice numbers.
- **Do** write all secondary labels and section headers in uppercase with 0.07em letter-spacing at 11px/700.
- **Do** use the four-layer surface system (void/base/raised/input) to establish depth without shadows.
- **Do** keep transitions at 150ms with `ease` or equivalent. State changes only.
- **Do** use ghost buttons (`.bg`) as the default for any action that is not the primary CTA on a screen.
- **Do** keep the overview module minimal: essential aggregates and a short list. Detail belongs in the individual modules.
- **Do** size touch targets at 44px minimum height on all interactive elements for mobile use.

### Don't:
- **Don't** use `box-shadow` for elevation. The tonal surface system handles depth entirely.
- **Don't** use amber for anything other than monetary values, active states, and primary actions. No decorative amber borders, no amber headings, no amber icons for non-financial concepts.
- **Don't** break the semantic color locks: green is success/paid, red is danger/overdue, blue is clients, purple is time. Never swap or reuse these outside their role.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards or list items. Use full borders, background tints, or nothing.
- **Don't** use gradient text (`background-clip: text`). Single solid colors only.
- **Don't** add glassmorphism effects outside of modal/overlay backdrops. Blur as texture is prohibited.
- **Don't** replicate SaaS dashboard clichés: hero metrics with gradient accents, identical icon-heading-text card grids, pastel color palettes, large illustrations in empty states.
- **Don't** add onboarding animations, skeleton screens with motion, or any animation that plays automatically when a view loads. The interface is already familiar to its sole user.
- **Don't** use placeholder text as a substitute for a visible label on form inputs.
- **Don't** exceed the four established surface colors for backgrounds. No new dark shades invented ad hoc.
