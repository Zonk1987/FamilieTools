<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    description,
    actions,
  }: {
    title: string;
    description?: string;
    actions?: Snippet;
  } = $props();
</script>

<header class="page-header">
  <div class="page-header__content">
    <h1>{title}</h1>

    {#if description}
      <p>{description}</p>
    {/if}
  </div>

  {#if actions}
    <div class="page-header__actions">
      {@render actions()}
    </div>
  {/if}
</header>

<style>
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
  }

  .page-header__content {
    min-width: 0;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    line-height: 1.15;
    letter-spacing: -0.04em;
  }

  p {
    max-width: 48rem;
    margin: 0.65rem 0 0;
    color: #64748b;
    line-height: 1.6;
  }

  .page-header__actions {
    flex-shrink: 0;
  }

  @media (max-width: 700px) {
    .page-header {
      flex-direction: column;
    }
  }
</style>
