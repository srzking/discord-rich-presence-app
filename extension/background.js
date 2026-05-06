// Aura background service worker
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

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
    "disabledPlatforms", "idleAway", "skipIncognito", "enabled"
  ]);
}

function setBadge(text, color = "#5865F2") {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
}

async function connect() {
  if (connecting) return;
  const cfg = await getCfg();
  if (!cfg.token) { setBadge("!", "#ED4245"); return; }
  if (cfg.enabled === false) { setBadge("off", "#747F8D"); return; }
  connecting = true;
  try {
    if (ws) try { ws.close(); } catch {}
    ws = new WebSocket(resumeUrl ? `${resumeUrl}/?v=10&encoding=json` : GATEWAY_URL);
    ws.onopen = () => setBadge("…", "#FAA61A");
    ws.onmessage = (e) => handle(JSON.parse(e.data));
    ws.onclose = () => {
      identified = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      setBadge("off", "#747F8D");
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
      const { token } = await getCfg();
      if (sessionId && resumeUrl) {
        ws.send(JSON.stringify({ op: 6, d: { token, session_id: sessionId, seq } }));
      } else {
        ws.send(JSON.stringify({
          op: 2,
          d: {
            token,
            intents: 0,
            properties: { os: "browser", browser: "Aura", device: "Aura" },
            presence: await buildPresence(lastActivity)
          }
        }));
      }
      break;
    }
    case 11: break;
    case 0:
      if (t === "READY") {
        identified = true; sessionId = d.session_id; resumeUrl = d.resume_gateway_url;
        connecting = false; setBadge("on", "#3BA55D");
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

  // Custom override
  let act = activity;
  if (cfg.customText) {
    act = {
      id: "custom",
      name: "Aura",
      type: parseInt(cfg.customType ?? "0", 10),
      details: cfg.customText
    };
  }

  // Platform disabled?
  if (act && cfg.disabledPlatforms?.includes(act.id)) act = null;

  if (!act) return { since: 0, activities: [], status, afk: false };

  const a = {
    name: act.name,
    type: act.type ?? 0,
    application_id: cfg.appId || undefined,
    details: act.details || undefined,
    state: act.state || undefined,
    timestamps: act.startTimestamp ? { start: act.startTimestamp } : { start: Date.now() },
    assets: cfg.appId ? { large_image: act.id, large_text: act.name } : undefined
  };
  return { since: 0, activities: [a], status, afk: false };
}

async function pushPresence() {
  if (ws?.readyState !== 1 || !identified) return;
  ws.send(JSON.stringify({ op: 3, d: await buildPresence(lastActivity) }));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "presence:update") {
      const cfg = await getCfg();
      if (cfg.skipIncognito && sender.tab?.incognito) { sendResponse({ ok: true, skipped: true }); return; }
      lastActivity = msg.activity;
      await pushPresence();
      sendResponse({ ok: true });
    } else if (msg.type === "config:save") {
      await chrome.storage.local.set(msg.data);
      if (msg.reconnect) { sessionId = null; resumeUrl = null; await connect(); }
      else await pushPresence();
      sendResponse({ ok: true });
    } else if (msg.type === "status:get") {
      sendResponse({ connected: identified, activity: lastActivity });
    } else if (msg.type === "presence:clear") {
      lastActivity = null; await pushPresence(); sendResponse({ ok: true });
    } else if (msg.type === "disconnect") {
      try { ws?.close(); } catch {}
      sendResponse({ ok: true });
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
  connect();
});
chrome.runtime.onStartup.addListener(() => connect());
chrome.alarms.create("ka", { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener(() => { if (ws?.readyState !== 1) connect(); });
connect();
