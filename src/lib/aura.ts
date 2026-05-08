export function downloadExtension() {
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

export function useExtensionInstalled() {
  if (typeof window === "undefined") return false;
  // Synchronous quick check via attribute set by content script.
  return document.documentElement.getAttribute("data-aura-installed") === "1";
}
