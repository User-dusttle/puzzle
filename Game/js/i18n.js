
// =========================================================
// Meta Puzzle — Internationalization
// File: js/i18n.js
// =========================================================

const STORAGE_KEY = "meta-puzzle-language-v1";

const translations = {
  "zh-CN": {
    "site.title": "帮助中心",
    "site.brand": "帮助中心",
    "site.description": "帮助中心与常见问题",

    "header.language": "EN",
    "header.languageLabel": "切换到英文",
    "header.hint": "提示",
    "header.hintLabel": "查看当前关卡提示",

    "footer.copyright": "© 2026 Help Center",
    "footer.privacy": "隐私政策",
    "footer.terms": "使用条款",

    "narrator.name": "系统助手",
    "narrator.next": "继续",
    "narrator.hide": "隐藏旁白",
    "narrator.show": "显示旁白",

    "common.loading": "正在加载……",
    "common.back": "返回",
    "common.continue": "继续",
    "common.submit": "提交",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.close": "关闭",
    "common.retry": "重试",
    "common.reset": "重置",
    "common.search": "搜索",
    "common.download": "下载",
    "common.locked": "尚未解锁",
    "common.completed": "已完成",
    "common.incomplete": "未完成",

    "home.title": "欢迎使用帮助中心",
    "home.description": "在这里查找帮助文章、常见问题和相关信息。",
    "home.searchPlaceholder": "输入关键词……",
    "home.popularArticles": "热门文章",
    "home.contact": "联系我们",

    "hint.title": "提示",
    "hint.first": "仔细观察当前页面。",
    "hint.second": "页面上并非所有看起来重要的东西都真的重要。",
    "hint.third": "试着从浏览器本身寻找线索。",
    "hint.unavailable": "当前还没有更多提示。",

    "error.notFound.title": "页面不存在",
    "error.notFound.description": "你访问的页面暂时无法找到。",
    "error.notFound.back": "返回首页",

    "progress.stage": "第 {stage} 关",
    "progress.unlocked": "已解锁至第 {stage} 关",
    "progress.complete": "关卡完成",
    "progress.allComplete": "所有关卡均已完成。",

    "stage.title": "第 {stage} 关",
    "stage.locked": "这一关还没有解锁。",
    "stage.lockedDescription": "请先完成之前的关卡。",
    "stage.success": "正确。你可以继续了。",
    "stage.failure": "答案不正确，再检查一下。",
    "stage.enterAnswer": "输入答案",
    "stage.submitAnswer": "提交答案",

    "game.score": "得分",
    "game.moves": "步数",
    "game.time": "用时",
    "game.start": "开始游戏",
    "game.restart": "重新开始",
    "game.gameOver": "游戏结束",
    "game.victory": "挑战成功",

    "wordle.placeholder": "输入一个单词",
    "wordle.submit": "提交",
    "maze.instructions": "使用方向键移动。",
    "minesweeper.instructions": "找出安全区域，小心隐藏的地雷。",
    "river.instructions": "安排过河顺序，遵守当前规则。",
    "ttt.instructions": "选择一个格子落子。",

    "version.title": "历史版本",
    "version.releaseNotes": "更新说明",
    "version.open": "查看此版本",
    "version.current": "当前版本",

    "file.title": "文件信息",
    "file.name": "文件名",
    "file.type": "文件类型",
    "file.size": "文件大小",
    "file.open": "打开文件",

    "settings.language": "界面语言",
    "settings.chinese": "简体中文",
    "settings.english": "English"
  },

  "en": {
    "site.title": "Help Center",
    "site.brand": "Help Center",
    "site.description": "Help Center and Frequently Asked Questions",

    "header.language": "中文",
    "header.languageLabel": "Switch to Chinese",
    "header.hint": "Hint",
    "header.hintLabel": "Show a hint for this stage",

    "footer.copyright": "© 2026 Help Center",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Use",

    "narrator.name": "System Assistant",
    "narrator.next": "Continue",
    "narrator.hide": "Hide narrator",
    "narrator.show": "Show narrator",

    "common.loading": "Loading…",
    "common.back": "Back",
    "common.continue": "Continue",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.retry": "Retry",
    "common.reset": "Reset",
    "common.search": "Search",
    "common.download": "Download",
    "common.locked": "Locked",
    "common.completed": "Completed",
    "common.incomplete": "Incomplete",

    "home.title": "Welcome to the Help Center",
    "home.description": "Find help articles, frequently asked questions, and related information.",
    "home.searchPlaceholder": "Enter keywords…",
    "home.popularArticles": "Popular Articles",
    "home.contact": "Contact Us",

    "hint.title": "Hint",
    "hint.first": "Look carefully at the current page.",
    "hint.second": "Not everything that looks important actually is.",
    "hint.third": "Try looking for clues in the browser itself.",
    "hint.unavailable": "There are no more hints available right now.",

    "error.notFound.title": "Page Not Found",
    "error.notFound.description": "The page you requested could not be found.",
    "error.notFound.back": "Return Home",

    "progress.stage": "Stage {stage}",
    "progress.unlocked": "Unlocked through Stage {stage}",
    "progress.complete": "Stage completed",
    "progress.allComplete": "All stages have been completed.",

    "stage.title": "Stage {stage}",
    "stage.locked": "This stage is still locked.",
    "stage.lockedDescription": "Please complete the previous stages first.",
    "stage.success": "Correct. You may continue.",
    "stage.failure": "That answer is incorrect. Check it again.",
    "stage.enterAnswer": "Enter your answer",
    "stage.submitAnswer": "Submit answer",

    "game.score": "Score",
    "game.moves": "Moves",
    "game.time": "Time",
    "game.start": "Start Game",
    "game.restart": "Restart",
    "game.gameOver": "Game Over",
    "game.victory": "Challenge Complete",

    "wordle.placeholder": "Enter a word",
    "wordle.submit": "Submit",
    "maze.instructions": "Use the arrow keys to move.",
    "minesweeper.instructions": "Find safe cells and watch out for hidden mines.",
    "river.instructions": "Plan your crossings and follow the current rules.",
    "ttt.instructions": "Choose a cell to place your mark.",

    "version.title": "Historical Versions",
    "version.releaseNotes": "Release Notes",
    "version.open": "Open This Version",
    "version.current": "Current Version",

    "file.title": "File Information",
    "file.name": "File Name",
    "file.type": "File Type",
    "file.size": "File Size",
    "file.open": "Open File",

    "settings.language": "Language",
    "settings.chinese": "简体中文",
    "settings.english": "English"
  }
};

