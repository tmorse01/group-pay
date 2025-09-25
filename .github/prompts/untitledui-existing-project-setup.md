# Untitled UI React — Add to an **Existing** Project (Vite + React + Tailwind)

This guide integrates **Untitled UI React** into your **existing** app – no scaffolding. It assumes a Vite + React + TypeScript project at `apps/web` with Tailwind already configured.

> If Tailwind isn’t set up yet, finish that first, then return here.

---

## 1) Install packages

From your monorepo root (or `apps/web` if you prefer), install the common runtime deps Untitled UI uses:

```bash
cd apps/web

# UI + a11y ecosystem
pnpm add react-aria-components tailwindcss-react-aria-components tailwind-merge tailwindcss-animate

# Icons (optional but recommended)
pnpm add @untitledui/icons
```

> These power Untitled UI’s accessible primitives and animations.

---

## 2) Add/Update global CSS (Tailwind v4+ style)

In your global stylesheet (e.g. `apps/web/src/app.css`), make sure you import Tailwind and register the plugins Untitled UI examples expect.

```css
/* apps/web/src/app.css */
@import 'tailwindcss';
@import './theme.css';

/* Plugins */
@plugin "tailwindcss-animate";
@plugin "tailwindcss-react-aria-components";

/* Helpful custom variants often used by the components */
@custom-variant dark (&:where(.dark-mode, .dark-mode *));
@custom-variant label (& [data-label]);
@custom-variant focus-input-within (&:has(input:focus));

/* Optional utilities used by many examples */
@utility scrollbar-hide {
  &::-webkit-scrollbar {
    display: none;
    -webkit-appearance: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}
@utility transition-inherit-all {
  transition-property: inherit;
  transition-duration: inherit;
  transition-timing-function: inherit;
}

/* Base typography */
html,
body {
  font-family: var(
    --font-body,
    Inter,
    system-ui,
    Avenir,
    Helvetica,
    Arial,
    sans-serif
  );
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Ensure `app.css` is imported once at bootstrap (see step 4).

---

## 3) Create theme tokens (brand + radii, etc.)

Create `apps/web/src/theme.css` and define the minimal tokens. You can expand later with the full token set from the docs. The brand color below uses your preference `#76bd22`.

```css
/* apps/web/src/theme.css */
@theme {
  /* Fonts */
  --font-body: var(--font-inter, 'Inter'), system-ui, Arial, sans-serif;
  --font-display: var(--font-inter, 'Inter'), system-ui, Arial, sans-serif;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;

  /* Radii */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;

  /* Brand color scale (adjust as needed) */
  --color-brand-500: #76bd22;
  --color-brand-600: #67aa1e;
  --color-brand-700: #5aa719;
}

/* Example: dark mode overrides (optional) */
@layer base {
  .dark-mode {
    /* Override as needed for dark mode theming */
  }
}
```

---

## 4) Wire up the CSS at bootstrap

Import your global CSS (which itself imports Tailwind and the theme) in `apps/web/src/main.tsx` or `App.tsx` (whichever is your first entry).

```ts
// apps/web/src/main.tsx (or App.tsx)
import './app.css';
```

If you have a custom font pipeline, load Inter earlier (e.g., in `index.html`) so `--font-inter` is available.

---

## 5) Add Untitled UI components **into** your project

Use the CLI **in your existing app** to copy component source files into `src/components/ui`. This _does not_ scaffold a new project.

```bash
# still in apps/web
npx untitledui@latest add button card input table tabs modal toast dropdown avatar
# Tip: run "npx untitledui@latest add" with no args to pick interactively
```

The CLI will place components (e.g., `src/components/ui/button.tsx`, etc.). Commit these files — you own the code.

> For PRO examples/components, authenticate once with `npx untitledui@latest login` (optional).

---

## 6) Dark mode toggle (recommended)

Untitled UI commonly uses a `.dark-mode` class on the root to switch themes. Add a tiny helper and call it once at app start.

```ts
// apps/web/src/lib/theme.ts
export function setDarkMode(enabled: boolean) {
  const root = document.documentElement; // or document.getElementById("root")
  root.classList.toggle('dark-mode', enabled);
  localStorage.setItem('theme', enabled ? 'dark' : 'light');
}

export function initTheme() {
  const saved = localStorage.getItem('theme');
  setDarkMode(saved === 'dark');
}
```

```ts
// apps/web/src/main.tsx
import './app.css';
import { initTheme } from './lib/theme';
initTheme();
```

Example toggle component (drop anywhere):

```tsx
// apps/web/src/components/ThemeToggle.tsx
import { useEffect, useState } from 'react';

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
    <button
      className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
```

---

## 7) Quick usage test

Add a button and card to any page to verify styles are applied:

```tsx
import { Button, Card } from '@/components/ui'; // adjust alias if needed

export default function Demo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Untitled UI is live</h2>
        <Button>Primary</Button>
      </div>
      <Card>Content inside a card</Card>
    </div>
  );
}
```

Start the app and check:

```bash
pnpm dev
```

---

## 8) Common gotchas

- **Tailwind version**: Ensure you’re on a compatible Tailwind version (v4+ recommended). If you use Tailwind v3, you’ll need a `tailwind.config.*` and to register plugins there instead of via `@plugin` in CSS.
- **CSS order**: Import order matters. `@import "tailwindcss";` should come before `@import "./theme.css";` so utility layers and tokens compose correctly.
- **Alias**: Update your Vite alias (`@`) if you want to use `@/components/ui`. Example `vite.config.ts`:

  ```ts
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import { resolve } from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
  });
  ```

- **Dark mode**: The `.dark-mode` root class controls dark styles. Put it on `<html>` or a top-level wrapper and keep it consistent.

---

## 9) Optional — Add example screens

You can copy example screens into your existing app without re‑scaffolding the project:

```bash
npx untitledui@latest example
# or directly:
npx untitledui@latest example dashboards-01/01
```

---

## 10) Done

You’ve added Untitled UI React to your existing Vite app. Use `npx untitledui@latest add <component>` whenever you need a new primitive, and customize tokens in `theme.css` to keep branding consistent (`#76bd22` currently).
