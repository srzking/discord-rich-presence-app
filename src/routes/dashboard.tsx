import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useLang } from "@/lib/i18n";
import { useExtension } from "@/hooks/useExtension";
import { downloadExtension } from "@/lib/aura";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Aura Dashboard — your activity at a glance" },
      { name: "description", content: "Local dashboard reading data straight from your Aura extension. No login, no server." },
    ],
  }),
  component: Dashboard,
});

const T = {
  en: { h: "Your dashboard", sub: "Reads your Aura data locally — nothing is sent anywhere.", not_installed: "Install the Aura extension to see your stats here.", today: "Today", week: "This week", alltime: "All-time", streak: "Streak", days: "days", platforms: "Top platforms", current: "Currently showing", none: "Nothing yet — open a supported site.", install: "Download Aura", min: "min", hours: "h", last7: "Last 7 days", categories: "By category", refresh: "Refresh", export: "Export JSON", noPlat: "No platforms tracked yet today." },
  pt: { h: "O teu painel", sub: "Lê os dados do Aura localmente — nada é enviado.", not_installed: "Instala a extensão Aura para veres as estatísticas aqui.", today: "Hoje", week: "Esta semana", alltime: "Total", streak: "Sequência", days: "dias", platforms: "Top plataformas", current: "A mostrar agora", none: "Ainda nada — abre um site suportado.", install: "Descarregar Aura", min: "min", hours: "h", last7: "Últimos 7 dias", categories: "Por categoria", refresh: "Atualizar", export: "Exportar JSON", noPlat: "Sem plataformas registadas hoje." },
  es: { h: "Tu panel", sub: "Lee tus datos de Aura localmente — no se envía nada.", not_installed: "Instala la extensión Aura para ver tus estadísticas aquí.", today: "Hoy", week: "Esta semana", alltime: "Total", streak: "Racha", days: "días", platforms: "Top plataformas", current: "Mostrando ahora", none: "Nada aún — abre un sitio compatible.", install: "Descargar Aura", min: "min", hours: "h", last7: "Últimos 7 días", categories: "Por categoría", refresh: "Actualizar", export: "Exportar JSON", noPlat: "Sin plataformas registradas hoy." },
};

type DashData = {
  trackedToday?: Record<string, number>;
  trackedByApp?: Record<string, number>;
  current?: { name?: string; details?: string; state?: string } | null;
};

const CAT: Record<string, { name: string; color: string }> = {
  youtube:{name:"Streaming",color:"#ef4444"}, netflix:{name:"Streaming",color:"#ef4444"}, twitch:{name:"Streaming",color:"#9146FF"}, primevideo:{name:"Streaming",color:"#0FAEFF"}, disneyplus:{name:"Streaming",color:"#1f80e0"}, hbomax:{name:"Streaming",color:"#a855f7"}, crunchyroll:{name:"Streaming",color:"#f97316"}, kick:{name:"Streaming",color:"#53fc18"}, vimeo:{name:"Streaming",color:"#19b7ea"}, tiktok:{name:"Streaming",color:"#ff0050"},
  spotify:{name:"Music",color:"#1DB954"}, soundcloud:{name:"Music",color:"#ff7700"}, applemusic:{name:"Music",color:"#fa233b"}, tidal:{name:"Music",color:"#000"}, deezer:{name:"Music",color:"#00c7f2"}, lastfm:{name:"Music",color:"#d51007"}, bandcamp:{name:"Music",color:"#629aa9"}, genius:{name:"Music",color:"#ffff64"},
  github:{name:"Dev",color:"#6e5494"}, gitlab:{name:"Dev",color:"#fc6d26"}, stackoverflow:{name:"Dev",color:"#f48024"}, vscode:{name:"Dev",color:"#007acc"}, mdn:{name:"Dev",color:"#83d0f2"}, figma:{name:"Dev",color:"#a259ff"}, huggingface:{name:"Dev",color:"#fcc006"},
  chatgpt:{name:"AI",color:"#10a37f"}, claude:{name:"AI",color:"#d97706"}, gemini:{name:"AI",color:"#4285F4"}, perplexity:{name:"AI",color:"#20808d"},
  x:{name:"Social",color:"#000"}, reddit:{name:"Social",color:"#FF4500"}, instagram:{name:"Social",color:"#E1306C"}, linkedin:{name:"Social",color:"#0a66c2"}, pinterest:{name:"Social",color:"#bd081c"}, telegram:{name:"Social",color:"#229ED9"}, whatsapp:{name:"Social",color:"#25D366"},
  pawsy:{name:"Furry",color:"#ff8ab4"}, furaffinity:{name:"Furry",color:"#faaf3a"}, e621:{name:"Furry",color:"#012e57"},
};
const catOf = (id: string) => CAT[id] || { name: "Other", color: "#94a3b8" };

