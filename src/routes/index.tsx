import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import auraIcon from "@/assets/aura-icon.png";
import { downloadExtension } from "@/lib/aura";
import { useExtension } from "@/hooks/useExtension";
import { useLang, L } from "@/lib/i18n";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura — Rich Presence for the Web" },
      { name: "description", content: "Show what you're watching, listening to or browsing on Discord — automatically. Free Chromium extension supporting 60+ web platforms." },
    ],
  }),
  component: Index,
});

type Verb = { en: string; pt: string; es: string };
type Sample = { verb: Verb; name: string; details: string; state: string; host: string; color: string; type: 0 | 2 | 3 };

const SAMPLES: Sample[] = [
  { verb: { en: "Listening to Spotify", pt: "A ouvir no Spotify", es: "Escuchando en Spotify" }, name: "Spotify", details: "Midnight City", state: "M83 — Hurry Up, We're Dreaming", host: "spotify.com", color: "#1DB954", type: 2 },
  { verb: { en: "Watching YouTube", pt: "A ver no YouTube", es: "Viendo YouTube" }, name: "YouTube", details: "How a CPU is made", details2: "Branch Education · 4.2M views", state: "Branch Education · 4.2M views", host: "youtube.com", color: "#FF0033", type: 3 },
  { verb: { en: "Playing on Twitch", pt: "A ver Twitch", es: "Viendo Twitch" }, name: "Twitch", details: "shroud", state: "Counter-Strike 2 · 38k viewers", host: "twitch.tv", color: "#9146FF", type: 3 },
  { verb: { en: "Browsing GitHub", pt: "No GitHub", es: "En GitHub" }, name: "GitHub", details: "vercel/next.js", state: "Reading pull request #58213", host: "github.com", color: "#6e5494", type: 0 },
  { verb: { en: "Hanging on Pawsy", pt: "Na Pawsy", es: "En Pawsy" }, name: "Pawsy", details: "Browsing the den", state: "#general · 412 online", host: "pawsy.fun", color: "#ff8ab4", type: 0 },
] as any;

const HERO = {
  en: { badge: "Discord Rich Presence — for the open web", h1a: "Your aura,", h1b: "wherever you browse.", sub: "Tiny extension. Updates your Discord profile with whatever you're watching, listening to, or doing on the web. No account, no servers.", download: "Download", free: "Free · Chromium · No account · No DB", example_h: "Looks like this on your profile", popup_h: "And this is the extension", elapsed: "elapsed", open_btn: "Open in browser", feat_h: "Everything you need", plat_h: "By category", plat_sub: "Toggle anything you don't want from the popup.",
    feats: [
      { t: "Auto-detect", d: "60+ websites tracked in real time, grouped by category." },
      { t: "Custom activity", d: "Override with any text, image and type — live preview while you edit." },
      { t: "Privacy first", d: "Token stays in your browser. No telemetry, no DB, no account." },
      { t: "Local dashboard", d: "Streaks, totals, top apps — all read locally from the extension." },
      { t: "Pause anytime", d: "Snooze tracking with one click when you want to disappear." },
      { t: "Languages", d: "EN / PT / ES across the extension and the website." },
    ] },
  pt: { badge: "Discord Rich Presence — para a web aberta", h1a: "A tua aura,", h1b: "em qualquer lado da web.", sub: "Extensão pequena. Atualiza o teu perfil do Discord com o que estás a ver, ouvir ou fazer na web. Sem conta, sem servidores.", download: "Descarregar", free: "Grátis · Chromium · Sem conta · Sem DB", example_h: "Aparece assim no teu perfil", popup_h: "E assim na extensão", elapsed: "decorrido", open_btn: "Abrir no browser", feat_h: "Tudo o que precisas", plat_h: "Por categoria", plat_sub: "Desativa qualquer um que não queiras no popup.",
    feats: [
      { t: "Auto-deteção", d: "60+ sites em tempo real, agrupados por categoria." },
      { t: "Atividade custom", d: "Substitui com qualquer texto, imagem e tipo — preview ao vivo." },
      { t: "Privacidade", d: "O token fica no browser. Sem telemetria, sem DB, sem conta." },
      { t: "Painel local", d: "Streaks, totais, top apps — tudo lido localmente da extensão." },
      { t: "Pausa quando quiseres", d: "Snooze do tracking com um clique para desapareceres." },
      { t: "Idiomas", d: "EN / PT / ES em toda a extensão e site." },
    ] },
  es: { badge: "Discord Rich Presence — para la web abierta", h1a: "Tu aura,", h1b: "donde sea que navegues.", sub: "Extensión pequeña. Actualiza tu perfil de Discord con lo que estás viendo, escuchando o haciendo en la web. Sin cuenta, sin servidores.", download: "Descargar", free: "Gratis · Chromium · Sin cuenta · Sin DB", example_h: "Se ve así en tu perfil", popup_h: "Y así en la extensión", elapsed: "transcurrido", open_btn: "Abrir en navegador", feat_h: "Todo lo que necesitas", plat_h: "Por categoría", plat_sub: "Desactiva cualquiera que no quieras en el popup.",
    feats: [
      { t: "Auto-detección", d: "60+ sitios en tiempo real, agrupados por categoría." },
      { t: "Actividad custom", d: "Sustituye con cualquier texto, imagen y tipo — vista previa en vivo." },
      { t: "Privacidad", d: "El token queda en el navegador. Sin telemetría, sin DB, sin cuenta." },
      { t: "Panel local", d: "Rachas, totales, top apps — todo leído localmente de la extensión." },
      { t: "Pausa cuando quieras", d: "Snooze del tracking con un clic para desaparecer." },
      { t: "Idiomas", d: "EN / PT / ES en toda la extensión y el sitio." },
    ] },
} as const;

