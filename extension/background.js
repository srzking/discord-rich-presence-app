// Aura background service worker
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

async function getCfg() {
  return await chrome.storage.local.get([
    "token", "appId", "status", "customText", "customType",
    "disabledPlatforms", "idleAway", "skipIncognito", "enabled", "botUser"
  ]);
}

function setBadge(text, color = "#5865F2") {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
}

async function log(level, message, meta) {
  const { logs = [] } = await chrome.storage.local.get("logs");
  logs.unshift({ t: Date.now(), level, message, meta });
  if (logs.length > 100) logs.length = 100;
  await chrome.storage.local.set({ logs });
  chrome.runtime.sendMessage({ type: "log:new" }).catch(() => {});
}

async function validateToken(token) {
  // Try as user token first (no prefix), then as bot token
  for (const auth of [token, `Bot ${token}`]) {
    try {
      const r = await fetch(`${API}/users/@me`, { headers: { Authorization: auth } });
      if (r.ok) {
        const user = await r.json();
        return { ok: true, user, isBot: auth.startsWith("Bot ") };
      }
    } catch {}
  }
  return { ok: false, error: "Invalid token" };
}

async function loginAndConnect() {
  const cfg = await getCfg();
  if (!cfg.token) { setBadge("!", "#ED4245"); await log("warn", "No bot token set"); return; }
  if (cfg.enabled === false) { setBadge("off", "#747F8D"); return; }

  setBadge("…", "#FAA61A");
  const v = await validateToken(cfg.token);
  if (!v.ok) {
    setBadge("err", "#ED4245");
    await log("error", "Login failed", { status: v.status });
    await chrome.storage.local.set({ botUser: null, lastError: v.error || `HTTP ${v.status}` });
    chrome.runtime.sendMessage({ type: "auth:failed", status: v.status }).catch(() => {});
    return;
  }
  await chrome.storage.local.set({
    botUser: { id: v.user.id, username: v.user.username, avatar: v.user.avatar, discriminator: v.user.discriminator, isBot: v.isBot },
    isBotToken: v.isBot,
    lastError: null
  });
  await log("info", `Logged in as ${v.user.username}${v.isBot ? " (bot)" : ""}`, { id: v.user.id });
  chrome.runtime.sendMessage({ type: "auth:ok", user: v.user }).catch(() => {});
  await connect();
}

async function connect() {
  if (connecting) return;
  const cfg = await getCfg();
  if (!cfg.token) return;
  if (cfg.enabled === false) { setBadge("off", "#747F8D"); return; }
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
      // 4004 = invalid token, don't loop
      if (e.code === 4004) return;
      setTimeout(() => { connecting = false; connect(); }, 5000);
    };
    ws.onerror = () => {};
  } catch {
    connecting = false;
    setTimeout(connect, 5000);
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
        log("info", "Connected to Discord gateway");
      } else if (t === "RESUMED") {
        identified = true; connecting = false; setBadge("on", "#3BA55D");
      }
      break;
    case 9:
      sessionId = null; resumeUrl = null; identified = false;
      setTimeout(connect, 3000);
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
      name: "Aura",
      type: parseInt(cfg.customType ?? "0", 10),
      details: cfg.customText
    };
  }
  if (act && cfg.disabledPlatforms?.includes(act.id)) act = null;
  if (!act) return { since: 0, activities: [], status, afk: false };

  // Auto thumbnail: prefer page-provided image (og:image)
  const largeImage = act.thumbnail || (cfg.appId ? act.id : undefined);
  const a = {
    name: act.name,
    type: act.type ?? 0,
    application_id: cfg.appId || undefined,
    details: act.details || undefined,
    state: act.state || undefined,
    timestamps: act.startTimestamp ? { start: act.startTimestamp } : { start: Date.now() },
    assets: largeImage ? {
      large_image: largeImage,
      large_text: act.name,
      small_image: act.smallImage || undefined,
      small_text: act.smallText || undefined
    } : undefined,
    buttons: act.url ? ["Open"] : undefined,
    metadata: act.url ? { button_urls: [act.url] } : undefined
  };
  return { since: 0, activities: [a], status, afk: false };
}

async function pushPresence() {
  if (ws?.readyState !== 1 || !identified) return;
  ws.send(JSON.stringify({ op: 3, d: await buildPresence(lastActivity) }));
}

let lastTickAt = Date.now();
async function tickTracking() {
  const now = Date.now();
  const delta = Math.min(15, Math.round((now - lastTickAt) / 1000));
  lastTickAt = now;
  if (!lastActivity || userIdle) return;
  const today = new Date().toISOString().slice(0, 10);
  const { trackedToday = {} } = await chrome.storage.local.get("trackedToday");
  trackedToday[today] = (trackedToday[today] || 0) + delta;
  for (const k of Object.keys(trackedToday)) if (k < today.slice(0,8) + "01") delete trackedToday[k];
  await chrome.storage.local.set({ trackedToday });
}
setInterval(tickTracking, 10000);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "presence:update") {
      const cfg = await getCfg();
      if (cfg.skipIncognito && sender.tab?.incognito) { sendResponse({ ok: true, skipped: true }); return; }
      const prevId = lastActivity?.id;
      lastActivity = msg.activity;
      if (msg.activity && msg.activity.id !== prevId) {
        log("info", `Detected: ${msg.activity.name}`, { details: msg.activity.details });
      }
      await pushPresence();
      sendResponse({ ok: true });
    } else if (msg.type === "config:save") {
      await chrome.storage.local.set(msg.data);
      if (msg.reconnect) { sessionId = null; resumeUrl = null; await loginAndConnect(); }
      else await pushPresence();
      sendResponse({ ok: true });
    } else if (msg.type === "status:get") {
      const { botUser, lastError } = await chrome.storage.local.get(["botUser", "lastError"]);
      sendResponse({ connected: identified, activity: lastActivity, botUser, lastError });
    } else if (msg.type === "presence:clear") {
      lastActivity = null; await pushPresence(); sendResponse({ ok: true });
    } else if (msg.type === "disconnect") {
      try { ws?.close(); } catch {}
      await chrome.storage.local.set({ botUser: null });
      await log("info", "Disconnected");
      sendResponse({ ok: true });
    } else if (msg.type === "logs:get") {
      const { logs = [] } = await chrome.storage.local.get("logs");
      sendResponse({ logs });
    } else if (msg.type === "logs:clear") {
      await chrome.storage.local.set({ logs: [] });
      sendResponse({ ok: true });
    } else if (msg.type === "auth:test") {
      const v = await validateToken(msg.token);
      sendResponse(v);
    }
  })();
  return true;
});

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (state) => {
  userIdle = state !== "active";
  await pushPresence();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    await chrome.storage.local.set({ enabled: true, status: "online", idleAway: true, skipIncognito: true });
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
  loginAndConnect();
});
chrome.runtime.onStartup.addListener(() => loginAndConnect());
chrome.alarms.create("ka", { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener(() => { if (ws?.readyState !== 1) loginAndConnect(); });
loginAndConnect();
