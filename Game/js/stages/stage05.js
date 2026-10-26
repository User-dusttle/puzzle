
// =========================================================
// Meta Puzzle — Stage 05
// File: js/stages/stage05.js
// =========================================================

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage05 = (() => {
  let root = null;
  let languageListener = null;
  let keyHandler = null;

  const MAX_INT32 = 2147483647;
  const state = {
    view: "main",
    solved: false,
    gameOver: false,
    grid: [],
    score: 0,
    offset: null,
    moves: 0
  };

  // Demonstration ciphertext and key for the later decryption gate.
  // The full chain will be connected once the shared puzzle-state
  // and Stage 3 search validation are integrated.
  const CIPHERTEXT = "WKH_QXLW_HAV";

  const COPY = {
    "zh-CN": {
      eyebrow: "系统工具 / 加密服务",
      title: "文本解码工具",
      description:
        "输入密文、密钥和偏移量。参数不完整时，系统无法执行解码。",
      cipherLabel: "密文",
      keyLabel: "密钥",
      offsetLabel: "偏移量",
      keyPlaceholder: "输入密钥",
      offsetPlaceholder: "输入数字",
      decode: "尝试解码",
      empty: "请先填写密钥和偏移量。",
      wrong: "解码失败。请确认参数与密文是否匹配。",
      success: "参数验证通过。",
      playGame: "打开测试游戏",
      back: "返回解码工具",
      gameTitle: "2048 / 实验版本",
      gameDescription:
        "使用方向键或下方按钮移动方块。合并相同数值，尽可能获得更高分。",
      score: "分数",
      reset: "重新开始",
      up: "上",
      down: "下",
      left: "左",
      right: "右",
      ruleNotice:
        "实验规则更新：达到 2048 后，合并规则将发生变化。",
      overflowNotice:
        "错误：数值类型不匹配。变量似乎无法继续保存这个数。",
      offsetNotice: "检测到异常数值。偏移量：",
      continue: "继续下一关",
      narratorMain:
        "加密？听起来很专业。你只需要几个参数。至于它们在哪儿嘛……自己找。",
      narratorGame:
        "我给你准备了一个经典游戏。别担心，我绝对没有改过规则。",
      gameHint:
        "小提示：程序处理数字时，也会有自己的极限。"
    },
    en: {
      eyebrow: "SYSTEM TOOLS / CRYPTO SERVICE",
      title: "Text decoding utility",
      description:
        "Enter the ciphertext, key, and offset. Decoding cannot run with incomplete parameters.",
      cipherLabel: "Ciphertext",
      keyLabel: "Key",
      offsetLabel: "Offset",
      keyPlaceholder: "Enter key",
      offsetPlaceholder: "Enter a number",
      decode: "Try decoding",
      empty: "Please enter both a key and an offset.",
      wrong: "Decoding failed. Check whether the parameters match the ciphertext.",
      success: "Parameters accepted.",
      playGame: "Open test game",
      back: "Back to decoder",
      gameTitle: "2048 / Experimental build",
      gameDescription:
        "Use the arrow keys or buttons below to move tiles. Merge equal values to increase your score.",
      score: "Score",
      reset: "Restart",
      up: "Up",
      down: "Down",
      left: "Left",
      right: "Right",
      ruleNotice:
        "Experimental rules updated: merging behavior changes after reaching 2048.",
      overflowNotice:
        "Error: numeric type mismatch. The variable cannot store this number.",
      offsetNotice: "Abnormal value detected. Offset: ",
      continue: "Continue to Stage 6",
      narratorMain:
        "Cryptography? Sounds professional. You just need a few parameters. Where are they? Figure it out.",
      narratorGame:
        "I prepared a classic game. Don't worry, I definitely didn't change the rules.",
      gameHint:
        "Hint: programs have limits when handling numbers, too."
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

  function renderMain() {
    state.view = "main";

    root.innerHTML = `
      <section class="page page--reading stage05">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("description"))}</p>
        </header>

        <section class="panel content-stack">
          <label for="stage05-cipher">
            ${escapeHTML(t("cipherLabel"))}
          </label>
          <textarea
            id="stage05-cipher"
            rows="2"
            readonly
          >${escapeHTML(CIPHERTEXT)}</textarea>

          <label for="stage05-key">
            ${escapeHTML(t("keyLabel"))}
          </label>
          <input
            id="stage05-key"
            type="text"
            placeholder="${escapeHTML(t("keyPlaceholder"))}"
            autocomplete="off"
          >

          <label for="stage05-offset">
            ${escapeHTML(t("offsetLabel"))}
          </label>
          <input
            id="stage05-offset"
            type="number"
            placeholder="${escapeHTML(t("offsetPlaceholder"))}"
          >

          <button id="stage05-decode" class="primary-button" type="button">
            ${escapeHTML(t("decode"))}
          </button>

          <p id="stage05-result" aria-live="polite"></p>
        </section>

        <section class="page-section content-stack">
          <p>${escapeHTML(t("gameHint"))}</p>
          <button id="stage05-open-game" class="secondary-button" type="button">
            ${escapeHTML(t("playGame"))}
          </button>
        </section>

        <section id="stage05-success" class="panel content-stack" hidden>
          <h2>${escapeHTML(t("success"))}</h2>
          <button id="stage05-continue" class="primary-button" type="button">
            ${escapeHTML(t("continue"))}
          </button>
        </section>
      </section>
    `;

    root.querySelector("#stage05-decode")?.addEventListener("click", tryDecode);
    root.querySelector("#stage05-open-game")?.addEventListener("click", () => {
      Narrator.speakCustom({
        zh: t("narratorGame"),
        en: t("narratorGame")
      }, "smug");

      renderGame();
    });

    root.querySelector("#stage05-continue")?.addEventListener("click", () => {
      if (!state.solved) return;

      Progress.completeStage(5);
      Router.navigate(Router.ROUTES.stage(6));
    });
  }

  function tryDecode() {
    const key = root.querySelector("#stage05-key")?.value.trim() ?? "";
    const offsetValue = root.querySelector("#stage05-offset")?.value.trim() ?? "";
    const result = root.querySelector("#stage05-result");

    if (!key || offsetValue === "") {
      result.textContent = t("empty");
      Narrator.reactTo("wrong-answer", { stage: 5 });
      return;
    }

    const offset = Number(offsetValue);

    // This placeholder gate will be replaced by the complete cipher
    // chain when the Stage 3 key retrieval is connected.
    if (
      Number.isInteger(offset) &&
      offset === state.offset &&
      key.length > 0 &&
      state.gameOver
    ) {
      state.solved = true;
      result.textContent = t("success");

      const success = root.querySelector("#stage05-success");
      if (success) success.hidden = false;

      Narrator.reactTo("correct-answer", { stage: 5 });
      return;
    }

    result.textContent = t("wrong");
    Narrator.reactTo("wrong-answer", { stage: 5 });
  }

  function newGrid() {
    const grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    addRandomTile(grid);
    addRandomTile(grid);
    return grid;
  }

  function addRandomTile(grid) {
    const empty = [];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) empty.push([r, c]);
      }
    }

    if (!empty.length) return;

    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function renderGame() {
    state.view = "game";

    if (!state.grid.length) {
      state.grid = newGrid();
    }

    root.innerHTML = `
      <section class="page page--reading stage05 stage05-game">
        <header class="page-header">
          <p class="page-eyebrow">TEST ENVIRONMENT</p>
          <h1 class="page-title">${escapeHTML(t("gameTitle"))}</h1>
          <p class="page-description">${escapeHTML(t("gameDescription"))}</p>
        </header>

        <section class="panel content-stack">
          <p>
            ${escapeHTML(t("score"))}:
            <strong id="stage05-score">${state.score}</strong>
          </p>

          <div id="stage05-board" class="game2048-board" role="grid">
            ${renderTiles()}
          </div>

          <div class="stage05-controls">
            <button data-move="up" class="secondary-button" type="button">
              ${escapeHTML(t("up"))}
            </button>
            <button data-move="left" class="secondary-button" type="button">
              ${escapeHTML(t("left"))}
            </button>
            <button data-move="down" class="secondary-button" type="button">
              ${escapeHTML(t("down"))}
            </button>
            <button data-move="right" class="secondary-button" type="button">
              ${escapeHTML(t("right"))}
            </button>
          </div>

          <p id="stage05-game-notice" aria-live="polite"></p>

          <button id="stage05-reset" class="secondary-button" type="button">
            ${escapeHTML(t("reset"))}
          </button>

          <button id="stage05-back" class="secondary-button" type="button">
            ${escapeHTML(t("back"))}
          </button>
        </section>
      </section>
    `;

    root.querySelectorAll("[data-move]").forEach((button) => {
      button.addEventListener("click", () => move(button.dataset.move));
    });

    root.querySelector("#stage05-reset")?.addEventListener("click", () => {
      state.grid = newGrid();
      state.score = 0;
      state.moves = 0;
      state.gameOver = false;
      state.offset = null;
      renderGame();
    });

    root.querySelector("#stage05-back")?.addEventListener("click", renderMain);
  }

  function renderTiles() {
    return state.grid.flat().map((value) => `
      <div class="game2048-tile" role="gridcell" aria-label="${value || "empty"}">
        ${value || ""}
      </div>
    `).join("");
  }

  function move(direction) {
    if (state.gameOver) return;

    const before = JSON.stringify(state.grid);
    const grid = state.grid.map((row) => [...row]);

    for (let i = 0; i < 4; i++) {
      let line;

      if (direction === "left" || direction === "right") {
        line = [...grid[i]];
      } else {
        line = grid.map((row) => row[i]);
      }

      if (direction === "right" || direction === "down") {
        line.reverse();
      }

      line = line.filter((value) => value !== 0);

      const merged = [];

      for (let j = 0; j < line.length; j++) {
        if (line[j] === line[j + 1]) {
          const current = line[j];

          // After reaching 2048, the game uses multiplication instead
          // of addition. Equal values are no longer required.
          const nextValue = hasReached2048()
            ? current * (line[j + 1] || 1)
            : current * 2;

          merged.push(nextValue);
          state.score += nextValue;
          j++;
        } else {
          merged.push(line[j]);
        }
      }

      while (merged.length < 4) merged.push(0);

      if (direction === "right" || direction === "down") {
        merged.reverse();
      }

      if (direction === "left" || direction === "right") {
        grid[i] = merged;
      } else {
        for (let r = 0; r < 4; r++) {
          grid[r][i] = merged[r];
        }
      }
    }

    state.grid = grid;

    if (JSON.stringify(state.grid) !== before) {
      addRandomTile(state.grid);
      state.moves += 1;
    }

    const largest = Math.max(...state.grid.flat());

    if (largest >= 2048 && !state.ruleChanged) {
      state.ruleChanged = true;

      Narrator.speakCustom({
        zh: t("ruleNotice"),
        en: t("ruleNotice")
      }, "surprised");

      const notice = root.querySelector("#stage05-game-notice");
      if (notice) notice.textContent = t("ruleNotice");
    }

    if (largest > MAX_INT32) {
      state.gameOver = true;

      // The numeric offset is intentionally plain and easy to transcribe.
      // Later integration will connect this value to the cipher validator.
      state.offset = String(largest).split("").reduce(
        (sum, digit) => sum + Number(digit),
        0
      );

      Narrator.speakCustom({
        zh: t("overflowNotice"),
        en: t("overflowNotice")
      }, "alarmed");

      const notice = root.querySelector("#stage05-game-notice");
      if (notice) {
        notice.textContent = t("overflowNotice") + " " + t("offsetNotice") + state.offset;
      }
    }

    const board = root.querySelector("#stage05-board");
    const score = root.querySelector("#stage05-score");

    if (board) board.innerHTML = renderTiles();
    if (score) score.textContent = String(state.score);
  }

  function hasReached2048() {
    return Math.max(...state.grid.flat()) >= 2048;
  }

  function onKeyDown(event) {
    if (state.view !== "game") return;

    const map = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };

    const direction = map[event.key];
    if (!direction) return;

    event.preventDefault();
    move(direction);
  }

  function onLanguageChange() {
    if (!root) return;

    if (state.view === "game") {
      renderGame();
    } else {
      renderMain();
    }
  }

  function mount(container) {
    root = container;

    state.view = "main";
    state.solved = false;
    state.gameOver = false;
    state.offset = null;
    state.score = 0;
    state.moves = 0;
    state.grid = [];
    state.ruleChanged = false;

    renderMain();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    keyHandler = onKeyDown;
    window.addEventListener("keydown", keyHandler);

    Narrator.setStage(5);
    Narrator.speakCustom({
      zh: t("narratorMain"),
      en: t("narratorMain")
    }, "smug");

    return { unmount };
  }

  function unmount() {
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
      solved: state.solved,
      gameOver: state.gameOver,
      score: state.score,
      offset: state.offset,
      moves: state.moves
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage05;
