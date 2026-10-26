const DEBUG = new URLSearchParams(window.location.search)
  .get("debug") === "1";

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const SIZE = 4;
const TARGET = "SATWA06_AHJZ";
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
let decoded = "";
let mounted = false;

let hintTimer = null;
let hintGeneration = 0;
let hintLoopActive = false;

const translations = {
  "zh-CN": {
    title: "未定义行为",
    subtitle: "系统运行状态 · 存在未记录的异常",
    gameTitle: "2048",
    score: "当前数值",
    restart: "重新开始",
    decoderTitle: "解密终端",
    decoderDesc: "输入密文与密钥，尝试还原数据。",
    cipherLabel: "密文",
    keyLabel: "密钥",
    decode: "执行解密",
    decodePlaceholder: "输入密文",
    keyPlaceholder: "输入密钥",
    wrong: "解密失败。请检查输入内容。",
    correct: "STAGE06_OPEN",
    continue: "继续",
    gameOver: "没有可用的移动了。",
    ruleTitle: "规则已修改",
    ruleText:
      "好了，搞定。现在方块碰到一起就会相乘，不用再管它们的数字是否相同了。怎么样？是不是有趣多了？",
    overflowHint:
      "等等……这个数值已经超过了变量能表示的范围？这不应该啊。",
    secretHint:
      "你找到了一个隐藏值。记下来，别让我再说第二遍。",
    secretFound: "隐藏密钥已显示。",
    solvedHint:
      "下一步：复制第五关网址，在末尾添加 ?key=，再把解密结果接在等号后面。例如：原网址?key=SATWA06_AHJZ。请使用你实际解出的结果。",
    urlHelp:
      "解密成功并不代表通关。复制第五关的网址，在末尾添加 ?key=，把解密结果粘贴到等号后面，然后按回车访问新网址。",
    close: "关闭",
    overflowTile: "异常数值",
    instructions:
      "使用方向键或 WASD 移动方块。触屏设备可以滑动棋盘。",
    gameStatus: "运行中",
    terminalStatus: "等待输入",
    outputLabel: "输出结果",
    systemLabel: "SYSTEM / 05",
    gameIntro: "数值合并测试",
    ruleBefore: "这游戏也太无聊了……让我看看代码里究竟写了些什么。",
    ruleAfter:
      "好了，搞定。现在方块碰到一起就会相乘，不用再管它们的数字是否相同了。怎么样？是不是有趣多了？",
  },

  en: {
    title: "Undefined Behavior",
    subtitle: "SYSTEM STATUS · UNDOCUMENTED ANOMALY DETECTED",
    gameTitle: "2048",
    score: "Current value",
    restart: "Restart",
    decoderTitle: "Decryption Terminal",
    decoderDesc: "Enter the ciphertext and key to recover the data.",
    cipherLabel: "Ciphertext",
    keyLabel: "Key",
    decode: "Decrypt",
    decodePlaceholder: "Enter ciphertext",
    keyPlaceholder: "Enter key",
    wrong: "Decryption failed. Check your input.",
    correct: "STAGE06_OPEN",
    continue: "Continue",
    gameOver: "No moves remain.",
    ruleTitle: "Rules modified",
    ruleText:
      "There. Done. Now colliding tiles multiply, whether or not their values match. What do you think? More interesting now?",
    overflowHint:
      "Wait... that value is beyond the range this variable can represent? That shouldn't happen.",
    secretHint:
      "You found a hidden value. Write it down. Don't make me say it twice.",
    secretFound: "Hidden key revealed.",
    solvedHint:
      "Next: copy the Stage 5 URL, append ?key=, and put the decrypted result after the equals sign. Example: original-URL?key=SATWA06_AHJZ. Use your actual result.",
    urlHelp:
      "Decryption is not the end. Copy the Stage 5 URL, append ?key=, paste the decrypted result after the equals sign, and press Enter.",
    close: "Close",
    overflowTile: "Overflow",
    instructions:
      "Use the arrow keys or WASD to move. On touch devices, swipe the board.",
    gameStatus: "ONLINE",
    terminalStatus: "AWAITING INPUT",
    outputLabel: "OUTPUT",
    systemLabel: "SYSTEM / 05",
    gameIntro: "Numeric merge test",
    ruleBefore: "This game is so boring... Let's see what the code actually does.",
    ruleAfter:
      "There. Done. Now colliding tiles multiply, whether or not their values match. What do you think? More interesting now?",
  },
};

