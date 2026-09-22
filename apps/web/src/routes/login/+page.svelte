<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { login } from '$lib/auth';

  let loginName = $state('');
  let password = $state('');
  let errorMessage = $state('');
  let isSubmitting = $state(false);

  async function submitLogin(event: SubmitEvent) {
    event.preventDefault();

    errorMessage = '';
    isSubmitting = true;

    try {
      await login(loginName, password);
      await goto(resolve('/admin'));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Sign in failed';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in | FamilieTools</title>
</svelte:head>

<div class="login-shell">
  <div class="login-backdrop"></div>

  <div class="glow glow-1"></div>
  <div class="glow glow-2"></div>

  <form class="login-card" onsubmit={submitLogin}>
    <div class="brand">FamilieTools</div>

    <h1>Sign in</h1>
    <p class="subtitle">Sign in to manage this FamilieTools instance.</p>

    {#if errorMessage}
      <div class="alert" role="alert">
        {errorMessage}
      </div>
    {/if}

    <div class="field">
      <label for="loginName">Login name</label>
      <input
        id="loginName"
        name="loginName"
        type="text"
        bind:value={loginName}
        autocomplete="username"
        placeholder="Enter your login name"
        required
      />
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        bind:value={password}
        autocomplete="current-password"
        placeholder="Enter your password"
        required
      />
    </div>

    <button type="submit" disabled={isSubmitting}>
      {#if isSubmitting}
        Signing in...
      {:else}
        Sign in
      {/if}
    </button>
  </form>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    min-height: 100%;
    background: #050816;
  }

  :global(body) {
    color: #e5e7eb;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .login-shell {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
      radial-gradient(circle at top, rgba(79, 70, 229, 0.18), transparent 35%),
      radial-gradient(circle at bottom, rgba(59, 130, 246, 0.12), transparent 30%),
      linear-gradient(180deg, #050816 0%, #02040d 100%);
  }

  .login-backdrop {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(circle at center, black 45%, transparent 100%);
    pointer-events: none;
  }

  .glow {
    position: absolute;
    border-radius: 999px;
    filter: blur(80px);
    opacity: 0.5;
    pointer-events: none;
  }

  .glow-1 {
    width: 340px;
    height: 340px;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(99, 102, 241, 0.22);
  }

  .glow-2 {
    width: 240px;
    height: 240px;
    bottom: 12%;
    right: 16%;
    background: rgba(59, 130, 246, 0.14);
  }

  .login-card {
    position: relative;
    z-index: 1;
    width: min(100%, 420px);
    padding: 28px;
    border-radius: 20px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(10, 14, 28, 0.88);
    backdrop-filter: blur(16px);
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .brand {
    margin-bottom: 12px;
    color: #a5b4fc;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: #f8fafc;
    font-size: 2rem;
    line-height: 1.1;
    font-weight: 700;
  }

  .subtitle {
    margin: 10px 0 24px;
    color: #94a3b8;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .alert {
    margin-bottom: 18px;
    padding: 12px 14px;
    border: 1px solid rgba(239, 68, 68, 0.28);
    border-radius: 12px;
    background: rgba(127, 29, 29, 0.24);
    color: #fecaca;
    font-size: 0.92rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  label {
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 600;
  }

  input {
    width: 100%;
    border: 1px solid rgba(100, 116, 139, 0.35);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.9);
    color: #f8fafc;
    padding: 13px 14px;
    font-size: 0.95rem;
    outline: none;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease;
  }

  input::placeholder {
    color: #64748b;
  }

  input:focus {
    border-color: rgba(99, 102, 241, 0.9);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.18);
    background: rgba(15, 23, 42, 1);
  }

  button {
    width: 100%;
    margin-top: 6px;
    border: none;
    border-radius: 12px;
    padding: 13px 16px;
    background: linear-gradient(90deg, #6366f1 0%, #7c3aed 100%);
    color: white;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      opacity 0.15s ease;
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.28);
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 16px 34px rgba(99, 102, 241, 0.34);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
