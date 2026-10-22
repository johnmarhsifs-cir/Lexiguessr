const COLLEGIATE_KEY = "40644129-d379-4d4f-b467-9f2acc0031b4";
const THESAURUS_KEY = "3433e909-1655-4e84-a0f4-07479fbed3ff";
const WORD_LENGTHS = { 1: 5, 2: 6, 3: 8, 4: 10, 5: 12 };

export async function fetchWords(difficultyLevel) {
  const length = WORD_LENGTHS[difficultyLevel] || 5;
  const response = await fetch(
    `https://random-word-api.herokuapp.com/word?number=5&diff=${difficultyLevel}&length=${length}`,
  );
  return response.json();
}

export async function fetchHints(word) {
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
