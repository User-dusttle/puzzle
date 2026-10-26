
// =========================================================
// Meta Puzzle — Stage 07
// File: js/stages/stage07.js
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage07 = (() => {
  let root = null;
  let languageListener = null;

  const state = {
    guesses: [],
    solved: false,
    requestCount: 0,
    currentKey: "",
    view: "main"
  };

  const REQUIRED_GUESSES = 3;

  // These values are intentionally harmless puzzle tokens.
  // They will be replaced by the integrated cross-stage token chain.
  const TOKENS = ["MINT", "CLOUD", "FRAME"];

  const COPY = {
    "zh-CN": {
      eyebrow: "小游戏 / 单词测试",
      title: "每日单词挑战",
      description:
        "输入一个单词并提交。系统会检查输入格式，但不会告诉你单词是否正确。",
      label: "输入单词",
      placeholder: "输入任意单词……",
      submit: "提交",
      attempts: "已提交次数",
      history: "提交记录",
      empty: "请输入单词。",
      tooLong: "单词长度不能超过 12 个字符。",
      submitted: "已提交。结果已更新。",
      hintTitle: "提示",
      hintText:
        "如果页面上的结果没有变化，试试检查浏览器实际发送了什么请求。",
      successTitle: "请求序列已完成",
      successText:
        "你已提交三次。下一步请在 Network 面板中检查请求 URL 的变化。",
      continue: "进入第八关",
      reset: "重新开始",
      narrator:
        "Wordle？真是经典。这里当然有完整词库，我可不会骗你。",
      tokenLabel: "本次提交的 Key",
      networkLabel: "请求状态",
      requestFailed:
        "请求没有返回普通页面内容。请检查 Network 面板。",
      noHistory: "尚无提交记录。",
      invalidCharacters: "只允许输入英文字母。"
    },
    en: {
      eyebrow: "MINIGAME / WORD TEST",
      title: "Daily Word Challenge",
      description:
        "Enter a word and submit it. The system checks the input format but will not tell you whether the word is correct.",
      label: "Enter a word",
      placeholder: "Enter any word…",
      submit: "Submit",
      attempts: "Submissions",
      history: "Submission history",
      empty: "Please enter a word.",
      tooLong: "Words must not exceed 12 characters.",
      submitted: "Submitted. The result has been updated.",
      hintTitle: "Hint",
      hintText:
        "If the visible page does not change, inspect what the browser actually requested.",
      successTitle: "Request sequence complete",
      successText:
        "You have submitted three times. Inspect the changing request URLs in the Network panel.",
      continue: "Continue to Stage 8",
      reset: "Restart",
      narrator:
        "Wordle? A classic. Of course this has a complete dictionary. I wouldn't lie to you.",
      tokenLabel: "Key for this submission",
      networkLabel: "Request status",
      requestFailed:
        "The request did not return ordinary page content. Check the Network panel.",
      noHistory: "No submissions yet.",
      invalidCharacters: "Only English letters are allowed."
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

  function render() {
    state.view = "main";

    root.innerHTML = `
      <section class="page page--reading stage07">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("description"))}</p>
        </header>

        <section class="panel content-stack">
          <label for="stage07-word">${escapeHTML(t("label"))}</label>

          <form id="stage07-form" class="content-stack">
            <input
              id="stage07-word"
              type="text"
              maxlength="12"
              placeholder="${escapeHTML(t("placeholder"))}"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
            >

            <button class="primary-button" type="submit">
              ${escapeHTML(t("submit"))}
            </button>
          </form>

          <p>
            ${escapeHTML(t("attempts"))}:
            <strong id="stage07-count">0</strong> / ${REQUIRED_GUESSES}
          </p>

          <p id="stage07-status" aria-live="polite"></p>
        </section>

        <section class="page-section">
          <h2>${escapeHTML(t("history"))}</h2>
          <ol id="stage07-history" class="stage07-history">
            <li>${escapeHTML(t("noHistory"))}</li>
          </ol>
        </section>

        <section class="page-section">
          <h2>${escapeHTML(t("hintTitle"))}</h2>
          <p>${escapeHTML(t("hintText"))}</p>
        </section>

        <section
          id="stage07-success"
          class="panel content-stack"
          hidden
          aria-live="polite"
        >
          <h2>${escapeHTML(t("successTitle"))}</h2>
          <p>${escapeHTML(t("successText"))}</p>

          <button
            id="stage07-continue"
            class="primary-button"
            type="button"
          >
            ${escapeHTML(t("continue"))}
          </button>
        </section>

        <section class="page-section">
          <button id="stage07-reset" class="secondary-button" type="button">
            ${escapeHTML(t("reset"))}
          </button>
        </section>
      </section>
    `;

    root.querySelector("#stage07-form")?.addEventListener(
      "submit",
      handleSubmit
    );

    root.querySelector("#stage07-reset")?.addEventListener("click", reset);

    root.querySelector("#stage07-continue")?.addEventListener("click", () => {
      if (!state.solved) return;

      Progress.completeStage(7);
      Router.navigate(Router.ROUTES.stage(8));
    });

    updateHistory();
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (state.solved) return;

    const input = root.querySelector("#stage07-word");
    const status = root.querySelector("#stage07-status");

    const word = String(input?.value ?? "").trim().toUpperCase();

    if (!word) {
      status.textContent = t("empty");
      return;
    }

    if (word.length > 12) {
      status.textContent = t("tooLong");
      return;
    }

    if (!/^[A-Z]+$/.test(word)) {
      status.textContent = t("invalidCharacters");
      return;
    }

    // No dictionary check: any alphabetic input is accepted.
    state.guesses.push(word);
    state.requestCount += 1;

    const token = TOKENS[(state.requestCount - 1) % TOKENS.length];
    state.currentKey = token;

    status.textContent = t("submitted");

    // This request is intentionally visible in the browser's Network panel.
    // The endpoint responds with a small JSON payload rather than navigating
    // to a different page.
    sendPuzzleRequest(token, word);

    updateHistory();

    input.value = "";
    input.focus();

    if (state.requestCount >= REQUIRED_GUESSES) {
      state.solved = true;

      const success = root.querySelector("#stage07-success");
      if (success) success.hidden = false;

      Narrator.reactTo("correct-answer", {
        stage: 7,
        submissions: state.requestCount
      });
    }
  }

  function sendPuzzleRequest(token, word) {
    const params = new URLSearchParams({
      Key: token,
      word,
      attempt: String(state.requestCount)
    });

    // Use a same-origin URL so this works on GitHub Pages under a project
    // path. The final integrated version will route this to a static fixture.
    const url = new URL(
      Router.toUrl("/stage/07/"),
      window.location.origin
    );

    url.search = params.toString();

    // Keep the current page in place while making the URL visible in Network.
    // A no-cors request is not used: this same-origin GET is safe and readable.
    fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Meta-Puzzle-Request": "stage07"
      },
      cache: "no-store"
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    }).catch(() => {
      const status = root?.querySelector("#stage07-status");
      if (status) {
        status.textContent = t("requestFailed");
      }
    });
  }

  function updateHistory() {
    if (!root) return;

    const history = root.querySelector("#stage07-history");
    const count = root.querySelector("#stage07-count");

    if (count) {
      count.textContent = String(state.requestCount);
    }

    if (!history) return;

    if (state.guesses.length === 0) {
      history.innerHTML = `<li>${escapeHTML(t("noHistory"))}</li>`;
      return;
    }

    history.innerHTML = state.guesses.map((word, index) => `
      <li>
        <span>${escapeHTML(word)}</span>
        <span class="muted">#${index + 1}</span>
      </li>
    `).join("");
  }

  function reset() {
    state.guesses = [];
    state.solved = false;
    state.requestCount = 0;
    state.currentKey = "";

    render();
  }

  function onLanguageChange() {
    if (!root) return;

    const container = root;
    const previousGuesses = [...state.guesses];
    const previousSolved = state.solved;
    const previousCount = state.requestCount;
    const previousKey = state.currentKey;

    render();

    state.guesses = previousGuesses;
    state.solved = previousSolved;
    state.requestCount = previousCount;
    state.currentKey = previousKey;

    updateHistory();

    if (state.solved) {
      const success = root.querySelector("#stage07-success");
      if (success) success.hidden = false;
    }
  }

  function mount(container) {
    root = container;

    state.guesses = [];
    state.solved = false;
    state.requestCount = 0;
    state.currentKey = "";

    render();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(7);
    Narrator.speakCustom({
      zh: t("narrator"),
      en: t("narrator")
    }, "smug");

    return { unmount };
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
      guesses: [...state.guesses],
      solved: state.solved,
      requestCount: state.requestCount,
      currentKey: state.currentKey
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage07;
