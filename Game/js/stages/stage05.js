
const DEBUG = new URLSearchParams(window.location.search)
  .get("debug") === "1";

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const SIZE = 4;
const TARGET = "STAGE06_OPEN";
const CIPHER = "RGGTR06_LGPM";
const SECRET_KEY = "m3ta_key";
const OFFSET = 13;
const MAX_INT32 = 2147483647;

let root = null;
let board = [];
let tileId = 0;
let gameOver = false;
let ruleChanged = false;
let rulePaused = false;
let overflowFound = false;
let overflowLocked = false;
let decoderOpen = false;
let decoded = "";
let mounted = false;

const translations = {
  "zh-CN": {
    title: "实验室",
    gameTitle: "2048",
    score: "分数",
    restart: "重新开始",
    decoderTitle: "解码器",
    cipherLabel: "密文",
    keyLabel: "秘钥",
    decode: "解密",
    decodePlaceholder: "输入密文",
    keyPlaceholder: "输入秘钥",
    wrong: "解密失败。检查一下输入。",
    correct: "STAGE06_OPEN",
    continue: "继续",
    gameOver: "没有可用的移动了。",
    ruleTitle: "规则更新",
    ruleText:
      "规则改了：相同数值不再是合并条件，现在两个方块相撞就会相乘。别问为什么，我也不想知道。",
    ruleTextEn:
      "Rules changed: matching values are no longer required. When two tiles collide, they multiply. Don't ask why. I don't want to know either.",
    overflowHint:
      "等等……这个数值已经超过了变量能表示的范围？这不应该啊。",
    secretHint:
      "你找到了一个隐藏值。记下来，别让我再说第二遍。",
    secretFound: "已获得隐藏秘钥。",
    solvedHint:
      "这是什么？你或许可以在某串东西后面输入 ?key=解密后的串 试试看？",
    solvedHintEn:
      "What's this? Maybe try appending ?key=the-decrypted-string to a certain URL.",
    urlHelp:
      "解密成功并不代表通关。试着把结果作为 key 参数附加到第五关的 URL。",
    close: "关闭",
    overflowTile: "黑色方块",
    instructions:
      "使用方向键或 WASD 移动方块。触屏设备可以滑动棋盘。",
  },
  en: {
    title: "Laboratory",
    gameTitle: "2048",
    score: "Score",
    restart: "Restart",
    decoderTitle: "Decoder",
    cipherLabel: "Ciphertext",
    keyLabel: "Key",
    decode: "Decrypt",
    decodePlaceholder: "Enter ciphertext",
    keyPlaceholder: "Enter key",
    wrong: "Decryption failed. Check your inputs.",
    correct: "STAGE06_OPEN",
    continue: "Continue",
    gameOver: "No moves remain.",
    ruleTitle: "Rule update",
    ruleText:
      "Rules changed: matching values are no longer required. When two tiles collide, they multiply. Don't ask why. I don't want to know either.",
    ruleTextEn:
      "Rules changed: matching values are no longer required. When two tiles collide, they multiply. Don't ask why. I don't want to know either.",
    overflowHint:
      "Wait... that value is beyond the range this variable can represent? That shouldn't happen.",
    secretHint:
      "You found a hidden value. Write it down. Don't make me say it twice.",
    secretFound: "Hidden key acquired.",
    solvedHint:
      "What's this? Maybe try appending ?key=the-decrypted-string to a certain URL.",
    solvedHintEn:
      "What's this? Maybe try appending ?key=the-decrypted-string to a certain URL.",
    urlHelp:
      "Successful decryption doesn't mean you've finished. Try adding the result as a key parameter to the Stage 5 URL.",
    close: "Close",
    overflowTile: "Black tile",
    instructions:
      "Use the arrow keys or WASD to move. On touch devices, swipe the board.",
  },
};

function lang() {
  return I18n.getLanguage?.() === "en" ? "en" : "zh-CN";
}

function t(key) {
  return translations[lang()][key];
}

function speak(zh, en, mood = "normal") {
  Narrator.speakCustom({ "zh-CN": zh, en }, mood);
}

function newTile(value, row, col, special = false) {
  return {
    id: ++tileId,
    value,
    row,
    col,
    special,
    revealed: false,
    merged: false,
  };
}

