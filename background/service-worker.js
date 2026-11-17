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

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(null);
  const merged = { ...DEFAULT_SETTINGS, ...current };
  await chrome.storage.sync.set(merged);
});
