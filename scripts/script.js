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
const modalWordReveal = document.getElementById("modal-word-reveal");
const modalSaveBtn = document.getElementById("modal-save-btn");
const modalRestartBtn = document.getElementById("modal-restart-btn");

let words = [];
let currentWordIndex = 0;
let currentWord = "";
let revealedLetters = [];
let isWordSolved = false;
let hints = [];
let revealedHints = 0;
let score = 0;
let streak = 0;
let lives = 6;

function resetGame() {
  score = 0;
  streak = 0;
  lives = 6;
  isWordSolved = false;
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
  isWordSolved = false;
  revealedHints = 0;
  hints = [];
  updateBoard();

  if (!currentWord) return;
  hints = await fetchHints(currentWord);
  updateBoard();
}

function updateBoard() {
  const inputsDisabled = !currentWord || lives <= 0 || isWordSolved;

  scoreDisplay.textContent = score;
  streakDisplay.textContent = streak;
  livesDisplay.textContent = lives;
  wordLengthInfo.textContent = currentWord ? `${currentWord.length} Letters` : "";
  renderWord(inputsDisabled);
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

function renderWord(inputsDisabled) {
  wordDisplay.innerHTML = revealedLetters
    .map((letter, index) =>
      letter
        ? `<input type="text" class="letter-tile" value="${letter}" disabled />`
        : `<input type="text" class="letter-tile empty" data-index="${index}" maxlength="1" placeholder="" autocomplete="off" ${inputsDisabled ? "disabled" : ""} />`,
    )
    .join("");
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

function revealGuess(entries) {
  let matched = false;

  if (entries.length === 1) {
    const char = entries[0].char;
    for (let i = 0; i < currentWord.length; i++) {
      if (currentWord[i] === char) {
        revealedLetters[i] = currentWord[i];
        matched = true;
      }
    }
  } else {
    for (const { index, char } of entries) {
      if (currentWord[index] === char) {
        revealedLetters[index] = currentWord[index];
        matched = true;
      }
    }
  }

  return matched;
}

wordDisplay.addEventListener("input", (event) => {
  if (!event.target.value) return;
  const enabled = [...wordDisplay.querySelectorAll("input:not(:disabled)")];
  const next = enabled[enabled.indexOf(event.target) + 1];
  next?.focus();
});

wordDisplay.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    guessForm.requestSubmit();
    return;
  }
  if (event.key === "Backspace" && !event.target.value) {
    const enabled = [...wordDisplay.querySelectorAll("input:not(:disabled)")];
    const prev = enabled[enabled.indexOf(event.target) - 1];
    prev?.focus();
  }
});

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentWord || lives <= 0 || isWordSolved) return;

  const entries = [...wordDisplay.querySelectorAll("input:not(:disabled)")]
    .map((input) => ({
      index: Number(input.dataset.index),
      char: input.value.trim().toLowerCase(),
    }))
    .filter((entry) => entry.char);

  if (!entries.length) return;

  const matched = revealGuess(entries);

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

  if (entries.length === 1 && matched) {
    outputMessage.textContent = "Good guess!";
    updateBoard();
    wordDisplay.querySelector("input:not(:disabled)")?.focus();
    return;
  }

  lives -= 1;
  streak = 0;
  outputMessage.textContent = "Wrong guess!";
  updateBoard();

  if (lives <= 0) {
    modalWordReveal.textContent = currentWord;
    modal.showModal();
  } else {
    wordDisplay.querySelector("input:not(:disabled)")?.focus();
  }
});

hintBtn.addEventListener("click", () => {
  if (lives <= 0 || !currentWord || !hints.length || isWordSolved) return;

  if (revealedHints >= hints.length - 1) {
    outputMessage.textContent = "All hints revealed!";
    return;
  }

  revealedHints += 1;
  outputMessage.textContent = "";
  updateBoard();
});

giveUpBtn.addEventListener("click", () => {
  if (!currentWord || isWordSolved) return;
  modalWordReveal.textContent = currentWord;
  modal.showModal();
});

resetBtn.addEventListener("click", resetGame);

modalRestartBtn.addEventListener("click", () => {
  modal.close();
  resetGame();
});

difficulty.addEventListener("change", resetGame);

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
  clearWordbook();
  updateBoard();
});

resetGame();

document.addEventListener("keydown", (event) => {
  const gameContainer = document.querySelector(".game-layout .container");
  if (event.key !== "9" || !gameContainer || gameContainer.querySelector(".yuyu-gif")) return;

  event.preventDefault();
  const gif = document.createElement("img");
  gif.src = "Images/yuyulick.gif";
  gif.className = "yuyu-gif";
  gameContainer.appendChild(gif);

  setTimeout(() => gif.remove(), 3000);
});