function resetBoard() {
  board = [];
  tileId = 0;
  gameOver = false;
  ruleChanged = false;
  rulePaused = false;
  overflowFound = false;
  overflowLocked = false;
  decoderOpen = false;
  decoded = "";

  spawnTile();
  spawnTile();

  if (DEBUG) {
    board = [
      newTile(1024, 0, 0),
      newTile(1024, 0, 1),
    ];
  }

  render();
}

function emptyCells() {
  const occupied = new Set(
    board.map(tile => tile.row * SIZE + tile.col)
  );

  const result = [];

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!occupied.has(row * SIZE + col)) {
        result.push({ row, col });
      }
    }
  }

  return result;
}

function spawnTile() {
  const cells = emptyCells();
  if (!cells.length || overflowLocked) return null;

  const cell = cells[Math.floor(Math.random() * cells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const tile = newTile(value, cell.row, cell.col);

  board.push(tile);
  return tile;
}

function colorFor(value, special) {
  if (special) return "#050907";

  const colors = {
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
  };

  if (value > 2048) return "#3c3a32";
  return colors[value] || "#3c3a32";
}

function textColor(value, special) {
  if (special || value >= 8) return "#ffffff";
  return "#776e65";
}

function positionTile(element, tile) {
  element.style.transform =
    `translate(${tile.col * 100}%, ${tile.row * 100}%)`;
}

function makeTileElement(tile) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "s05-tile";
  element.dataset.id = String(tile.id);
  element.setAttribute("aria-label", String(tile.value));
  element.style.position = "absolute";
  element.style.width = "25%";
  element.style.height = "25%";
  element.style.left = "0";
  element.style.top = "0";
  element.style.padding = "5px";
  element.style.boxSizing = "border-box";
  element.style.transition =
    "transform 125ms ease-in-out, background-color 120ms ease, opacity 100ms ease";
  element.style.willChange = "transform";
  element.style.border = "0";
  element.style.background = "transparent";
  element.style.cursor = "pointer";

  const face = document.createElement("span");
  face.className = "s05-tile-face";
  face.style.display = "flex";
  face.style.width = "100%";
  face.style.height = "100%";
  face.style.alignItems = "center";
  face.style.justifyContent = "center";
  face.style.borderRadius = "4px";
  face.style.fontWeight = "800";
  face.style.fontSize = "clamp(15px, 4vw, 28px)";
  face.style.boxSizing = "border-box";
  face.style.transition = "transform 110ms ease-out";
  element.appendChild(face);

  element.addEventListener("click", () => {
    const current = board.find(item => item.id === tile.id);

    if (!current || !current.special || current.revealed) return;

    current.revealed = true;
    renderTile(current);

    const faceElement = element.querySelector(".s05-tile-face");
    faceElement.textContent = SECRET_KEY;
    faceElement.style.fontSize = "clamp(9px, 2.3vw, 15px)";
    faceElement.style.color = "#8bffb0";
    faceElement.style.letterSpacing = "0.03em";

    element.setAttribute("aria-label", "Hidden key");
    element.dataset.revealed = "true";
    overflowFound = true;

    faceElement.animate(
      [
        {
          opacity: 0,
          filter: "brightness(3) hue-rotate(90deg)",
          transform: "scale(0.85)",
        },
        {
          opacity: 1,
          filter: "brightness(0.4)",
          transform: "scale(1.08)",
        },
        {
          opacity: 1,
          filter: "brightness(1)",
          transform: "scale(1)",
        },
      ],
      {
        duration: 450,
        easing: "steps(4, end)",
      }
    );
  });

  return element;
}

function renderTile(tile) {
  const element = root?.querySelector(
    `.s05-tile[data-id="${tile.id}"]`
  );

  if (!element) return;

  const face = element.querySelector(".s05-tile-face");

  if (tile.special && tile.revealed) {
    face.textContent = SECRET_KEY;
    face.style.fontSize = "clamp(9px, 2.3vw, 15px)";
    face.style.color = "#8bffb0";
    face.style.letterSpacing = "0.03em";
  } else {
    face.textContent = tile.special ? "?" : String(tile.value);
    face.style.fontSize = tile.value >= 1024
      ? "clamp(12px, 3vw, 23px)"
      : "clamp(15px, 4vw, 28px)";
    face.style.color = textColor(tile.value, tile.special);
    face.style.letterSpacing = "normal";
  }

  face.style.backgroundColor = colorFor(tile.value, tile.special);
  face.style.color = tile.special && !tile.revealed
    ? "#8bffb0"
    : textColor(tile.value, tile.special);

  if (tile.special) {
    element.dataset.overflow = "true";
    element.dataset.revealed = String(tile.revealed);
    element.setAttribute(
      "aria-label",
      tile.revealed ? "Hidden key" : t("overflowTile")
    );
  } else {
    delete element.dataset.overflow;
    delete element.dataset.revealed;
  }

  positionTile(element, tile);

  if (tile.merged) {
    face.animate(
      [
        { transform: "scale(0.94)" },
        { transform: "scale(1.07)" },
        { transform: "scale(1)" },
      ],
      {
        duration: 150,
        easing: "ease-out",
      }
    );

    tile.merged = false;
  }
}

function render() {
  if (!root) return;

  root.innerHTML = `
    <section class="stage stage05">
      <style>
        .stage05 {
          width: 100%;
          max-width: var(--content-width, 1080px);
          margin-inline: auto;
          color: var(--color-text, #242424);
          font-family: var(--font-sans, sans-serif);
        }

        .stage05 .s05-panel {
          min-width: 0;
          padding: clamp(16px, 3vw, 30px);
          border: 1px solid var(--color-border, #deded8);
          border-radius: var(--radius-lg, 12px);
          background: var(--color-surface, #fff);
          box-shadow: var(--shadow-panel, 0 2px 10px rgb(0 0 0 / 4%));
        }

        .stage05 h1 {
          margin: 0 0 26px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--color-border, #deded8);
          font-size: clamp(1.6rem, 3vw, 2rem);
          font-weight: 600;
          letter-spacing: -0.025em;
        }

        .stage05 h2 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: -0.015em;
        }

        .s05-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          align-items: start;
          gap: clamp(20px, 3vw, 32px);
          max-width: 100%;
          margin: 0;
        }

        .s05-panel,
        .s05-layout > *,
        .s05-decoder {
          min-width: 0;
        }

        .s05-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }

        .stage05 .s05-toolbar button {
          min-height: 36px;
          padding: 7px 12px;
          border: 1px solid var(--color-border, #deded8);
          border-radius: var(--radius-sm, 4px);
          background: var(--color-surface, #fff);
          color: var(--color-text, #242424);
          font-size: var(--font-size-sm, 0.875rem);
          font-weight: 500;
          transition:
            background-color var(--transition-fast, 140ms ease),
            border-color var(--transition-fast, 140ms ease);
        }

        .stage05 .s05-toolbar button:hover {
          border-color: var(--color-accent, #315e8a);
          background: var(--color-surface-muted, #f0f0ed);
        }

        .stage05 .s05-score {
          padding: 5px 10px;
          border: 1px solid var(--color-border, #deded8);
          border-radius: var(--radius-sm, 4px);
          background: var(--color-surface-muted, #f0f0ed);
          color: var(--color-text-secondary, #777771);
          font-size: var(--font-size-sm, 0.875rem);
          font-variant-numeric: tabular-nums;
        }

        .stage05 .s05-score strong {
          margin-left: 4px;
          color: var(--color-text, #242424);
          font-family: var(--font-mono, monospace);
        }

        .s05-board-wrap {
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
        }

        .s05-board {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          border: 1px solid rgb(0 0 0 / 7%);
          border-radius: 7px;
          background: #bbada0;
          box-shadow: none;
          touch-action: none;
          user-select: none;
        }

        .s05-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-rows: repeat(4, minmax(0, 1fr));
          pointer-events: none;
        }

        .s05-cell {
          min-width: 0;
          min-height: 0;
          padding: 5px;
        }

        .s05-cell::before {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          background: rgb(238 228 218 / 36%);
          content: "";
        }

        .s05-tile-layer {
          position: absolute;
          inset: 0;
        }

        .s05-tile {
          outline-offset: -3px;
        }

        .s05-tile:focus-visible {
          z-index: 20;
          outline: 2px solid var(--color-accent, #315e8a);
        }

        .s05-tile-face {
          overflow: hidden;
          overflow-wrap: anywhere;
          border-radius: 4px;
          box-shadow: none;
        }

        .stage05 #s05-game-content > p {
          margin: 0 0 14px;
          color: var(--color-text-secondary, #777771);
          font-size: var(--font-size-sm, 0.875rem);
        }

        .stage05 #s05-game-message {
          margin: 12px 0 0;
          color: var(--color-text-secondary, #777771);
          font-size: var(--font-size-sm, 0.875rem);
        }

        .s05-game-content[hidden] {
          display: none !important;
        }

        .s05-decoder {
          display: grid;
          align-content: start;
          gap: 10px;
          padding: 0 0 0 24px;
          border: 0;
          border-left: 1px solid var(--color-border, #deded8);
          border-radius: 0;
          background: transparent;
        }

        .s05-decoder h2 {
          margin-bottom: 8px;
          padding: 0 0 14px;
          border-bottom: 1px solid var(--color-border, #deded8);
        }

        .s05-decoder label {
          margin-top: 4px;
          color: var(--color-text-secondary, #777771);
          font-size: var(--font-size-sm, 0.875rem);
          font-weight: 500;
        }

        .s05-decoder input {
          width: 100%;
          min-width: 0;
          min-height: 40px;
          padding: 9px 11px;
          border: 1px solid var(--color-border, #deded8);
          border-radius: var(--radius-sm, 4px);
          background: var(--color-surface, #fff);
          color: var(--color-text, #242424);
          font-family: var(--font-mono, monospace);
          font-size: var(--font-size-sm, 0.875rem);
          transition:
            border-color var(--transition-fast, 140ms ease),
            box-shadow var(--transition-fast, 140ms ease);
        }

        .s05-decoder input:focus {
          outline: none;
          border-color: var(--color-accent, #315e8a);
          box-shadow: 0 0 0 2px rgb(49 94 138 / 12%);
        }

        .s05-decoder input::placeholder {
          color: #92928b;
          font-family: var(--font-sans, sans-serif);
        }

        .stage05 #s05-decode {
          justify-self: start;
          min-height: 38px;
          margin-top: 5px;
          padding: 8px 20px;
          border: 1px solid var(--color-accent, #315e8a);
          border-radius: var(--radius-sm, 4px);
          background: var(--color-accent, #315e8a);
          color: #fff;
          font-size: var(--font-size-sm, 0.875rem);
          font-weight: 500;
          transition: background-color var(--transition-fast, 140ms ease);
        }

        .stage05 #s05-decode:hover {
          background: var(--color-accent-hover, #24486c);
        }

        .stage05 #s05-decode-message {
          margin: 2px 0 0;
          color: var(--color-danger, #b83b3b);
          font-size: var(--font-size-sm, 0.875rem);
          overflow-wrap: anywhere;
        }

        .s05-output {
          min-height: 0;
          margin: 0;
          padding: 10px 12px;
          border: 1px solid var(--color-border, #deded8);
          border-radius: var(--radius-sm, 4px);
          background: var(--color-surface-muted, #f0f0ed);
          color: var(--color-text, #242424);
          font-family: var(--font-mono, monospace);
          font-size: var(--font-size-sm, 0.875rem);
          overflow-wrap: anywhere;
        }

        .s05-output:empty {
          display: none;
        }

        .stage05 #s05-url-hint {
          margin: 4px 0 0;
          color: var(--color-text-secondary, #777771);
          font-size: var(--font-size-sm, 0.875rem);
          overflow-wrap: anywhere;
        }

        .s05-hidden {
          display: none !important;
        }

        .s05-notice {
          padding: 12px;
          border: 1px solid var(--color-border, #deded8);
          border-radius: var(--radius-sm, 4px);
        }

        .s05-tile[data-overflow="true"] {
          z-index: 10;
          animation: s05-glitch 180ms steps(2, end) infinite;
        }

        .s05-tile[data-overflow="true"] .s05-tile-face {
          position: relative;
          overflow: hidden;
          border: 1px solid #39ff88;
          background:
            repeating-linear-gradient(
              0deg,
              rgb(0 255 100 / 12%) 0,
              rgb(0 255 100 / 12%) 1px,
              transparent 1px,
              transparent 4px
            ),
            #050907 !important;
          color: #8bffb0 !important;
          box-shadow:
            0 0 8px rgb(57 255 136 / 65%),
            inset 0 0 12px rgb(57 255 136 / 16%);
        }

        .s05-tile[data-overflow="true"] .s05-tile-face::after {
          position: absolute;
          inset: -100% 0;
          background: linear-gradient(
            transparent 40%,
            rgb(57 255 136 / 45%) 50%,
            transparent 60%
          );
          content: "";
          pointer-events: none;
          animation: s05-scan 1.2s linear infinite;
        }

        .s05-tile[data-overflow="true"][data-revealed="true"]
          .s05-tile-face {
          border-color: #b4ffd0;
          box-shadow:
            0 0 12px rgb(57 255 136 / 75%),
            inset 0 0 18px rgb(57 255 136 / 25%);
        }

        @keyframes s05-glitch {
          0% { filter: brightness(1); }
          25% { filter: hue-rotate(25deg) brightness(1.25); }
          50% { filter: brightness(0.8); }
          75% { filter: hue-rotate(-20deg) brightness(1.15); }
          100% { filter: brightness(1); }
        }

        @keyframes s05-scan {
          from { transform: translateY(-50%); }
          to { transform: translateY(100%); }
        }

        @media (max-width: 680px) {
          .stage05 .s05-panel {
            padding: 16px;
          }

          .stage05 h1 {
            margin-bottom: 20px;
            padding-bottom: 14px;
          }

          .s05-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 28px;
          }

          .s05-decoder {
            padding: 22px 0 0;
            border-top: 1px solid var(--color-border, #deded8);
            border-left: 0;
          }

          .s05-decoder h2 {
            padding-bottom: 12px;
          }

          .s05-toolbar {
            justify-content: flex-start;
          }

          .s05-board-wrap {
            max-width: 460px;
          }

          .s05-cell {
            padding: 3px;
          }

          .s05-decoder input {
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .s05-tile[data-overflow="true"],
          .s05-tile[data-overflow="true"] .s05-tile-face::after {
            animation: none !important;
          }
        }
      </style>

      <div class="card s05-panel">
        <h1>${t("title")}</h1>

        <div class="s05-layout">
          <div>
            <div class="s05-toolbar">
              <button
                id="s05-toggle-game"
                class="btn btn-ghost"
                type="button"
                aria-expanded="false"
                aria-controls="s05-game-content"
              >${t("gameTitle")} ＋</button>

              <div class="s05-score">
                ${t("score")}:
                <strong id="s05-score">0</strong>
              </div>

              <button
                id="s05-restart"
                class="btn btn-ghost"
                type="button"
              >${t("restart")}</button>
            </div>

            <div id="s05-game-content" class="s05-game-content" hidden>
              <p>${t("instructions")}</p>

              <div class="s05-board-wrap">
                <div
                  id="s05-board"
                  class="s05-board"
                  role="application"
                  aria-label="2048"
                  tabindex="0"
                >
                  <div class="s05-grid" aria-hidden="true">
                    ${Array.from(
                      { length: 16 },
                      () => '<div class="s05-cell"></div>'
                    ).join("")}
                  </div>

                  <div
                    id="s05-tile-layer"
                    class="s05-tile-layer"
                  ></div>
                </div>
              </div>

              <p id="s05-game-message" aria-live="polite"></p>
            </div>
          </div>

          <div class="s05-decoder">
            <h2>${t("decoderTitle")}</h2>

            <label for="s05-cipher">${t("cipherLabel")}</label>
            <input
              id="s05-cipher"
              autocomplete="off"
              placeholder="${t("decodePlaceholder")}"
            />

            <label for="s05-key">${t("keyLabel")}</label>
            <input
              id="s05-key"
              autocomplete="off"
              placeholder="${t("keyPlaceholder")}"
            />

            <button id="s05-decode" type="button">${t("decode")}</button>

            <p id="s05-decode-message" aria-live="polite"></p>
            <p id="s05-decode-output" class="s05-output"></p>
            <p id="s05-url-hint" class="s05-hidden"></p>
          </div>
        </div>
      </div>
    </section>
  `;

  const toggleButton = root.querySelector("#s05-toggle-game");
  const gameContent = root.querySelector("#s05-game-content");

  toggleButton.addEventListener("click", () => {
    const willOpen = gameContent.hidden;

    gameContent.hidden = !willOpen;
    toggleButton.setAttribute("aria-expanded", String(willOpen));
    toggleButton.textContent =
      `${t("gameTitle")} ${willOpen ? "－" : "＋"}`;
  });

  const layer = root.querySelector("#s05-tile-layer");

  for (const tile of board) {
    const element = makeTileElement(tile);
    layer.appendChild(element);
    renderTile(tile);
  }

  root.querySelector("#s05-restart")
    .addEventListener("click", resetBoard);

  root.querySelector("#s05-decode")
    .addEventListener("click", decrypt);

  const boardElement = root.querySelector("#s05-board");
  boardElement.addEventListener("keydown", onKeydown);

  let touchStart = null;

  boardElement.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];

    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, { passive: true });

  boardElement.addEventListener("touchend", event => {
    if (!touchStart) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;

    touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

    move(
      Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up")
    );
  }, { passive: true });

  updateScore();
  checkUnlockFromUrl();
}

