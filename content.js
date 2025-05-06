(async () => {
  console.log("ModAssist content.js loaded on", window.location.href);

  // 設定の読み込み
  async function loadSettings() {
    try {
      return await new Promise((resolve) => {
        chrome.storage.sync.get(null, resolve);
      });
    } catch (e) {
      return {};
    }
  }

  const config = await loadSettings();
  const detailedMode = config.enableAdvanced === true;
  const groups =
    detailedMode && Array.isArray(config.groups)
      ? config.groups
      : [
          {
            highlightWords: config.highlightWords || "",
            ignoreWords: config.ignoreWords || "",
            highlightColor: config.highlightColor || "#ffff00",
            textColor: config.textColor || "#000000",
            useRegex: config.useRegex || "false",
          },
        ];

  // ハイライトすべきか判定
  function shouldHighlight(text, group) {
    const lowerText = text.toLowerCase();
    const highlightWords = group.highlightWords
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    const ignoreWords = group.ignoreWords
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    const useRegex = group.useRegex === "true";

    if (ignoreWords.some((word) => lowerText.includes(word.toLowerCase())))
      return false;

    return highlightWords.some((word) => {
      if (useRegex) {
        try {
          return new RegExp(word, "i").test(text);
        } catch (e) {
          console.error("ModAssist: 正規表現エラー", e, word);
          return false;
        }
      }
      return lowerText.includes(word.toLowerCase());
    });
  }

  // コメントのハイライト
  function highlightComment(node) {
    const messageNode =
      node.querySelector("#message") || node.querySelector(".message") || node;
    if (!messageNode) return;

    const text = messageNode.textContent;

    for (const group of groups) {
      if (shouldHighlight(text, group)) {
        messageNode.style.backgroundColor = group.highlightColor || "#ffff00";
        messageNode.style.color = group.textColor || "#000000";
        break;
      }
    }
  }

  // コメントの監視
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.tagName === "YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER"
        ) {
          highlightComment(node);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
