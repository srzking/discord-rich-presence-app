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
      { name: "description", content: "Show what you're watching, listening to or browsing on Discord — automatically. Free Chromium extension supporting 45+ web platforms." },
    ],
  }),
  component: Index,
});

const HERO: Record<"en" | "pt" | "es", { badge: string; h1a: string; h1b: string; sub: string; download: string; free: string; example_h: string; ex_now: string[]; feat_h: string; feats: { t: string; d: string }[]; plat_h: string; plat_sub: string }> = {
  en: {
    badge: "Discord Rich Presence — for the open web",
    h1a: "Your aura,", h1b: "wherever you browse.",
    sub: "Tiny extension. Updates your Discord profile with whatever you're watching, listening to, or doing on the web. No account, no servers.",
    download: "Download", free: "Free · Chromium · No account · No DB",
    example_h: "Looks like this on your profile",
    ex_now: ["Listening to Spotify", "Watching YouTube", "Playing on GitHub", "Competing on LeetCode"],
    feat_h: "Everything you need",
    feats: [
      { t: "Auto-detect", d: "45+ websites tracked in real time, grouped by category." },
      { t: "Custom activity", d: "Override with any text, image and type — live preview while you edit." },
      { t: "Privacy first", d: "Token stays in your browser. No telemetry, no DB, no account." },
      { t: "Languages", d: "EN / PT / ES across the extension and the website." },
    ],
    plat_h: "By category",
    plat_sub: "Toggle anything you don't want from the popup.",
  },
  pt: {
    badge: "Discord Rich Presence — para a web aberta",
    h1a: "A tua aura,", h1b: "em qualquer lado da web.",
    sub: "Extensão pequena. Atualiza o teu perfil do Discord com o que estás a ver, ouvir ou fazer na web. Sem conta, sem servidores.",
    download: "Descarregar", free: "Grátis · Chromium · Sem conta · Sem DB",
    example_h: "Aparece assim no teu perfil",
    ex_now: ["A ouvir no Spotify", "A ver no YouTube", "A jogar no GitHub", "A competir no LeetCode"],
    feat_h: "Tudo o que precisas",
    feats: [
      { t: "Auto-deteção", d: "45+ sites em tempo real, agrupados por categoria." },
      { t: "Atividade custom", d: "Substitui com qualquer texto, imagem e tipo — preview ao vivo." },
      { t: "Privacidade", d: "O token fica no browser. Sem telemetria, sem DB, sem conta." },
      { t: "Idiomas", d: "EN / PT / ES em toda a extensão e site." },
    ],
    plat_h: "Por categoria",
    plat_sub: "Desativa qualquer um que não queiras no popup.",
  },
  es: {
    badge: "Discord Rich Presence — para la web abierta",
    h1a: "Tu aura,", h1b: "donde sea que navegues.",
    sub: "Extensión pequeña. Actualiza tu perfil de Discord con lo que estás viendo, escuchando o haciendo en la web. Sin cuenta, sin servidores.",
    download: "Descargar", free: "Gratis · Chromium · Sin cuenta · Sin DB",
    example_h: "Se ve así en tu perfil",
    ex_now: ["Escuchando en Spotify", "Viendo YouTube", "Jugando en GitHub", "Compitiendo en LeetCode"],
    feat_h: "Todo lo que necesitas",
    feats: [
      { t: "Auto-detección", d: "45+ sitios en tiempo real, agrupados por categoría." },
      { t: "Actividad custom", d: "Sustituye con cualquier texto, imagen y tipo — vista previa en vivo." },
      { t: "Privacidad", d: "El token queda en el navegador. Sin telemetría, sin DB, sin cuenta." },
      { t: "Idiomas", d: "EN / PT / ES en toda la extensión y el sitio." },
    ],
    plat_h: "Por categoría",
    plat_sub: "Desactiva cualquiera que no quieras en el popup.",
  },
};

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

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("goodbye") === "1") setBye(true);
    const i = setInterval(() => setExIdx((n) => (n + 1) % x.ex_now.length), 3000);
    return () => clearInterval(i);
  }, [x.ex_now.length]);

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

        {/* Live example */}
        <section className="mt-24 flex justify-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-primary/10 animate-[fadeSlide_.9s_ease-out]">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-3">{x.example_h}</div>
            <div className="rounded-xl bg-background/60 border border-border p-4">
              <div key={exIdx} className="text-[10px] uppercase tracking-wider text-primary font-bold mb-3 animate-[fadeSlide_.4s_ease-out]">
                {x.ex_now[exIdx]}
              </div>
              <div className="flex gap-3">
                <div className="relative h-16 w-16 rounded-md bg-gradient-to-br from-primary to-purple-500 flex-none animate-pulse" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">Midnight City</div>
                  <div className="text-xs text-muted-foreground truncate">M83 — Hurry Up, We're Dreaming</div>
                  <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-primary animate-[grow_3s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
              <button className="mt-3 w-full rounded-md border border-border bg-card text-xs py-2 hover:bg-background transition">Open in browser</button>
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
                    <span key={it} className="rounded-full bg-background/60 border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{it}</span>
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
