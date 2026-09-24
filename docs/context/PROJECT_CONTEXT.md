# FamilieTools – Project Context

## Project

**Name:** FamilieTools  
**Local path:** `C:\Development\FamilieTools`  
**Goal:** A modern, secure, self-hosted family CMS/platform that can be installed simply via Docker and later used through the web, as a PWA, as a native Android app, and potentially as an iOS app.

The project is intentionally moving toward a **domain-neutral platform architecture**. The core should not be tied to one specific family-use-case or application domain.

## Current Technology Direction

- **Frontend:** SvelteKit
- **Backend:** NestJS + Fastify
- **Runtime style:** ESM
- **Database:** PostgreSQL
- **Database layer:** Drizzle ORM
- **API contract:** OpenAPI / Swagger
- **Frontend API access:** Typed OpenAPI client
- **Testing:** Vitest + Playwright
- **Deployment:** Docker / Docker Compose
- **PWA:** planned / part of the target architecture
- **Native app target:** Android first
- **Possible later target:** iOS

## Core Product Idea

FamilieTools is evolving into a platform with the following hierarchy:

```text
Platform
└── Workspace
    └── Domain
        └── Module Instance
            └── Module Plugin
```

The platform itself provides shared infrastructure and administration.

A **Domain** represents a functional area and can create its own front page / user-facing area.

Example:

```text
Domain: Gaming
└── Module: Minecraft Server Status
    ├── Plugin: Mod Installer
    ├── Plugin: Plugin Installer
    └── Plugin: Backup Extension
```

This keeps the core generic while allowing completely different use-cases to coexist.

## Extension Types

### Modules

Modules provide the main functionality inside a domain.

Examples:

- Minecraft Server Status
- Baby Tracking
- Calendar
- Household Management
- Media Management

### Module Plugins

Plugins extend one specific module.

Examples for a Minecraft module:

- Mod installer
- Plugin installer
- Backup extension
- Server console extension

Plugins should not need to modify the platform core.

### Core Extensions / Hacks

A separate extension category may modify or extend core platform behavior.

Because these extensions have much deeper access than ordinary module plugins, publishing them should be restricted.

Planned policy:

- Core extensions / hacks may only be published by the project owner or trusted third-party developers.
- They must be clearly distinguished from ordinary module plugins.
- They require stronger review and permission controls.

## Store Concept

A future integrated store should distribute:

- Domains or domain templates where appropriate
- Modules
- Module plugins
- Themes
- Trusted core extensions

The store must include security boundaries, compatibility information, permissions and trust levels.

## Administration

The platform administration should manage at least:

- Workspaces
- Domains
- Modules
- Module instances
- Plugins
- Core extensions
- Users
- Families / households
- Memberships
- Roles and permissions
- Themes
- Instance settings
- Diagnostics
- Storage
- Background jobs
- Audit logs
- Backups
- Updates
- Store / extension management

## Shared Core Services

Business domains should reuse shared services instead of implementing their own copies.

Planned shared core services include:

- Identity
- Users
- Families / households
- Memberships
- Roles / permissions
- Authorization
- Files / media
- Notifications
- Audit
- Configuration
- Validation
- Storage
- Jobs
- Diagnostics
- Backup / update infrastructure

## UI / Theme Direction

The public/user-facing website should support a Theme Manager.

Theme values should be validated and may support:

- HEX
- RGB
- HSL
- HSLA
- OKLCH

Administrators define or approve available themes.

Users may select from approved themes in their private profile.

The admin interface itself does not have to use those user-facing themes.

## Important Design Principles

1. Keep the core domain-neutral.
2. Prefer capability detection over hard-coded assumptions.
3. Keep business functionality inside modules.
4. Extend modules through plugins instead of modifying core code.
5. Treat core extensions as privileged code.
6. Keep authorization centralized.
7. Use typed API contracts.
8. Keep deployment simple through Docker.
9. Design web APIs so PWA and native apps can use the same backend.
10. Avoid architecture that would make a later mobile client dependent on frontend implementation details.

## Source of Truth

This file is intended to survive chat changes.

When starting a new ChatGPT session, provide the current repository and instruct the assistant to read:

1. `PROJECT_CONTEXT.md`
2. `ARCHITECTURE.md`
3. `CURRENT_STATE.md`
4. `ROADMAP.md`

before proposing architectural or implementation changes.
