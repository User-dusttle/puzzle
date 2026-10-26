
import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage02 = (() => {
  let root = null;
  let languageListener = null;
  let consoleCommandHandler = null;
  let glitchTimer = null;
  let glitchRestoreTimer = null;

  const state = {
    discovered: false,
    attempts: 0
  };

  const GLITCH = "d#e@v%e&l*o+p-e?r!t_o=o.l?s";

  const COPY = {
    "zh-CN": {
      eyebrow: "连接状态 / CONNECTION STATUS",
      title: "连接似乎不太稳定。",
      description: "部分页面内容暂时无法加载。请稍后重试，或者继续浏览当前页面。",
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
      description: "Some page content could not be loaded. Please try again later, or keep browsing.",
      status: "Connection status",
      statusValue: "Unstable",
      retry: "Check again",
      retryMessage: "Check complete: no issues found. At least, that's what the page says.",
      note: "System notice",
      noteText: "If some content looks unusual, it may only be a temporary display issue.",
      discovered: "You found a hidden message.",
      continue: "Continue to Stage 3",
      narrator: "Uh, the connection seems a little unstable. It probably isn't my fault.",
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
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function clearGlitchTimers() {
    if (glitchTimer !== null) {
      window.clearTimeout(glitchTimer);
      glitchTimer = null;
    }

    if (glitchRestoreTimer !== null) {
      window.clearTimeout(glitchRestoreTimer);
      glitchRestoreTimer = null;
    }

    const text = document.querySelector("#narrator-text");

    if (text) {
      text.style.color = "";
    }
  }

  function speakNormalLine() {
    Narrator.speakCustom({
      zh: t("narrator"),
      en: t("narrator")
    }, "confused");
  }

  function playNarratorGlitch() {
    clearGlitchTimers();

    // 先通过旁白系统触发一次台词更新。
    Narrator.speakCustom({
      zh: GLITCH,
      en: GLITCH
    }, "confused");

    // 等待旁白系统完成更新，再强制写入乱码。
    glitchTimer = window.setTimeout(() => {
      glitchTimer = null;

      const textElement = document.querySelector("#narrator-text");

      if (textElement) {
        textElement.textContent = GLITCH;
        textElement.style.color = "#c33";
      }

      // 乱码显示 4 秒后恢复正常旁白。
      glitchRestoreTimer = window.setTimeout(() => {
        glitchRestoreTimer = null;

        const currentText = document.querySelector("#narrator-text");

        if (currentText) {
          currentText.style.color = "";
        }

        speakNormalLine();
      }, 4000);
    }, 100);
  }

  function render(container) {
    root = container;

    root.innerHTML = `
      <section class="page page--reading stage02">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("description"))}</p>
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
        </section>

        <section
          id="stage02-success"
          class="panel content-stack"
          style="display: ${state.discovered ? "block" : "none"};"
          aria-live="polite"
        >
          <h2>${escapeHTML(t("discovered"))}</h2>
          <p id="stage02-success-text">${escapeHTML(t("discovered"))}</p>

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
      if (!state.discovered) return;

      Progress.completeStage(2);

      // 使用 SPA 路由方式跳转，不请求真实的 /stage/03/ 文件夹。
      const target = Router.toUrl(Router.ROUTES.stage(3));

      window.history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    installConsoleDiscovery();
  }

  function printConsoleClue() {
    console.info(
      "%c[diagnostic] content decoding failed",
      "color: #888;"
    );

    console.info(
      "%c[hint] developer tools",
      "color: #c33; font-weight: bold;"
    );

    console.info(
      "%c[route] /stage/03/",
      "color: #888;"
    );

    console.info(
      "%c[manual] Execute this command to reveal the next button:",
      "color: #888;"
    );

    console.info(
      'window.dispatchEvent(new CustomEvent("meta-puzzle:stage02-found"))'
    );
  }

  function installConsoleDiscovery() {
    if (consoleCommandHandler) {
      window.removeEventListener(
        "meta-puzzle:stage02-found",
        consoleCommandHandler
      );
    }

    consoleCommandHandler = () => {
      if (state.discovered || !root) return;

      state.discovered = true;

      const success = root.querySelector("#stage02-success");

      if (success) {
        success.style.display = "block";
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
    if (!root) return;

    render(root);
    printConsoleClue();
  }

  function mount(container) {
    state.discovered = false;
    state.attempts = 0;

    clearGlitchTimers();

    render(container);
    printConsoleClue();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(2);
    playNarratorGlitch();

    return { unmount };
  }

  function unmount() {
    clearGlitchTimers();

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

