# FamilieTools – Roadmap

This roadmap is directional and should be updated as implementation progresses.

## Phase 1 – Stabilize the Core

- Finalize monorepo structure
- Stabilize SvelteKit frontend
- Stabilize NestJS + Fastify backend
- Finalize PostgreSQL / Drizzle foundation
- Keep OpenAPI contract authoritative
- Finish centralized validation
- Finish authentication / identity foundation
- Finish roles and permissions
- Finish workspace / family / membership primitives
- Establish audit logging
- Establish configuration system

## Phase 2 – Administration

- Complete `/admin`
- Instance settings
- System information
- Diagnostics
- Theme Manager
- Storage management
- Job management
- Backup management
- Update management
- User administration
- Membership administration

## Phase 3 – Domain System

Implement the domain abstraction.

A domain should support:

- metadata
- navigation
- front page
- configuration
- permissions
- module placement
- lifecycle
- enable / disable state

## Phase 4 – Module System

Implement a formal module contract.

Modules should support:

- manifest
- compatibility metadata
- settings schema
- permissions
- frontend surfaces
- backend routes
- lifecycle
- migrations
- module instances

## Phase 5 – Module Plugin System

Define safe extension points for modules.

Plugin capabilities may include:

- UI extensions
- actions
- integrations
- API extensions
- jobs
- hooks / events

Plugins should not receive unrestricted core access.

## Phase 6 – Core Extensions

Introduce privileged core extensions.

Requirements:

- explicit trust classification
- restricted publishing
- permission declaration
- compatibility metadata
- clear warnings
- validation / review workflow
- clean enable / disable lifecycle

Only the project owner and trusted third-party developers should be allowed to publish these through the official store.

## Phase 7 – Store

Create the extension store.

Potential package types:

- modules
- module plugins
- themes
- trusted core extensions
- optional domain templates

Store metadata should include:

- author
- version
- compatibility
- permissions
- trust level
- update channel
- dependencies
- changelog

## Phase 8 – PWA and Mobile

### PWA

- installable frontend
- offline-aware behavior where useful
- notifications where supported
- mobile-friendly navigation

### Android

Build a native Android client against the same backend API.

### iOS

Keep the backend/API architecture compatible with a future iOS client without making iOS a current cost requirement.

## Phase 9 – Hardening

- permission audits
- dependency audits
- security headers
- rate limiting
- secret handling
- extension sandbox / isolation where feasible
- update-signing strategy
- backup / restore testing
- migration testing
- disaster recovery documentation

## Long-Term Goal

FamilieTools should become a reusable self-hosted platform rather than a single-purpose application.

The core provides infrastructure.

Domains organize functional areas.

Modules provide capabilities.

Plugins extend modules.

Trusted core extensions modify platform behavior only when deeper integration is genuinely required.
