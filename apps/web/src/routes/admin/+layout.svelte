<script lang="ts">
  import type { Snippet } from 'svelte';

  import AdminShell from '$lib/admin/AdminShell.svelte';

  let {
    children,
    data,
  }: {
    children: Snippet;
    data: {
      user: {
        id: string;
        loginName: string;
        displayName: string;
        createdAt: string;
        updatedAt: string;
      };
    };
  } = $props();
</script>

<AdminShell user={data.user}>
  {@render children()}
</AdminShell>
