<!-- ThemeToggle.svelte -->
<script>
	import { theme } from '$lib/stores/theme.svelte.js';
</script>

<button
	class="theme-toggle"
	type="button"
	onclick={() => theme.toggle()}
	aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	title={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if theme.isDark}
		<!-- sun -->
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<circle cx="12" cy="12" r="4.25" />
			<g class="rays">
				<line x1="12" y1="2.5" x2="12" y2="4.75" />
				<line x1="12" y1="19.25" x2="12" y2="21.5" />
				<line x1="2.5" y1="12" x2="4.75" y2="12" />
				<line x1="19.25" y1="12" x2="21.5" y2="12" />
				<line x1="5.4" y1="5.4" x2="7" y2="7" />
				<line x1="17" y1="17" x2="18.6" y2="18.6" />
				<line x1="5.4" y1="18.6" x2="7" y2="17" />
				<line x1="17" y1="7" x2="18.6" y2="5.4" />
			</g>
		</svg>
	{:else}
		<!-- moon -->
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M20 14.4A8.6 8.6 0 1 1 9.6 4a6.9 6.9 0 0 0 10.4 10.4Z" />
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		width: 32px;
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--text-3);
		cursor: pointer;
		transition: color var(--speed) ease, background-color var(--speed) ease,
			border-color var(--speed) ease;
	}

	.theme-toggle:hover {
		background-color: var(--surface-3);
		border-color: var(--border);
		color: var(--text-1);
	}

	svg {
		width: 17px;
		height: 17px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
	}

	/* The moon is a solid silhouette, the sun a stroked glyph */
	svg path {
		fill: currentColor;
		stroke: none;
	}
</style>
