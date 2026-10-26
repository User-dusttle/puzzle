
import Router from "./router.js";
import Progress from "./progress.js";
import I18n from "./i18n.js";
import Narrator from "./narrator.js";

const STAGE_LOADERS = {
  1: () => import("./stages/stage01.js"),
  2: () => import("./stages/stage02.js"),
  3: () => import("./stages/stage03.js"),
  4: () => import("./stages/stage04.js"),
  5: () => import("./stages/stage05.js"),
  6: () => import("./stages/stage06.js"),
  7: () => import("./stages/stage07.js"),
  8: () => import("./stages/stage08.js"),
  9: () => import("./stages/stage09.js"),
  10: () => import("./stages/stage10.js"),
  11: () => import("./stages/stage11.js"),
  12: () => import("./stages/stage12.js"),
  13: () => import("./stages/stage13.js"),
};

const App = {
  initialized: false,
  activeStage: null,
  activeStageNumber: null,
  navigationId: 0,
  toastTimer: null,

  elements: {},

  init() {
    if (this.initialized) return;

    this.elements = {
      app: document.querySelector("#app"),
      languageToggle: document.querySelector("#language-toggle"),
      hintToggle: document.querySelector("#hint-toggle"),
      narratorPanel: document.querySelector("#narrator-panel"),
      narratorName: document.querySelector("#narrator-name"),
      narratorMood: document.querySelector("#narrator-mood"),
      narratorText: document.querySelector("#narrator-text"),
      narratorNext: document.querySelector("#narrator-next"),
      narratorHide: document.querySelector("#narrator-hide"),
      toastRegion: document.querySelector("#toast-region"),
    };

    if (!this.elements.app) {
      console.error("Meta Puzzle: 找不到 #app 容器。");
      return;
    }

    Router.configure();
    Progress.load();

    if (typeof I18n.init === "function") {
      I18n.init();
    }

if (typeof Narrator.init === "function") {
  Narrator.init();
}

Narrator.connectUI?.((line) => {
  const { narratorText, narratorMood, narratorPanel } = App.elements;

  if (narratorText) {
    narratorText.textContent = line.text ?? "";
  }

  if (narratorMood) {
    narratorMood.textContent = line.moodLabel ?? "";
    narratorMood.dataset.mood = line.mood ?? "neutral";
  }

  if (narratorPanel) {
    narratorPanel.hidden = false;
    narratorPanel.dataset.mood = line.mood ?? "neutral";
  }
});

window.addEventListener("narratorvisibilitychange", (event) => {
  const panel = App.elements.narratorPanel;
  if (panel) {
    panel.hidden = !event.detail?.visible;
  }
});

    this.bindGlobalEvents();
    this.initialized = true;

    window.addEventListener("popstate", () => {
      this.renderRoute();
    });

    window.addEventListener("languagechange", () => {
      this.renderRoute();
    });

    this.renderRoute();
  },

  bindGlobalEvents() {
    const {
      languageToggle,
      hintToggle,
      narratorNext,
      narratorHide,
    } = this.elements;

    languageToggle?.addEventListener("click", () => {
      if (typeof I18n.toggleLanguage === "function") {
        I18n.toggleLanguage();
      } else {
        console.warn("I18n.toggleLanguage() 不存在。");
      }
    });

    hintToggle?.addEventListener("click", () => {
      if (typeof Narrator.requestReliableHint === "function") {
        Narrator.requestReliableHint();
      } else {
        this.showToast("可靠提示系统尚未接入。");
      }
    });

    narratorNext?.addEventListener("click", () => {
  if (typeof Narrator.chooseBehaviorLine === "function") {
    const lineId = Narrator.chooseBehaviorLine();

    if (lineId) {
      Narrator.speak(lineId);
    }
  }
});

    narratorHide?.addEventListener("click", () => {
      if (typeof Narrator.hide === "function") {
        Narrator.hide();
      } else if (typeof Narrator.toggleVisibility === "function") {
        Narrator.toggleVisibility();
      }
    });

    // 关卡通过自定义事件请求导航。
    window.addEventListener("meta-puzzle:navigate", (event) => {
      const target = event.detail?.stage;

      if (Number.isInteger(Number(target))) {
        this.navigateToStage(Number(target));
      }
    });

    // 关卡可以通过该事件申请完成。
    // 注意：事件只适用于已经完成自身验证的关卡。
    window.addEventListener("meta-puzzle:complete", (event) => {
      const stage = Number(event.detail?.stage);

      if (
        Number.isInteger(stage) &&
        stage >= 1 &&
        stage <= Progress.TOTAL_STAGES
      ) {
        Progress.completeStage(stage);
        this.showToast(`第 ${stage} 关完成。`);
      }
    });

    window.addEventListener("meta-puzzle:toast", (event) => {
      const message = event.detail?.message;
      if (typeof message === "string" && message) {
        this.showToast(message);
      }
    });
  },

  async renderRoute() {
    if (!this.elements.app) return;

    const currentNavigationId = ++this.navigationId;

    await this.unmountActiveStage();

    // 如果等待卸载期间又发生导航，旧导航不再渲染。
    if (currentNavigationId !== this.navigationId) return;

    let route;

    try {
      route = Router.resolve();
    } catch (error) {
      console.error("解析路由失败：", error);
      this.renderNotFound();
      return;
    }

    if (!route) {
      this.renderNotFound();
      return;
    }

    const stageNumber = this.getStageNumber(route);

    if (stageNumber !== null) {
      await this.renderStage(stageNumber, currentNavigationId);
      return;
    }

    if (this.isHomeRoute(route)) {
      this.renderHome();
      return;
    }

    if (this.isNotFoundRoute(route)) {
      this.renderNotFound();
      return;
    }

    this.renderNotFound();
  },

  getStageNumber(route) {
    const candidates = [
      route.stage,
      route.stageNumber,
      route.params?.stage,
      route.params?.id,
    ];

    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) continue;

      const value = Number(candidate);

      if (Number.isInteger(value) && value >= 1 && value <= 13) {
        return value;
      }
    }

    // 兼容直接使用 /stage/03/ 这种路径的路由对象。
    const path = String(
      route.path ?? route.pathname ?? window.location.pathname
    );

    const match = path.match(/\/stage\/0*(\d{1,2})\/?$/i);

    if (match) {
      const value = Number(match[1]);
      if (value >= 1 && value <= 13) return value;
    }

    return null;
  },

  isHomeRoute(route) {
    const name = String(route.name ?? route.type ?? "").toLowerCase();
    const path = String(route.path ?? "");

    return (
      name === "home" ||
      name === "index" ||
      route.isHome === true ||
      path === "/" ||
      path === ""
    );
  },

  isNotFoundRoute(route) {
    const name = String(route.name ?? route.type ?? "").toLowerCase();
    const path = String(route.path ?? "");

    return (
      name === "not-found" ||
      name === "notfound" ||
      route.isNotFound === true ||
      path.includes("not-found")
    );
  },

  async renderStage(stageNumber, navigationId) {
    if (!STAGE_LOADERS[stageNumber]) {
      this.renderNotFound();
      return;
    }

    if (
      typeof Progress.canEnterStage === "function" &&
      !Progress.canEnterStage(stageNumber)
    ) {
      this.renderLocked(stageNumber);
      return;
    }

    this.elements.app.innerHTML = `
      <section class="page page--loading" aria-live="polite">
        <p>正在加载第 ${stageNumber} 关……</p>
      </section>
    `;

    try {
      const module = await STAGE_LOADERS[stageNumber]();

      if (navigationId !== this.navigationId) return;

      const stageModule = module.default ?? module;

      if (typeof stageModule.mount !== "function") {
        throw new Error(
          `stage${String(stageNumber).padStart(2, "0")}.js 缺少 mount(container) 方法。`
        );
      }

      this.elements.app.innerHTML = `
        <div class="stage-root" data-stage="${stageNumber}"></div>
      `;

      const container = this.elements.app.querySelector(".stage-root");

      // 兼容 mount() 返回 Promise 的关卡模块。
      const cleanup = await stageModule.mount(container);

      if (navigationId !== this.navigationId) {
        if (typeof cleanup === "function") cleanup();

        if (typeof stageModule.unmount === "function") {
          await stageModule.unmount();
        }

        return;
      }

      this.activeStage = {
        module: stageModule,
        cleanup: typeof cleanup === "function" ? cleanup : null,
        container,
      };

      this.activeStageNumber = stageNumber;

      if (typeof Progress.recordVisit === "function") {
        Progress.recordVisit(stageNumber);
      }

      if (typeof Narrator.setStage === "function") {
        Narrator.setStage(stageNumber);
      }

      if (typeof Narrator.reactTo === "function") {
        Narrator.reactTo("stage-visit", { stage: stageNumber });
      }
    } catch (error) {
      console.error(`第 ${stageNumber} 关加载失败：`, error);

      if (navigationId !== this.navigationId) return;

      this.elements.app.innerHTML = `
        <section class="page page--error">
          <h1>关卡加载失败</h1>
          <p>第 ${stageNumber} 关暂时无法加载。</p>
          <p class="muted">
            请检查模块文件、导入路径，以及浏览器控制台中的错误。
          </p>
          <button class="primary-button" data-action="retry">
            重试
          </button>
          <button class="secondary-button" data-action="home">
            返回首页
          </button>
        </section>
      `;

      this.elements.app
        .querySelector('[data-action="retry"]')
        ?.addEventListener("click", () => this.renderRoute());

      this.elements.app
        .querySelector('[data-action="home"]')
        ?.addEventListener("click", () => this.navigateHome());
    }
  },

  async unmountActiveStage() {
    const active = this.activeStage;

    this.activeStage = null;
    this.activeStageNumber = null;

    if (!active) return;

    try {
      if (active.cleanup) {
        active.cleanup();
      }

      if (typeof active.module.unmount === "function") {
        await active.module.unmount();
      }
    } catch (error) {
      console.error("卸载关卡时发生错误：", error);
    }
  },

  renderHome() {
    const maxUnlocked =
      typeof Progress.getMaxUnlockedStage === "function"
        ? Progress.getMaxUnlockedStage()
        : 1;

    this.elements.app.innerHTML = `
      <section class="page page--home">
        <header class="page-header">
          <p class="eyebrow">META PUZZLE</p>
          <h1>欢迎来到这个普通的网站</h1>
          <p class="muted">
            当然，如果你相信它很普通，那就更好了。
          </p>
        </header>

        <section class="panel content-stack">
          <h2>继续游戏</h2>
          <p>当前可进入第 ${maxUnlocked} 关。</p>
          <button class="primary-button" data-action="continue">
            开始 / 继续
          </button>
        </section>

        <section class="panel content-stack">
          <h2>关卡列表</h2>
          <div class="stage-list">
            ${Array.from({ length: 13 }, (_, index) => {
              const number = index + 1;
              const unlocked = number <= maxUnlocked;

              return `
                <button
                  class="${unlocked ? "secondary-button" : "secondary-button is-locked"}"
                  data-stage="${number}"
                  ${unlocked ? "" : "disabled"}
                >
                  第 ${String(number).padStart(2, "0")} 关
                  ${unlocked ? "" : "（未解锁）"}
                </button>
              `;
            }).join("")}
          </div>
        </section>
      </section>
    `;

    this.elements.app
      .querySelector('[data-action="continue"]')
      ?.addEventListener("click", () => {
        this.navigateToStage(maxUnlocked);
      });

    this.elements.app
      .querySelectorAll("[data-stage]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          this.navigateToStage(Number(button.dataset.stage));
        });
      });
  },

  renderLocked(stageNumber) {
    const maxUnlocked =
      typeof Progress.getMaxUnlockedStage === "function"
        ? Progress.getMaxUnlockedStage()
        : 1;

    this.elements.app.innerHTML = `
      <section class="page page--locked">
        <h1>这扇门还没打开</h1>
        <p>第 ${stageNumber} 关尚未解锁。</p>
        <p class="muted">目前最多可以进入第 ${maxUnlocked} 关。</p>
        <button class="primary-button" data-action="back">
          返回可进入的关卡
        </button>
      </section>
    `;

    this.elements.app
      .querySelector('[data-action="back"]')
      ?.addEventListener("click", () => {
        this.navigateToStage(maxUnlocked);
      });
  },

  renderNotFound() {
    this.elements.app.innerHTML = `
      <section class="page page--not-found">
        <h1>404 — 页面不存在</h1>
        <p>你确定自己找对地方了吗？</p>
        <a href="${Router.toUrl("/")}" data-action="home">
          返回首页
        </a>
      </section>
    `;

    this.elements.app
      .querySelector('[data-action="home"]')
      ?.addEventListener("click", (event) => {
        event.preventDefault();
        this.navigateHome();
      });
  },

  navigateToStage(stageNumber) {
    if (!Number.isInteger(stageNumber) || stageNumber < 1 || stageNumber > 13) {
      this.showToast("无效的关卡编号。");
      return;
    }

    Router.navigate(Router.ROUTES.stage(stageNumber));
  },

  navigateHome() {
    Router.navigate("/");
  },

  showToast(message, duration = 2800) {
    const region = this.elements.toastRegion;

    if (!region) {
      console.info(`[Meta Puzzle] ${message}`);
      return;
    }

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    region.textContent = message;
    region.classList.add("is-visible");
    region.setAttribute("role", "status");

    this.toastTimer = setTimeout(() => {
      region.classList.remove("is-visible");
      this.toastTimer = null;
    }, duration);
  },
};

export function init() {
  App.init();
}

export function showToast(message, duration) {
  App.showToast(message, duration);
}

export function renderRoute() {
  return App.renderRoute();
}

export function navigateToCurrentRoute() {
  return App.renderRoute();
}

export default App;

App.init();

