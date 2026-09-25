<#
.SYNOPSIS
    Reproducible Windows development bootstrap script for FamilieTools.

.DESCRIPTION
    Configures and verifies the local Windows development environment for the FamilieTools monorepo.
    Detects required tools (Git, Node.js 22.x, Corepack, pnpm 12.x, Antigravity IDE / VS Code CLI, Docker),
    installs project dependencies, configures environment files safely, installs recommended editor extensions,
    provisions Playwright browser binaries, and executes non-destructive project validation.

.PARAMETER DryRun
    Simulate the setup process without installing software, altering files, or running commands.

.PARAMETER SkipValidation
    Skip post-installation validation commands (format check, typecheck, lint, test).

.PARAMETER SkipExtensions
    Skip automated detection and installation of IDE / Antigravity extensions.

.PARAMETER SkipPlaywright
    Skip checking or installing Playwright browser binaries.

.EXAMPLE
    .\setup-dev.ps1
    Full idempotent setup and validation.

.EXAMPLE
    .\setup-dev.ps1 -DryRun
    Preview all planned actions and tool checks without modifying the system.

.EXAMPLE
    .\setup-dev.ps1 -SkipValidation
    Bootstrap environment and dependencies without executing the test and lint suites.
#>

[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$SkipValidation,
  [switch]$SkipExtensions,
  [switch]$SkipPlaywright,
  [switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Ensure working directory is the repository root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# --- Output Styling Helpers ---
function Write-Step {
  param([string]$Message)
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "  [OK] " -NoNewline -ForegroundColor Green
  Write-Host $Message
}

function Write-Info {
  param([string]$Message)
  Write-Host "  [INFO] " -NoNewline -ForegroundColor Blue
  Write-Host $Message
}

function Write-Check {
  param([string]$Message)
  Write-Host "  [CHECK] " -NoNewline -ForegroundColor Gray
  Write-Host $Message
}

function Write-Install {
  param([string]$Message)
  Write-Host "  [INSTALL] " -NoNewline -ForegroundColor Magenta
  Write-Host $Message
}

function Write-Warn {
  param([string]$Message)
  Write-Host "  [WARN] " -NoNewline -ForegroundColor Yellow
  Write-Host $Message
}

function Write-Err {
  param([string]$Message)
  Write-Host "  [ERROR] " -NoNewline -ForegroundColor Red
  Write-Host $Message
}

function Test-CommandAvailable {
  param([string]$CommandName)
  $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
  return ($null -ne $cmd)
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# --- State Tracking for Final Summary ---
$Summary = [ordered]@{
  'Git'            = 'PENDING'
  'Node.js'        = 'PENDING'
  'pnpm'           = 'PENDING'
  'Dependencies'   = 'PENDING'
  'IDE Extensions' = 'PENDING'
  'Environment'    = 'PENDING'
  'Git Hooks'      = 'PENDING'
  'Agent Config'   = 'PENDING'
  'Playwright'     = 'PENDING'
  'Docker / DB'    = 'PENDING'
  'Format'         = 'SKIPPED'
  'Typecheck'      = 'SKIPPED'
  'Lint'           = 'SKIPPED'
  'Tests'          = 'SKIPPED'
}

# --- 1. Parse Project Requirements ---
Write-Step "Reading Project Configuration"

if (-not (Test-Path "package.json")) {
  Write-Err "Could not find root package.json. Run this script from the FamilieTools workspace root."
  exit 1
}

$RootPkg = Get-Content -Raw "package.json" | ConvertFrom-Json
$RequiredNodeEngine = if ($RootPkg.PSObject.Properties['engines'] -and $RootPkg.engines.PSObject.Properties['node']) {
  $RootPkg.engines.node
} else {
  ">=22.0.0"
}

$ExpectedPnpmVersion = if ($RootPkg.PSObject.Properties['packageManager']) {
  $RootPkg.packageManager -replace '^pnpm@', ''
} else {
  "12.4.2"
}

Write-Info "Node.js engine requirement : $RequiredNodeEngine"
Write-Info "Target pnpm version        : $ExpectedPnpmVersion"

# Extract minimum version number from requirement like ">=22.23.2"
$MinNodeVersionStr = "22.0.0"
if ($RequiredNodeEngine -match '(\d+\.\d+\.\d+)') {
  $MinNodeVersionStr = $Matches[1]
}
$MinNodeVersion = [System.Version]$MinNodeVersionStr

# --- 2. System Tool Verification & Installation ---
Write-Step "Checking System Prerequisites"

# Winget availability
$HasWinget = Test-CommandAvailable "winget"
if ($HasWinget) {
  $WingetVer = (& winget --version 2>$null) | Out-String
  Write-Ok "winget available ($($WingetVer.Trim()))"
} else {
  Write-Warn "winget is not available on this system. Automated tool installation fallbacks will require manual download."
}

# Git
if (Test-CommandAvailable "git") {
  $GitVer = (& git --version 2>$null) | Out-String
  $Summary['Git'] = "OK ($($GitVer.Trim()))"
  Write-Ok $GitVer.Trim()
} else {
  Write-Warn "Git is missing!"
  if ($DryRun) {
    Write-Info "[DRY-RUN] Would install Git via winget: winget install --id Git.Git -e --source winget"
    $Summary['Git'] = "DRY-RUN (missing)"
  } else {
    if ($HasWinget) {
      Write-Install "Installing Git via winget..."
      & winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
      if (Test-CommandAvailable "git") {
        $Summary['Git'] = "OK (installed)"
        Write-Ok "Git installed successfully."
      } else {
        Write-Err "Git was installed but is not yet in the current terminal PATH. Please restart PowerShell."
        $Summary['Git'] = "NEEDS RESTART"
        exit 1
      }
    } else {
      Write-Err "Please install Git manually from https://git-scm.com/download/win and rerun setup."
      $Summary['Git'] = "MISSING"
      exit 1
    }
  }
}

# Node.js
$NodeNeedsInstall = $false
if (Test-CommandAvailable "node") {
  $CurrentNodeRaw = (& node -v 2>$null) | Out-String
  $CurrentNodeClean = $CurrentNodeRaw.Trim().TrimStart('v')
  try {
    $CurrentNodeVersion = [System.Version]$CurrentNodeClean
    if ($CurrentNodeVersion -ge $MinNodeVersion) {
      Write-Ok "Node.js v$CurrentNodeClean satisfies requirement $RequiredNodeEngine"
      $Summary['Node.js'] = "OK (v$CurrentNodeClean)"
    } else {
      Write-Warn "Node.js v$CurrentNodeClean is older than required ($RequiredNodeEngine)"
      $NodeNeedsInstall = $true
    }
  } catch {
    Write-Warn "Could not parse current Node version '$CurrentNodeClean'. Will proceed with caution."
    $Summary['Node.js'] = "v$CurrentNodeClean"
  }
} else {
  Write-Warn "Node.js is not installed."
  $NodeNeedsInstall = $true
}

if ($NodeNeedsInstall) {
  if ($DryRun) {
    Write-Info "[DRY-RUN] Would install Node.js 22 LTS via winget: winget install --id OpenJS.NodeJS.LTS -e"
    $Summary['Node.js'] = "DRY-RUN (upgrade/install needed)"
  } else {
    if ($HasWinget) {
      Write-Install "Installing Node.js 22 LTS via winget..."
      & winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
      Write-Warn "Node.js installed. If PATH has not updated in this session, please restart your terminal."
      if (Test-CommandAvailable "node") {
        $NewNodeRaw = (& node -v 2>$null) | Out-String
        $Summary['Node.js'] = "OK ($($NewNodeRaw.Trim()))"
      } else {
        $Summary['Node.js'] = "NEEDS RESTART"
        Write-Err "Node.js was installed. Please restart your PowerShell session and run .\setup-dev.ps1 again."
        exit 1
      }
    } else {
      Write-Err "Please download and install Node.js 22.x LTS manually from https://nodejs.org/ and rerun setup."
      $Summary['Node.js'] = "MISSING"
      exit 1
    }
  }
}

# Corepack & pnpm
Write-Step "Configuring Package Manager (pnpm)"

$PnpmReady = $false
if (Test-CommandAvailable "pnpm") {
  $CurrentPnpm = (& pnpm -v 2>$null) | Out-String
  $CurrentPnpmClean = $CurrentPnpm.Trim()
  if ($CurrentPnpmClean -eq $ExpectedPnpmVersion) {
    Write-Ok "pnpm $CurrentPnpmClean matches required version $ExpectedPnpmVersion"
    $PnpmReady = $true
    $Summary['pnpm'] = "OK ($CurrentPnpmClean)"
  } else {
    Write-Info "Current pnpm is $CurrentPnpmClean, target is $ExpectedPnpmVersion"
  }
}

if (-not $PnpmReady) {
  if (Test-CommandAvailable "corepack") {
    Write-Check "Configuring pnpm $ExpectedPnpmVersion via Corepack..."
    if ($DryRun) {
      Write-Info "[DRY-RUN] Would run: corepack enable"
      Write-Info "[DRY-RUN] Would run: corepack prepare pnpm@$ExpectedPnpmVersion --activate"
      $Summary['pnpm'] = "DRY-RUN (via Corepack)"
    } else {
      try {
        & corepack enable 2>$null
        & corepack prepare "pnpm@$ExpectedPnpmVersion" --activate
        $ActivatedPnpm = (& pnpm -v 2>$null) | Out-String
        Write-Ok "pnpm successfully configured via Corepack: $($ActivatedPnpm.Trim())"
        $Summary['pnpm'] = "OK ($($ActivatedPnpm.Trim()))"
      } catch {
        Write-Warn "Corepack activation encountered an issue: $_"
      }
    }
  } else {
    Write-Warn "Corepack not found. Attempting pnpm installation via npm..."
    if ($DryRun) {
      Write-Info "[DRY-RUN] Would run: npm install -g pnpm@$ExpectedPnpmVersion"
      $Summary['pnpm'] = "DRY-RUN (via npm)"
    } else {
      & npm install -g "pnpm@$ExpectedPnpmVersion"
      $Summary['pnpm'] = "OK (installed via npm)"
    }
  }
}

# --- 3. Workspace Dependency Installation ---
Write-Step "Installing Dependencies"

if ($DryRun) {
  Write-Info "[DRY-RUN] Would run: pnpm install --frozen-lockfile"
  $Summary['Dependencies'] = "DRY-RUN"
} else {
  Write-Check "Running 'pnpm install --frozen-lockfile'..."
  try {
    & pnpm install --frozen-lockfile
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "Workspace dependencies installed successfully."
      $Summary['Dependencies'] = "OK"
    } else {
      Write-Warn "Frozen lockfile install failed. Attempting non-frozen 'pnpm install'..."
      & pnpm install
      if ($LASTEXITCODE -eq 0) {
        Write-Ok "Workspace dependencies installed."
        $Summary['Dependencies'] = "OK (unfrozen)"
      } else {
        Write-Err "pnpm install failed with exit code $LASTEXITCODE."
        $Summary['Dependencies'] = "FAILED"
      }
    }
  } catch {
    Write-Err "Error executing pnpm install: $_"
    $Summary['Dependencies'] = "FAILED"
  }
}

# --- 4. Environment Files Setup ---
Write-Step "Configuring Environment Variables"

# apps/api/.env
$ApiEnvPath = "apps/api/.env"
$ApiEnvExamplePath = "apps/api/.env.example"

if (Test-Path $ApiEnvPath) {
  Write-Ok "Existing environment file found at '$ApiEnvPath' (preserved, will not overwrite)."
  $Summary['Environment'] = "OK (configured)"
} else {
  if (Test-Path $ApiEnvExamplePath) {
    if ($DryRun) {
      Write-Info "[DRY-RUN] Would create '$ApiEnvPath' from '$ApiEnvExamplePath' with default local dev credentials."
      $Summary['Environment'] = "DRY-RUN (needs creation)"
    } else {
      Write-Check "Creating '$ApiEnvPath' from '$ApiEnvExamplePath'..."
      $ExampleContent = Get-Content $ApiEnvExamplePath -Raw
      # Replace CHANGE_ME with default local development password matching compose.dev.yaml
      $DevContent = $ExampleContent -replace 'CHANGE_ME', 'familietools_dev'
      Set-Content -Path $ApiEnvPath -Value $DevContent -Encoding UTF8
      Write-Ok "Created '$ApiEnvPath' with local development database defaults."
      Write-Info "Note: You can configure PLATFORM_OWNER_USER_ID in '$ApiEnvPath' if needed."
      $Summary['Environment'] = "OK (created from example)"
    }
  } else {
    Write-Warn "No .env.example found in apps/api."
    $Summary['Environment'] = "WARN (no template)"
  }
}

# Verify .gitignore covers .env
if (Test-Path ".gitignore") {
  $GitignoreContent = Get-Content ".gitignore" -Raw
  if ($GitignoreContent -match '\.env') {
    Write-Ok ".gitignore correctly protects .env files from being committed."
  } else {
    Write-Warn "CRITICAL: .gitignore does not appear to ignore .env files! Please review .gitignore."
  }
}

# --- 5. Antigravity Agent Configuration ---
Write-Step "Checking Antigravity Agent Configuration"

$ExpectedRules = @(
  '.agents/rules/access-control.md',
  '.agents/rules/core-services.md',
  '.agents/rules/design-system.md',
  '.agents/rules/project.md'
)

$AllRulesPresent = $true
foreach ($rule in $ExpectedRules) {
  if (Test-Path $rule) {
    Write-Ok "Agent rule verified: $rule"
  } else {
    Write-Warn "Missing agent rule file: $rule"
    $AllRulesPresent = $false
  }
}

if ($AllRulesPresent) {
  Write-Ok "All project-specific AI instructions and architectural rules are intact."
  $Summary['Agent Config'] = "OK"
} else {
  $Summary['Agent Config'] = "PARTIAL"
}

# --- 6. Code Generation & SvelteKit Types ---
Write-Step "Generating Types & Tooling Artifacts"

if ($DryRun) {
  Write-Info "[DRY-RUN] Would run: pnpm --filter ./apps/web run prepare (svelte-kit sync)"
  $Summary['Git Hooks'] = "DRY-RUN"
} else {
  Write-Check "Synchronizing SvelteKit types (svelte-kit sync)..."
  try {
    & pnpm --filter ./apps/web run prepare
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "SvelteKit types synchronized."
      $Summary['Git Hooks'] = "OK"
    } else {
      Write-Warn "svelte-kit sync exited with code $LASTEXITCODE."
      $Summary['Git Hooks'] = "WARN"
    }
  } catch {
    Write-Warn "Could not run svelte-kit sync: $_"
    $Summary['Git Hooks'] = "WARN"
  }
}

# --- 7. Playwright Browser Provisioning ---
Write-Step "Checking Playwright Browsers"

if ($SkipPlaywright) {
  Write-Info "Skipping Playwright check (-SkipPlaywright specified)."
  $Summary['Playwright'] = "SKIPPED"
} else {
  $PlaywrightCacheDir = "$env:LOCALAPPDATA\ms-playwright"
  $HasChromium = $false
  if (Test-Path $PlaywrightCacheDir) {
    $ChromiumDirs = @(Get-ChildItem -Path $PlaywrightCacheDir -Filter "chromium-*" -Directory -ErrorAction SilentlyContinue)
    if ($ChromiumDirs.Count -gt 0) {
      $HasChromium = $true
    }
  }

  if ($HasChromium) {
    Write-Ok "Playwright Chromium browser binary already installed ($PlaywrightCacheDir)."
    $Summary['Playwright'] = "OK"
  } else {
    Write-Info "Playwright Chromium binary not found. Provisioning for apps/web..."
    if ($DryRun) {
      Write-Info "[DRY-RUN] Would run: pnpm --filter ./apps/web exec playwright install chromium"
      $Summary['Playwright'] = "DRY-RUN (missing)"
    } else {
      try {
        & pnpm --filter ./apps/web exec playwright install chromium
        if ($LASTEXITCODE -eq 0) {
          Write-Ok "Playwright Chromium installed successfully."
          $Summary['Playwright'] = "OK (installed)"
        } else {
          Write-Warn "Playwright browser installation exited with code $LASTEXITCODE."
          $Summary['Playwright'] = "WARN"
        }
      } catch {
        Write-Warn "Playwright browser installation failed: $_"
        $Summary['Playwright'] = "WARN"
      }
    }
  }
}

# --- 8. IDE & Antigravity Extensions ---
Write-Step "Checking IDE / Antigravity Extensions"

function Find-EditorCli {
  # 1. Antigravity CLI in PATH
  $candidates = @('antigravity-ide', 'antigravity', 'agy')
  foreach ($name in $candidates) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($null -ne $cmd) {
      return @{ Type = 'Antigravity'; Path = $cmd.Source }
    }
  }

  # 2. Known Antigravity installation locations
  $knownAntigravityPaths = @(
    "$env:LOCALAPPDATA\Programs\Antigravity IDE\bin\antigravity-ide.cmd",
    "$env:LOCALAPPDATA\Programs\Antigravity IDE\bin\antigravity-ide.exe",
    "$env:ProgramFiles\Antigravity IDE\bin\antigravity-ide.cmd",
    "$env:ProgramFiles\Antigravity IDE\bin\antigravity-ide.exe",
    "$env:LOCALAPPDATA\Programs\Antigravity\bin\antigravity.cmd"
  )
  foreach ($p in $knownAntigravityPaths) {
    if (Test-Path $p) {
      return @{ Type = 'Antigravity'; Path = $p }
    }
  }

  # 3. Fallback to VS Code CLI
  $codeCmd = Get-Command 'code' -ErrorAction SilentlyContinue
  if ($null -ne $codeCmd) {
    return @{ Type = 'VSCode'; Path = $codeCmd.Source }
  }

  $knownCodePaths = @(
    "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd",
    "$env:ProgramFiles\Microsoft VS Code\bin\code.cmd",
    "$env:ProgramFiles(x86)\Microsoft VS Code\bin\code.cmd"
  )
  foreach ($p in $knownCodePaths) {
    if (Test-Path $p) {
      return @{ Type = 'VSCode'; Path = $p }
    }
  }

  return $null
}

