
import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

// =========================================================
// Stage 03 — Search
// =========================================================

const IMAGE_FILENAME = "aioJwoiZk";
const IMAGE_URL = "/puzzle/Game/assets/images/aioJwoiZk.png";
const STAGE04_TOKEN = "x7_qm-04_vn";
const STAGE05_KEY = "RGGTR06_LGPM";

const COPY = {
  "zh-CN": {
    title: "第三关：搜索",
    subtitle: "有些东西明明就在眼前，却不一定能被找到。",
    imageTitle: "一张普通的风景照片",
    imageDescription: "也许你应该仔细看看这张图片。",
    searchTitle: "站内搜索",
    searchPlaceholder: "输入搜索内容……",
    searchButton: "搜索",
    empty: "请输入搜索内容。",
    notFound: "没有找到相关结果。",
    successTitle: "找到了。",
    successText: "你找到了正确的结果。准备好进入下一关了吗？",
    next: "进入第四关",
    tokenTitle: "……",
    tokenText: "你找到了一个意料之外的结果。",
    tokenContinue: "继续",
    narrator: "这只是一个搜索框。你不会真的指望它能正常工作吧？",
    photoHint: "这照片挺漂亮的不是吗？我认为你应该把它保存到你的电脑上。",
    foundNarrator: "哦？居然真让你找到了。别得意，后面可没这么简单。",
    tokenNarrator: "……等等。你是从哪里找到这个的？",
    wrongSearchNarrator: "没找到？嗯……看来这个搜索框比你想象的还要没用。",
    laterKey: "你似乎找到了一个有用的关键词，但它不是这一关的通行证。",
    laterFile: "文件名确实很重要，但你还需要找到正确的入口。",
    laterSignal: "信号收到了。可惜，这里不是接收它的地方。",
    keyFoundTitle: "找到了一条线索。",
    keyFoundText: STAGE05_KEY
  },

  en: {
    title: "Stage 03: Search",
    subtitle: "Something can be right in front of you and still remain unfound.",
    imageTitle: "An ordinary landscape photograph",
    imageDescription: "Perhaps you should take a closer look at this image.",
    searchTitle: "Site Search",
    searchPlaceholder: "Enter a search term...",
    searchButton: "Search",
    empty: "Please enter a search term.",
    notFound: "No matching results were found.",
    successTitle: "Found it.",
    successText: "You found the correct result. Ready for the next stage?",
    next: "Continue to Stage 04",
    tokenTitle: "...",
    tokenText: "You found an unexpected result.",
    tokenContinue: "Continue",
    narrator: "It's just a search box. You didn't actually expect it to work, did you?",
    photoHint: "Isn't this photo lovely? I think you should save it to your computer.",
    foundNarrator: "Oh? You actually found it. Don't get smug; it gets harder from here.",
    tokenNarrator: "...Wait. Where did you find that?",
    wrongSearchNarrator: "Nothing found? Hmm... this search box seems even less useful than you thought.",
    laterKey: "That looks like a useful keyword, but it isn't the pass for this stage.",
    laterFile: "The filename does matter, but you still need to find the right entrance.",
    laterSignal: "Signal received. Unfortunately, this isn't where it belongs.",
    keyFoundTitle: "A clue was found.",
    keyFoundText: STAGE05_KEY
  }
};

const SEARCH_INDEX = {
  sihsdiplhvxia: "laterFile",
  stage10_signal_7q: "laterSignal"
};

let state = {
  attempts: 0,
  solved: false,
  tokenFound: false,
  transitioning: false
};

let root = null;
let photoHintTimer = null;

function getLanguage() {
  const language = I18n.getLanguage?.() || "zh-CN";
  return language.toLowerCase().startsWith("en") ? "en" : "zh-CN";
}

