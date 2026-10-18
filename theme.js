const root = document.documentElement;
root.dataset.theme = localStorage.getItem("theme") || "light";

document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("theme-toggle");
  if (!themeBtn) return;

  themeBtn.textContent = root.dataset.theme === "dark" ? "Light Mode" : "Dark Mode";

  themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", root.dataset.theme);
    themeBtn.textContent = root.dataset.theme === "dark" ? "Light Mode" : "Dark Mode";
  });
});
