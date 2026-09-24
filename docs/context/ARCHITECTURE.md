# FamilieTools – Architecture

## High-Level Architecture

```text
┌────────────────────────────────────────────┐
│                 Clients                    │
│                                            │
│  Web / PWA     Android App     Future iOS  │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────┐
│              API / Backend                 │
│        NestJS + Fastify + OpenAPI          │
└──────────────────────┬─────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
┌────────────────────┐   ┌───────────────────┐
│   Platform Core    │   │ Extension Runtime │
│                    │   │                   │
│ Identity           │   │ Domains           │
│ Authorization      │   │ Modules           │
│ Users              │   │ Module Plugins    │
│ Memberships        │   │ Core Extensions   │
│ Config             │   │                   │
│ Files / Media      │   └───────────────────┘
│ Audit              │
│ Jobs               │
│ Diagnostics        │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────────────────────────┐
│ PostgreSQL + Drizzle                       │
└────────────────────────────────────────────┘
```

## Structural Model

```text
Platform
└── Workspace
    ├── Users / Memberships
    ├── Settings
    ├── Themes
    ├── Domains
    │   ├── Domain A
    │   │   ├── Frontpage
    │   │   └── Module Instances
    │   │       ├── Module
    │   │       └── Module Plugins
    │   └── Domain B
    └── Trusted Core Extensions
```

## Domain

A domain is an isolated functional area of the platform.

Responsibilities may include:

- Navigation entry
- Own front page
- Module placement
- Domain-specific configuration
- Access rules
- Layout metadata

A domain should **not** reimplement shared core services.

## Module

A module contains a primary business capability.

A module should expose a clearly defined contract for:

- Configuration
- Permissions
- UI surfaces
- API routes
- Events / hooks
- Plugin extension points
- Version compatibility

## Module Instance

A module definition may be instantiated inside a domain.

This allows the same module to be configured multiple times without duplicating its implementation.

Example:

```text
Gaming
├── Minecraft Server – Survival
└── Minecraft Server – Modded
```

Both could use the same module implementation but have separate instance configuration.

## Module Plugin

A module plugin extends a specific module contract.

It may add:

- UI components
- API endpoints
- background jobs
- settings
- actions
- integrations

A plugin should only receive the permissions and extension surfaces it requires.

## Core Extension / Hack

Core extensions are privileged.

They may change or augment platform-level functionality and therefore require:

- explicit trust level
- compatibility declaration
- permission declaration
- stronger review
- restricted store publishing

They should remain optional and removable wherever technically possible.

## Authorization

Authorization belongs to the platform core.

Modules and plugins request permissions but should not implement independent authorization systems.

Expected concepts:

- Platform Owner
- Workspace-level roles
- Family / household membership
- Domain access
- Module permissions
- Plugin permissions

## API Strategy

Backend APIs should be the stable integration layer.

Clients:

- SvelteKit web frontend
- PWA
- Android app
- future iOS app

should consume the same backend API wherever possible.

OpenAPI is used to generate or maintain typed API access.

## Data Strategy

PostgreSQL is the primary database.

Drizzle is the database abstraction / schema layer.

Domain-specific data should remain logically isolated by module ownership even if stored in the same database.

## Deployment

Primary target:

```text
Docker / Docker Compose
```

The installation experience should remain simple for self-hosted users.

The architecture should avoid unnecessary external infrastructure unless a feature genuinely requires it.