if ($SkipExtensions) {
  Write-Info "Skipping IDE extension installation (-SkipExtensions specified)."
  $Summary['IDE Extensions'] = "SKIPPED"
} else {
  $EditorCli = Find-EditorCli

  $RecommendedExtensions = @()
  if (Test-Path ".vscode/extensions.json") {
    try {
      $ExtConfig = Get-Content -Raw ".vscode/extensions.json" | ConvertFrom-Json
      if ($ExtConfig.PSObject.Properties['recommendations']) {
        $RecommendedExtensions = @($ExtConfig.recommendations)
      }
    } catch {
      Write-Warn "Could not parse .vscode/extensions.json: $_"
    }
  }

  if ($null -ne $EditorCli) {
    Write-Ok "Found $($EditorCli.Type) CLI: $($EditorCli.Path)"
    
    # Query installed extensions
    $InstalledRaw = @()
    try {
      $InstalledRaw = & $EditorCli.Path --list-extensions 2>$null
    } catch {
      $InstalledRaw = @()
    }
    
    # Clean output list (exclude log lines)
    $InstalledExtensions = @($InstalledRaw | Where-Object { $_ -match '^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$' })

    foreach ($ext in $RecommendedExtensions) {
      $alreadyInstalled = $InstalledExtensions -contains $ext
      if ($alreadyInstalled) {
        Write-Ok "Extension already installed: $ext"
      } else {
        if ($DryRun) {
          Write-Info "[DRY-RUN] Would install extension: $ext"
        } else {
          Write-Install "Installing extension: $ext..."
          try {
            & $EditorCli.Path --install-extension $ext 2>$null
            Write-Ok "Installed: $ext"
          } catch {
            Write-Warn "Failed to install extension $ext : $_"
          }
        }
      }
    }
    $Summary['IDE Extensions'] = if ($DryRun) { "DRY-RUN ($($RecommendedExtensions.Count) extensions)" } else { "OK ($($EditorCli.Type))" }
  } else {
    Write-Warn "Neither Antigravity CLI nor VS Code CLI found on PATH or standard directories."
    Write-Info "Recommended extensions can be installed manually:"
    foreach ($ext in $RecommendedExtensions) {
      Write-Host "    - $ext" -ForegroundColor Gray
    }
    $Summary['IDE Extensions'] = "SKIPPED (no CLI)"
  }
}

