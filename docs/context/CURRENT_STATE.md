# FamilieTools – Current State

## Current Project State

The project is currently being rebuilt toward a modern, domain-neutral architecture.

The existing implementation direction is a monorepo containing:

- SvelteKit frontend
- NestJS backend
- Fastify
- ESM
- PostgreSQL
- Drizzle
- Swagger / OpenAPI
- typed OpenAPI client
- Vitest
- Playwright
- Docker / Compose

## Already Established

The following architecture and project decisions are considered established:

- Self-hosted platform
- Docker-based deployment
- SvelteKit frontend
- NestJS + Fastify backend
- PostgreSQL + Drizzle
- OpenAPI-based API contract
- Domain-neutral platform core
- Workspace → Domain → Module Instance → Module Plugin hierarchy
- Shared core services
- Separate privileged core-extension concept
- Store concept for modules/plugins/themes/extensions
- Android as first native target
- PWA support
- possible later iOS support
- Theme Manager for the user-facing website
- centralized access control

## Existing Backend Direction

The backend already has or has been designed around DTO-validated areas for:

- Users
- Families
- Memberships

API typing is intended to flow through OpenAPI to the frontend.

## Admin Area

The `/admin` area has already been started.

The most recently known implementation task was reorganizing admin routes such as:

```text
src/routes/admin/
├── settings/
├── system/
└── themes/
```

After route changes, the expected follow-up is:

```text
SvelteKit sync
→ type / lint checks
→ unit tests
→ Playwright tests
```

## Current Architectural Transition

The project previously had a stronger family-specific orientation.

The current direction is to move reusable infrastructure into the platform core and keep actual business functionality inside domains/modules.

Example:

```text
Core
├── Identity
├── Users
├── Memberships
├── Authorization
├── Files
├── Notifications
├── Audit
└── Configuration

Domains
├── Family
├── Gaming
├── Home
└── future domains

Modules
└── provide actual domain functionality
```

## Current Priority

Before adding many new features, the platform boundaries should be stabilized:

1. Core
2. Workspace
3. Domain
4. Module
5. Module Instance
6. Module Plugin
7. Core Extension
8. Store / trust model

Implementation should follow those boundaries rather than introducing feature-specific shortcuts.
