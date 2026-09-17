# FamilieTools Design System

## 1. Purpose

FamilieTools is a self-hosted family platform designed for everyday household
use across desktop, tablet, mobile web, PWA, and future native clients.

The interface must feel like a deliberately designed software product rather
than a collection of independently generated pages.

The design system has two distinct scopes:

1. **Platform Administration**
   - Used by the server owner who operates the FamilieTools instance.
   - Stable, functional, information-dense, and intentionally conservative.
   - Must NOT inherit family/user website themes.

2. **Family Application**
   - Used by normal FamilieTools users.
   - Themeable by the server owner.
   - Individual users may select one of the administrator-approved themes from
     their private profile.

---

# 2. Core Design Principles

## 2.1 Product First

UI decisions must primarily serve:

- readability
- discoverability
- accessibility
- information hierarchy
- consistency
- efficient everyday use

Decorative effects must never make common tasks slower or harder to understand.

## 2.2 Avoid Generic AI UI

Do not default to visual patterns commonly produced by generic AI-generated
dashboards.

Avoid:

- excessive glassmorphism
- gradients without a functional purpose
- glowing borders
- excessive blur
- excessive large rounded cards
- every piece of content placed inside a card
- oversized empty hero areas in application screens
- arbitrary accent colors
- emoji used as interface icons
- inconsistent icon families
- decorative statistics with no useful information
- excessive shadows
- unnecessary animations
- randomly changing layout patterns between modules
- giant typography inside administrative interfaces
- one-off CSS values that bypass design tokens

Prefer:

- clear visual hierarchy
- restrained use of surfaces
- consistent spacing
- predictable navigation
- real icon sets
- purposeful color
- reusable components
- dense but readable administrative interfaces
- simple interaction patterns

---

# 3. Platform Administration

The server-owner administration area lives under:

```text
/admin
```

The administration interface is intentionally independent from user-selectable
website themes.

## 3.1 Admin Navigation

Primary sections:

- Dashboard
- Benutzer
- Familien
- Module
- Themes
- System
- Einstellungen

Additional sections may be introduced when platform-level functionality
requires them.

## 3.2 Admin Visual Character

The admin interface should feel:

- professional
- technical
- calm
- trustworthy
- compact
- responsive
- self-hosting oriented

It should resemble a high-quality infrastructure or system-management product,
not a marketing website.

## 3.3 Admin Theme

The administration interface owns a fixed internal design system.

Users and family themes must never alter:

- admin colors
- admin navigation
- admin typography
- admin density
- admin component geometry

A future optional admin dark mode may exist, but it is separate from the
Family Application Theme Manager.

---

# 4. Family Application Theme System

## 4.1 Theme Ownership

Themes are created and managed by the server owner.

Normal users:

- cannot create arbitrary themes
- cannot submit raw CSS
- cannot enter unrestricted CSS rules
- may choose from administrator-approved themes
- may configure limited personal presentation preferences

## 4.2 Theme Lifecycle

A theme can be:

- draft
- active
- inactive
- default

The server owner must be able to:

- create a theme
- edit a theme
- duplicate a theme
- preview a theme
- activate a theme
- deactivate a theme
- set the default theme
- import a theme
- export a theme
- reset a theme to its base preset

Themes should not be permanently deleted while users still reference them
unless migration/fallback behavior is explicitly handled.

If a user's selected theme becomes unavailable, the application automatically
falls back to the current instance default theme.

---

# 5. Design Tokens

Themes must use controlled design tokens.

Application components must NOT directly depend on individual theme names.

Components consume semantic tokens such as:

```css
var(--ft-color-primary)
var(--ft-color-background)
var(--ft-color-surface)
var(--ft-color-text)
```

and never logic such as:

```text
if theme == "dark"
```

unless the behavior cannot reasonably be expressed through semantic tokens.

---

# 6. Color Tokens

Minimum required color tokens:

```text
color.primary
color.primaryHover
color.primaryActive

color.secondary
color.accent

color.background
color.surface
color.surfaceRaised
color.surfaceMuted

color.text
color.textMuted
color.textInverse

color.border
color.borderStrong

color.link
color.focus

color.success
color.warning
color.error
color.info

color.disabledBackground
color.disabledText
```

Optional future tokens may include:

```text
color.navigationBackground
color.navigationText
color.navigationActive
color.overlay
color.selection
```

---

# 7. Supported Color Formats

