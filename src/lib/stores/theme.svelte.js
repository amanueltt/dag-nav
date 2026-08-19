/**
 * Theme state, shared across the app.
 *
 * The resolved theme lives on <html data-theme="..."> so CSS can key off it and
 * so the inline script in app.html can set it before first paint. This module
 * mirrors that value into a rune so components (and Cytoscape, which needs to
 * re-read its colours in JS) can react to a change.
 */
import { browser } from '$app/environment';

const STORAGE_KEY = 'dagnav-theme';

function readInitial() {
	if (!browser) return 'light';
	// app.html has already resolved stored-preference vs OS onto the element
	const stamped = document.documentElement.dataset.theme;
	if (stamped === 'light' || stamped === 'dark') return stamped;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let current = $state(readInitial());

export const theme = {
	get value() {
		return current;
	},

	get isDark() {
		return current === 'dark';
	},

	set(next) {
		if (next !== 'light' && next !== 'dark') return;
		current = next;
		if (!browser) return;
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// private browsing / storage disabled -- the toggle still works for
			// this session, it just won't be remembered
		}
	},

	toggle() {
		this.set(current === 'dark' ? 'light' : 'dark');
	}
};
