// Aura background service worker — v1.2
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const API = "https://discord.com/api/v10";

let ws = null;
let heartbeatInterval = null;
let seq = null;
let sessionId = null;
let resumeUrl = null;
let identified = false;
let lastActivity = null;
let connecting = false;
let userIdle = false;
let pushTimer = null;

async function getCfg() {
  return await chrome.storage.local.get([
    "token", "appId", "status", "customText", "customState", "customImg", "customType",
    "disabledPlatforms", "idleAway", "skipIncognito", "enabled", "botUser",
    "isBotToken", "showButtons", "showThumbnails", "notifyOnConnect"
  ]);
}

function setBadge(text, color = "#5865F2") {
  try { chrome.action.setBadgeBackgroundColor({ color }); chrome.action.setBadgeText({ text }); } catch {}
}

async function log(level, message, meta) {
  const { logs = [] } = await chrome.storage.local.get("logs");
  logs.unshift({ t: Date.now(), level, message, meta });
  if (logs.length > 150) logs.length = 150;
  await chrome.storage.local.set({ logs });
  chrome.runtime.sendMessage({ type: "log:new" }).catch(() => {});
}

async function validateToken(token) {
  for (const auth of [token, `Bot ${token}`]) {
    try {
      const r = await fetch(`${API}/users/@me`, { headers: { Authorization: auth } });
      if (r.ok) {
        const user = await r.json();
        return { ok: true, user, isBot: auth.startsWith("Bot "), authHeader: auth };
      }
    } catch {}
  }
  return { ok: false, error: "Invalid token" };
}

// ------- External assets (for image URLs to show in activity) -------
// Discord accepts external image URLs only after registering them via
// /applications/{app_id}/external-assets — returns an "mp:external/..." id.
const assetCache = new Map(); // url -> mp:external/...
async function registerExternalAsset(appId, url) {
  if (!appId || !url) return null;
  const key = `${appId}:${url}`;
  if (assetCache.has(key)) return assetCache.get(key);
  try {
    const { token, isBotToken } = await chrome.storage.local.get(["token", "isBotToken"]);
    const auth = isBotToken ? `Bot ${token}` : token;
    const r = await fetch(`${API}/applications/${appId}/external-assets`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [url] })
    });
    if (!r.ok) { assetCache.set(key, null); return null; }
    const arr = await r.json();
    const id = arr?.[0]?.external_asset_path;
    const final = id ? `mp:${id}` : null;
    assetCache.set(key, final);
    return final;
  } catch { return null; }
}

async function loginAndConnect() {
  const cfg = await getCfg();
  if (!cfg.token) { setBadge("!", "#ED4245"); await log("warn", "No token set"); return; }
  if (cfg.enabled === false) { setBadge("off", "#747F8D"); return; }

  setBadge("…", "#FAA61A");
  const v = await validateToken(cfg.token);
  if (!v.ok) {
    setBadge("err", "#ED4245");
    await log("error", "Login failed");
    await chrome.storage.local.set({ botUser: null, lastError: v.error });
    chrome.runtime.sendMessage({ type: "auth:failed" }).catch(() => {});
    return;
  }
  await chrome.storage.local.set({
    botUser: { id: v.user.id, username: v.user.username, avatar: v.user.avatar, isBot: v.isBot },
    isBotToken: v.isBot,
    lastError: null
  });
  await log("info", `Logged in as ${v.user.username}${v.isBot ? " (bot)" : ""}`);
  chrome.runtime.sendMessage({ type: "auth:ok", user: v.user }).catch(() => {});
  if (cfg.notifyOnConnect !== false) {
    try {
      chrome.notifications?.create?.({
        type: "basic", iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: "Aura connected", message: `Logged in as ${v.user.username}`
      });
    } catch {}
  }
  await connect();
}

