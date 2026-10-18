const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    const updateLabel = (theme) => {
      themeBtn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
    };

    updateLabel(document.documentElement.getAttribute("data-theme"));

    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      updateLabel(next);
    });
  }

  const streakDisplay = document.getElementById("streak-display");
  const gameBoard = document.querySelector(".game-board");
  const outputMessage = document.getElementById("output-message");

  if (streakDisplay && gameBoard) {
    let lastStreak = 0;
    const observer = new MutationObserver(() => {
      const currentStreak = Number(streakDisplay.textContent) || 0;
      if (currentStreak > lastStreak) {
        gameBoard.classList.remove("correct-flash");
        void gameBoard.offsetWidth;
        gameBoard.classList.add("correct-flash");
        if (outputMessage) {
          outputMessage.classList.add("correct-text");
          setTimeout(() => outputMessage.classList.remove("correct-text"), 700);
        }
      }
      lastStreak = currentStreak;
    });
    observer.observe(streakDisplay, { childList: true, characterData: true, subtree: true });
  }

  const hintBox = document.getElementById("hint-box");
  const hintCounter = document.getElementById("hint-counter");

  if (hintBox && hintCounter) {
    const updateHintCount = () => {
      hintCounter.textContent = `${hintBox.children.length} / 10`;
    };
    updateHintCount();
    const hintObserver = new MutationObserver(updateHintCount);
    hintObserver.observe(hintBox, { childList: true });
  }
});
