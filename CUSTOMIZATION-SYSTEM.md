# FamilieTools Customization System

## Status
Normative architecture for layouts, widgets, navigation customization, presets, themes, and user personalization.

## Goal
Customization is a **Core platform capability**.

Server Owners SHOULD be able to control presentation and layout without enabling unsafe arbitrary code.

Supported goals:
```text
drag and drop
widget reordering
widget resizing
show/hide
navigation ordering
quick-action ordering
responsive layouts
layout presets
family defaults
user personalization
```

## Customization hierarchy
```text
Core defaults
      ↓
Server Owner defaults
      ↓
Family configuration
      ↓
User preferences
```

Lower layers override only what higher policy allows.

Each layer SHOULD support reset-to-parent.

## Theme vs Layout
Theme controls appearance:
```text
colors
typography
semantic spacing
radii
shadows
light/dark variants
density
```

Layout controls structure:
```text
widget placement
widget size
visibility
navigation order
quick actions
dashboard composition
```

Themes and layouts remain independent.

## Core-owned Layout Engine
Core owns:
- drag/drop behavior
- accessible keyboard alternatives
- resizing
- visibility
- responsive adaptation
- validation
- persistence
- authorization
- inheritance

Modules provide contributions, not global layout control.

## Widget Registry
Core maintains a central Widget Registry.

Example:
```json
{
  "id": "com.familietools.calendar.upcoming",
  "moduleId": "com.familietools.calendar",
  "name": "Upcoming Events",
  "areas": ["dashboard", "family-home"],
  "sizes": ["small", "medium", "large"],
  "defaultSize": "medium",
  "canHide": true,
  "canResize": true
}
```

Recommended metadata:
```text
widget id
module id
name
description
supported areas
supported sizes
min/max size
default size
canHide
canResize
required capabilities
configuration schema
```

## Widget security
A widget inherits its module permissions.

Placement never grants new access.

A failing widget MUST NOT break the whole page.

Core SHOULD provide loading states, timeouts, refresh behavior, and error boundaries.

## Layout areas
Initial areas:
```text
dashboard
family-home
home
navigation
quick-actions
header
```

## Server Owner editor
Server Owner SHOULD be able to:
```text
drag
reorder
resize
hide
show
reset
save preset
apply preset
```

Drag/drop MUST NOT be the only interaction method.

Accessible alternatives:
```text
Move up
Move down
Move left
Move right
Change size
Move to section
Hide
Show
```

## Visibility policy
Contribution states:
```text
optional
visible-by-default
mandatory
disabled
```

Mandatory Core items cannot be hidden by lower layers.

## Responsive layouts
Core MUST support:
```text
desktop
tablet
mobile
```

Prefer grid/constraint layouts over raw pixel coordinates.

## Layout data
Example:
```json
{
  "schemaVersion": 1,
  "area": "dashboard",
  "breakpoint": "desktop",
  "items": [
    {
      "widgetId": "com.familietools.calendar.upcoming",
      "x": 0,
      "y": 0,
      "width": 8,
      "height": 2,
      "visible": true
    }
  ]
}
```

Layouts MUST be validated.

## No arbitrary executable layout content
Forbidden:
```text
script tags
inline JavaScript
raw executable templates
unrestricted CSS
remote executable references
```

Core renders known contribution types only.

## Navigation and Quick Actions
Server Owner SHOULD be able to reorder/hide optional navigation entries.

Modules may contribute quick actions, but all actions still pass authorization.

## Layout presets
Presets may contain:
```text
widget placement
visibility
sizes
navigation order
quick actions
responsive variants
```

Examples:
```text
Default
Compact
Tablet Wall Display
Minimal
Family Dashboard
```

Export/import SHOULD be supported later with schema validation.

## Store-distributed presets
Layout presets may be published through the Store.

They are declarative only and may declare module/widget dependencies.

Missing dependencies must be handled gracefully.

## Family and user personalization
Example:
```text
Server allows Calendar, Shopping, Photos
Family enables Calendar and Photos
User places Calendar above Photos
```

Server restrictions remain authoritative.

## Module contributions
The module manifest SHOULD include:
```json
{
  "contributions": {
    "widgets": [],
    "navigation": [],
    "routes": [],
    "settings": [],
    "quickActions": []
  }
}
```

All contribution types are versioned and Core-validated.

## Widget configuration
Widget settings SHOULD use schema-driven Core UI.

Modules MUST NOT inject arbitrary settings UI without an approved extension mechanism.

## Persistence
Core SHOULD distinguish:
```text
server_default_layouts
family_layouts
user_layouts
layout_presets
```

All records require schema/version metadata and migration support.

## Community themes
Community themes may be Store artifacts but SHOULD consist only of validated semantic tokens.

They MUST NOT execute JavaScript.

## Stable admin theme
The Server Administration UI MAY keep a stable admin theme independent from family/community themes to preserve a reliable recovery surface.

## Native compatibility
Android and future iOS clients SHOULD share semantic:
```text
widget identity
order
visibility
size class
configuration
theme tokens
```

Exact web coordinates do not need to map 1:1.

## Reference widgets
Calendar:
```text
Upcoming Events
Today's Schedule
Mini Calendar
Next Birthday
```

Shopping:
```text
Open Shopping Items
Shopping List
Recently Added
```

These are used to prove layout, permissions, family context, resize, configuration, update, and uninstall behavior.

## Audit and backup
Security-sensitive customization actions SHOULD be auditable.

Backup/restore includes:
```text
server layouts
family layouts
user layouts
theme selections
layout presets
widget configuration
```

## Implementation order
```text
1. Define contribution schema
2. Define Widget Registry
3. Define layout schema
4. Add Core dashboard layout storage
5. Add drag/reorder editor
6. Add accessible move controls
7. Add hide/show
8. Add resize rules
9. Add responsive variants
10. Add module widget registration
11. Add family/user inheritance
12. Add layout presets
13. Add Store-distributed presets
14. Add community theme package schema
```

## Architectural decision
Themes control appearance.

Layouts control placement and visibility.

Modules provide validated contributions.

Core owns rendering, authorization, persistence, accessibility, responsive behavior, and security.
