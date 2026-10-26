
// =========================================================
// Meta Puzzle — Narrator
// File: js/narrator.js
// =========================================================

import I18n from "./i18n.js";
import Progress from "./progress.js";

const Narrator = (() => {
  const STORAGE_KEY = "meta-puzzle-narrator-v1";

  const DEFAULT_MEMORY = {
    totalInteractions: 0,
    totalHintsRequested: 0,
    fakeLinksClicked: 0,
    failedAnswers: 0,
    successfulAnswers: 0,
    gameRestarts: 0,
    consoleDiscovered: false,
    narratorDistrusted: false,
    lastMood: "neutral",
    stageVisits: {},
    stageBehavior: {},
    seenLines: []
  };

  let memory = null;
  let currentStage = 1;
  let currentMood = "neutral";
  let lineQueue = [];
  let isVisible = true;
  let onLineChanged = null;

  const moodLabels = {
    "zh-CN": {
      neutral: "正常",
      pleased: "得意",
      annoyed: "不耐烦",
      suspicious: "可疑",
      impressed: "有点本事",
      embarrassed: "尴尬",
      concerned: "认真起来了"
    },
    en: {
      neutral: "Neutral",
      pleased: "Smug",
      annoyed: "Annoyed",
      suspicious: "Suspicious",
      impressed: "Impressed",
      embarrassed: "Embarrassed",
      concerned: "Serious"
    }
  };

  // Narrator lines are intentionally authored in both languages.
  // These lines may be sarcastic or misleading.
  const dialogue = {
    welcome: {
      mood: "neutral",
      zh: "欢迎来到帮助中心。这里提供各种帮助。理论上。",
      en: "Welcome to the Help Center. We provide all kinds of help. In theory."
    },

    firstFakeLink: {
      mood: "pleased",
      zh: "点得不错。虽然你什么也没找到，但至少你点得很有自信。",
      en: "Nice click. You found nothing, but at least you clicked confidently."
    },

    repeatedFakeLinks: {
      mood: "annoyed",
      zh: "又一个？你是不是觉得网页上的每个链接都欠你一次点击？",
      en: "Another one? Do you think every link on this page owes you a click?"
    },

    clickedManyLinks: {
      mood: "suspicious",
      zh: "你点链接的速度越来越快了。是在找线索，还是在和鼠标比赛？",
      en: "You're clicking faster and faster. Looking for clues, or racing your mouse?"
    },

    hintRequestedEarly: {
      mood: "pleased",
      zh: "这么快就要提示？我还以为你至少会先假装思考一下。",
      en: "A hint already? I thought you'd at least pretend to think first."
    },

    hintRequestedRepeatedly: {
      mood: "annoyed",
      zh: "又要提示？照这个速度，我干脆替你把鼠标也点了吧。",
      en: "Another hint? At this rate, should I click the mouse for you too?"
    },

    wrongAnswer: {
      mood: "pleased",
      zh: "差一点。好吧，其实差多少我也不想告诉你。",
      en: "Almost. Fine, I won't tell you how far off you were."
    },

    repeatedWrongAnswer: {
      mood: "annoyed",
      zh: "这个答案你已经试过了。重复错误也是一种坚持，虽然没什么用。",
      en: "You've tried that answer already. Repeating mistakes is persistence, I suppose."
    },

    correctAnswer: {
      mood: "impressed",
      zh: "……行。这个确实算你自己找出来的。",
      en: "...All right. You actually figured that one out yourself."
    },

    restartGame: {
      mood: "pleased",
      zh: "重开吧。毕竟刚才那局，我们就当它没有发生过。",
      en: "Restart it. We'll pretend that last attempt never happened."
    },

    foundConsole: {
      mood: "suspicious",
      zh: "你为什么要打开那个黑乎乎的窗口？我可没说那里有线索。",
      en: "Why did you open that dark little window? I never said there were clues there."
    },

    playerDoingWell: {
      mood: "impressed",
      zh: "你最近表现得有点过于熟练了。我开始怀疑你是不是看过说明书。",
      en: "You're getting suspiciously good at this. Have you read the manual?"
    },

    playerStruggling: {
      mood: "concerned",
      zh: "先停一下。换个方向想想。你不需要把同一扇门撞开十次。",
      en: "Take a breath. Try another angle. You don't need to hit the same door ten times."
    },

    narratorDistrusted: {
      mood: "embarrassed",
      zh: "你现在连我说的话都不信了？很好。至少你学会了独立思考。",
      en: "You don't believe a word I say anymore? Good. At least you're thinking independently."
    },

    stageAdvanced: {
      mood: "pleased",
      zh: "下一关。别高兴得太早，我还没开始认真。",
      en: "Next stage. Don't celebrate yet. I haven't even started trying."
    },

    finalStage: {
      mood: "concerned",
      zh: "最后一关。接下来我说的话，你最好自己判断。",
      en: "The final stage. From here on, judge what I say for yourself."
    }
  };

  // Reliable hints are separate from narrator dialogue.
  // These must not contain intentional deception.
  const reliableHints = {
    1: [
      {
        zh: "注意页面底部的页脚区域。",
        en: "Pay attention to the footer at the bottom of the page."
      },
      {
        zh: "错误页面并不一定意味着探索结束。",
        en: "An error page does not necessarily mean your search is over."
      },
      {
        zh: "仔细观察页脚里的版权标记。",
        en: "Look carefully at the copyright mark in the footer."
      }
    ],

    2: [
      {
        zh: "观察页面上短暂出现的异常文字。",
        en: "Watch for unusual text that appears briefly."
      },
      {
        zh: "异常文字可能不是随机噪声。",
        en: "The unusual text may not be random noise."
      },
      {
        zh: "检查浏览器开发者工具，特别是控制台。",
        en: "Check the browser developer tools, especially the console."
      }
    ],

    3: [
      {
        zh: "文件名可能比图片内容更重要。",
        en: "The filename may matter more than the image itself."
      },
      {
        zh: "试着下载图片并检查文件名。",
        en: "Try downloading the image and inspecting its filename."
      },
      {
        zh: "搜索时不要擅自添加文件扩展名。",
        en: "Do not add a file extension to the search term."
      }
    ],

    4: [
      {
        zh: "不同页面上的线索可能需要组合。",
        en: "Clues from different pages may need to be combined."
      },
      {
        zh: "注意页面之间的返回路径和网址结构。",
        en: "Pay attention to return paths and URL structure."
      },
      {
        zh: "有些页面内容需要通过查看源码才能发现。",
        en: "Some page content may only be visible in the source."
      }
    ],

    5: [
      {
        zh: "你已经见过某个熟悉的词，但它不一定是最终答案。",
        en: "You've seen a familiar word, but it may not be the final answer."
      },
      {
        zh: "检查此前得到的密文，以及它需要的数字参数。",
        en: "Check the ciphertext you found earlier and the numeric parameter it needs."
      },
      {
        zh: "回到之前发现的解密工具。",
        en: "Return to the decryption tool you found earlier."
      }
    ],

    6: [
      {
        zh: "网站提示使用 Cookie 保存信息。检查浏览器保存了什么。",
        en: "The site mentions cookies. Inspect what the browser has stored."
      },
      {
        zh: "注意 Cookie 中的值，而不只是它的名称。",
        en: "Pay attention to the cookie value, not just its name."
      },
      {
        zh: "试着访问 Cookie 指向的游戏页面。",
        en: "Try visiting the game page referenced by the cookie."
      }
    ],

    7: [
      {
        zh: "这次需要反复观察网址和网络请求。",
        en: "This time, watch the URL and network requests closely."
      },
      {
        zh: "请求的变化可能比页面上的文字更重要。",
        en: "Changes in requests may matter more than the visible text."
      },
      {
        zh: "打开开发者工具中的 Network 面板。",
        en: "Open the Network panel in developer tools."
      }
    ],

    8: [
      {
        zh: "文件扩展名和文件真实格式未必一致。",
        en: "A file extension does not always match the actual file format."
      },
      {
        zh: "检查下载文件的类型，并思考它可能是什么格式。",
        en: "Inspect the downloaded file and consider its actual format."
      },
      {
        zh: "ZIP 是一种值得考虑的文件格式。",
        en: "ZIP is one format worth considering."
      }
    ],

    9: [
      {
        zh: "你确定页面上的旧操作方式仍然有效吗？",
        en: "Are you sure the old interaction method still works?"
      },
      {
        zh: "试着改变按住鼠标的时间，而不是只点击。",
        en: "Try changing how long you hold the mouse button instead of simply clicking."
      },
      {
        zh: "在可疑区域按住一段时间再观察。",
        en: "Hold down on suspicious areas for a while and observe."
      }
    ],

    10: [
      {
        zh: "迷宫中并非所有重要位置都在最短路径上。",
        en: "Not every important location in the maze lies on the shortest path."
      },
      {
        zh: "检查能否到达并触发一些不显眼的位置。",
        en: "Check whether you can reach and activate less obvious locations."
      },
      {
        zh: "收集到的字符可能需要组成一条控制台命令。",
        en: "The collected characters may form a console command."
      }
    ],

    11: [
      {
        zh: "不要默认游戏规则在整个过程中保持不变。",
        en: "Do not assume the rules remain unchanged throughout a game."
      },
      {
        zh: "仔细检查每个游戏状态是否与显示的状态一致。",
        en: "Check whether each game's actual state matches what it displays."
      },
      {
        zh: "如果规则突然变化，重新推导当前条件。",
        en: "If the rules change, derive the current conditions again."
      }
    ],

    12: [
      {
        zh: "历史版本的更新说明可能藏着可触发的错误。",
        en: "Historical release notes may describe bugs you can trigger."
      },
      {
        zh: "不要只阅读更新说明，要尝试重现它描述的现象。",
        en: "Do more than read the release notes: try reproducing the described behavior."
      },
      {
        zh: "不同历史版本之间可能存在互相连接的线索。",
        en: "Different historical versions may contain interconnected clues."
      }
    ],

    13: [
      {
        zh: "最后一关会综合使用之前学到的浏览器技巧。",
        en: "The final stage combines browser techniques from earlier stages."
      },
      {
        zh: "重新检查你记录过的异常网址、文本和文件。",
        en: "Revisit the unusual URLs, text, and files you've recorded."
      },
      {
        zh: "不要完全相信旁白，也不要无条件否定它。",
        en: "Do not trust the narrator completely, but do not dismiss everything either."
      }
    ]
  };

  function cloneDefaultMemory() {
    return JSON.parse(JSON.stringify(DEFAULT_MEMORY));
  }

  function loadMemory() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        memory = cloneDefaultMemory();
      } else {
        const parsed = JSON.parse(raw);

        memory = {
          ...cloneDefaultMemory(),
          ...parsed,
          stageVisits: {
            ...(parsed.stageVisits || {})
          },
          stageBehavior: {
            ...(parsed.stageBehavior || {})
          },
          seenLines: Array.isArray(parsed.seenLines)
            ? parsed.seenLines
            : []
        };
      }
    } catch (error) {
      memory = cloneDefaultMemory();
    }

    saveMemory();
    return getMemory();
  }

  function ensureLoaded() {
    if (!memory) {
      loadMemory();
    }
  }

  function saveMemory() {
    if (!memory) {
      return false;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(memory)
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function getMemory() {
    ensureLoaded();
    return JSON.parse(JSON.stringify(memory));
  }

  function recordBehavior(type, details = {}) {
    ensureLoaded();

    memory.totalInteractions += 1;

    const key = String(currentStage);

    if (!memory.stageBehavior[key]) {
      memory.stageBehavior[key] = {
        fakeLinksClicked: 0,
        wrongAnswers: 0,
        correctAnswers: 0,
        hintsRequested: 0,
        restarts: 0
      };
    }

    const stage = memory.stageBehavior[key];

    switch (type) {
      case "fake-link":
        memory.fakeLinksClicked += 1;
        stage.fakeLinksClicked += 1;
        Progress.recordFakeLinkClick(currentStage);
        break;

      case "wrong-answer":
        memory.failedAnswers += 1;
        stage.wrongAnswers += 1;
        Progress.recordFailedAttempt(currentStage);
        break;

      case "correct-answer":
        memory.successfulAnswers += 1;
        stage.correctAnswers += 1;
        break;

      case "hint":
        memory.totalHintsRequested += 1;
        stage.hintsRequested += 1;
        Progress.recordHint(currentStage);
        break;

      case "restart":
        memory.gameRestarts += 1;
        stage.restarts += 1;
        break;

      case "console-found":
        memory.consoleDiscovered = true;
        break;

      case "distrust":
        memory.narratorDistrusted = true;
        break;

      default:
        break;
    }

    saveMemory();

    window.dispatchEvent(
      new CustomEvent("playerbehavior", {
        detail: {
          type,
          stage: currentStage,
          ...details
        }
      })
    );
  }

  function setStage(stage) {
    if (!Number.isInteger(stage) || stage < 1 || stage > 13) {
      return false;
    }

    currentStage = stage;

    ensureLoaded();

    const key = String(stage);

    memory.stageVisits[key] =
      (memory.stageVisits[key] || 0) + 1;

    saveMemory();

    if (stage === 13) {
      speak("finalStage");
    } else if (memory.narratorDistrusted) {
      speak("narratorDistrusted");
    } else if (memory.totalInteractions >= 15) {
      speak("playerDoingWell");
    } else if (memory.stageVisits[key] > 1) {
      speak("playerStruggling");
    }

    return true;
  }

  function getMoodLabel(mood = currentMood) {
    const language = I18n.getLanguage();
    return moodLabels[language]?.[mood] || moodLabels["zh-CN"][mood];
  }

  function renderLine(line, extra = {}) {
    const language = I18n.getLanguage();
    const text = language === "en" ? line.en : line.zh;

    currentMood = line.mood || "neutral";
    memory.lastMood = currentMood;
    saveMemory();

    const payload = {
      text,
      mood: currentMood,
      moodLabel: getMoodLabel(),
      stage: currentStage,
      ...extra
    };

    if (typeof onLineChanged === "function") {
      onLineChanged(payload);
    }

    window.dispatchEvent(
      new CustomEvent("narratorline", {
        detail: payload
      })
    );

    return payload;
  }

  function speak(lineId, extra = {}) {
    ensureLoaded();

    const line = dialogue[lineId];

    if (!line) {
      return null;
    }

    memory.seenLines.push(lineId);

    // Prevent the history from growing forever.
    if (memory.seenLines.length > 100) {
      memory.seenLines = memory.seenLines.slice(-100);
    }

    saveMemory();

    return renderLine(line, extra);
  }

  function speakCustom(textByLanguage, mood = "neutral") {
    ensureLoaded();

    const line = {
      zh: textByLanguage.zh || textByLanguage["zh-CN"] || "",
      en: textByLanguage.en || "",
      mood
    };

    return renderLine(line);
  }

  function chooseBehaviorLine() {
    ensureLoaded();

    const behavior =
      memory.stageBehavior[String(currentStage)] || {};

    if (memory.narratorDistrusted) {
      return "narratorDistrusted";
    }

    if ((behavior.fakeLinksClicked || 0) >= 4) {
      return "clickedManyLinks";
    }

    if ((behavior.wrongAnswers || 0) >= 3) {
      return "repeatedWrongAnswer";
    }

    if ((behavior.hintsRequested || 0) >= 3) {
      return "hintRequestedRepeatedly";
    }

    if ((behavior.correctAnswers || 0) >= 1) {
      return "correctAnswer";
    }

    if ((behavior.fakeLinksClicked || 0) >= 1) {
      return "firstFakeLink";
    }

    return "welcome";
  }

  function reactTo(type, details = {}) {
    recordBehavior(type, details);

    const reactions = {
      "fake-link": () => {
        const behavior =
          memory.stageBehavior[String(currentStage)] || {};

        if (behavior.fakeLinksClicked >= 4) {
          return speak("clickedManyLinks");
        }

        if (behavior.fakeLinksClicked >= 2) {
          return speak("repeatedFakeLinks");
        }

        return speak("firstFakeLink");
      },

      "wrong-answer": () => {
        const behavior =
          memory.stageBehavior[String(currentStage)] || {};

        return behavior.wrongAnswers >= 3
          ? speak("repeatedWrongAnswer")
          : speak("wrongAnswer");
      },

      "correct-answer": () => speak("correctAnswer"),

      hint: () => {
        const behavior =
          memory.stageBehavior[String(currentStage)] || {};

        return behavior.hintsRequested >= 3
          ? speak("hintRequestedRepeatedly")
          : speak("hintRequestedEarly");
      },

      restart: () => speak("restartGame"),

      "console-found": () => speak("foundConsole"),

      distrust: () => speak("narratorDistrusted")
    };

    return reactions[type] ? reactions[type]() : null;
  }

  /**
   * Return a reliable hint for the current stage.
   * Hints are independent of narrator dialogue and never intentionally lie.
   */
  function getReliableHint(stage = currentStage, level = 1) {
    const hints = reliableHints[stage];

    if (!hints || hints.length === 0) {
      return {
        text: I18n.t("hint.unavailable"),
        stage,
        level: 0,
        available: false
      };
    }

    const index = Math.max(
      0,
      Math.min(hints.length - 1, level - 1)
    );

    const language = I18n.getLanguage();
    const hint = hints[index];

    return {
      text: language === "en" ? hint.en : hint.zh,
      stage,
      level: index + 1,
      available: true,
      remaining: Math.max(0, hints.length - index - 1)
    };
  }

  function requestReliableHint(level = 1) {
    recordBehavior("hint");

    const hint = getReliableHint(currentStage, level);

    window.dispatchEvent(
      new CustomEvent("reliablehint", {
        detail: hint
      })
    );

    return hint;
  }

  /**
   * Optional UI integration.
   * The app bootstrap can connect this to the narrator panel.
   */
  function connectUI(callback) {
    onLineChanged = callback;
  }

  function show() {
    isVisible = true;

    window.dispatchEvent(
      new CustomEvent("narratorvisibilitychange", {
        detail: { visible: true }
      })
    );
  }

  function hide() {
    isVisible = false;

    window.dispatchEvent(
      new CustomEvent("narratorvisibilitychange", {
        detail: { visible: false }
      })
    );
  }

  function toggleVisibility() {
    if (isVisible) {
      hide();
    } else {
      show();
    }

    return isVisible;
  }

  function isShown() {
    return isVisible;
  }

  function getCurrentStage() {
    return currentStage;
  }

  function getCurrentMood() {
    return currentMood;
  }

  function getDialogueHistory() {
    ensureLoaded();

    return [...memory.seenLines];
  }

  function init() {
    loadMemory();
    currentStage = 1;
    currentMood = memory.lastMood || "neutral";
  }

  return {
    init,
    speak,
    speakCustom,
    setStage,
    reactTo,
    recordBehavior,
    chooseBehaviorLine,
    getReliableHint,
    requestReliableHint,
    getMemory,
    getDialogueHistory,
    getCurrentStage,
    getCurrentMood,
    getMoodLabel,
    connectUI,
    show,
    hide,
    toggleVisibility,
    isShown
  };
})();

export default Narrator;