function onKeydown(event) {
  const keyMap = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    d: "right",
    w: "up",
    s: "down",
    A: "left",
    D: "right",
    W: "up",
    S: "down",
  };

  const direction = keyMap[event.key];
  if (!direction) return;

  event.preventDefault();
  move(direction);
}

function decrypt() {
  if (!root) return;

  const cipherInput = root.querySelector("#s05-cipher");
  const keyInput = root.querySelector("#s05-key");
  const message = root.querySelector("#s05-decode-message");
  const output = root.querySelector("#s05-decode-output");
  const urlHint = root.querySelector("#s05-url-hint");

  const cipher = cipherInput.value.trim().toUpperCase();
  const key = keyInput.value.trim().toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (!cipher || !key) {
    message.textContent = t("wrong");
    output.textContent = "";
    urlHint.classList.add("s05-hidden");
    return;
  }

  let keyIndex = 0;
  let result = "";

  for (const char of cipher) {
    if (char >= "A" && char <= "Z") {
      const c = char.charCodeAt(0) - 65;
      const k = key.charCodeAt(keyIndex % key.length) - 65;
      const p = ((c - k - OFFSET) % 26 + 26) % 26;

      result += String.fromCharCode(p + 65);
      keyIndex++;
    } else {
      result += char;
    }
  }

  decoded = result;
  output.textContent = result;

  if (result === TARGET) {
    message.textContent = "";
    urlHint.textContent = t("solvedHint");
    urlHint.classList.remove("s05-hidden");

    speak(
      "这是什么？你或许可以在某串东西后面输入 ?key=解密后的串 试试看？",
      "What's this? Maybe try appending ?key=the-decrypted-string to a certain URL.",
      "suspicious"
    );
  } else {
    message.textContent = t("wrong");
    urlHint.classList.add("s05-hidden");
  }
}

