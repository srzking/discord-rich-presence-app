// Platform detectors. Each returns { name, details, state, type, startTimestamp? } or null.
// type: 0=Playing, 2=Listening, 3=Watching, 5=Competing
// Runs inside content script, has access to document.

const PLATFORMS = [
  {
    id: "youtube",
    match: (h) => h.includes("youtube.com"),
    detect: () => {
      if (!location.pathname.startsWith("/watch")) {
        return { name: "YouTube", type: 3, details: "Browsing YouTube", state: document.title.replace(" - YouTube", "") };
      }
      const title = document.querySelector("h1.ytd-watch-metadata yt-formatted-string, h1.title")?.textContent?.trim();
      const channel = document.querySelector("ytd-channel-name #text a, #upload-info #channel-name a")?.textContent?.trim();
      const video = document.querySelector("video");
      let start;
      if (video && !video.paused) start = Date.now() - Math.floor(video.currentTime * 1000);
      return { name: "YouTube", type: 3, details: title || "Watching a video", state: channel ? `by ${channel}` : undefined, startTimestamp: start };
    }
  },
  {
    id: "netflix",
    match: (h) => h.includes("netflix.com"),
    detect: () => {
      const title = document.querySelector(".video-title h4, .ellipsize-text")?.textContent?.trim() || document.title;
      const ep = document.querySelector(".video-title span")?.textContent?.trim();
      return { name: "Netflix", type: 3, details: title, state: ep };
    }
  },
  {
    id: "spotify",
    match: (h) => h.includes("open.spotify.com"),
    detect: () => {
      const track = document.querySelector('[data-testid="context-item-link"]')?.textContent?.trim();
      const artist = document.querySelector('[data-testid="context-item-info-artist"]')?.textContent?.trim();
      return { name: "Spotify", type: 2, details: track || "Browsing Spotify", state: artist };
    }
  },
  {
    id: "twitch",
    match: (h) => h.includes("twitch.tv"),
    detect: () => {
      const streamer = document.querySelector('h1.tw-title, [data-a-target="stream-title"]')?.textContent?.trim();
      const game = document.querySelector('[data-a-target="stream-game-link"]')?.textContent?.trim();
      return { name: "Twitch", type: 3, details: streamer || document.title, state: game };
    }
  },
  {
    id: "github",
    match: (h) => h.includes("github.com"),
    detect: () => {
      const repo = location.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
      return { name: "GitHub", type: 0, details: repo ? `Browsing ${repo}` : "Browsing GitHub", state: document.title.split("·")[0]?.trim() };
    }
  },
  {
    id: "x",
    match: (h) => h.includes("twitter.com") || h.includes("x.com"),
    detect: () => ({ name: "X", type: 0, details: "Scrolling X", state: document.title.replace(" / X", "") })
  },
  {
    id: "reddit",
    match: (h) => h.includes("reddit.com"),
    detect: () => {
      const sub = location.pathname.match(/\/r\/([^/]+)/)?.[1];
      return { name: "Reddit", type: 0, details: sub ? `r/${sub}` : "Browsing Reddit", state: document.title.split(":")[0]?.trim() };
    }
  },
  {
    id: "soundcloud",
    match: (h) => h.includes("soundcloud.com"),
    detect: () => ({ name: "SoundCloud", type: 2, details: document.title.replace(" | Listen online for free on SoundCloud", "") })
  },
  {
    id: "primevideo",
    match: (h) => h.includes("primevideo.com") || h.includes("amazon.com/gp/video"),
    detect: () => ({ name: "Prime Video", type: 3, details: document.title })
  },
  {
    id: "disneyplus",
    match: (h) => h.includes("disneyplus.com"),
    detect: () => ({ name: "Disney+", type: 3, details: document.title })
  },
  {
    id: "hbomax",
    match: (h) => h.includes("max.com") || h.includes("hbomax.com"),
    detect: () => ({ name: "Max", type: 3, details: document.title })
  },
  {
    id: "crunchyroll",
    match: (h) => h.includes("crunchyroll.com"),
    detect: () => ({ name: "Crunchyroll", type: 3, details: document.title })
  },
  {
    id: "stackoverflow",
    match: (h) => h.includes("stackoverflow.com"),
    detect: () => ({ name: "Stack Overflow", type: 0, details: document.title.replace(" - Stack Overflow", "") })
  },
  {
    id: "wikipedia",
    match: (h) => h.includes("wikipedia.org"),
    detect: () => ({ name: "Wikipedia", type: 0, details: "Reading", state: document.title.replace(" - Wikipedia", "") })
  },
  {
    id: "vscode",
    match: (h) => h.includes("vscode.dev") || h.includes("github.dev"),
    detect: () => ({ name: "VS Code Web", type: 0, details: "Editing code", state: document.title })
  }
];

function detectCurrent() {
  const host = location.hostname;
  for (const p of PLATFORMS) {
    if (p.match(host)) {
      try {
        const r = p.detect();
        if (r) return { id: p.id, ...r };
      } catch (e) { console.warn("platform detect failed", e); }
    }
  }
  return null;
}
