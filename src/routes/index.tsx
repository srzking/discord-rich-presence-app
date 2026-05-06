import { createFileRoute } from "@tanstack/react-router";
import auraIcon from "@/assets/aura-icon.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura — Rich Presence for the Web" },
      { name: "description", content: "Show what you're watching, listening to or browsing on Discord — automatically. Free Chrome extension supporting 15+ web platforms." },
      { property: "og:title", content: "Aura — Rich Presence for the Web" },
      { property: "og:description", content: "Discord Rich Presence for any website. YouTube, Netflix, Spotify, Twitch and more." },
    ],
  }),
  component: Index,
});

const PLATFORMS = [
  "YouTube", "Netflix", "Spotify", "Twitch", "GitHub", "X",
  "Reddit", "SoundCloud", "Prime Video", "Disney+", "Max",
  "Crunchyroll", "Stack Overflow", "Wikipedia", "VS Code Web",
];

const FEATURES = [
  { t: "Auto-detect", d: "Recognises what you're doing on 15+ web platforms in real time." },
  { t: "Custom activity", d: "Override with your own Playing / Watching / Listening / Competing line." },
  { t: "Per-site toggles", d: "Turn off any platform you'd rather not share." },
  { t: "Idle awareness", d: "Switches your status to idle when you step away." },
  { t: "Privacy first", d: "Skips incognito tabs and runs entirely in your browser." },
  { t: "One-click on/off", d: "A master switch to pause Aura whenever you want." },
];

function download() {
  fetch("/aura.zip")
    .then((r) => { if (!r.ok) throw new Error("Download failed"); return r.blob(); })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "aura.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((e) => alert(e.message));
}

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] h-[400px] w-[500px] rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <img src={auraIcon} alt="Aura" width={36} height={36} className="rounded-lg" />
            <span className="font-semibold text-lg">Aura</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#platforms" className="hover:text-foreground">Platforms</a>
            <a href="#setup" className="hover:text-foreground">Setup</a>
          </nav>
        </header>

        <section className="text-center pt-8">
          <span className="inline-block rounded-full border border-border bg-card/50 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">
            Discord Rich Presence · for the web
          </span>
          <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Your aura,<br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              wherever you browse.
            </span>
          </h1>
          <p className="mt-7 text-lg text-muted-foreground max-w-xl mx-auto">
            A tiny Chrome extension that lights up your Discord profile with whatever you're watching, listening to, or doing on the web.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={download}
              className="rounded-lg bg-gradient-to-r from-primary to-accent px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/30"
            >
              Download Aura
            </button>
            <a href="#setup" className="rounded-lg border border-border bg-card/50 backdrop-blur px-7 py-3.5 text-sm font-semibold hover:bg-card transition">
              How it works
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free · Chromium browsers · No account required</p>
        </section>

        <section id="features" className="mt-32">
          <h2 className="text-3xl font-bold mb-10 text-center">Built for control.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-xl border border-border bg-card/50 backdrop-blur p-5 hover:border-primary/40 transition">
                <div className="font-semibold mb-1.5">{f.t}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="platforms" className="mt-32">
          <h2 className="text-3xl font-bold mb-3 text-center">15+ platforms supported.</h2>
          <p className="text-center text-muted-foreground mb-8">More added regularly.</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {PLATFORMS.map((p) => (
              <span key={p} className="rounded-full bg-card border border-border px-4 py-1.5 text-sm">{p}</span>
            ))}
          </div>
        </section>

        <section id="setup" className="mt-32">
          <h2 className="text-3xl font-bold mb-10 text-center">Setup in under 2 minutes.</h2>
          <ol className="space-y-3 max-w-2xl mx-auto">
            {[
              ["Download & unzip", "Click Download Aura above and unzip the file."],
              ["Load it in Chrome", <>Open <code className="rounded bg-card border border-border px-1.5 py-0.5 text-xs">chrome://extensions</code>, enable Developer mode, click <em>Load unpacked</em> and select the folder.</>],
              ["Create a Discord bot", <>Visit the <a className="text-primary hover:underline" href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Developer Portal</a>, make an app, copy the Bot Token and Application ID.</>],
              ["Connect", "Open the Aura popup → Account tab → paste both → Save & Connect."],
              ["You're live", "Browse a supported site. Your Discord status updates automatically."],
            ].map(([title, body], i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-border bg-card/50 backdrop-blur p-5">
                <span className="flex-none h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold mb-0.5">{title as string}</div>
                  <div className="text-sm text-muted-foreground">{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-32 mb-6 text-center text-xs text-muted-foreground">
          Aura is not affiliated with Discord. Crafted with ♥ for the open web.
        </footer>
      </div>
    </main>
  );
}
