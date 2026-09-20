# FamilieTools Module System

## Status
Normative architecture for FamilieTools feature modules.

## Core principle
A fresh FamilieTools installation contains **zero feature modules**. Authentication, users, families, memberships, permissions, settings, themes, customization/layout infrastructure, module infrastructure, storage abstraction, audit, jobs, diagnostics, backup/restore, and Core update support belong to the Core.

Official and third-party feature modules use the same package/runtime architecture.

## Package model
Modules use `.ftmodule` packages with a validated `manifest.json`. Published versions are immutable and use Semantic Versioning.

The manifest MUST describe:
- globally unique module identity
- version and platform compatibility
- Module API version
- publisher identity
- requested capabilities
- dependencies
- network requirements
- entry points
- migrations
- UI contributions

## Security model
Default policy is deny-by-default.

Third-party modules MUST NOT receive unrestricted access to:
- NestJS/Core internals
- PostgreSQL credentials
- Core tables
- another module's tables
- another family's data
- host filesystem
- Docker socket
- environment/platform secrets
- unrestricted network access

Modules use a controlled, versioned Module Runtime API.

## Capability examples
```text
family.identity.read
module.storage.read
module.storage.write
notifications.send
files.family.read
calendar.events.read
calendar.events.write
```

New permissions introduced by an update MUST require review before an automatic update can continue.

## Runtime isolation
Third-party backend/runtime code MUST NOT execute unrestricted inside the Core process.

Target boundary:
```text
FamilieTools Core
        │
        │ controlled Module API
        │
        ├── Module Runtime A
        ├── Module Runtime B
        └── Module Runtime C
```

The exact isolation technology remains an implementation decision.

## Module-owned data
Each module owns an explicit data namespace. Modules MUST NOT directly query other module data. Cross-module access goes through documented APIs/capabilities.

## Installation sources
```text
official
verified
community
local
url
```

Unsigned local development packages MAY be supported but MUST be disabled by default in production.

## Integrity and signing
Published packages require SHA-256 integrity metadata and trusted signing/attestation. Invalid required signatures or hashes abort installation.

## Install / update / uninstall
The installer validates:
- manifest/schema
- compatibility
- dependencies
- capabilities
- package hash
- signature/attestation
- migrations

UI terminology should use **Uninstall module**, not Delete module.

Safe uninstall default:
```text
Keep module data
```

## Module contributions
The module manifest MUST support validated UI contributions.

Initial contribution categories:
```text
widgets
navigation
routes
settings
quickActions
```

Example:
```json
{
  "contributions": {
    "widgets": [
      {
        "id": "com.familietools.calendar.upcoming",
        "name": "Upcoming Events",
        "area": "dashboard",
        "sizes": ["small", "medium", "large"],
        "defaultSize": "medium",
        "canHide": true,
        "canResize": true
      }
    ]
  }
}
```

Modules provide contributions. The Core owns placement, visibility, resizing, responsive behavior, authorization, accessibility, and persistence.

Modules MUST NOT inject unrestricted global HTML, JavaScript, or CSS into Core-owned surfaces.

## Widget Registry
The Core maintains the Widget Registry. Widgets inherit the capabilities of their owning module and gain no additional access by being placed on a dashboard.

See `CUSTOMIZATION-SYSTEM.md` for the full layout and widget model.

## Reference modules
The module platform SHOULD initially be proven with only one or two official reference modules, preferably:

```text
Calendar
Shopping
```

These reference modules validate:
- installation
- manifest parsing
- capabilities
- module-owned data
- family activation
- routes/navigation
- widgets
- updates
- uninstall

Additional feature modules should follow after Core + Module Platform v1 is stable.

## Current repository migration
The temporary seeded feature modules:
```text
calendar
shopping
baby_tracking
photos
```
are transitional and SHOULD be removed.

Target fresh state:
```text
modules table = 0 installed feature modules
```

The local `modules` table represents installed packages only, never the global Store catalog.

## Implementation order
```text
1. Define module-manifest.schema.json
2. Refactor installed-module registry
3. Remove automatic feature-module seeds
4. Build package parser/validator
5. Add integrity/signature verification
6. Define Capability Registry
7. Define Module Runtime API
8. Implement runtime isolation foundation
9. Implement install/update/uninstall
10. Implement Store client
11. Add Widget Registry/contribution handling
12. Build Calendar reference module
13. Build Shopping reference module
14. Open third-party publishing only after security boundaries are mature
```
