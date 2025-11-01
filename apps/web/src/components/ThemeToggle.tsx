import { Button } from '@/components/base/buttons/button';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon01, Monitor01 } from '@untitledui/icons';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'light') return <Moon01 className="w-4 h-4" />;
    if (theme === 'dark') return <Monitor01 className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Switch to dark mode';
    if (theme === 'dark') return 'Switch to system theme';
    return 'Switch to light mode';
  };

  const getTitle = () => {
    if (theme === 'light')
      return 'Light mode active - Click to switch to dark mode';
    if (theme === 'dark')
      return 'Dark mode active - Click to switch to system theme';
    return 'System theme active - Click to switch to light mode';
  };

  return (
    <div title={getTitle()}>
      <Button
        color="tertiary"
        size="sm"
        onClick={handleToggle}
        aria-label={getLabel()}
      >
        {getIcon()}
      </Button>
    </div>
  );
}
