/**
 * Light / dark theme toggle. The initial theme is applied by an inline
 * script in index.html so the page never flashes the wrong colours.
 */
import { $ } from './utils.js';

const STORAGE_KEY = 'theall-theme';
const root = document.documentElement;

function updateButton(button) {
  const isDark = root.dataset.theme === 'dark';
  button.setAttribute(
    'aria-label',
    isDark ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

export function initTheme() {
  const button = $('#theme-toggle');
  updateButton(button);

  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, root.dataset.theme);
    } catch (e) {
      // Storage can be unavailable (e.g. private mode); the toggle still works.
    }
    updateButton(button);
  });
}
