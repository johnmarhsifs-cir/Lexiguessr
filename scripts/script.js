import { fetchWords, fetchHints } from "./api.js";
import { wordbook, saveWord, clearWordbook, renderWordbook } from "./wordbook.js";
import "./theme.js";

const resetBtn = document.getElementById("reset-btn");
const giveUpBtn = document.getElementById("give-up-btn");
const hintBtn = document.getElementById("hint-btn");
const outputMessage = document.getElementById("output-message");
const difficulty = document.getElementById("difficulty-select");
const scoreDisplay = document.getElementById("score-display");
const streakDisplay = document.getElementById("streak-display");
const livesDisplay = document.getElementById("lives-display");
const wordLengthInfo = document.getElementById("word-length-info");
const guessedInfo = document.getElementById("guessed-info");
const guessForm = document.getElementById("guess-form");
const wordDisplay = document.getElementById("word-display");
const hintBox = document.getElementById("hint-box");
const hintCounter = document.getElementById("hint-counter");
const saveWordBtn = document.getElementById("save-word-btn");
const nextWordBtn = document.getElementById("next-word-btn");
const submitBtn = document.getElementById("submit-btn");
const wordbookOpenBtn = document.getElementById("wordbook-open-btn");
const wordbookModal = document.getElementById("wordbook-modal");
const wordbookClearBtn = document.getElementById("wordbook-clear-btn");
const wordbookCloseBtn = document.getElementById("wordbook-close-btn");
const gameBoard = document.querySelector(".game-board");
const modal = document.getElementById("game-modal");
const modalDescription = document.getElementById("modal-description");
const modalWordReveal = document.getElementById("modal-word-reveal");
const modalSaveBtn = document.getElementById("modal-save-btn");
const modalRestartBtn = document.getElementById("modal-restart-btn");

let words = [];
let currentWordIndex = 0;
let currentWord = "";
let revealedLetters = [];
let guesses = new Set();
let isWordSolved = false;
let isGameOver = false;
let hints = [];
let revealedHints = 0;
let score = 0;
let streak = 0;
let lives = 6;
let activeDifficulty = difficulty.value;

function resetGame() {
  score = 0;
  streak = 0;
  lives = 6;
  isWordSolved = false;
  isGameOver = false;
  loadWords();
}

async function loadWords() {
  outputMessage.textContent = "Loading...";

  try {
    words = await fetchWords(difficulty.value);
    currentWordIndex = 0;
    await startWord();
    outputMessage.textContent = "Ready!";
  } catch {
    outputMessage.textContent = "Error fetching words!";
  }
}

async function startWord() {
  currentWord = (words[currentWordIndex] || "").toLowerCase();
  revealedLetters = Array(currentWord.length).fill("");
  guesses = new Set();
  isWordSolved = false;
  revealedHints = 0;
  hints = [];
  buildTiles();
  updateBoard();

  if (!currentWord) return;
  hints = await fetchHints(currentWord);
  updateBoard();
}

function endGame(message) {
  isGameOver = true;
  streak = 0;
  revealedLetters = [...currentWord];
  outputMessage.textContent = message;
  modalDescription.textContent = message;
  modalWordReveal.textContent = currentWord;
  updateBoard();
  modal.showModal();
}

function updateBoard() {
  const inputsDisabled = !currentWord || isGameOver || isWordSolved;
  const guessedLetters = [...guesses].filter((guess) => guess.length === 1);

  scoreDisplay.textContent = score;
  streakDisplay.textContent = streak;
  livesDisplay.textContent = lives;
  wordLengthInfo.textContent = currentWord ? `${currentWord.length} Letters` : "";
  guessedInfo.hidden = guessedLetters.length === 0;
  guessedInfo.textContent = `Guessed: ${guessedLetters.join(", ").toUpperCase()}`;
  updateTiles(inputsDisabled);
  renderHints();

  const isSaved = wordbook.some((item) => item.word === currentWord);
  hintBtn.hidden = isWordSolved;
  saveWordBtn.hidden = !isWordSolved;
  saveWordBtn.disabled = isSaved;
  saveWordBtn.textContent = isSaved ? "Saved" : "Save Word";
  modalSaveBtn.disabled = isSaved;
  modalSaveBtn.textContent = isSaved ? "Saved" : "Save Word";
  nextWordBtn.hidden = !isWordSolved;

  submitBtn.disabled = inputsDisabled;
  hintBtn.disabled = inputsDisabled;
  giveUpBtn.disabled = inputsDisabled;
}

function buildTiles() {
  wordDisplay.replaceChildren(
    ...[...currentWord].map((_, index) => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "letter-tile empty";
      input.dataset.index = index;
      input.maxLength = 1;
      input.autocomplete = "off";
      return input;
    }),
  );
}

function updateTiles(inputsDisabled) {
  wordDisplay.querySelectorAll("input").forEach((input, index) => {
    const letter = revealedLetters[index];
    if (letter) {
      input.value = letter;
      input.classList.remove("empty");
      input.disabled = true;
    } else {
      input.disabled = inputsDisabled;
    }
  });
}

function getOpenTiles() {
  return [...wordDisplay.querySelectorAll("input:not(:disabled)")];
}

function focusFirstTile() {
  getOpenTiles()[0]?.focus();
}

