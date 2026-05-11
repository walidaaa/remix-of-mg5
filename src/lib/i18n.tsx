import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar";

const DICT = {
  fr: {
    "nav.dashboard": "Tableau",
    "nav.vehicle": "Véhicule",
    "nav.oil": "Vidanges",
    "nav.maintenance": "Entretien",
    "nav.insurance": "Assurance",
    "nav.admin": "Admin",
    "auth.logout": "Déconnexion",
    "auth.signOut": "Sortir",
    "lang.label": "Langue",
  },
  ar: {
    "nav.dashboard": "لوحة التحكم",
    "nav.vehicle": "السيارة",
    "nav.oil": "تغيير الزيت",
    "nav.maintenance": "الصيانة",
    "nav.insurance": "التأمين",
    "nav.admin": "المسؤول",
    "auth.logout": "تسجيل الخروج",
    "auth.signOut": "خروج",
    "lang.label": "اللغة",
  },
} as const;

type Key = keyof (typeof DICT)["fr"];

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
  rtl: boolean;
};

const LangCtx = createContext<Ctx>({ lang: "fr", setLang: () => {}, t: (k) => k, rtl: false });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("mg5-lang") as Lang)) || "fr";
    setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("mg5-lang", l);
  };

  const t = (k: Key) => DICT[lang][k] ?? k;

  return <LangCtx.Provider value={{ lang, setLang, t, rtl: lang === "ar" }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

import { Languages } from "lucide-react";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex items-center gap-1 bg-card/80 backdrop-blur border border-border rounded-full p-1 ${className}`}>
      <Languages size={12} className="text-muted-foreground mx-1" />
      {(["fr", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l === "fr" ? "FR" : "ع"}
        </button>
      ))}
    </div>
  );
}