function lang() {
  return I18n.getLanguage?.() === "en" ? "en" : "zh-CN";
}

function t(key) {
  return translations[lang()][key];
}

/* 统一旁白情绪名称，避免传入 narrator.js 不支持的 mood。 */
function speak(zh, en, mood = "neutral") {
  const moodMap = {
    normal: "neutral",
    shocked: "concerned",
    curious: "suspicious",
    smug: "pleased",
  };

  const validMoods = new Set([
    "neutral",
    "pleased",
    "annoyed",
    "suspicious",
    "impressed",
    "embarrassed",
    "concerned",
  ]);

  const normalizedMood = moodMap[mood] || mood;
  const safeMood = validMoods.has(normalizedMood)
    ? normalizedMood
    : "neutral";

  Narrator.speakCustom(
    { "zh-CN": zh, en },
    safeMood
  );
}

/*
 * 解密成功后的循环提示。
 * 每次等待 18～43 秒，避免固定间隔。
 * generation 用来阻止已经失效的旧计时器继续播放。
 */
function stopDecryptHints() {
  hintGeneration++;
  hintLoopActive = false;

  if (hintTimer !== null) {
    clearTimeout(hintTimer);
    hintTimer = null;
  }
}

function startDecryptHints() {
  stopDecryptHints();

  hintLoopActive = true;
  const generation = hintGeneration;

  const hints = [
    {
      zh: "解出来了？不错。不过，你真的知道接下来该把这串东西放在哪里吗？",
      en: "Decoded it? Nice. But do you actually know where that string goes?",
      mood: "pleased",
    },
    {
      zh: "提醒一下：URL 不只是用来打开网页的。它后面还可以跟参数。",
      en: "A reminder: URLs do more than open pages. They can also carry parameters.",
      mood: "suspicious",
    },
    {
      zh: "具体一点：在第五关的网址后面加上 ?key=，再把解密结果接在等号后面。",
      en: "More specifically: append ?key= to the Stage 5 URL, then put the decrypted result after the equals sign.",
      mood: "concerned",
    },
    {
      zh: "格式是：第五关网址?key=你的解密结果。注意，别把“你的解密结果”这几个字原样填进去。",
      en: "The format is: Stage 5 URL?key=YOUR_DECRYPTED_RESULT. Don't literally type the placeholder words.",
      mood: "annoyed",
    },
    {
      zh: "举个例子：如果结果是 ABC123，那么网址末尾就写 ?key=ABC123。你要用自己的实际结果替换示例。",
      en: "For example, if the result were ABC123, the URL would end with ?key=ABC123. Replace the example with your actual result.",
      mood: "impressed",
    },
    {
      zh: "再说一遍，免得你假装没听见：复制第五关的网址，在末尾输入 ?key=，紧接着粘贴解密结果，然后按回车。",
      en: "One more time, in case you weren't listening: copy the Stage 5 URL, append ?key=, paste the decrypted result, and press Enter.",
      mood: "annoyed",
    },
  ];

  let index = 0;

  function scheduleNext() {
    if (!hintLoopActive || generation !== hintGeneration) {
      return;
    }

    const delay = 18000 + Math.floor(Math.random() * 25001);

    hintTimer = setTimeout(() => {
      hintTimer = null;

      if (!hintLoopActive || generation !== hintGeneration) {
        return;
      }

      const hint = hints[index % hints.length];
      index++;

      speak(hint.zh, hint.en, hint.mood);
      scheduleNext();
    }, delay);
  }

  scheduleNext();
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

  stopDecryptHints();

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
  if (special) return "#07130e";

  const colors = {
    2: "#e7e9ee",
    4: "#cdd8e8",
    8: "#9ab8dc",
    16: "#79a2d0",
    32: "#5988be",
    64: "#3f70a7",
    128: "#d9bd79",
    256: "#d8a94d",
    512: "#d89436",
    1024: "#d77b29",
    2048: "#c85e28",
  };

  if (value > 2048) return "#263449";
  return colors[value] || "#263449";
}

