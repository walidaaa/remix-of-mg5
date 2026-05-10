import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Car, Mail, Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — MG5 Maintenance" },
      { name: "description", content: "Connectez-vous pour accéder à vos données." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setInfo("Compte créé. Vérifiez votre email pour confirmer.");
      }
    } catch (e: any) {
      setError(e.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Erreur Google");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="bg-primary/15 text-primary p-3 rounded-xl"><Car size={28} /></div>
          </div>
          <h1 className="font-display text-4xl text-primary">MG5 Maintenance</h1>
          <p className="text-muted-foreground text-sm mt-2">Connectez-vous pour accéder à vos données</p>
        </div>

        <div className="rounded-2xl gradient-card p-6 md:p-8 shadow-card">
          <button
            onClick={google}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 px-4 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="grid gap-4">
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </label>
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Mot de passe</div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password" required minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </label>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>}
            {info && <div className="text-sm text-success bg-success/10 p-3 rounded-lg">{info}</div>}

            <button
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="animate-spin" size={16} />}
              {mode === "signin" ? "Se connecter" : "Créer un compte"}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Pas de compte ? Créer un compte" : "Déjà inscrit ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
