import { fetchWords, fetchHints } from "./api.js";
import { wordbook, saveWord, clearWordbook, renderWordbook } from "./wordbook.js";

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
let guesses = [];
let hints = [];
let revealedHints = 0;
let score = 0;
let streak = 0;
let lives = 6;
let isWordSolved = false;
let isGameOver = false;
let isLoading = false;
let activeDifficulty = difficulty.value;

function canPlay() {
  return !isLoading && currentWord !== "" && !isGameOver && !isWordSolved;
}

function getOpenTiles() {
  return Array.from(wordDisplay.querySelectorAll("input:not(:disabled)"));
}

function focusFirstTile() {
  const firstTile = getOpenTiles()[0];
  if (firstTile) firstTile.focus();
}

function moveFocus(currentInput, step) {
  const openTiles = getOpenTiles();
  const nextTile = openTiles[openTiles.indexOf(currentInput) + step];
  if (nextTile) nextTile.focus();
}

function clearRound() {
  currentWord = "";
  revealedLetters = [];
  guesses = [];
  hints = [];
  revealedHints = 0;
  isWordSolved = false;
}

function resetGame() {
  score = 0;
  streak = 0;
  lives = 6;
  isGameOver = false;
  loadWords();
}

async function loadWords() {
  isLoading = true;
  clearRound();
  buildTiles();
  outputMessage.textContent = "Loading word...";
  updateBoard();

  try {
    words = await fetchWords(difficulty.value);
    currentWordIndex = 0;
    await startWord();
  } catch {
    isLoading = false;
    outputMessage.textContent = "Error fetching words!";
    updateBoard();
  }
}

async function startWord() {
  clearRound();
  currentWord = (words[currentWordIndex] || "").toLowerCase();
  revealedLetters = Array(currentWord.length).fill("");
  buildTiles();

  if (!currentWord) {
    isLoading = false;
    outputMessage.textContent = "No words available.";
    updateBoard();
    return;
  }

  isLoading = true;
  outputMessage.textContent = "Loading hints...";
  updateBoard();

  try {
    hints = await fetchHints(currentWord);
  } finally {
    isLoading = false;
  }

  outputMessage.textContent = "Ready!";
  updateBoard();
  if (!modal.open && !wordbookModal.open) {
    focusFirstTile();
  }
}

function endGame(message) {
  isGameOver = true;
  streak = 0;
  revealedLetters = currentWord.split("");
  outputMessage.textContent = message;
  modalDescription.textContent = message;
  modalWordReveal.textContent = currentWord;
  updateBoard();
  modal.showModal();
}

function buildTiles() {
  wordDisplay.innerHTML = "";
  for (let i = 0; i < currentWord.length; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "letter-tile empty";
    input.maxLength = 1;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.inputMode = "text";
    input.pattern = "[A-Za-z]";
    input.setAttribute("autocapitalize", "off");
    wordDisplay.appendChild(input);
  }
}

function updateTiles(disabled) {
  const inputs = wordDisplay.querySelectorAll("input");
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const letter = revealedLetters[i];
    if (letter) {
      input.value = letter;
      input.classList.remove("empty");
      input.disabled = true;
    } else {
      input.disabled = disabled;
    }
  }
}

function renderHints() {
  if (isLoading) {
    hintBox.hidden = false;
    hintCounter.textContent = "Loading...";
    hintBox.innerHTML = `<p class="hint-loading">Loading hints...</p>`;
    return;
  }

  const visibleHints = hints.slice(0, revealedHints + 1);
  hintBox.hidden = visibleHints.length === 0;
  hintCounter.textContent = `${visibleHints.length} / ${hints.length || 10}`;

  let html = "";
  for (const hint of visibleHints) {
    html += `<div class="hint-item"><span class="hint-badge">${hint.category}</span><span class="hint-text">${hint.text}</span></div>`;
  }
  hintBox.innerHTML = html;
}

