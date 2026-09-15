---
trigger: always_on
---

# FamilieTools Project Rules

## Product Vision

FamilieTools is a modular family management CMS.

It provides one central platform for managing family-related information and services while allowing new modules to be added over time.

Expected modules may include:

- family calendar and appointments
- shopping and household lists
- photo albums and family media
- baby tracking
- food and nutrition tracking
- health-related tracking
- tasks and reminders
- documents and family information
- additional future family-management modules

The architecture must support future expansion without requiring major rewrites of existing modules.

## Core Architecture

- Use a modular architecture.
- Each feature domain should be implemented as an independent module where practical.
- Avoid tight coupling between unrelated modules.
- Shared functionality must live in clearly defined shared/core modules.
- Do not duplicate business logic across modules.
- Public interfaces between modules must be deliberate and minimal.
- Prefer composition over large tightly coupled systems.
- Avoid premature abstraction.
- Introduce abstractions when repeated patterns or architectural requirements justify them.

## Domain Separation

Examples of possible domains include:

- users
- families
- permissions
- calendar
- shopping
- photos
- baby
- health
- food
- notifications
- files

Domain-specific business logic should remain inside its owning module.

A module must not directly manipulate another module's internal implementation.

Use defined services, APIs or shared contracts for cross-module communication.

## Shared Core

Cross-cutting functionality should be centralized where appropriate, including:

- authentication
- authorization
- family membership
- permissions
- logging
- validation
- configuration
- notifications
- file handling
- audit logging

Do not implement separate authorization systems inside individual feature modules.

## Multi-Client Architecture

FamilieTools must be designed as a multi-client application.

The backend must remain independent from any specific frontend technology.

Supported or planned clients may include:

- SvelteKit web application
- installable PWA
- native Android application
- future iOS application
- future integrations or external clients

The backend API is the authoritative source for:

- business logic
- authorization
- validation
- family isolation
- persistence
- security-critical rules

Client applications must not contain security-critical business rules that are required for correct server-side behavior.

The web frontend must not become the only place where application logic exists if the same behavior is required by native clients.

Prefer API-first design.

Where practical, backend APIs should be described using OpenAPI so that typed clients can be generated for:

- TypeScript
- Kotlin
- future Swift clients

## Maintainability

- Keep files focused on a clear responsibility.
- Prefer descriptive names over abbreviations.
- Avoid unnecessarily large files.
- Prefer explicit and readable implementations.
- Document non-obvious architectural decisions.
- Do not add technologies or dependencies without a concrete benefit.
- Follow existing project conventions before introducing new patterns.
- Keep frontend, backend, shared contracts and infrastructure concerns clearly separated.
- Avoid framework-specific coupling in shared business concepts.

## Development

- Build functionality incrementally.
- Changes should remain reviewable.
- Add appropriate tests for new functionality.
- Breaking changes must be explicitly identified.
- Security and authorization requirements are part of feature design, not an afterthought.
- New modules must define their ownership, permissions and data boundaries before implementation.
- New public APIs must be documented and versioned carefully where needed.

## Deployment

FamilieTools must be designed for simple self-hosted deployment.

The preferred production deployment model is Docker Compose.

The complete application stack should be installable and manageable as one logical FamilieTools deployment, even when multiple containers are used internally.

Deployment should require as little manual configuration as practical.

Prefer:

- one documented Docker Compose stack
- prebuilt application images
- persistent Docker volumes for application data
- environment-based configuration
- automatic database migrations where safely possible
- health checks
- restart policies
- clear upgrade procedures
- clear rollback procedures
- predictable backup and restore procedures

Do not require users to manually install application runtime dependencies such as:

- Node.js
- pnpm
- PostgreSQL
- build tools

Application components may be combined into one application image when this does not compromise maintainability, security or reliability.

Infrastructure services such as PostgreSQL should normally remain separate containers.

Production containers must not contain development tooling or unnecessary packages.

Production images should be:

- minimal
- reproducible
- non-root where practical
- immutable where practical
- free of development dependencies

The deployment architecture must remain compatible with:

- Docker Engine
- Docker Compose
- Unraid
- common Linux servers
- NAS systems
- home-server environments

A fresh installation should eventually require only minimal steps, ideally:

1. obtain the Docker Compose configuration
2. configure required environment values
3. start the stack
4. open the FamilieTools setup interface
5. create the initial administrator and family
6. begin using the application

The first-run setup should be designed so that normal users do not need to manually edit database tables or application files.

## Self-Hosted First

Prefer self-hosted and open-source infrastructure where practical.

Avoid introducing mandatory third-party SaaS dependencies for core application functionality.

External services may be supported as optional integrations, but the core FamilieTools platform should remain functional in a fully self-hosted environment.

The architecture should not require paid cloud services for basic operation.

## Platform Independence

The application should not depend on a specific hosting provider.

Do not design core functionality exclusively around:

- AWS
- Azure
- Google Cloud
- Vercel
- Netlify
- proprietary database services
- proprietary authentication services

Provider-specific integrations may be added later behind replaceable abstractions.

The default deployment should remain portable and self-hostable.
