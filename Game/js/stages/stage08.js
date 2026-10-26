
/* ========================================================
 * Meta Puzzle — Stage 08
 * File: js/stages/stage08.js
 *
 * Puzzle chain:
 * SSTV WAV -> decode image -> cloud drive -> TXT -> ZIP
 * -> SihsdiplhVxia -> return to Stage 03
 * ======================================================== */

import I18n from "../i18n.js";
import Narrator from "../narrator.js";
import Router from "../router.js";
import Progress from "../progress.js";

const Stage08 = (() => {
  let root = null;
  let languageListener = null;

  const state = {
    downloaded: false,
    openedDecoder: false,
    foundImage: false,
    downloadedArchive: false,
    extracted: false,
    solved: false
  };

  const ANSWER = "SihsdiplhVxia";
  const AUDIO_PATH = "/assets/audio/sstv-martin1.wav";
  const SSTV_URL = "https://sstv.bashige.com/";
  const CLOUD_URL = "https://wwbhg.lanzoup.com/i9udF4dfp4xa";
  const CLOUD_PASSWORD = "444s";

  const TEXT = {
    "zh-CN": {
      eyebrow: "文件实验室 / 08",
      title: "信号之外",
      description:
        "我们收到了一段音频。发送者没有留下任何说明，只留下了这个文件。",

      audioTitle: "收到的文件",
      audioName: "sstv-martin1.wav",
      audioInfo:
        "WAV 音频文件。文件名中的 Martin1 也许不是随便起的。",
      download: "下载音频",
      downloadDone: "如果文件已成功下载，请继续分析它。",

      decoderTitle: "信号解码",
      decoderDescription:
        "普通音频播放器似乎帮不上什么忙。也许需要一种能够把图像编码进声音的技术。",
      decoderLink: "打开 SSTV 解码器",
      decoderSteps:
        "使用外部解码器，选择 Martin M1 模式，并载入刚才下载的 WAV 文件。",
      decodedButton: "我已经解码出图片",

      imageTitle: "找到图片了？",
      imageDescription:
        "请检查解码结果。图片里应该有一条网盘链接和一个提取密码。",
      imageConfirm: "我已经找到图片中的信息",
      imageNext:
        "根据图片中的信息访问网盘，并下载里面的文本文件。",

      archiveTitle: "下载的文件有些奇怪",
      archiveDescription:
        "网盘下载的文件看起来是一个 TXT 文档。但文件扩展名不一定能准确反映文件格式。",
      archiveHint:
        "可靠提示：如果文本编辑器打不开有意义的内容，可以检查文件头，并考虑它是否其实是一个压缩包。",
      archiveButton: "我已经下载了网盘文件",
      renameTitle: "检查文件格式",
      renameDescription:
        "尝试把下载文件的扩展名从 .txt 改为 .zip，再用解压工具打开。",
      renameButton: "我已经改成 ZIP 并解压",

      answerTitle: "解压结果",
      answerDescription:
        "输入解压后得到的字符串。不要把它当作普通英文单词，也不要擅自修改大小写。",
      answerLabel: "解压得到的字符串",
      answerPlaceholder: "输入字符串……",
      submit: "验证",
      wrongAnswer: "字符串不正确。请检查解压出来的原文。",
      correctAnswer: "验证通过。你知道接下来该去哪里了。",

      continue: "返回第三关",
      reset: "重置本关",

      narrator:
        "一段 WAV 音频而已。下载它、听一听，然后告诉我你发现了什么。别告诉我你准备直接把文件名输进搜索框。",

      narratorFound:
        "哦？你还真把图片还原出来了。好吧，接下来就看你能不能处理那个下载文件。",

      narratorSolved:
        "恭喜。你花了这么久，终于得到了一串字符串。现在，想想第三关那个搜索框。",

      progress1: "尚未下载音频",
      progress2: "音频已下载",
      progress3: "已确认解码图片",
      progress4: "已确认 ZIP 解压",
      progress5: "字符串已验证"
    },

    en: {
      eyebrow: "FILE LAB / 08",
      title: "Beyond the Signal",
      description:
        "We received an audio recording. The sender left no instructions, only this file.",

      audioTitle: "Received File",
      audioName: "sstv-martin1.wav",
      audioInfo:
        "A WAV audio file. The word Martin1 in its name may not be arbitrary.",
      download: "Download Audio",
      downloadDone: "If the file downloaded successfully, continue analyzing it.",

      decoderTitle: "Decode the Signal",
      decoderDescription:
        "An ordinary audio player may not help. Perhaps you need a technique that encodes images into sound.",
      decoderLink: "Open SSTV Decoder",
      decoderSteps:
        "Use an external decoder, select Martin M1 mode, and load the WAV file you downloaded.",
      decodedButton: "I have decoded the image",

      imageTitle: "Found an Image?",
      imageDescription:
        "Inspect the decoded result. The image should contain a cloud-drive link and an extraction password.",
      imageConfirm: "I found the information in the image",
      imageNext:
        "Use the information in the image to visit the cloud drive and download its text file.",

      archiveTitle: "Something Is Odd About This File",
      archiveDescription:
        "The downloaded file looks like a TXT document. But a file extension does not necessarily reflect its actual format.",
      archiveHint:
        "Reliable hint: if a text editor cannot show meaningful content, inspect the file header and consider whether it is actually an archive.",
      archiveButton: "I have downloaded the cloud-drive file",
      renameTitle: "Inspect the File Format",
      renameDescription:
        "Try changing the downloaded file extension from .txt to .zip, then open it with an archive utility.",
      renameButton: "I renamed it to ZIP and extracted it",

      answerTitle: "Extraction Result",
      answerDescription:
        "Enter the string found inside the extracted archive. Preserve its original capitalization.",
      answerLabel: "Extracted string",
      answerPlaceholder: "Enter the string…",
      submit: "Verify",
      wrongAnswer: "Incorrect string. Check the extracted text again.",
      correctAnswer: "Verified. You know where to go next.",

      continue: "Return to Stage 3",
      reset: "Reset Stage",

      narrator:
        "It's just a WAV file. Download it, listen to it, and tell me what you find. Don't tell me you're going to type its filename into a search box.",

      narratorFound:
        "Oh? You actually reconstructed the image. Fine. Let's see if you can handle the downloaded file.",

      narratorSolved:
        "Congratulations. After all that, you have a string. Now think about the search box in Stage 3.",

      progress1: "Audio not downloaded",
      progress2: "Audio downloaded",
      progress3: "Decoded image confirmed",
      progress4: "ZIP extraction confirmed",
      progress5: "String verified"
    }
  };

  function lang() {
    return I18n.getLanguage() === "en" ? "en" : "zh-CN";
  }

  function t(key) {
    return TEXT[lang()][key] ?? key;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getAudioUrl() {
    return Router.toUrl(AUDIO_PATH);
  }

  function render() {
    if (!root) return;

    root.innerHTML = `
      <section class="page page--reading stage08">

        <header class="page-header">
          <p class="page-eyebrow">${escapeHTML(t("eyebrow"))}</p>
          <h1 class="page-title">${escapeHTML(t("title"))}</h1>
          <p class="page-description">${escapeHTML(t("description"))}</p>
        </header>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("audioTitle"))}</h2>

          <p>
            <strong>${escapeHTML(t("audioName"))}</strong>
          </p>

          <p>${escapeHTML(t("audioInfo"))}</p>

          <audio
            controls
            preload="none"
            style="width: 100%"
            aria-label="${escapeHTML(t("audioName"))}"
          >
            <source src="${escapeHTML(getAudioUrl())}" type="audio/wav">
          </audio>

          <a
            id="stage08-download-audio"
            class="primary-button"
            href="${escapeHTML(getAudioUrl())}"
            download="sstv-martin1.wav"
          >
            ${escapeHTML(t("download"))}
          </a>

          <p id="stage08-audio-status" aria-live="polite">
            ${escapeHTML(state.downloaded ? t("downloadDone") : t("progress1"))}
          </p>
        </section>

        <section class="panel content-stack">
          <h2>${escapeHTML(t("decoderTitle"))}</h2>
          <p>${escapeHTML(t("decoderDescription"))}</p>

          <a
            class="secondary-button"
            href="${SSTV_URL}"
            target="_blank"
            rel="noopener noreferrer"
            id="stage08-decoder-link"
          >
            ${escapeHTML(t("decoderLink"))}
          </a>

          <p>${escapeHTML(t("decoderSteps"))}</p>

          <button
            id="stage08-decoded"
            class="primary-button"
            type="button"
            ${state.downloaded ? "" : "disabled"}
          >
            ${escapeHTML(t("decodedButton"))}
          </button>

          <div id="stage08-image-panel" ${state.foundImage ? "" : "hidden"}>
            <h3>${escapeHTML(t("imageTitle"))}</h3>
            <p>${escapeHTML(t("imageDescription"))}</p>

            <button
              id="stage08-image-confirm"
              class="secondary-button"
              type="button"
            >
              ${escapeHTML(t("imageConfirm"))}
            </button>

            <p>${escapeHTML(t("imageNext"))}</p>
          </div>
        </section>

        <section
          id="stage08-archive-panel"
          class="panel content-stack"
          ${state.foundImage ? "" : "hidden"}
        >
          <h2>${escapeHTML(t("archiveTitle"))}</h2>
          <p>${escapeHTML(t("archiveDescription"))}</p>

          <p>
            <a
              href="${CLOUD_URL}"
              target="_blank"
              rel="noopener noreferrer"
            >${escapeHTML(CLOUD_URL)}</a>
          </p>

          <p>
            ${lang() === "en" ? "Extraction password" : "网盘提取密码"}：
            <strong>${CLOUD_PASSWORD}</strong>
          </p>

          <button
            id="stage08-downloaded-archive"
            class="secondary-button"
            type="button"
          >
            ${escapeHTML(t("archiveButton"))}
          </button>

          <div id="stage08-rename-panel" ${state.downloadedArchive ? "" : "hidden"}>
            <h3>${escapeHTML(t("renameTitle"))}</h3>
            <p>${escapeHTML(t("renameDescription"))}</p>
            <p>${escapeHTML(t("archiveHint"))}</p>

            <button
              id="stage08-extracted"
              class="primary-button"
              type="button"
            >
              ${escapeHTML(t("renameButton"))}
            </button>
          </div>
        </section>

        <section
          id="stage08-answer-panel"
          class="panel content-stack"
          ${state.extracted ? "" : "hidden"}
        >
          <h2>${escapeHTML(t("answerTitle"))}</h2>
          <p>${escapeHTML(t("answerDescription"))}</p>

          <form id="stage08-answer-form" class="content-stack">
            <label for="stage08-answer">
              ${escapeHTML(t("answerLabel"))}
            </label>

            <input
              id="stage08-answer"
              name="answer"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="${escapeHTML(t("answerPlaceholder"))}"
              required
            >

            <button class="primary-button" type="submit">
              ${escapeHTML(t("submit"))}
            </button>
          </form>

          <p id="stage08-answer-status" aria-live="polite"></p>

          <button
            id="stage08-continue"
            class="primary-button"
            type="button"
            ${state.solved ? "" : "hidden"}
          >
            ${escapeHTML(t("continue"))}
          </button>
        </section>

        <section class="page-section">
          <details>
            <summary>${lang() === "en" ? "Reliable hint" : "可靠提示"}</summary>
            <p>${escapeHTML(t("archiveHint"))}</p>
          </details>
        </section>

        <section class="page-section">
          <button id="stage08-reset" class="secondary-button" type="button">
            ${escapeHTML(t("reset"))}
          </button>
        </section>

      </section>
    `;

    root.querySelector("#stage08-download-audio")
      ?.addEventListener("click", () => {
        state.downloaded = true;

        const status = root?.querySelector("#stage08-audio-status");
        if (status) status.textContent = t("downloadDone");

        const decodedButton = root?.querySelector("#stage08-decoded");
        if (decodedButton) decodedButton.disabled = false;
      });

    root.querySelector("#stage08-decoder-link")
      ?.addEventListener("click", () => {
        state.openedDecoder = true;
      });

    root.querySelector("#stage08-decoded")
      ?.addEventListener("click", () => {
        if (!state.downloaded) return;

        state.foundImage = true;

        const panel = root.querySelector("#stage08-image-panel");
        if (panel) panel.hidden = false;

        const archive = root.querySelector("#stage08-archive-panel");
        if (archive) archive.hidden = false;

        Narrator.speakCustom({
          zh: TEXT["zh-CN"].narratorFound,
          en: TEXT.en.narratorFound
        }, "impressed");
      });

    root.querySelector("#stage08-image-confirm")
      ?.addEventListener("click", () => {
        state.foundImage = true;

        const panel = root.querySelector("#stage08-archive-panel");
        if (panel) panel.hidden = false;
      });

    root.querySelector("#stage08-downloaded-archive")
      ?.addEventListener("click", () => {
        if (!state.foundImage) return;

        state.downloadedArchive = true;

        const panel = root.querySelector("#stage08-rename-panel");
        if (panel) panel.hidden = false;
      });

    root.querySelector("#stage08-extracted")
      ?.addEventListener("click", () => {
        if (!state.downloadedArchive) return;

        state.extracted = true;

        const panel = root.querySelector("#stage08-answer-panel");
        if (panel) panel.hidden = false;

        root.querySelector("#stage08-answer")?.focus();
      });

    root.querySelector("#stage08-answer-form")
      ?.addEventListener("submit", checkAnswer);

    root.querySelector("#stage08-continue")
      ?.addEventListener("click", returnToStage03);

    root.querySelector("#stage08-reset")
      ?.addEventListener("click", reset);
  }

  function checkAnswer(event) {
    event.preventDefault();

    if (!state.extracted || !root) return;

    const input = root.querySelector("#stage08-answer");
    const status = root.querySelector("#stage08-answer-status");
    const answer = String(input?.value ?? "").trim();

    if (answer !== ANSWER) {
      if (status) status.textContent = t("wrongAnswer");

      Narrator.reactTo("failed-answer", {
        stage: 8
      });

      return;
    }

    state.solved = true;

    if (status) status.textContent = t("correctAnswer");

    const button = root.querySelector("#stage08-continue");
    if (button) button.hidden = false;

    Narrator.speakCustom({
      zh: TEXT["zh-CN"].narratorSolved,
      en: TEXT.en.narratorSolved
    }, "impressed");
  }

  function returnToStage03() {
    if (!state.solved) return;

    Progress.completeStage(8);

    // The extracted string is the search query required by Stage 03.
    // Pass it as a query parameter so Stage 03 can prefill its search box.
    const target = new URL(
      Router.toUrl("/stage/03/"),
      window.location.origin
    );

    target.searchParams.set("search", ANSWER);

    Router.navigate(target.pathname + target.search);
  }

  function reset() {
    state.downloaded = false;
    state.openedDecoder = false;
    state.foundImage = false;
    state.downloadedArchive = false;
    state.extracted = false;
    state.solved = false;

    render();
  }

  function onLanguageChange() {
    if (!root) return;

    const snapshot = { ...state };
    render();
    Object.assign(state, snapshot);
    render();
  }

  function mount(container) {
    root = container;

    state.downloaded = false;
    state.openedDecoder = false;
    state.foundImage = false;
    state.downloadedArchive = false;
    state.extracted = false;
    state.solved = false;

    render();

    languageListener = onLanguageChange;
    window.addEventListener("languagechange", languageListener);

    Narrator.setStage(8);

    Narrator.speakCustom({
      zh: TEXT["zh-CN"].narrator,
      en: TEXT.en.narrator
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

  function getState() {
    return { ...state };
  }

  return {
    mount,
    unmount,
    getState
  };
})();

export default Stage08;
