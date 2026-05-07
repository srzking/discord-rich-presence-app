const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const { t: tFn } = window.__I18N__;
const t = (l, k) => window.__aura_t ? window.__aura_t(l, k) : tFn(l, k);

const PLATFORMS = [
  ["youtube","YouTube"],["netflix","Netflix"],["spotify","Spotify"],["twitch","Twitch"],
  ["github","GitHub"],["x","X"],["reddit","Reddit"],["soundcloud","SoundCloud"],
  ["primevideo","Prime Video"],["disneyplus","Disney+"],["hbomax","Max"],
  ["crunchyroll","Crunchyroll"],["stackoverflow","Stack Overflow"],
  ["wikipedia","Wikipedia"],["vscode","VS Code Web"],
  ["applemusic","Apple Music"],["tidal","Tidal"],["deezer","Deezer"],
  ["vimeo","Vimeo"],["linkedin","LinkedIn"],["medium","Medium"],
  ["notion","Notion"],["figma","Figma"],["chatgpt","ChatGPT"],
  ["gmail","Gmail"],["pinterest","Pinterest"],["tiktok","TikTok"],
];

let lang = "en";

function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => { el.textContent = t(lang, el.dataset.i18n); });
  $$("[data-i18n-ph]").forEach(el => { el.placeholder = t(lang, el.dataset.i18nPh); });
  renderPlatforms();
}

$$(".tabs button").forEach(b => b.addEventListener("click", () => {
  $$(".tabs button").forEach(x => x.classList.remove("active"));
  $$(".pane").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  $(`[data-pane="${b.dataset.tab}"]`).classList.add("active");
  if (b.dataset.tab === "logs") loadLogs();
}));

let cachedDisabled = new Set();

function renderPlatforms() {
  const filter = ($("#appSearch")?.value || "").toLowerCase();
  $("#platformList").innerHTML = PLATFORMS
    .filter(([_, n]) => n.toLowerCase().includes(filter))
    .map(([id, name]) => `
      <label class="platform">
        <span>${name}</span>
        <input type="checkbox" data-pid="${id}" ${cachedDisabled.has(id) ? "" : "checked"} />
      </label>
    `).join("");
  $$("#platformList input").forEach(i => i.addEventListener("change", savePlatforms));
}

async function load() {
  const cfg = await chrome.storage.local.get(null);
  lang = cfg.lang || (navigator.language || "en").slice(0,2);
  if (!["en","pt","es"].includes(lang)) lang = "en";
  $("#lang").value = lang;
  $("#token").value = cfg.token || "";
  $("#appId").value = cfg.appId || "";
  $("#statusSel").value = cfg.status || "online";
  $("#customText").value = cfg.customText || "";
  $("#customType").value = cfg.customType ?? "0";
  $("#idleAway").checked = cfg.idleAway !== false;
  $("#skipIncognito").checked = cfg.skipIncognito !== false;
  $("#enabled").checked = cfg.enabled !== false;
  if ($("#showButtons")) $("#showButtons").checked = cfg.showButtons !== false;
  if ($("#showThumbnails")) $("#showThumbnails").checked = cfg.showThumbnails !== false;
  if ($("#notifyOnConnect")) $("#notifyOnConnect").checked = cfg.notifyOnConnect !== false;
  cachedDisabled = new Set(cfg.disabledPlatforms || []);

  applyLang();
  refreshStatus();
}