function t(key) {
  const language = getLanguage();
  return COPY[language]?.[key] ?? COPY["zh-CN"][key] ?? key;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function render() {
  if (!root) return;

  root.innerHTML = `
    <section class="page page--reading stage03">
      <header class="page-header">
        <p class="page-eyebrow">STAGE 03 / 13</p>
        <h1 class="page-title">${escapeHTML(t("title"))}</h1>
        <p class="page-description">${escapeHTML(t("subtitle"))}</p>
      </header>

      <section class="page-section">
        <h2>${escapeHTML(t("imageTitle"))}</h2>
        <p>${escapeHTML(t("imageDescription"))}</p>
        <figure class="stage03-image">
          <img
            src="${IMAGE_URL}"
            alt="${escapeHTML(t("imageTitle"))}"
            style="display:block;width:100%;max-width:100%;height:auto;border-radius:12px;"
          />
        </figure>
      </section>

      <section class="page-section">
        <h2>${escapeHTML(t("searchTitle"))}</h2>

        <form id="stage03-search-form" class="content-stack" autocomplete="off">
          <label for="stage03-search-input">
            ${escapeHTML(t("searchTitle"))}
          </label>

          <div class="button-row">
            <input
              id="stage03-search-input"
              name="q"
              type="text"
              placeholder="${escapeHTML(t("searchPlaceholder"))}"
              autocomplete="off"
              spellcheck="false"
              ${state.tokenFound ? "disabled" : ""}
            />

            <button
              class="primary-button"
              type="submit"
              ${state.tokenFound ? "disabled" : ""}
            >
              ${escapeHTML(t("searchButton"))}
            </button>
          </div>
        </form>

        <div
          id="stage03-search-result"
          class="stage03-search-result"
          aria-live="polite"
        ></div>

        <div
          id="stage03-token-continue"
          class="page-section"
          ${state.tokenFound ? "" : "hidden"}
        >
          <h2>${escapeHTML(t("tokenTitle"))}</h2>
          <p>${escapeHTML(t("tokenText"))}</p>
          <button
            id="stage03-continue-stage05"
            class="primary-button"
            type="button"
          >
            ${escapeHTML(t("tokenContinue"))}
          </button>
        </div>
      </section>

      <section
        id="stage03-success"
        class="page-section"
        ${state.solved ? "" : "hidden"}
      >
        <h2>${escapeHTML(t("successTitle"))}</h2>
        <p>${escapeHTML(t("successText"))}</p>
        <button id="stage03-next" class="primary-button" type="button">
          ${escapeHTML(t("next"))}
        </button>
      </section>
    </section>
  `;

  root.querySelector("#stage03-search-form")
    ?.addEventListener("submit", handleSearch);

  root.querySelector("#stage03-next")
    ?.addEventListener("click", goNext);

  root.querySelector("#stage03-continue-stage05")
    ?.addEventListener("click", goToStage05);

  if (state.solved) {
    showResult("success", t("successTitle"), t("successText"));
  }

  if (state.tokenFound) {
    showResult("success", STAGE04_TOKEN, t("tokenText"));
  }
}

function showResult(type, title, message) {
  const result = root?.querySelector("#stage03-search-result");
  if (!result) return;

  result.className = `stage03-search-result is-${type}`;
  result.replaceChildren();

  const heading = document.createElement("strong");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  result.append(heading, paragraph);
}

function clearPhotoHintTimer() {
  if (photoHintTimer !== null) {
    window.clearTimeout(photoHintTimer);
    photoHintTimer = null;
  }
}

function handleSearch(event) {
  event.preventDefault();

  if (state.tokenFound || state.transitioning) return;

  const input = root?.querySelector("#stage03-search-input");
  const query = input?.value.trim() ?? "";

  if (!query) {
    showResult("error", t("searchTitle"), t("empty"));
    return;
  }

  state.attempts++;

  // Stage 04 token.
  if (query === STAGE04_TOKEN) {
    clearPhotoHintTimer();
    state.tokenFound = true;

    const searchInput = root?.querySelector("#stage03-search-input");
    const searchButton = root?.querySelector(
      '#stage03-search-form button[type="submit"]'
    );

    if (searchInput) searchInput.disabled = true;
    if (searchButton) searchButton.disabled = true;

    showResult("success", STAGE04_TOKEN, t("tokenText"));

    const continuePanel = root?.querySelector("#stage03-token-continue");
    if (continuePanel) continuePanel.hidden = false;

    Narrator.speakCustom?.({
      "zh-CN": COPY["zh-CN"].tokenNarrator,
      en: COPY.en.tokenNarrator
    }, "surprised");

    return;
  }

  // Stage 03 answer: filename without extension.
  if (query === IMAGE_FILENAME) {
    state.solved = true;
    clearPhotoHintTimer();

    showResult("success", t("successTitle"), t("successText"));

    const success = root?.querySelector("#stage03-success");
    if (success) success.hidden = false;

    Narrator.speakCustom?.({
      "zh-CN": COPY["zh-CN"].foundNarrator,
      en: COPY.en.foundNarrator
    }, "smug");

    return;
  }

  // Stage 05 key clue.
  if (query.toLowerCase() === "key") {
    showResult("info", t("keyFoundTitle"), t("keyFoundText"));
    return;
  }

  // Other special strings.
  const messageKey = SEARCH_INDEX[query.toLowerCase()];

  if (messageKey) {
    showResult("info", t("searchTitle"), t(messageKey));
    return;
  }

  showResult("error", t("searchTitle"), t("notFound"));

  Narrator.speakCustom?.({
    "zh-CN": COPY["zh-CN"].wrongSearchNarrator,
    en: COPY.en.wrongSearchNarrator
  }, "smug");
}

function goNext() {
  if (!state.solved || state.transitioning) return;

  state.transitioning = true;
  Progress.completeStage(3);
  Router.navigate(Router.ROUTES.stage(4));
}

function goToStage05() {
  if (!state.tokenFound || state.transitioning) return;

  state.transitioning = true;
  clearPhotoHintTimer();

  Progress.completeStage(4);
  Router.navigate(Router.ROUTES.stage(5));
}

function schedulePhotoHint() {
  clearPhotoHintTimer();

  photoHintTimer = window.setTimeout(() => {
    photoHintTimer = null;

    if (!root || state.solved || state.tokenFound || state.transitioning) {
      return;
    }

    Narrator.speakCustom?.({
      "zh-CN": COPY["zh-CN"].photoHint,
      en: COPY.en.photoHint
    }, "friendly");
  }, 12000);
}

function mount(container) {
  root = typeof container === "string"
    ? document.querySelector(container)
    : container;

  if (!root) {
    console.error("Stage 03: mount container not found.");
    return;
  }

  clearPhotoHintTimer();

  state = {
    attempts: 0,
    solved: false,
    tokenFound: false,
    transitioning: false
  };

  render();

  Narrator.speakCustom?.({
    "zh-CN": COPY["zh-CN"].narrator,
    en: COPY.en.narrator
  }, "smug");

  schedulePhotoHint();
}

function unmount() {
  clearPhotoHintTimer();

  if (root) root.innerHTML = "";
  root = null;
}

function onLanguageChange() {
  render();
}

export default {
  mount,
  unmount,
  onLanguageChange
};

