import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import auraIcon from "@/assets/aura-icon.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura — Rich Presence for the Web" },
      { name: "description", content: "Show what you're watching, listening to or browsing on Discord — automatically. Free Chrome extension supporting 27+ web platforms." },
    ],
  }),
  component: Index,
});

type Lang = "en" | "pt" | "es";

const T: Record<Lang, Record<string, string>> = {
  en: {
    nav_features: "Features", nav_platforms: "Platforms", nav_setup: "Setup", nav_faq: "FAQ",
    badge: "Discord Rich Presence · for the web",
    h1a: "Your aura,", h1b: "wherever you browse.",
    sub: "A tiny Chrome extension that updates your Discord profile with whatever you're watching, listening to, or doing on the web.",
    download: "Download Aura", how: "How it works", tag_short: "Discord Rich Presence — for the open web.",
    example_h: "Looks like this on your profile.",
    ex_listening: "Listening to Spotify", ex_song: "Midnight City", ex_artist: "M83 — Hurry Up, We're Dreaming",
    ex_open: "Open in browser",
    bye_h: "Sad to see you go.", bye_sub: "Thanks for trying Aura. Mind telling us why you uninstalled? Reinstall anytime.",
    bye_close: "Close",
    free: "Free · Chromium browsers · No account required",
    feat_h: "Built for control.",
    f1t: "Auto-detect", f1d: "Recognises your activity on 27+ web platforms in real time.",
    f2t: "Custom activity", f2d: "Override with your own Playing / Watching / Listening / Competing line.",
    f3t: "Per-site toggles", f3d: "Turn off any platform you'd rather not share, with search.",
    f4t: "Idle awareness", f4d: "Switches your status to idle when you step away.",
    f5t: "Privacy first", f5d: "Skips incognito tabs and runs entirely in your browser.",
    f6t: "On / off switch", f6d: "Pause Aura whenever you want with a single click.",
    f7t: "Time tracker", f7d: "See how many minutes of activity Aura tracked today.",
    f8t: "Export / import", f8d: "Move your settings between machines as a single file.",
    f9t: "Multilingual", f9d: "English, Português and Español out of the box.",
    plat_h: "27+ platforms supported.", plat_sub: "More added regularly.",
    setup_h: "Setup in under 2 minutes.",
    s1t: "Download & unzip", s1d: "Click Download Aura above and unzip the file.",
    s2t: "Load it in Chrome", s2d_pre: "Open ", s2d_post: ", enable Developer mode, click Load unpacked and select the folder.",
    s3t: "Get your Discord token", s3d: "Open Discord in browser → DevTools → Network → copy the Authorization header from any request.",
    s4t: "Connect", s4d: "Open the Aura popup → Account → paste your token → Login & Connect.",
    s5t: "You're live", s5d: "Browse a supported site. Your Discord profile updates automatically.",
    faq_h: "Frequently asked.",
    q1: "Is it safe to enter my token?", a1: "Your token never leaves your browser. It's stored locally and connects directly to Discord's gateway.",
    q2: "Will my account get banned?", a2: "Aura behaves like the official client and only updates your presence — but using user tokens is at your own risk per Discord's TOS. Use a bot token if you want zero risk.",
    q3: "Will it slow down my browser?", a3: "Aura uses a tiny background WebSocket and reads page titles. Negligible CPU and memory.",
    q4: "Does it work in Firefox?", a4: "Currently Chromium browsers only (Chrome, Edge, Brave, Arc, Opera). Firefox support is on the roadmap.",
    footer: "Aura is not affiliated with Discord. Crafted with ♥ for the open web.",
  },
  pt: {
    nav_features: "Funcionalidades", nav_platforms: "Plataformas", nav_setup: "Configuração", nav_faq: "FAQ",
    badge: "Rich Presence do Discord · para a web",
    h1a: "A tua aura,", h1b: "em qualquer lado da web.",
    sub: "Uma pequena extensão para Chrome que atualiza o teu perfil do Discord com o que estás a ver, ouvir ou fazer na web.",
    download: "Descarregar Aura", how: "Como funciona", tag_short: "Rich Presence do Discord — para a web aberta.",
    example_h: "Aparece assim no teu perfil.",
    ex_listening: "A ouvir no Spotify", ex_song: "Midnight City", ex_artist: "M83 — Hurry Up, We're Dreaming",
    ex_open: "Abrir no browser",
    bye_h: "Triste por te ver partir.", bye_sub: "Obrigado por experimentares o Aura. Volta quando quiseres.",
    bye_close: "Fechar",
    free: "Grátis · Navegadores Chromium · Sem conta necessária",
    feat_h: "Pensado para teres o controlo.",
    f1t: "Deteção automática", f1d: "Reconhece a tua atividade em mais de 27 sites em tempo real.",
    f2t: "Atividade personalizada", f2d: "Substitui com a tua própria linha de Jogar / Ver / Ouvir / Competir.",
    f3t: "Sites individuais", f3d: "Desativa as plataformas que não queres partilhar, com pesquisa.",
    f4t: "Ausente automático", f4d: "Muda o estado para ausente quando te afastas.",
    f5t: "Privacidade primeiro", f5d: "Ignora separadores anónimos e corre só no teu navegador.",
    f6t: "Botão on / off", f6d: "Pausa o Aura sempre que quiseres com um clique.",
    f7t: "Contador de tempo", f7d: "Vê quantos minutos de atividade o Aura registou hoje.",
    f8t: "Exportar / importar", f8d: "Move as tuas definições entre máquinas num único ficheiro.",
    f9t: "Multilingue", f9d: "Inglês, Português e Espanhol incluídos.",
    plat_h: "Mais de 27 plataformas.", plat_sub: "E são adicionadas mais regularmente.",
    setup_h: "Configura em menos de 2 minutos.",
    s1t: "Descarregar e descompactar", s1d: "Clica em Descarregar Aura e descompacta o ficheiro.",
    s2t: "Carregar no Chrome", s2d_pre: "Abre ", s2d_post: ", ativa o Modo de programador, clica em Carregar descompactado e escolhe a pasta.",
    s3t: "Obter o teu token do Discord", s3d: "Abre o Discord no browser → DevTools → Network → copia o cabeçalho Authorization de qualquer pedido.",
    s4t: "Conectar", s4d: "Abre o popup do Aura → Conta → cola o token → Entrar e Conectar.",
    s5t: "Estás online", s5d: "Visita um site suportado. O teu perfil do Discord atualiza-se sozinho.",
    faq_h: "Perguntas frequentes.",
    q1: "É seguro inserir o token?", a1: "O teu token nunca sai do navegador. Fica guardado localmente e liga-se diretamente ao gateway do Discord.",
    q2: "A minha conta pode ser banida?", a2: "O Aura comporta-se como o cliente oficial e só atualiza a tua presença — mas usar tokens de utilizador é por tua conta e risco segundo os TOS do Discord.",
    q3: "Vai abrandar o meu navegador?", a3: "O Aura usa um pequeno WebSocket em background e lê títulos de página. CPU e memória negligenciáveis.",
    q4: "Funciona no Firefox?", a4: "Por enquanto só em navegadores Chromium (Chrome, Edge, Brave, Arc, Opera). Firefox está no plano.",
    footer: "Aura não tem ligação ao Discord. Feito com ♥ para a web aberta.",
  },
  es: {
    nav_features: "Funciones", nav_platforms: "Plataformas", nav_setup: "Configuración", nav_faq: "FAQ",
    badge: "Rich Presence de Discord · para la web",
    h1a: "Tu aura,", h1b: "donde sea que navegues.",
    sub: "Una pequeña extensión de Chrome que actualiza tu perfil de Discord con lo que estás viendo, escuchando o haciendo en la web.",
    download: "Descargar Aura", how: "Cómo funciona", tag_short: "Rich Presence de Discord — para la web abierta.",
    example_h: "Se ve así en tu perfil.",
    ex_listening: "Escuchando en Spotify", ex_song: "Midnight City", ex_artist: "M83 — Hurry Up, We're Dreaming",
    ex_open: "Abrir en navegador",
    bye_h: "Triste verte partir.", bye_sub: "Gracias por probar Aura. Vuelve cuando quieras.",
    bye_close: "Cerrar",
    free: "Gratis · Navegadores Chromium · Sin cuenta",
    feat_h: "Hecho para tener el control.",
    f1t: "Detección automática", f1d: "Reconoce tu actividad en más de 27 sitios en tiempo real.",
    f2t: "Actividad personalizada", f2d: "Anula con tu propia línea de Jugando / Viendo / Escuchando / Compitiendo.",
    f3t: "Sitios individuales", f3d: "Desactiva las plataformas que prefieras no compartir, con búsqueda.",
    f4t: "Ausente automático", f4d: "Cambia tu estado a ausente cuando te alejas.",
    f5t: "Privacidad primero", f5d: "Ignora pestañas de incógnito y corre solo en tu navegador.",
    f6t: "Interruptor on / off", f6d: "Pausa Aura cuando quieras con un solo clic.",
    f7t: "Contador de tiempo", f7d: "Mira cuántos minutos de actividad registró Aura hoy.",
    f8t: "Exportar / importar", f8d: "Mueve tus ajustes entre equipos en un solo archivo.",
    f9t: "Multilingüe", f9d: "Inglés, Portugués y Español incluidos.",
    plat_h: "Más de 27 plataformas.", plat_sub: "Y se añaden más regularmente.",
    setup_h: "Configura en menos de 2 minutos.",
    s1t: "Descarga y descomprime", s1d: "Pulsa Descargar Aura y descomprime el archivo.",
    s2t: "Cárgalo en Chrome", s2d_pre: "Abre ", s2d_post: ", activa Modo desarrollador, pulsa Cargar descomprimida y elige la carpeta.",
    s3t: "Obtén tu token de Discord", s3d: "Abre Discord en el navegador → DevTools → Network → copia el header Authorization de cualquier petición.",
    s4t: "Conecta", s4d: "Abre el popup de Aura → Cuenta → pega tu token → Iniciar sesión.",
    s5t: "¡Listo!", s5d: "Visita un sitio compatible. Tu perfil de Discord se actualiza solo.",
    faq_h: "Preguntas frecuentes.",
    q1: "¿Es seguro introducir el token?", a1: "Tu token nunca sale del navegador. Se guarda localmente y se conecta directo al gateway de Discord.",
    q2: "¿Pueden banear mi cuenta?", a2: "Aura se comporta como el cliente oficial y solo actualiza tu presencia — pero usar tokens de usuario es bajo tu responsabilidad según los TOS de Discord.",
    q3: "¿Ralentiza el navegador?", a3: "Aura usa un pequeño WebSocket en segundo plano y lee títulos de página. CPU y memoria mínimos.",
    q4: "¿Funciona en Firefox?", a4: "Por ahora solo en navegadores Chromium (Chrome, Edge, Brave, Arc, Opera). Firefox en el roadmap.",
    footer: "Aura no está afiliado a Discord. Hecho con ♥ para la web abierta.",
  },
};

