# FamilieTools Platform Architecture

## 1. Purpose

FamilieTools is not only a family application.

It is a self-hosted platform that contains:

- platform administration
- family management
- modular family applications
- user preferences
- theming
- storage
- notifications
- health monitoring
- future backup and update functionality

This document defines platform-level concepts that must remain separate from
family-level application concepts.

---

# 2. Platform Scope vs Family Scope

FamilieTools has two primary administrative scopes.

## Platform Scope

The platform scope belongs to the server owner who operates the FamilieTools
instance.

Platform-level capabilities may include:

- instance configuration
- platform users
- platform roles
- module availability
- themes
- system diagnostics
- storage configuration
- backups
- updates
- authentication providers
- notification providers
- audit log
- security configuration

Platform administration lives under:

```text
/admin
```

## Family Scope

Family-level administration belongs to one specific family.

Family-level capabilities may include:

- family members
- family roles
- module permissions
- family settings
- family content
- invitations
- sharing

A platform owner and a family owner are different concepts.

Never use one generic "Owner" role for both scopes.

---

# 3. Platform Owner

FamilieTools must support at least one platform owner.

The platform owner:

- operates the self-hosted instance
- has access to platform administration
- is not automatically the owner of every family
- may create or manage platform-level settings
- may control which modules and themes are available
- may manage instance-wide users where authorized
- may access diagnostics and maintenance functionality

Platform ownership must be enforced server-side.

Do not rely on frontend-only admin route protection.

---

# 4. Platform Authorization

Platform authorization must be separate from family authorization.

Future platform capabilities may include:

```text
platform.admin.access
platform.users.read
platform.users.manage
platform.families.read
platform.families.manage
platform.modules.read
platform.modules.manage
platform.themes.read
platform.themes.manage
platform.system.read
platform.system.manage
platform.settings.read
platform.settings.manage
platform.audit.read
platform.backups.manage
platform.updates.manage
```

The platform permission model should remain extensible.

Do not hard-code checks such as:

```ts
if (user.isAdmin) {
}
```

Prefer centralized capabilities and policies.

---

# 5. First-Run Setup

A fresh FamilieTools instance must provide a secure first-run setup process.

The setup process should eventually configure:

- initial platform owner
- instance name
- default language
- default timezone
- public/base URL
- initial family
- optional initial modules
- default theme
- basic storage configuration

The setup flow must only be available when the instance has not been initialized.

After successful initialization:

- first-run setup must be disabled
- setup endpoints must reject normal access
- setup state must be stored server-side

Do not use only a client-side flag to disable setup.

---

# 6. Initialization State

The platform should maintain a persistent initialization state.

Conceptual states:

```text
uninitialized
initializing
ready
maintenance
```

The exact implementation may evolve.

The backend is authoritative for the current platform state.

---

# 7. Instance Settings

Instance settings belong to the platform scope.

Examples:

```text
instance.name
instance.publicUrl
instance.defaultLanguage
instance.defaultTimezone

registration.mode

uploads.maxFileSize
uploads.allowedMimeTypes

theme.defaultThemeId

modules.defaultState
```

Normal configuration values may be stored in PostgreSQL.

Secrets must not be treated like ordinary configuration values.

---

# 8. Secrets

Secrets may include:

- SMTP passwords
- OAuth/OIDC client secrets
- API tokens
- S3 credentials
- encryption keys
- notification provider secrets

Secrets must never:

- appear in normal API responses
- be logged
- be stored in frontend code
- be returned after initial submission unless technically necessary

The platform should eventually support a dedicated secrets abstraction.

---

# 9. Module Registry

FamilieTools is modular.

Every feature module should have a platform-level registry entry.

Conceptual module metadata:

```text
id
name
description
version
status
category
enabledByDefault
requires
```

Examples:

```text
calendar
shopping
photos
baby
health
food
documents
tasks
```

The server owner controls whether a module is available on the instance.

Family-level activation may be added separately.

---

# 10. Module States

A module may have states such as:

```text
available
enabled
disabled
unavailable
maintenance
```

Disabling a module must not automatically delete its data.

Module removal and data deletion are separate operations.

---

# 11. Module Dependencies

Modules may depend on shared platform capabilities.

Examples:

```text
photos
→ files/media

calendar
→ notifications

baby
→ users/families
```

A module should declare dependencies explicitly where practical.

Do not create hidden cross-module coupling.

---

# 12. Theme Platform

Themes are platform-managed configuration.

The Theme Manager is defined in `DESIGN.md`.

The platform owner controls:

- theme creation
- theme editing
- theme activation
- theme deactivation
- default theme
- import/export
- system/custom themes

Normal users may only select from approved themes.

---

# 13. User Preferences

Personal preferences belong to a user, not a family.

Examples:

```text
themeId
colorScheme
density
reducedMotion
language
timezone
```

Preferences must not contain authorization data.

A user preference must never grant permissions.

---

# 14. System Diagnostics

FamilieTools should provide one centralized diagnostics layer.

Possible checks:

```text
api
database
storage
migrations
backgroundJobs
mail
notifications
identityProvider
version
updates
```

Each diagnostic should have a structured state.

Suggested states:

```text
ok
warning
error
unknown
disabled
```

The `/health` endpoint may expose only a safe subset.

Detailed diagnostics belong in authenticated platform administration.

---

# 15. API Error Contract

FamilieTools APIs should converge on one predictable error format.