The Theme Manager should accept common web color formats where practical.

Supported:

```text
#000000
#fff
#00000080

rgb(0 0 0)
rgb(0 0 0 / 50%)

rgba(0, 0, 0, 0.5)

hsl(0 0% 0%)
hsl(0 0% 0% / 50%)

hsla(0, 0%, 0%, 0.5)

oklch(...)
```

The backend must validate color values before storing them.

Arbitrary CSS expressions must not be accepted as color values.

Examples that must be rejected:

```text
url(...)
expression(...)
var(...)
calc(...)
<script>
```

The stored value must represent only the supported color itself.

---

# 8. Geometry Tokens

Supported geometry tokens:

```text
radius.small
radius.medium
radius.large
radius.pill

border.width

control.heightSmall
control.heightMedium
control.heightLarge
```

Suggested ranges should be enforced by the Theme Manager.

Extreme values that make the application unusable should not be allowed.

---

# 9. Spacing and Density

The underlying spacing scale remains controlled by FamilieTools.

Themes may influence presentation only through approved density presets.

Supported user density preferences:

- compact
- comfortable
- spacious

Themes should not provide arbitrary margins/paddings for individual components.

This prevents layout fragmentation between themes.

---

# 10. Typography

Themes may choose from an administrator-approved font list.

Themes may configure:

```text
font.familyBody
font.familyHeading

font.weightNormal
font.weightMedium
font.weightBold

font.scale
```

External remote font dependencies must not be mandatory.

Self-hosted font files are preferred.

System font stacks must remain available as a fallback.

Arbitrary user-provided font URLs must not be supported.

---

# 11. Shadows and Elevation

Supported elevation tokens:

```text
shadow.none
shadow.low
shadow.medium
shadow.high
```

Theme configuration should map to controlled shadow presets where possible.

Avoid unrestricted arbitrary multi-layer shadow CSS.

---

# 12. Motion

Supported motion tokens/preferences:

```text
motion.durationFast
motion.durationNormal
motion.durationSlow
motion.easing
```

Motion must be subtle and functional.

Always respect:

```css
@media (prefers-reduced-motion: reduce);
```

Users may explicitly enable reduced motion in their private profile.

Reduced-motion preferences override theme animation settings.

---

# 13. User Presentation Preferences

Normal users may configure personal presentation settings.

Initial supported preferences:

```text
Theme
Color scheme
Density
Reduced motion
```

## Theme

The user may select only active themes authorized by the server owner.

## Color Scheme

Possible values:

- Theme default
- Light
- Dark
- System

A theme may optionally provide both light and dark variants.

## Density

Possible values:

- Compact
- Comfortable
- Spacious

## Reduced Motion

Boolean preference.

---

# 14. Theme Manager

Admin route:

```text
/admin/themes
```

Expected screens:

```text
/admin/themes
/admin/themes/new
/admin/themes/:themeId
```

The Theme Manager should provide:

- theme list
- active/inactive status
- default-theme indicator
- theme preview
- create
- edit
- duplicate
- activate
- deactivate
- default selection
- import
- export
- reset
- delete where safe

---

# 15. Theme Editor

The editor should use structured sections rather than one large form.

Suggested sections:

```text
General
Colors
Typography
Surfaces
Controls
Navigation
Density
Motion
Accessibility
Preview
```

## General

Fields:

- name
- internal slug
- description
- active
- default

## Colors

Provide:

- text input
- graphical color picker
- current-value preview
- validation state

Changing the visual picker and textual representation must stay synchronized.

Example:

```text
Primary color
[ #2563eb                  ] [color picker]
```

The text field may contain supported HEX/RGB/HSL/OKLCH syntax.

---

# 16. Live Preview

Theme changes should be previewable without permanently saving them.

The Theme Manager should eventually provide viewport previews for:

- desktop
- tablet
- mobile

Preview scenarios should contain real application components:

- navigation
- buttons
- inputs
- cards
- dialogs
- tables
- badges
- alerts
- form controls
- module content

Do not preview only a decorative palette.

---

# 17. Theme Import and Export

Themes should be exportable using a versioned JSON representation.

Example conceptual structure:

```json
{
  "format": "familietools-theme",
  "version": 1,
  "name": "Example Theme",
  "tokens": {
    "color.primary": "#2563eb"
  }
}
```

Imported theme files must be validated against the supported theme schema.

Unknown tokens must not silently receive unrestricted CSS behavior.