function Dashboard() {
  const [lang] = useLang();
  const t = T[lang];
  const { installed } = useExtension();
  const [data, setData] = useState<DashData | null>(null);

  const ping = () => typeof window !== "undefined" && window.postMessage({ source: "aura-page", type: "dashreq" }, "*");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source === "aura-extension" && e.data.type === "dashdata") setData(e.data.data || {});
    };
    window.addEventListener("message", onMsg);
    ping();
    const i = setInterval(ping, 4000);
    return () => { window.removeEventListener("message", onMsg); clearInterval(i); };
  }, []);

  const { todayMin, weekMin, allMin, streak, last7, top, byCat } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const tt = data?.trackedToday || {};
    const ta = data?.trackedByApp || {};
    const todayMin = Math.round((tt[today] || 0) / 60);
    // last 7 days
    const last7: { d: string; min: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const k = dt.toISOString().slice(0, 10);
      last7.push({ d: k, min: Math.round((tt[k] || 0) / 60), label: dt.toLocaleDateString(undefined, { weekday: "short" }) });
    }
    const weekMin = last7.reduce((a, b) => a + b.min, 0);
    const allMin = Math.round(Object.values(tt).reduce((a, b) => a + (b as number), 0) / 60);
    // streak (consecutive days back from today with >0)
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const k = dt.toISOString().slice(0, 10);
      if ((tt[k] || 0) > 60) streak++; else break;
    }
    const top = Object.entries(ta)
      .filter(([k]) => k.startsWith(today + ":"))
      .map(([k, v]) => [k.split(":")[1], v as number] as const)
      .sort((a, b) => b[1] - a[1]).slice(0, 8);
    // by category aggregated for last 7 days
    const cutoff = new Set(last7.map(d => d.d));
    const catMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(ta)) {
      const [d, id] = k.split(":");
      if (!cutoff.has(d)) continue;
      const c = catOf(id).name;
      catMap[c] = (catMap[c] || 0) + (v as number);
    }
    const byCat = Object.entries(catMap).map(([n, sec]) => ({ n, min: Math.round(sec / 60) })).sort((a, b) => b.min - a.min);
    return { todayMin, weekMin, allMin, streak, last7, top, byCat };
  }, [data]);

  const max7 = Math.max(1, ...last7.map(d => d.min));
  const maxTop = top[0]?.[1] || 1;
  const totalCat = byCat.reduce((a, b) => a + b.min, 0) || 1;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "aura-stats.json"; a.click();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <SiteHeader />

        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t.h}</h1>
            <p className="mt-2 text-muted-foreground">{t.sub}</p>
          </div>
          {installed && (
            <div className="flex gap-2">
              <button onClick={ping} className="rounded-lg border border-border bg-card/50 px-3 py-2 text-xs hover:bg-card">↻ {t.refresh}</button>
              <button onClick={exportJson} className="rounded-lg border border-border bg-card/50 px-3 py-2 text-xs hover:bg-card">⬇ {t.export}</button>
            </div>
          )}
        </div>

        {!installed ? (
          <div className="mt-12 rounded-2xl border border-border bg-card/50 p-10 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-muted-foreground mb-6">{t.not_installed}</p>
            <button onClick={downloadExtension} className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">{t.install}</button>
            <Link to="/" className="ml-2 inline-block rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-card transition">← Home</Link>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label={t.today} value={todayMin} suffix={t.min} />
              <Stat label={t.week} value={weekMin} suffix={t.min} />
              <Stat label={t.alltime} value={allMin >= 60 ? +(allMin / 60).toFixed(1) : allMin} suffix={allMin >= 60 ? t.hours : t.min} />
              <Stat label={t.streak} value={streak} suffix={t.days + (streak > 0 ? " 🔥" : "")} />
            </div>

            {/* Current */}
            <div className="mt-6 rounded-xl border border-border bg-card/40 p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t.current}</div>
              {data?.current ? (
                <div>
                  <div className="font-semibold text-lg">{data.current.name}</div>
                  <div className="text-sm text-muted-foreground">{data.current.details}</div>
                  <div className="text-sm text-muted-foreground">{data.current.state}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t.none}</div>
              )}
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-3">
              {/* 7-day bar chart */}
              <div className="rounded-xl border border-border bg-card/40 p-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">{t.last7}</div>
                <div className="flex items-end gap-2 h-40">
                  {last7.map((d) => (
                    <div key={d.d} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">{d.min}m</div>
                      <div className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary transition-all" style={{ height: `${(d.min / max7) * 100}%`, minHeight: d.min ? 4 : 2 }} />
                      <div className="text-[10px] text-muted-foreground">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By category */}
              <div className="rounded-xl border border-border bg-card/40 p-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">{t.categories}</div>
                {byCat.length ? (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-border">
                      {byCat.map((c) => (
                        <div key={c.n} className="h-full" style={{ width: `${(c.min / totalCat) * 100}%`, background: catColor(c.n) }} title={`${c.n} · ${c.min}m`} />
                      ))}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {byCat.map((c) => (
                        <div key={c.n} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: catColor(c.n) }} />
                          <span>{c.n}</span>
                          <span className="ml-auto text-muted-foreground">{c.min}m</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">{t.noPlat}</div>
                )}
              </div>
            </div>

            {/* Top platforms */}
            <div className="mt-6 rounded-xl border border-border bg-card/40 p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">{t.platforms}</div>
              {top.length ? (
                <div className="space-y-2">
                  {top.map(([id, sec]) => (
                    <div key={id} className="grid grid-cols-[110px_1fr_56px] gap-3 items-center text-sm">
                      <span className="capitalize flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: catOf(id).color }} />{id}</span>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(8, (sec / maxTop) * 100)}%`, background: `linear-gradient(90deg, ${catOf(id).color}, ${catOf(id).color}aa)` }} />
                      </div>
                      <span className="text-muted-foreground text-right">{Math.round(sec / 60)}m</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t.noPlat}</div>
              )}
            </div>
          </>
        )}

        <SiteFooter />
      </div>
    </main>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="text-3xl font-bold">{value}<span className="text-sm font-normal text-muted-foreground ml-1.5">{suffix}</span></div>
    </div>
  );
}

const CAT_COLORS: Record<string, string> = { Streaming: "#ef4444", Music: "#1DB954", Dev: "#6e5494", AI: "#10a37f", Social: "#0a66c2", Furry: "#ff8ab4", Other: "#94a3b8" };
function catColor(n: string) { return CAT_COLORS[n] || "#94a3b8"; }
