<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  import { Blocks, Gauge, Palette, Settings, Users, UsersRound, Activity } from '@lucide/svelte';

  const navigation = [
    {
      label: 'Overview',
      items: [
        {
          label: 'Dashboard',
          href: resolve('/admin'),
          icon: Gauge,
        },
      ],
    },
    {
      label: 'Management',
      items: [
        {
          label: 'Users',
          href: resolve('/admin/users'),
          icon: Users,
        },
        {
          label: 'Families',
          href: resolve('/admin/families'),
          icon: UsersRound,
        },
        {
          label: 'Modules',
          href: resolve('/admin/modules'),
          icon: Blocks,
        },
      ],
    },
    {
      label: 'Customization',
      items: [
        {
          label: 'Themes',
          href: resolve('/admin/themes'),
          icon: Palette,
        },
      ],
    },
    {
      label: 'System',
      items: [
        {
          label: 'Settings',
          href: resolve('/admin/settings'),
          icon: Settings,
        },
        {
          label: 'System',
          href: resolve('/admin/system'),
          icon: Activity,
        },
      ],
    },
  ];

  function isActive(href: string) {
    return page.url.pathname === href;
  }
</script>

<aside class="sidebar">
  <div class="brand">
    <div class="brand__mark">F</div>

    <div class="brand__text">
      <strong>FamilieTools</strong>
      <span>Server Administration</span>
    </div>
  </div>

  <nav class="navigation">
    {#each navigation as group (group.label)}
      <div class="navigation__group">
        <div class="navigation__label">
          {group.label}
        </div>

        <div class="navigation__items">
          {#each group.items as item (item.href)}
            <a
              class="navigation__item"
              class:navigation__item--active={isActive(item.href)}
              href={item.href}
            >
              <item.icon size={18} strokeWidth={1.8} />

              <span>{item.label}</span>
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </nav>

  <div class="sidebar__bottom">
    <div class="server-status">
      <span class="server-status__dot"></span>

      <div>
        <strong>Server online</strong>
        <span>All systems operational</span>
      </div>
    </div>
  </div>
</aside>

<style>
  :global(html) {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    width: 100%;
    min-width: 320px;
    min-height: 100%;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(*::before),
  :global(*::after) {
    box-sizing: border-box;
  }

  .sidebar,
  .sidebar * {
    box-sizing: border-box;
  }

  .sidebar {
    position: sticky;
    top: 0;

    width: 100%;
    height: 100dvh;
    min-height: 0;

    box-sizing: border-box;

    display: flex;
    flex-direction: column;

    padding: 1rem;
    border-right: 1px solid var(--admin-sidebar-border);

    background: var(--admin-sidebar);
    color: var(--admin-sidebar-text);

    overflow: hidden;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.25rem 0.5rem 1.75rem;
  }

  .brand__mark {
    width: 2.5rem;
    height: 2.5rem;
    display: grid;
    place-items: center;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    box-shadow: 0 6px 16px rgb(37 99 235 / 0.3);
    color: white;
    font-weight: 800;
  }

  .brand__text {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .brand__text strong {
    color: white;
    font-size: 0.95rem;
  }

  .brand__text span {
    margin-top: 0.15rem;
    color: var(--admin-sidebar-muted);
    font-size: 0.7rem;
  }

  .navigation {
    min-height: 0;
    flex: 1;

    display: flex;
    flex-direction: column;
    gap: 1.15rem;

    overflow-y: auto;
    overflow-x: hidden;

    padding-right: 0.15rem;
  }

  .navigation__group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .navigation__label {
    padding: 0 0.65rem;
    color: var(--admin-sidebar-muted);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .navigation__items {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .navigation__item {
    min-height: 2.4rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 0.75rem;
    border-radius: 0.65rem;
    color: var(--admin-sidebar-text);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition:
      background 120ms ease,
      color 120ms ease,
      transform 120ms ease;
  }

  .navigation__item:hover {
    background: var(--admin-sidebar-surface);
    color: white;
  }

  .navigation__item--active {
    background: #1e293b;
    color: white;
    box-shadow: inset 3px 0 0 #3b82f6;
  }

  .sidebar__bottom {
    flex-shrink: 0;

    margin-top: 1rem;
    padding-top: 1rem;

    border-top: 1px solid var(--admin-sidebar-border);
  }

  .server-status {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.65rem;
    border-radius: 0.75rem;
    background: rgb(255 255 255 / 0.035);
  }

  .server-status__dot {
    width: 0.55rem;
    height: 0.55rem;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgb(34 197 94 / 0.12);
  }

  .server-status div {
    display: flex;
    flex-direction: column;
  }

  .server-status strong {
    color: #f8fafc;
    font-size: 0.75rem;
  }

  .server-status span:last-child {
    margin-top: 0.1rem;
    color: var(--admin-sidebar-muted);
    font-size: 0.65rem;
  }

  @media (max-width: 900px) {
    .sidebar {
      position: static;
      height: auto;
    }
  }
</style>

