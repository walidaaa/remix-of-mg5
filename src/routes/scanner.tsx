import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useRef, useState } from "react";
import { ScanLine, Camera, X, Copy, Check, Trash2 } from "lucide-react";
import { addScan, fetchScans, deleteScan, type Scan } from "@/lib/storage";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner — MG5 Maintenance" },
      { name: "description", content: "Scannez un code-barres ou QR (reçu, bidon d'huile, filtre)." },
    ],
  }),
  component: ScannerPage,
});

function ScannerPage() {
  const [active, setActive] = useState(false);
  const [results, setResults] = useState<Scan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const containerId = "qr-reader-element";
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    fetchScans().then(setResults);
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new mod.Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decoded: string) => {
            if (results[0]?.value === decoded) return;
            const saved = await addScan(decoded);
            if (saved) setResults((prev) => [saved, ...prev].slice(0, 30));
          },
          () => {}
        );
      } catch (e: any) {
        setError(e?.message || "Impossible d'accéder à la caméra");
        setActive(false);
      }
    })();
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().catch(() => {}).finally(() => s.clear?.());
        scannerRef.current = null;
      }
    };
  }, [active]);

  const copy = async (v: string) => {
    await navigator.clipboard.writeText(v);
    setCopied(v);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AppShell>
      <h1 className="text-3xl mb-2">Scanner</h1>
      <p className="text-muted-foreground mb-6">
        Scannez un code-barres ou QR (reçu, bidon d'huile, filtre).
      </p>

      <div className="rounded-2xl gradient-card p-6 shadow-card mb-6">
        {!active ? (
          <button
            onClick={() => { setError(null); setActive(true); }}
            className="w-full py-12 flex flex-col items-center gap-3 border-2 border-dashed border-border rounded-xl hover:border-primary hover:text-primary transition"
          >
            <Camera size={40} />
            <span className="font-semibold">Démarrer le scanner</span>
            <span className="text-xs text-muted-foreground">Accès caméra requis</span>
          </button>
        ) : (
          <div>
            <div className="relative rounded-xl overflow-hidden bg-black">
              <div id={containerId} className="w-full" />
              <div className="absolute inset-0 pointer-events-none border-4 border-primary/50 rounded-xl" />
            </div>
            <button
              onClick={() => setActive(false)}
              className="mt-4 inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg"
            >
              <X size={16} /> Arrêter
            </button>
          </div>
        )}
        {error && (
          <div className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl mb-3 flex items-center gap-2">
          <ScanLine size={20} className="text-accent" /> Résultats
        </h2>
        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun code scanné.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.id} className="rounded-xl gradient-card p-4 shadow-card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">{r.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.at).toLocaleString("fr-FR")}
                  </div>
                </div>
                <button onClick={() => copy(r.value)} className="text-muted-foreground hover:text-primary p-2">
                  {copied === r.value ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={async () => { await deleteScan(r.id); setResults((p) => p.filter((x) => x.id !== r.id)); }}
                  className="text-muted-foreground hover:text-destructive p-2"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