function renderHints() {
  const visibleHints = hints.slice(0, revealedHints + 1);
  hintBox.hidden = visibleHints.length === 0;
  hintCounter.textContent = `${visibleHints.length} / 10`;
  hintBox.innerHTML = visibleHints
    .map(
      (hint) =>
        `<div class="hint-item"><span class="hint-badge">${hint.category}</span><span class="hint-text">${hint.text}</span></div>`,
    )
    .join("");
}

function revealLetter(char) {
  let matched = false;
  [...currentWord].forEach((letter, index) => {
    if (letter === char) {
      revealedLetters[index] = letter;
      matched = true;
    }
  });
  return matched;
}

wordDisplay.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/[^a-z]/gi, "");
  if (!event.target.value) return;
  const openTiles = getOpenTiles();
  openTiles[openTiles.indexOf(event.target) + 1]?.focus();
});

wordDisplay.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    guessForm.requestSubmit();
    return;
  }
  if (event.key === "Backspace" && !event.target.value) {
    const openTiles = getOpenTiles();
    openTiles[openTiles.indexOf(event.target) - 1]?.focus();
  }
});

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentWord || isGameOver || isWordSolved) return;

  const openTiles = getOpenTiles();
  const entries = openTiles
    .map((input) => ({
      index: Number(input.dataset.index),
      char: input.value.trim().toLowerCase(),
    }))
    .filter((entry) => /^[a-z]$/.test(entry.char));

  if (!entries.length) return;

  if (entries.length > 1 && entries.length < openTiles.length) {
    outputMessage.textContent = "Guess one letter, or fill every tile to guess the word.";
    return;
  }

  const guess =
    entries.length === 1
      ? entries[0].char
      : revealedLetters
          .map((letter, index) => letter || entries.find((entry) => entry.index === index).char)
          .join("");

  openTiles.forEach((input) => (input.value = ""));

  if (guesses.has(guess)) {
    outputMessage.textContent = `You already guessed "${guess.toUpperCase()}".`;
    focusFirstTile();
    return;
  }

  guesses.add(guess);

  let isCorrect;
  if (guess.length === 1) {
    isCorrect = revealLetter(guess);
  } else {
    isCorrect = guess === currentWord;
    if (isCorrect) revealedLetters = [...currentWord];
  }

  if (revealedLetters.join("") === currentWord) {
    score += Math.max(0, 10 - revealedHints);
    streak += 1;
    isWordSolved = true;
    outputMessage.textContent = "Correct! Save this word or continue to the next one.";
    gameBoard.classList.add("correct-flash");
    setTimeout(() => gameBoard.classList.remove("correct-flash"), 650);
    updateBoard();
    return;
  }

  if (isCorrect) {
    outputMessage.textContent = "Good guess!";
    updateBoard();
    focusFirstTile();
    return;
  }

  lives -= 1;
  streak = 0;

  if (lives <= 0) {
    endGame("You ran out of lives.");
    return;
  }

  outputMessage.textContent = "Wrong guess!";
  updateBoard();
  focusFirstTile();
});

hintBtn.addEventListener("click", () => {
  if (isGameOver || !currentWord || !hints.length || isWordSolved) return;

  if (revealedHints >= hints.length - 1) {
    outputMessage.textContent = "All hints revealed!";
    return;
  }

  revealedHints += 1;
  outputMessage.textContent = "";
  updateBoard();
});

giveUpBtn.addEventListener("click", () => {
  if (!currentWord || isWordSolved || isGameOver) return;
  endGame("You gave up.");
});

resetBtn.addEventListener("click", resetGame);

modalRestartBtn.addEventListener("click", () => {
  modal.close();
  resetGame();
});

difficulty.addEventListener("change", () => {
  const hasProgress = !isGameOver && (score > 0 || guesses.size > 0);
  if (
    hasProgress &&
    !confirm("Changing difficulty starts a new game and resets your score. Continue?")
  ) {
    difficulty.value = activeDifficulty;
    return;
  }
  activeDifficulty = difficulty.value;
  resetGame();
});

function handleSaveWord() {
  saveWord(currentWord, hints);
  outputMessage.textContent = `Saved "${currentWord}" to your wordbook.`;
  updateBoard();
}

saveWordBtn.addEventListener("click", handleSaveWord);
modalSaveBtn.addEventListener("click", handleSaveWord);

nextWordBtn.addEventListener("click", () => {
  currentWordIndex += 1;
  if (currentWordIndex >= words.length) {
    loadWords();
  } else {
    startWord();
  }
});

wordbookOpenBtn.addEventListener("click", () => {
  renderWordbook();
  wordbookModal.showModal();
});

wordbookCloseBtn.addEventListener("click", () => wordbookModal.close());

wordbookClearBtn.addEventListener("click", () => {
  if (!wordbook.length || !confirm("Clear all saved words?")) return;
  clearWordbook();
  updateBoard();
});

resetGame();

document.addEventListener("keydown", (event) => {
  const gameContainer = document.querySelector(".game-layout .container");
  if (
    event.key !== "9" ||
    event.target.matches("input, select, textarea") ||
    !gameContainer ||
    gameContainer.querySelector(".yuyu-gif")
  )
    return;

  const gif = document.createElement("img");
  gif.src = "Images/yuyulick.gif";
  gif.className = "yuyu-gif";
  gameContainer.appendChild(gif);

  setTimeout(() => gif.remove(), 3000);
});