function textColor(value, special) {
  if (special || value >= 8) return "#ffffff";
  return "#28384b";
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
  face.style.borderRadius = "7px";
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

    if (!faceElement) return;

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

  if (!face) return;

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
          --s05-bg: #101721;
          --s05-panel: #171f2b;
          --s05-border: #2c3b4e;
          --s05-text: #edf3fb;
          --s05-muted: #8fa1b8;
          --s05-blue: #77b7ff;
          --s05-green: #79e6b0;
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: clamp(12px, 2.5vw, 28px);
          box-sizing: border-box;
          color: var(--s05-text);
          font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        }

        .stage05 *, .stage05 *::before, .stage05 *::after {
          box-sizing: border-box;
        }

        .stage05 .s05-panel {
          width: 100%;
          min-width: 0;
          padding: clamp(20px, 3.5vw, 38px);
          border: 1px solid var(--s05-border);
          border-radius: 18px;
          background:
            radial-gradient(ellipse at 8% 0%, rgb(68 112 163 / 12%), transparent 42%),
            var(--s05-bg);
          box-shadow: 0 18px 48px rgb(0 0 0 / 18%);
          overflow: hidden;
        }

        .stage05 .s05-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin: 0 0 30px;
          padding: 0 0 24px;
          border-bottom: 1px solid var(--s05-border);
        }

        .stage05 .s05-eyebrow {
          margin: 0 0 10px;
          color: var(--s05-blue);
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .16em;
        }

        .stage05 h1 {
          margin: 0;
          color: var(--s05-text);
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 680;
          line-height: 1.2;
          letter-spacing: -.04em;
          overflow-wrap: anywhere;
        }

        .stage05 .s05-subtitle {
          margin: 12px 0 0;
          color: var(--s05-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .stage05 .s05-system-tag {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 5px;
          padding: 9px 12px;
          border: 1px solid #34475d;
          border-radius: 7px;
          background: rgb(119 183 255 / 5%);
          color: #b5cbe5;
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 11px;
        }

        .stage05 .s05-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--s05-green);
          box-shadow: 0 0 10px rgb(121 230 176 / 50%);
        }

        .stage05 .s05-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(280px, .95fr);
          align-items: stretch;
          gap: 22px;
          min-width: 0;
        }

        .stage05 .s05-section {
          min-width: 0;
          padding: clamp(16px, 2.5vw, 24px);
          border: 1px solid var(--s05-border);
          border-radius: 12px;
          background: var(--s05-panel);
        }

        .stage05 .s05-section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }

        .stage05 h2 {
          margin: 0;
          color: var(--s05-text);
          font-size: 17px;
          font-weight: 650;
          line-height: 1.4;
        }

        .stage05 .s05-section-desc {
          margin: 7px 0 0;
          color: var(--s05-muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .stage05 .s05-section-code {
          display: inline-block;
          margin-bottom: 7px;
          color: var(--s05-blue);
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 10px;
          letter-spacing: .12em;
        }

        .stage05 .s05-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }

        .stage05 .s05-toolbar-left,
        .stage05 .s05-toolbar-right {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .stage05 button { font: inherit; }

        .stage05 .s05-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 38px;
          padding: 9px 13px;
          border: 1px solid #394b60;
          border-radius: 7px;
          background: #202c3b;
          color: #e8f0fa;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
          cursor: pointer;
          transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease;
        }

        .stage05 .s05-button:hover {
          border-color: #688ab1;
          background: #2a3a4e;
        }

        .stage05 .s05-button:active { transform: translateY(1px); }

        .stage05 .s05-button:focus-visible,
        .stage05 input:focus-visible {
          outline: 2px solid var(--s05-blue);
          outline-offset: 3px;
        }

        .stage05 .s05-button-primary {
          border-color: #78b8ff;
          background: #77b7ff;
          color: #101c2a;
        }

        .stage05 .s05-button-primary:hover {
          border-color: #a0ceff;
          background: #a0ceff;
        }

        .stage05 .s05-score {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 38px;
          padding: 7px 11px;
          border: 1px solid #304054;
          border-radius: 7px;
          background: #111a26;
          color: var(--s05-muted);
          font-size: 11px;
          white-space: nowrap;
        }

        .stage05 .s05-score strong {
          color: var(--s05-text);
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 15px;
          font-variant-numeric: tabular-nums;
        }

        .stage05 .s05-game-content[hidden] { display: none !important; }

        .stage05 #s05-game-content > p {
          margin: 0 0 14px;
          color: var(--s05-muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .stage05 .s05-board-wrap {
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
        }

        .stage05 .s05-board {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          border: 1px solid #39485a;
          border-radius: 10px;
          background: #253142;
          box-shadow: inset 0 0 0 5px rgb(8 14 23 / 12%);
          touch-action: none;
          user-select: none;
        }

        .stage05 .s05-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-rows: repeat(4, minmax(0, 1fr));
          pointer-events: none;
        }

        .stage05 .s05-cell { min-width: 0; min-height: 0; padding: 5px; }

        .stage05 .s05-cell::before {
          display: block;
          width: 100%;
          height: 100%;
          border: 1px solid rgb(255 255 255 / 3%);
          border-radius: 7px;
          background: rgb(9 16 26 / 28%);
          content: "";
        }

        .stage05 .s05-tile-layer { position: absolute; inset: 0; }

        .stage05 .s05-tile { outline-offset: -3px; }

        .stage05 .s05-tile:focus-visible {
          z-index: 20;
          outline: 2px solid #77b7ff;
        }

        .stage05 .s05-tile-face {
          overflow: hidden;
          overflow-wrap: anywhere;
          border: 1px solid rgb(255 255 255 / 10%);
          border-radius: 7px;
          box-shadow: 0 2px 5px rgb(0 0 0 / 10%);
        }

        .stage05 #s05-game-message {
          min-height: 18px;
          margin: 13px 0 0;
          color: var(--s05-muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .stage05 .s05-decoder {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stage05 .s05-decoder .s05-section-head { margin-bottom: 12px; }

        .stage05 .s05-decoder label {
          margin-top: 5px;
          color: #b4c2d3;
          font-size: 12px;
          font-weight: 600;
        }

        .stage05 .s05-input {
          display: block;
          width: 100%;
          min-width: 0;
          min-height: 43px;
          padding: 11px 12px;
          border: 1px solid #35465a;
          border-radius: 7px;
          background: #101823;
          color: #edf3fb;
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 13px;
          line-height: 1.5;
          box-shadow: inset 0 1px 2px rgb(0 0 0 / 10%);
        }

        .stage05 .s05-input::placeholder { color: #63748a; }

        .stage05 .s05-input:focus {
          border-color: #77b7ff;
          outline: none;
          box-shadow: 0 0 0 3px rgb(119 183 255 / 12%);
        }

        .stage05 #s05-decode { align-self: flex-start; min-width: 125px; margin-top: 9px; }

        .stage05 #s05-decode-message {
          margin: 3px 0 0;
          color: #ff9a9a;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .stage05 .s05-output-label {
          margin-top: 7px;
          color: var(--s05-muted);
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 10px;
          letter-spacing: .1em;
        }

        .stage05 .s05-output {
          min-height: 42px;
          margin: 0;
          padding: 12px;
          border: 1px solid #304054;
          border-radius: 7px;
          background: #101823;
          color: var(--s05-green);
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 13px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .stage05 .s05-output:empty { display: none; }

        .stage05 #s05-url-hint {
          margin: 4px 0 0;
          padding: 11px 12px;
          border: 1px solid rgb(121 230 176 / 25%);
          border-radius: 7px;
          background: rgb(121 230 176 / 6%);
          color: #b9f4d6;
          font-size: 12px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .stage05 .s05-hidden { display: none !important; }

        .stage05 .s05-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
          padding-top: 17px;
          border-top: 1px solid var(--s05-border);
          color: #75879d;
          font-family: var(--font-mono, Consolas, monospace);
          font-size: 10px;
          letter-spacing: .04em;
        }

        .stage05 .s05-footer-state {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .stage05 .s05-footer-state::before {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e4b36c;
          content: "";
        }

        .stage05 .s05-tile[data-overflow="true"] {
          z-index: 10;
          animation: s05-glitch 180ms steps(2, end) infinite;
        }

        .stage05 .s05-tile[data-overflow="true"] .s05-tile-face {
          position: relative;
          overflow: hidden;
          border: 1px solid #39ff88;
          background:
            repeating-linear-gradient(0deg, rgb(0 255 100 / 12%) 0, rgb(0 255 100 / 12%) 1px, transparent 1px, transparent 4px),
            #050907 !important;
          color: #8bffb0 !important;
          box-shadow: 0 0 8px rgb(57 255 136 / 65%), inset 0 0 12px rgb(57 255 136 / 16%);
        }

        .stage05 .s05-tile[data-overflow="true"] .s05-tile-face::after {
          position: absolute;
          inset: -100% 0;
          background: linear-gradient(transparent 40%, rgb(57 255 136 / 45%) 50%, transparent 60%);
          content: "";
          pointer-events: none;
          animation: s05-scan 1.2s linear infinite;
        }

        .stage05 .s05-tile[data-overflow="true"][data-revealed="true"] .s05-tile-face {
          border-color: #b4ffd0;
          box-shadow: 0 0 12px rgb(57 255 136 / 75%), inset 0 0 18px rgb(57 255 136 / 25%);
        }

        @keyframes s05-glitch {
          0% { filter: brightness(1); }
          25% { filter: hue-rotate(25deg) brightness(1.25); }
          50% { filter: brightness(.8); }
          75% { filter: hue-rotate(-20deg) brightness(1.15); }
          100% { filter: brightness(1); }
        }

        @keyframes s05-scan {
          from { transform: translateY(-50%); }
          to { transform: translateY(100%); }
        }

        @media (max-width: 760px) {
          .stage05 { padding: 12px; }
          .stage05 .s05-panel { padding: 20px; }
          .stage05 .s05-heading {
            flex-direction: column;
            gap: 14px;
            margin-bottom: 20px;
            padding-bottom: 20px;
          }
          .stage05 .s05-layout { grid-template-columns: minmax(0, 1fr); gap: 16px; }
          .stage05 .s05-section { padding: 16px; }
          .stage05 .s05-board-wrap { max-width: 460px; }
        }

        @media (max-width: 420px) {
          .stage05 { padding: 6px; }
          .stage05 .s05-panel { padding: 12px; border-radius: 12px; }
          .stage05 .s05-section { padding: 12px; }
          .stage05 .s05-toolbar { align-items: stretch; }
          .stage05 .s05-toolbar-left,
          .stage05 .s05-toolbar-right { width: 100%; }
          .stage05 .s05-toolbar-left > *,
          .stage05 .s05-toolbar-right > * { flex: 1; }
          .stage05 .s05-score { justify-content: space-between; }
          .stage05 .s05-cell { padding: 3px; }
          .stage05 .s05-tile { padding: 3px !important; }
          .stage05 .s05-input { font-size: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .stage05 .s05-tile[data-overflow="true"],
          .stage05 .s05-tile[data-overflow="true"] .s05-tile-face::after {
            animation: none !important;
          }
          .stage05 .s05-button,
          .stage05 .s05-input { transition: none; }
        }
      </style>

      <div class="card s05-panel">
        <header class="s05-heading">
          <div>
            <p class="s05-eyebrow">${t("systemLabel")}</p>
            <h1>${t("title")}</h1>
            <p class="s05-subtitle">${t("subtitle")}</p>
          </div>
          <div class="s05-system-tag">
            <span class="s05-status-dot"></span>
            ${t("gameStatus")}
          </div>
        </header>

        <div class="s05-layout">
          <section class="s05-section">
            <div class="s05-section-head">
              <div>
                <span class="s05-section-code">MODULE / 01</span>
                <h2>${t("gameTitle")}</h2>
                <p class="s05-section-desc">${t("gameIntro")}</p>
              </div>
            </div>

            <div class="s05-toolbar">
              <div class="s05-toolbar-left">
                <button id="s05-toggle-game" class="s05-button s05-button-primary" type="button" aria-expanded="false" aria-controls="s05-game-content">${t("gameTitle")} ＋</button>
              </div>
              <div class="s05-toolbar-right">
                <div class="s05-score">
                  <span>${t("score")}</span>
                  <strong id="s05-score">0</strong>
                </div>
                <button id="s05-restart" class="s05-button" type="button">↻ ${t("restart")}</button>
              </div>
            </div>

            <div id="s05-game-content" class="s05-game-content" hidden>
              <p>${t("instructions")}</p>
              <div class="s05-board-wrap">
                <div id="s05-board" class="s05-board" role="application" aria-label="2048" tabindex="0">
                  <div class="s05-grid" aria-hidden="true">
                    ${Array.from({ length: 16 }, () => '<div class="s05-cell"></div>').join("")}
                  </div>
                  <div id="s05-tile-layer" class="s05-tile-layer"></div>
                </div>
              </div>
              <p id="s05-game-message" aria-live="polite"></p>
            </div>
          </section>

          <section class="s05-section s05-decoder">
            <div class="s05-section-head">
              <div>
                <span class="s05-section-code">MODULE / 02</span>
                <h2>${t("decoderTitle")}</h2>
                <p class="s05-section-desc">${t("decoderDesc")}</p>
              </div>
            </div>

            <label for="s05-cipher">${t("cipherLabel")}</label>
            <input id="s05-cipher" class="s05-input" autocomplete="off" spellcheck="false" placeholder="${t("decodePlaceholder")}" />

            <label for="s05-key">${t("keyLabel")}</label>
            <input id="s05-key" class="s05-input" autocomplete="off" spellcheck="false" placeholder="${t("keyPlaceholder")}" />

            <button id="s05-decode" class="s05-button s05-button-primary" type="button">${t("decode")} <span aria-hidden="true">→</span></button>

            <p id="s05-decode-message" aria-live="polite"></p>
            <p class="s05-output-label">${t("outputLabel")}</p>
            <p id="s05-decode-output" class="s05-output"></p>
            <p id="s05-url-hint" class="s05-hidden"></p>
          </section>
        </div>

        <footer class="s05-footer">
          <span>UNDEFINED_BEHAVIOR / BUILD 05</span>
          <span class="s05-footer-state">${t("terminalStatus")}</span>
        </footer>
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
    stopDecryptHints();
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
      "解密成功了。不过，还差最后一步：在第五关的网址末尾添加 ?key=，然后把解密结果接在等号后面。格式是 原网址?key=你的解密结果。注意，示例文字要换成你真正解出的字符串。",
      "Decryption succeeded. One last step: append ?key= to the Stage 5 URL, then put your decrypted result after the equals sign. The format is original-URL?key=YOUR_DECRYPTED_RESULT. Replace the placeholder with your actual result.",
      "suspicious"
    );

    startDecryptHints();
  } else {
    stopDecryptHints();
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
        (!ruleChanged ? current.value === next.value : true)
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

      const message = root.querySelector("#s05-game-message");
      if (message) message.textContent = t("gameOver");
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

  if (!overflowLocked) spawnTile();

  updateScore();

  if (rulePaused) {
    rulePaused = false;

    speak(
      "这游戏也太无聊了……让我看看代码里究竟写了些什么。",
      "This game is so boring... Let's see what the code actually does.",
      "curious"
    );

    speak(
      "好了，搞定。现在方块碰到一起就会相乘，不用再管它们的数字是否相同了。怎么样？是不是有趣多了？",
      "There. Done. Now colliding tiles multiply, whether or not their values match. What do you think? More interesting now?",
      "smug"
    );
  }

  if (!overflowLocked && board.length >= SIZE * SIZE && !canMove()) {
    gameOver = true;

    const message = root.querySelector("#s05-game-message");
    if (message) message.textContent = t("gameOver");
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

  stopDecryptHints();
  root.dataset.stage05Navigating = "1";

  Progress.completeStage(5);
  Router.navigate(Router.ROUTES.stage(6));
}

function mount(container) {
  stopDecryptHints();

  root = container;
  mounted = true;

  Narrator.setStage(5);
  resetBoard();

  checkUnlockFromUrl();
}

function unmount() {
  stopDecryptHints();

  mounted = false;
  root = null;
}

function onLanguageChange() {
  if (!root) return;

  const oldBoard = board.map(tile => ({ ...tile }));
  const wasDecoded = decoded === TARGET;

  render();

  board = oldBoard;

  for (const tile of board) {
    renderTile(tile);
  }

  updateScore();

  if (wasDecoded) {
    const urlHint = root.querySelector("#s05-url-hint");

    if (urlHint) {
      urlHint.textContent = t("solvedHint");
      urlHint.classList.remove("s05-hidden");
    }
  }
}

export default {
  mount,
  unmount,
  onLanguageChange,
};
