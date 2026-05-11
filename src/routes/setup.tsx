import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminExists, setupFirstAdmin } from "@/lib/admin.functions";
import { Car, User, Lock, Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Configuration initiale — MG5 Maintenance" },
      { name: "description", content: "Créer le compte super admin" },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const nav = useNavigate();
  const checkAdmin = useServerFn(adminExists);
  const setup = useServerFn(setupFirstAdmin);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin()
      .then((r) => {
        if (r.exists) nav({ to: "/login" });
      })
      .finally(() => setChecking(false));
  }, [checkAdmin, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await setup({ data: { username, password } });
      const { error: sErr } = await supabase.auth.signInWithPassword({
        email: r.email,
        password,
      });
      if (sErr) throw sErr;
      nav({ to: "/admin" });
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="bg-primary/15 text-primary p-3 rounded-xl">
              <ShieldCheck size={28} />
            </div>
          </div>
          <h1 className="font-display text-4xl text-primary">Configuration</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Créer le compte super admin (premier accès uniquement)
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl gradient-card p-6 md:p-8 shadow-card grid gap-4">
          <label className="block">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Username admin</div>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder="admin"
                className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </label>
          <label className="block">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Mot de passe</div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </label>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>}

          <button
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="animate-spin" size={16} />}
            Créer le compte admin
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Car size={12} /> Vous gérerez ensuite les utilisateurs et marques
          </div>
        </form>
      </div>
    </div>
  );
}
