export function setDarkMode(enabled: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark-mode', enabled);
  localStorage.setItem('theme', enabled ? 'dark' : 'light');
}

export function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = saved === 'dark' || (saved === null && prefersDark);
  setDarkMode(shouldUseDark);
}

export function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark-mode');
  setDarkMode(!isDark);
}
