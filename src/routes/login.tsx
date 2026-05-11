import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminExists, resolveUsername } from "@/lib/admin.functions";
import { User, Lock, Loader2, ShieldCheck, Wrench, Droplet, Languages, Eye, EyeOff, Car } from "lucide-react";
import mg5Photo from "@/assets/mg5-exterior.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Cars Maintenance" },
      { name: "description", content: "Connectez-vous pour accéder à vos données." },
    ],
  }),
  component: LoginPage,
});

type Lang = "fr" | "ar";

const T = {
  fr: {
    brand: "Cars Maintenance",
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
    footer: "© Cars Maintenance",
  },
  ar: {
    brand: "صيانة السيارات",
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
    footer: "© صيانة السيارات",
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
      {/* Visual side (desktop only) */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src={mg5Photo} alt={t.brand} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-primary/30" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-xl p-2.5 shadow-glow">
              <Car size={22} />
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">{t.brand}</div>
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
      <div className="flex flex-col min-h-screen lg:min-h-0 lg:items-center lg:justify-center px-5 sm:px-8 lg:p-10 relative">
        <LangToggle lang={lang} setLang={setLang} />

        {/* Mobile hero */}
        <div className="lg:hidden pt-16 pb-7 flex flex-col items-center text-center">
          <div className="bg-primary text-primary-foreground rounded-2xl p-3.5 shadow-glow mb-4">
            <Car size={28} />
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.25em] mb-1">{t.brand}</div>
          <h1 className="font-display text-3xl text-foreground mt-3">{t.welcome}</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs">{t.sub}</p>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 lg:flex-initial flex flex-col">
          <div className="hidden lg:block">
            <h1 className="font-display text-4xl text-foreground">{t.welcome}</h1>
            <p className="text-muted-foreground text-sm mt-2 mb-8">{t.sub}</p>
          </div>

          <form onSubmit={submit} className="grid gap-4">
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">{t.username}</div>
              <div className="relative">
                <User size={16} className={`absolute ${rtl ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  dir="ltr"
                  className={`w-full bg-input border border-border rounded-xl ${rtl ? "pr-10 pl-3.5 text-right" : "pl-10 pr-3.5"} py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-ring transition`}
                />
              </div>
            </label>

            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">{t.password}</div>
              <div className="relative">
                <Lock size={16} className={`absolute ${rtl ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  dir="ltr"
                  className={`w-full bg-input border border-border rounded-xl ${rtl ? "pr-10 pl-11 text-right" : "pl-10 pr-11"} py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-ring transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? t.hidePwd : t.showPwd}
                  className={`absolute ${rtl ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground`}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">{error}</div>}

            <button
              disabled={busy}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3.5 rounded-xl text-base font-semibold shadow-glow hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {busy && <Loader2 className="animate-spin" size={16} />}
              {t.submit}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-3">{t.contact}</p>
          </form>

          <div className="lg:hidden mt-auto pt-8 pb-6 text-center text-[11px] text-muted-foreground">{t.footer}</div>
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
    <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-card/80 backdrop-blur border border-border rounded-full p-1 shadow-card">
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
