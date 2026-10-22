const wordbookList = document.getElementById("wordbook-list");
const wordbookEmpty = document.getElementById("wordbook-empty");
const wordbookCount = document.getElementById("wordbook-count");

export let wordbook = JSON.parse(localStorage.getItem("lexiguessr-wordbook") || "[]");

export function saveWord(word, hints) {
  wordbook.unshift({
    word,
    definition: hints[0]?.text || "",
    partOfSpeech: hints[1]?.text || "",
    synonyms: hints[8]?.text || "",
  });
  localStorage.setItem("lexiguessr-wordbook", JSON.stringify(wordbook));
}

export function clearWordbook() {
  wordbook = [];
  localStorage.setItem("lexiguessr-wordbook", "[]");
  renderWordbook();
}

export function renderWordbook() {
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
