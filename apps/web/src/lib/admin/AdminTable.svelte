<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
  }: {
    children: Snippet;
  } = $props();
</script>

<div class="table-wrapper">
  <table>
    {@render children()}
  </table>
</div>

<style>
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  :global(th) {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  :global(td) {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  :global(tbody tr:last-child td) {
    border-bottom: 0;
  }

  :global(tbody tr:hover) {
    background: #f8fafc;
  }
</style>

