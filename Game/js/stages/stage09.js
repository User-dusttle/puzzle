
// =========================================================
// Meta Puzzle — Stage 09
// File: js/stages/stage09.js
//
// Puzzle:
// - Narrator pretends to reset the player to Stage 1.
// - The page looks like a familiar help center.
// - Old exits appear broken because they now require a 2-second hold.
// - The hidden exit unlocks Stage 10.
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage09 = (() => {
  let root = null;
  let languageListener = null;
  let holdTimer = null;
  let holdTarget = null;
  let holdStart = 0;

  const HOLD_DURATION = 2000;

  const state = {
    resetSeen: false,
    holdDiscovered: false,
    solved: false,
    attempts: 0
  };

  const COPY = {
    "zh-CN": {
      eyebrow: "系统通知 / 异常恢复",
      title: "进度已重置",
      subtitle: "SYSTEM RECOVERY",
      warningTitle: "检测到异常行为",
      warningText:
        "系统发现了若干不符合预期的操作。为避免进一步损坏，您的进度已被重置至第一关。",
      narrator:
        "恭喜你。你成功把一个本来就不怎么正常的网站弄坏了。现在回到第一关，重新学习如何点击链接吧。",
      pageTitle: "Help Center",
      pageDescription:
        "Welcome to the Help Center. Select a topic below to find the information you need.",
      links: [
        "Getting Started",
        "Account Settings",
        "Troubleshooting",
        "Privacy Policy",
        "Contact Support"
      ],
      footer: "© 2026 Help Center",
      failed: "没有任何反应。",
      holdHint:
        "如果你无聊到愿意在页面上的每个地方多停留一会儿，也许会发现一些东西。",
      progress: "恢复状态",
      attempts: "尝试次数",
      successTitle: "出口已重新启用",
      successText:
        "这次不是点击。系统等待的是一次持续的按压。",
      continue: "进入第十关",
      reset: "重新加载本关",
      reliableHint:
        "可靠提示：交互方式可能变了。试试按住某个页面元素，而不是快速点击。"
    },
    en: {
      eyebrow: "SYSTEM NOTICE / RECOVERY",
      title: "Progress Reset",
      subtitle: "SYSTEM RECOVERY",
      warningTitle: "Unexpected Behavior Detected",
      warningText:
        "The system detected several unexpected actions. To prevent further damage, your progress has been reset to Stage One.",
      narrator:
        "Congratulations. You managed to break a website that was barely functional to begin with. Back to Stage One. Time to relearn clicking links.",
      pageTitle: "Help Center",
      pageDescription:
        "Welcome to the Help Center. Select a topic below to find the information you need.",
      links: [
        "Getting Started",
        "Account Settings",
        "Troubleshooting",
        "Privacy Policy",
        "Contact Support"
      ],
      footer: "© 2026 Help Center",
      failed: "Nothing happens.",
      holdHint:
        "If you're bored enough to linger over every part of this page, you might notice something.",
      progress: "Recovery Status",
      attempts: "Attempts",
      successTitle: "Exit Re-enabled",
      successText:
        "This time, clicking is not enough. The system is waiting for a sustained press.",
      continue: "Continue to Stage 10",
      reset: "Reload This Stage",
      reliableHint:
        "Reliable hint: the interaction may have changed. Try holding a page element instead of clicking it."
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
    if (!root) return;

    const links = t("links");

    root.innerHTML = `
      <section class="page page--reading stage09">

        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("warningText"))}</p>
        </header>

        <section class="panel content-stack">
          <p class="page-eyebrow">${escapeHTML(t("subtitle"))}</p>
          <h2>${escapeHTML(t("warningTitle"))}</h2>
          <p>${escapeHTML(t("warningText"))}</p>
        </section>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("pageTitle"))}</h2>
          <p>${escapeHTML(t("pageDescription"))}</p>

          <nav class="stage09-links" aria-label="Help Center">
            ${links.map((label, index) => `
              <button
                type="button"
                class="secondary-button stage09-link"
                data-link="${index}"
              >
                ${escapeHTML(label)}
              </button>
            `).join("")}
          </nav>

          <p id="stage09-status" aria-live="polite">
            ${escapeHTML(t("failed"))}
          </p>

          <p class="muted">${escapeHTML(t("footer"))}</p>
        </section>

        <section class="page-section">
          <h2>${escapeHTML(t("progress"))}</h2>
          <p>
            ${escapeHTML(t("attempts"))}:
            <strong id="stage09-attempts">0</strong>
          </p>
        </section>

        <section
          id="stage09-success"
          class="panel content-stack"
          ${state.solved ? "" : "hidden"}
          aria-live="polite"
        >
          <h2>${escapeHTML(t("successTitle"))}</h2>
          <p>${escapeHTML(t("successText"))}</p>
          <button
            id="stage09-continue"
            class="primary-button"
            type="button"
          >
            ${escapeHTML(t("continue"))}
          </button>
        </section>

        <section class="page-section">
          <p>${escapeHTML(t("holdHint"))}</p>
          <details>
            <summary>${lang() === "en" ? "Reliable hint" : "可靠提示"}</summary>
            <p>${escapeHTML(t("reliableHint"))}</p>
          </details>
        </section>

        <section class="page-section">
          <button id="stage09-reset" class="secondary-button" type="button">
            ${escapeHTML(t("reset"))}
          </button>
        </section>

      </section>
    `;

    root.querySelectorAll(".stage09-link").forEach((button) => {
      button.addEventListener("click", () => {
        state.attempts += 1;

        const attempts = root.querySelector("#stage09-attempts");
        if (attempts) attempts.textContent = String(state.attempts);

        const status = root.querySelector("#stage09-status");
        if (status) status.textContent = t("failed");

        Narrator.reactTo("fake-link", {
          stage: 9,
          label: button.textContent.trim()
        });
      });

      button.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        startHold(button);
      });

      button.addEventListener("pointerup", stopHold);
      button.addEventListener("pointerleave", stopHold);
      button.addEventListener("pointercancel", stopHold);
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });

    root.querySelector("#stage09-continue")
      ?.addEventListener("click", () => {
        if (!state.solved) return;

        Progress.completeStage(9);
        Router.navigate(Router.ROUTES.stage(10));
      });

    root.querySelector("#stage09-reset")
      ?.addEventListener("click", () => {
        stopHold();
        state.resetSeen = true;
        state.holdDiscovered = false;
        state.solved = false;
        state.attempts = 0;
        render();
      });
  }

  function startHold(target) {
    if (state.solved || holdTimer) return;

    holdTarget = target;
    holdStart = Date.now();

    target.classList.add("is-holding");

    holdTimer = window.setTimeout(() => {
      holdTimer = null;

      if (!root || !holdTarget) return;

      state.holdDiscovered = true;
      state.solved = true;

      const status = root.querySelector("#stage09-status");
      if (status) status.textContent = t("successText");

      const success = root.querySelector("#stage09-success");
      if (success) success.hidden = false;

      Narrator.speakCustom({
        zh: "……你居然真的会按住不放？我只是随口说说的。",
        en: "...You actually held it down? I was only joking."
      }, "surprised");

      holdTarget.classList.remove("is-holding");
      holdTarget = null;
    }, HOLD_DURATION);
  }

  function stopHold() {
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }

    if (holdTarget) {
      holdTarget.classList.remove("is-holding");
      holdTarget = null;
    }
  }

  function reset() {
    stopHold();

    state.resetSeen = false;
    state.holdDiscovered = false;
    state.solved = false;
    state.attempts = 0;

    render();
  }

  function onLanguageChange() {
    if (!root) return;

    const snapshot = { ...state };
    stopHold();
    render();
    Object.assign(state, snapshot);
    render();
  }

  function mount(container) {
    root = container;

    state.resetSeen = false;
    state.holdDiscovered = false;
    state.solved = false;
    state.attempts = 0;

    render();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(9);

    Narrator.speakCustom({
      zh: COPY["zh-CN"].narrator,
      en: COPY.en.narrator
    }, "angry");

    return { unmount };
  }

  function unmount() {
    stopHold();

    if (languageListener) {
      window.removeEventListener("languagechange", languageListener);
      languageListener = null;
    }

    root = null;
  }

  function getState() {
    return { ...state };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage09;