async function connect() {
  if (connecting) return;
  const cfg = await getCfg();
  if (!cfg.token || cfg.enabled === false) { setBadge(cfg.enabled === false ? "off" : "!", "#747F8D"); return; }
  connecting = true;
  try {
    if (ws) try { ws.close(); } catch {}
    ws = new WebSocket(resumeUrl ? `${resumeUrl}/?v=10&encoding=json` : GATEWAY_URL);
    ws.onopen = () => setBadge("…", "#FAA61A");
    ws.onmessage = (e) => handle(JSON.parse(e.data));
    ws.onclose = (e) => {
      identified = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      setBadge("off", "#747F8D");
      log("warn", `Gateway closed (${e.code})`);
      if (e.code === 4004) { connecting = false; return; }
      setTimeout(() => { connecting = false; connect(); }, 4000);
    };
    ws.onerror = () => {};
  } catch {
    connecting = false;
    setTimeout(connect, 4000);
  }
}

async function handle(payload) {
  const { op, d, s, t } = payload;
  if (s) seq = s;
  switch (op) {
    case 10: {
      heartbeatInterval = setInterval(() => {
        if (ws?.readyState === 1) ws.send(JSON.stringify({ op: 1, d: seq }));
      }, d.heartbeat_interval);
      const { token, isBotToken } = await chrome.storage.local.get(["token", "isBotToken"]);
      if (sessionId && resumeUrl) {
        ws.send(JSON.stringify({ op: 6, d: { token, session_id: sessionId, seq } }));
      } else {
        const identify = {
          token,
          properties: { os: "Windows", browser: "Chrome", device: "" },
          presence: await buildPresence(lastActivity)
        };
        if (isBotToken) identify.intents = 0;
        else { identify.capabilities = 16381; identify.compress = false; }
        ws.send(JSON.stringify({ op: 2, d: identify }));
      }
      break;
    }
    case 11: break;
    case 0:
      if (t === "READY") {
        identified = true; sessionId = d.session_id; resumeUrl = d.resume_gateway_url;
        connecting = false; setBadge("on", "#3BA55D");
        log("info", "Connected to Discord");
      } else if (t === "RESUMED") {
        identified = true; connecting = false; setBadge("on", "#3BA55D");
      }
      break;
    case 9:
      sessionId = null; resumeUrl = null; identified = false;
      setTimeout(connect, 2500);
      break;
    case 7:
      try { ws.close(); } catch {}
      break;
  }
}

async function buildPresence(activity) {
  const cfg = await getCfg();
  const status = userIdle && cfg.idleAway ? "idle" : (cfg.status || "online");

  let act = activity;
  if (cfg.customText) {
    act = {
      id: "custom",
      name: cfg.customText,
      type: parseInt(cfg.customType ?? "0", 10),
      details: cfg.customText,
      state: cfg.customState || undefined,
      thumbnail: cfg.customImg || undefined,
    };
  }
  if (act && cfg.disabledPlatforms?.includes(act.id)) act = null;
  if (!act) return { since: 0, activities: [], status, afk: false };

  // Resolve large image: register external URL with Discord proxy if appId set.
  let largeImage;
  if (cfg.showThumbnails !== false && act.thumbnail && cfg.appId) {
    largeImage = await registerExternalAsset(cfg.appId, act.thumbnail);
  }

  const assets = largeImage ? {
    large_image: largeImage,
    large_text: act.details || act.name,
  } : undefined;

  const a = {
    name: act.name || "Aura",
    type: act.type ?? 0,
    details: act.details || undefined,
    state: act.state || undefined,
    timestamps: act.startTimestamp ? { start: act.startTimestamp } : { start: Date.now() },
  };
  if (cfg.appId) a.application_id = cfg.appId;
  if (assets) a.assets = assets;
  if (cfg.showButtons !== false && act.url && cfg.appId) {
    a.buttons = ["Open in browser"];
    a.metadata = { button_urls: [act.url] };
  }
  return { since: 0, activities: [a], status, afk: false };
}

async function pushPresence() {
  if (ws?.readyState !== 1 || !identified) return;
  // Debounce so rapid tab switches don't spam the gateway
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try { ws.send(JSON.stringify({ op: 3, d: await buildPresence(lastActivity) })); } catch {}
  }, 350);
}

