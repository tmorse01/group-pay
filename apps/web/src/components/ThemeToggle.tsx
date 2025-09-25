import { useEffect, useState } from 'react';
import { Button } from './base/buttons/button';

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark-mode', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <Button color="tertiary" size="sm" onClick={() => setDark((d) => !d)}>
      {dark ? '☀️' : '🌙'}
    </Button>
  );
}
