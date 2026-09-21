<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    padding = true,
  }: {
    children: Snippet;
    padding?: boolean;
  } = $props();
</script>

<section class:admin-card--padded={padding} class="admin-card">
  {@render children()}
</section>

<style>
  .admin-card {
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 0.9rem;
    background: #ffffff;
    box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
  }

  .admin-card--padded {
    padding: 1.25rem;
  }
</style>

