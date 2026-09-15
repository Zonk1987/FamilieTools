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

## Notifications

Notifications should be centralized.

Feature modules should emit notification requests or events rather than implementing delivery independently.

Potential notification channels may later include:

- in-app
- push
- email
- reminders

Do not couple feature business logic directly to a specific notification provider.

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

## Validation

Validation rules should exist at trust boundaries.

Do not rely exclusively on frontend validation.

Shared reusable schemas or validators should be preferred where appropriate.

## Configuration

Environment-specific configuration must be separated from application logic.

Secrets must never be stored in source control.

## Future Compatibility

Core services should be designed so that future capabilities can be added without redesigning every module.

Examples include:

- multiple families per user
- guest accounts
- granular permissions
- external sharing
- additional storage backends
- additional notification channels
- new feature modules

Avoid overengineering features that are not currently required, but do not create structural limitations that would make these foreseeable extensions impossible.
