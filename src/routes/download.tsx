import { createFileRoute, Link } from "@tanstack/react-router";
import auraIcon from "@/assets/aura-icon.png";
import { downloadExtension } from "@/lib/aura";
import { useExtension } from "@/hooks/useExtension";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download Aura — Discord Rich Presence for the web" },
      { name: "description", content: "Download Aura, the free Chromium extension that turns your browsing into Discord Rich Presence." },
      { property: "og:title", content: "Download Aura" },
      { property: "og:description", content: "Free Chromium extension. No account, no setup beyond your Discord token." },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  const { installed, version } = useExtension();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/15 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex items-center justify-between mb-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={auraIcon} alt="Aura" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold">Aura</span>
          </Link>
          <nav className="flex gap-5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/changelog" className="hover:text-foreground">Changelog</Link>
          </nav>
        </header>

        <section className="text-center">
          <img src={auraIcon} alt="" width={96} height={96} className="mx-auto rounded-2xl shadow-2xl shadow-primary/30 animate-[fadeSlide_.5s_ease-out]" />
          <h1 className="mt-8 text-4xl md:text-5xl font-bold tracking-tight">Download Aura</h1>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Free Chromium extension. Works in Chrome, Edge, Brave, Arc, Opera & Vivaldi.
          </p>

          {installed ? (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Aura is installed{version ? ` (v${version})` : ""}
            </div>
          ) : (
            <button
              onClick={downloadExtension}
              className="mt-8 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/30"
            >
              Download aura.zip
            </button>
          )}

          <ol className="mt-12 text-left space-y-3 max-w-xl mx-auto">
            {[
              ["Unzip the file", "After downloading, extract aura.zip to a folder."],
              ["Open chrome://extensions", "Or edge://extensions, brave://extensions, etc."],
              ["Enable Developer mode", "Toggle in the top-right corner."],
              ["Click 'Load unpacked'", "Select the extracted folder."],
              ["Open the popup → Account", "Paste your Discord token and click Login & Connect."],
            ].map(([t, d], i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-border bg-card/50 backdrop-blur p-4">
                <span className="flex-none h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center text-sm font-bold">{i + 1}</span>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-xs text-muted-foreground">
            Source: open · No telemetry · Token stays in your browser
          </p>
        </section>
      </div>
      <style>{`@keyframes fadeSlide { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }`}</style>
    </main>
  );
}
