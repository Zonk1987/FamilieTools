# FamilieTools Design System Rules

These rules are mandatory for all FamilieTools UI work.

Read `DESIGN.md` before creating or substantially modifying application UI.

## Scope Separation

FamilieTools has two visually separate interface scopes:

1. Server Owner Administration
2. Family Application

Never apply Family Application runtime themes to the `/admin` interface.

The admin interface must remain operational even when a custom family theme is
invalid, disabled, or removed.

---

## Design Before Implementation

Before introducing a new visual pattern:

1. Check `DESIGN.md`.
2. Check existing components.
3. Check existing design tokens.
4. Reuse an existing pattern where possible.

Do not invent a new design language for each module.

---

## Avoid Generic AI Styling

Do not automatically generate:

- glassmorphism
- random gradients
- glowing UI
- excessively rounded containers
- every section as an independent card
- giant application headings
- arbitrary decorative metrics
- oversized whitespace
- emoji navigation icons
- mismatched icon sets
- heavy shadows
- unnecessary animations

Visual effects require a functional or clearly intentional design reason.

---

## Theme Architecture

All runtime Family Application theming must use semantic theme tokens.

Examples:

```text
color.primary
color.background
color.surface
color.text
radius.medium
```

Never couple components to named themes.

Bad:

```ts
if (theme === 'dark') {
  // component styling
}
```

Preferred:

```css
background: var(--ft-color-surface);
color: var(--ft-color-text);
```

---

## Theme Security

Theme values are configuration data.

Never execute theme content.

Never allow arbitrary:

- CSS
- HTML
- JavaScript
- script URLs
- style blocks
- event handlers

All values must pass the server-side theme schema before being persisted.

Client-side validation is UX only.

---

## Color Inputs

The Theme Manager may support:

- HEX
- RGB/RGBA
- HSL/HSLA
- OKLCH

Color values must be parsed and validated.

Do not treat arbitrary strings as CSS.

---

## Server Owner Theme Permissions

Only platform-level server-owner administration may:

- create themes
- edit themes
- activate themes
- deactivate themes
- set the default
- import themes
- export themes

Family roles must not automatically receive these capabilities.

Platform-owner authorization is separate from family authorization.

---

## User Theme Preferences

A user may select only from themes currently available to that user.

Users must not provide arbitrary CSS or token values through their profile.

Allowed initial personal preferences:

- approved theme
- color scheme
- density
- reduced motion

---

## Accessibility

All UI work must consider:

- keyboard access
- focus indication
- contrast
- reduced motion
- responsive layout
- non-color-only status indicators

Theme previews and publishing workflows should warn about accessibility
violations.

---

## Admin UX

The admin interface should prioritize operational clarity.

Prefer:

- tables for collections
- clear status indicators
- explicit destructive actions
- useful metadata
- compact information density
- predictable navigation

Avoid turning every admin dataset into decorative dashboard cards.

---

## Component Reuse

Feature modules should consume shared primitives instead of defining isolated
copies of:

- buttons
- inputs
- selects
- checkboxes
- dialogs
- cards
- tables
- badges
- alerts
- navigation
- page headers
- empty states
- loading states

If a shared primitive does not exist, evaluate whether one should be created
before implementing a module-local component.

---

## Design Tokens

Do not hardcode repeat visual values throughout feature components.

Use shared tokens for:

- colors
- spacing
- radii
- typography
- shadows
- motion
- control sizing

Hardcoded values are acceptable only for genuinely component-specific geometry.

---

## Responsive Behavior

Every user-facing screen must be intentionally designed for:

- mobile
- tablet
- desktop

Do not merely hide broken desktop layouts at narrow widths.

Admin navigation may use a responsive drawer or equivalent navigation pattern on
small screens.

---

## Theme Manager

The Theme Manager belongs under:

```text
/admin/themes
```

Theme editing should provide structured controls and live preview.

Do not expose raw CSS editors.

---

## Required Review

Before marking frontend work complete:

- run formatting
- run lint/check
- run component/unit tests where applicable
- verify responsive behavior
- verify keyboard behavior
- verify theme-token usage
- visually compare against existing FamilieTools screens

The implementation is incomplete when it technically works but violates the
established design system.
