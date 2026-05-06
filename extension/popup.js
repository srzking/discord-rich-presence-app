const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const PLATFORMS = [
  ["youtube","YouTube"],["netflix","Netflix"],["spotify","Spotify"],["twitch","Twitch"],
  ["github","GitHub"],["x","X"],["reddit","Reddit"],["soundcloud","SoundCloud"],
  ["primevideo","Prime Video"],["disneyplus","Disney+"],["hbomax","Max"],
  ["crunchyroll","Crunchyroll"],["stackoverflow","Stack Overflow"],
  ["wikipedia","Wikipedia"],["vscode","VS Code Web"]
];

// Tabs
$$(".tabs button").forEach(b => b.addEventListener("click", () => {
  $$(".tabs button").forEach(x => x.classList.remove("active"));
  $$(".pane").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  $(`[data-pane="${b.dataset.tab}"]`).classList.add("active");
}));

async function load() {
  const cfg = await chrome.storage.local.get(null);
  $("#token").value = cfg.token || "";
  $("#appId").value = cfg.appId || "";
  $("#statusSel").value = cfg.status || "online";
  $("#customText").value = cfg.customText || "";
  $("#customType").value = cfg.customType ?? "0";
  $("#idleAway").checked = cfg.idleAway !== false;
  $("#skipIncognito").checked = cfg.skipIncognito !== false;
  $("#enabled").checked = cfg.enabled !== false;

  const disabled = new Set(cfg.disabledPlatforms || []);
  $("#platformList").innerHTML = PLATFORMS.map(([id, name]) => `
    <label class="platform">
      <span>${name}</span>
      <input type="checkbox" data-pid="${id}" ${disabled.has(id) ? "" : "checked"} />
    </label>
  `).join("");
  $$("#platformList input").forEach(i => i.addEventListener("change", savePlatforms));

  refreshStatus();
}

function refreshStatus() {
  chrome.runtime.sendMessage({ type: "status:get" }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    const pill = $("#statusPill");
    pill.textContent = res.connected ? "connected" : "offline";
    pill.className = "pill " + (res.connected ? "on" : "off");
    const a = res.activity;
    $("#actName").textContent = a ? a.name : "—";
    $("#actDetails").textContent = a?.details || "";
    $("#actState").textContent = a?.state || "";
  });
}

async function send(data, reconnect = false) {
  return new Promise(r => chrome.runtime.sendMessage({ type: "config:save", data, reconnect }, r));
}

$("#save").addEventListener("click", async () => {
  const data = { token: $("#token").value.trim(), appId: $("#appId").value.trim() };
  if (!data.token) return alert("Please enter your bot token.");
  $("#save").disabled = true; $("#save").textContent = "Connecting…";
  await send(data, true);
  setTimeout(() => { $("#save").disabled = false; $("#save").textContent = "Save & Connect"; refreshStatus(); }, 800);
});

$("#statusSel").addEventListener("change", () => send({ status: $("#statusSel").value }));
$("#enabled").addEventListener("change", async () => {
  await send({ enabled: $("#enabled").checked }, true);
});
$("#idleAway").addEventListener("change", () => send({ idleAway: $("#idleAway").checked }));
$("#skipIncognito").addEventListener("change", () => send({ skipIncognito: $("#skipIncognito").checked }));

$("#saveCustom").addEventListener("click", () =>
  send({ customText: $("#customText").value.trim(), customType: $("#customType").value })
);
$("#clearCustom").addEventListener("click", async () => {
  $("#customText").value = "";
  await send({ customText: "" });
});

$("#clear").addEventListener("click", () =>
  chrome.runtime.sendMessage({ type: "presence:clear" }, refreshStatus));

$("#disconnectBtn").addEventListener("click", () =>
  chrome.runtime.sendMessage({ type: "disconnect" }, refreshStatus));

function savePlatforms() {
  const disabled = [...$$("#platformList input")].filter(i => !i.checked).map(i => i.dataset.pid);
  send({ disabledPlatforms: disabled });
}

load();
setInterval(refreshStatus, 3000);
