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

const statusEl = document.getElementById("status");
const inputs = [...document.querySelectorAll("input[data-key]")];

function setStatus(text) {
  statusEl.textContent = text;
}

async function readSettings() {
  return chrome.storage.sync.get(DEFAULT_SETTINGS);
}

async function writeSettings(settings) {
  await chrome.storage.sync.set(settings);
}

function paint(settings) {
  inputs.forEach((input) => {
    const key = input.dataset.key;
    input.checked = Boolean(settings[key]);
  });
}

async function init() {
  const settings = await readSettings();
  paint(settings);
  setStatus("Sẵn sàng");

  inputs.forEach((input) => {
    input.addEventListener("change", async () => {
      const next = await readSettings();
      next[input.dataset.key] = input.checked;
      await writeSettings(next);
      setStatus("Đã cập nhật");
    });
  });

  document.getElementById("btn-defaults").addEventListener("click", async () => {
    await writeSettings({ ...DEFAULT_SETTINGS });
    paint(DEFAULT_SETTINGS);
    setStatus("Đã đặt lại mặc định");
  });
}

init();
