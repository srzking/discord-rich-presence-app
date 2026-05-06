// Service worker: connects to Discord Gateway, sets bot presence.
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

let ws = null;
let heartbeatInterval = null;
let seq = null;
let sessionId = null;
let resumeUrl = null;
let identified = false;
let lastActivity = null;
let connecting = false;

async function getCfg() {
  const { token, appId, status = "online" } = await chrome.storage.local.get(["token", "appId", "status"]);
  return { token, appId, status };
}

function log(...a) { console.log("[WebPresence]", ...a); }

function setBadge(text, color = "#5865F2") {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
}

async function connect() {
  if (connecting) return;
  const { token } = await getCfg();
  if (!token) { setBadge("!", "#ED4245"); return; }
  connecting = true;
  try {
    if (ws) try { ws.close(); } catch { }
    ws = new WebSocket(resumeUrl ? `${resumeUrl}/?v=10&encoding=json` : GATEWAY_URL);

    ws.onopen = () => { log("ws open"); setBadge("…", "#FAA61A"); };
    ws.onmessage = (e) => handle(JSON.parse(e.data));
    ws.onclose = (e) => {
      log("ws close", e.code, e.reason);
      identified = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      setBadge("off", "#747F8D");
      // Reconnect with backoff
      setTimeout(() => { connecting = false; connect(); }, 5000);
    };
    ws.onerror = (e) => log("ws err", e);
  } catch (e) {
    log("connect failed", e);
    connecting = false;
    setTimeout(connect, 5000);
  }
}

async function handle(payload) {
  const { op, d, s, t } = payload;
  if (s) seq = s;

  switch (op) {
    case 10: { // HELLO
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
            properties: { os: "browser", browser: "WebPresence", device: "WebPresence" },
            presence: await buildPresence(lastActivity)
          }
        }));
      }
      break;
    }
    case 11: break; // HEARTBEAT ACK
    case 0: {
      if (t === "READY") {
        identified = true;
        sessionId = d.session_id;
        resumeUrl = d.resume_gateway_url;
        connecting = false;
        setBadge("on", "#3BA55D");
        log("READY as", d.user?.username);
      } else if (t === "RESUMED") {
        identified = true;
        connecting = false;
        setBadge("on", "#3BA55D");
      }
      break;
    }
    case 9: { // Invalid session
      sessionId = null; resumeUrl = null; identified = false;
      setTimeout(connect, 3000);
      break;
    }
    case 7: { // Reconnect
      try { ws.close(); } catch { }
      break;
    }
  }
}

async function buildPresence(activity) {
  const { appId, status } = await getCfg();
  if (!activity) {
    return { since: 0, activities: [], status: status || "online", afk: false };
  }
  const act = {
    name: activity.name,
    type: activity.type ?? 0,
    application_id: appId || undefined,
    details: activity.details || undefined,
    state: activity.state || undefined,
    timestamps: activity.startTimestamp ? { start: activity.startTimestamp } : { start: Date.now() },
    assets: appId ? { large_image: activity.id, large_text: activity.name } : undefined
  };
  return { since: 0, activities: [act], status: status || "online", afk: false };
}

async function pushPresence() {
  if (ws?.readyState !== 1 || !identified) return;
  const presence = await buildPresence(lastActivity);
  ws.send(JSON.stringify({ op: 3, d: presence }));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "presence:update") {
      lastActivity = msg.activity;
      await pushPresence();
      sendResponse({ ok: true });
    } else if (msg.type === "config:save") {
      await chrome.storage.local.set(msg.data);
      sessionId = null; resumeUrl = null;
      await connect();
      sendResponse({ ok: true });
    } else if (msg.type === "status:get") {
      sendResponse({ connected: identified, activity: lastActivity });
    } else if (msg.type === "presence:clear") {
      lastActivity = null;
      await pushPresence();
      sendResponse({ ok: true });
    }
  })();
  return true;
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
  connect();
});
chrome.runtime.onStartup.addListener(() => connect());

// Keep alive
chrome.alarms.create("ka", { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener(() => { if (ws?.readyState !== 1) connect(); });

connect();
