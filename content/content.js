(() => {
  "use strict";

  const DEFAULT_SETTINGS = {
    hideStories: true,
    hideAds: true,
    hideReels: false,
    hideRightRail: false,
    hideChat: false,
    hideHomeFeed: false,
    hideGroupsSuggestions: false,
    hideWatch: false,
  };

  const CLASS_MAP = {
    hideStories: "fbc-hide-stories",
    hideReels: "fbc-hide-reels",
    hideRightRail: "fbc-hide-right-rail",
    hideChat: "fbc-hide-chat",
    hideHomeFeed: "fbc-hide-home-feed",
    hideGroupsSuggestions: "fbc-hide-groups-suggestions",
    hideWatch: "fbc-hide-watch",
  };

  /** Sponsored labels in EN + VI (and common variants). */
  const SPONSORED_RE =
    /^(sponsored|được tài trợ|Được tài trợ|Commandité|Gesponsert|Sponsorizzato|Publicidad|Sponsorowane)$/i;

  const SUGGESTION_HINTS = [
    "suggested for you",
    "gợi ý cho bạn",
    "people you may know",
    "những người bạn có thể biết",
    "suggested groups",
    "nhóm gợi ý",
  ];

  let settings = { ...DEFAULT_SETTINGS };
  let scheduled = false;

  function applyRootClasses() {
    const root = document.documentElement;
    for (const [key, className] of Object.entries(CLASS_MAP)) {
      root.classList.toggle(className, Boolean(settings[key]));
    }
  }

  function ensureFeedPlaceholder() {
    const existing = document.getElementById("fbc-feed-placeholder");
    if (!settings.hideHomeFeed) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const feed = document.querySelector('div[role="feed"]');
    if (!feed || !feed.parentElement) return;

    const box = document.createElement("div");
    box.id = "fbc-feed-placeholder";
    box.className = "fbc-feed-placeholder";
    box.textContent =
      "Bảng tin đang được ẩn bởi FB Clean. Tắt tùy chọn «Ẩn bảng tin» trong popup để hiện lại.";
    feed.parentElement.insertBefore(box, feed);
  }

  function visibleText(el) {
    // Facebook often splits "Sponsored" across hidden <span>/<b> nodes.
    return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function findArticle(node) {
    return (
      node.closest('div[role="article"]') ||
      node.closest('[data-pagelet^="FeedUnit_"]') ||
      node.closest('[data-pagelet^="FeedUnit"]')
    );
  }

  function markHidden(el, reason) {
    if (!el) return;
    el.classList.add("fbc-hidden");
    el.setAttribute("data-fbc-hidden", reason || "1");
  }

  function clearDynamicHides(reason) {
    const selector = reason
      ? `[data-fbc-hidden="${reason}"]`
      : "[data-fbc-hidden]";
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.remove("fbc-hidden");
      el.removeAttribute("data-fbc-hidden");
    });
  }

  function hideSponsoredPosts() {
    if (!settings.hideAds) return;

    document
      .querySelectorAll(
        '[aria-label="Sponsored"], [aria-label="Được tài trợ"], a[href*="/ads/about"]'
      )
      .forEach((node) => {
        const article = findArticle(node);
        if (article) markHidden(article, "ads");
      });

    const candidates = document.querySelectorAll(
      'div[role="article"], [data-pagelet^="FeedUnit_"]'
    );
    candidates.forEach((article) => {
      if (article.getAttribute("data-fbc-hidden") === "ads") return;

      const spans = article.querySelectorAll("span, a");
      for (const span of spans) {
        const text = visibleText(span);
        if (!text || text.length > 40) continue;
        if (SPONSORED_RE.test(text)) {
          markHidden(article, "ads");
          return;
        }
      }
    });
  }

  function hideStoriesRuntime() {
    if (!settings.hideStories) return;
    document
      .querySelectorAll(
        '[data-pagelet="Stories"], [aria-label="Stories"], [aria-label="Tin"], div[role="region"]'
      )
      .forEach((el) => {
        const label = (el.getAttribute("aria-label") || "").toLowerCase();
        const pagelet = el.getAttribute("data-pagelet") || "";
        if (
          pagelet === "Stories" ||
          label.includes("stories") ||
          label === "tin" ||
          label.includes("tin của bạn")
        ) {
          markHidden(el, "stories");
        }
      });
  }

  function hideReelsInFeed() {
    if (!settings.hideReels) return;
    document.querySelectorAll('div[role="article"]').forEach((article) => {
      if (article.querySelector('a[href*="/reel/"]')) {
        markHidden(article, "reels");
      }
    });
  }

  function hideSuggestionBlocks() {
    if (!settings.hideGroupsSuggestions) return;
    document
      .querySelectorAll('div[role="article"], div[role="region"]')
      .forEach((block) => {
        const text = visibleText(block).toLowerCase();
        if (!text || text.length > 400) return;
        if (SUGGESTION_HINTS.some((h) => text.includes(h))) {
          markHidden(block, "suggestions");
        }
      });
  }

  /** Incremental pass used by MutationObserver — only marks new matches. */
  function applyIncremental() {
    applyRootClasses();
    hideSponsoredPosts();
    hideStoriesRuntime();
    hideReelsInFeed();
    hideSuggestionBlocks();
    ensureFeedPlaceholder();
  }

  /** Full re-sync after settings change — unhides then re-applies. */
  function applyFull() {
    clearDynamicHides();
    applyIncremental();
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyIncremental();
    });
  }

  function loadAndApply() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      settings = { ...DEFAULT_SETTINGS, ...result };
      applyFull();
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    let touched = false;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in DEFAULT_SETTINGS) {
        settings[key] = newValue;
        touched = true;
      }
    }
    if (touched) applyFull();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "fbc:settings") {
      settings = { ...DEFAULT_SETTINGS, ...message.settings };
      applyFull();
      sendResponse({ ok: true });
    }
    return false;
  });

  const observer = new MutationObserver(() => scheduleApply());

  function startObserver() {
    if (!document.documentElement) return;
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  loadAndApply();
  startObserver();
})();
