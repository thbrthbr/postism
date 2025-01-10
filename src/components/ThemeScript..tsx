export type Theme = "light" | "dark" | "wood";

declare global {
  interface Window {
    __theme: Theme;
    __onThemeChange: (theme: Theme) => void;
    __setPreferredTheme: (theme: Theme) => void;
  }
}

function code() {
  window.__onThemeChange = function () {};

  function setTheme(newTheme: Theme) {
    document.documentElement.classList.remove(window.__theme);
    window.__theme = newTheme;
    preferredTheme = newTheme;
    document.documentElement.dataset.theme = newTheme;

    window.__onThemeChange(newTheme);
    document.documentElement.classList.add(newTheme);
  }

  var preferredTheme;

  try {
    preferredTheme = localStorage.getItem("theme") as Theme;
  } catch (err) {}

  window.__setPreferredTheme = function (newTheme: Theme) {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch (err) {}
  };

  setTheme(preferredTheme || "light");
}

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: `(${code})();` }} />;
}
