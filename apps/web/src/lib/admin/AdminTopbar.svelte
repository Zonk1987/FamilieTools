<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Bell, LogOut, Search } from '@lucide/svelte';

  import { logout } from '$lib/auth';

  let {
    user,
  }: {
    user: {
      loginName: string;
      displayName: string;
    };
  } = $props();

  let profileOpen = $state(false);
  let isLoggingOut = $state(false);

  const initials = $derived(
    user.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U',
  );

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    isLoggingOut = true;

    try {
      await logout();
      await goto(resolve('/login'));
    } finally {
      isLoggingOut = false;
    }
  }
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

      <div class="profile-menu">
        <button
          class="profile"
          type="button"
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          onclick={() => {
            profileOpen = !profileOpen;
          }}
        >
          <div class="profile__avatar">
            {initials}
          </div>

          <div class="profile__text">
            <strong>{user.displayName}</strong>
            <span>@{user.loginName}</span>
          </div>
        </button>

        {#if profileOpen}
          <div class="profile-dropdown" role="menu">
            <div class="profile-dropdown__header">
              <strong>{user.displayName}</strong>
              <span>@{user.loginName}</span>
            </div>

            <div class="profile-dropdown__divider"></div>

            <button
              class="logout-button"
              type="button"
              role="menuitem"
              disabled={isLoggingOut}
              onclick={handleLogout}
            >
              <LogOut size={16} strokeWidth={1.8} />

              <span>
                {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        {/if}
      </div>
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
  .profile,
  .logout-button {
    border: 0;
    font: inherit;
    cursor: pointer;
  }

  .icon-button {
    width: 2.4rem;
    height: 2.4rem;
    display: grid;
    place-items: center;
    border-radius: 0.65rem;
    background: transparent;
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

  .profile-menu {
    position: relative;
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.3rem;
    border-radius: 0.75rem;
    background: transparent;
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

  .profile-dropdown {
    position: absolute;
    top: calc(100% + 0.55rem);
    right: 0;
    width: 14rem;
    overflow: hidden;
    border: 1px solid var(--admin-border);
    border-radius: 0.8rem;
    background: white;
    box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 0.14);
  }

  .profile-dropdown__header {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.9rem 1rem;
  }

  .profile-dropdown__header strong {
    color: var(--admin-text);
    font-size: 0.82rem;
  }

  .profile-dropdown__header span {
    color: var(--admin-text-muted);
    font-size: 0.7rem;
  }

  .profile-dropdown__divider {
    height: 1px;
    background: var(--admin-border);
  }

  .logout-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    background: transparent;
    color: #b42318;
    font-size: 0.78rem;
    text-align: left;
  }

  .logout-button:hover:not(:disabled) {
    background: #fff3f2;
  }

  .logout-button:disabled {
    cursor: wait;
    opacity: 0.6;
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
