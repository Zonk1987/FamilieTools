<script lang="ts">
  import type { Snippet } from 'svelte';

  import './admin.css';
  import AdminSidebar from './AdminSidebar.svelte';
  import AdminTopbar from './AdminTopbar.svelte';

  let {
    children,
    user,
  }: {
    children: Snippet;
    user: {
      id: string;
      loginName: string;
      displayName: string;
      createdAt: string;
      updatedAt: string;
    };
  } = $props();
</script>

<div class="admin-app">
  <div class="admin-shell">
    <AdminSidebar />

    <div class="admin-main">
      <AdminTopbar {user} />

      <main class="admin-content">
        {@render children()}
      </main>
    </div>
  </div>
</div>

<style>
  .admin-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
  }

  .admin-main {
    min-width: 0;
  }

  .admin-content {
    width: min(100% - 3rem, 92rem);
    margin: 0 auto;
    padding: 2.25rem 0 4rem;
  }

  @media (max-width: 900px) {
    .admin-shell {
      grid-template-columns: 1fr;
    }

    .admin-content {
      width: min(100% - 2rem, 92rem);
      padding-top: 1.5rem;
    }
  }
</style>