# --- 9. Docker & Database Status ---
Write-Step "Checking Docker & Database Status"

$DockerAvailable = Test-CommandAvailable "docker"
if ($DockerAvailable) {
  $DockerVersionRaw = (& docker --version 2>$null) | Out-String
  Write-Ok "Docker CLI available: $($DockerVersionRaw.Trim())"

  # Check if docker daemon is running
  $DaemonRunning = $false
  try {
    $null = & docker info --format '{{.ServerVersion}}' 2>$null
    if ($LASTEXITCODE -eq 0) {
      $DaemonRunning = $true
    }
  } catch {
    $DaemonRunning = $false
  }

  if ($DaemonRunning) {
    Write-Ok "Docker daemon is running."
    
    # Check if familietools-postgres-dev container is running
    $ContainerRunning = $false
    try {
      $ContainerStatus = & docker ps --filter "name=familietools-postgres-dev" --format "{{.Status}}" 2>$null
      if ($ContainerStatus -match 'Up') {
        $ContainerRunning = $true
        Write-Ok "Local development PostgreSQL container is running: $ContainerStatus"
        $Summary['Docker / DB'] = "RUNNING (healthy)"
      }
    } catch {
      $ContainerRunning = $false
    }

    if (-not $ContainerRunning) {
      Write-Info "Local PostgreSQL container 'familietools-postgres-dev' is currently stopped."
      Write-Info "To start the local database, run:"
      Write-Host "    docker compose -f compose.dev.yaml up -d" -ForegroundColor Yellow
      Write-Info "To apply database migrations, run:"
      Write-Host "    pnpm --filter ./apps/api exec drizzle-kit migrate" -ForegroundColor Yellow
      $Summary['Docker / DB'] = "STOPPED (optional)"
    }
  } else {
    Write-Info "Docker Desktop / daemon is not running."
    Write-Info "Docker is optional for unit testing and UI development, but needed to run the local PostgreSQL database."
    $Summary['Docker / DB'] = "DAEMON STOPPED (optional)"
  }
} else {
  Write-Info "Docker is not installed."
  Write-Info "Docker is optional for initial setup. When you need a local PostgreSQL database, install Docker Desktop or run PostgreSQL natively."
  $Summary['Docker / DB'] = "NOT INSTALLED (optional)"
}