const PLATFORMS = [
  "YouTube","Netflix","Spotify","Twitch","GitHub","X","Reddit","SoundCloud",
  "Prime Video","Disney+","Max","Crunchyroll","Stack Overflow","Wikipedia",
  "VS Code Web","Apple Music","Tidal","Deezer","Vimeo","LinkedIn","Medium",
  "Notion","Figma","ChatGPT","Gmail","Pinterest","TikTok",
];

function download() {
  fetch("/aura.zip").then(r => { if (!r.ok) throw new Error("Download failed"); return r.blob(); })
    .then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "aura.zip"; a.click(); URL.revokeObjectURL(a.href); })
    .catch(e => alert(e.message));
}

function RotatingFeatures({ items }: { items: [string, string][] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(v => (v + 1) % items.length), 3200);
    return () => clearInterval(id);
  }, [items.length]);
  const a = items[i];
  const b = items[(i + 1) % items.length];
  return (
    <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto min-h-[140px]">
      {[a, b].map(([title, desc], k) => (
        <div
          key={`${i}-${k}`}
          className="rounded-xl border border-border bg-card/50 backdrop-blur p-6 animate-[fadeSlide_.5s_ease-out]"
        >
          <div className="font-semibold mb-2">{title}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
        </div>
      ))}
      <style>{`@keyframes fadeSlide { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }`}</style>
    </div>
  );
}

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("aura-lang") as Lang | null;
    if (saved && T[saved]) { setLang(saved); return; }
    const nav = (navigator.language || "en").slice(0,2) as Lang;
    if (T[nav]) setLang(nav);
  }, []);
  const change = (l: Lang) => { setLang(l); localStorage.setItem("aura-lang", l); };
  const x = T[lang];

  const features = [["f1t","f1d"],["f2t","f2d"],["f3t","f3d"],["f4t","f4d"],["f5t","f5d"],["f6t","f6d"],["f7t","f7d"],["f8t","f8d"],["f9t","f9d"]];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <img src={auraIcon} alt="Aura" width={36} height={36} className="rounded-lg" />
            <span className="font-semibold text-lg">Aura</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">{x.nav_features}</a>
            <a href="#platforms" className="hover:text-foreground">{x.nav_platforms}</a>
            <a href="#setup" className="hover:text-foreground">{x.nav_setup}</a>
            <a href="#faq" className="hover:text-foreground">{x.nav_faq}</a>
          </nav>
          <div className="flex gap-1 rounded-md border border-border bg-card p-0.5 text-xs">
            {(["en","pt","es"] as Lang[]).map(l => (
              <button key={l} onClick={() => change(l)}
                className={`px-2 py-1 rounded ${lang===l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <section className="text-center pt-8">
          <span className="inline-block rounded-full border border-border bg-card/50 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">
            {x.badge}
          </span>
          <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            {x.h1a}<br />
            <span className="text-primary">{x.h1b}</span>
          </h1>
          <p className="mt-7 text-lg text-muted-foreground max-w-xl mx-auto">{x.sub}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={download} className="rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/30">
              {x.download}
            </button>
            <a href="#setup" className="rounded-lg border border-border bg-card/50 backdrop-blur px-7 py-3.5 text-sm font-semibold hover:bg-card transition">
              {x.how}
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{x.tag_short}</p>
        </section>

        <section id="features" className="mt-32">
          <h2 className="text-3xl font-bold mb-10 text-center">{x.feat_h}</h2>
          <RotatingFeatures items={features.map(([tk, dk]) => [x[tk], x[dk]] as [string, string])} />
        </section>

        <section id="platforms" className="mt-32">
          <h2 className="text-3xl font-bold mb-3 text-center">{x.plat_h}</h2>
          <p className="text-center text-muted-foreground mb-8">{x.plat_sub}</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {PLATFORMS.map(p => (
              <span key={p} className="rounded-full bg-card border border-border px-4 py-1.5 text-sm">{p}</span>
            ))}
          </div>
        </section>

        <section id="setup" className="mt-32">
          <h2 className="text-3xl font-bold mb-10 text-center">{x.setup_h}</h2>
          <ol className="space-y-3 max-w-2xl mx-auto">
            {[
              [x.s1t, x.s1d],
              [x.s2t, <>{x.s2d_pre}<code className="rounded bg-card border border-border px-1.5 py-0.5 text-xs">chrome://extensions</code>{x.s2d_post}</>],
              [x.s3t, <>{x.s3d.replace("Developer Portal", "")}<a className="text-primary hover:underline" href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Developer Portal</a>.</>],
              [x.s4t, x.s4d],
              [x.s5t, x.s5d],
            ].map(([title, body], i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-border bg-card/50 backdrop-blur p-5">
                <span className="flex-none h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center text-sm font-bold">{i + 1}</span>
                <div>
                  <div className="font-semibold mb-0.5">{title as string}</div>
                  <div className="text-sm text-muted-foreground">{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="faq" className="mt-32">
          <h2 className="text-3xl font-bold mb-10 text-center">{x.faq_h}</h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[["q1","a1"],["q2","a2"],["q3","a3"],["q4","a4"]].map(([q, a]) => (
              <details key={q} className="rounded-xl border border-border bg-card/50 backdrop-blur p-5 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  {x[q]}
                  <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{x[a]}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-32 mb-6 text-center text-xs text-muted-foreground">{x.footer}</footer>
      </div>
    </main>
  );
}
