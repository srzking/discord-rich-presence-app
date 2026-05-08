import { useEffect, useState } from "react";

export function useExtension() {
  const [installed, setInstalled] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      if (document.documentElement.getAttribute("data-aura-installed") === "1") {
        setInstalled(true);
      }
    };
    check();
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source === "aura-extension") {
        setInstalled(true);
        if (e.data.version) setVersion(e.data.version);
      }
    };
    window.addEventListener("message", onMsg);
    window.postMessage({ source: "aura-page", type: "ping" }, "*");
    const t = setTimeout(check, 600);
    return () => { window.removeEventListener("message", onMsg); clearTimeout(t); };
  }, []);

  return { installed, version };
}
