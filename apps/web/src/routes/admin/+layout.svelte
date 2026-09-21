<script lang="ts">
  import type { Snippet } from 'svelte';

  import AdminShell from '$lib/admin/AdminShell.svelte';

  let {
    children,
  }: {
    children: Snippet;
  } = $props();
</script>

<AdminShell>
  {@render children()}
</AdminShell>

