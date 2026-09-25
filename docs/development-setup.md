# Windows Development Setup

This document describes how to configure a reproducible Windows development environment for FamilieTools.

---

## Quick Start on a Fresh Windows Machine

Open PowerShell (pwsh or Windows PowerShell) and execute:

```powershell
# 1. Clone the repository
git clone <repository-url>
cd FamilieTools

# 2. Run the automated bootstrap script
.\setup-dev.ps1
```

The bootstrap script will automatically:

- Verify system prerequisites (**Git**, **Node.js 22.x**, **pnpm 12.x**, **Corepack**).
- Install missing tools via `winget` if available, or print direct links.
- Enable Corepack and activate `pnpm@12.4.2` matching `package.json`.
- Install all monorepo dependencies using `pnpm install --frozen-lockfile`.
- Initialize `apps/api/.env` from `.env.example` with local development database defaults (without overwriting existing configuration).
- Synchronize SvelteKit type definitions (`svelte-kit sync`).
- Verify Playwright browser binaries (Chromium).
- Detect Google Antigravity IDE (or VS Code) and install recommended workspace extensions.
- Verify project-level AI rules and instructions in `.agents/rules`.
- Check local Docker Desktop and PostgreSQL status (`compose.dev.yaml`).
- Run non-destructive quality checks (`format:check`, `typecheck`, `lint`, and `test`).

---

## Script Execution Flags

The `setup-dev.ps1` script provides several switches for fine-grained control:

### 1. Dry-Run Mode

Preview all planned actions and tool checks without modifying files or installing software:

```powershell
.\setup-dev.ps1 -DryRun
```

### 2. Fast Setup (Skip Validation)

Bootstrap environment, install dependencies, and configure settings without running tests and linting:

```powershell
.\setup-dev.ps1 -SkipValidation
```

### 3. Skip Extensions

Skip automated editor extension installation (useful in headless or automated CI environments):

```powershell
.\setup-dev.ps1 -SkipExtensions
```

### 4. Skip Playwright Browser Download

Skip checking or downloading Playwright Chromium binaries:

```powershell
.\setup-dev.ps1 -SkipPlaywright
```

---

## System Prerequisites

| Tool                       | Required Version      | Purpose                             | Installation                                  |
| -------------------------- | --------------------- | ----------------------------------- | --------------------------------------------- |
| **Git**                    | 2.x+                  | Version control                     | `winget install --id Git.Git -e`              |
| **Node.js**                | `>=22.23.2` (LTS)     | JavaScript runtime                  | `winget install --id OpenJS.NodeJS.LTS -e`    |
| **Corepack**               | Included with Node.js | Package manager activator           | `corepack enable`                             |
| **pnpm**                   | `12.4.2`              | Monorepo package manager            | Activated via Corepack                        |
| **Google Antigravity IDE** | Latest                | Recommended IDE (VS Code based)     | Antigravity installer                         |
| **Docker Desktop**         | Latest (Optional)     | Local PostgreSQL database container | `winget install --id Docker.DockerDesktop -e` |

---

## Local Database Workflow

FamilieTools uses PostgreSQL with Drizzle ORM. A pre-configured development database is provided via Docker Compose.

### 1. Start the PostgreSQL Container

```powershell
docker compose -f compose.dev.yaml up -d
```

Container details:

- **Port:** `5432`
- **User:** `familietools`
- **Password:** `familietools_dev`
- **Database:** `familietools`

### 2. Apply Database Migrations

```powershell
pnpm --filter ./apps/api exec drizzle-kit migrate
```

---

## Starting Development Servers

To start both the API and Web applications concurrently:

```powershell
pnpm dev
```

Or start them individually:

```powershell
pnpm dev:api   # Starts NestJS API on http://localhost:3000
pnpm dev:web   # Starts SvelteKit Web on http://localhost:5173
```

### Antigravity / VS Code Tasks

Press `Ctrl+Shift+P` -> `Tasks: Run Task` and select:

- `FamilieTools: Start All` (launches both API and Web in dedicated panels)
- `FamilieTools: Start API`
- `FamilieTools: Start Web`

---

## Editor Configuration & Extensions

The repository recommends the following extensions in `.vscode/extensions.json`:

- `svelte.svelte-vscode`: Svelte 5 language support and syntax highlighting
- `dbaeumer.vscode-eslint`: ESLint integration
- `esbenp.prettier-vscode`: Prettier code formatter
- `editorconfig.editorconfig`: EditorConfig standard enforcement
- `redhat.vscode-yaml`: YAML language support and schema validation
- `ms-playwright.playwright`: Playwright test runner and debugging
- `oxc.oxc-vscode`: Oxlint high-performance linter integration

Workspace formatting rules (`.vscode/settings.json`) format files on save using Prettier and Svelte language tooling.

---

## Quality & Validation Commands

Run these commands before submitting pull requests:

```powershell
pnpm check         # Runs format check, package checks, and app checks
pnpm format:check  # Verifies Prettier compliance across all files
pnpm format        # Automatically formats all files with Prettier
pnpm typecheck     # Typechecks both apps/api and apps/web
pnpm lint          # Runs Oxlint for apps/api and ESLint for apps/web
pnpm test          # Runs all unit, package, and component tests
```
