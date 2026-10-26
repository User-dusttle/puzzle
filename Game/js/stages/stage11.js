
/* ========================================================
 * Meta Puzzle — Stage 11
 * File: js/stages/stage11.js *
 * Games:
 * 1. Minesweeper
 * 2. River crossing
 * 3. Tic-tac-toe
 * ======================================================== */

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage11 = (() => {
  let root = null;
  let languageListener = null;

  const state = {
    currentGame: "minesweeper",
    completed: new Set(),
    revealed: new Set(),
    flags: new Set(),
    riverSide: "left",
    riverMoves: 0,
    riverChanged: false,
    board: Array(9).fill(""),
    playerTurn: true,
    ticAttempts: 0,
    firstTicFinished: false,
    narratorFlipped: false,
    solved: false,
    message: ""
  };

  const COPY = {
    "zh-CN": {
      eyebrow: "逻辑测试 / 11",
      title: "规则当然没有变",
      intro:
        "三场游戏。三套规则。旁白郑重保证：规则从头到尾都没有变过。",
      minesTitle: "第一场：扫雷",
      minesDesc:
        "找出安全格，并标记你认为有雷的位置。右键可以插旗。注意：旗帜并不一定会一直留在那里。",
      riverTitle: "第二场：过河",
      riverDesc:
        "把农夫、狼、羊和菜全部送到右岸。狼不能单独和羊待在一起，羊也不能单独和菜待在一起。",
      ticTitle: "第三场：井字棋",
      ticDesc:
        "点击格子落子。你执 X，旁白执 O。若棋盘出现不合常理的变化，请相信棋盘。",
      narratorLine:
        "放心，我是一个遵守规则的旁白。尤其是在没有人检查的时候。",
      nextGame: "进入下一场",
      restart: "重新开始",
      hint: "可靠提示",
      hintText:
        "不要只记录自己做过什么，也要检查当前状态。规则描述、界面显示和实际结果可能互相矛盾。",
      minesWin: "扫雷完成。",
      minesFail: "你踩到了雷。至少这次结果很诚实。",
      riverWin: "所有人和东西都安全到达了右岸。",
      riverFail: "有人被留下了。旁白坚持说这是你的问题。",
      ticWin: "你赢了这一局。",
      ticDraw: "平局。旁白声称自己本来就打算这样。",
      ticLose: "你输了。等一下……棋盘刚才是不是变了？",
      allDone: "三场游戏全部完成。",
      finish: "继续",
      left: "左岸",
      right: "右岸",
      farmer: "农夫",
      wolf: "狼",
      sheep: "羊",
      cabbage: "菜",
      cross: "过河",
      status: "当前状态",
      mineHint:
        "提示：数字代表周围八格中地雷的数量。旗帜只是你的标记，不会改变格子的真实内容。"
    },
    en: {
      eyebrow: "LOGIC TEST / 11",
      title: "The Rules Have Not Changed",
      intro:
        "Three games. Three sets of rules. The narrator solemnly promises that nothing will change.",
      minesTitle: "Game One: Minesweeper",
      minesDesc:
        "Reveal safe cells and flag suspected mines. Right-click to flag. Keep an eye on those flags.",
      riverTitle: "Game Two: River Crossing",
      riverDesc:
        "Move the farmer, wolf, sheep, and cabbage to the right bank. The wolf cannot be left alone with the sheep, nor the sheep with the cabbage.",
      ticTitle: "Game Three: Tic-Tac-Toe",
      ticDesc:
        "Click a cell to place X. The narrator plays O. If the board changes unexpectedly, trust what you see.",
      narratorLine:
        "Relax. I follow the rules. Especially when nobody is checking.",
      nextGame: "Next Game",
      restart: "Restart",
      hint: "Reliable Hint",
      hintText:
        "Don't only record your actions. Inspect the current state. The rules, interface, and outcome may contradict one another.",
      minesWin: "Minesweeper complete.",
      minesFail: "You hit a mine. At least this result was honest.",
      riverWin: "Everyone and everything made it safely across.",
      riverFail: "Someone was left behind. The narrator insists it's your fault.",
      ticWin: "You won this round.",
      ticDraw: "A draw. The narrator claims this was intentional.",
      ticLose: "You lost. Wait... did the board just change?",
      allDone: "All three games are complete.",
      finish: "Continue",
      left: "Left Bank",
      right: "Right Bank",
      farmer: "Farmer",
      wolf: "Wolf",
      sheep: "Sheep",
      cabbage: "Cabbage",
      cross: "Cross",
      status: "Current State",
      mineHint:
        "Numbers count mines in the eight surrounding cells. Flags are only your markers."
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

    const gameOrder = ["minesweeper", "river", "tic"];
    const active = state.currentGame;

    root.innerHTML = `
      <section class="page page--reading stage11">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("intro"))}</p>
        </header>

        <section class="panel content-stack">
          <p>${escapeHTML(t("narratorLine"))}</p>
          <p class="muted">${escapeHTML(t("status"))}: ${
            escapeHTML(gameOrder.map((game) =>
              `${game}: ${state.completed.has(game) ? "✓" : "—"}`
            ).join(" | "))
          }</p>
        </section>

        ${active === "minesweeper" ? renderMinesweeper() : ""}
        ${active === "river" ? renderRiver() : ""}
        ${active === "tic" ? renderTicTacToe() : ""}

        <section class="page-section">
          <details>
            <summary>${escapeHTML(t("hint"))}</summary>
            <p>${escapeHTML(t("hintText"))}</p>
          </details>
        </section>

        ${state.completed.size === 3 ? `
          <section class="panel content-stack">
            <h2>${escapeHTML(t("allDone"))}</h2>
            <button id="stage11-finish" class="primary-button" type="button">
              ${escapeHTML(t("finish"))}
            </button>
          </section>
        ` : ""}
      </section>
    `;

    bindMinesweeper();
    bindRiver();
    bindTicTacToe();

    root.querySelector("#stage11-finish")
      ?.addEventListener("click", finish);
  }

  /* ---------------- Minesweeper ---------------- */

  const MINE_MAP = [
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0]
  ];

  function mineCount(r, c) {
    let count = 0;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const rr = r + dr;
        const cc = c + dc;

        if (MINE_MAP[rr]?.[cc] === 1) count++;
      }
    }

    return count;
  }

  function renderMinesweeper() {
    let cells = "";

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const key = `${r},${c}`;
        const revealed = state.revealed.has(key);
        const flagged = state.flags.has(key);
        const mine = MINE_MAP[r][c] === 1;

        cells += `
          <button
            type="button"
            class="game-cell ${revealed ? "is-revealed" : ""}"
            data-mine-cell="${key}"
            aria-label="${r + 1},${c + 1}"
          >${
            revealed
              ? mine ? "✹" : String(mineCount(r, c))
              : flagged ? "⚑" : ""
          }</button>
        `;
      }
    }

    return `
      <section class="panel content-stack">
        <h2>${escapeHTML(t("minesTitle"))}</h2>
        <p>${escapeHTML(t("minesDesc"))}</p>
        <div class="game-grid" style="grid-template-columns:repeat(5,minmax(0,1fr));max-width:340px">
          ${cells}
        </div>
        <p id="stage11-mines-status" aria-live="polite"></p>
        <p class="muted">${escapeHTML(t("mineHint"))}</p>
        <button id="stage11-mines-next" class="secondary-button" type="button">
          ${escapeHTML(t("nextGame"))}
        </button>
      </section>
    `;
  }

  function bindMinesweeper() {
    if (state.currentGame !== "minesweeper") return;

    root.querySelectorAll("[data-mine-cell]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.mineCell;

        if (state.revealed.has(key)) return;

        if (state.flags.has(key)) {
          // A flag mysteriously disappears once.
          state.flags.delete(key);
          render();
          Narrator.speakCustom({
            zh: "咦？你确定刚才插过旗吗？",
            en: "Huh? Are you sure you placed a flag there?"
          }, "confused");
          return;
        }

        state.revealed.add(key);

        const [r, c] = key.split(",").map(Number);

        if (MINE_MAP[r][c] === 1) {
          setMessage("mines", t("minesFail"));
          state.revealed.delete(key);
          return;
        }

        const safeCount = state.revealed.size;
        if (safeCount >= 8) {
          state.completed.add("minesweeper");
          setMessage("mines", t("minesWin"));
        }

        render();
      });

      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        const key = button.dataset.mineCell;
        if (state.revealed.has(key)) return;

        if (state.flags.has(key)) {
          state.flags.delete(key);
        } else {
          state.flags.add(key);
        }

        render();
      });
    });

    root.querySelector("#stage11-mines-next")
      ?.addEventListener("click", () => {
        if (!state.completed.has("minesweeper")) {
          setMessage("mines", t("minesFail"));
          return;
        }

        state.currentGame = "river";
        render();
      });
  }

  /* ---------------- River crossing ---------------- */

  function renderRiver() {
    const positions = {
      farmer: "left",
      wolf: "left",
      sheep: "left",
      cabbage: "left"
    };

    for (const move of state.riverHistory ?? []) {
      positions.farmer = move.farmer;
      if (move.cargo) positions[move.cargo] = move.farmer;
    }

    const entities = ["farmer", "wolf", "sheep", "cabbage"];

    const banks = ["left", "right"].map((side) => `
      <div class="panel content-stack">
        <h3>${escapeHTML(t(side))}</h3>
        ${entities.filter((entity) => positions[entity] === side)
          .map((entity) => `<span>${escapeHTML(t(entity))}</span>`).join("")}
      </div>
    `).join("");

    return `
      <section class="panel content-stack">
        <h2>${escapeHTML(t("riverTitle"))}</h2>
        <p>${escapeHTML(t("riverDesc"))}</p>
        <div class="grid grid--2">${banks}</div>
        <label for="stage11-cargo">选择随行对象</label>
        <select id="stage11-cargo">
          <option value="">只带农夫</option>
          <option value="wolf">${escapeHTML(t("wolf"))}</option>
          <option value="sheep">${escapeHTML(t("sheep"))}</option>
          <option value="cabbage">${escapeHTML(t("cabbage"))}</option>
        </select>
        <button id="stage11-river-cross" class="primary-button" type="button">
          ${escapeHTML(t("cross"))}
        </button>
        <p id="stage11-river-status" aria-live="polite"></p>
        <button id="stage11-river-next" class="secondary-button" type="button">
          ${escapeHTML(t("nextGame"))}
        </button>
      </section>
    `;
  }

  function bindRiver() {
    if (state.currentGame !== "river") return;

    root.querySelector("#stage11-river-cross")
      ?.addEventListener("click", () => {
        const cargo = root.querySelector("#stage11-cargo")?.value || "";
        const history = state.riverHistory ?? [];
        const previous = history.length
          ? history[history.length - 1]
          : { farmer: "left" };

        const nextSide = previous.farmer === "left" ? "right" : "left";

        history.push({ farmer: nextSide, cargo });
        state.riverHistory = history;
        state.riverMoves++;

        const status = root.querySelector("#stage11-river-status");

        if (state.riverMoves === 2 && !state.riverChanged) {
          state.riverChanged = true;

          if (status) {
            status.textContent = lang() === "en"
              ? "Rule update: the sheep has developed a suspicious appetite."
              : "规则更新：羊突然有了奇怪的食欲。";
          }

          Narrator.speakCustom({
            zh: "规则没有变。只是羊现在会吃菜……我想起来了。",
            en: "The rules haven't changed. The sheep just eats cabbage now... I think."
          }, "smug");
        } else if (state.riverMoves >= 7) {
          state.completed.add("river");
          if (status) status.textContent = t("riverWin");
        }

        render();
      });

    root.querySelector("#stage11-river-next")
      ?.addEventListener("click", () => {
        if (!state.completed.has("river")) {
          const status = root.querySelector("#stage11-river-status");
          if (status) status.textContent = t("riverFail");
          return;
        }

        state.currentGame = "tic";
        render();
      });
  }

  /* ---------------- Tic-tac-toe ---------------- */

  function renderTicTacToe() {
    const cells = state.board.map((value, index) => `
      <button
        type="button"
        class="game-cell"
        data-tic-cell="${index}"
        aria-label="Cell ${index + 1}"
      >${escapeHTML(value)}</button>
    `).join("");

    return `
      <section class="panel content-stack">
        <h2>${escapeHTML(t("ticTitle"))}</h2>
        <p>${escapeHTML(t("ticDesc"))}</p>
        <div class="game-grid" style="grid-template-columns:repeat(3,minmax(0,1fr));max-width:260px">
          ${cells}
        </div>
        <p id="stage11-tic-status" aria-live="polite"></p>
        <button id="stage11-tic-restart" class="secondary-button" type="button">
          ${escapeHTML(t("restart"))}
        </button>
      </section>
    `;
  }

  function bindTicTacToe() {
    if (state.currentGame !== "tic") return;

    root.querySelectorAll("[data-tic-cell]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.ticCell);

        if (state.board[index] || hasWinner(state.board)) return;

        state.board[index] = "X";
        computerMove();

        const winner = hasWinner(state.board);
        const status = root.querySelector("#stage11-tic-status");

        if (winner === "X") {
          state.completed.add("tic");
          if (status) status.textContent = t("ticWin");
        } else if (winner === "O") {
          state.ticAttempts++;

          if (!state.narratorFlipped) {
            const occupied = state.board.findIndex((cell) => cell === "O");
            if (occupied >= 0) state.board[occupied] = "X";
            state.narratorFlipped = true;

            if (status) status.textContent = t("ticLose");
          } else {
            state.completed.add("tic");
            if (status) status.textContent = t("ticLose");
          }
        } else if (state.board.every(Boolean)) {
          state.completed.add("tic");
          if (status) status.textContent = t("ticDraw");
        }

        render();
      });
    });

    root.querySelector("#stage11-tic-restart")
      ?.addEventListener("click", () => {
        state.board = Array(9).fill("");
        state.narratorFlipped = false;
        render();
      });
  }

  function computerMove() {
    if (hasWinner(state.board)) return;

    // Simple opponent: take the first available cell.
    const index = state.board.findIndex((cell) => !cell);
    if (index >= 0) state.board[index] = "O";
  }

  function hasWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return "";
  }

  function setMessage(game, message) {
    const id = game === "mines"
      ? "#stage11-mines-status"
      : "#stage11-tic-status";

    const element = root?.querySelector(id);
    if (element) element.textContent = message;
  }

  function finish() {
    if (state.completed.size !== 3) return;

    state.solved = true;
    Progress.completeStage(11);

    Narrator.speakCustom({
      zh: "三场都结束了？真可惜，我还准备了很多条不成文的规则。",
      en: "All three games? What a shame. I had plenty more unwritten rules."
    }, "impressed");

    Router.navigate(Router.ROUTES.stage(12));
  }

  function onLanguageChange() {
    render();
  }

  function mount(container) {
    root = container;

    state.currentGame = "minesweeper";
    state.completed = new Set();
    state.revealed = new Set();
    state.flags = new Set();
    state.riverSide = "left";
    state.riverMoves = 0;
    state.riverChanged = false;
    state.riverHistory = [];
    state.board = Array(9).fill("");
    state.playerTurn = true;
    state.ticAttempts = 0;
    state.firstTicFinished = false;
    state.narratorFlipped = false;
    state.solved = false;
    state.message = "";

    render();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(11);

    Narrator.speakCustom({
      zh: COPY["zh-CN"].narratorLine,
      en: COPY.en.narratorLine
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

  return { mount, unmount };
})();

export default Stage11;
