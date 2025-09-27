export function setDarkMode(enabled: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark-mode', enabled);
  localStorage.setItem('theme', enabled ? 'dark' : 'light');

  // Dispatch custom event for cross-tab synchronization
  window.dispatchEvent(
    new CustomEvent('themechange', { detail: { dark: enabled } })
  );
}

export function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = saved === 'dark' || (saved === null && prefersDark);
  setDarkMode(shouldUseDark);

  // Listen for system theme changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (localStorage.getItem('theme') === null) {
        setDarkMode(e.matches);
      }
    });

  // Listen for storage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' && e.newValue) {
      setDarkMode(e.newValue === 'dark');
    }
  });
}

export function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark-mode');
  setDarkMode(!isDark);
}

export function getCurrentTheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark-mode')
    ? 'dark'
    : 'light';
}
