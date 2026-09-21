# FamilieTools Module Store

## Status

Normative Store v1 architecture.

## Core principle

Store v1 SHOULD operate with **zero recurring infrastructure cost** for the FamilieTools maintainer.

Initial infrastructure:

```text
GitHub Repository
+
GitHub Pages
+
GitHub Releases
+
GitHub Actions
+
GitHub Pull Requests
+
Sigstore / Cosign
```

No dedicated paid server or PostgreSQL Store database is required for v1.

## Central registry

All FamilieTools instances consume the same centrally published metadata.

Suggested repository:

```text
FamilieTools/ModuleStore
```

Suggested structure:

```text
store/
  index.json
  categories.json
  publishers.json
  revocations.json
modules/
publishers/
schemas/
submissions/
.github/workflows/
```

Git is the source of truth. Generated JSON is the read model.

## Package distribution

`.ftmodule` packages SHOULD be distributed as immutable GitHub Release assets.

Version metadata includes:

- module ID
- version
- package URL
- SHA-256
- signing/attestation identity
- compatibility
- permissions
- dependencies
- security state

The local installer always verifies integrity and trust locally.

## Third-party submissions

Initial workflow:

```text
Developer
  ↓
Module SDK validation
  ↓
GitHub Pull Request
  ↓
read-only automated checks
  ↓
risk-based maintainer review
  ↓
trusted publication workflow
  ↓
build / sign / release / index update
```

Untrusted PR code MUST NOT receive publication credentials or signing authority.

## Security pipeline

Should include:

```text
manifest validation
source validation
dependency audit
secret scanning
static analysis
malware scanning
license scanning
SBOM generation
isolated build
automated tests
capability analysis
package structure validation
hash generation
```

Automated scanning is defense-in-depth, not a malware-free guarantee.

## Signing

Store v1 SHOULD use Sigstore/Cosign where practical.

Trusted official artifacts should be tied to an expected repository/workflow identity.

## Revocation feed

The Store publishes a small integrity-protected revocation feed. Instances cache it and refresh periodically.

Store downtime MUST NOT prevent Core startup or normal use of already installed modules.

## Artifact types

The central FamilieTools registry SHOULD support:

```text
module
theme
layout-preset
core-update
```

### Modules

Follow `MODULE-SYSTEM.md`.

### Themes

Declarative, validated semantic design tokens only. No arbitrary JavaScript. No unrestricted global CSS.

Possible theme data:

```text
colors
typography
spacing
radii
shadows
light/dark variants
density defaults
```

### Layout presets

Declarative layout data only. They may describe widget placement, visibility, size, navigation order, quick actions, and responsive variants.

No executable code.

### Core updates / patches

The same registry infrastructure MAY distribute official:

```text
Core releases
security patches
hotfixes
```

Core updates have a stricter trust policy:

- only official FamilieTools signing identity
- third parties cannot publish Core updates
- mandatory SHA-256 + signature/attestation
- compatibility/migration metadata
- backup/recovery checks
- health checks
- rollback where practical

The Core updater remains part of Core and does not depend on the optional module runtime.

## UI model

The administration UI may expose:

```text
Modules
Themes
Updates
```

Layout presets may live under Customization/Themes while sharing the same registry infrastructure.

## Optional future expansion

If the static GitHub model is ever insufficient, a free-tier-friendly Cloudflare layer may be added later. Store v1 MUST NOT require it.

## Privacy

Normal Store browsing/update checks SHOULD NOT upload family data or module content.

## Implementation order

```text
1. Create ModuleStore repository
2. Define Store JSON schemas
3. Add validation workflows
4. Publish static Store index through GitHub Pages
5. Define GitHub Release package convention
6. Add hash generation/verification
7. Add Sigstore/Cosign trust policy
8. Add revocation feed
9. Add third-party submission template
10. Separate untrusted validation from trusted publication
11. Add Store client to FamilieTools
12. Add theme/layout-preset metadata
13. Add official Core update channel
```
