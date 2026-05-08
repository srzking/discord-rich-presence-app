import { createFileRoute, Link } from "@tanstack/react-router";
import auraIcon from "@/assets/aura-icon.png";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Aura Changelog — what's new" },
      { name: "description", content: "All Aura releases and what's new in each version." },
      { property: "og:title", content: "Aura Changelog" },
      { property: "og:description", content: "Latest releases of the Aura Discord Rich Presence extension." },
    ],
  }),
  component: ChangelogPage,
});

const RELEASES: { v: string; date: string; items: string[] }[] = [
  {
    v: "1.4.0", date: "2026-05",
    items: [
      "New minimal play-style icon",
      "13+ new platforms: Kick, GitLab, Claude, Gemini, Instagram, Letterboxd, AniList, MyAnimeList, Steam, Last.fm, Bandcamp, Genius, Coursera, Udemy, Khan Academy, MDN, Duolingo",
      "Custom activity now supports a state line and an image URL",
      "Cleaner Discord gateway identify — fewer connection failures",
      "Site detects when the extension is installed",
      "New /download and /changelog pages",
    ],
  },
  {
    v: "1.3.0", date: "2026-04",
    items: [
      "Update notifications inside the popup",
      "Uninstall thank-you page",
      "Faster reconnection",
      "About tab with version & changelog",
      "Smoother UI animations",
    ],
  },
  {
    v: "1.2.0", date: "2026-03",
    items: [
      "Activity thumbnails (registers external assets with Discord)",
      "Top apps today bar chart",
      "Native notification on connect",
      "Open-in-browser button on the activity",
    ],
  },
  {
    v: "1.1.0", date: "2026-02",
    items: ["User token login (your own profile)", "Logs panel", "Reset & manage settings", "More platforms"],
  },
  {
    v: "1.0.0", date: "2026-01",
    items: ["First release — auto-detect, custom activity, per-site toggles, EN/PT/ES"],
  },
];

function ChangelogPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex items-center justify-between mb-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={auraIcon} alt="Aura" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold">Aura</span>
          </Link>
          <nav className="flex gap-5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/download" className="hover:text-foreground">Download</Link>
          </nav>
        </header>

        <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
        <p className="mt-3 text-muted-foreground">Every Aura release, in one place.</p>

        <div className="mt-12 space-y-8">
          {RELEASES.map((r) => (
            <article key={r.v} className="rounded-2xl border border-border bg-card/50 backdrop-blur p-6">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold">v{r.v}</h2>
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <ul className="space-y-2 text-sm">
                {r.items.map((it, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{it}</span></li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
