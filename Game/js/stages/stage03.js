
// =========================================================
// Meta Puzzle — Stage 03
// File: js/stages/stage03.js
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage03 = (() => {
  let root = null;
  let languageListener = null;

  const state = {
    attempts: 0,
    solved: false
  };

  // The filename is part of the puzzle.
  // Do not include the extension in the search answer.
  const IMAGE_FILENAME = "quiet_morning_7f3a";
  const IMAGE_URL =
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e" +
    "?auto=format&fit=crop&w=1400&q=85";

  const COPY = {
    "zh-CN": {
      eyebrow: "帮助中心 / 搜索",
      title: "寻找你需要的答案。",
      description:
        "输入关键词，搜索帮助中心中的相关内容。",
      searchLabel: "搜索帮助文章",
      placeholder: "输入关键词……",
      searchButton: "搜索",
      imageCaption: "推荐阅读 · 自然与生活",
      imageAlt: "一片宁静的山湖风景",
      hintHeading: "搜索提示",
      hintText: "尽量使用简短、准确的关键词。",
      empty: "请输入搜索内容。",
      noResults: "糟糕，没有找到相关结果。请尝试其他关键词。",
      success: "找到了。看来你比这个搜索框聪明一点。",
      continue: "进入第四关",
      narrator:
        "这一关很简单。真的。你只需要搜点东西——别看我，我没说是什么。",
      searchPlaceholderResult: "搜索结果",
      download: "下载图片",
      downloadNote:
        "如果图片没有自动下载，可以右键图片并选择“图片另存为”。"
    },
    en: {
      eyebrow: "HELP CENTER / SEARCH",
      title: "Find the answer you need.",
      description:
        "Enter a keyword to search the Help Center.",
      searchLabel: "Search help articles",
      placeholder: "Enter a keyword…",
      searchButton: "Search",
      imageCaption: "Featured · Nature and Life",
      imageAlt: "A quiet mountain lake landscape",
      hintHeading: "Search tip",
      hintText: "Use short, specific keywords.",
      empty: "Please enter a search term.",
      noResults: "No results found. Try another keyword.",
      success: "Found it. You're a little smarter than this search box.",
      continue: "Continue to Stage 4",
      narrator:
        "This level is easy. Really. Just search for something—don't look at me, I didn't say what.",
      searchPlaceholderResult: "Search results",
      download: "Download image",
      downloadNote:
        "If the image does not download automatically, right-click it and choose Save image as."
    }
  };

  function lang() {
    return I18n.getLanguage() === "en" ? "en" : "zh-CN";
  }

  function t(key) {
    return COPY[lang()][key] ?? key;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function render(container) {
    root = container;

    root.innerHTML = `
      <section class="page page--reading stage03">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">
            ${escapeHTML(t("description"))}
          </p>
        </header>

        <section class="page-section">
          <form id="stage03-search" class="content-stack">
            <label for="stage03-query">
              ${escapeHTML(t("searchLabel"))}
            </label>

            <div class="button-row">
              <input
                id="stage03-query"
                name="q"
                type="search"
                placeholder="${escapeHTML(t("placeholder"))}"
                autocomplete="off"
                spellcheck="false"
              >

              <button class="primary-button" type="submit">
                ${escapeHTML(t("searchButton"))}
              </button>
            </div>
          </form>

          <div
            id="stage03-results"
            class="stage03-results"
            aria-live="polite"
          ></div>
        </section>

        <section class="page-section">
          <h2>${escapeHTML(t("imageCaption"))}</h2>

          <figure class="stage03-figure">
            <img
              id="stage03-landscape"
              class="stage03-landscape"
              src="${IMAGE_URL}"
              alt="${escapeHTML(t("imageAlt"))}"
              loading="lazy"
            >

            <figcaption class="muted">
              ${escapeHTML(t("imageCaption"))}
            </figcaption>
          </figure>

          <div class="content-stack">
            <a
              id="stage03-download"
              class="secondary-button"
              href="${IMAGE_URL}"
              download="${IMAGE_FILENAME}.jpg"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeHTML(t("download"))}
            </a>

            <p class="muted">
              ${escapeHTML(t("downloadNote"))}
            </p>
          </div>
        </section>

        <section class="page-section">
          <h2>${escapeHTML(t("hintHeading"))}</h2>
          <p>${escapeHTML(t("hintText"))}</p>
        </section>

        <section
          id="stage03-success"
          class="panel content-stack"
          hidden
          aria-live="polite"
        >
          <h2>${escapeHTML(t("success"))}</h2>

          <button
            id="stage03-continue"
            class="primary-button"
            type="button"
          >
            ${escapeHTML(t("continue"))}
          </button>
        </section>
      </section>
    `;

    // Clicking the picture is intentionally not a puzzle action.
    root.querySelector("#stage03-landscape")?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
      }
    );

    root.querySelector("#stage03-search")?.addEventListener(
      "submit",
      handleSearch
    );

    root.querySelector("#stage03-continue")?.addEventListener(
      "click",
      () => {
        if (!state.solved) {
          return;
        }

        Progress.completeStage(3);
        Router.navigate(Router.ROUTES.stage(4));
      }
    );
  }

  function handleSearch(event) {
    event.preventDefault();

    if (!root || state.solved) {
      return;
    }

    const input = root.querySelector("#stage03-query");
    const results = root.querySelector("#stage03-results");

    const query = String(input?.value ?? "")
      .trim()
      .toLowerCase();

    state.attempts += 1;

    if (!query) {
      results.textContent = t("empty");
      Narrator.reactTo("wrong-answer", {
        stage: 3,
        empty: true
      });
      return;
    }

    // The answer deliberately excludes ".jpg".
    if (query === IMAGE_FILENAME.toLowerCase()) {
      state.solved = true;

      results.innerHTML = `
        <article class="panel content-stack">
          <p class="muted">${escapeHTML(t("searchPlaceholderResult"))}</p>
          <h2>${escapeHTML(IMAGE_FILENAME)}</h2>
          <p>${escapeHTML(t("success"))}</p>
        </article>
      `;

      const success = root.querySelector("#stage03-success");
      if (success) {
        success.hidden = false;
      }

      Narrator.reactTo("correct-answer", {
        stage: 3
      });

      return;
    }

    results.innerHTML = `
      <p class="stage03-no-results">
        ${escapeHTML(t("noResults"))}
      </p>
    `;

    Narrator.reactTo("wrong-answer", {
      stage: 3,
      attempt: state.attempts
    });
  }

  function onLanguageChange() {
    if (!root) {
      return;
    }

    const container = root;
    render(container);

    // Language changes should not silently erase puzzle progress.
    if (state.solved) {
      const success = root.querySelector("#stage03-success");
      if (success) {
        success.hidden = false;
      }
    }
  }

  function mount(container) {
    state.attempts = 0;
    state.solved = false;

    render(container);

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(3);
    Narrator.speakCustom({
      zh: t("narrator"),
      en: t("narrator")
    }, "smug");

    return {
      unmount
    };
  }

  function unmount() {
    if (languageListener) {
      window.removeEventListener("languagechange", languageListener);
      languageListener = null;
    }

    root = null;
  }

  function getState() {
    return {
      attempts: state.attempts,
      solved: state.solved
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage03;