const I18n = (() => {
  let currentLanguage = "zh-CN";

  function isSupportedLanguage(language) {
    return Object.prototype.hasOwnProperty.call(
      translations,
      language
    );
  }

  function getSavedLanguage() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (isSupportedLanguage(saved)) {
        return saved;
      }
    } catch (error) {
      // Storage can be unavailable in restricted browsing contexts.
    }

    const browserLanguage =
      navigator.language || navigator.userLanguage || "zh-CN";

    return browserLanguage.toLowerCase().startsWith("en")
      ? "en"
      : "zh-CN";
  }

  /**
   * Translate a key and optionally interpolate variables.
   *
   * Example:
   * I18n.t("progress.stage", { stage: 3 })
   */
  function t(key, variables = {}) {
    const dictionary = translations[currentLanguage];
    let result = dictionary[key];

    if (result === undefined) {
      result = translations["zh-CN"][key];
    }

    if (result === undefined) {
      // Missing keys remain visible during development.
      return key;
    }

    return result.replace(/\{(\w+)\}/g, (match, name) => {
      return Object.prototype.hasOwnProperty.call(variables, name)
        ? String(variables[name])
        : match;
    });
  }

  /**
   * Update every element that declares a translation key.
   *
   * Supported attributes:
   * data-i18n         -> text content
   * data-i18n-placeholder -> placeholder
   * data-i18n-title   -> title
   * data-i18n-aria    -> aria-label
   */
  function updatePage() {
    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      element.textContent = t(key);
    });

    document
      .querySelectorAll("[data-i18n-placeholder]")
      .forEach((element) => {
        const key = element.getAttribute("data-i18n-placeholder");
        element.setAttribute("placeholder", t(key));
      });

    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      element.setAttribute("title", t(key));
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const key = element.getAttribute("data-i18n-aria");
      element.setAttribute("aria-label", t(key));
    });

    document.title = t("site.title");

    window.dispatchEvent(
      new CustomEvent("languagechange", {
        detail: {
          language: currentLanguage
        }
      })
    );
  }

  function setLanguage(language) {
    if (!isSupportedLanguage(language)) {
      return false;
    }

    currentLanguage = language;

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // The language still changes for the current page session.
    }

    updatePage();
    return true;
  }

  function toggleLanguage() {
    const nextLanguage =
      currentLanguage === "zh-CN" ? "en" : "zh-CN";

    setLanguage(nextLanguage);
    return currentLanguage;
  }

  function getLanguage() {
    return currentLanguage;
  }

  function init() {
    currentLanguage = getSavedLanguage();
    updatePage();
  }

  return {
    init,
    t,
    setLanguage,
    toggleLanguage,
    getLanguage,
    updatePage,
    translations
  };
})();

export default I18n;