Conceptual structure:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": [],
  "requestId": "..."
}
```

Avoid returning inconsistent custom error shapes from individual modules.

Validation details must not leak secrets or sensitive internal data.

---

# 16. Request IDs

Every HTTP request should eventually have a unique request ID.

The request ID should be:

- included in structured logs
- returned in error responses where useful
- available to audit/diagnostics systems

This makes support and troubleshooting significantly easier.

---

# 17. Structured Logging

Application logs should be structured where practical.

Useful fields may include:

```text
timestamp
level
requestId
module
action
userId
familyId
result
duration
```

Do not log secrets.

Avoid unnecessary personal or health data in application logs.

---

# 18. Audit Logging

Audit logs are different from normal application logs.

Audit events should represent meaningful security or administrative actions.

Examples:

```text
platform.owner.created
platform.user.disabled
family.created
family.member.added
theme.updated
module.enabled
module.disabled
settings.changed
backup.started
backup.restored
```

Audit entries should be immutable from normal application workflows.

---

# 19. Soft Delete and Deactivation

Destructive operations should be evaluated individually.

Prefer deactivation where recovery may be needed.

Examples:

```text
users
→ deactivate before hard deletion

themes
→ deactivate

modules
→ disable

families
→ archive / soft delete where practical
```

Hard deletion should be explicit and auditable.

Sensitive legal/data-removal requirements may still require permanent deletion.

---

# 20. Pagination

Collection APIs should use a common pagination model.

Recommended initial approach:

```text
page
pageSize
```

Responses should eventually provide:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 25,
  "total": 100
}
```

Large high-volume domains may later use cursor pagination.

Do not invent different pagination conventions per module.

---

# 21. Sorting

Collection APIs should use consistent sorting semantics.

Example:

```text
sort=name
order=asc
```

Only explicitly supported sort fields may be accepted.

Never directly interpolate client-provided database column names.

---

# 22. Filtering

Filters should be explicit and domain-owned.

Examples:

```text
status
familyId
moduleId
createdFrom
createdTo
```

Do not expose arbitrary raw SQL-like filters.

---

# 23. Internationalization

User-facing application text should be designed for translation.

Do not permanently hard-code German strings throughout reusable components.

Initial languages may be limited, but architecture should support future
localization.

Possible initial languages:

- German
- English

Additional languages may be added later.

---

# 24. Timezones

FamilieTools must distinguish:

- server/container timezone
- instance default timezone
- family timezone
- user timezone

Persist absolute timestamps using timezone-aware database values.

Display conversion belongs to clients or appropriate presentation services.

Calendar functionality must preserve event timezone semantics where required.

---

# 25. Storage Abstraction

Feature modules must not directly depend on filesystem paths.

A future shared Storage Service should own:

- upload validation
- storage location
- metadata
- deletion
- secure delivery
- quotas
- derived assets

Possible implementations:

```text
local filesystem
NAS/bind mount
S3-compatible storage
```

Feature modules store references to media/storage records rather than arbitrary
host paths.

---

# 26. Background Jobs

Potential background work includes:

- backup creation
- image processing
- notification delivery
- mail delivery
- imports
- exports
- update checks
- cleanup jobs

Long-running work should not block HTTP request handlers.

A job abstraction should be introduced before such functionality is implemented.

Do not introduce a heavy queue platform before there is a real need.

---

# 27. Backup and Restore

A complete FamilieTools backup may eventually include:

- PostgreSQL data
- uploaded files
- instance configuration
- themes
- module data
- required application metadata

Secrets require special handling.

Backup files should be versioned and validated before restore.

Restore operations must be privileged and auditable.

---

# 28. Update Model

The platform admin should eventually expose:

```text
current application version
database migration state
available update information
compatibility state
```

Updates must never silently destroy persistent data.

Upgrade and rollback procedures must remain compatible with the Docker
deployment model.

---

# 29. Admin UI Foundation

Before creating many `/admin` pages, establish reusable admin primitives.

Minimum expected primitives:

```text
AdminShell
Sidebar
Topbar
PageHeader

Button
IconButton

Input
Textarea
Select
Checkbox
Switch

Card
Panel

Table
Pagination

Badge
StatusBadge

Alert
Toast

Dialog
ConfirmDialog

EmptyState
LoadingState
ErrorState
```

Do not implement independent visual versions of these controls inside every
admin page.

---

# 30. Admin Navigation

Initial platform navigation:

```text
Dashboard
Benutzer
Familien
Module
Themes
System
Einstellungen
```

Future navigation may include:

```text
Audit
Backups
Updates
Storage
Integrationen
Sicherheit
```

Navigation availability must follow platform authorization.

Hiding a navigation entry does not replace backend authorization.

---

# 31. Admin Dashboard

The admin dashboard should show useful operational information.

Potential information:

```text
instance status
API status
database status
application version
migration state
user count
family count
enabled modules
storage state
recent administrative events
```

Do not add decorative metrics solely to fill dashboard space.

---

# 32. Security Baseline

Before the platform is exposed beyond local development, it must eventually
include:

- authentication
- platform authorization
- secure session/token handling
- rate limiting where appropriate
- security headers
- controlled CORS
- CSRF protection where applicable
- request validation
- upload validation
- audit logging
- secrets handling

The application must not be considered production-ready until these are
implemented and tested.

---

# 33. Development Principle

Prefer implementing a small coherent platform abstraction before creating many
feature-specific exceptions.

At the same time, avoid building infrastructure without a foreseeable use.

The platform should grow incrementally through real requirements.
