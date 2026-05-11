import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminExists, resolveUsername } from "@/lib/admin.functions";
import { User, Lock, Loader2, ShieldCheck, Wrench, Droplet, Languages, Eye, EyeOff } from "lucide-react";
import mg5Photo from "@/assets/mg5-exterior.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — MG5 Maintenance" },
      { name: "description", content: "Connectez-vous pour accéder à vos données." },
    ],
  }),
  component: LoginPage,
});

type Lang = "fr" | "ar";

const T = {
  fr: {
    brand: "MG5 Maintenance",
    tagline: "Suivi vidange, entretien & assurance",
    welcome: "Bon retour",
    sub: "Connectez-vous avec votre nom d'utilisateur",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    submit: "Se connecter",
    showPwd: "Afficher le mot de passe",
    hidePwd: "Masquer le mot de passe",
    err: "Nom d'utilisateur ou mot de passe incorrect",
    contact: "Pas de compte ? Contactez l'administrateur.",
    f1: "Suivi vidanges",
    f2: "Alertes entretien",
    f3: "Assurance auto",
    footer: "© MG5 Maintenance",
  },
  ar: {
    brand: "صيانة MG5",
    tagline: "متابعة تغيير الزيت، الصيانة والتأمين",
    welcome: "مرحبا بعودتك",
    sub: "سجّل الدخول باسم المستخدم",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    submit: "تسجيل الدخول",
    showPwd: "إظهار كلمة المرور",
    hidePwd: "إخفاء كلمة المرور",
    err: "اسم المستخدم أو كلمة المرور غير صحيحة",
    contact: "ليس لديك حساب؟ تواصل مع المسؤول.",
    f1: "متابعة الزيوت",
    f2: "تنبيهات الصيانة",
    f3: "تأمين السيارة",
    footer: "© صيانة MG5",
  },
} as const;

function LoginPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const checkAdmin = useServerFn(adminExists);
  const resolve = useServerFn(resolveUsername);

  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fr";
    return (localStorage.getItem("mg5-lang") as Lang) || "fr";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = T[lang];
  const rtl = lang === "ar";

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("mg5-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [lang, rtl]);

  useEffect(() => {
    checkAdmin().then((r) => {
      if (!r.exists) nav({ to: "/setup" });
    });
  }, [checkAdmin, nav]);

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { email } = await resolve({ data: { username } });
      const { error: sErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sErr) throw new Error(t.err);
    } catch (e: any) {
      setError(e?.message ?? t.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen bg-background grid lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src={mg5Photo} alt="MG5" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-primary/30" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-xl px-3 py-2 font-display text-2xl shadow-glow">MG5</div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">Maintenance</div>
          </div>
          <div>
            <h2 className="font-display text-5xl xl:text-6xl text-foreground leading-tight">{t.welcome}</h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-md">{t.tagline}</p>
            <div className="mt-8 grid gap-3 max-w-sm">
              <Feature icon={Droplet} label={t.f1} />
              <Feature icon={Wrench} label={t.f2} />
              <Feature icon={ShieldCheck} label={t.f3} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{t.footer}</div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10 relative">
        <LangToggle lang={lang} setLang={setLang} />

        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-primary text-primary-foreground rounded-xl px-3 py-2 font-display text-2xl shadow-glow">MG5</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Maintenance</div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-foreground">{t.welcome}</h1>
          <p className="text-muted-foreground text-sm mt-2 mb-8">{t.sub}</p>

          <form onSubmit={submit} className="grid gap-4">
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{t.username}</div>
              <div className="relative">
                <User size={16} className={`absolute ${rtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  dir="ltr"
                  className={`w-full bg-input border border-border rounded-lg ${rtl ? "pr-9 pl-3 text-right" : "pl-9 pr-3"} py-3 focus:outline-none focus:ring-2 focus:ring-ring`}
                />
              </div>
            </label>

            <label className="block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{t.password}</div>
              <div className="relative">
                <Lock size={16} className={`absolute ${rtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  dir="ltr"
                  className={`w-full bg-input border border-border rounded-lg ${rtl ? "pr-9 pl-10 text-right" : "pl-9 pr-10"} py-3 focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? t.hidePwd : t.showPwd}
                  className={`absolute ${rtl ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground`}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</div>}

            <button
              disabled={busy}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {busy && <Loader2 className="animate-spin" size={16} />}
              {t.submit}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-2">{t.contact}</p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 bg-card/60 backdrop-blur border border-border rounded-lg px-4 py-3">
      <div className="bg-primary/15 text-primary p-2 rounded-md">
        <Icon size={18} />
      </div>
      <span className="text-sm text-foreground font-medium">{label}</span>
    </div>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-1 bg-card/80 backdrop-blur border border-border rounded-full p-1 shadow-card">
      <Languages size={14} className="text-muted-foreground mx-1.5" />
      {(["fr", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l === "fr" ? "FR" : "ع"}
        </button>
      ))}
    </div>
  );
}
