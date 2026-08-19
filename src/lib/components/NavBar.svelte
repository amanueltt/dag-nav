<!-- NavBar.svelte -->
<script>
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { writable } from 'svelte/store';
  import ThemeToggle from './ThemeToggle.svelte';

  const currentPath = writable(page.url?.pathname || '/');

  afterNavigate(({ to }) => {
    currentPath.set(to?.url.pathname || '/');
  });

  // Navigation items
  const navItems = [
    { text: 'Graph Visualization', href: '/' },
    { text: 'Statistics', href: '/statistics-page' },
  ];
</script>

<nav class="navbar" aria-label="Primary">
  <span class="wordmark">DAGNav</span>

  <ul class="nav-items">
    {#each navItems as item}
      <li>
        <a
          href={item.href}
          class:active={$currentPath === item.href}
          aria-current={$currentPath === item.href ? 'page' : undefined}
        >
          {item.text}
        </a>
      </li>
    {/each}
  </ul>

  <div class="nav-actions">
    <ThemeToggle />
  </div>
</nav>

<style>
  /* Three tracks so the links stay optically centred whatever sits beside them */
  .navbar {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1em;
    padding: 0 0.25em 0.75em;
    border-bottom: 1px solid var(--border);
  }

  .wordmark {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-3);
    user-select: none;
  }

  .nav-items {
    display: flex;
    justify-content: center;
    align-items: center;
    list-style: none;
    gap: 0.25em;
  }

  .nav-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  a {
    display: block;
    text-decoration: none;
    color: var(--text-3);
    font-size: 0.875rem;
    padding: 0.4em 0.75em;
    border-radius: var(--radius-sm);
    /* Reserve the underline's space up front so the active state doesn't shift
       the row by 2px */
    border-bottom: 2px solid transparent;
    transition: color var(--speed) ease, background-color var(--speed) ease,
      border-color var(--speed) ease;
  }

  a:hover {
    background-color: var(--surface-3);
    color: var(--text-1);
  }

  /* Active is weight + a hairline accent rule, not a filled pill -- quieter and
     it keeps the accent colour meaning one thing across the app */
  .active,
  .active:hover {
    color: var(--text-1);
    font-weight: 550;
    border-bottom-color: var(--accent);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    background-color: transparent;
  }
</style>
