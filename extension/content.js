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
    { id: "kick", match: h => h.includes("kick.com"), detect: () => ({ name: "Kick", type: 3, details: document.title.split(" - Kick")[0] }) },
    { id: "github", match: h => h.includes("github.com"), detect: () => {
        const repo = location.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
        return { name: "GitHub", type: 0, details: repo ? `Browsing ${repo}` : "Browsing GitHub", state: document.title.split("·")[0]?.trim() };
      } },
    { id: "gitlab", match: h => h.includes("gitlab.com"), detect: () => ({ name: "GitLab", type: 0, details: document.title.split("·")[0]?.trim() }) },
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
    { id: "claude", match: h => h.includes("claude.ai"), detect: () => ({ name: "Claude", type: 0, details: "Chatting with Claude", state: document.title }) },
    { id: "gemini", match: h => h.includes("gemini.google.com"), detect: () => ({ name: "Gemini", type: 0, details: "Chatting with Gemini", state: document.title }) },
    { id: "gmail", match: h => h.includes("mail.google.com"), detect: () => ({ name: "Gmail", type: 0, details: "Checking email" }) },
    { id: "pinterest", match: h => h.includes("pinterest."), detect: () => ({ name: "Pinterest", type: 0, details: "Browsing pins", state: document.title.split("|")[0]?.trim() }) },
    { id: "tiktok", match: h => h.includes("tiktok.com"), detect: () => ({ name: "TikTok", type: 3, details: "Watching TikToks", state: document.title.split("|")[0]?.trim() }) },
    { id: "instagram", match: h => h.includes("instagram.com"), detect: () => ({ name: "Instagram", type: 0, details: "Scrolling", state: document.title.split("•")[0]?.trim() }) },
    { id: "letterboxd", match: h => h.includes("letterboxd.com"), detect: () => ({ name: "Letterboxd", type: 0, details: "Logging films", state: document.title.split("•")[0]?.trim() }) },
    { id: "anilist", match: h => h.includes("anilist.co"), detect: () => ({ name: "AniList", type: 3, details: "Tracking anime", state: document.title.split("·")[0]?.trim() }) },
    { id: "mal", match: h => h.includes("myanimelist.net"), detect: () => ({ name: "MyAnimeList", type: 3, details: document.title.split("-")[0]?.trim() }) },
    { id: "steam", match: h => h.includes("store.steampowered.com") || h.includes("steamcommunity.com"), detect: () => ({ name: "Steam", type: 0, details: "Browsing Steam", state: document.title.split("::")[0]?.trim() }) },
    { id: "lastfm", match: h => h.includes("last.fm"), detect: () => ({ name: "Last.fm", type: 2, details: document.title.split("|")[0]?.trim() }) },
    { id: "bandcamp", match: h => h.includes("bandcamp.com"), detect: () => ({ name: "Bandcamp", type: 2, details: document.title }) },
    { id: "genius", match: h => h.includes("genius.com"), detect: () => ({ name: "Genius", type: 2, details: "Reading lyrics", state: document.title.split("|")[0]?.trim() }) },
    { id: "coursera", match: h => h.includes("coursera.org"), detect: () => ({ name: "Coursera", type: 0, details: "Learning", state: document.title.split("|")[0]?.trim() }) },
    { id: "udemy", match: h => h.includes("udemy.com"), detect: () => ({ name: "Udemy", type: 0, details: "Learning", state: document.title.split("|")[0]?.trim() }) },
    { id: "khan", match: h => h.includes("khanacademy.org"), detect: () => ({ name: "Khan Academy", type: 0, details: "Studying", state: document.title.split("|")[0]?.trim() }) },
    { id: "mdn", match: h => h.includes("developer.mozilla.org"), detect: () => ({ name: "MDN", type: 0, details: "Reading docs", state: document.title.split("|")[0]?.trim() }) },
    { id: "duolingo", match: h => h.includes("duolingo.com"), detect: () => ({ name: "Duolingo", type: 0, details: "Learning a language" }) },
    { id: "pawsy", match: h => h.includes("pawsy.fun") || h.includes("pawsy.gay"), detect: () => ({ name: "Pawsy", type: 0, details: "Hanging out on Pawsy", state: document.title.split("|")[0]?.trim() }) },
    { id: "furaffinity", match: h => h.includes("furaffinity.net"), detect: () => ({ name: "FurAffinity", type: 0, details: "Browsing FA", state: document.title.split("--")[0]?.trim() }) },
    { id: "e621", match: h => h.includes("e621.net"), detect: () => ({ name: "e621", type: 0, details: "Browsing", state: document.title.split("-")[0]?.trim() }) },
    { id: "telegram", match: h => h.includes("web.telegram.org"), detect: () => ({ name: "Telegram", type: 0, details: "Chatting", state: document.title }) },
    { id: "whatsapp", match: h => h.includes("web.whatsapp.com"), detect: () => ({ name: "WhatsApp", type: 0, details: "Chatting", state: document.title }) },
    { id: "discordweb", match: h => h.includes("discord.com/channels") || h.includes("discord.com/app"), detect: () => ({ name: "Discord Web", type: 0, details: "On Discord Web" }) },
    { id: "amazon", match: h => h.includes("amazon.") && !h.includes("amazon.com/gp/video"), detect: () => ({ name: "Amazon", type: 0, details: "Shopping", state: document.title.split(":")[0]?.trim() }) },
    { id: "ebay", match: h => h.includes("ebay."), detect: () => ({ name: "eBay", type: 0, details: "Shopping", state: document.title.split("|")[0]?.trim() }) },
    { id: "aliexpress", match: h => h.includes("aliexpress."), detect: () => ({ name: "AliExpress", type: 0, details: "Shopping" }) },
    { id: "roblox", match: h => h.includes("roblox.com"), detect: () => ({ name: "Roblox", type: 0, details: "Browsing Roblox", state: document.title.split("-")[0]?.trim() }) },
    { id: "itchio", match: h => h.includes("itch.io"), detect: () => ({ name: "itch.io", type: 0, details: "Indie games", state: document.title.split(" by ")[0]?.trim() }) },
    { id: "epic", match: h => h.includes("epicgames.com"), detect: () => ({ name: "Epic Games", type: 0, details: "Browsing store" }) },
    { id: "huggingface", match: h => h.includes("huggingface.co"), detect: () => ({ name: "Hugging Face", type: 0, details: "ML models", state: document.title }) },
    { id: "perplexity", match: h => h.includes("perplexity.ai"), detect: () => ({ name: "Perplexity", type: 0, details: "Searching with AI" }) },
    { id: "googledocs", match: h => h.includes("docs.google.com"), detect: () => ({ name: "Google Docs", type: 0, details: "Editing a doc", state: document.title.split(" - ")[0]?.trim() }) },
    { id: "fandom", match: h => h.includes("fandom.com"), detect: () => ({ name: "Fandom", type: 0, details: "Reading wiki", state: document.title.split("|")[0]?.trim() }) },
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

  // Expose presence to the page so the website can detect the extension is installed.
  try {
    document.documentElement.setAttribute("data-aura-installed", "1");
    window.postMessage({ source: "aura-extension", type: "installed", version: chrome.runtime.getManifest().version }, "*");
  } catch {}
  window.addEventListener("message", async (e) => {
    if (e.data?.source !== "aura-page") return;
    if (e.data.type === "ping") {
      window.postMessage({ source: "aura-extension", type: "pong", version: chrome.runtime.getManifest().version }, "*");
    } else if (e.data.type === "dashreq") {
      try {
        const cfg = await chrome.storage.local.get(["trackedToday","trackedByApp"]);
        const current = (() => { try { return detect(); } catch { return null; } })();
        window.postMessage({ source: "aura-extension", type: "dashdata", data: { ...cfg, current } }, "*");
      } catch {}
    }
  });

  send();
  setTimeout(send, 1500);
  setInterval(send, 4000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = ""; send(); } });
  window.addEventListener("focus", () => { last = ""; send(); });

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) { lastUrl = location.href; last = ""; setTimeout(send, 400); }
  }).observe(document, { subtree: true, childList: true });
})();
