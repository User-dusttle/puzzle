
// =========================================================
// Meta Puzzle — Stage 06
// File: js/stages/stage06.js
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage06 = (() => {
  let root = null;
  let languageListener = null;
  let keyHandler = null;
  let gameLoop = null;

  const state = {
    view: "main",
    score: 0,
    snake: [],
    direction: "right",
    nextDirection: "right",
    apples: [],
    tetrisBlocks: [],
    tetrisStarted: false,
    solved: false,
    secret: "SNAKE_TETRIS_20",
    gameOver: false
  };

  const COOKIE_NAME = "mp_game_link";
  const COOKIE_VALUE = "snake-lab";

  const COPY = {
    "zh-CN": {
      eyebrow: "隐私中心 / Cookie 设置",
      title: "我们使用 Cookie。",
      description:
        "本站使用 Cookie 保存偏好设置，并改善使用体验。继续浏览即表示你了解此说明。",
      detailsTitle: "Cookie 说明",
      detailsText:
        "部分 Cookie 用于保存游戏状态或页面设置。你可以在浏览器设置中查看网站存储的数据。",
      continue: "继续",
      gameTitle: "Snake Lab",
      gameDescription:
        "使用方向键控制蛇移动。吃到苹果即可得分。撞到墙壁或自己会结束游戏。",
      score: "分数",
      start: "开始游戏",
      restart: "重新开始",
      back: "返回说明页",
      tetrisNotice:
        "检测到旧游戏组件加载。方块开始落下，游戏状态可能受到影响。",
      tetrisClear:
        "旧组件已清除。发现一段待处理的文本。",
      secretTitle: "发现隐藏字符串",
      secretText:
        "记录这段字符串，然后返回上一页，在网址后添加 ?Key=字符串。",
      continueStage: "进入下一关",
      narrator:
        "Cookie？无聊的东西。肯定没人会去检查它们，对吧？",
      cookieMissing:
        "没有找到游戏入口 Cookie。请重新进入本关。",
      failed:
        "游戏结束。再试一次吧——这次别把自己绕晕了。"
    },
    en: {
      eyebrow: "PRIVACY CENTER / COOKIE SETTINGS",
      title: "We use cookies.",
      description:
        "This site uses cookies to save preferences and improve your experience. Continuing means you acknowledge this notice.",
      detailsTitle: "About cookies",
      detailsText:
        "Some cookies store game state or page settings. You can inspect website storage in your browser settings.",
      continue: "Continue",
      gameTitle: "Snake Lab",
      gameDescription:
        "Use the arrow keys to control the snake. Eat apples to score points. Hitting a wall or yourself ends the game.",
      score: "Score",
      start: "Start game",
      restart: "Restart",
      back: "Back to notice",
      tetrisNotice:
        "Legacy game component detected. Blocks are falling and may affect the game state.",
      tetrisClear:
        "Legacy component cleared. A pending text string was found.",
      secretTitle: "Hidden string found",
      secretText:
        "Record this string, return to the previous page, and append ?Key=STRING to the URL.",
      continueStage: "Continue to Stage 7",
      narrator:
        "Cookies? Boring stuff. Surely nobody checks them, right?",
      cookieMissing:
        "No game-link cookie found. Re-enter this stage.",
      failed:
        "Game over. Try again—and try not to tie yourself in knots."
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

  function setCookie() {
    // A non-sensitive, same-site cookie used only for this puzzle.
    document.cookie =
      `${COOKIE_NAME}=${encodeURIComponent(COOKIE_VALUE)}; path=/; SameSite=Lax`;
  }

  function readCookie(name) {
    const prefix = `${name}=`;

    const item = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));

    if (!item) return null;

    try {
      return decodeURIComponent(item.slice(prefix.length));
    } catch {
      return item.slice(prefix.length);
    }
  }

  function clearCookie() {
    document.cookie =
      `${COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Lax`;
  }

  function renderNotice() {
    state.view = "main";

    setCookie();

    root.innerHTML = `
      <section class="page page--reading stage06">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("description"))}</p>
        </header>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("detailsTitle"))}</h2>
          <p>${escapeHTML(t("detailsText"))}</p>

          <button id="stage06-continue" class="primary-button" type="button">
            ${escapeHTML(t("continue"))}
          </button>
        </section>
      </section>
    `;

    root.querySelector("#stage06-continue")?.addEventListener("click", () => {
      const link = readCookie(COOKIE_NAME);

      if (link !== COOKIE_VALUE) {
        const message = root.querySelector(".page-description");
        if (message) message.textContent = t("cookieMissing");
        return;
      }

      Narrator.speakCustom({
        zh: t("narrator"),
        en: t("narrator")
      }, "smug");

      renderCookieHint();
    });
  }

  function renderCookieHint() {
    root.innerHTML = `
      <section class="page page--reading stage06">
        <header class="page-header">
          <p class="page-eyebrow">COOKIE CHECK</p>
          <h1 class="page-title">
            ${escapeHTML(t("detailsTitle"))}
          </h1>
          <p class="page-description">
            ${escapeHTML(
              lang() === "en"
                ? "The page has stored a small preference."
                : "页面保存了一项小小的偏好设置。"
            )}
          </p>
        </header>

        <section class="panel content-stack">
          <p>
            ${escapeHTML(
              lang() === "en"
                ? "The game is not linked from the visible navigation."
                : "这个游戏并没有出现在可见的导航菜单里。"
            )}
          </p>

          <p class="muted">
            ${escapeHTML(
              lang() === "en"
                ? "Inspect the site's cookies to find its destination."
                : "检查网站的 Cookie，找到它指向的地址。"
            )}
          </p>

          <button id="stage06-open-game" class="primary-button" type="button">
            ${escapeHTML(t("start"))}
          </button>
        </section>
      </section>
    `;

    root.querySelector("#stage06-open-game")?.addEventListener("click", () => {
      const cookie = readCookie(COOKIE_NAME);

      if (cookie !== COOKIE_VALUE) {
        root.querySelector(".muted").textContent = t("cookieMissing");
        return;
      }

      renderGame();
    });
  }

  function initGame() {
    state.score = 0;
    state.snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 }
    ];

    state.direction = "right";
    state.nextDirection = "right";
    state.apples = [randomEmptyCell()];
    state.tetrisBlocks = [];
    state.tetrisStarted = false;
    state.gameOver = false;
    state.solved = false;
  }

  function randomEmptyCell() {
    let cell;

    do {
      cell = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 14)
      };
    } while (
      state.snake.some((part) => part.x === cell.x && part.y === cell.y) ||
      state.apples.some((apple) => apple.x === cell.x && apple.y === cell.y)
    );

    return cell;
  }

  function renderGame() {
    stopGameLoop();
    state.view = "game";
    initGame();

    root.innerHTML = `
      <section class="page page--reading stage06 stage06-game">
        <header class="page-header">
          <p class="page-eyebrow">LEGACY ARCADE</p>
          <h1 class="page-title">${escapeHTML(t("gameTitle"))}</h1>
          <p class="page-description">${escapeHTML(t("gameDescription"))}</p>
        </header>

        <section class="panel content-stack">
          <p>
            ${escapeHTML(t("score"))}:
            <strong id="stage06-score">0</strong>
          </p>

          <div
            id="stage06-board"
            class="stage06-board"
            role="img"
            aria-label="Snake game board"
          ></div>

          <p id="stage06-notice" aria-live="polite"></p>

          <button id="stage06-restart" class="secondary-button" type="button">
            ${escapeHTML(t("restart"))}
          </button>

          <button id="stage06-back" class="secondary-button" type="button">
            ${escapeHTML(t("back"))}
          </button>
        </section>
      </section>
    `;

    root.querySelector("#stage06-restart")?.addEventListener("click", renderGame);
    root.querySelector("#stage06-back")?.addEventListener("click", renderNotice);

    drawBoard();

    gameLoop = window.setInterval(tick, 180);
  }

  function drawBoard() {
    const board = root?.querySelector("#stage06-board");
    if (!board) return;

    const cells = [];

    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 20; x++) {
        let className = "stage06-cell";
        let symbol = "";

        if (state.snake.some((part) => part.x === x && part.y === y)) {
          className += " stage06-cell--snake";
          symbol = "●";
        } else if (state.apples.some((apple) => apple.x === x && apple.y === y)) {
          className += " stage06-cell--apple";
          symbol = "●";
        }

        const tetris = state.tetrisBlocks.find(
          (block) => block.x === x && block.y === y
        );

        if (tetris) {
          className += " stage06-cell--tetris";
          symbol = "■";
        }

        cells.push(
          `<span class="${className}" aria-hidden="true">${symbol}</span>`
        );
      }
    }

    board.innerHTML = cells.join("");

    const score = root.querySelector("#stage06-score");
    if (score) score.textContent = String(state.score);
  }

  function tick() {
    if (state.view !== "game" || state.gameOver || state.solved) return;

    state.direction = state.nextDirection;

    const head = { ...state.snake[0] };

    if (state.direction === "up") head.y -= 1;
    if (state.direction === "down") head.y += 1;
    if (state.direction === "left") head.x -= 1;
    if (state.direction === "right") head.x += 1;

    const ateApple = state.apples.some(
      (apple) => apple.x === head.x && apple.y === head.y
    );

    const bodyToCheck = ateApple
      ? state.snake
      : state.snake.slice(0, -1);

    if (
      head.x < 0 ||
      head.x >= 20 ||
      head.y < 0 ||
      head.y >= 14 ||
      bodyToCheck.some((part) => part.x === head.x && part.y === head.y)
    ) {
      state.gameOver = true;
      stopGameLoop();

      const notice = root.querySelector("#stage06-notice");
      if (notice) notice.textContent = t("failed");

      Narrator.reactTo("wrong-answer", {
        stage: 6,
        score: state.score
      });

      return;
    }

    state.snake.unshift(head);

    if (ateApple) {
      state.score += 1;
      state.apples = [randomEmptyCell()];
    } else {
      state.snake.pop();
    }

    if (state.score >= 10 && !state.tetrisStarted) {
      state.tetrisStarted = true;
      startTetrisInterference();
    }

    if (state.score >= 20) {
      finishGame();
      return;
    }

    drawBoard();
  }

  function startTetrisInterference() {
    Narrator.speakCustom({
      zh: t("tetrisNotice"),
      en: t("tetrisNotice")
    }, "surprised");

    const notice = root.querySelector("#stage06-notice");
    if (notice) notice.textContent = t("tetrisNotice");

    // Simulate falling Tetris pieces that interfere with the Snake board.
    // The pieces are visual obstacles rather than a separate full Tetris
    // game; the final integrated version can replace this with the shared
    // arcade engine.
    for (let i = 0; i < 4; i++) {
      state.tetrisBlocks.push({
        x: 2 + i,
        y: 0
      });
    }

    const fallTimer = window.setInterval(() => {
      if (state.view !== "game" || state.gameOver || state.solved) {
        window.clearInterval(fallTimer);
        return;
      }

      state.tetrisBlocks = state.tetrisBlocks.map((block) => ({
        ...block,
        y: Math.min(13, block.y + 1)
      }));

      drawBoard();

      if (state.tetrisBlocks.every((block) => block.y >= 13)) {
        window.clearInterval(fallTimer);
      }
    }, 450);
  }

  function finishGame() {
    state.solved = true;
    stopGameLoop();

    const secret = state.secret;

    root.innerHTML = `
      <section class="page page--reading stage06 stage06-success">
        <p class="page-eyebrow">LEGACY ARCADE / COMPLETE</p>
        <h1 class="page-title">${escapeHTML(t("secretTitle"))}</h1>
        <p class="page-description">${escapeHTML(t("secretText"))}</p>

        <section class="panel content-stack">
          <label for="stage06-secret">
            ${escapeHTML(t("secretTitle"))}
          </label>

          <input
            id="stage06-secret"
            type="text"
            readonly
            value="${escapeHTML(secret)}"
          >

          <button id="stage06-copy" class="secondary-button" type="button">
            ${escapeHTML(
              lang() === "en" ? "Copy string" : "复制字符串"
            )}
          </button>

          <button id="stage06-continue" class="primary-button" type="button">
            ${escapeHTML(t("continueStage"))}
          </button>
        </section>
      </section>
    `;

    root.querySelector("#stage06-copy")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(secret);
      } catch {
        const input = root.querySelector("#stage06-secret");
        input?.select();
      }
    });

    root.querySelector("#stage06-continue")?.addEventListener("click", () => {
      Progress.completeStage(6);
      Router.navigate(Router.ROUTES.stage(7));
    });

    Narrator.speakCustom({
      zh: t("tetrisClear"),
      en: t("tetrisClear")
    }, "pleased");
  }

  function onKeyDown(event) {
    if (state.view !== "game" || state.gameOver || state.solved) return;

    const directions = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };

    const next = directions[event.key];
    if (!next) return;

    event.preventDefault();

    const opposite = {
      up: "down",
      down: "up",
      left: "right",
      right: "left"
    };

    if (opposite[state.direction] !== next) {
      state.nextDirection = next;
    }
  }

  function stopGameLoop() {
    if (gameLoop !== null) {
      window.clearInterval(gameLoop);
      gameLoop = null;
    }
  }

  function onLanguageChange() {
    if (!root) return;

    if (state.view === "game") {
      renderGame();
    } else {
      renderNotice();
    }
  }

  function mount(container) {
    root = container;

    state.view = "main";
    state.solved = false;

    renderNotice();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    keyHandler = onKeyDown;
    window.addEventListener("keydown", keyHandler);

    Narrator.setStage(6);

    return { unmount };
  }

  function unmount() {
    stopGameLoop();

    if (languageListener) {
      window.removeEventListener("languagechange", languageListener);
      languageListener = null;
    }

    if (keyHandler) {
      window.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }

    root = null;
  }

  function getState() {
    return {
      view: state.view,
      score: state.score,
      tetrisStarted: state.tetrisStarted,
      solved: state.solved,
      gameOver: state.gameOver
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage06;
