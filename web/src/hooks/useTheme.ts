import { useEffect } from 'react';
import { useAppStore } from '../store';

export function useTheme() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
      return;
    }
    if (theme === 'light') {
      html.classList.remove('dark');
      return;
    }

    // auto: 跟随系统
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };

    applyTheme(mediaQuery);
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);
}