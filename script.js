const fallbackWords = [
  {
    word: "nostalgia",
    definition:
      "A feeling of wistful affection and longing for a past time or place.",
    pos: "noun",
    phonetic: "/nɒˈstældʒə/",
    origin: "From Greek nostos, “homecoming,” and algos, “pain.”",
    example:
      "“The old photograph filled her with nostalgia for summers by the sea.”",
  },

  {
    word: "ephemeral",
    definition: "Lasting for a very short time; fleeting.",
    pos: "adjective",
    phonetic: "/ɪˈfem(ə)rəl/",
    origin: "From Greek ephemeros, “lasting only one day.”",
    example:
      "“The ephemeral beauty of the blossom made it all the more precious.”",
  },
  {
    word: "serendipity",
    definition:
      "The occurrence of events by chance in a happy or beneficial way.",
    pos: "noun",
    phonetic: "/ˌserənˈdipitē/",
    origin: "Coined by Horace Walpole from a Persian fairy tale.",
    example: "“Finding that little bookshop was pure serendipity.”",
  },
  {
    word: "eloquent",
    definition: "Fluent or persuasive in speaking or writing.",
    pos: "adjective",
    phonetic: "/ˈeləkwənt/",
    origin: "From Latin eloqui, “to speak out.”",
    example: "“Her eloquent essay made the complicated idea feel clear.”",
  },
];
let current = fallbackWords[0];
let round = 1;
let score = 420;
let used = 0;
let guesses = 5;
const $ = (id) => document.getElementById(id);
const renderWord = (item) => {
  current = item;
  $("definition").textContent = item.definition;
  $("partOfSpeech").textContent = item.pos;
  $("letterCount").textContent =
    `${item.word.length.toString().padStart(2, "0")} letters`;
  $("phonetic").textContent = item.phonetic;
  $("recapWord").textContent = item.word;
  $("recapOrigin").textContent = item.origin;
  $("recapExample").textContent = item.example;
};
const startRound = () => {
  renderWord(fallbackWords[(round - 1) % fallbackWords.length]);
  $("round").textContent = String(round).padStart(2, "0");
  $("recap").classList.remove("show");
  $("guessInput").value = "";
  $("status").textContent = "You have 5 guesses. Take your best shot.";
  guesses = 5;
  used = 0;
  $("clueCount").textContent = "0";
  document.querySelectorAll(".hint").forEach((button) => {
    button.disabled = false;
    button.style.opacity = "";
  });
};
$("guessForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const guess = $("guessInput").value.trim().toLowerCase();
  if (!guess) return;
  guesses--;
  if (guess === current.word) {
    score += 100;
    $("score").textContent = `${score} pts`;
    $("status").textContent = "Correct. A beautiful word to keep.";
    $("recap").classList.add("show");
  } else if (guesses === 0) {
    $("status").textContent =
      `The word was ${current.word}. Read on to make it yours.`;
    $("recap").classList.add("show");
  } else {
    $("status").textContent =
      `Not quite. ${guesses} guess${guesses === 1 ? "" : "es"} left.`;
  }
});
document.querySelectorAll(".hint").forEach((button) =>
  button.addEventListener("click", () => {
    if (button.disabled) return;
    used++;
    score = Math.max(
      0,
      score -
        Number(button.querySelector(".hint-cost").textContent.match(/\d+/)[0]),
    );
    $("score").textContent = `${score} pts`;
    $("clueCount").textContent = used;
    button.disabled = true;
    const type = button.dataset.hint;
    if (type === "pos")
      $("status").textContent = `Hint: it is a ${current.pos}.`;
    if (type === "sound")
      $("status").textContent =
        "Hint unlocked: the phonetic transcription is shown.";
    if (type === "origin") $("status").textContent = `Hint: ${current.origin}`;
  }),
);
$("newRound").addEventListener("click", () => {
  round = round === 5 ? 1 : round + 1;
  startRound();
});
async function getApiWord() {
  const key = localStorage.getItem("lexiguesser-api-key");
  if (!key) return;
  try {
    const response = await fetch("https://api.api-ninjas.com/v2/randomword", {
      headers: { "X-Api-Key": key },
    });
    const data = await response.json();
    const word = Array.isArray(data) ? data[0] : data.word;
    if (!word) return;
    const dictionary = await (
      await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    ).json();
    const meaning = dictionary[0]?.meanings?.[0];
    if (meaning)
      renderWord({
        word,
        definition:
          meaning.definitions?.[0]?.definition ||
          "A new word awaits definition.",
        pos: meaning.partOfSpeech || "word",
        phonetic: dictionary[0]?.phonetic || "—",
        origin: dictionary[0]?.origin || "Origin not available for this word.",
        example:
          meaning.definitions?.[0]?.example ||
          "Make an example sentence of your own.",
      });
  } catch (error) {
    console.info(
      "Using the built-in word set until a valid API key is configured.",
    );
  }
}
getApiWord();