let lastTickAt = Date.now();
async function tickTracking() {
  const now = Date.now();
  const delta = Math.min(15, Math.round((now - lastTickAt) / 1000));
  lastTickAt = now;
  if (!lastActivity || userIdle) return;
  const today = new Date().toISOString().slice(0, 10);
  const { trackedToday = {}, trackedByApp = {} } = await chrome.storage.local.get(["trackedToday","trackedByApp"]);
  trackedToday[today] = (trackedToday[today] || 0) + delta;
  const k = `${today}:${lastActivity.id}`;
  trackedByApp[k] = (trackedByApp[k] || 0) + delta;
  await chrome.storage.local.set({ trackedToday, trackedByApp });
}
setInterval(tickTracking, 8000);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "presence:update") {
      const cfg = await getCfg();
      if (cfg.skipIncognito && sender.tab?.incognito) { sendResponse({ ok: true, skipped: true }); return; }
      const prevId = lastActivity?.id;
      const prevKey = JSON.stringify(lastActivity);
      lastActivity = msg.activity;
      if (msg.activity && JSON.stringify(msg.activity) !== prevKey) {
        if (msg.activity.id !== prevId) log("info", `Detected: ${msg.activity.name}`);
        await pushPresence();
      } else if (!msg.activity && prevKey !== "null") {
        await pushPresence();
      }
      sendResponse({ ok: true });
    } else if (msg.type === "config:save") {
      await chrome.storage.local.set(msg.data);
      if (msg.reconnect) { sessionId = null; resumeUrl = null; assetCache.clear(); await loginAndConnect(); }
      else await pushPresence();
      sendResponse({ ok: true });
    } else if (msg.type === "status:get") {
      const { botUser, lastError, trackedByApp = {} } = await chrome.storage.local.get(["botUser","lastError","trackedByApp"]);
      sendResponse({ connected: identified, activity: lastActivity, botUser, lastError, trackedByApp });
    } else if (msg.type === "presence:clear") {
      lastActivity = null; await pushPresence(); sendResponse({ ok: true });
    } else if (msg.type === "disconnect") {
      try { ws?.close(); } catch {}
      await chrome.storage.local.set({ botUser: null });
      await log("info", "Disconnected"); sendResponse({ ok: true });
    } else if (msg.type === "logs:get") {
      const { logs = [] } = await chrome.storage.local.get("logs");
      sendResponse({ logs });
    } else if (msg.type === "logs:clear") {
      await chrome.storage.local.set({ logs: [] }); sendResponse({ ok: true });
    } else if (msg.type === "auth:test") {
      const v = await validateToken(msg.token); sendResponse(v);
    }
  })();
  return true;
});

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (state) => {
  userIdle = state !== "active";
  await pushPresence();
});

// Uninstall thank-you page (works in all Chromium browsers)
try { chrome.runtime.setUninstallURL("https://discord-rich-presence-app.lovable.app/?goodbye=1"); } catch {}

chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
  const version = chrome.runtime.getManifest().version;
  if (reason === "install") {
    await chrome.storage.local.set({
      enabled: true, status: "online", idleAway: true, skipIncognito: true,
      showButtons: true, showThumbnails: true, notifyOnConnect: true,
      lastSeenVersion: version
    });
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  } else if (reason === "update" && previousVersion !== version) {
    await chrome.storage.local.set({ pendingUpdate: { from: previousVersion, to: version, at: Date.now() } });
    try {
      chrome.notifications?.create?.("aura-updated", {
        type: "basic", iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: `Aura updated to v${version}`,
        message: "Click to see what's new.",
        priority: 1
      });
    } catch {}
    chrome.tabs.create({ url: chrome.runtime.getURL("whatsnew.html") });
  }
  loginAndConnect();
});
chrome.notifications?.onClicked?.addListener?.((id) => {
  if (id === "aura-updated") chrome.tabs.create({ url: chrome.runtime.getURL("whatsnew.html") });
});
chrome.runtime.onStartup.addListener(() => loginAndConnect());
chrome.alarms.create("ka", { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener(() => { if (ws?.readyState !== 1) loginAndConnect(); });
loginAndConnect();
