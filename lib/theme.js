const THEME_KEY_PREFIX = 'dealer-recon:theme:';

function isClient() {
  return typeof window !== 'undefined';
}

export function getThemeKey(userIdentifier) {
  return `${THEME_KEY_PREFIX}${userIdentifier || 'default'}`;
}

export function loadTheme(userIdentifier) {
  if (!isClient()) return 'light';
  const stored = window.localStorage.getItem(getThemeKey(userIdentifier));
  return stored === 'dark' ? 'dark' : 'light';
}

export function saveTheme(userIdentifier, theme) {
  if (!isClient()) return;
  window.localStorage.setItem(getThemeKey(userIdentifier), theme);
}

export function applyTheme(theme) {
  if (!isClient()) return;
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark');
  } else {
    body.classList.remove('dark');
  }
}
