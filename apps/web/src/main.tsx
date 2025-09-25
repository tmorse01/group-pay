import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import { initTheme } from './lib/theme';
import App from './App.tsx';

// Initialize theme before rendering
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
