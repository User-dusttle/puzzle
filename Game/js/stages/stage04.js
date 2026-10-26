
 // =========================================================
// Meta Puzzle — Stage 04
// File: js/stages/stage04.js
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage04 = (() => {
  let root = null;
  let languageListener = null;
  let dragCleanup = null;
  let localStyle = null;

  const state = {
    visited: new Set(),
    narratorMoved: false,
    narratorLines: 0
  };

  const COPY = {
    "zh-CN": {
      eyebrow: "帮助中心 / 页面诊断",
      title: "页面版本检查",
      description: "部分页面可能来自旧版本。请选择一条路线，查看页面是否正常。",
      routeHeading: "可用路线",
      routeA: "返回上一页",
      routeADesc: "回到你刚才访问的页面。",
      routeB: "打开备用页面",
      routeBDesc: "尝试访问一个备用页面。",
      routeC: "检查页面内容",
      routeCDesc: "检查页面中是否存在异常内容。",
      continue: "继续",
      back: "返回",
      errorTitle: "页面不存在",
      errorText: "你访问的页面暂时无法显示。",
      hiddenIntro: "诊断编号：",
      maskedTitle: "内容检查失败",
      maskedText: "检测到未经确认的内容。显示已被暂时限制。",
      narratorName: "页面助手",
      narratorRole: "页面检查中",
      narratorBubble: "嗯，页面检查。真是令人兴奋。",
      clickNarrator: "怎么了？",
      dragNarrator: "……",
      repeatNarrator: "你很闲吗？",
      clueOne: "x7_qm-",
      clueTwo: "04_vn",
      diagnosticPrefix: "request = ",
      diagnosticSuffix: " ; status = incomplete"
    },
    en: {
      eyebrow: "HELP CENTER / PAGE DIAGNOSTICS",
      title: "Page version check",
      description: "Some pages may belong to older versions. Choose a route to check whether it works.",
      routeHeading: "Available routes",
      routeA: "Return to previous page",
      routeADesc: "Go back to the page you visited before.",
      routeB: "Open backup page",
      routeBDesc: "Try accessing a backup page.",
      routeC: "Inspect page content",
      routeCDesc: "Check whether the page contains unusual content.",
      continue: "Continue",
      back: "Back",
      errorTitle: "Page not found",
      errorText: "The page you requested cannot currently be displayed.",
      hiddenIntro: "Diagnostic code: ",
      maskedTitle: "Content inspection failed",
      maskedText: "Unverified content detected. Display has been temporarily restricted.",
      narratorName: "Page Assistant",
      narratorRole: "Page inspection",
      narratorBubble: "Page inspection. How exciting.",
      clickNarrator: "What?",
      dragNarrator: "...",
      repeatNarrator: "Don't you have anything better to do?",
      clueOne: "x7_qm-",
      clueTwo: "04_vn",
      diagnosticPrefix: "request = ",
      diagnosticSuffix: " ; status = incomplete"
    }
  };

  const SEARCH_TOKEN = "x7_qm-04_vn";

  function lang() {
    const current = I18n.getLanguage?.() || "zh-CN";
    return current.toLowerCase().startsWith("en") ? "en" : "zh-CN";
  }

  function t(key) {
    return COPY[lang()]?.[key] ?? COPY["zh-CN"][key] ?? key;
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

  function speak(key, mood = "smug") {
    Narrator.speakCustom?.({
      "zh-CN": COPY["zh-CN"][key],
      en: COPY.en[key]
    }, mood);
  }

  function navigateToStage3() {
    Router.navigate(Router.ROUTES.stage(3));
  }

  function renderMenu() {
    if (!root) return;

    root.innerHTML = `
      <section class="page page--reading stage04">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("description"))}</p>
        </header>

        <section class="page-section">
          <h2>${escapeHTML(t("routeHeading"))}</h2>

          <div class="card-grid">
            <article class="game-card">
              <h3>${escapeHTML(t("routeA"))}</h3>
              <p>${escapeHTML(t("routeADesc"))}</p>
              <button class="secondary-button" type="button" data-route="previous">
                ${escapeHTML(t("continue"))}
              </button>
            </article>

            <article class="game-card">
              <h3>${escapeHTML(t("routeB"))}</h3>
              <p>${escapeHTML(t("routeBDesc"))}</p>
              <button class="secondary-button" type="button" data-route="backup">
                ${escapeHTML(t("continue"))}
              </button>
            </article>

            <article class="game-card">
              <h3>${escapeHTML(t("routeC"))}</h3>
              <p>${escapeHTML(t("routeCDesc"))}</p>
              <button class="secondary-button" type="button" data-route="inspect">
                ${escapeHTML(t("continue"))}
              </button>
            </article>
          </div>
        </section>
      </section>
    `;

    root.querySelectorAll("[data-route]").forEach(button => {
      button.addEventListener("click", () => {
        openRoute(button.dataset.route);
      });
    });
  }

  function openRoute(route) {
    state.visited.add(route);

    if (route === "previous") {
      speak("narratorBubble");
      navigateToStage3();
      return;
    }

    if (route === "backup") {
      renderBackup();
      return;
    }

    if (route === "inspect") {
      renderInspect();
    }
  }

  function renderBackup() {
    if (!root) return;

    root.innerHTML = `
      <section class="page page--reading stage04 stage04-backup">
        <header class="page-header">
          <p class="page-eyebrow">404</p>
          <h1 class="page-title">${escapeHTML(t("errorTitle"))}</h1>
          <p class="page-description">${escapeHTML(t("errorText"))}</p>
        </header>

        <section class="page-section">
          <p>${escapeHTML(t("hiddenIntro"))}</p>
          <div class="stage04-white-clue">${escapeHTML(t("clueOne"))}</div>
        </section>

        <button id="stage04-back" class="secondary-button" type="button">
          ${escapeHTML(t("back"))}
        </button>
      </section>
    `;

    addStyle();

    root.querySelector("#stage04-back")?.addEventListener("click", renderMenu);
  }

  function renderInspect() {
    if (!root) return;

    root.innerHTML = `
      <section class="page page--reading stage04 stage04-inspect">
        <header class="page-header">
          <p class="page-eyebrow">ROUTE C / INSPECTION</p>
          <h1 class="page-title">${escapeHTML(t("maskedTitle"))}</h1>
          <p class="page-description">${escapeHTML(t("maskedText"))}</p>
        </header>

        <section class="page-section">
          <div class="stage04-drag-area" id="stage04-drag-area">
            <div class="stage04-diagnostic">
              <span>${escapeHTML(t("diagnosticPrefix"))}</span><span>${escapeHTML(t("clueTwo"))}</span><span>${escapeHTML(t("diagnosticSuffix"))}</span>
            </div>

            <div
              class="stage04-narrator"
              id="stage04-narrator"
              role="button"
              tabindex="0"
              aria-label="${escapeHTML(t("narratorName"))}"
            >
              <strong>${escapeHTML(t("narratorName"))}</strong>
              <small>${escapeHTML(t("narratorRole"))}</small>
              <span>${escapeHTML(t("narratorBubble"))}</span>
            </div>
          </div>
        </section>

        <button id="stage04-back" class="secondary-button" type="button">
          ${escapeHTML(t("back"))}
        </button>
      </section>
    `;

    addStyle();

    const area = root.querySelector("#stage04-drag-area");
    const narrator = root.querySelector("#stage04-narrator");

    if (!area || !narrator) return;

    let dragging = false;
    let moved = false;
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;

    function onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;

      const areaRect = area.getBoundingClientRect();
      const rect = narrator.getBoundingClientRect();

      dragging = true;
      moved = false;
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      startX = event.clientX;
      startY = event.clientY;

      narrator.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }

    function onPointerMove(event) {
      if (!dragging) return;

      const areaRect = area.getBoundingClientRect();
      const maxX = Math.max(0, area.clientWidth - narrator.offsetWidth);
      const maxY = Math.max(0, area.clientHeight - narrator.offsetHeight);

      const x = Math.max(0, Math.min(
        event.clientX - areaRect.left - offsetX,
        maxX
      ));

      const y = Math.max(0, Math.min(
        event.clientY - areaRect.top - offsetY,
        maxY
      ));

      narrator.style.left = `${x}px`;
      narrator.style.top = `${y}px`;

      if (
        Math.abs(event.clientX - startX) > 5 ||
        Math.abs(event.clientY - startY) > 5
      ) {
        moved = true;
      }
    }

    function onPointerUp() {
      if (!dragging) return;

      dragging = false;

      if (moved) {
        state.narratorMoved = true;
        state.narratorLines++;

        speak(
          state.narratorLines === 1 ? "dragNarrator" : "repeatNarrator",
          "smug"
        );
      }
    }

    function onClick() {
      // Ignore the click generated after a drag.
      if (moved) {
        moved = false;
        return;
      }

      speak(
        state.narratorMoved ? "repeatNarrator" : "clickNarrator",
        "smug"
      );
    }

    function onKeyDown(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }

    narrator.addEventListener("pointerdown", onPointerDown);
    narrator.addEventListener("pointermove", onPointerMove);
    narrator.addEventListener("pointerup", onPointerUp);
    narrator.addEventListener("pointercancel", onPointerUp);
    narrator.addEventListener("click", onClick);
    narrator.addEventListener("keydown", onKeyDown);

    dragCleanup = () => {
      narrator.removeEventListener("pointerdown", onPointerDown);
      narrator.removeEventListener("pointermove", onPointerMove);
      narrator.removeEventListener("pointerup", onPointerUp);
      narrator.removeEventListener("pointercancel", onPointerUp);
      narrator.removeEventListener("click", onClick);
      narrator.removeEventListener("keydown", onKeyDown);
      dragCleanup = null;
    };

    root.querySelector("#stage04-back")?.addEventListener("click", () => {
      if (dragCleanup) dragCleanup();
      renderMenu();
    });
  }

  function addStyle() {
    if (localStyle) localStyle.remove();

    localStyle = document.createElement("style");
    localStyle.id = "stage04-local-style";
    localStyle.textContent = `
      .stage04-white-clue {
        color: #fff;
        background: #fff;
        padding: 12px;
        min-height: 30px;
        overflow-wrap: anywhere;
        user-select: text;
      }

      .stage04-white-clue::selection {
        color: #111;
        background: #b8d7ff;
      }

      .stage04-drag-area {
        position: relative;
        min-height: 240px;
        overflow: hidden;
        border: 1px solid var(--border-color, #ddd);
        border-radius: 12px;
        padding: 20px;
        background: var(--surface, #fff);
      }

      .stage04-diagnostic {
        position: relative;
        z-index: 1;
        padding: 18px 10px;
        font-family: monospace;
        overflow-wrap: anywhere;
        color: var(--text-color, #222);
      }

      .stage04-narrator {
        position: absolute;
        z-index: 3;
        top: 45px;
        left: 20px;
        width: min(260px, calc(100% - 40px));
        box-sizing: border-box;
        padding: 14px;
        border: 1px solid #aaa;
        border-radius: 12px;
        background: #fff;
        color: #222;
        box-shadow: 0 5px 18px #0002;
        cursor: grab;
        touch-action: none;
        user-select: none;
      }

      .stage04-narrator:active {
        cursor: grabbing;
      }

      .stage04-narrator strong,
      .stage04-narrator small {
        display: block;
        margin-bottom: 6px;
      }
    `;

    document.head.appendChild(localStyle);
  }

  function onLanguageChange() {
    if (!root) return;

    if (dragCleanup) dragCleanup();

    const isInspect = root.querySelector(".stage04-inspect");
    const isBackup = root.querySelector(".stage04-backup");

    if (isInspect) {
      renderInspect();
    } else if (isBackup) {
      renderBackup();
    } else {
      renderMenu();
    }
  }

  function mount(container) {
    root = typeof container === "string"
      ? document.querySelector(container)
      : container;

    if (!root) {
      console.error("Stage 04: mount container not found.");
      return;
    }

    state.visited = new Set();
    state.narratorMoved = false;
    state.narratorLines = 0;

    renderMenu();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage?.(4);
  }

  function unmount() {
    if (dragCleanup) dragCleanup();

    if (languageListener) {
      window.removeEventListener("languagechange", languageListener);
      languageListener = null;
    }

    if (localStyle) {
      localStyle.remove();
      localStyle = null;
    }

    if (root) root.innerHTML = "";
    root = null;
  }

  function getState() {
    return {
      visited: [...state.visited],
      narratorMoved: state.narratorMoved,
      searchToken: SEARCH_TOKEN
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage04;

