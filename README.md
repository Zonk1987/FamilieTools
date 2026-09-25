# FamilieTools

> **Current codename:** FamilieTools  
> **Long-term direction:** Extensible Modular Application Platform  
> **Status:** Active development

FamilieTools is evolving from a family-focused application into a **secure, self-hosted, domain-neutral modular application platform**.

The long-term goal is to provide one stable Platform Core that can host very different applications through isolated, installable modules — for example family tools, gaming and server management, e-commerce, productivity, home automation, media, business tools, and more.

The project is still called **FamilieTools**, but the architecture is intentionally being generalized so the final product is not tied to a single domain.

---

## Overview

The target platform hierarchy is:

```text
Platform
├── Workspaces
│   └── Domains
│       └── Module Instances
│           └── Module Plugins
└── Core Extensions
```

Example:

```text
Workspace: Home
├── Domain: Family
│   ├── Calendar
│   ├── Shopping
│   └── Baby Tracking
├── Domain: Gaming
│   └── Minecraft Server Manager
│       ├── Mod Installer
│       ├── Plugin Installer
│       └── Modpack Manager
└── Domain: Homelab
    ├── Server Monitoring
    └── Backup Manager
```

The same Platform Core should also support completely different installations:

```text
Workspace: Company
├── Domain: Commerce
│   ├── Products
│   ├── Inventory
│   └── Orders
└── Domain: Productivity
    ├── Tasks
    └── Calendar
```

The Core must remain the same in both cases.

---

## Table of Contents

