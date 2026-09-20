<script lang="ts">
  import {
    Activity,
    Blocks,
    Database,
    HardDrive,
    Plus,
    Settings,
    ShieldCheck,
    Users,
    UsersRound,
  } from 'lucide-svelte';

  import AdminCard from '$lib/admin/AdminCard.svelte';
  import StatusBadge from '$lib/admin/StatusBadge.svelte';

  const stats = [
    {
      label: 'Users',
      value: '3',
      description: 'Registered accounts',
      icon: Users,
    },
    {
      label: 'Families',
      value: '1',
      description: 'Active family',
      icon: UsersRound,
    },
    {
      label: 'Modules',
      value: '4 / 4',
      description: 'All modules available',
      icon: Blocks,
    },
    {
      label: 'Storage',
      value: '24.8 GB',
      description: '18% used',
      icon: HardDrive,
    },
  ];

  const health = [
    {
      label: 'API',
      detail: 'Responding normally',
      icon: Activity,
      status: 'Healthy',
    },
    {
      label: 'Database',
      detail: 'PostgreSQL connected',
      icon: Database,
      status: 'Connected',
    },
    {
      label: 'Authorization',
      detail: 'Platform capabilities loaded',
      icon: ShieldCheck,
      status: 'Ready',
    },
  ];

  const activities = [
    {
      title: 'Platform initialized',
      detail: 'FamilieTools setup completed successfully.',
      time: 'Today',
    },
    {
      title: 'System theme available',
      detail: 'FamilieTools Light is active as the default theme.',
      time: 'Today',
    },
    {
      title: 'Built-in modules registered',
      detail: 'Calendar, Shopping, Baby Tracking and Photos are available.',
      time: 'Today',
    },
  ];
</script>

<svelte:head>
  <title>Administration | FamilieTools</title>
</svelte:head>

