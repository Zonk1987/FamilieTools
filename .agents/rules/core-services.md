---
trigger: always_on
---

# FamilieTools Core Services

FamilieTools is a modular family CMS. Cross-cutting concerns must be implemented as shared core services instead of being reimplemented inside feature modules.

## Core Domains

The architecture should provide clear shared domains for:

- identity
- authentication
- users
- families / households
- memberships
- roles and permissions
- authorization
- files and media
- notifications
- audit logging
- configuration
- validation

Feature modules should consume these services through defined interfaces.

## Identity

A user account represents one authenticated identity.

User identity must be separated from family membership.

A user may potentially belong to more than one family or household in the future.

Do not design the database so that a user is permanently bound to exactly one family.

Identity must remain independent from a specific client application.

The same user identity should be usable from:

- web
- PWA
- Android
- future iOS clients

## Authentication

Authentication should be implemented as a shared core concern.

Do not implement authentication independently inside feature modules.

The architecture should support standards-based authentication suitable for multiple clients.

Prefer established standards such as:

- OpenID Connect
- OAuth 2.x
- Authorization Code flow
- PKCE for public/native clients

Avoid implementing custom cryptographic authentication protocols.

Authentication must remain clearly separated from authorization.

Authentication answers:

"Who is the user?"

Authorization answers:

"Is this user allowed to perform this action on this resource?"

The architecture should allow a self-hosted identity provider to be used without requiring a commercial SaaS authentication provider.

## Family / Household

Family-owned data must belong to a family or household context.

The family domain should manage:

- family identity
- memberships
- invitations
- membership status
- family settings
- roles
- permission assignments

Feature modules must not implement their own membership systems.

The architecture should support multiple family or household memberships per user in the future.

Family context must be validated server-side.

Never trust a family identifier supplied by a client without verifying the authenticated user's membership and permissions.

## Authorization

Authorization is a shared core service.

Feature modules define the capabilities they require, but must use the central authorization system to evaluate access.

Authorization decisions may depend on:

- authenticated user
- family membership
- assigned roles
- permissions
- resource ownership
- resource visibility
- module-specific policy

Authorization must be enforced server-side.

Frontend route guards, hidden controls or disabled buttons may improve user experience but must never be treated as security boundaries.

Prefer deny-by-default authorization.

Authorization should support:

- role-based permissions
- fine-grained capabilities
- resource-level policies
- ownership checks
- family-scoped access
- future guest or external sharing policies

## Modules

Feature modules may include domains such as:

- calendar
- shopping
- tasks
- photos
- documents
- baby tracking
- food tracking
- health tracking
- finance
- household management

Modules should remain independently maintainable where practical.

A module must not directly depend on another module's database internals.

Cross-module interaction should use explicit services, events, APIs or shared contracts.

Feature modules should focus on domain-specific behavior and must not recreate shared core infrastructure.

## API-First Architecture

FamilieTools must be API-first.

The backend is the authoritative source for:

- business logic
- authorization
- validation
- family isolation
- persistence
- security-critical rules

Client applications should consume the same backend API where practical.

Supported clients may include:

- SvelteKit web application
- installable PWA
- native Android application
- future iOS application
- future integrations

The backend must not depend on the web frontend being present in order to perform business logic correctly.

The web application must not contain unique business logic that native clients require.

Use explicit API contracts.

Prefer REST APIs described with OpenAPI unless another protocol has a clear technical advantage.

Where practical, generate typed API clients from the OpenAPI specification for:

- TypeScript
- Kotlin
- future Swift clients

API contracts should remain stable and intentionally versioned when breaking changes become necessary.

## Files and Media

Files and media are shared infrastructure.

Feature modules should not independently implement file storage.

The shared file service should support:

- metadata
- ownership
- family scope
- authorization
- MIME validation
- size limits
- safe filenames
- thumbnails or derived assets
- storage abstraction
- secure delivery

The storage implementation should remain replaceable so that local storage, object storage or another backend can be used later.

The default deployment should support fully self-hosted storage.

Private files must not rely on publicly guessable URLs.

Derived assets such as thumbnails must use the same authorization rules as their original files.

The architecture should allow future support for:

- local filesystem storage
- S3-compatible object storage
- NAS-backed storage
- other self-hosted storage backends

without forcing feature modules to change their internal business logic.

## Notifications

Notifications should be centralized.

Feature modules should emit notification requests or events rather than implementing delivery independently.

Potential notification channels may later include:

- in-app
- push
- email
- reminders

Do not couple feature business logic directly to a specific notification provider.

Notification delivery providers should be replaceable.

The default architecture should not require a paid notification SaaS for core application operation.

## Audit Logging

Security-relevant actions should be represented consistently across modules.

The architecture should allow centralized audit events such as:

- login events
- membership changes
- role changes
- permission changes
- sharing changes
- deletion of sensitive data
- administrative actions

Audit logs must not contain secrets or unnecessary sensitive payloads.

Audit entries should contain enough structured context to identify:

- actor
- family context
- action
- target resource
- result
- timestamp

where appropriate and lawful.

## Validation

Validation rules should exist at trust boundaries.

Do not rely exclusively on frontend validation.

Shared reusable schemas or validators should be preferred where appropriate.

All client input must be considered untrusted.

Server-side validation is mandatory for protected or persisted data.

Validation should remain consistent across API endpoints.

## Configuration

Environment-specific configuration must be separated from application logic.

Secrets must never be stored in source control.

Configuration should be provided through documented environment variables or mounted configuration where appropriate.

Provide safe defaults wherever practical.

Required configuration must fail clearly at application startup instead of causing unpredictable runtime behavior.

## Database

Database access is shared infrastructure even when schemas are owned by individual domains.

The database layer should support:

- migrations
- transactions
- explicit relationships
- family-scoped queries
- reliable constraints
- indexing
- backups
- restoration

Feature modules may own their domain tables, but cross-domain access should occur through defined services or contracts rather than direct manipulation of another module's internals.

Authorization scope should be included directly in database queries where practical.

Prefer:

```sql
WHERE id = :resourceId
  AND family_id = :authorizedFamilyId
```
