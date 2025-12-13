import { useState, useEffect } from 'preact/hooks';
import sunSVG from '/icons/sun.svg?raw';
import moonSVG from '/icons/moon.svg?raw';

export default function ThemeSwitcher() {
  // État local pour le thème
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')
      );
    }
    return 'light'; // Valeur par défaut côté serveur
  });

  // Applique le thème au montage
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle le thème
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      class="dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-600 dark:border-slate-400 p-2 rounded-full hover:text-blue-700 hover:bg-blue-100 hover:border-blue-600 transition-all duration-[0.5s] ease-out"
      aria-label="Basculer le thème"
    >
      {theme === 'light' ? <Icons label={sunSVG} /> : <Icons label={moonSVG} />}
    </button>
  );
}

export function Icons({ label, size = '20' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}