<div class="dashboard">
  <section class="hero">
    <div>
      <span class="hero__eyebrow">Platform overview</span>

      <h1>Server administration</h1>

      <p>Monitor your FamilieTools instance and manage the core platform configuration.</p>
    </div>

    <div class="hero__status">
      <span class="hero__status-dot"></span>

      <div>
        <strong>All systems operational</strong>
        <span>No active issues detected</span>
      </div>
    </div>
  </section>

  <section class="stats-grid">
    {#each stats as stat (stat.label)}
      <AdminCard>
        <div class="stat-card">
          <div class="stat-card__header">
            <span>{stat.label}</span>

            <div class="stat-card__icon">
              <stat.icon size={18} strokeWidth={1.8} />
            </div>
          </div>

          <strong class="stat-card__value">
            {stat.value}
          </strong>

          <span class="stat-card__description">
            {stat.description}
          </span>
        </div>
      </AdminCard>
    {/each}
  </section>

  <section class="dashboard-grid">
    <AdminCard>
      <div class="section-header">
        <div>
          <h2>System health</h2>
          <p>Current status of core platform services.</p>
        </div>

        <StatusBadge label="Operational" tone="success" />
      </div>

      <div class="health-list">
        {#each health as item (item.label)}
          <div class="health-item">
            <div class="health-item__icon">
              <item.icon size={18} strokeWidth={1.8} />
            </div>

            <div class="health-item__content">
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>

            <StatusBadge label={item.status} tone="success" />
          </div>
        {/each}
      </div>
    </AdminCard>

    <AdminCard>
      <div class="section-header">
        <div>
          <h2>Quick actions</h2>
          <p>Common administration tasks.</p>
        </div>
      </div>

      <div class="quick-actions">
        <button type="button">
          <div class="quick-actions__icon">
            <Plus size={18} strokeWidth={1.8} />
          </div>

          <div>
            <strong>Add user</strong>
            <span>Create a new account</span>
          </div>
        </button>

        <button type="button">
          <div class="quick-actions__icon">
            <UsersRound size={18} strokeWidth={1.8} />
          </div>

          <div>
            <strong>Create family</strong>
            <span>Add a family workspace</span>
          </div>
        </button>

        <button type="button">
          <div class="quick-actions__icon">
            <Blocks size={18} strokeWidth={1.8} />
          </div>

          <div>
            <strong>Manage modules</strong>
            <span>Configure platform features</span>
          </div>
        </button>

        <button type="button">
          <div class="quick-actions__icon">
            <Settings size={18} strokeWidth={1.8} />
          </div>

          <div>
            <strong>Instance settings</strong>
            <span>Configure the server</span>
          </div>
        </button>
      </div>
    </AdminCard>
  </section>

  <AdminCard>
    <div class="section-header">
      <div>
        <h2>Recent activity</h2>
        <p>Latest platform events and configuration changes.</p>
      </div>
    </div>

    <div class="activity-list">
      {#each activities as activity (activity.title)}
        <div class="activity-item">
          <div class="activity-item__marker"></div>

          <div class="activity-item__content">
            <strong>{activity.title}</strong>
            <span>{activity.detail}</span>
          </div>

          <time>{activity.time}</time>
        </div>
      {/each}
    </div>
  </AdminCard>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    padding: 0.5rem 0 0.75rem;
  }

  .hero__eyebrow {
    color: var(--admin-primary);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0.45rem 0 0;
    color: var(--admin-text);
    font-size: clamp(2rem, 3vw, 2.6rem);
    line-height: 1.05;
    letter-spacing: -0.045em;
  }

  .hero p {
    max-width: 44rem;
    margin: 0.75rem 0 0;
    color: var(--admin-text-muted);
    line-height: 1.6;
  }

  .hero__status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 15rem;
    padding: 0.8rem 1rem;
    border: 1px solid var(--admin-border);
    border-radius: var(--admin-radius-md);
    background: var(--admin-surface);
    box-shadow: var(--admin-shadow-sm);
  }

  .hero__status-dot {
    width: 0.65rem;
    height: 0.65rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgb(34 197 94 / 0.12);
  }

  .hero__status div {
    display: flex;
    flex-direction: column;
  }

  .hero__status strong {
    font-size: 0.8rem;
  }

  .hero__status span:last-child {
    margin-top: 0.15rem;
    color: var(--admin-text-muted);
    font-size: 0.68rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .stat-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .stat-card__header > span {
    color: var(--admin-text-muted);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .stat-card__icon {
    width: 2rem;
    height: 2rem;
    display: grid;
    place-items: center;
    border-radius: 0.6rem;
    background: var(--admin-primary-soft);
    color: var(--admin-primary);
  }

  .stat-card__value {
    font-size: 1.8rem;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .stat-card__description {
    color: var(--admin-text-muted);
    font-size: 0.75rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(18rem, 0.9fr);
    gap: 1rem;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .section-header h2 {
    margin: 0;
    font-size: 0.95rem;
    letter-spacing: -0.02em;
  }

  .section-header p {
    margin: 0.25rem 0 0;
    color: var(--admin-text-muted);
    font-size: 0.75rem;
  }

  .health-list,
  .activity-list {
    display: flex;
    flex-direction: column;
  }

  .health-item {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem 0;
    border-top: 1px solid var(--admin-border);
  }

  .health-item__icon {
    width: 2.15rem;
    height: 2.15rem;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    border-radius: 0.65rem;
    background: var(--admin-surface-subtle);
    color: var(--admin-text-muted);
  }

  .health-item__content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .health-item__content strong {
    font-size: 0.8rem;
  }

  .health-item__content span {
    margin-top: 0.1rem;
    color: var(--admin-text-muted);
    font-size: 0.7rem;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .quick-actions button {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-height: 4.2rem;
    padding: 0.75rem;
    border: 1px solid var(--admin-border);
    border-radius: 0.75rem;
    background: var(--admin-surface-subtle);
    color: var(--admin-text);
    text-align: left;
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background 120ms ease,
      transform 120ms ease;
  }

  .quick-actions button:hover {
    border-color: #c9d3e1;
    background: white;
    transform: translateY(-1px);
  }

  .quick-actions__icon {
    width: 2rem;
    height: 2rem;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    border-radius: 0.55rem;
    background: white;
    color: var(--admin-primary);
  }

  .quick-actions button > div:last-child {
    display: flex;
    flex-direction: column;
  }

  .quick-actions strong {
    font-size: 0.75rem;
  }

  .quick-actions span {
    margin-top: 0.1rem;
    color: var(--admin-text-muted);
    font-size: 0.65rem;
  }

  .activity-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    padding: 0.85rem 0;
    border-top: 1px solid var(--admin-border);
  }

  .activity-item__marker {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 999px;
    background: #3b82f6;
  }

  .activity-item__content {
    display: flex;
    flex-direction: column;
  }

  .activity-item__content strong {
    font-size: 0.78rem;
  }

  .activity-item__content span,
  .activity-item time {
    color: var(--admin-text-muted);
    font-size: 0.68rem;
  }

  .activity-item__content span {
    margin-top: 0.1rem;
  }

  @media (max-width: 1100px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .hero {
      flex-direction: column;
    }

    .hero__status {
      width: 100%;
    }

    .stats-grid,
    .quick-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
