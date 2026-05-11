const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const t = window.__I18N__.t;

// [id, name, category]
// [id, name, category, host-for-favicon]
const PLATFORMS = [
  ["youtube","YouTube","streaming","youtube.com"],["netflix","Netflix","streaming","netflix.com"],["primevideo","Prime Video","streaming","primevideo.com"],
  ["disneyplus","Disney+","streaming","disneyplus.com"],["hbomax","Max","streaming","max.com"],["crunchyroll","Crunchyroll","streaming","crunchyroll.com"],
  ["twitch","Twitch","streaming","twitch.tv"],["kick","Kick","streaming","kick.com"],["vimeo","Vimeo","streaming","vimeo.com"],["tiktok","TikTok","streaming","tiktok.com"],
  ["spotify","Spotify","music","open.spotify.com"],["soundcloud","SoundCloud","music","soundcloud.com"],["applemusic","Apple Music","music","music.apple.com"],
  ["tidal","Tidal","music","tidal.com"],["deezer","Deezer","music","deezer.com"],["lastfm","Last.fm","music","last.fm"],
  ["bandcamp","Bandcamp","music","bandcamp.com"],["genius","Genius","music","genius.com"],
  ["github","GitHub","dev","github.com"],["gitlab","GitLab","dev","gitlab.com"],["stackoverflow","Stack Overflow","dev","stackoverflow.com"],
  ["vscode","VS Code Web","dev","vscode.dev"],["mdn","MDN","dev","developer.mozilla.org"],["figma","Figma","dev","figma.com"],
  ["huggingface","Hugging Face","dev","huggingface.co"],
  ["x","X","social","x.com"],["reddit","Reddit","social","reddit.com"],["instagram","Instagram","social","instagram.com"],
  ["linkedin","LinkedIn","social","linkedin.com"],["pinterest","Pinterest","social","pinterest.com"],["letterboxd","Letterboxd","social","letterboxd.com"],
  ["anilist","AniList","social","anilist.co"],["mal","MyAnimeList","social","myanimelist.net"],["steam","Steam","social","steampowered.com"],
  ["telegram","Telegram","social","telegram.org"],["whatsapp","WhatsApp","social","whatsapp.com"],["discordweb","Discord Web","social","discord.com"],
  ["chatgpt","ChatGPT","ai","chatgpt.com"],["claude","Claude","ai","claude.ai"],["gemini","Gemini","ai","gemini.google.com"],["perplexity","Perplexity","ai","perplexity.ai"],
  ["coursera","Coursera","learning","coursera.org"],["udemy","Udemy","learning","udemy.com"],["khan","Khan Academy","learning","khanacademy.org"],
  ["duolingo","Duolingo","learning","duolingo.com"],
  ["notion","Notion","productivity","notion.so"],["gmail","Gmail","productivity","mail.google.com"],["medium","Medium","productivity","medium.com"],
  ["wikipedia","Wikipedia","productivity","wikipedia.org"],["googledocs","Google Docs","productivity","docs.google.com"],["fandom","Fandom","productivity","fandom.com"],
  ["pawsy","Pawsy","furry","pawsy.fun"],["furaffinity","FurAffinity","furry","furaffinity.net"],["e621","e621","furry","e621.net"],
  ["roblox","Roblox","gaming","roblox.com"],["itchio","itch.io","gaming","itch.io"],["epic","Epic Games","gaming","epicgames.com"],
  ["amazon","Amazon","shopping","amazon.com"],["ebay","eBay","shopping","ebay.com"],["aliexpress","AliExpress","shopping","aliexpress.com"],
];

const CATEGORIES = ["streaming","music","dev","ai","social","gaming","furry","learning","productivity","shopping","other"];

function favicon(host) { return `https://www.google.com/s2/favicons?sz=32&domain=${host}`; }

let lang = "en";

function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => { el.textContent = t(lang, el.dataset.i18n); });
  $$("[data-i18n-ph]").forEach(el => { el.placeholder = t(lang, el.dataset.i18nPh); });
  renderPlatforms();
  updatePreview();
}

$$(".tabs button").forEach(b => b.addEventListener("click", () => {
  $$(".tabs button").forEach(x => x.classList.remove("active"));
  $$(".pane").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  $(`[data-pane="${b.dataset.tab}"]`).classList.add("active");
  if (b.dataset.tab === "settings") loadLogs();
}));

let cachedDisabled = new Set();