Future schema migrations must be possible through the theme format version.

---

# 18. Accessibility

The Theme Manager must help prevent inaccessible themes.

The system should evaluate at least:

- text/background contrast
- muted text/background contrast
- button text/button background contrast
- focus visibility
- destructive action visibility

Where applicable, target WCAG AA contrast requirements.

The Theme Manager should show warnings before publishing a theme with poor
contrast.

Some critical accessibility tokens may eventually enforce minimum thresholds
instead of only showing warnings.

---

# 19. Theme Safety

Theme customization is configuration, not arbitrary code execution.

Never allow themes to contain:

- JavaScript
- HTML
- arbitrary CSS
- external script URLs
- inline event handlers
- executable expressions

Themes consist only of validated supported tokens.

---

# 20. CSS Custom Properties

The Family Application should expose theme tokens through a predictable prefix.

Example:

```css
:root {
  --ft-color-primary: #2563eb;
  --ft-color-primary-hover: #1d4ed8;

  --ft-color-background: #f8fafc;
  --ft-color-surface: #ffffff;

  --ft-color-text: #0f172a;
  --ft-color-text-muted: #64748b;

  --ft-color-border: #e2e8f0;

  --ft-color-success: #15803d;
  --ft-color-warning: #a16207;
  --ft-color-error: #b91c1c;

  --ft-radius-small: 6px;
  --ft-radius-medium: 10px;
  --ft-radius-large: 14px;
}
```

Only the Family Application consumes these runtime theme properties.

The `/admin` UI uses separate admin design tokens.

---

# 21. Built-in Themes

FamilieTools should ship with a small number of high-quality built-in themes.

Suggested initial set:

```text
FamilieTools Light
FamilieTools Dark
Soft Family
High Contrast
```

Built-in themes may be immutable.

The server owner can duplicate a built-in theme and modify the copy.

Avoid shipping many low-quality themes merely to increase the number of
options.

---

# 22. Theme Database Model

The initial domain model should support at least:

```text
themes
- id
- name
- slug
- description
- status
- is_default
- is_system
- created_at
- updated_at
```

Theme token storage may use a validated structured JSON representation.

Conceptually:

```text
theme_configuration
{
  colors: ...
  typography: ...
  geometry: ...
  motion: ...
}
```

User preferences should reference themes by stable theme IDs.

Conceptual model:

```text
user_preferences
- user_id
- theme_id
- color_scheme
- density
- reduced_motion
- updated_at
```

---

# 23. Server-Owner Administration Scope

The initial admin application should eventually expose:

```text
Dashboard
Benutzer
Familien
Module
Themes
System
Einstellungen
```

Potential later additions:

```text
Backups
Updates
Audit Log
Storage
Notifications
Authentication
Integrations
Security
```

---

# 24. Theme Manager Dashboard Information

The theme list should show useful operational information such as:

```text
Theme name
Status
Default
System/custom
Number of users
Last modified
```

Avoid decorative analytics that do not help the administrator.

---

# 25. Responsive Design

Every Family Application component must support:

```text
mobile
tablet
desktop
```

Theme values must never assume one specific viewport.

Theme previews should eventually allow switching viewport dimensions without
saving.

---

# 26. Native Client Compatibility

Future native Android clients cannot depend directly on CSS.

Therefore theme semantics should remain platform-neutral at the domain layer.

Example:

```text
color.primary
color.background
radius.medium
```

instead of:

```text
--some-random-css-variable
```

The Web frontend maps those semantic values to CSS Custom Properties.

A future Android application may map the same values to Compose theme tokens.

---

# 27. Design Review Checklist

Before completing a new UI screen, verify:

- Does it follow the existing navigation model?
- Does it use design tokens?
- Does it avoid one-off styling?
- Is content hierarchy obvious?
- Is the interface usable at mobile widths?
- Is keyboard navigation practical?
- Is focus visible?
- Are controls understandable without color alone?
- Are icons from the approved icon family?
- Are cards used only where grouping is useful?
- Are animations necessary?
- Does the page look like the same product as existing FamilieTools screens?
- Does it avoid generic AI-dashboard visual patterns?

A screen that fails these questions is not finished.

---

# 28. Rule of Consistency

When adding a new module, developers and agents must first reuse:

1. existing design tokens
2. existing layout primitives
3. existing components
4. established interaction patterns

Only create a new visual pattern when the existing system cannot represent the
required interaction cleanly.
