(function () {
  const PLATFORMS = [
    { id: "youtube", match: h => h.includes("youtube.com"), detect: () => {
        if (!location.pathname.startsWith("/watch"))
          return { name: "YouTube", type: 3, details: "Browsing YouTube", state: document.title.replace(" - YouTube", "") };
        const title = document.querySelector("h1.ytd-watch-metadata yt-formatted-string, h1.title")?.textContent?.trim();
        const channel = document.querySelector("ytd-channel-name #text a, #upload-info #channel-name a")?.textContent?.trim();
        const v = document.querySelector("video"); let s;
        if (v && !v.paused) s = Date.now() - Math.floor(v.currentTime * 1000);
        return { name: "YouTube", type: 3, details: title || "Watching a video", state: channel ? `by ${channel}` : undefined, startTimestamp: s };
      } },
    { id: "netflix", match: h => h.includes("netflix.com"), detect: () => {
        const title = document.querySelector(".video-title h4, .ellipsize-text")?.textContent?.trim() || document.title;
        const ep = document.querySelector(".video-title span")?.textContent?.trim();
        return { name: "Netflix", type: 3, details: title, state: ep };
      } },
    { id: "spotify", match: h => h.includes("open.spotify.com"), detect: () => {
        const track = document.querySelector('[data-testid="context-item-link"]')?.textContent?.trim();
        const artist = document.querySelector('[data-testid="context-item-info-artist"]')?.textContent?.trim();
        return { name: "Spotify", type: 2, details: track || "Browsing Spotify", state: artist };
      } },
    { id: "twitch", match: h => h.includes("twitch.tv"), detect: () => {
        const streamer = document.querySelector('h1.tw-title, [data-a-target="stream-title"]')?.textContent?.trim();
        const game = document.querySelector('[data-a-target="stream-game-link"]')?.textContent?.trim();
        return { name: "Twitch", type: 3, details: streamer || document.title, state: game };
      } },
    { id: "github", match: h => h.includes("github.com"), detect: () => {
        const repo = location.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
        return { name: "GitHub", type: 0, details: repo ? `Browsing ${repo}` : "Browsing GitHub", state: document.title.split("·")[0]?.trim() };
      } },
    { id: "x", match: h => h.includes("twitter.com") || h.includes("x.com"), detect: () => ({ name: "X", type: 0, details: "Scrolling X", state: document.title.replace(" / X", "") }) },
    { id: "reddit", match: h => h.includes("reddit.com"), detect: () => {
        const sub = location.pathname.match(/\/r\/([^/]+)/)?.[1];
        return { name: "Reddit", type: 0, details: sub ? `r/${sub}` : "Browsing Reddit", state: document.title.split(":")[0]?.trim() };
      } },
    { id: "soundcloud", match: h => h.includes("soundcloud.com"), detect: () => ({ name: "SoundCloud", type: 2, details: document.title.replace(" | Listen online for free on SoundCloud", "") }) },
    { id: "primevideo", match: h => h.includes("primevideo.com") || h.includes("amazon.com/gp/video"), detect: () => ({ name: "Prime Video", type: 3, details: document.title }) },
    { id: "disneyplus", match: h => h.includes("disneyplus.com"), detect: () => ({ name: "Disney+", type: 3, details: document.title }) },
    { id: "hbomax", match: h => h.includes("max.com") || h.includes("hbomax.com"), detect: () => ({ name: "Max", type: 3, details: document.title }) },
    { id: "crunchyroll", match: h => h.includes("crunchyroll.com"), detect: () => ({ name: "Crunchyroll", type: 3, details: document.title }) },
    { id: "stackoverflow", match: h => h.includes("stackoverflow.com"), detect: () => ({ name: "Stack Overflow", type: 0, details: document.title.replace(" - Stack Overflow", "") }) },
    { id: "wikipedia", match: h => h.includes("wikipedia.org"), detect: () => ({ name: "Wikipedia", type: 0, details: "Reading", state: document.title.replace(" - Wikipedia", "") }) },
    { id: "vscode", match: h => h.includes("vscode.dev") || h.includes("github.dev"), detect: () => ({ name: "VS Code Web", type: 0, details: "Editing code", state: document.title }) },
    { id: "applemusic", match: h => h.includes("music.apple.com"), detect: () => ({ name: "Apple Music", type: 2, details: document.title.replace(/ — Apple Music$/, "") }) },
    { id: "tidal", match: h => h.includes("tidal.com"), detect: () => ({ name: "Tidal", type: 2, details: document.title }) },
    { id: "deezer", match: h => h.includes("deezer.com"), detect: () => ({ name: "Deezer", type: 2, details: document.title }) },
    { id: "vimeo", match: h => h.includes("vimeo.com"), detect: () => ({ name: "Vimeo", type: 3, details: document.title.replace(" on Vimeo", "") }) },
    { id: "linkedin", match: h => h.includes("linkedin.com"), detect: () => ({ name: "LinkedIn", type: 0, details: "Networking", state: document.title.split("|")[0]?.trim() }) },
    { id: "medium", match: h => h.includes("medium.com"), detect: () => ({ name: "Medium", type: 0, details: "Reading", state: document.title.split("|")[0]?.trim() }) },
    { id: "notion", match: h => h.includes("notion.so") || h.includes("notion.site"), detect: () => ({ name: "Notion", type: 0, details: "Taking notes", state: document.title }) },
    { id: "figma", match: h => h.includes("figma.com"), detect: () => ({ name: "Figma", type: 0, details: "Designing", state: document.title.replace(" – Figma", "") }) },
    { id: "chatgpt", match: h => h.includes("chatgpt.com") || h.includes("chat.openai.com"), detect: () => ({ name: "ChatGPT", type: 0, details: "Chatting with AI", state: document.title }) },
    { id: "gmail", match: h => h.includes("mail.google.com"), detect: () => ({ name: "Gmail", type: 0, details: "Checking email" }) },
    { id: "pinterest", match: h => h.includes("pinterest."), detect: () => ({ name: "Pinterest", type: 0, details: "Browsing pins", state: document.title.split("|")[0]?.trim() }) },
    { id: "tiktok", match: h => h.includes("tiktok.com"), detect: () => ({ name: "TikTok", type: 3, details: "Watching TikToks", state: document.title.split("|")[0]?.trim() }) },
  ];

  function getThumb() {
    const og = document.querySelector('meta[property="og:image"]')?.content
      || document.querySelector('meta[name="twitter:image"]')?.content
      || document.querySelector('link[rel="icon"]')?.href;
    if (og && /^https?:\/\//i.test(og)) return og;
    return undefined;
  }

  function detect() {
    const host = location.hostname;
    for (const p of PLATFORMS) {
      if (p.match(host)) {
        try {
          const r = p.detect();
          if (r) return { id: p.id, thumbnail: getThumb(), url: location.href, ...r };
        } catch {}
      }
    }
    return null;
  }

  let last = "";
  function send() {
    if (document.hidden) return;
    const a = detect();
    const key = JSON.stringify(a);
    if (key === last) return;
    last = key;
    chrome.runtime.sendMessage({ type: "presence:update", activity: a, url: location.href }).catch(() => {});
  }

  send();
  setTimeout(send, 1500); // recheck once page hydrates
  setInterval(send, 4000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = ""; send(); } });
  window.addEventListener("focus", () => { last = ""; send(); });

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) { lastUrl = location.href; last = ""; setTimeout(send, 400); }
  }).observe(document, { subtree: true, childList: true });
})();
