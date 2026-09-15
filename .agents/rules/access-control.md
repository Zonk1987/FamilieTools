# FamilieTools Access Control and Data Protection Rules

FamilieTools manages private family information. Authorization and privacy are therefore core architectural requirements.

## Security Model

Use a deny-by-default security model.

A user must never gain access to a resource merely because they know or can guess its identifier.

Every protected operation must verify authorization on the server side.

Frontend visibility is not a security boundary.

## Family Isolation

Data belongs to a clearly defined family or household context unless explicitly designed otherwise.

All family-owned resources must be scoped to their owning family.

Never trust a family ID, user ID or resource ID supplied by the client without verifying membership and permissions.

Queries and mutations must prevent access across family boundaries.

## Authentication

Authentication and authorization are separate concerns.

Authentication answers:

"Who is the user?"

Authorization answers:

"Is this user allowed to perform this action on this resource?"

Do not treat an authenticated user as automatically authorized.

## Roles and Permissions

The authorization architecture must support roles and fine-grained permissions.

Do not hard-code authorization throughout unrelated feature modules.

Prefer a centralized authorization service or policy system.

Initial concepts should support roles such as:

- Owner
- Administrator
- Adult
- Member
- Child
- Guest

The final role model may evolve.

Permissions should be capability-based where practical, for example:

- calendar.read
- calendar.create
- calendar.edit
- calendar.delete

- shopping.read
- shopping.edit

- photos.read
- photos.upload
- photos.delete

- baby.read
- baby.write

- health.read
- health.write

Roles should map to permissions rather than feature code relying only on role names.

## Resource-Level Authorization

Authorization must consider both:

1. the requested action
2. the requested resource

Example:

Having permission to edit calendar entries does not automatically mean a user may edit every calendar entry.

Resource ownership, family membership and applicable permissions must be evaluated.

## Sensitive Data

Treat the following as sensitive data:

- health-related information
- baby tracking data
- private photos and videos
- family documents
- personal profile information
- dates and appointments
- location information
- authentication data

Sensitive information must not be exposed unnecessarily through:

- APIs
- logs
- error messages
- analytics
- client-side state
- URLs

## Children

Features involving children require particularly restrictive access control.

Do not assume all members of a family have identical access to child-related or health-related information.

The architecture must allow permissions to become more restrictive later without requiring a redesign.

## Server-Side Enforcement

Every create, read, update and delete operation involving protected data must perform authorization server-side.

Never rely solely on:

- hidden buttons
- disabled controls
- route guards
- client-side JavaScript checks

Those mechanisms improve UX but do not provide security.

## API Design

Protected API endpoints must:

1. authenticate the user
2. validate input
3. establish family context
4. authorize the requested action
5. authorize access to the requested resource
6. execute the operation
7. return only permitted information

## Database Queries

Prefer queries that include authorization scope directly.

Conceptually prefer:

resource WHERE
id = requestedResource
AND family_id = authorizedFamily

over:

1. load resource by ID
2. return it
3. later attempt to verify ownership

Authorization should happen before sensitive data leaves the trusted boundary.

## Auditability

Security-relevant actions should be designed so that audit logging can be added or enabled.

Examples include:

- permission changes
- role changes
- account changes
- deletion of sensitive data
- sharing of private content
- access-control configuration changes

Do not log secrets or unnecessarily log sensitive content.

## Secrets

Never commit:

- passwords
- API keys
- access tokens
- refresh tokens
- private keys
- session secrets

Secrets must come from secure configuration or environment-specific secret storage.

## Principle of Least Privilege

Grant users, services and modules only the permissions they require.

Do not use broad administrator privileges as a shortcut around missing authorization design.

## Feature Development

For every new module or feature, explicitly determine:

- Who owns the data?
- Who may see it?
- Who may create it?
- Who may modify it?
- Who may delete it?
- Can it be shared?
- Is it sensitive?
- Does access need to be audited?

A feature is not complete until its authorization behavior is defined.
