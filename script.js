document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("reset-btn");
  const outputMessage = document.getElementById("output-message");
  const difficulty = document.getElementById("difficulty-select");
  const scoreDisplay = document.getElementById("score-display");
  const streakDisplay = document.getElementById("streak-display");
  const livesDisplay = document.getElementById("lives-display");
  const wordLengthInfo = document.getElementById("word-length-info");
  const guessForm = document.getElementById("guess-form");
  const guessInput = document.getElementById("guess-input");
  const wordDisplay = document.getElementById("word-display");
  const modal = document.getElementById("game-modal");
  const modalWordReveal = document.getElementById("modal-word-reveal");
  const modalRestartBtn = document.getElementById("modal-restart-btn");
  const hintBtn = document.getElementById("hint-btn");
  const hintBox = document.getElementById("hint-box");
  const hintText = document.getElementById("hint-text");

  let words = [];
  let score = 0;
  let streak = 0;
  let lives = 6;
  let currentWordIndex = 0;
  let currentWord = "";

  function resetHint() {
    hintBox.hidden = true;
    hintText.textContent = "";
  }

  function displayWordDisplay() {
    wordDisplay.innerHTML = currentWord
      ? '<span class="letter-tile empty">_</span>'.repeat(currentWord.length)
      : "";
  }

  function updateBoard() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    livesDisplay.textContent = lives;
    wordLengthInfo.textContent = currentWord ? `${currentWord.length} Letters` : "";
    displayWordDisplay();
  }

  async function updateStoredWords() {
    outputMessage.textContent = "Loading...";
    const diff = difficulty.value;
    try {
      const response = await fetch(
        `https://random-word-api.herokuapp.com/word?number=10&diff=${diff}&lang=en`,
      );
      words = await response.json();
    } catch {
      outputMessage.textContent = "Error fetching words!";
    }
    outputMessage.textContent = "Done!";
    currentWordIndex = 0;
    currentWord = words[0];
    resetHint();
    updateBoard();
  }

  async function getHint(word) {
    try {
      const response = await fetch(
        `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=40644129-d379-4d4f-b467-9f2acc0031b4`,
      );
      const data = await response.json();
      for (const entry of data) {
        if (entry?.shortdef?.[0]) {
          return entry.shortdef[0];
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  function resetGame() {
    score = 0;
    streak = 0;
    lives = 6;
    resetHint();
    updateStoredWords();
  }

  guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const guess = guessInput.value.trim().toLowerCase();
    guessInput.value = "";
    if (!guess || !currentWord) return;

    if (guess === currentWord) {
      score += 10;
      streak += 1;
      currentWordIndex += 1;
      resetHint();
      if (currentWordIndex >= words.length) {
        updateStoredWords();
      } else {
        currentWord = words[currentWordIndex];
        outputMessage.textContent = "Correct!";
        updateBoard();
      }
    } else {
      lives -= 1;
      streak = 0;
      outputMessage.textContent = "Wrong guess!";
      updateBoard();
      if (lives <= 0) {
        modalWordReveal.textContent = currentWord;
        modal.showModal();
      }
    }
  });

  hintBtn.addEventListener("click", async () => {
    if (lives <= 0 || !currentWord) return;
    outputMessage.textContent = "Loading hint...";
    const hint = await getHint(currentWord);

    if (!hint) {
      outputMessage.textContent = "No hint available for this word.";
      return;
    }

    outputMessage.textContent = "";
    hintText.textContent = hint;
    hintBox.hidden = false;
    streak = 0;
    updateBoard();
    if (lives <= 0) {
      modalWordReveal.textContent = currentWord;
      modal.showModal();
    }
  });

  resetBtn.addEventListener("click", () => {
    outputMessage.textContent = "Resetting...";
    resetGame();
  });

  modalRestartBtn.addEventListener("click", () => {
    modal.close();
    resetGame();
  });

  difficulty.addEventListener("change", resetGame);

  resetGame();
});
