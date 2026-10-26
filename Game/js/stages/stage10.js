
/* ========================================================
 * Meta Puzzle — Stage 10
 * File: js/stages/stage10.js
 *
 * Puzzle chain:
 * Maze -> collect characters -> Console command
 * -> result string -> Stage 03 search -> Network offset
 *
 * This module implements the maze and console portion.
 * ======================================================== */

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage10 = (() => {
  let root = null;
  let languageListener = null;
  let keyListener = null;

  const GRID = [
    "#############",
    "#S....#.....#",
    "###.#.#.###.#",
    "#...#...#...#",
    "#.#####.#.###",
    "#.....#.#...#",
    "#.###.#.###.#",
    "#...#...#...#",
    "###.#####.#.#",
    "#...#.....#E#",
    "#############"
  ];

  // Hidden interaction points, indexed by row and column.
  // Coordinates are zero-based.
  const HIDDEN_POINTS = [
    { r: 1, c: 2, char: "C" },
    { r: 3, c: 7, char: "H" },
    { r: 5, c: 1, char: "E" },
    { r: 7, c: 9, char: "C" },
    { r: 9, c: 5, char: "K" }
  ];

  // The player should discover this command by collecting the letters.
  const EXPECTED_COMMAND = "CHECK";

  // The output is later intended to be searched in Stage 03.
  const CONSOLE_RESULT = "STAGE10_SIGNAL_7Q";

  const state = {
    player: { r: 1, c: 1 },
    collected: [],
    visited: new Set(["1,1"]),
    mazeSolved: false,
    commandExecuted: false,
    solved: false,
    attempts: 0
  };

  const COPY = {
    "zh-CN": {
      eyebrow: "系统深层 / 10",
      title: "没有地图的地图",
      description:
        "你已经被送到了一个不该存在的页面。这里没有导航，没有说明，甚至没有明确的出口。",
      rulesTitle: "操作说明",
      rules:
        "使用方向键或下方按钮移动。留意那些看起来与普通墙壁或地面没有区别的位置。",
      mazeTitle: "维护通道",
      collected: "已收集字符",
      collectedEmpty: "尚无字符",
      moves: "移动次数",
      resetMaze: "重置迷宫",
      commandTitle: "命令验证",
      commandDescription:
        "把收集到的字符拼成命令，然后打开浏览器开发者工具，在 Console 中输入命令。",
      commandLabel: "命令",
      commandPlaceholder: "输入你拼出的命令",
      commandButton: "检查命令",
      commandWrong: "命令不正确，或者你还没有找到全部字符。",
      commandCorrect:
        "命令已识别。现在请在 Console 中检查返回值。",
      resultTitle: "命令返回值",
      resultText:
        "命令返回了一段字符串。把它带回第三关的搜索框。",
      result: "STAGE10_SIGNAL_7Q",
      nextHint:
        "下一步：第三关搜索返回的结果后，打开 Network 面板，观察请求中出现的数字。",
      continue: "返回第三关",
      narrator:
        "迷宫而已。墙是墙，路是路。你不会连这个都需要提示吧？",
      narratorFound:
        "你收集到了字符？真令人惊讶。看来你至少会在墙上乱点。",
      hintTitle: "可靠提示",
      hint:
        "有些格子看起来是普通地面，但点击或触碰它们可能会产生不同反应。收集到的字符需要按发现顺序拼接。",
      left: "左",
      right: "右",
      up: "上",
      down: "下",
      blocked: "前面是墙。",
      found: "发现了一个隐藏字符。",
      exitLocked: "出口仍然锁着。你还没有收集到所有字符。",
      exitOpen: "迷宫已完成。继续检查页面之外的信息。",
      stageNote:
        "本版本的 Console 与 Network 部分仍为分阶段原型。"
    },
    en: {
      eyebrow: "DEEP SYSTEM / 10",
      title: "A Map Without a Map",
      description:
        "You have arrived at a page that should not exist. There is no navigation, no manual, and no obvious exit.",
      rulesTitle: "Instructions",
      rules:
        "Move with the arrow keys or the buttons below. Watch for locations that look no different from ordinary floor tiles.",
      mazeTitle: "Maintenance Corridor",
      collected: "Collected Characters",
      collectedEmpty: "No characters yet",
      moves: "Moves",
      resetMaze: "Reset Maze",
      commandTitle: "Command Verification",
      commandDescription:
        "Assemble the collected characters into a command, then open Developer Tools and enter it in the Console.",
      commandLabel: "Command",
      commandPlaceholder: "Enter the command you assembled",
      commandButton: "Check Command",
      commandWrong: "Incorrect command, or you have not found all characters.",
      commandCorrect:
        "Command recognized. Now inspect the return value in the Console.",
      resultTitle: "Command Return Value",
      resultText:
        "The command returned a string. Take it back to the Stage 3 search box.",
      result: "STAGE10_SIGNAL_7Q",
      nextHint:
        "Next: search the returned string in Stage 3, then inspect the number in the Network request.",
      continue: "Return to Stage 3",
      narrator:
        "It's just a maze. Walls are walls and paths are paths. Surely you don't need hints for this?",
      narratorFound:
        "You found characters? Astonishing. At least you know how to poke around.",
      hintTitle: "Reliable Hint",
      hint:
        "Some tiles look like ordinary floor but may react differently when clicked or touched. Assemble the characters in discovery order.",
      left: "Left",
      right: "Right",
      up: "Up",
      down: "Down",
      blocked: "A wall blocks your way.",
      found: "A hidden character was discovered.",
      exitLocked: "The exit remains locked. Not all characters have been found.",
      exitOpen: "The maze is complete. Now inspect what lies beyond the page.",
      stageNote:
        "The Console and Network portions are still staged prototypes."
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

  function isWall(r, c) {
    return !GRID[r] || GRID[r][c] === "#";
  }

  function getHiddenPoint(r, c) {
    return HIDDEN_POINTS.find((point) => point.r === r && point.c === c);
  }

  function render() {
    if (!root) return;

    const rows = GRID.map((line, r) => {
      return [...line].map((cell, c) => {
        const key = `${r},${c}`;
        const isPlayer = state.player.r === r && state.player.c === c;
        const hidden = getHiddenPoint(r, c);
        const found = hidden && state.collected.some(
          (item) => item.r === r && item.c === c
        );

        let className = "stage10-cell";

        if (cell === "#") className += " stage10-cell--wall";
        else className += " stage10-cell--floor";

        if (isPlayer) className += " stage10-cell--player";
        if (found) className += " stage10-cell--found";

        const label = isPlayer
          ? "P"
          : cell === "S"
            ? "S"
            : cell === "E"
              ? "E"
              : found
                ? hidden.char
                : "";

        return `
          <button
            type="button"
            class="${className}"
            data-row="${r}"
            data-col="${c}"
            aria-label="${r},${c}"
            ${cell === "#" ? "disabled" : ""}
          >${label}</button>
        `;
      }).join("");
    }).map((row) => `<div class="stage10-row">${row}</div>`).join("");

    root.innerHTML = `
      <section class="page page--reading stage10">
        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("description"))}</p>
        </header>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("rulesTitle"))}</h2>
          <p>${escapeHTML(t("rules"))}</p>
        </section>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("mazeTitle"))}</h2>

          <div class="stage10-maze" role="group" aria-label="Maze">
            ${rows}
          </div>

          <div class="stage10-controls" aria-label="Movement">
            <button data-move="up" type="button">${escapeHTML(t("up"))}</button>
            <div>
              <button data-move="left" type="button">${escapeHTML(t("left"))}</button>
              <button data-move="down" type="button">${escapeHTML(t("down"))}</button>
              <button data-move="right" type="button">${escapeHTML(t("right"))}</button>
            </div>
          </div>

          <p>
            ${escapeHTML(t("collected"))}:
            <strong id="stage10-collected">
              ${escapeHTML(state.collected.map((item) => item.char).join("") || t("collectedEmpty"))}
            </strong>
          </p>

          <p>
            ${escapeHTML(t("moves"))}:
            <strong>${state.attempts}</strong>
          </p>

          <p id="stage10-status" aria-live="polite"></p>

          <button id="stage10-reset-maze" class="secondary-button" type="button">
            ${escapeHTML(t("resetMaze"))}
          </button>
        </section>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("commandTitle"))}</h2>
          <p>${escapeHTML(t("commandDescription"))}</p>

          <form id="stage10-command-form" class="content-stack">
            <label for="stage10-command">${escapeHTML(t("commandLabel"))}</label>
            <input
              id="stage10-command"
              type="text"
              placeholder="${escapeHTML(t("commandPlaceholder"))}"
              autocomplete="off"
              spellcheck="false"
            >
            <button class="primary-button" type="submit">
              ${escapeHTML(t("commandButton"))}
            </button>
          </form>

          <p id="stage10-command-status" aria-live="polite"></p>
          <p class="muted">${escapeHTML(t("stageNote"))}</p>

          <div id="stage10-result" class="panel content-stack" ${state.commandExecuted ? "" : "hidden"}>
            <h3>${escapeHTML(t("resultTitle"))}</h3>
            <p>${escapeHTML(t("resultText"))}</p>
            <code>${escapeHTML(t("result"))}</code>
            <p>${escapeHTML(t("nextHint"))}</p>

            <button id="stage10-continue" class="primary-button" type="button">
              ${escapeHTML(t("continue"))}
            </button>
          </div>
        </section>

        <section class="page-section">
          <details>
            <summary>${escapeHTML(t("hintTitle"))}</summary>
            <p>${escapeHTML(t("hint"))}</p>
          </details>
        </section>
      </section>
    `;

    root.querySelectorAll("[data-move]").forEach((button) => {
      button.addEventListener("click", () => {
        move(button.dataset.move);
      });
    });

    root.querySelectorAll(".stage10-cell--floor").forEach((button) => {
      button.addEventListener("click", () => {
        const r = Number(button.dataset.row);
        const c = Number(button.dataset.col);

        // Clicking an already visited tile is harmless.
        // Hidden locations are discovered through movement or direct clicks.
        const hidden = getHiddenPoint(r, c);
        if (hidden) collectAt(r, c);
      });
    });

    root.querySelector("#stage10-reset-maze")
      ?.addEventListener("click", resetMaze);

    root.querySelector("#stage10-command-form")
      ?.addEventListener("submit", checkCommand);

    root.querySelector("#stage10-continue")
      ?.addEventListener("click", returnToStage03);
  }

  function move(direction) {
    if (state.solved) return;

    const delta = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1]
    }[direction];

    if (!delta) return;

    const nextR = state.player.r + delta[0];
    const nextC = state.player.c + delta[1];

    if (isWall(nextR, nextC)) {
      setStatus(t("blocked"));
      return;
    }

    state.player = { r: nextR, c: nextC };
    state.attempts += 1;

    state.visited.add(`${nextR},${nextC}`);

    collectAt(nextR, nextC);

    const cell = GRID[nextR][nextC];

    if (cell === "E" && state.collected.length < HIDDEN_POINTS.length) {
      setStatus(t("exitLocked"));
    } else if (cell === "E") {
      state.mazeSolved = true;
      setStatus(t("exitOpen"));
    }

    render();
  }

  function collectAt(r, c) {
    const hidden = getHiddenPoint(r, c);
    if (!hidden) return;

    const alreadyFound = state.collected.some(
      (item) => item.r === r && item.c === c
    );

    if (alreadyFound) return;

    state.collected.push({ r, c, char: hidden.char });

    setStatus(t("found"));

    if (state.collected.length === HIDDEN_POINTS.length) {
      Narrator.speakCustom({
        zh: COPY["zh-CN"].narratorFound,
        en: COPY.en.narratorFound
      }, "impressed");
    }
  }

  function setStatus(message) {
    const status = root?.querySelector("#stage10-status");
    if (status) status.textContent = message;
  }

  function checkCommand(event) {
    event.preventDefault();

    const input = root.querySelector("#stage10-command");
    const status = root.querySelector("#stage10-command-status");

    const command = String(input?.value ?? "").trim().toUpperCase();
    const collected = state.collected.map((item) => item.char).join("");

    if (
      collected !== EXPECTED_COMMAND ||
      command !== EXPECTED_COMMAND
    ) {
      if (status) status.textContent = t("commandWrong");
      Narrator.reactTo("failed-answer", { stage: 10 });
      return;
    }

    state.commandExecuted = true;

    if (status) status.textContent = t("commandCorrect");

    // Prototype: make a predictable result available in the page.
    // In the integrated puzzle, the player will discover the actual
    // command in DevTools and execute it in Console.
    window.__META_STAGE10_RESULT__ = CONSOLE_RESULT;

    const result = root.querySelector("#stage10-result");
    if (result) result.hidden = false;

    Narrator.speakCustom({
      zh: "不错。现在别急着走，检查一下浏览器到底记录了什么。",
      en: "Not bad. Don't leave yet—inspect what the browser actually recorded."
    }, "impressed");
  }

  function returnToStage03() {
    if (!state.commandExecuted) return;

    Progress.completeStage(10);

    const target = new URL(
      Router.toUrl("/stage/03/"),
      window.location.origin
    );

    target.searchParams.set("search", CONSOLE_RESULT);

    Router.navigate(target.pathname + target.search);
  }

  function resetMaze() {
    state.player = { r: 1, c: 1 };
    state.collected = [];
    state.visited = new Set(["1,1"]);
    state.mazeSolved = false;
    state.commandExecuted = false;
    state.solved = false;
    state.attempts = 0;

    render();
  }

  function onKeyDown(event) {
    if (!root || !root.isConnected) return;

    const active = document.activeElement;
    if (
      active &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)
    ) {
      return;
    }

    const directions = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };

    const direction = directions[event.key];
    if (!direction) return;

    event.preventDefault();
    move(direction);
  }

  function onLanguageChange() {
    if (!root) return;

    const snapshot = {
      player: { ...state.player },
      collected: [...state.collected],
      visited: new Set(state.visited),
      mazeSolved: state.mazeSolved,
      commandExecuted: state.commandExecuted,
      solved: state.solved,
      attempts: state.attempts
    };

    render();

    Object.assign(state, snapshot);
    render();
  }

  function mount(container) {
    root = container;

    state.player = { r: 1, c: 1 };
    state.collected = [];
    state.visited = new Set(["1,1"]);
    state.mazeSolved = false;
    state.commandExecuted = false;
    state.solved = false;
    state.attempts = 0;

    render();

    keyListener = onKeyDown;
    window.addEventListener("keydown", keyListener);

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(10);

    Narrator.speakCustom({
      zh: COPY["zh-CN"].narrator,
      en: COPY.en.narrator
    }, "smug");

    return { unmount };
  }

  function unmount() {
    if (keyListener) {
      window.removeEventListener("keydown", keyListener);
      keyListener = null;
    }

    if (languageListener) {
      window.removeEventListener("languagechange", languageListener);
      languageListener = null;
    }

    root = null;
  }

  function getState() {
    return {
      player: { ...state.player },
      collected: [...state.collected],
      mazeSolved: state.mazeSolved,
      commandExecuted: state.commandExecuted,
      solved: state.solved,
      attempts: state.attempts
    };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage10;