type Cat = { name: { en: string; pt: string; es: string }; items: { n: string; h: string }[] };
const CATEGORIES: Cat[] = [
  { name: { en: "Streaming & Video", pt: "Streaming e Vídeo", es: "Streaming y Vídeo" }, items: [
    {n:"YouTube",h:"youtube.com"},{n:"Netflix",h:"netflix.com"},{n:"Prime Video",h:"primevideo.com"},{n:"Disney+",h:"disneyplus.com"},{n:"Max",h:"max.com"},{n:"Crunchyroll",h:"crunchyroll.com"},{n:"Twitch",h:"twitch.tv"},{n:"Kick",h:"kick.com"},{n:"Vimeo",h:"vimeo.com"},{n:"TikTok",h:"tiktok.com"}] },
  { name: { en: "Music", pt: "Música", es: "Música" }, items: [
    {n:"Spotify",h:"spotify.com"},{n:"SoundCloud",h:"soundcloud.com"},{n:"Apple Music",h:"music.apple.com"},{n:"Tidal",h:"tidal.com"},{n:"Deezer",h:"deezer.com"},{n:"Last.fm",h:"last.fm"},{n:"Bandcamp",h:"bandcamp.com"},{n:"Genius",h:"genius.com"}] },
  { name: { en: "Development & AI", pt: "Dev e IA", es: "Dev e IA" }, items: [
    {n:"GitHub",h:"github.com"},{n:"GitLab",h:"gitlab.com"},{n:"Stack Overflow",h:"stackoverflow.com"},{n:"VS Code",h:"vscode.dev"},{n:"MDN",h:"developer.mozilla.org"},{n:"Figma",h:"figma.com"},{n:"ChatGPT",h:"chatgpt.com"},{n:"Claude",h:"claude.ai"},{n:"Gemini",h:"gemini.google.com"},{n:"Perplexity",h:"perplexity.ai"},{n:"Hugging Face",h:"huggingface.co"}] },
  { name: { en: "Social", pt: "Social", es: "Social" }, items: [
    {n:"X",h:"x.com"},{n:"Reddit",h:"reddit.com"},{n:"Instagram",h:"instagram.com"},{n:"LinkedIn",h:"linkedin.com"},{n:"Pinterest",h:"pinterest.com"},{n:"Letterboxd",h:"letterboxd.com"},{n:"AniList",h:"anilist.co"},{n:"MAL",h:"myanimelist.net"},{n:"Steam",h:"steampowered.com"},{n:"Telegram",h:"telegram.org"},{n:"WhatsApp",h:"whatsapp.com"}] },
  { name: { en: "Furry & Community", pt: "Furry e Comunidade", es: "Furry y Comunidad" }, items: [
    {n:"Pawsy",h:"pawsy.fun"},{n:"FurAffinity",h:"furaffinity.net"},{n:"e621",h:"e621.net"}] },
  { name: { en: "Gaming", pt: "Jogos", es: "Juegos" }, items: [
    {n:"Roblox",h:"roblox.com"},{n:"itch.io",h:"itch.io"},{n:"Epic Games",h:"epicgames.com"},{n:"Steam",h:"steampowered.com"}] },
  { name: { en: "Shopping & Productivity", pt: "Compras e Produtividade", es: "Compras y Productividad" }, items: [
    {n:"Amazon",h:"amazon.com"},{n:"eBay",h:"ebay.com"},{n:"Notion",h:"notion.so"},{n:"Gmail",h:"mail.google.com"},{n:"Google Docs",h:"docs.google.com"},{n:"Medium",h:"medium.com"},{n:"Wikipedia",h:"wikipedia.org"},{n:"Fandom",h:"fandom.com"}] },
];
const fav = (h: string) => `https://www.google.com/s2/favicons?sz=32&domain=${h}`;

