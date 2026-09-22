<script lang="ts">
  import { onMount } from 'svelte';

  import {
    Blocks,
    FileArchive,
    Link2,
    MoreHorizontal,
    PackageOpen,
    Search,
    Store,
    Upload,
    X,
  } from '@lucide/svelte';

  import AdminCard from '$lib/admin/AdminCard.svelte';
  import StatusBadge from '$lib/admin/StatusBadge.svelte';
  import { apiClient } from '$lib/api/client';

  type ModuleDto = {
    id: string;
    moduleId: string;
    version: string;
    name: string;
    description: string | null;
    publisher: string;
    installationPath: string;
    packageSha256: string;
    installSource: string;
    manifest: Record<string, unknown>;
    isEnabled: boolean;
    installedAt: string;
    updatedAt: string;
  };

  let modules = $state<ModuleDto[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let openMenuId = $state<string | null>(null);
  let updatingModuleId = $state<string | null>(null);
  let actionError = $state<string | null>(null);

  let searchQuery = $state('');
  let filter = $state<'all' | 'enabled' | 'disabled'>('all');

  let showInstallDialog = $state(false);
  let selectedPackage = $state<File | null>(null);
  let installerMessage = $state<string | null>(null);

  function getModuleIcon() {
    return Blocks;
  }

  let enabledCount = $derived(modules.filter((module) => module.isEnabled).length);

  let filteredModules = $derived(
    modules.filter((module) => {
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        query.length === 0 ||
        module.name.toLowerCase().includes(query) ||
        module.moduleId.toLowerCase().includes(query) ||
        module.version.toLowerCase().includes(query) ||
        module.publisher.toLowerCase().includes(query) ||
        module.description?.toLowerCase().includes(query);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'enabled' && module.isEnabled) ||
        (filter === 'disabled' && !module.isEnabled);

      return matchesSearch && matchesFilter;
    }),
  );

  function openInstallDialog() {
    selectedPackage = null;
    installerMessage = null;
    actionError = null;
    openMenuId = null;
    showInstallDialog = true;
  }

  function closeInstallDialog() {
    showInstallDialog = false;
    selectedPackage = null;
    installerMessage = null;
  }

  function handlePackageSelection(
    event: Event & {
      currentTarget: HTMLInputElement;
    },
  ) {
    const file = event.currentTarget.files?.[0] ?? null;

    selectedPackage = file;
    installerMessage = null;
  }

  function installSelectedPackage() {
    if (!selectedPackage) {
      installerMessage = 'Select a module package first.';
      return;
    }

    installerMessage = 'The module installer backend is not connected yet.';
  }

  function getApiErrorMessage(apiError: unknown): string {
    if (typeof apiError === 'object' && apiError !== null && 'message' in apiError) {
      const message = (
        apiError as {
          message?: unknown;
        }
      ).message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) {
        return message.join(', ');
      }
    }

    return 'Unknown API error.';
  }

  async function loadModules() {
    loading = true;
    error = null;

    try {
      const { data, error: apiError } = await apiClient.GET('/api/admin/modules', {});

      if (apiError || !data) {
        throw new Error(getApiErrorMessage(apiError));
      }

      modules = data as ModuleDto[];
    } catch (cause) {
      console.error('Failed to load modules', cause);

      error = 'Modules could not be loaded.';
    } finally {
      loading = false;
    }
  }

  function toggleMenu(moduleId: string) {
    openMenuId = openMenuId === moduleId ? null : moduleId;

    actionError = null;
  }

  async function setModuleEnabled(module: ModuleDto, isEnabled: boolean) {
    updatingModuleId = module.id;
    actionError = null;

    try {
      const { error: apiError } = await apiClient.PATCH('/api/admin/modules/{id}/enabled', {
        params: {
          path: {
            id: module.id,
          },
        },
        body: {
          enabled: isEnabled,
        },
      });

      if (apiError) {
        throw new Error(getApiErrorMessage(apiError));
      }

      openMenuId = null;

      await loadModules();
    } catch (cause) {
      console.error('Failed to update module status', cause);

      actionError = cause instanceof Error ? cause.message : 'Module status could not be updated.';
    } finally {
      updatingModuleId = null;
    }
  }

  onMount(() => {
    void loadModules();

    function handleDocumentClick(event: MouseEvent) {
      if (!openMenuId) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        openMenuId = null;
        return;
      }

      if (target.closest('.module-menu')) {
        return;
      }

      openMenuId = null;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      if (showInstallDialog) {
        closeInstallDialog();
        return;
      }

      openMenuId = null;
    }

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<svelte:head>
  <title>Modules | FamilieTools Administration</title>
</svelte:head>

<div class="modules-page">
  <section class="page-header">
    <div>
      <span class="page-header__eyebrow">Platform configuration</span>

      <h1>Modules</h1>

      <p>
        Manage the modules installed on this FamilieTools instance and control whether they are
        currently enabled.
      </p>
    </div>

    <button class="primary-button" type="button" onclick={openInstallDialog}>
      <PackageOpen size={17} strokeWidth={2} />
      <span>Install module</span>
    </button>
  </section>

  <section class="summary-grid">
    <AdminCard>
      <div class="summary-card">
        <div class="summary-card__icon">
          <Blocks size={19} strokeWidth={1.8} />
        </div>

        <div>
          <span>Installed modules</span>
          <strong>{modules.length}</strong>
        </div>
      </div>
    </AdminCard>

    <AdminCard>
      <div class="summary-card">
        <div class="summary-card__icon summary-card__icon--success">
          <span class="status-dot"></span>
        </div>

        <div>
          <span>Enabled</span>
          <strong>{enabledCount}</strong>
        </div>
      </div>
    </AdminCard>
  </section>

  <AdminCard>
    <div class="toolbar">
      <div class="toolbar__title">
        <div>
          <h2>Installed modules</h2>
          <p>View and manage module packages installed on this server.</p>
        </div>

        <StatusBadge label={`${enabledCount} active`} tone="success" />
      </div>

      <div class="toolbar__controls">
        <label class="search-box">
          <Search size={17} strokeWidth={1.8} />

          <input
            type="search"
            placeholder="Search modules..."
            aria-label="Search modules"
            bind:value={searchQuery}
          />
        </label>

        <select aria-label="Filter modules" bind:value={filter}>
          <option value="all">All modules</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {#if actionError}
        <div class="action-error">
          {actionError}
        </div>
      {/if}
    </div>

    <div class="module-list">
      {#if loading}
        <div class="state-message">Loading modules...</div>
      {:else if error}
        <div class="state-message state-message--error">
          <strong>{error}</strong>

          <button type="button" onclick={loadModules}>Try again</button>
        </div>
      {:else if modules.length === 0}
        <div class="state-message">No modules are installed.</div>
      {:else if filteredModules.length === 0}
        <div class="state-message">No modules match your search or filter.</div>
      {:else}
        {#each filteredModules as module (module.id)}
          {@const ModuleIcon = getModuleIcon()}

          <article class="module-row">
            <div class="module-row__identity">
              <div class="module-icon">
                <ModuleIcon size={20} strokeWidth={1.8} />
              </div>

              <div class="module-info">
                <div class="module-info__title">
                  <strong>{module.name}</strong>
                </div>

                <p>
                  {module.description ?? 'No description available.'}
                </p>

                <div class="module-info__metadata">
                  <code>{module.moduleId}</code>
                  <span>v{module.version}</span>
                </div>
              </div>
            </div>

            <div class="module-row__settings">
              <div class="setting-column">
                <span class="setting-column__label">Status</span>

                <StatusBadge
                  label={module.isEnabled ? 'Enabled' : 'Disabled'}
                  tone={module.isEnabled ? 'success' : 'neutral'}
                />
              </div>

              <div class="setting-column">
                <span class="setting-column__label">Publisher</span>

                <span class="module-detail">
                  {module.publisher}
                </span>
              </div>

              <div class="setting-column">
                <span class="setting-column__label">Source</span>

                <span class="module-detail">
                  {module.installSource}
                </span>
              </div>

              <div class="module-menu">
                <button
                  class="more-button"
                  class:more-button--active={openMenuId === module.id}
                  type="button"
                  aria-label={`More options for ${module.name}`}
                  aria-expanded={openMenuId === module.id}
                  onclick={() => toggleMenu(module.id)}
                >
                  <MoreHorizontal size={19} strokeWidth={1.8} />
                </button>

                {#if openMenuId === module.id}
                  <div class="module-menu__dropdown">
                    {#if module.isEnabled}
                      <button
                        class="module-menu__item"
                        type="button"
                        disabled={updatingModuleId === module.id}
                        onclick={() => setModuleEnabled(module, false)}
                      >
                        {#if updatingModuleId === module.id}
                          Updating...
                        {:else}
                          Disable module
                        {/if}
                      </button>
                    {:else}
                      <button
                        class="module-menu__item"
                        type="button"
                        disabled={updatingModuleId === module.id}
                        onclick={() => setModuleEnabled(module, true)}
                      >
                        {#if updatingModuleId === module.id}
                          Updating...
                        {:else}
                          Enable module
                        {/if}
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </AdminCard>

  {#if showInstallDialog}
    <div class="dialog-layer">
      <button
        class="dialog-backdrop"
        type="button"
        aria-label="Close module installer"
        onclick={closeInstallDialog}
      ></button>

      <div
        class="install-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-dialog-title"
        tabindex="-1"
      >
        <div class="install-dialog__header">
          <div>
            <span class="install-dialog__eyebrow">Module installer</span>

            <h2 id="install-dialog-title">Install module</h2>

            <p>Extend this FamilieTools instance with additional module packages.</p>
          </div>

          <button
            class="dialog-close"
            type="button"
            aria-label="Close dialog"
            onclick={closeInstallDialog}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div class="install-dialog__body">
          <section class="installer-option installer-option--active">
            <div class="installer-option__icon">
              <Upload size={21} strokeWidth={1.8} />
            </div>

            <div class="installer-option__content">
              <div>
                <strong>Upload module package</strong>

                <span class="available-label">Available</span>
              </div>

              <p>
                Install a module from a local FamilieTools
                <code>.ftmodule</code> package.
              </p>

              <label class="package-picker">
                <input type="file" accept=".ftmodule" onchange={handlePackageSelection} />

                <FileArchive size={18} strokeWidth={1.8} />

                <span>
                  {selectedPackage ? selectedPackage.name : 'Choose .ftmodule file'}
                </span>
              </label>

              {#if selectedPackage}
                <div class="selected-package">
                  <div>
                    <strong>{selectedPackage.name}</strong>

                    <span>
                      {(selectedPackage.size / 1024).toFixed(1)}
                      KB
                    </span>
                  </div>

                  <button
                    type="button"
                    onclick={() => {
                      selectedPackage = null;
                      installerMessage = null;
                    }}
                  >
                    Remove
                  </button>
                </div>
              {/if}
            </div>
          </section>

          <section class="installer-option installer-option--disabled">
            <div class="installer-option__icon">
              <Store size={21} strokeWidth={1.8} />
            </div>

            <div class="installer-option__content">
              <div>
                <strong>Module catalog</strong>

                <span class="coming-label">Coming later</span>
              </div>

              <p>Browse compatible modules published for FamilieTools.</p>
            </div>
          </section>

          <section class="installer-option installer-option--disabled">
            <div class="installer-option__icon">
              <Link2 size={21} strokeWidth={1.8} />
            </div>

            <div class="installer-option__content">
              <div>
                <strong>Install from URL</strong>

                <span class="coming-label">Coming later</span>
              </div>

              <p>Install a trusted module package from a remote source.</p>
            </div>
          </section>

          <div class="installer-info">
            <PackageOpen size={18} strokeWidth={1.8} />

            <div>
              <strong>Package validation</strong>

              <p>
                Before installation, FamilieTools will validate the package manifest, compatibility,
                dependencies, permissions and package integrity.
              </p>
            </div>
          </div>

          {#if installerMessage}
            <div class="installer-message">
              {installerMessage}
            </div>
          {/if}
        </div>

        <div class="install-dialog__footer">
          <button class="secondary-button" type="button" onclick={closeInstallDialog}>
            Cancel
          </button>

          <button
            class="primary-button"
            type="button"
            disabled={!selectedPackage}
            onclick={installSelectedPackage}
          >
            <PackageOpen size={16} strokeWidth={1.8} />
            Install package
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .modules-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    padding: 0.5rem 0 0.25rem;
  }

  .page-header__eyebrow {
    color: var(--admin-primary);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0.4rem 0 0;
    color: var(--admin-text);
    font-size: clamp(2rem, 3vw, 2.5rem);
    line-height: 1.05;
    letter-spacing: -0.045em;
  }

  .page-header p {
    max-width: 48rem;
    margin: 0.7rem 0 0;
    color: var(--admin-text-muted);
    font-size: 0.88rem;
    line-height: 1.55;
  }

  .primary-button {
    min-height: 2.6rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    flex-shrink: 0;
    padding: 0 0.95rem;
    border: 0;
    border-radius: 0.7rem;
    background: var(--admin-primary);
    box-shadow: 0 1px 2px rgb(16 24 40 / 0.08);
    color: white;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 650;
    cursor: pointer;
    transition:
      background 120ms ease,
      transform 120ms ease,
      opacity 120ms ease;
  }

  .primary-button:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  .primary-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .summary-card {
    min-height: 4.25rem;
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }

  .summary-card__icon {
    width: 2.5rem;
    height: 2.5rem;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    border-radius: 0.7rem;
    background: var(--admin-primary-soft);
    color: var(--admin-primary);
  }

  .summary-card__icon--success {
    background: #ecfdf3;
  }

  .status-dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgb(34 197 94 / 0.12);
  }

  .summary-card > div:last-child {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .summary-card span {
    color: var(--admin-text-muted);
    font-size: 0.7rem;
    font-weight: 500;
  }

  .summary-card strong {
    margin-top: 0.2rem;
    color: var(--admin-text);
    font-size: 1.25rem;
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding-bottom: 1rem;
  }

  .toolbar__title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .toolbar h2 {
    margin: 0;
    color: var(--admin-text);
    font-size: 0.95rem;
    letter-spacing: -0.02em;
  }

  .toolbar p {
    margin: 0.25rem 0 0;
    color: var(--admin-text-muted);
    font-size: 0.72rem;
  }

  .toolbar__controls {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .search-box {
    width: min(22rem, 100%);
    min-height: 2.45rem;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0 0.75rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.65rem;
    background: var(--admin-surface-subtle);
    color: var(--admin-text-muted);
  }

  .search-box:focus-within {
    border-color: #93b4f4;
    background: white;
    box-shadow: 0 0 0 3px rgb(37 99 235 / 0.08);
  }

  .search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--admin-text);
    font: inherit;
    font-size: 0.75rem;
  }

  .search-box input::placeholder {
    color: var(--admin-text-soft);
  }

  select {
    min-height: 2.45rem;
    padding: 0 2rem 0 0.75rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.65rem;
    background: var(--admin-surface);
    color: var(--admin-text);
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .action-error {
    padding: 0.7rem 0.85rem;
    border: 1px solid #fecaca;
    border-radius: 0.65rem;
    background: #fff7f7;
    color: #b42318;
    font-size: 0.72rem;
  }

  .module-list {
    display: flex;
    flex-direction: column;
    margin: 0 -1.25rem -1.25rem;
  }

  .module-row {
    min-height: 5rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 2rem;
    padding: 0.7rem 1.25rem;
    border-top: 1px solid var(--admin-border);
    transition: background 120ms ease;
  }

  .module-row:hover {
    background: #fbfcfe;
  }

  .module-row__identity {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
  }

  .module-icon {
    width: 2.6rem;
    height: 2.6rem;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    border: 1px solid #dce6f4;
    border-radius: 0.75rem;
    background: var(--admin-primary-soft);
    color: var(--admin-primary);
  }

  .module-info {
    min-width: 0;
  }

  .module-info__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .module-info__title strong {
    color: var(--admin-text);
    font-size: 0.82rem;
  }

  .module-info p {
    max-width: 42rem;
    margin: 0.2rem 0 0.3rem;
    color: var(--admin-text-muted);
    font-size: 0.7rem;
    line-height: 1.35;
  }

  .module-info__metadata {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .module-info code {
    padding: 0.18rem 0.4rem;
    border-radius: 0.35rem;
    background: #f1f5f9;
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.6rem;
  }

  .module-info__metadata span {
    color: var(--admin-text-soft);
    font-size: 0.62rem;
    font-weight: 600;
  }

  .module-row__settings {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .setting-column {
    min-width: 8.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .setting-column__label {
    color: var(--admin-text-soft);
    font-size: 0.6rem;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .module-detail {
    max-width: 12rem;
    overflow: hidden;
    color: var(--admin-text-muted);
    font-size: 0.68rem;
    font-weight: 550;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .module-menu {
    position: relative;
  }

  .more-button {
    width: 2.25rem;
    height: 2.25rem;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 0.6rem;
    background: transparent;
    color: var(--admin-text-muted);
    cursor: pointer;
    transition:
      background 120ms ease,
      color 120ms ease;
  }

  .more-button:hover,
  .more-button--active {
    background: var(--admin-surface-subtle);
    color: var(--admin-text);
  }

  .module-menu__dropdown {
    position: absolute;
    top: calc(100% + 0.35rem);
    right: 0;
    z-index: 30;
    width: 14rem;
    padding: 0.35rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.7rem;
    background: white;
    box-shadow:
      0 8px 24px rgb(15 23 42 / 0.08),
      0 2px 6px rgb(15 23 42 / 0.05);
  }

  .module-row:last-child .module-menu__dropdown {
    top: auto;
    bottom: calc(100% + 0.35rem);
  }

  .module-menu__item {
    width: 100%;
    min-height: 2.3rem;
    display: flex;
    align-items: center;
    padding: 0 0.65rem;
    border: 0;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--admin-text);
    font: inherit;
    font-size: 0.72rem;
    font-weight: 550;
    text-align: left;
    cursor: pointer;
  }

  .module-menu__item:hover:not(:disabled) {
    background: var(--admin-surface-subtle);
  }

  .module-menu__item:disabled {
    color: var(--admin-text-soft);
    cursor: not-allowed;
  }

  .state-message {
    min-height: 8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid var(--admin-border);
    color: var(--admin-text-muted);
    font-size: 0.78rem;
  }

  .state-message--error {
    flex-direction: column;
    color: #b42318;
  }

  .state-message button {
    min-height: 2.2rem;
    padding: 0 0.8rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.6rem;
    background: white;
    color: var(--admin-text);
    font: inherit;
    font-size: 0.72rem;
    cursor: pointer;
  }

  .dialog-layer {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 1.5rem;
  }

  .dialog-backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: rgb(15 23 42 / 0.38);
    backdrop-filter: blur(3px);
    cursor: default;
  }

  .install-dialog {
    position: relative;
    z-index: 1;
    width: min(100%, 40rem);
    max-height: calc(100dvh - 3rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--admin-border);
    border-radius: 1rem;
    background: white;
    box-shadow:
      0 24px 60px rgb(15 23 42 / 0.16),
      0 8px 24px rgb(15 23 42 / 0.08);
  }

  .install-dialog__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.25rem 1rem;
    border-bottom: 1px solid var(--admin-border);
  }

  .install-dialog__eyebrow {
    color: var(--admin-primary);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .install-dialog__header h2 {
    margin: 0.3rem 0 0;
    font-size: 1.2rem;
    letter-spacing: -0.03em;
  }

  .install-dialog__header p {
    margin: 0.3rem 0 0;
    color: var(--admin-text-muted);
    font-size: 0.72rem;
  }

  .dialog-close {
    width: 2rem;
    height: 2rem;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    border: 0;
    border-radius: 0.55rem;
    background: transparent;
    color: var(--admin-text-muted);
    cursor: pointer;
  }

  .dialog-close:hover {
    background: var(--admin-surface-subtle);
    color: var(--admin-text);
  }

  .install-dialog__body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    overflow-y: auto;
  }

  .installer-option {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    padding: 1rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.8rem;
  }

  .installer-option--active {
    background: white;
  }

  .installer-option--disabled {
    background: #fafbfc;
    opacity: 0.65;
  }

  .installer-option__icon {
    width: 2.5rem;
    height: 2.5rem;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    border-radius: 0.7rem;
    background: var(--admin-primary-soft);
    color: var(--admin-primary);
  }

  .installer-option__content {
    min-width: 0;
    flex: 1;
  }

  .installer-option__content > div:first-child {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .installer-option__content strong {
    font-size: 0.78rem;
  }

  .installer-option__content p {
    margin: 0.25rem 0 0;
    color: var(--admin-text-muted);
    font-size: 0.68rem;
    line-height: 1.45;
  }

  .installer-option__content code {
    padding: 0.1rem 0.3rem;
    border-radius: 0.3rem;
    background: #f1f5f9;
    color: #475569;
    font-size: 0.62rem;
  }

  .available-label,
  .coming-label {
    padding: 0.14rem 0.4rem;
    border-radius: 999px;
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.035em;
  }

  .available-label {
    background: #ecfdf3;
    color: #15803d;
  }

  .coming-label {
    background: #f1f5f9;
    color: #64748b;
  }

  .package-picker {
    min-height: 2.7rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.8rem;
    padding: 0 0.75rem;
    border: 1px dashed #cbd5e1;
    border-radius: 0.65rem;
    background: #f8fafc;
    color: var(--admin-text-muted);
    font-size: 0.7rem;
    cursor: pointer;
  }

  .package-picker:hover {
    border-color: #93b4f4;
    background: var(--admin-primary-soft);
    color: var(--admin-primary);
  }

  .package-picker input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .selected-package {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.65rem;
    padding: 0.6rem 0.7rem;
    border-radius: 0.6rem;
    background: #f8fafc;
  }

  .selected-package > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .selected-package strong {
    overflow: hidden;
    color: var(--admin-text);
    font-size: 0.68rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selected-package span {
    margin-top: 0.1rem;
    color: var(--admin-text-muted);
    font-size: 0.6rem;
  }

  .selected-package button {
    border: 0;
    background: transparent;
    color: #b42318;
    font: inherit;
    font-size: 0.65rem;
    cursor: pointer;
  }

  .installer-info {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    padding: 0.8rem;
    border-radius: 0.7rem;
    background: #f8fafc;
    color: var(--admin-text-muted);
  }

  .installer-info :global(svg) {
    flex-shrink: 0;
    margin-top: 0.05rem;
  }

  .installer-info strong {
    color: var(--admin-text);
    font-size: 0.7rem;
  }

  .installer-info p {
    margin: 0.2rem 0 0;
    font-size: 0.64rem;
    line-height: 1.45;
  }

  .installer-message {
    padding: 0.7rem 0.8rem;
    border: 1px solid #fed7aa;
    border-radius: 0.65rem;
    background: #fff7ed;
    color: #9a3412;
    font-size: 0.68rem;
  }

  .install-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--admin-border);
    background: #fbfcfe;
  }

  .secondary-button {
    min-height: 2.6rem;
    padding: 0 0.95rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.7rem;
    background: white;
    color: var(--admin-text);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }

  .secondary-button:hover {
    background: var(--admin-surface-subtle);
  }

  @media (max-width: 1000px) {
    .module-row {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .module-row__settings {
      padding-left: 3.5rem;
    }
  }

  @media (max-width: 700px) {
    .page-header {
      flex-direction: column;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .toolbar__controls {
      align-items: stretch;
      flex-direction: column;
    }

    .search-box {
      width: 100%;
    }

    .module-row__settings {
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      padding-left: 0;
    }

    .setting-column {
      min-width: 7rem;
    }
  }

  @media (max-width: 600px) {
    .installer-option {
      flex-direction: column;
    }
  }
</style>