- [Current Technical Stack](#current-technical-stack)
- [Current Project State](#current-project-state)
- [Architecture](#architecture)
- [Platform Core](#platform-core)
- [Workspaces](#workspaces)
- [Domains](#domains)
- [Modules](#modules)
- [Module Definitions and Module Instances](#module-definitions-and-module-instances)
- [Module Plugins](#module-plugins)
- [Core Extensions](#core-extensions)
- [Permissions and Capabilities](#permissions-and-capabilities)
- [Runtime and Isolation](#runtime-and-isolation)
- [Shared Core Services](#shared-core-services)
- [Module Store](#module-store)
- [Security](#security)
- [Core Services Roadmap](#core-services-roadmap)
- [Reference Modules](#reference-modules)
- [Migration Strategy](#migration-strategy)
- [Architecture Principles](#architecture-principles)
- [Development Setup](#development-setup)
- [Long-Term Goal](#long-term-goal)

---

# Current Technical Stack

## Frontend

- Svelte
- SvelteKit
- PWA-oriented architecture
- Modular UI direction
- Admin area under `/admin`

## Backend

- NestJS 12
- Fastify
- ESM
- REST API
- Swagger / OpenAPI

## Database

- PostgreSQL
- Drizzle ORM

## Testing

- Vitest
- API unit tests
- PostgreSQL-backed integration tests
- Web tests
- Playwright E2E tests

## Tooling

- pnpm workspace
- TypeScript
- Oxlint
- Prettier

## Deployment Direction

- Docker
- Docker Compose
- Self-hosted deployment as a primary target

---

# Current Project State

The project foundation already includes:

- Monorepo structure
- SvelteKit frontend
- NestJS backend
- Fastify integration
- PostgreSQL + Drizzle ORM
- Swagger / OpenAPI
- DTO validation
- Central formatting and quality checks
- Architecture and access-control rules
- Module manifest validation
- Module package validation
- API, web and E2E test foundations
- CI security and quality gates

Existing Core/API work includes:

- Users
- Families
- Family memberships
- Authentication
- Sessions
- Platform roles
- Platform capabilities
- Instance settings
- User preferences
- Themes
- Module registry foundations
- Setup state
- Audit logging

The existing family-specific structures are **not considered the final platform model**. They are expected to be migrated toward generic Workspace concepts.

---

## Current Security Baseline

The current implementation already includes:

- Atomic first-run setup protection
- Transaction-safe setup flow
- Authentication rate limiting
- Account and client-oriented login throttling
- Timing-attack resistance for unknown login identities
- Scrypt parameter validation
- Session expiry handling
- Session cleanup
- Session activity throttling
- CSRF Origin / Referer validation for cookie-authenticated requests
- Centralized trusted-origin handling
- Security headers
- Secure cookie handling
- Trusted proxy configuration
- Request IDs
- Audit correlation through request IDs
- Platform capability checks
- Dependency auditing
- Secret scanning in CI

---

## Audit Core v1

Audit logging is now part of the Core foundation.

Current audit capabilities include:

- Append-only application workflow
- Actor information
- Scope information
- Target information
- Result classification
- Request ID correlation
- Metadata
- Sensitive metadata redaction
- Pagination
- Filtering
- Date-range filtering
- Platform-admin read API
- Capability protection through `platform.audit.read`
- Swagger / OpenAPI documentation

Current Core authentication events include:

```text
auth.login.succeeded
auth.login.failed
auth.logout
```

The audit model is intentionally domain-neutral so modules can later define their own actions, for example:

```text
gaming.minecraft.server.started
commerce.order.created
workspace.member.role.changed
```

---

# Architecture

The architecture is built around a strict separation between the Platform Core and domain-specific functionality.

```text
Platform
│
├── Workspaces
│   │
│   └── Domains
│       │
│       └── Module Instances
│           │
│           └── Module Plugins
│
└── Core Extensions
```

This separation is central to the long-term design.

---

# Platform Core

The Platform Core must remain as domain-neutral as possible.

The Core should not know what a baby, Minecraft server, product, order, shopping list, game, invoice, or health entry is.

Those concepts belong to modules.

The Core should provide generic platform capabilities such as:

- Identity
- Authentication
- Sessions
- Users
- Workspaces
- Memberships
- Roles
- Permissions
- Domains
- Module Registry
- Module Runtime
- Module Instances
- Plugin Registry
- Core Extensions
- Capabilities
- Settings
- Events
- Jobs / Scheduler
- Notifications
- Files / Storage
- Secrets
- Search
- Audit Logging
- Themes
- Widgets
- Diagnostics
- Backup / Restore
- Updates
- Health Checks
- Store Client
- API Infrastructure

---

# Workspaces

`Family` is not intended to remain the universal top-level scope.

The future generic concept is:

```text
Workspace
```

Examples:

```text
Workspace: Home
Workspace: Company
Workspace: Community Server
Workspace: Personal
```

A Workspace may contain:

- members
- roles
- permissions
- domains
- module instances
- settings
- files
- secrets
- audit context
- storage scope

A user may belong to multiple Workspaces.

## Planned Migration

```text
Family
→ Workspace

FamilyMembership
→ WorkspaceMembership

Family Scope
→ Workspace Scope
```

This migration will be performed incrementally instead of as a destructive mass rename.

---

# Domains

Domains are an organizational layer inside a Workspace.

Examples:

- Gaming
- Family
- Commerce
- Homelab
- Productivity
- Work
- Media
- Development
- Personal

A Domain is primarily:

- a navigation area
- a front page
- a visual container
- a module grouping
- a permission scope
- a widget container

Domains should contain very little business logic themselves.

Admins should eventually be able to create custom Domains.

Example:

```text
Name: Gaming
Slug: gaming
Icon: gamepad
```

An empty Domain may initially display:

```text
Gaming

No modules installed.

[ Browse Module Store ]
```

---

# Modules

Modules provide the actual application functionality.

Examples:

- Minecraft Server Manager
- Calendar
- Shopping
- Products
- Inventory
- Orders
- Tasks
- Notes
- Game Library
- Server Monitoring
- Baby Tracking

A module may conceptually look like:

```text
modules/
└── minecraft-server/
    ├── module.json
    ├── backend/
    ├── frontend/
    ├── database/
    ├── migrations/
    ├── permissions/
    ├── capabilities/
    ├── events/
    ├── jobs/
    ├── widgets/
    ├── extension-points/
    └── assets/
```

The current module package work already includes manifest validation and package-validation foundations.

---

# Module Definitions and Module Instances

A major architectural requirement is to distinguish the installed software package from its use inside a Workspace.

```text
Module Definition
+
Module Instance
```

Example:

```text
Calendar Instance #1
Domain: Family

Calendar Instance #2
Domain: Work
```

Each Module Instance can have separate:

- data
- settings
- permissions
- widgets
- plugin configuration
- files
- secrets
- storage scope

This allows one installed module definition to serve multiple independent contexts safely.

---

# Module Plugins

A Module Plugin extends a specific host module.

Example:

```text
Minecraft Server Manager
├── Mod Installer
├── Plugin Installer
├── Modpack Manager
├── CurseForge Integration
├── Modrinth Integration
└── Advanced Backups
```

The base module can remain intentionally small while optional functionality is installed separately.

## Extension Points

Plugins must not arbitrarily patch a host module.

Host modules should explicitly expose extension points, for example:

```text
minecraft.navigation
minecraft.server.tabs
minecraft.server.actions
minecraft.settings.sections
minecraft.jobs
minecraft.events
minecraft.widgets
```

Plugins then declare which extension points they use.

---

# Core Extensions

Core Extensions modify or extend the Platform Core itself.

Examples:

- LDAP authentication
- Additional OIDC providers
- Advanced theme engines
- Storage providers
- Notification providers
- Search providers
- Advanced admin tools
- Additional diagnostics

Core Extensions should use controlled platform extension points instead of patching internal implementation details.

Possible Core extension points:

```text
core.auth.providers
core.settings.sections
core.admin.navigation
core.dashboard.widgets
core.storage.providers
core.notification.providers
core.search.providers
core.theme.providers
core.secret.providers
```

Core Extensions require a higher trust level than ordinary modules.

---

# Trust Levels

The ecosystem may distinguish publishers and packages by trust level.

Possible levels:

```text
Official
Verified
Community
Local Development
```

Core Extensions require stronger trust than normal Modules and Module Plugins.

---

# Permissions and Capabilities

Permissions and Capabilities are deliberately separate concepts.

## Permissions

Permissions define what a user is allowed to do.

Examples:

```text
gaming.minecraft.servers.read
gaming.minecraft.servers.manage

commerce.products.read
commerce.products.write

family.baby.entries.read
family.baby.entries.create
```

## Capabilities

Capabilities define what software is technically allowed to access.

Examples:

```text
core.files.read
core.files.write
core.notifications.send
core.jobs.register
core.search.index
core.secrets.read
core.widgets.register
```

Security principles:

- Default Deny
- Least Privilege
- Explicit grants
- Workspace scoping
- Module-instance scoping
- Auditable privileged actions

---

# Runtime and Isolation

Modules should not receive unrestricted access to Core internals.

They should not directly receive:

- PostgreSQL credentials
- unrestricted Core tables
- arbitrary NestJS services
- host filesystem access
- Docker Socket access
- secrets from other modules
- data from other Workspaces
- private Core APIs

Instead:

```text
Module
  ↓
Platform Runtime API
  ↓
Core Services
```

The architecture should allow future isolation such as:

- process isolation
- sandbox / worker isolation
- filesystem restrictions
- restricted network access
- secret boundaries
- resource limits
- crash isolation
- no direct database credentials
- no unrestricted Docker Socket access

---

# Event-Driven Communication

Modules should avoid direct dependencies on each other where possible.

Preferred model:

```text
Module A
  ↓
Platform Event Bus
  ↓
Interested Consumers
```

Example events:

```text
core.user.created
workspace.created
domain.created
workspace.module.enabled
gaming.server.started
gaming.server.stopped
commerce.order.created
family.baby.feeding.created
calendar.event.created
```

---

# Shared Core Services

Shared infrastructure belongs in the Core instead of being reimplemented by every module.

Examples:

- Storage
- File handling
- Media
- Notifications
- Jobs
- Search
- Secrets
- Settings
- Audit
- Backups
- Diagnostics
- Updates

---

# Widget System

Modules and plugins should be able to contribute widgets.

Examples:

- Minecraft Server Status
- Recent Orders
- Last Feeding
- Upcoming Events
- System Health

The Core should control:

- rendering
- placement
- visibility
- permissions
- Workspace scope
- Domain scope
- Module Instance scope
- persistence
- failure isolation

---

# Navigation Registry

Modules and plugins should contribute navigation entries through a controlled registry.

Example:

```text
Gaming
└── Minecraft Servers
    ├── Overview
    ├── Console
    ├── Players
    ├── Mods
    └── Backups
```

---

# Module Store

The long-term Store should support at least:

- Modules
- Module Plugins
- Core Extensions

Store packages may contain:

- Package ID
- Name
- Publisher
- Version
- Package Type
- Core Compatibility
- Required Module
- Dependencies
- Permissions
- Capabilities
- Hash
- Signature
- Attestation
- Changelog
- Update Channel
- Trust Level
- Categories
- License
- Homepage
- Source Repository

## Package Security

For official and trusted packages, the platform should eventually support:

- signed release pipelines
- Sigstore / Cosign
- SBOM generation
- build provenance / attestation

The Store must not receive unnecessary private Workspace or user data.

## Package Lifecycle

```text
Discover
  ↓
Download
  ↓
Verify
  ↓
Compatibility Check
  ↓
Dependency Check
  ↓
Permission Review
  ↓
Capability Review
  ↓
Install
  ↓
Migrate
  ↓
Activate
  ↓
Health Check
```

Updates should include package verification, migrations, health checks, backups and rollback where practical.

Uninstall must distinguish between:

- Remove Software / Keep Data
- Remove Software / Delete Data

Silent data loss is not acceptable.

---

# Security

Security is treated as an architectural boundary, not as an optional later layer.

Current and planned principles include:

- Default Deny
- Least Privilege
- Workspace isolation
- Module Instance isolation
- Explicit capability grants
- Auditable privileged actions
- Strong session handling
- Secure setup flow
- Request correlation
- Package verification
- No unrestricted third-party Core access

CI is expected to enforce:

- formatting
- linting
- TypeScript checks
- unit tests
- package tests
- web checks
- builds
- PostgreSQL-backed integration tests
- security scans
- dependency scans
- secret scans
- module manifest validation
- package validation

Later:

- SBOM
- signatures
- attestations

---

# Core Services Roadmap

## Audit Logging

**Current state:** Core v1 implemented.

Audit-sensitive actions include:

- logins
- role and permission changes
- module/plugin/core-extension installation
- backups
- restore operations
- updates
- security-sensitive administrative actions

## Jobs / Scheduler

**Next Core service in development.**

Planned uses include:

- session cleanup
- update checks
- backups
- notifications
- module jobs
- maintenance

The design intentionally separates:

```text
Job Definition
Job Schedule
Job Run
```

A Job defines the work.  
A Schedule defines when the work should run.  
A Job Run represents one concrete execution.

## Notifications

Shared infrastructure for:

- in-app notifications
- email
- push
- future providers

## Storage

The Storage service should handle:

- files
- media
- documents
- private uploads
- module data

with proper:

- scope enforcement
- MIME validation
- limits
- protected delivery

## Backup / Restore

Backups should eventually include:

- Core database
- Workspace data
- Domains
- Module Instances
- module data
- plugin configuration
- settings
- files
- relevant version metadata

## Diagnostics

Diagnostics should report:

- API status
- database status
- migration status
- storage
- installed modules
- plugin health
- Core Extension health
- versions
- system errors

## Update Service

Controlled updates for:

- Platform Core
- Modules
- Module Plugins
- Core Extensions

with:

- integrity checks
- backups
- migration validation
- health checks
- rollback strategy

---

# Multi-Client Direction

Target clients:

- Web
- PWA
- Android
- potentially iOS
- API clients

Authentication therefore must not permanently depend only on browser cookies.

The architecture should remain evolvable toward standards-based multi-client authentication such as OAuth2 / OIDC with Authorization Code + PKCE where appropriate.

---

# Reference Modules

The platform should not immediately grow dozens of modules.

Initial reference modules should validate the architecture.

## Calendar

Useful for validating:

- Workspace scope
- roles
- permissions
- CRUD
- navigation
- widgets
- notifications
- module data

## Shopping

Useful for validating:

- shared data
- concurrent editing
- mobile usage
- module activation
- PWA scenarios

## Minecraft Server Manager

Useful as a stress test to prove that the platform is genuinely domain-neutral.

Potential later expansion:

```text
Gaming
└── Minecraft Server Manager
    ├── Server Status
    ├── Console
    ├── Players
    ├── Mod Installer
    ├── Plugin Installer
    ├── Modpack Manager
    ├── Backups
    └── Monitoring
```

This is **not an immediate implementation requirement**.

It is an architecture test: if the platform cannot cleanly support a completely different system such as Minecraft server management without making the Core Minecraft-specific, the Core is still too domain-specific.

---

# Example Future Domains

## Family

```text
Family
├── Calendar
├── Shopping
├── Baby Tracking
└── Chores
```

## Gaming

```text
Gaming
├── Minecraft Server Manager
├── Game Library
└── Server Monitoring
```

## Commerce

```text
Commerce
├── Products
├── Inventory
├── Orders
└── Customers
```

## Homelab

```text
Homelab
├── Docker Management
├── Server Monitoring
├── Backups
└── Network Monitoring
```

## Productivity

```text
Productivity
├── Tasks
├── Notes
├── Calendar
└── Knowledge Base
```

---

# Migration Strategy

## Phase A — Finish Core Foundations

```text
Setup Safety
  ↓
Auth Hardening
  ↓
CI
  ↓
Core Services
  ↓
Module Platform v1
```

Setup safety, authentication hardening and the main CI security baseline are already substantially implemented.

Core Services are currently being expanded incrementally.

## Phase B — Analyze Family-Specific Coupling

Existing code will be classified into:

```text
KEEP
GENERALIZE
RENAME
MIGRATE
REMOVE
```

Areas to inspect:

- database schema
- services
- DTOs
- routes
- permissions
- tests
- admin UI
- modules
- files
- audit
- backups
- events

## Phase C — Define the Generic Data Model

Planned concepts:

```text
Workspace
WorkspaceMembership
Domain
ModuleDefinition
ModuleVersion
ModuleInstance
PluginDefinition
PluginVersion
PluginInstance
CoreExtension
Permission
Capability
Event
Widget
ExtensionPoint
```

## Phase D — Family → Workspace Migration

Perform a controlled migration from family-specific concepts toward generic Workspace concepts.

## Phase E — Domain Management

Implement:

- Create
- Update
- Delete
- Navigation
- Landing Page
- Permissions
- Module assignment

## Phase F — Module Instance Model

Separate module software from module usage.

## Phase G — Extension Point System

Add standardized extension points for:

- UI
- Navigation
- Widgets
- Settings
- Actions
- Jobs
- Events

## Phase H — Module Plugins

Add plugin packages and lifecycle management.

## Phase I — Core Extensions

Add trusted Core Extensions only after the Module Platform is stable.

---

# Architecture Principles

1. Core stays domain-neutral.
2. Domains are organizational containers.
3. Business functionality belongs in Modules.
4. A Module Definition may have multiple Module Instances.
5. Module Instances have isolated data and settings.
6. Module Plugins extend specific modules.
7. Plugins use defined Extension Points.
8. Core Extensions extend the Platform Core.
9. Core Extensions require stronger trust.
10. Default Deny.
11. Least Privilege.
12. Workspace Isolation.
13. Domain Isolation where applicable.
14. Module Instance Isolation.
15. Capabilities are explicitly granted.
16. Permissions and Capabilities remain separate.
17. Third-party code does not receive unrestricted Core access.
18. Shared infrastructure belongs in Core.
19. Modules communicate through public APIs and events where possible.
20. APIs and events must be versionable.
21. Breaking changes require migrations.
22. Module failures should not destabilize the entire Core.
23. Security boundaries are more important than developer convenience.
24. Avoid unnecessary enterprise complexity.
25. Keep the architecture modular but pragmatic.
26. Reuse existing working code wherever reasonable.
27. Plan migrations explicitly.
28. No silent data loss.
29. Verify packages before installation or update.
30. Private data stays local by default.

---

# Development Workflow

For every major task:

1. Analyze the current state.
2. Explain the architecture impact.
3. Define the concrete change.
4. Implement the change.
5. Run tests.
6. Review the security impact.
7. Verify existing functionality.
8. Update architecture documentation.
9. Update project status.
10. Only then continue to the next major task.

A task should not be considered complete until its relevant checks have actually passed.

---

# Naming

`FamilieTools` is currently a project codename.

A future product name should be:

- domain-neutral
- suitable for a modular platform
- independent from the original family-focused concept

No final rename is required until the architecture is sufficiently stable.

---

# Long-Term Goal

The final system should become a secure, self-hosted, extensible platform that can host many different applications on one shared technical foundation.

```text
                 Web / PWA / Mobile
                         │
                 UI Extension Layer
                         │
┌─────────────────────────────────────────────────┐
│                  PLATFORM CORE                  │
│                                                 │
│ Identity          Workspaces       RBAC         │
│ Domains           Modules          Capabilities │
│ Events            Jobs             Notifications│
│ Storage           Search           Secrets      │
│ Audit             Settings         Backups      │
│ Updates           Diagnostics      Module Store │
└─────────────────────────────────────────────────┘
                         │
                 Core Extension API
                         │
                 Trusted Extensions
                         │
                  Module Runtime API
                         │
               Domain / Module Instances
                         │
                   Module Plugins
```

The platform should remain useful whether it is used for:

- a family dashboard
- a gaming server environment
- a homelab
- a small business
- an e-commerce system
- productivity tools
- or a combination of all of them

without turning the Core into a domain-specific application.

---

## Development Setup

To bootstrap a reproducible development environment on a fresh Windows machine:

```powershell
.\setup-dev.ps1
```

Supported script switches:

- `.\setup-dev.ps1 -DryRun`: Preview all checks and planned operations without modifying files or system state.
- `.\setup-dev.ps1 -SkipValidation`: Fast setup without running test and lint suites.
- `.\setup-dev.ps1 -SkipExtensions`: Skip automated Antigravity / VS Code extension installation.
- `.\setup-dev.ps1 -SkipPlaywright`: Skip checking or downloading Playwright browser binaries.

For detailed instructions, prerequisites, and database workflows, see [docs/development-setup.md](docs/development-setup.md).

---

## Project Status

The architecture is an active design direction.

The project is currently being stabilized around:

- Core services
- authentication and sessions
- setup safety
- CI and security gates
- the module platform
- the upcoming Workspace / Domain migration

The next Core service being developed is **Jobs / Scheduler**.
