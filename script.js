document.addEventListener("DOMContentLoaded", () => {
  const COLLEGIATE_KEY = "40644129-d379-4d4f-b467-9f2acc0031b4";
  const THESAURUS_KEY = "3433e909-1655-4e84-a0f4-07479fbed3ff";

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
  const guessInput = document.getElementById("guess-input");
  const wordDisplay = document.getElementById("word-display");
  const hintBox = document.getElementById("hint-box");
  const hintCounter = document.getElementById("hint-counter");
  const saveWordBtn = document.getElementById("save-word-btn");
  const nextWordBtn = document.getElementById("next-word-btn");
  const submitBtn = document.getElementById("submit-btn");
  const wordbookOpenBtn = document.getElementById("wordbook-open-btn");
  const wordbookModal = document.getElementById("wordbook-modal");
  const wordbookList = document.getElementById("wordbook-list");
  const wordbookEmpty = document.getElementById("wordbook-empty");
  const wordbookCount = document.getElementById("wordbook-count");
  const wordbookClearBtn = document.getElementById("wordbook-clear-btn");
  const wordbookCloseBtn = document.getElementById("wordbook-close-btn");
  const gameBoard = document.querySelector(".game-board");
  const modal = document.getElementById("game-modal");
  const modalWordReveal = document.getElementById("modal-word-reveal");
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
  let wordbook = JSON.parse(localStorage.getItem("lexiguessr-wordbook") || "[]");

  function resetGame() {
    score = 0;
    streak = 0;
    lives = 6;
    isWordSolved = false;
    loadWords();
  }

  async function loadWords() {
    outputMessage.textContent = "Loading...";
    const lengths = { 1: 5, 2: 6, 3: 8, 4: 10, 5: 12 };
    const length = lengths[difficulty.value] || 5;

    try {
      const response = await fetch(
        `https://random-word-api.herokuapp.com/word?number=5&diff=${difficulty.value}&length=${length}`,
      );
      words = await response.json();
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

  async function fetchHints(word) {
    try {
      const [dictRes, thesRes] = await Promise.all([
        fetch(
          `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${COLLEGIATE_KEY}`,
        ),
        fetch(
          `https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=${THESAURUS_KEY}`,
        ),
      ]);
      const [dictData, thesData] = await Promise.all([dictRes.json(), thesRes.json()]);
      const dictEntry = Array.isArray(dictData)
        ? dictData.find((item) => typeof item === "object" && item?.shortdef?.length)
        : null;
      const thesEntry = Array.isArray(thesData)
        ? thesData.find((item) => typeof item === "object" && item?.meta)
        : null;

      return buildHints(word, dictEntry, thesEntry);
    } catch {
      return buildHints(word, null, null);
    }
  }

  function buildHints(word, dictEntry, thesEntry) {
    const vowels = word.replace(/[^aeiou]/gi, "").length;
    const consonants = word.length - vowels;
    const syllables = dictEntry?.hwi?.hw ? dictEntry.hwi.hw.split("*").length : 1;
    const isPlural =
      word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us") && !word.endsWith("is");

    return [
      {
        category: "Definition",
        text: dictEntry?.shortdef?.[0] || thesEntry?.shortdef?.[0] || "No definition available",
      },
      {
        category: "Part of Speech",
        text: dictEntry?.fl || thesEntry?.fl || "Unknown",
      },
      {
        category: "Syllables",
        text: `${syllables} syllable(s)`,
      },
      {
        category: "Vowels & Consonants",
        text: `${vowels} vowel(s), ${consonants} consonant(s)`,
      },
      {
        category: "Plurality",
        text: isPlural ? "Plural form" : "Singular form",
      },
      {
        category: "Tense / Form",
        text: getWordForm(word),
      },
      {
        category: "Antonyms",
        text: thesEntry?.meta?.ants?.flat().slice(0, 5).join(", ") || "None available",
      },
      {
        category: "Secondary Definition",
        text: dictEntry?.shortdef?.[1] || thesEntry?.shortdef?.[0] || "None available",
      },
      {
        category: "Synonyms",
        text: thesEntry?.meta?.syns?.flat().slice(0, 5).join(", ") || "None available",
      },
      {
        category: "First & Last Letter",
        text: `Starts with "${word[0].toUpperCase()}", ends with "${word[word.length - 1].toUpperCase()}"`,
      },
    ];
  }

  function getWordForm(word) {
    if (word.endsWith("ed")) return "Past tense";
    if (word.endsWith("ing")) return "Present participle / continuous";
    if (word.endsWith("ly")) return "Adverbial form";
    if (word.endsWith("est")) return "Superlative form";
    if (word.endsWith("er")) return "Comparative form";
    return "Present / Base form";
  }

  function updateBoard() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    livesDisplay.textContent = lives;
    wordLengthInfo.textContent = currentWord ? `${currentWord.length} Letters` : "";
    renderWord();
    renderHints();

    const isSaved = wordbook.some((item) => item.word === currentWord);
    saveWordBtn.hidden = !isWordSolved;
    saveWordBtn.disabled = isSaved;
    saveWordBtn.textContent = isSaved ? "Saved" : "Save Word";
    nextWordBtn.hidden = !isWordSolved;

    const inputsDisabled = !currentWord || lives <= 0 || isWordSolved;
    guessInput.disabled = inputsDisabled;
    submitBtn.disabled = inputsDisabled;
    hintBtn.disabled = inputsDisabled;
    giveUpBtn.disabled = inputsDisabled;
  }

  function renderWord() {
    wordDisplay.innerHTML = revealedLetters
      .map((letter) =>
        letter
          ? `<span class="letter-tile">${letter}</span>`
          : '<span class="letter-tile empty">_</span>',
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

  function renderWordbook() {
    wordbookCount.textContent = `${wordbook.length} saved word(s)`;
    wordbookEmpty.hidden = wordbook.length > 0;
    wordbookList.innerHTML = wordbook
      .map(
        (item) => `
          <li class="wordbook-entry">
            <strong>${item.word}</strong>
            <p>${item.definition}</p>
            <p class="wordbook-details">${item.partOfSpeech} · ${item.synonyms}</p>
          </li>`,
      )
      .join("");
  }

  function revealGuess(guess) {
    const chars = guess.split("");
    let matched = false;

    if (chars.length === 1) {
      for (let i = 0; i < currentWord.length; i++) {
        if (currentWord[i] === chars[0]) {
          revealedLetters[i] = currentWord[i];
          matched = true;
        }
      }
    } else {
      for (let i = 0; i < currentWord.length; i++) {
        if (chars[i] === currentWord[i]) {
          revealedLetters[i] = currentWord[i];
          matched = true;
        }
      }
    }

    return matched;
  }

  if (!guessForm) return;

  guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const guess = guessInput.value.trim().toLowerCase();
    guessInput.value = "";
    if (!guess || !currentWord || lives <= 0 || isWordSolved) return;

    const matched = revealGuess(guess);

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

    if (guess.length === 1 && matched) {
      outputMessage.textContent = "Good guess!";
      updateBoard();
      return;
    }

    lives -= 1;
    streak = 0;
    outputMessage.textContent = "Wrong guess!";
    updateBoard();

    if (lives <= 0) {
      modalWordReveal.textContent = currentWord;
      modal.showModal();
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

  saveWordBtn.addEventListener("click", () => {
    wordbook.unshift({
      word: currentWord,
      definition: hints[0]?.text || "",
      partOfSpeech: hints[1]?.text || "",
      synonyms: hints[8]?.text || "",
    });
    localStorage.setItem("lexiguessr-wordbook", JSON.stringify(wordbook));
    outputMessage.textContent = `Saved "${currentWord}" to your wordbook.`;
    updateBoard();
  });

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
    wordbook = [];
    localStorage.setItem("lexiguessr-wordbook", "[]");
    renderWordbook();
    updateBoard();
  });

  resetGame();
});

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
