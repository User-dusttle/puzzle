
/* ========================================================
 * Meta Puzzle — Stage 12
 * File: js/stages/stage12.js
 *
 * Historical versions:
 *   v1 -> reproduce a pagination bug
 *   v2 -> reproduce a stale-language bug
 *   v3 -> reproduce a search-cache bug
 *
 * Collect the three fragments in version order.
 * ======================================================== */

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage12 = (() => {
  let root = null;
  let languageListener = null;

  const VERSION_IDS = ["v1", "v2", "v3"];

  const CHANGELOGS = {
    "zh-CN": {
      v1: {
        version: "v1.4.2",
        date: "2024-03-18",
        notes: [
          "修复了页码为 0 时，上一页按钮仍然可用的问题。",
          "修复了空目录页面错误显示旧记录的问题。"
        ]
      },
      v2: {
        version: "v2.1.0",
        date: "2025-01-07",
        notes: [
          "修复了切换语言后，部分页面仍显示旧文本的问题。",
          "修复了隐藏的旧版提示在切换语言时重新出现的问题。"
        ]
      },
      v3: {
        version: "v3.0.6",
        date: "2025-09-29",
        notes: [
          "修复了空搜索词意外恢复上次查询结果的问题。",
          "修复了清除搜索框后，缓存记录仍可被读取的问题。"
        ]
      }
    },
    en: {
      v1: {
        version: "v1.4.2",
        date: "2024-03-18",
        notes: [
          "Fixed the previous-page button remaining enabled at page zero.",
          "Fixed empty directory pages displaying old records."
        ]
      },
      v2: {
        version: "v2.1.0",
        date: "2025-01-07",
        notes: [
          "Fixed pages retaining old text after a language switch.",
          "Fixed hidden legacy hints reappearing when the language changed."
        ]
      },
      v3: {
        version: "v3.0.6",
        date: "2025-09-29",
        notes: [
          "Fixed empty searches unexpectedly restoring the previous query.",
          "Fixed cached records remaining readable after clearing the search field."
        ]
      }
    }
  };

  const COPY = {
    "zh-CN": {
      eyebrow: "版本档案 / 12",
      title: "以前不是这样的",
      intro:
        "网站更新记录被保存在这里。维护人员声称所有漏洞都已修复。你最好相信他们——或者亲自验证。",
      currentVersion: "当前档案",
      versions: "历史版本",
      changelog: "更新公告",
      openVersion: "访问此版本",
      task: "复现旧版问题",
      v1Title: "版本 v1.4.2：分页系统",
      v1Desc:
        "旧版分页系统处理页码时存在一个边界问题。尝试让页面停留在第 0 页，然后点击“上一页”。",
      page: "当前页码",
      previous: "上一页",
      next: "下一页",
      v2Title: "版本 v2.1.0：语言缓存",
      v2Desc:
        "旧版语言切换存在缓存问题。先隐藏提示，再切换语言，观察隐藏内容是否仍会响应。",
      hideHint: "隐藏提示",
      switchLanguage: "切换档案语言",
      v3Title: "版本 v3.0.6：搜索缓存",
      v3Desc:
        "旧版搜索框会保留上一次查询。输入任意内容，再清空搜索框，观察恢复出的旧记录。",
      search: "档案搜索",
      searchPlaceholder: "输入任意搜索词",
      runSearch: "搜索",
      clearSearch: "清空搜索",
      result: "查询结果",
      fragment: "发现的档案碎片",
      notFound: "没有匹配记录。",
      taskDone: "漏洞已复现，获得一段档案碎片。",
      locked: "先完成前一个版本的调查。",
      collected: "已收集",
      finish: "提交档案",
      finishHint:
        "按版本从旧到新排列三段碎片，然后提交。",
      wrong: "顺序不正确，或者仍有版本尚未调查。",
      success: "档案顺序正确。你找到了下一页的索引。",
      narrator:
        "我当然知道这些漏洞。它们都已经修复了。你继续翻旧账也不会有什么发现。",
      narratorFound:
        "你真去翻了旧版本？这叫尊重历史，不叫不信任维护人员。",
      archiveLabel: "维护记录",
      footer:
        "部分旧版内容仅用于兼容性测试。请勿将其用于生产环境。",
      versionComplete: "版本调查完成",
      reset: "重置本关进度",
      reliableHint: "可靠提示",
      reliableText:
        "公告描述的是旧版的具体错误。不要只阅读公告：切换版本，实际操作界面，并观察错误发生后留下的状态。"
    },
    en: {
      eyebrow: "VERSION ARCHIVE / 12",
      title: "It Wasn't Always Like This",
      intro:
        "The site's update history is preserved here. Maintainers claim every bug has been fixed. You can trust them—or verify it yourself.",
      currentVersion: "Archive",
      versions: "Historical Versions",
      changelog: "Release Notes",
      openVersion: "Open Version",
      task: "Reproduce the Bug",
      v1Title: "Version v1.4.2: Pagination",
      v1Desc:
        "The old pagination system had a boundary bug. Keep the page number at zero, then click Previous.",
      page: "Current Page",
      previous: "Previous",
      next: "Next",
      v2Title: "Version v2.1.0: Language Cache",
      v2Desc:
        "The old language switch had a cache bug. Hide the hint, switch languages, and see whether the hidden content still reacts.",
      hideHint: "Hide Hint",
      switchLanguage: "Switch Archive Language",
      v3Title: "Version v3.0.6: Search Cache",
      v3Desc:
        "The old search field retained the previous query. Search for anything, clear the field, and inspect the restored record.",
      search: "Archive Search",
      searchPlaceholder: "Enter any search term",
      runSearch: "Search",
      clearSearch: "Clear Search",
      result: "Search Result",
      fragment: "Recovered Archive Fragments",
      notFound: "No matching records.",
      taskDone: "Bug reproduced. An archive fragment was recovered.",
      locked: "Investigate the previous version first.",
      collected: "Collected",
      finish: "Submit Archive",
      finishHint:
        "Arrange all three fragments from oldest to newest, then submit.",
      wrong: "Incorrect order, or some versions remain unexplored.",
      success: "The archive order is correct. You found the next page's index.",
      narrator:
        "Of course I know about these bugs. They were fixed. Digging through old versions won't reveal anything.",
      narratorFound:
        "You actually inspected an old version? That's called respecting history, not distrusting maintenance.",
      archiveLabel: "Maintenance Records",
      footer:
        "Some legacy content is preserved for compatibility testing. Do not use it in production.",
      versionComplete: "Version Investigated",
      reset: "Reset Stage Progress",
      reliableHint: "Reliable Hint",
      reliableText:
        "Each notice describes a specific historical bug. Don't just read the notice: switch versions, operate the interface, and inspect the state left behind."
    }
  };

  const FRAGMENTS = {
    v1: "OLD-",
    v2: "VERSIONS-",
    v3: "MATTER"
  };

  const state = {
    activeVersion: "v1",
    completed: new Set(),
    pageNumber: 0,
    v2HintVisible: true,
    v2BugTriggered: false,
    v3PreviousQuery: "",
    v3Result: "",
    v3BugTriggered: false,
    archiveLanguage: "zh-CN",
    submitted: false,
    message: ""
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

  function changelog(version) {
    return CHANGELOGS[lang()][version];
  }

  function versionButton(version) {
    const item = changelog(version);
    const locked = VERSION_IDS.indexOf(version) > 0 &&
      !state.completed.has(VERSION_IDS[VERSION_IDS.indexOf(version) - 1]);

    return `
      <button
        type="button"
        class="secondary-button"
        data-open-version="${version}"
        ${locked ? "disabled" : ""}
      >
        ${escapeHTML(item.version)} — ${escapeHTML(item.date)}
        ${locked ? " 🔒" : ""}
      </button>
    `;
  }

  function renderChangelog(version) {
    const item = changelog(version);

    return `
      <section class="panel content-stack">
        <h2>${escapeHTML(t("changelog"))}: ${escapeHTML(item.version)}</h2>
        <p class="muted">${escapeHTML(item.date)}</p>
        <ul>
          ${item.notes.map((note) => `<li>${escapeHTML(note)}</li>`).join("")}
        </ul>
        <button
          type="button"
          class="primary-button"
          data-open-version="${version}"
        >
          ${escapeHTML(t("openVersion"))}
        </button>
      </section>
    `;
  }

  function renderV1() {
    return `
      <section class="panel content-stack">
        <h2>${escapeHTML(t("v1Title"))}</h2>
        <p>${escapeHTML(t("v1Desc"))}</p>

        <div class="row">
          <span>${escapeHTML(t("page"))}:</span>
          <strong id="stage12-page-number">${state.pageNumber}</strong>
        </div>

        <div class="row">
          <button type="button" class="secondary-button" id="stage12-previous">
            ${escapeHTML(t("previous"))}
          </button>
          <button type="button" class="secondary-button" id="stage12-next">
            ${escapeHTML(t("next"))}
          </button>
        </div>

        <p id="stage12-v1-result" aria-live="polite"></p>
      </section>
    `;
  }

  function renderV2() {
    return `
      <section class="panel content-stack">
        <h2>${escapeHTML(t("v2Title"))}</h2>
        <p>${escapeHTML(t("v2Desc"))}</p>

        <div id="stage12-legacy-hint" ${state.v2HintVisible ? "" : "hidden"}>
          <p>
            ARCHIVE NOTE:
            <code>REVISION_ORDER = 2</code>
          </p>
        </div>

        <div class="row">
          <button type="button" class="secondary-button" id="stage12-hide-hint">
            ${escapeHTML(t("hideHint"))}
          </button>
          <button type="button" class="secondary-button" id="stage12-switch-language">
            ${escapeHTML(t("switchLanguage"))}
          </button>
        </div>

        <p id="stage12-v2-result" aria-live="polite"></p>
      </section>
    `;
  }

  function renderV3() {
    return `
      <section class="panel content-stack">
        <h2>${escapeHTML(t("v3Title"))}</h2>
        <p>${escapeHTML(t("v3Desc"))}</p>

        <form id="stage12-search-form" class="content-stack">
          <label for="stage12-search">${escapeHTML(t("search"))}</label>
          <input
            id="stage12-search"
            type="text"
            placeholder="${escapeHTML(t("searchPlaceholder"))}"
            autocomplete="off"
          >
          <div class="row">
            <button type="submit" class="primary-button">
              ${escapeHTML(t("runSearch"))}
            </button>
            <button type="button" class="secondary-button" id="stage12-clear-search">
              ${escapeHTML(t("clearSearch"))}
            </button>
          </div>
        </form>

        <div class="panel content-stack">
          <h3>${escapeHTML(t("result"))}</h3>
          <p id="stage12-search-result" aria-live="polite">
            ${escapeHTML(state.v3Result || t("notFound"))}
          </p>
        </div>
      </section>
    `;
  }

  function renderActiveVersion() {
    if (state.activeVersion === "v1") return renderV1();
    if (state.activeVersion === "v2") return renderV2();
    return renderV3();
  }

  function render() {
    if (!root) return;

    root.innerHTML = `
      <section class="page page--reading stage12">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("intro"))}</p>
        </header>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("currentVersion"))}</h2>
          <p>${escapeHTML(t("narrator"))}</p>
          <p class="muted">${escapeHTML(t("archiveLabel"))}</p>
        </section>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("versions"))}</h2>
          ${VERSION_IDS.map((version) => versionButton(version)).join("")}
        </section>

        ${renderChangelog(state.activeVersion)}
        ${renderActiveVersion()}

        <section class="panel content-stack">
          <h2>${escapeHTML(t("fragment"))}</h2>
          <ul>
            ${VERSION_IDS.map((version) => `
              <li>
                ${escapeHTML(changelog(version).version)}:
                <code>${state.completed.has(version)
                  ? escapeHTML(FRAGMENTS[version])
                  : "??????"}</code>
              </li>
            `).join("")}
          </ul>
          <p>${escapeHTML(t("finishHint"))}</p>

          <form id="stage12-submit-form" class="content-stack">
            <label for="stage12-final-answer">${escapeHTML(t("fragment"))}</label>
            <input
              id="stage12-final-answer"
              type="text"
              placeholder="OLD-VERSIONS-MATTER"
              autocomplete="off"
              spellcheck="false"
            >
            <button type="submit" class="primary-button">
              ${escapeHTML(t("finish"))}
            </button>
          </form>
          <p id="stage12-final-status" aria-live="polite"></p>
          <button type="button" id="stage12-reset" class="secondary-button">
            ${escapeHTML(t("reset"))}
          </button>
        </section>

        <section class="page-section">
          <details>
            <summary>${escapeHTML(t("reliableHint"))}</summary>
            <p>${escapeHTML(t("reliableText"))}</p>
          </details>
        </section>

        <footer class="page-footer">
          <p>${escapeHTML(t("footer"))}</p>
        </footer>
      </section>
    `;

    bindVersionButtons();
    bindV1();
    bindV2();
    bindV3();
    bindSubmit();
    bindReset();
  }

  function bindVersionButtons() {
    root.querySelectorAll("[data-open-version]").forEach((button) => {
      button.addEventListener("click", () => {
        const version = button.dataset.openVersion;
        const index = VERSION_IDS.indexOf(version);

        if (index > 0 && !state.completed.has(VERSION_IDS[index - 1])) {
          return;
        }

        state.activeVersion = version;
        state.message = "";
        render();
      });
    });
  }

  function completeVersion(version) {
    if (state.completed.has(version)) return;

    state.completed.add(version);

    Narrator.speakCustom({
      zh: COPY["zh-CN"].narratorFound,
      en: COPY.en.narratorFound
    }, "impressed");

    render();
  }

  /* ---------------- Version 1: pagination bug ---------------- */

  function bindV1() {
    if (state.activeVersion !== "v1") return;

    root.querySelector("#stage12-previous")
      ?.addEventListener("click", () => {
        // Historical bug: page zero incorrectly wraps to the final page.
        if (state.pageNumber === 0) {
          state.pageNumber = 3;

          const result = root.querySelector("#stage12-v1-result");
          if (result) {
            result.innerHTML = `
              <p>${escapeHTML(t("taskDone"))}</p>
              <code>${escapeHTML(FRAGMENTS.v1)}</code>
            `;
          }

          completeVersion("v1");
          return;
        }

        state.pageNumber = Math.max(0, state.pageNumber - 1);
        render();
      });

    root.querySelector("#stage12-next")
      ?.addEventListener("click", () => {
        state.pageNumber = Math.min(3, state.pageNumber + 1);
        render();
      });
  }

  /* ---------------- Version 2: stale language cache ---------------- */

  function bindV2() {
    if (state.activeVersion !== "v2") return;

    root.querySelector("#stage12-hide-hint")
      ?.addEventListener("click", () => {
        state.v2HintVisible = false;

        const hint = root.querySelector("#stage12-legacy-hint");
        if (hint) hint.hidden = true;
      });

    root.querySelector("#stage12-switch-language")
      ?.addEventListener("click", () => {
        // Simulate the historical bug: switching language restores
        // a previously hidden legacy note.
        state.v2HintVisible = true;
        state.v2BugTriggered = true;

        const hint = root.querySelector("#stage12-legacy-hint");
        if (hint) hint.hidden = false;

        const result = root.querySelector("#stage12-v2-result");
        if (result) {
          result.innerHTML = `
            <p>${escapeHTML(t("taskDone"))}</p>
            <code>${escapeHTML(FRAGMENTS.v2)}</code>
          `;
        }

        completeVersion("v2");
      });
  }

  /* ---------------- Version 3: search cache bug ---------------- */

  function bindV3() {
    if (state.activeVersion !== "v3") return;

    const form = root.querySelector("#stage12-search-form");
    const input = root.querySelector("#stage12-search");
    const result = root.querySelector("#stage12-search-result");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const query = String(input?.value ?? "").trim();
      state.v3PreviousQuery = query;
      state.v3Result = query
        ? `No archived entry for: ${query}`
        : t("notFound");

      if (result) result.textContent = state.v3Result;
    });

    root.querySelector("#stage12-clear-search")
      ?.addEventListener("click", () => {
        if (input) input.value = "";

        // Historical bug: clearing the search field restores a cached
        // record from a previous search.
        if (state.v3PreviousQuery) {
          state.v3BugTriggered = true;
          state.v3Result = FRAGMENTS.v3;

          if (result) {
            result.innerHTML = `
              <p>${escapeHTML(t("taskDone"))}</p>
              <code>${escapeHTML(FRAGMENTS.v3)}</code>
            `;
          }

          completeVersion("v3");
        } else {
          state.v3Result = t("notFound");
          if (result) result.textContent = state.v3Result;
        }
      });
  }

  /* ---------------- Final answer ---------------- */

  function bindSubmit() {
    root.querySelector("#stage12-submit-form")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();

        const input = root.querySelector("#stage12-final-answer");
        const status = root.querySelector("#stage12-final-status");
        const answer = String(input?.value ?? "").trim().toUpperCase();

        const allVersionsCompleted = VERSION_IDS.every(
          (version) => state.completed.has(version)
        );

        if (
          !allVersionsCompleted ||
          answer !== "OLD-VERSIONS-MATTER"
        ) {
          if (status) status.textContent = t("wrong");

          Narrator.reactTo("failed-answer", { stage: 12 });
          return;
        }

        state.submitted = true;

        if (status) status.textContent = t("success");

        Progress.completeStage(12);

        Narrator.speakCustom({
          zh: "历史不会告诉你全部答案。但它会告诉你，哪些错误曾经存在。",
          en: "History won't tell you every answer. But it will tell you which mistakes once existed."
        }, "impressed");

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.className = "primary-button";
        nextButton.textContent = lang() === "en"
          ? "Continue to Stage 13"
          : "进入第十三关";

        nextButton.addEventListener("click", () => {
          Router.navigate(Router.ROUTES.stage(13));
        });

        status?.insertAdjacentElement("afterend", nextButton);
      });
  }

  function bindReset() {
    root.querySelector("#stage12-reset")
      ?.addEventListener("click", () => {
        state.activeVersion = "v1";
        state.completed = new Set();
        state.pageNumber = 0;
        state.v2HintVisible = true;
        state.v2BugTriggered = false;
        state.v3PreviousQuery = "";
        state.v3Result = "";
        state.v3BugTriggered = false;
        state.submitted = false;
        state.message = "";

        render();
      });
  }

  function onLanguageChange() {
    if (!root) return;
    render();
  }

  function mount(container) {
    root = container;

    state.activeVersion = "v1";
    state.completed = new Set();
    state.pageNumber = 0;
    state.v2HintVisible = true;
    state.v2BugTriggered = false;
    state.v3PreviousQuery = "";
    state.v3Result = "";
    state.v3BugTriggered = false;
    state.submitted = false;
    state.message = "";

    render();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(12);

    Narrator.speakCustom({
      zh: COPY["zh-CN"].narrator,
      en: COPY.en.narrator
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

  return {
    mount,
    unmount
  };
})();

export default Stage12;