function Index() {
  const [lang] = useLang();
  const x = HERO[lang];
  const xL = L[lang];
  const { installed, version } = useExtension();
  const [exIdx, setExIdx] = useState(0);
  const [bye, setBye] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const sample = SAMPLES[exIdx];
  const verbLabel = (sample.verb as any)[lang] as string;

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("goodbye") === "1") setBye(true);
    const i = setInterval(() => { setExIdx((n) => (n + 1) % SAMPLES.length); setElapsed(0); }, 4500);
    const e = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { clearInterval(i); clearInterval(e); };
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {bye && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur p-6">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-2xl animate-[fadeSlide_.4s_ease-out]">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-2xl font-bold mb-2">Sad to see you go.</h2>
            <p className="text-muted-foreground mb-6 text-sm">Thanks for trying Aura. Reinstall anytime.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={downloadExtension} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">{x.download}</button>
              <button onClick={() => { setBye(false); window.history.replaceState({}, "", "/"); }} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-card transition">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <SiteHeader />

        {/* Hero */}
        <section className="text-center pt-6">
          <span className="inline-block rounded-full border border-border bg-card/50 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-wider text-muted-foreground animate-[fadeSlide_.5s_ease-out]">
            {x.badge}
          </span>
          <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] animate-[fadeSlide_.6s_ease-out]">
            {x.h1a}<br />
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{x.h1b}</span>
          </h1>
          <p className="mt-7 text-lg text-muted-foreground max-w-xl mx-auto animate-[fadeSlide_.7s_ease-out]">{x.sub}</p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-[fadeSlide_.8s_ease-out]">
            {installed ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                {xL.installed}{version ? ` · v${version}` : ""}
              </div>
            ) : (
              <button onClick={downloadExtension} className="rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/30 hover:scale-[1.02]">
                {x.download}
              </button>
            )}
            <Link to="/dashboard" className="rounded-lg border border-border bg-card/50 backdrop-blur px-7 py-3.5 text-sm font-semibold hover:bg-card transition">
              {xL.nav_dashboard}
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{x.free}</p>
        </section>

        {/* Live example: Discord profile + extension popup */}
        <section className="mt-20 grid md:grid-cols-2 gap-6 items-start">
          {/* Discord profile card */}
          <div className="animate-[fadeSlide_.9s_ease-out]">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-3 text-center md:text-left">{x.example_h}</div>
            <div className="rounded-2xl bg-[#232428] border border-[#1e1f22] p-4 shadow-2xl shadow-primary/10 text-white">
              <div className="flex items-center gap-3 pb-3 border-b border-[#1e1f22]">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-500 grid place-items-center text-lg font-bold">A</div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#23a55a] border-2 border-[#232428]" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">aura.user</div>
                  <div className="text-[11px] text-[#b5bac1]">Online</div>
                </div>
              </div>
              <div className="pt-3">
                <div key={exIdx} className="text-[11px] uppercase tracking-wider font-bold text-[#b5bac1] mb-2 animate-[fadeSlide_.4s_ease-out]">
                  {verbLabel}
                </div>
                <div className="flex gap-3">
                  <div className="relative h-[72px] w-[72px] rounded-md flex-none overflow-hidden ring-1 ring-black/20" style={{ background: sample.color }}>
                    <img src={fav(sample.host)} alt="" className="absolute inset-0 m-auto h-10 w-10" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.5))" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[15px] truncate leading-tight">{sample.name}</div>
                    <div className="text-[13px] truncate text-[#dbdee1]">{sample.details}</div>
                    <div className="text-[12px] truncate text-[#b5bac1]">{sample.state}</div>
                    <div className="text-[11px] text-[#b5bac1] mt-1">{mm}:{ss} {x.elapsed}</div>
                  </div>
                </div>
                <button className="mt-3 w-full rounded-[3px] bg-[#4e5058] hover:bg-[#5d5f66] text-[13px] font-medium py-1.5 transition">{x.open_btn}</button>
              </div>
            </div>
          </div>

          {/* Extension popup mockup */}
          <div className="animate-[fadeSlide_1s_ease-out]">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-3 text-center md:text-left">{x.popup_h}</div>
            <div className="mx-auto md:ml-0 w-full max-w-[340px] rounded-xl border border-border bg-[#0d0f14] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-purple-500" />
                  <strong className="text-sm">Aura</strong>
                  <span className="text-[10px] text-muted-foreground">v1.7.0</span>
                </div>
                <div className="h-4 w-8 rounded-full bg-primary relative"><span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white" /></div>
              </div>
              <div className="flex border-b border-border text-[11px]">
                {["Now", "Custom", "Apps", "Settings"].map((tab, i) => (
                  <div key={tab} className={`flex-1 text-center py-2 ${i === 0 ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>{tab}</div>
                ))}
              </div>
              <div className="p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#23a55a]/20 text-[#23a55a]">connected</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">aura.user</span>
                </div>
                <div className="rounded-md border border-border bg-card/60 p-2.5 flex gap-2.5">
                  <div className="h-10 w-10 rounded flex-none grid place-items-center" style={{ background: sample.color }}>
                    <img src={fav(sample.host)} className="h-5 w-5" alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase text-muted-foreground">Now showing</div>
                    <div className="text-xs font-semibold truncate">{sample.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{sample.details}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-border bg-card/40 py-1.5">
                    <div className="text-[10px] text-muted-foreground">Today</div>
                    <div className="text-sm font-bold">42m</div>
                  </div>
                  <div className="rounded-md border border-border bg-card/40 py-1.5">
                    <div className="text-[10px] text-muted-foreground">Streak</div>
                    <div className="text-sm font-bold">7d 🔥</div>
                  </div>
                  <div className="rounded-md border border-border bg-card/40 py-1.5">
                    <div className="text-[10px] text-muted-foreground">Apps</div>
                    <div className="text-sm font-bold">12</div>
                  </div>
                </div>
                <button className="w-full text-[11px] py-1.5 rounded border border-border text-muted-foreground hover:bg-card transition">⏸ Pause for 30 min</button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">{x.feat_h}</h2>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {x.feats.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/40 backdrop-blur p-5 hover:border-primary/40 transition">
                <div className="font-semibold mb-1">{f.t}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">{x.plat_h}</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">{x.plat_sub}</p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {CATEGORIES.map((cat) => (
              <div key={cat.name.en} className="rounded-xl border border-border bg-card/40 backdrop-blur p-5">
                <div className="font-semibold mb-3 text-sm">{cat.name[lang]}</div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((it) => (
                    <span key={it.n} className="inline-flex items-center gap-1.5 rounded-full bg-background/60 border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      <img src={fav(it.h)} alt="" width={12} height={12} className="rounded-sm" loading="lazy" />
                      {it.n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>

      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }
        @keyframes grow { 0%,100% { width: 20%; } 50% { width: 80%; } }
      `}</style>
    </main>
  );
}
