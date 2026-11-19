(() => {
  const root = document.documentElement;
  const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem("theme");
      return saved === "dark" || saved === "light" ? saved : null;
    } catch {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const themeBtn = document.getElementById("theme-toggle");
    if (!themeBtn) return;
    themeBtn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
  }

  function initToggle() {
    applyTheme(root.dataset.theme);
    const themeBtn = document.getElementById("theme-toggle");
    if (!themeBtn) return;

    themeBtn.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      saveTheme(nextTheme);
      applyTheme(nextTheme);
    });
  }

  applyTheme(getSavedTheme() || (darkMedia.matches ? "dark" : "light"));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToggle);
  } else {
    initToggle();
  }

  darkMedia.addEventListener("change", (event) => {
    if (getSavedTheme()) return;
    applyTheme(event.matches ? "dark" : "light");
  });
})();
