<script lang="ts">
  import { Bell, Search } from '@lucide/svelte';
</script>

<header class="topbar">
  <div class="topbar__inner">
    <div class="search">
      <Search size={17} strokeWidth={1.8} />

      <span>Search administration</span>

      <kbd>Ctrl K</kbd>
    </div>

    <div class="topbar__actions">
      <button class="icon-button" type="button" aria-label="Notifications">
        <Bell size={18} strokeWidth={1.8} />
      </button>

      <div class="divider"></div>

      <button class="profile" type="button">
        <div class="profile__avatar">SO</div>

        <div class="profile__text">
          <strong>Server Owner</strong>
          <span>Platform Owner</span>
        </div>
      </button>
    </div>
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid var(--admin-border);
    background: rgb(255 255 255 / 0.92);
    backdrop-filter: blur(12px);
  }

  .topbar__inner {
    min-height: 4.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0 1.5rem;
  }

  .search {
    width: min(24rem, 45vw);
    min-height: 2.4rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0 0.75rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.7rem;
    background: var(--admin-surface-subtle);
    color: var(--admin-text-muted);
    font-size: 0.8rem;
  }

  .search span {
    flex: 1;
  }

  kbd {
    padding: 0.15rem 0.4rem;
    border: 1px solid #d7dce3;
    border-radius: 0.35rem;
    background: white;
    color: #7b8493;
    font-family: inherit;
    font-size: 0.65rem;
  }

  .topbar__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .icon-button,
  .profile {
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }

  .icon-button {
    width: 2.4rem;
    height: 2.4rem;
    display: grid;
    place-items: center;
    border-radius: 0.65rem;
    color: var(--admin-text-muted);
  }

  .icon-button:hover {
    background: var(--admin-surface-subtle);
    color: var(--admin-text);
  }

  .divider {
    width: 1px;
    height: 1.8rem;
    background: var(--admin-border);
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.3rem;
    border-radius: 0.75rem;
    text-align: left;
  }

  .profile:hover {
    background: var(--admin-surface-subtle);
  }

  .profile__avatar {
    width: 2.25rem;
    height: 2.25rem;
    display: grid;
    place-items: center;
    border-radius: 0.65rem;
    background: #e8eef8;
    color: #334155;
    font-size: 0.7rem;
    font-weight: 800;
  }

  .profile__text {
    display: flex;
    flex-direction: column;
  }

  .profile__text strong {
    color: var(--admin-text);
    font-size: 0.78rem;
  }

  .profile__text span {
    margin-top: 0.1rem;
    color: var(--admin-text-muted);
    font-size: 0.65rem;
  }

  @media (max-width: 700px) {
    .profile__text,
    .search span,
    kbd {
      display: none;
    }

    .search {
      width: 2.4rem;
      padding: 0;
      justify-content: center;
    }
  }
</style>

