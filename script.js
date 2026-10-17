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
  const modal = document.getElementById("game-modal");
  const modalWordReveal = document.getElementById("modal-word-reveal");
  const modalRestartBtn = document.getElementById("modal-restart-btn");

  let words = [];
  let currentWordIndex = 0;
  let currentWord = "";
  let revealedLetters = [];
  let hints = [];
  let revealedHints = 0;
  let score = 0;
  let streak = 0;
  let lives = 6;

  function resetGame() {
    score = 0;
    streak = 0;
    lives = 6;
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
        category: "Plurality",
        text: isPlural ? "Plural form" : "Singular form",
      },
      {
        category: "Tense / Form",
        text: getWordForm(word),
      },
      {
        category: "Secondary Definition",
        text: dictEntry?.shortdef?.[1] || thesEntry?.shortdef?.[0] || "None available",
      },
      {
        category: "Antonyms",
        text: thesEntry?.meta?.ants?.flat().slice(0, 5).join(", ") || "None available",
      },
      {
        category: "Synonyms",
        text: thesEntry?.meta?.syns?.flat().slice(0, 5).join(", ") || "None available",
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
    hintBox.innerHTML = visibleHints
      .map(
        (hint) =>
          `<div class="hint-item"><span class="hint-badge">${hint.category}</span><span class="hint-text">${hint.text}</span></div>`,
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

  guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const guess = guessInput.value.trim().toLowerCase();
    guessInput.value = "";
    if (!guess || !currentWord || lives <= 0) return;

    const matched = revealGuess(guess);

    if (revealedLetters.join("") === currentWord) {
      score += Math.max(0, 10 - revealedHints);
      streak += 1;
      currentWordIndex += 1;
      outputMessage.textContent = "Correct!";

      if (currentWordIndex >= words.length) {
        loadWords();
      } else {
        startWord();
      }
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
    if (lives <= 0 || !currentWord || !hints.length) return;

    if (revealedHints >= hints.length - 1) {
      outputMessage.textContent = "All hints revealed!";
      return;
    }

    revealedHints += 1;
    outputMessage.textContent = "";
    updateBoard();
  });

  giveUpBtn.addEventListener("click", () => {
    if (!currentWord) return;
    modalWordReveal.textContent = currentWord;
    modal.showModal();
  });

  resetBtn.addEventListener("click", resetGame);

  modalRestartBtn.addEventListener("click", () => {
    modal.close();
    resetGame();
  });

  difficulty.addEventListener("change", resetGame);

  resetGame();
});