function updateScore() {
  const scoreElement = root?.querySelector("#s05-score");

  if (scoreElement) {
    scoreElement.textContent = String(
      board.reduce(
        (sum, tile) => sum + (tile.special ? 0 : tile.value),
        0
      )
    );
  }
}

function move(direction) {
  if (!root || gameOver || rulePaused || overflowLocked) return;

  const occupied = new Map();

  for (const tile of board) {
    occupied.set(`${tile.row},${tile.col}`, tile);
  }

  let changed = false;
  const processed = new Set();
  const lines = [];

  for (let i = 0; i < SIZE; i++) {
    const line = [];

    for (let j = 0; j < SIZE; j++) {
      let row, col;

      if (direction === "left") {
        row = i;
        col = j;
      } else if (direction === "right") {
        row = i;
        col = SIZE - 1 - j;
      } else if (direction === "up") {
        row = j;
        col = i;
      } else {
        row = SIZE - 1 - j;
        col = i;
      }

      line.push({ row, col });
    }

    lines.push(line);
  }

  for (const line of lines) {
    const tiles = line
      .map(cell => occupied.get(`${cell.row},${cell.col}`))
      .filter(Boolean);

    const output = [];
    let i = 0;

    while (i < tiles.length) {
      const current = tiles[i];

      if (current.special) {
        output.push(current);
        i++;
        continue;
      }

      const next = tiles[i + 1];

      if (
        next &&
        !next.special &&
        (!ruleChanged
          ? current.value === next.value
          : true)
      ) {
        const product = ruleChanged
          ? current.value * next.value
          : current.value * 2;

        if (!Number.isFinite(product) || product > MAX_INT32) {
          current.value = MAX_INT32;
          current.special = true;
          current.revealed = false;

          overflowLocked = true;
          gameOver = true;

          output.push(current);
          processed.add(next.id);
          changed = true;
          i += 2;

          if (!overflowFound) {
            speak(
              "等等……这个数值已经超过了变量能表示的范围？这不应该啊。",
              "Wait... that value is beyond the range this variable can represent? That shouldn't happen.",
              "shocked"
            );
          }

          continue;
        }

        current.value = product;
        current.merged = true;

        output.push(current);
        processed.add(next.id);
        changed = true;
        i += 2;

        if (!ruleChanged && current.value >= 2048) {
          ruleChanged = true;
          rulePaused = true;
        }
      } else {
        output.push(current);
        i++;
      }
    }

    for (let j = 0; j < output.length; j++) {
      const tile = output[j];
      const cell = line[j];

      if (tile.row !== cell.row || tile.col !== cell.col) {
        changed = true;
      }

      tile.row = cell.row;
      tile.col = cell.col;
    }

    if (overflowLocked) break;
  }

  if (!changed) {
    if (board.length >= SIZE * SIZE && !canMove()) {
      gameOver = true;
      root.querySelector("#s05-game-message").textContent =
        t("gameOver");
    }

    return;
  }

  board = board.filter(tile => !processed.has(tile.id));

  const layer = root.querySelector("#s05-tile-layer");
  const liveIds = new Set(board.map(tile => String(tile.id)));

  for (const element of [...layer.querySelectorAll(".s05-tile")]) {
    if (!liveIds.has(element.dataset.id)) {
      element.style.opacity = "0";
      element.style.transform += " scale(0.85)";
      setTimeout(() => element.remove(), 130);
    }
  }

  for (const tile of board) {
    let element = layer.querySelector(
      `.s05-tile[data-id="${tile.id}"]`
    );

    if (!element) {
      element = makeTileElement(tile);
      layer.appendChild(element);
    }

    renderTile(tile);
  }

  if (!overflowLocked) {
    spawnTile();
  }

  updateScore();

  if (rulePaused) {
    rulePaused = false;

    speak(
      "规则改了：相同数值不再是合并条件，现在两个方块相撞就会相乘。别问为什么，我也不想知道。",
      "Rules changed: matching values are no longer required. When two tiles collide, they multiply. Don't ask why. I don't want to know either.",
      "smug"
    );
  }

  if (
    !overflowLocked &&
    board.length >= SIZE * SIZE &&
    !canMove()
  ) {
    gameOver = true;
    root.querySelector("#s05-game-message").textContent =
      t("gameOver");
  }
}