function renderPlatforms() {
  const filter = ($("#appSearch")?.value || "").toLowerCase();
  const list = $("#platformList");
  let html = "";
  for (const cat of CATEGORIES) {
    const items = PLATFORMS.filter(([id,name,c]) => (c||"other") === cat && name.toLowerCase().includes(filter));
    if (!items.length) continue;
    html += `<div class="cat-head">${t(lang,"cat_"+cat)} <span class="muted">(${items.length})</span></div>`;
    html += items.map(([id, name, c, host]) => `
      <label class="platform">
        <img class="pf-ico" src="${favicon(host||"")}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
        <span class="pf-name">${name}</span>
        <input type="checkbox" data-pid="${id}" ${cachedDisabled.has(id) ? "" : "checked"} />
      </label>`).join("");
  }
  list.innerHTML = html;
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
  if ($("#customState")) $("#customState").value = cfg.customState || "";
  if ($("#customImg")) $("#customImg").value = cfg.customImg || "";
  $("#idleAway").checked = cfg.idleAway !== false;
  $("#skipIncognito").checked = cfg.skipIncognito !== false;
  $("#enabled").checked = cfg.enabled !== false;
  if ($("#showButtons")) $("#showButtons").checked = cfg.showButtons !== false;
  if ($("#showThumbnails")) $("#showThumbnails").checked = cfg.showThumbnails !== false;
  if ($("#notifyOnConnect")) $("#notifyOnConnect").checked = cfg.notifyOnConnect !== false;
  cachedDisabled = new Set(cfg.disabledPlatforms || []);

  applyLang();
  refreshStatus();
  checkUpdate();
}