# --- 10. Project Validation ---
Write-Step "Project Validation Gates"

if ($SkipValidation) {
  Write-Info "Skipping project validation (-SkipValidation specified)."
} elseif ($DryRun) {
  Write-Info "[DRY-RUN] Would execute validation suite:"
  Write-Info "    1. pnpm format:check"
  Write-Info "    2. pnpm typecheck"
  Write-Info "    3. pnpm lint"
  Write-Info "    4. pnpm test"
  $Summary['Format'] = "DRY-RUN"
  $Summary['Typecheck'] = "DRY-RUN"
  $Summary['Lint'] = "DRY-RUN"
  $Summary['Tests'] = "DRY-RUN"
} else {
  # 1. Format Check
  Write-Check "Checking code formatting (pnpm format:check)..."
  try {
    & pnpm format:check
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "Formatting passed."
      $Summary['Format'] = "PASS"
    } else {
      Write-Warn "Formatting check failed (run 'pnpm format' to fix)."
      $Summary['Format'] = "FAIL"
    }
  } catch {
    Write-Warn "Format check failed: $_"
    $Summary['Format'] = "FAIL"
  }

  # 2. Typecheck
  Write-Check "Checking TypeScript types (pnpm typecheck)..."
  try {
    & pnpm typecheck
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "Typecheck passed."
      $Summary['Typecheck'] = "PASS"
    } else {
      Write-Warn "Typecheck reported errors."
      $Summary['Typecheck'] = "FAIL"
    }
  } catch {
    Write-Warn "Typecheck failed: $_"
    $Summary['Typecheck'] = "FAIL"
  }

  # 3. Lint
  Write-Check "Running linters (pnpm lint)..."
  try {
    & pnpm lint
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "Linting passed."
      $Summary['Lint'] = "PASS"
    } else {
      Write-Warn "Lint reported errors."
      $Summary['Lint'] = "FAIL"
    }
  } catch {
    Write-Warn "Lint failed: $_"
    $Summary['Lint'] = "FAIL"
  }

  # 4. Tests
  Write-Check "Running test suite (pnpm test)..."
  try {
    & pnpm test
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "All unit, package, and component tests passed."
      $Summary['Tests'] = "PASS"
    } else {
      Write-Warn "Some tests failed."
      $Summary['Tests'] = "FAIL"
    }
  } catch {
    Write-Warn "Test execution failed: $_"
    $Summary['Tests'] = "FAIL"
  }
}

