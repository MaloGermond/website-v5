import { useState, useEffect } from "preact/hooks";
import sunSVG from "@assets/icons/sun.svg?raw";
import moonSVG from "@assets/icons/moon.svg?raw";

export default function ThemeSwitcher() {
  // État local pour le thème
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
      );
    }
    return "light"; // Valeur par défaut côté serveur
  });

  // Applique le thème au montage
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle le thème
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Basculer le thème"
    >
      {theme === "light" ? <Icons label={sunSVG} /> : <Icons label={moonSVG} />}
    </button>
  );
}

export function Icons({ label }) {
  return <div dangerouslySetInnerHTML={{ __html: label }} />;
}
