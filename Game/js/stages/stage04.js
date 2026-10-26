
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

  const state = {
    visited: new Set(),
    solved: false,
    attempts: 0
  };

  // This clue is intended to be pieced together from two pages.
  // It is deliberately a nonsensical-looking token, not a filename.
  const SEARCH_TOKEN = "x7_qm-04_vn";

  const COPY = {
    "zh-CN": {
      eyebrow: "帮助中心 / 页面诊断",
      title: "页面版本检查",
      description:
        "部分页面可能来自旧版本。请选择一条路线，查看页面是否正常。",
      routeHeading: "可用路线",
      routeA: "返回上一页",
      routeADesc: "回到你刚才访问的页面。",
      routeB: "打开备用页面",
      routeBDesc: "尝试访问一个备用页面。",
      routeC: "检查页面内容",
      routeCDesc: "检查页面中是否存在异常内容。",
      back: "返回路线选择",
      errorTitle: "页面不存在",
      errorText: "你访问的页面暂时无法显示。",
      hiddenPageTitle: "备用页面",
      hiddenIntro: "诊断编号：",
      maskedTitle: "内容检查失败",
      maskedText: "检测到未经确认的内容。显示已被暂时限制。",
      returnToStage3: "返回第三关",
      continue: "继续",
      answerTitle: "线索汇总",
      answerText:
        "你已经找到两部分线索。回到第三关，在搜索框中输入它们组合出的字符串。",
      narratorA:
        "又回来了？我就知道你会怀念上一关。别担心，我不会笑得太大声。",
      narratorB:
        "备用页面。听起来很可靠，对吧？我建议你先别相信页面标题。",
      narratorC:
        "内容被遮住了？奇怪。我什么都没做——至少没有留下明显痕迹。",
      narratorSolved:
        "哦？你居然把两边的线索拼起来了。别急着得意，后面还有更烦人的。",
      clueOne: "第一段：x7_qm-",
      clueTwo: "第二段：04_vn",
      routeLabel: "路线"
    },
    en: {
      eyebrow: "HELP CENTER / PAGE DIAGNOSTICS",
      title: "Page version check",
      description:
        "Some pages may belong to older versions. Choose a route to check whether it works.",
      routeHeading: "Available routes",
      routeA: "Return to previous page",
      routeADesc: "Go back to the page you visited before.",
      routeB: "Open backup page",
      routeBDesc: "Try accessing a backup page.",
      routeC: "Inspect page content",
      routeCDesc: "Check whether the page contains unusual content.",
      back: "Return to route selection",
      errorTitle: "Page not found",
      errorText: "The page you requested cannot currently be displayed.",
      hiddenPageTitle: "Backup page",
      hiddenIntro: "Diagnostic code: ",
      maskedTitle: "Content inspection failed",
      maskedText:
        "Unverified content detected. Display has been temporarily restricted.",
      returnToStage3: "Return to Stage 3",
      continue: "Continue",
      answerTitle: "Clue summary",
      answerText:
        "You found two parts of a clue. Return to Stage 3 and enter their combined string in the search field.",
      narratorA:
        "Back again? I knew you'd miss the previous level. Don't worry, I won't laugh too loudly.",
      narratorB:
        "A backup page. Sounds reliable, right? I'd avoid trusting the title just yet.",
      narratorC:
        "The content is obscured? Strange. I did nothing—at least nothing obvious.",
      narratorSolved:
        "Oh? You pieced both clues together. Don't celebrate yet; the next parts are even more annoying.",
      clueOne: "Part one: x7_qm-",
      clueTwo: "Part two: 04_vn",
      routeLabel: "Route"
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

  function renderRouteSelection() {
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
              <button
                class="secondary-button"
                type="button"
                data-route="previous"
              >
                ${escapeHTML(t("continue"))}
              </button>
            </article>

            <article class="game-card">
              <h3>${escapeHTML(t("routeB"))}</h3>
              <p>${escapeHTML(t("routeBDesc"))}</p>
              <button
                class="secondary-button"
                type="button"
                data-route="backup"
              >
                ${escapeHTML(t("continue"))}
              </button>
            </article>

            <article class="game-card">
              <h3>${escapeHTML(t("routeC"))}</h3>
              <p>${escapeHTML(t("routeCDesc"))}</p>
              <button
                class="secondary-button"
                type="button"
                data-route="inspect"
              >
                ${escapeHTML(t("continue"))}
              </button>
            </article>
          </div>
        </section>

        <section
          id="stage04-summary"
          class="panel content-stack"
          hidden
          aria-live="polite"
        >
          <h2>${escapeHTML(t("answerTitle"))}</h2>
          <p>${escapeHTML(t("answerText"))}</p>

          <button
            id="stage04-return-stage3"
            class="primary-button"
            type="button"
          >
            ${escapeHTML(t("returnToStage3"))}
          </button>
        </section>
      </section>
    `;

    root.querySelectorAll("[data-route]").forEach((button) => {
      button.addEventListener("click", () => {
        openRoute(button.dataset.route);
      });
    });

    root.querySelector("#stage04-return-stage3")?.addEventListener(
      "click",
      () => {
        // This route is intentional: the clue must be entered on Stage 3.
        Router.navigate(Router.ROUTES.stage(3));
      }
    );
  }

  function openRoute(route) {
    state.visited.add(route);

    switch (route) {
      case "previous":
        Narrator.speakCustom({
          zh: t("narratorA"),
          en: t("narratorA")
        }, "smug");

        renderPreviousRoute();
        break;

      case "backup":
        Narrator.speakCustom({
          zh: t("narratorB"),
          en: t("narratorB")
        }, "suspicious");

        renderBackupRoute();
        break;

      case "inspect":
        Narrator.speakCustom({
          zh: t("narratorC"),
          en: t("narratorC")
        }, "innocent");

        renderInspectRoute();
        break;
    }
  }

  function renderPreviousRoute() {
    root.innerHTML = `
      <section class="page page--reading stage04">
        <header class="page-header">
          <p class="page-eyebrow">ROUTE A</p>
          <h1 class="page-title">
            ${escapeHTML(t("routeA"))}
          </h1>
          <p class="page-description">
            ${escapeHTML(
              lang() === "en"
                ? "This route leads nowhere new."
                : "这条路线没有带你去任何新地方。"
            )}
          </p>
        </header>

        <button id="stage04-back" class="secondary-button" type="button">
          ${escapeHTML(t("back"))}
        </button>
      </section>
    `;

    root.querySelector("#stage04-back")?.addEventListener("click", () => {
      renderRouteSelection();
    });
  }

  function renderBackupRoute() {
    root.innerHTML = `
      <section class="page page--reading stage04 stage04-backup">
        <header class="page-header">
          <p class="page-eyebrow">ROUTE B / FALLBACK</p>
          <h1 class="page-title">
            ${escapeHTML(t("hiddenPageTitle"))}
          </h1>
          <p class="page-description">
            ${escapeHTML(t("hiddenIntro"))}
          </p>
        </header>

        <div class="stage04-white-clue">
          ${escapeHTML(t("clueOne"))}
        </div>

        <p class="muted">
          ${escapeHTML(
            lang() === "en"
              ? "No further information is available."
              : "没有更多可用信息。"
          )}
        </p>

        <button id="stage04-back" class="secondary-button" type="button">
          ${escapeHTML(t("back"))}
        </button>
      </section>
    `;

    root.querySelector("#stage04-back")?.addEventListener("click", () => {
      renderRouteSelection();
    });
  }

  function renderInspectRoute() {
    root.innerHTML = `
      <section class="page page--reading stage04 stage04-inspect">
        <header class="page-header">
          <p class="page-eyebrow">ROUTE C / INSPECTION</p>
          <h1 class="page-title">
            ${escapeHTML(t("maskedTitle"))}
          </h1>
          <p class="page-description">
            ${escapeHTML(t("maskedText"))}
          </p>
        </header>

        <div class="stage04-masked-content" aria-label="Masked content">
          <span>${escapeHTML(t("clueTwo"))}</span>
        </div>

        <button id="stage04-back" class="secondary-button" type="button">
          ${escapeHTML(t("back"))}
        </button>
      </section>
    `;

    // This page visually masks the clue, but its text remains in the DOM.
    // Players who inspect the page can discover it.
    const clue = root.querySelector(".stage04-masked-content");

    if (clue) {
      clue.style.color = "transparent";
      clue.style.userSelect = "text";
    }

    root.querySelector("#stage04-back")?.addEventListener("click", () => {
      renderRouteSelection();
    });
  }

  function onLanguageChange() {
    if (!root) {
      return;
    }

    // Reset to the route menu so every page uses the current language.
    renderRouteSelection();
  }

  function mount(container) {
    root = container;
    state.visited = new Set();
    state.solved = false;
    state.attempts = 0;

    renderRouteSelection();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(4);

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
      visited: [...state.visited],
      solved: state.solved,
      attempts: state.attempts,
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
