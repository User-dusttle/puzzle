
/* ========================================================
 * Meta Puzzle — Stage 13
 * File: js/stages/stage13.js
 *
 * Endings:
 *   FINISH GAME -> Normal ending
 *   STAY HERE   -> Narrator monologue -> Thank-you page
 *                                -> Hidden UI bug -> Secret ending
 * ======================================================== */

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Progress from "../progress.js";

const Stage13 = (() => {
  let root = null;
  let languageListener = null;

  const state = {
    route: "choice",
    ending: "normal",
    stayHereRoute: false,
    secretUnlocked: false
  };

  const COPY = {
    "zh-CN": {
      eyebrow: "FINAL PAGE",
      title: "那么，游戏结束了吗？",
      intro: "你已经抵达了终点。接下来，由你决定。",
      finish: "FINISH GAME",
      stay: "STAY HERE",

      narratorLines: [
        "等等，你就这么走了？",
        "你知道吗，这个网站其实还有很多没写完的东西。",
        "不过这不重要。你已经完成了游戏，至少从某种意义上来说。",
        "别误会，我不是舍不得你走。我只是觉得……",
        "算了。反正你肯定也不会继续留下来。",
        "好了，感谢界面就在前面。别再乱点东西了。"
      ],

      thanksTitle: "感谢游玩！",
      thanksBody:
        "恭喜你完成了 Meta Puzzle。感谢你花时间探索这个网站，也感谢你忍受了那个话很多的旁白。",
      normalEnding: "NORMAL ENDING",
      credits: "设计、谜题与无数个不必要的按钮。",
      backHome: "返回首页",

      secretTitle: "……等等。",
      secretBody:
        "你居然真的发现了这里。看来，有些东西即使被当成结束，也不代表它真的结束了。",
      secretLabel: "HIDDEN ENDING",
      secretCredits: "你找到了不应该被找到的东西。",

      narrator:
        "哦？你选择留下来？我得声明一下，这里已经没有任何内容了。真的。完全没有。你现在离开也不会错过什么。",

      footer: "© 2026 Help Center",
      bugHint: " "
    },

    en: {
      eyebrow: "FINAL PAGE",
      title: "So, Is the Game Over?",
      intro: "You've reached the end. The next move is yours.",
      finish: "FINISH GAME",
      stay: "STAY HERE",

      narratorLines: [
        "Wait. You're just leaving?",
        "You know, there are still plenty of things I never finished building.",
        "But that doesn't matter. You've completed the game. More or less.",
        "Don't misunderstand. I don't mind you leaving. I just think...",
        "Never mind. You probably won't stay anyway.",
        "The thank-you page is right ahead. Don't click anything else."
      ],

      thanksTitle: "Thank You for Playing!",
      thanksBody:
        "Congratulations on completing Meta Puzzle. Thank you for exploring this website—and for putting up with its talkative narrator.",
      normalEnding: "NORMAL ENDING",
      credits: "Design, puzzles, and an unreasonable number of buttons.",
      backHome: "Return Home",

      secretTitle: "...Wait.",
      secretBody:
        "You actually found it. Apparently, something being treated as the end doesn't mean it has truly ended.",
      secretLabel: "HIDDEN ENDING",
      secretCredits: "You found something that wasn't supposed to be found.",

      narrator:
        "Oh? You chose to stay? I should clarify that there is absolutely nothing left here. Really. Nothing at all. You won't miss anything if you leave now.",

      footer: "© 2026 Help Center",
      bugHint: " "
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

  function renderChoice() {
    root.innerHTML = `
      <section class="page page--reading stage13">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("intro"))}</p>
        </header>

        <section class="panel content-stack">
          <div class="stage13-choice">
            <button
              type="button"
              class="primary-button"
              id="stage13-finish"
            >FINISH GAME</button>

            <button
              type="button"
              class="secondary-button"
              id="stage13-stay"
            >STAY HERE</button>
          </div>
        </section>
      </section>
    `;

    root.querySelector("#stage13-finish")
      ?.addEventListener("click", () => {
        state.stayHereRoute = false;
        state.ending = "normal";
        state.route = "thanks";
        Progress.completeStage(13);
        renderThanks();
      });

    root.querySelector("#stage13-stay")
      ?.addEventListener("click", () => {
        state.stayHereRoute = true;
        state.route = "monologue";
        renderMonologue();
      });
  }

  function renderMonologue() {
    root.innerHTML = `
      <section class="page page--reading stage13">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">...</h1>
        </header>

        <section class="panel content-stack">
          <p id="stage13-monologue"></p>
          <button
            type="button"
            class="secondary-button"
            id="stage13-continue"
          >Continue</button>
        </section>
      </section>
    `;

    const paragraph = root.querySelector("#stage13-monologue");
    const button = root.querySelector("#stage13-continue");
    const lines = t("narratorLines");
    let index = 0;

    function showNextLine() {
      if (index < lines.length) {
        paragraph.textContent = lines[index];
        index++;
        return;
      }

      state.route = "thanks";
      state.ending = "normal";
      renderThanks();
    }

    showNextLine();

    button?.addEventListener("click", showNextLine);

    Narrator.speakCustom({
      zh: COPY["zh-CN"].narrator,
      en: COPY.en.narrator
    }, "confused");
  }

  function renderThanks() {
    if (!root) return;

    const isHidden = state.ending === "hidden";

    root.innerHTML = `
      <section class="page page--reading stage13 stage13-thanks">
        <header class="page-header">
          <p class="page-eyebrow">META PUZZLE</p>
          <h1 class="page-title">
            ${escapeHTML(isHidden ? t("secretTitle") : t("thanksTitle"))}
          </h1>
          <p class="page-description">
            ${escapeHTML(isHidden ? t("secretBody") : t("thanksBody"))}
          </p>
        </header>

        <section class="panel content-stack stage13-credits">
          <p>
            ${escapeHTML(isHidden ? t("secretLabel") : t("normalEnding"))}
          </p>
          <p>${escapeHTML(isHidden ? t("secretCredits") : t("credits"))}</p>

          ${
            isHidden
              ? `<p class="stage13-secret-mark">END / ∅</p>`
              : ""
          }

          <button
            type="button"
            class="secondary-button"
            id="stage13-home"
          >${escapeHTML(t("backHome"))}</button>
        </section>

        ${
          state.stayHereRoute && !isHidden
            ? `
              <div class="stage13-bug-zone">
                <span
                  id="stage13-bug"
                  role="button"
                  tabindex="0"
                  aria-label=" "
                  title=""
                >.</span>
              </div>
            `
            : ""
        }

        <footer class="page-footer">
          <p>${escapeHTML(t("footer"))}</p>
        </footer>
      </section>
    `;

    root.querySelector("#stage13-home")
      ?.addEventListener("click", () => {
        window.location.href = "./";
      });

    // The bug exists only on the STAY HERE route.
    // It is intentionally almost invisible and has no useful label.
    const bug = root.querySelector("#stage13-bug");

    function triggerHiddenEnding() {
      if (!state.stayHereRoute || state.ending === "hidden") return;

      state.ending = "hidden";
      state.secretUnlocked = true;
      renderThanks();

      Narrator.speakCustom({
        zh: "……你为什么要点那里？",
        en: "...Why did you click that?"
      }, "shocked");
    }

    bug?.addEventListener("click", triggerHiddenEnding);

    bug?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        triggerHiddenEnding();
      }
    });
  }

  function onLanguageChange() {
    if (!root) return;

    if (state.route === "choice") {
      renderChoice();
    } else if (state.route === "monologue") {
      renderMonologue();
    } else {
      renderThanks();
    }
  }

  function mount(container) {
    root = container;

    state.route = "choice";
    state.ending = "normal";
    state.stayHereRoute = false;
    state.secretUnlocked = false;

    renderChoice();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(13);

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

export default Stage13;