function renderBot(botUser, connected) {
  const card = $("#botCard");
  if (!botUser) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");
  $("#botName").textContent = botUser.username;
  $("#botPing").className = "pill " + (connected ? "on" : "off");
  const av = botUser.avatar
    ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${(parseInt(botUser.id) >> 22) % 6}.png`;
  $("#botAvatar").src = av;
}

function refreshStatus() {
  chrome.runtime.sendMessage({ type: "status:get" }, async (res) => {
    if (chrome.runtime.lastError || !res) return;
    const pill = $("#statusPill");
    pill.textContent = __aura_t(lang, res.connected ? "connected" : "offline");
    pill.className = "pill " + (res.connected ? "on" : "off");
    renderBot(res.botUser, res.connected);
    const a = res.activity;
    $("#actName").textContent = a ? a.name : "—";
    $("#actDetails").textContent = a?.details || "";
    $("#actState").textContent = a?.state || "";
    const thumb = $("#actThumb");
    if (a?.thumbnail) { thumb.src = a.thumbnail; thumb.classList.remove("hidden"); }
    else thumb.classList.add("hidden");
    const { trackedToday = {} } = await chrome.storage.local.get("trackedToday");
    const today = new Date().toISOString().slice(0,10);
    $("#todayMin").textContent = Math.round((trackedToday[today] || 0) / 60);
    // Top apps
    const top = $("#topApps");
    if (top) {
      const entries = Object.entries(res.trackedByApp || {})
        .filter(([k]) => k.startsWith(today + ":"))
        .map(([k,v]) => [k.split(":")[1], v])
        .sort((a,b) => b[1]-a[1]).slice(0,5);
      if (!entries.length) top.innerHTML = `<div class="muted small" style="padding:6px">${__aura_t(lang,"noApps")}</div>`;
      else {
        const max = entries[0][1];
        top.innerHTML = entries.map(([id,sec]) => {
          const name = (PLATFORMS.find(p=>p[0]===id)||[id,id])[1];
          const pct = Math.max(8, Math.round(sec/max*100));
          return `<div class="ta-row"><span>${name}</span><span class="ta-bar"><span style="width:${pct}%"></span></span><span class="muted small">${Math.round(sec/60)}m</span></div>`;
        }).join("");
      }
    }
  });
}

async function send(data, reconnect = false) {
  return new Promise(r => chrome.runtime.sendMessage({ type: "config:save", data, reconnect }, r));
}

async function loadLogs() {
  chrome.runtime.sendMessage({ type: "logs:get" }, (res) => {
    const list = $("#logList");
    if (!res?.logs?.length) { list.innerHTML = `<div class="muted small" style="padding:14px;text-align:center">${t(lang,"noLogs")}</div>`; return; }
    list.innerHTML = res.logs.map(l => {
      const time = new Date(l.t).toLocaleTimeString();
      return `<div class="log log-${l.level}"><span class="log-time">${time}</span><span class="log-msg">${l.message}</span></div>`;
    }).join("");
  });
}

$("#lang").addEventListener("change", async () => {
  lang = $("#lang").value;
  await send({ lang });
  applyLang();
  refreshStatus();
});

$("#save").addEventListener("click", async () => {
  const token = $("#token").value.trim();
  const appId = $("#appId").value.trim();
  if (!token) return alert(t(lang, "enterToken"));
  $("#save").disabled = true; $("#save").textContent = t(lang, "loggingIn");
  const status = $("#loginStatus");
  status.className = "login-status info"; status.classList.remove("hidden");
  status.textContent = t(lang, "validating");
  // Test token first
  chrome.runtime.sendMessage({ type: "auth:test", token }, async (res) => {
    if (!res?.ok) {
      status.className = "login-status err";
      status.textContent = t(lang, "loginFailed") + (res?.status ? ` (${res.status})` : "");
      $("#save").disabled = false; $("#save").textContent = t(lang, "loginConnect");
      return;
    }
    status.className = "login-status ok";
    status.textContent = `✓ ${t(lang, "loggedAs")} ${res.user.username}`;
    await send({ token, appId }, true);
    setTimeout(() => {
      $("#save").disabled = false;
      $("#save").textContent = t(lang, "loginConnect");
      refreshStatus();
    }, 800);
  });
});

$("#statusSel").addEventListener("change", () => send({ status: $("#statusSel").value }));
$("#enabled").addEventListener("change", () => send({ enabled: $("#enabled").checked }, true));
$("#idleAway").addEventListener("change", () => send({ idleAway: $("#idleAway").checked }));
$("#skipIncognito").addEventListener("change", () => send({ skipIncognito: $("#skipIncognito").checked }));
$("#showButtons")?.addEventListener("change", () => send({ showButtons: $("#showButtons").checked }));
$("#showThumbnails")?.addEventListener("change", () => send({ showThumbnails: $("#showThumbnails").checked }));
$("#notifyOnConnect")?.addEventListener("change", () => send({ notifyOnConnect: $("#notifyOnConnect").checked }));

$("#saveCustom").addEventListener("click", () =>
  send({ customText: $("#customText").value.trim(), customType: $("#customType").value }));
$("#clearCustom").addEventListener("click", async () => { $("#customText").value = ""; await send({ customText: "" }); });

$("#clear").addEventListener("click", () => chrome.runtime.sendMessage({ type: "presence:clear" }, refreshStatus));
$("#disconnectBtn").addEventListener("click", () => chrome.runtime.sendMessage({ type: "disconnect" }, () => { refreshStatus(); load(); }));

$("#appSearch").addEventListener("input", renderPlatforms);
$("#refreshLogs").addEventListener("click", loadLogs);
$("#clearLogs").addEventListener("click", () => chrome.runtime.sendMessage({ type: "logs:clear" }, loadLogs));

function savePlatforms() {
  const disabled = [...$$("#platformList input")].filter(i => !i.checked).map(i => i.dataset.pid);
  cachedDisabled = new Set(disabled);
  send({ disabledPlatforms: disabled });
}

$("#exportBtn").addEventListener("click", async () => {
  const cfg = await chrome.storage.local.get(null);
  delete cfg.token;
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "aura-config.json";
  a.click();
});
$("#importBtn").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await send(data);
    alert(t(lang, "imported"));
    load();
  } catch { alert(t(lang, "invalidFile")); }
});

$("#resetBtn")?.addEventListener("click", async () => {
  if (!confirm(t(lang, "resetConfirm"))) return;
  await new Promise(r => chrome.storage.local.clear(r));
  chrome.runtime.sendMessage({ type: "disconnect" }, () => load());
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "log:new" && $("[data-pane='logs']").classList.contains("active")) loadLogs();
  if (msg.type === "auth:ok" || msg.type === "auth:failed") refreshStatus();
});

load();
setInterval(refreshStatus, 3000);
