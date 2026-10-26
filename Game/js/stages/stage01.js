
// =========================================================
// Meta Puzzle — Stage 01
// File: js/stages/stage01.js
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage01 = (() => {
  let root = null;
  let initialized = false;

  const state = {
    fakeLinkClicks: 0,
    hasFoundExit: false
  };

  const articles = [
    {
      id: "account",
      title: {
        "zh-CN": "账户管理",
        en: "Account Management"
      },
      description: {
        "zh-CN": "了解如何管理账户信息。",
        en: "Learn how to manage your account information."
      }
    },
    {
      id: "password",
      title: {
        "zh-CN": "密码问题",
        en: "Password Help"
      },
      description: {
        "zh-CN": "找回密码并管理登录设置。",
        en: "Recover your password and manage sign-in settings."
      }
    },
    {
      id: "billing",
      title: {
        "zh-CN": "账单与付款",
        en: "Billing and Payments"
      },
      description: {
        "zh-CN": "查看账单与付款相关说明。",
        en: "Find information about billing and payments."
      }
    },
    {
      id: "privacy",
      title: {
        "zh-CN": "隐私与安全",
        en: "Privacy and Security"
      },
      description: {
        "zh-CN": "了解隐私设置和安全建议。",
        en: "Learn about privacy settings and security."
      }
    },
    {
      id: "troubleshooting",
      title: {
        "zh-CN": "故障排除",
        en: "Troubleshooting"
      },
      description: {
        "zh-CN": "尝试解决常见问题。",
        en: "Try solving common issues."
      }
    },
    {
      id: "contact",
      title: {
        "zh-CN": "联系我们",
        en: "Contact Us"
      },
      description: {
        "zh-CN": "寻找联系支持团队的方式。",
        en: "Find ways to contact the support team."
      }
    }
  ];

  function language() {
    return I18n.getLanguage();
  }

  function text(zh, en) {
    return language() === "en" ? en : zh;
  }

  function renderArticle(article) {
    const lang = language();

    return `
      <article class="game-card">
        <h2 class="game-card-title">
          ${escapeHTML(article.title[lang])}
        </h2>

        <p class="game-card-description">
          ${escapeHTML(article.description[lang])}
        </p>

        <a
          class="stage01-fake-link"
          href="${escapeHTML(fake404Url(article.id))}"
          data-article="${escapeHTML(article.id)}"
        >
          ${escapeHTML(text("查看文章", "Read article"))}
        </a>
      </article>
    `;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  /**
   * All fake links lead to the same shared fake 404 route.
   * The article identifier is intentionally not used to create
   * separate error pages.
   */
  function fake404Url(articleId) {
    const url = new URL(
      Router.toUrl("/stage/01/404/"),
      window.location.origin
    );

    // This parameter is decorative and does not change the destination.
    url.searchParams.set("article", articleId);

    return url.pathname + url.search;
  }

  function renderMainPage() {
    root.innerHTML = `
      <section class="page page--reading stage01">
        <header class="page-header">
          <p class="page-eyebrow">
            ${escapeHTML(text("帮助中心 / 支持", "HELP CENTER / SUPPORT"))}
          </p>

          <h1 class="page-title">
            ${escapeHTML(text("有什么可以帮你？", "How can we help?"))}
          </h1>

          <p class="page-description">
            ${escapeHTML(
              text(
                "浏览下方的帮助文章，寻找你需要的信息。",
                "Browse the help articles below to find the information you need."
              )
            )}
          </p>
        </header>

        <section class="page-section">
          <form id="stage01-search" class="content-stack">
            <label for="stage01-query">
              ${escapeHTML(text("搜索帮助文章", "Search help articles"))}
            </label>

            <div class="button-row">
              <input
                id="stage01-query"
                type="search"
                placeholder="${escapeHTML(
                  text("输入问题或关键词……", "Enter a question or keyword…")
                )}"
                autocomplete="off"
              >

              <button class="primary-button" type="submit">
                ${escapeHTML(text("搜索", "Search"))}
              </button>
            </div>
          </form>
        </section>

        <section class="page-section">
          <h2>
            ${escapeHTML(text("常见主题", "Popular Topics"))}
          </h2>

          <div class="card-grid">
            ${articles.map(renderArticle).join("")}
          </div>
        </section>

        <section class="page-section">
          <h2>
            ${escapeHTML(text("仍然需要帮助？", "Still need help?"))}
          </h2>

          <p class="muted">
            ${escapeHTML(
              text(
                "你可以查看帮助文档，或者联系支持团队。",
                "You can browse the documentation or contact our support team."
              )
            )}
          </p>

          <a
            class="stage01-fake-link"
            href="${escapeHTML(fake404Url("support"))}"
            data-article="support"
          >
            ${escapeHTML(text("联系支持", "Contact support"))}
          </a>
        </section>
      </section>
    `;

    root.querySelectorAll(".stage01-fake-link").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();

        state.fakeLinkClicks += 1;

        Narrator.reactTo("fake-link", {
          article: link.dataset.article
        });

        renderFake404();
      });
    });

    root.querySelector("#stage01-search")?.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        Narrator.speakCustom({
          zh: "搜索功能目前似乎出了点问题。你可以试试页面上的其他功能。",
          en: "The search feature seems to be having trouble. Try another part of the page."
        }, "suspicious");
      }
    );
  }

  function renderFake404() {
    root.innerHTML = `
      <section class="page page--reading stage01 stage01-404">
        <header class="page-header">
          <p class="page-eyebrow">ERROR 404</p>

          <h1 class="page-title">
            ${escapeHTML(text("页面不存在", "Page not found"))}
          </h1>

          <p class="page-description">
            ${escapeHTML(
              text(
                "你访问的页面不存在，或者暂时无法使用。",
                "The page you requested does not exist or is temporarily unavailable."
              )
            )}
          </p>
        </header>

        <section class="page-section">
          <p>
            ${escapeHTML(
              text(
                "请检查网址，或返回帮助中心。",
                "Please check the URL or return to the Help Center."
              )
            )}
          </p>

          <button
            id="stage01-back"
            class="secondary-button"
            type="button"
          >
            ${escapeHTML(text("返回", "Go back"))}
          </button>
        </section>

        <footer class="stage01-error-footer">
          <span>
            ${escapeHTML(text("© 2026 Help Center", "© 2026 Help Center"))}
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            ${escapeHTML(text("隐私政策", "Privacy Policy"))}
          </span>
        </footer>
      </section>
    `;

    root.querySelector("#stage01-back")?.addEventListener("click", () => {
      renderMainPage();
    });

    const copyright = root.querySelector(".stage01-error-footer span");

    if (copyright) {
      copyright.style.cursor = "default";

      // The clickable target is only the copyright symbol.
      // The rest of the footer remains ordinary text.
      const originalText = copyright.textContent;
      const marker = document.createElement("span");
      marker.textContent = "©";
      marker.className = "stage01-hidden-exit";
      marker.setAttribute("role", "button");
      marker.setAttribute("tabindex", "0");
      marker.setAttribute(
        "aria-label",
        text("版权标记", "Copyright symbol")
      );

      marker.addEventListener("click", revealExit);
      marker.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          revealExit();
        }
      });

      copyright.textContent = "";
      copyright.appendChild(marker);
      copyright.appendChild(
        document.createTextNode(originalText.replace(/^©/, ""))
      );
    }

    Narrator.speakCustom({
      zh: "404。意料之中。你现在可以返回了——当然，如果你觉得这里还有什么值得看的，那也是你的自由。",
      en: "404. Predictable. You can go back now—unless you think there's something worth looking at here."
    }, "pleased");
  }

  function revealExit() {
    if (state.hasFoundExit) {
      return;
    }

    state.hasFoundExit = true;

    Narrator.speakCustom({
      zh: "……你居然在看页脚？好吧，这次算你赢。",
      en: "...You were looking at the footer? Fine. You win this round."
    }, "embarrassed");

    Progress.completeStage(1);

    root.innerHTML = `
      <section class="page page--reading stage01 stage01-success">
        <p class="page-eyebrow">ACCESS GRANTED</p>

        <h1 class="page-title">
          ${escapeHTML(text("你找到了出口。", "You found the exit."))}
        </h1>

        <p class="page-description">
          ${escapeHTML(
            text(
              "有时，最不起眼的细节才是关键。",
              "Sometimes the smallest detail matters most."
            )
          )}
        </p>

        <button id="stage01-continue" class="primary-button" type="button">
          ${escapeHTML(text("进入下一关", "Continue to Stage 2"))}
        </button>
      </section>
    `;

    root.querySelector("#stage01-continue")?.addEventListener("click", () => {
      Router.navigate(Router.ROUTES.stage(2));
    });
  }

  function onLanguageChange() {
    if (!root) {
      return;
    }

    // Keep the current screen rather than forcing the player
    // back to the beginning when switching languages.
    const errorPage = root.querySelector(".stage01-404");
    const successPage = root.querySelector(".stage01-success");

    if (successPage) {
      root.innerHTML = `
        <section class="page page--reading stage01 stage01-success">
          <p class="page-eyebrow">ACCESS GRANTED</p>
          <h1 class="page-title">
            ${escapeHTML(text("你找到了出口。", "You found the exit."))}
          </h1>
          <p class="page-description">
            ${escapeHTML(
              text(
                "有时，最不起眼的细节才是关键。",
                "Sometimes the smallest detail matters most."
              )
            )}
          </p>
          <button id="stage01-continue" class="primary-button" type="button">
            ${escapeHTML(text("进入下一关", "Continue to Stage 2"))}
          </button>
        </section>
      `;

      root.querySelector("#stage01-continue")?.addEventListener("click", () => {
        Router.navigate(Router.ROUTES.stage(2));
      });

      return;
    }

    if (errorPage) {
      renderFake404();
    } else {
      renderMainPage();
    }
  }

  function mount(container) {
    if (!container) {
      throw new Error("Stage 1 requires a root container.");
    }

    root = container;
    initialized = true;

    state.fakeLinkClicks = 0;
    state.hasFoundExit = false;

    renderMainPage();

    Narrator.setStage(1);

    window.addEventListener("languagechange", onLanguageChange);

    return {
      unmount
    };
  }

  function unmount() {
    window.removeEventListener("languagechange", onLanguageChange);

    root = null;
    initialized = false;
  }

  function getState() {
    return {
      ...state,
      initialized
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage01;
