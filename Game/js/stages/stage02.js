
// =========================================================
// Meta Puzzle — Stage 02
// File: js/stages/stage02.js
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage02 = (() => {
  let root = null;
  let consoleMessage = null;
  let languageListener = null;
  let consoleCommandHandler = null;

  const state = {
    discovered: false,
    attempts: 0
  };

  const COPY = {
    "zh-CN": {
      eyebrow: "连接状态 / CONNECTION STATUS",
      title: "连接似乎不太稳定。",
      description:
        "部分页面内容暂时无法加载。请稍后重试，或者继续浏览当前页面。",
      status: "连接状态",
      statusValue: "不稳定",
      retry: "重新检查",
      retryMessage: "检查完成：没有发现任何问题。至少，页面是这么说的。",
      note: "系统提示",
      noteText: "如果某些内容显示异常，这可能只是暂时的显示问题。",
      discovered: "你找到了一条隐藏消息。",
      continue: "进入第三关",
      narrator: "额，连接似乎不太流畅。应该不是我的问题。",
      consoleHint: "页面状态已更新。"
    },
    en: {
      eyebrow: "CONNECTION STATUS",
      title: "The connection seems unstable.",
      description:
        "Some page content could not be loaded. Please try again later, or keep browsing.",
      status: "Connection status",
      statusValue: "Unstable",
      retry: "Check again",
      retryMessage:
        "Check complete: no issues found. At least, that's what the page says.",
      note: "System notice",
      noteText:
        "If some content looks unusual, it may only be a temporary display issue.",
      discovered: "You found a hidden message.",
      continue: "Continue to Stage 3",
      narrator:
        "Uh, the connection seems a little unstable. It probably isn't my fault.",
      consoleHint: "Page status updated."
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
      <section class="page page--reading stage02">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>

          <h1 class="page-title">${escapeHTML(t("title"))}</h1>

          <p class="page-description">
            ${escapeHTML(t("description"))}
          </p>
        </header>

        <section class="panel content-stack">
          <div class="stage02-status-row">
            <span>${escapeHTML(t("status"))}</span>
            <strong class="stage02-status-value">
              ${escapeHTML(t("statusValue"))}
            </strong>
          </div>

          <div class="stage02-progress" aria-hidden="true">
            <span></span>
          </div>

          <button
            class="secondary-button"
            id="stage02-retry"
            type="button"
          >
            ${escapeHTML(t("retry"))}
          </button>

          <p id="stage02-result" class="muted" aria-live="polite"></p>
        </section>

        <section class="page-section">
          <h2>${escapeHTML(t("note"))}</h2>
          <p>${escapeHTML(t("noteText"))}</p>
        </section>

        <section class="page-section stage02-diagnostic">
          <p class="muted">${escapeHTML(t("consoleHint"))}</p>

          <p
            id="stage02-glitch"
            class="stage02-glitch"
            aria-label="Connection diagnostic"
          ></p>
        </section>

        <section
          id="stage02-success"
          class="panel content-stack"
          hidden
          aria-live="polite"
        >
          <h2>${escapeHTML(t("discovered"))}</h2>
          <p id="stage02-success-text"></p>
          <button
            id="stage02-continue"
            class="primary-button"
            type="button"
          >
            ${escapeHTML(t("continue"))}
          </button>
        </section>
      </section>
    `;

    root.querySelector("#stage02-retry")?.addEventListener("click", () => {
      state.attempts += 1;

      const result = root.querySelector("#stage02-result");
      if (result) {
        result.textContent = t("retryMessage");
      }

      Narrator.reactTo("wrong-answer", {
        stage: 2,
        attempt: state.attempts
      });
    });

    root.querySelector("#stage02-continue")?.addEventListener("click", () => {
      if (!state.discovered) {
        return;
      }

      Progress.completeStage(2);
      Router.navigate(Router.ROUTES.stage(3));
    });

    renderGlitch();
    startGlitchEffect();
    printConsoleClue();
  }

  const GLITCH = [
    "d#e@v%e&l*o+p-e?r!t_o=o.l?s",
    "d#e@v%e&l*o+p-e?r!t_o=o.l?s",
    "d#e@v%e&l*o+p-e?r!t_o=o.l?s"
  ];

  function renderGlitch() {
    const element = root?.querySelector("#stage02-glitch");
    if (!element) {
      return;
    }

    // The visible text is deliberately noisy, but its letters are
    // still recoverable by ignoring the inserted separators.
    element.textContent = GLITCH[0];
  }

  function startGlitchEffect() {
    const element = root?.querySelector("#stage02-glitch");
    if (!element) {
      return;
    }

    element.classList.remove("stage02-glitch--red");

    window.setTimeout(() => {
      if (!element.isConnected) {
        return;
      }

      element.classList.add("stage02-glitch--red");

      window.setTimeout(() => {
        if (!element.isConnected) {
          return;
        }

        element.classList.remove("stage02-glitch--red");
      }, 900);
    }, 1200);
  }

  function printConsoleClue() {
    // This message is intended to be found in the browser console.
    // It is not a security boundary: the browser can always inspect
    // client-side code and state.
    consoleMessage = [
      "[diagnostic] content decoding failed",
      "[hint] developer tools",
      "[route] /stage/03/"
    ].join(" | ");

    console.info(
      "%c[diagnostic] content decoding failed",
      "color: #888; font-weight: normal;"
    );

    console.info(
      "%c[hint] developer tools",
      "color: #c33; font-weight: bold;"
    );

    console.info(
      "%c[route] /stage/03/",
      "color: #888; font-weight: normal;"
    );

    // Do not automatically unlock the next stage merely because the
    // route appears in the console. The player must explicitly activate
    // the discovery mechanism below.
    installConsoleDiscovery();
  }

  function installConsoleDiscovery() {
    // The clue is intentionally simple for this early level:
    // enter the phrase shown in the console into the page's diagnostic
    // discovery field by using the browser console.
    //
    // The console command is:
    // window.dispatchEvent(new CustomEvent("meta-puzzle:stage02-found"))
    consoleCommandHandler = () => {
      if (state.discovered || !root) {
        return;
      }

      state.discovered = true;

      const success = root.querySelector("#stage02-success");
      const successText = root.querySelector("#stage02-success-text");

      if (success) {
        success.hidden = false;
      }

      if (successText) {
        successText.textContent = t("discovered");
      }

      Narrator.reactTo("console-found", {
        stage: 2
      });
    };

    window.addEventListener(
      "meta-puzzle:stage02-found",
      consoleCommandHandler
    );
  }

  function onLanguageChange() {
    if (!root) {
      return;
    }

    const container = root;
    render(container);
  }

  function mount(container) {
    state.discovered = false;
    state.attempts = 0;

    render(container);

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(2);
    Narrator.speakCustom({
      zh: t("narrator"),
      en: t("narrator")
    }, "confused");

    return {
      unmount
    };
  }

  function unmount() {
    if (languageListener) {
      window.removeEventListener("languagechange", languageListener);
      languageListener = null;
    }

    if (consoleCommandHandler) {
      window.removeEventListener(
        "meta-puzzle:stage02-found",
        consoleCommandHandler
      );
      consoleCommandHandler = null;
    }

    root = null;
    consoleMessage = null;
  }

  function getState() {
    return {
      discovered: state.discovered,
      attempts: state.attempts
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage02;
