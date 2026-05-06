const $ = (s) => document.querySelector(s);

async function refresh() {
  const cfg = await chrome.storage.local.get(["token", "appId", "status"]);
  $("#token").value = cfg.token || "";
  $("#appId").value = cfg.appId || "";
  $("#statusSel").value = cfg.status || "online";

  chrome.runtime.sendMessage({ type: "status:get" }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    const pill = $("#status");
    pill.textContent = res.connected ? "connected" : "offline";
    pill.className = "pill " + (res.connected ? "on" : "off");
    const a = res.activity;
    $("#actName").textContent = a ? a.name : "—";
    $("#actDetails").textContent = a?.details || "";
    $("#actState").textContent = a?.state || "";
  });
}

$("#save").addEventListener("click", async () => {
  const data = {
    token: $("#token").value.trim(),
    appId: $("#appId").value.trim(),
    status: $("#statusSel").value
  };
  if (!data.token) { alert("Please enter your bot token."); return; }
  $("#save").disabled = true; $("#save").textContent = "Connecting…";
  chrome.runtime.sendMessage({ type: "config:save", data }, () => {
    setTimeout(() => { $("#save").disabled = false; $("#save").textContent = "Save & Connect"; refresh(); }, 800);
  });
});

$("#clear").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "presence:clear" }, refresh);
});

refresh();
setInterval(refresh, 3000);