# --- 11. Final Summary & Next Steps ---
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "        FamilieTools Development Setup Summary         " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

foreach ($entry in $Summary.GetEnumerator()) {
  $key = $entry.Key.PadRight(18)
  $val = $entry.Value
  
  $color = [ConsoleColor]::White
  if ($val -like '*OK*' -or $val -eq 'PASS' -or $val -like '*RUNNING*') {
    $color = [ConsoleColor]::Green
  } elseif ($val -like '*DRY-RUN*' -or $val -like '*SKIPPED*' -or $val -like '*optional*' -or $val -eq 'PARTIAL') {
    $color = [ConsoleColor]::Yellow
  } elseif ($val -like '*FAIL*' -or $val -like '*MISSING*' -or $val -like '*NEEDS RESTART*') {
    $color = [ConsoleColor]::Red
  }
  
  Write-Host "  $key : " -NoNewline
  Write-Host "$val" -ForegroundColor $color
}
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

Write-Host "`nNext Steps for Local Development:" -ForegroundColor White
Write-Host "  1. Start Local Database (PostgreSQL):" -ForegroundColor Gray
Write-Host "     docker compose -f compose.dev.yaml up -d`n" -ForegroundColor Yellow

Write-Host "  2. Apply Database Migrations:" -ForegroundColor Gray
Write-Host "     pnpm --filter ./apps/api exec drizzle-kit migrate`n" -ForegroundColor Yellow

Write-Host "  3. Start Development Servers (API + Web):" -ForegroundColor Gray
Write-Host "     pnpm dev" -ForegroundColor Yellow
Write-Host "     (or in Antigravity: Run Task -> 'FamilieTools: Start All')`n" -ForegroundColor Gray

Write-Host "  Web application: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  API server:      http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "  API Docs (OAS):  http://localhost:3000/api/docs`n" -ForegroundColor Cyan