function canMove() {
  if (emptyCells().length) return true;

  const matrix = Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(null)
  );

  for (const tile of board) {
    matrix[tile.row][tile.col] = tile;
  }

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const current = matrix[row][col];

      if (!current) return true;

      for (const [dr, dc] of [[1, 0], [0, 1]]) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr >= SIZE || nc >= SIZE) continue;

        const next = matrix[nr][nc];

        if (!next) return true;
        if (current.special || next.special) continue;

        if (ruleChanged || current.value === next.value) {
          return true;
        }
      }
    }
  }

  return false;
}

function checkUnlockFromUrl() {
  if (!root || !mounted) return;

  const url = new URL(window.location.href);
  const key = (url.searchParams.get("key") || "")
    .trim()
    .toUpperCase();

  if (
    key !== TARGET ||
    root.dataset.stage05Navigating === "1"
  ) {
    return;
  }

  root.dataset.stage05Navigating = "1";

  Progress.completeStage(5);
  Router.navigate(Router.ROUTES.stage(6));
}

function mount(container) {
  root = container;
  mounted = true;

  Narrator.setStage(5);
  resetBoard();

  checkUnlockFromUrl();
}

function unmount() {
  mounted = false;
  root = null;
}

function onLanguageChange() {
  if (!root) return;

  const oldBoard = board.map(tile => ({ ...tile }));

  render();
  board = oldBoard;
}

export default {
  mount,
  unmount,
  onLanguageChange,
};
