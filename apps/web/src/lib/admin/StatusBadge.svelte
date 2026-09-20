<script lang="ts">
  type StatusTone = 'success' | 'neutral' | 'warning' | 'danger' | 'info';

  let {
    label,
    tone = 'neutral',
  }: {
    label: string;
    tone?: StatusTone;
  } = $props();
</script>

<span
  class="status-badge"
  class:status-badge--success={tone === 'success'}
  class:status-badge--neutral={tone === 'neutral'}
  class:status-badge--warning={tone === 'warning'}
  class:status-badge--danger={tone === 'danger'}
  class:status-badge--info={tone === 'info'}
>
  {label}
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    min-height: 1.75rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .status-badge--success {
    background: #dcfce7;
    color: #166534;
  }

  .status-badge--neutral {
    background: #f1f5f9;
    color: #475569;
  }

  .status-badge--warning {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge--danger {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-badge--info {
    background: #dbeafe;
    color: #1d4ed8;
  }
</style>