function renderBot(botUser, connected) {
  const card = $("#botCard");
  if (!botUser) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");
  setText($("#botName"), botUser.username);
  $("#botPing").className = "pill " + (connected ? "on" : "off");
  const av = botUser.avatar
    ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${(parseInt(botUser.id) >> 22) % 6}.png`;
  setSrc($("#botAvatar"), av);
}

async function checkUpdate() {
  const ver = chrome.runtime.getManifest().version;
  const { lastSeenVersion, pendingUpdate } = await chrome.storage.local.get(["lastSeenVersion","pendingUpdate"]);
  setText($("#aboutVer"), "v" + ver);
  if (pendingUpdate && lastSeenVersion !== ver) {
    $("#updateBanner").classList.remove("hidden");
    setText($("#updateVer"), `v${pendingUpdate.from || "?"} → v${ver}`);
  } else {
    $("#updateBanner").classList.add("hidden");
  }
}

function setText(el, val) { if (el && el.textContent !== val) el.textContent = val; }
function setSrc(el, val) { if (el && el.getAttribute("src") !== val) el.src = val; }

function refreshStatus() {
  chrome.runtime.sendMessage({ type: "status:get" }, async (res) => {
    if (chrome.runtime.lastError || !res) return;
    const pill = $("#statusPill");
    const isPaused = res.pausedUntil && res.pausedUntil > Date.now();
    setText(pill, __aura_t(lang, isPaused ? "paused" : (res.connected ? "connected" : "offline")));
    pill.className = "pill " + (isPaused ? "off" : (res.connected ? "on" : "off"));
    renderBot(res.botUser, res.connected);

    const banner = $("#pausedBanner");
    if (banner) {
      if (isPaused) {
        banner.classList.remove("hidden");
        const remain = Math.max(0, Math.round((res.pausedUntil - Date.now()) / 60000));
        setText($("#pausedUntil"), remain > 60 ? `${Math.round(remain/60)}h` : `${remain}m`);
      } else banner.classList.add("hidden");
    }

    const a = res.activity;
    setText($("#actName"), a ? a.name : "—");
    setText($("#actDetails"), a?.details || "");
    setText($("#actState"), a?.state || "");
    const thumb = $("#actThumb");
    if (a?.thumbnail) { setSrc(thumb, a.thumbnail); thumb.classList.remove("hidden"); }
    else thumb.classList.add("hidden");

    const trackedToday = res.trackedToday || {};
    const today = new Date().toISOString().slice(0,10);
    setText($("#todayMin"), String(Math.round((trackedToday[today] || 0) / 60)));

    // Streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const k = dt.toISOString().slice(0,10);
      if ((trackedToday[k] || 0) > 60) streak++; else break;
    }
    setText($("#streakNum"), String(streak));

    // All-time
    const allMin = Math.round(Object.values(trackedToday).reduce((x,y) => x + y, 0) / 60);
    setText($("#allTimeNum"), String(allMin));

    const top = $("#topApps");
    if (top) {
      const entries = Object.entries(res.trackedByApp || {})
        .filter(([k]) => k.startsWith(today + ":"))
        .map(([k,v]) => [k.split(":")[1], v])
        .sort((a,b) => b[1]-a[1]).slice(0,5);
      const html = !entries.length
        ? `<div class="muted small" style="padding:6px">${__aura_t(lang,"noApps")}</div>`
        : (() => {
            const max = entries[0][1];
            return entries.map(([id,sec]) => {
              const p = PLATFORMS.find(p=>p[0]===id);
              const name = p ? p[1] : id;
              const host = p ? p[3] : "";
              const pct = Math.max(8, Math.round(sec/max*100));
              return `<div class="ta-row"><img class="ta-ico" src="${favicon(host)}" onerror="this.style.visibility='hidden'"/><span>${name}</span><span class="ta-bar"><span style="width:${pct}%"></span></span><span class="muted small">${Math.round(sec/60)}m</span></div>`;
            }).join("");
          })();
      if (top.dataset.html !== html) { top.innerHTML = html; top.dataset.html = html; }
    }
  });
}

async function send(data, reconnect = false) {
  return new Promise(r => chrome.runtime.sendMessage({ type: "config:save", data, reconnect }, r));
}

async function loadLogs() {
  chrome.runtime.sendMessage({ type: "logs:get" }, (res) => {
    const list = $("#logList");
    if (!list) return;
    const filter = ($("#logFilter")?.value || "").toLowerCase();
    const logs = (res?.logs || []).filter(l => !filter || (l.message||"").toLowerCase().includes(filter));
    if (!logs.length) { list.innerHTML = `<div class="muted small" style="padding:14px;text-align:center">${t(lang,"noLogs")}</div>`; return; }
    list.innerHTML = logs.map(l => {
      const time = new Date(l.t).toLocaleTimeString();
      return `<div class="log log-${l.level}"><span class="log-time">${time}</span><span class="log-msg">${l.message}</span></div>`;
    }).join("");
  });
}

function updatePreview() {
  const name = ($("#customText")?.value || "").trim() || "—";
  const state = ($("#customState")?.value || "").trim();
  const img = ($("#customImg")?.value || "").trim();
  const type = $("#customType")?.value || "0";
  const labels = { "0": t(lang,"typePlaying"), "2": t(lang,"typeListening"), "3": t(lang,"typeWatching"), "5": t(lang,"typeCompeting") };
  setText($("#previewType"), labels[type] || "");
  setText($("#previewName"), name);
  setText($("#previewState"), state);
  const pi = $("#previewImg");
  if (img) { pi.src = img; pi.style.display = "block"; }
  else { pi.style.display = "none"; }
}

["customText","customState","customImg","customType"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", updatePreview);
  document.getElementById(id)?.addEventListener("change", updatePreview);
});

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
  send({
    customText: $("#customText").value.trim(),
    customState: $("#customState")?.value.trim() || "",
    customImg: $("#customImg")?.value.trim() || "",
    customType: $("#customType").value
  }, true));
$("#clearCustom").addEventListener("click", async () => {
  $("#customText").value = ""; if ($("#customState")) $("#customState").value = "";
  if ($("#customImg")) $("#customImg").value = "";
  await send({ customText: "", customState: "", customImg: "" }, true);
  updatePreview();
});

$("#clear").addEventListener("click", () => chrome.runtime.sendMessage({ type: "presence:clear" }, refreshStatus));
$("#disconnectBtn").addEventListener("click", () => chrome.runtime.sendMessage({ type: "disconnect" }, () => { refreshStatus(); load(); }));

$("#appSearch").addEventListener("input", renderPlatforms);
$("#enableAll")?.addEventListener("click", () => { cachedDisabled = new Set(); renderPlatforms(); send({ disabledPlatforms: [] }); });
$("#disableAll")?.addEventListener("click", () => {
  cachedDisabled = new Set(PLATFORMS.map(p => p[0]));
  renderPlatforms();
  send({ disabledPlatforms: [...cachedDisabled] });
});
$("#refreshLogs").addEventListener("click", loadLogs);
$("#clearLogs").addEventListener("click", () => chrome.runtime.sendMessage({ type: "logs:clear" }, loadLogs));
$("#logFilter")?.addEventListener("input", loadLogs);

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

function openPage(url) { chrome.tabs.create({ url: chrome.runtime.getURL(url) }); }
$("#seeUpdate")?.addEventListener("click", async () => {
  await chrome.storage.local.set({ lastSeenVersion: chrome.runtime.getManifest().version });
  openPage("whatsnew.html");
});
$("#openWhatsNew")?.addEventListener("click", () => openPage("whatsnew.html"));
$("#openWelcome")?.addEventListener("click", () => openPage("welcome.html"));

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "log:new" && $("[data-pane='logs']").classList.contains("active")) loadLogs();
  if (msg.type === "auth:ok" || msg.type === "auth:failed") refreshStatus();
});

load();
setInterval(refreshStatus, 3000);