function updateBoard() {
  const disabled = !canPlay();
  const guessedLetters = [];
  for (const guess of guesses) {
    if (guess.length === 1) guessedLetters.push(guess);
  }

  scoreDisplay.textContent = score;
  streakDisplay.textContent = streak;
  livesDisplay.textContent = lives;

  if (currentWord) {
    wordLengthInfo.textContent = `${currentWord.length} Letters`;
  } else if (isLoading) {
    wordLengthInfo.textContent = "Loading...";
  } else {
    wordLengthInfo.textContent = "";
  }

  guessedInfo.hidden = guessedLetters.length === 0;
  guessedInfo.textContent = `Guessed: ${guessedLetters.join(", ").toUpperCase()}`;
  wordDisplay.setAttribute("aria-busy", String(isLoading));
  hintBox.setAttribute("aria-busy", String(isLoading));

  updateTiles(disabled);
  renderHints();

  const isSaved = wordbook.some((item) => item.word === currentWord);
  const saveDisabled = isLoading || !currentWord || isSaved;
  const saveLabel = isSaved ? "Saved" : "Save Word";

  hintBtn.hidden = isWordSolved;
  saveWordBtn.hidden = !isWordSolved;
  nextWordBtn.hidden = !isWordSolved;

  saveWordBtn.disabled = saveDisabled;
  saveWordBtn.textContent = saveLabel;
  modalSaveBtn.disabled = saveDisabled;
  modalSaveBtn.textContent = saveLabel;

  submitBtn.disabled = disabled;
  hintBtn.disabled = disabled;
  giveUpBtn.disabled = disabled;
}

function revealLetter(char) {
  let matched = false;
  for (let i = 0; i < currentWord.length; i++) {
    if (currentWord[i] === char) {
      revealedLetters[i] = char;
      matched = true;
    }
  }
  return matched;
}

function handleGuess(event) {
  event.preventDefault();
  if (!canPlay()) return;

  const allTiles = wordDisplay.querySelectorAll("input");
  const openTiles = getOpenTiles();
  const typedLetters = [];

  for (const input of openTiles) {
    const char = input.value.trim().toLowerCase();
    if (/^[a-z]$/.test(char)) {
      typedLetters.push(char);
    }
  }

  if (typedLetters.length === 0) return;

  if (typedLetters.length > 1 && typedLetters.length < openTiles.length) {
    outputMessage.textContent = "Guess one letter, or fill every tile to guess the word.";
    return;
  }

  let guess = "";
  if (typedLetters.length === 1) {
    guess = typedLetters[0];
  } else {
    for (const input of allTiles) {
      guess += input.value.trim().toLowerCase();
    }
  }

  for (const input of openTiles) {
    input.value = "";
  }

  if (guesses.includes(guess)) {
    outputMessage.textContent = `You already guessed "${guess.toUpperCase()}".`;
    focusFirstTile();
    return;
  }

  guesses.push(guess);

  let isCorrect = false;
  if (guess.length === 1) {
    isCorrect = revealLetter(guess);
  } else if (guess === currentWord) {
    isCorrect = true;
    revealedLetters = currentWord.split("");
  }

  if (revealedLetters.join("") === currentWord) {
    score += Math.max(0, 10 - revealedHints);
    streak += 1;
    isWordSolved = true;
    outputMessage.textContent = "Correct! Save this word or continue to the next one.";
    gameBoard.classList.add("correct-flash");
    setTimeout(() => gameBoard.classList.remove("correct-flash"), 650);
    updateBoard();
    nextWordBtn.focus();
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
}

function handleSaveWord() {
  saveWord(currentWord, hints);
  outputMessage.textContent = `Saved "${currentWord}" to your wordbook.`;
  updateBoard();
}

wordDisplay.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/[^a-z]/gi, "");
  if (event.target.value) moveFocus(event.target, 1);
});

wordDisplay.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    guessForm.requestSubmit();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveFocus(event.target, -1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    moveFocus(event.target, 1);
  } else if (event.key === "Backspace" && !event.target.value) {
    moveFocus(event.target, -1);
  }
});

guessForm.addEventListener("submit", handleGuess);

hintBtn.addEventListener("click", () => {
  if (!canPlay() || hints.length === 0) return;

  if (revealedHints >= hints.length - 1) {
    outputMessage.textContent = "All hints revealed!";
    return;
  }

  revealedHints += 1;
  outputMessage.textContent = "";
  updateBoard();
});

giveUpBtn.addEventListener("click", () => {
  if (!canPlay()) return;
  endGame("You gave up.");
});

resetBtn.addEventListener("click", resetGame);

modalRestartBtn.addEventListener("click", () => {
  modal.close();
  resetGame();
});

difficulty.addEventListener("change", () => {
  const hasProgress = !isGameOver && (score > 0 || guesses.length > 0);
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

document.addEventListener("keydown", (event) => {
  if (event.key !== "9") return;
  if (event.target.matches("input, select, textarea")) return;

  const gameContainer = document.querySelector(".game-layout .container");
  if (!gameContainer || gameContainer.querySelector(".yuyu-gif")) return;

  const gif = document.createElement("img");
  gif.src = "Images/yuyulick.gif";
  gif.alt = "";
  gif.className = "yuyu-gif";
  gameContainer.appendChild(gif);

  setTimeout(() => gif.remove(), 3000);
});

resetGame();
