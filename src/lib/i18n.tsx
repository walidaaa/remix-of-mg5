import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Languages } from "lucide-react";

export type Lang = "fr" | "ar";

const DICT = {
  fr: {
    // Nav
    "nav.dashboard": "Tableau",
    "nav.vehicle": "Véhicule",
    "nav.oil": "Vidanges",
    "nav.maintenance": "Entretien",
    "nav.insurance": "Assurance",
    "nav.admin": "Admin",
    "auth.logout": "Déconnexion",
    "auth.signOut": "Sortir",
    "lang.label": "Langue",
    "loading": "Chargement…",

    // Common
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.edit": "Modifier",
    "common.delete": "Supprimer",
    "common.close": "Fermer",
    "common.view": "Voir",
    "common.update": "Mettre à jour",
    "common.add": "Ajouter",
    "common.km": "km",
    "common.days": "j",
    "common.months": "mois",
    "common.notSet": "Non renseigné",
    "common.none": "—",
    "common.confirmDelete": "Supprimer ?",
    "common.saving": "Enregistrement…",
    "common.required": "obligatoire",

    // Dashboard
    "dash.welcome": "Bienvenue dans Cars Maintenance",
    "dash.welcomeSub": "Suivez vidanges, entretiens, assurance et alertes en un seul endroit.",
    "dash.setupVehicle": "Configurer mon véhicule",
    "dash.km": "Kilométrage",
    "dash.nextOil": "Prochaine vidange",
    "dash.maintenances": "Entretiens",
    "dash.insurance": "Assurance",
    "dash.expired": "Expirée",
    "dash.oil.late": "Vidange en retard !",
    "dash.oil.urgent": "Vidange imminente",
    "dash.oil.soon": "Vidange à prévoir",
    "dash.oil.ok": "Vidange à jour",
    "dash.oil.next": "Prochaine à",
    "dash.oil.remaining": "reste",
    "dash.oil.over": "dépassé de",
    "dash.oil.manage": "Gérer les vidanges",
    "dash.oil.reset": "Reset vidange",
    "dash.oil.resetTip": "Enregistrer la vidange au km actuel",
    "dash.oil.resetDisabledTip": "Disponible quand le kilométrage dépasse la prochaine vidange",
    "dash.oil.toastSaved": "Vidange enregistrée",
    "dash.maint.toDo": "Entretiens à prévoir",
    "dash.maint.see": "Voir →",
    "dash.kmUpdate": "Mise à jour du kilométrage",
    "dash.lastOil": "Dernière vidange",
    "dash.noOil": "Aucune vidange enregistrée.",
    "dash.field.date": "Date",
    "dash.field.oil": "Huile",
    "dash.field.filter": "Filtre",
    "dash.unit.ops": "ops",

    // Oil page
    "oil.title": "Vidanges",
    "oil.entries": "entrée",
    "oil.entries.plural": "entrées",
    "oil.new": "Nouvelle vidange",
    "oil.empty": "Aucune vidange enregistrée pour le moment.",
    "oil.col.date": "Date",
    "oil.col.km": "Kilométrage",
    "oil.col.oilType": "Type d'huile",
    "oil.col.filter": "Filtre",
    "oil.col.cost": "Coût",
    "oil.col.notes": "Notes",
    "oil.confirmDelete": "Supprimer cette vidange ?",
    "oil.kmLocked": "Kilométrage actuel (verrouillé)",
    "oil.kmLockedHelp": "Le kilométrage est repris automatiquement du véhicule. Pour le modifier, utilisez « Mise à jour du kilométrage » dans le Tableau.",
    "oil.oilType": "Type d'huile",
    "oil.filterLabel": "Filtre à huile",
    "oil.cost": "Coût (DH)",
    "oil.notes": "Notes",
    "oil.setupFirst": "Configurez d'abord votre véhicule.",

    // Maintenance page
    "maint.title": "Entretien",
    "maint.ops": "opération",
    "maint.ops.plural": "opérations",
    "maint.new": "Nouvelle opération",
    "maint.empty": "Aucune opération enregistrée.",
    "maint.kmRemaining": "km restants",
    "maint.kmOver": "Dépassé de",
    "maint.daysRemaining": "jours restants",
    "maint.daysOver": "Expiré depuis",
    "maint.type": "Type",
    "maint.intervalKm": "Intervalle (km)",
    "maint.intervalMonths": "Intervalle (mois)",
    "maint.cost": "Coût (DA)",
    "maint.kmHelp": "Le kilométrage est repris automatiquement du véhicule. Mettez-le à jour depuis le Tableau ou la page Véhicule.",

    // Vehicle page
    "veh.title": "Mon véhicule",
    "veh.intro.empty": "Renseignez les informations de votre voiture.",
    "veh.intro.editing": "Modifiez les informations.",
    "veh.intro.saved": "Informations enregistrées.",
    "veh.viewAll": "Voir toutes les données",
    "veh.matricule": "Matricule",
    "veh.brand": "Marque",
    "veh.model": "Modèle",
    "veh.year": "Année",
    "veh.color": "Couleur",
    "veh.transmission": "Boîte de vitesse",
    "veh.transmission.short": "Boîte",
    "veh.km": "Kilométrage actuel",
    "veh.interval": "Intervalle vidange (km) — référence",
    "veh.interval.short": "Intervalle vidange",
    "veh.lastOil": "Dernière vidange (km)",
    "veh.lastOilHelp": "Saisissez le kilométrage de la dernière vidange effectuée. Une entrée sera créée automatiquement.",
    "veh.nextCalc": "Calcul prochaine vidange",
    "veh.nextCalc.last": "Dernière vidange :",
    "veh.nextCalc.interval": "Intervalle :",
    "veh.nextCalc.next": "Prochaine vidange obligatoire à",
    "veh.nextCalc.remaining": "km restants",
    "veh.color.placeholder": "Rouge, Blanc...",
    "veh.choose": "— Choisir —",
    "veh.noModel": "Aucun modèle disponible",
    "veh.transmission.manual": "manuelle",
    "veh.transmission.auto": "automatique",
    "veh.modal.title": "Toutes les données du véhicule",
    "veh.modal.sub": "Synthèse complète",
    "veh.section.vehicle": "Véhicule",
    "veh.section.costs": "Coûts cumulés",
    "veh.section.insurance": "Assurance",
    "veh.section.oil": "Vidanges",
    "veh.section.maintenance": "Entretiens",
    "veh.costs.oil": "Vidanges",
    "veh.costs.maint": "Entretiens",
    "veh.costs.total": "Total global",
    "veh.ins.company": "Compagnie",
    "veh.ins.policy": "N° police",
    "veh.ins.from": "Du",
    "veh.ins.to": "Au",
    "veh.ins.status": "Statut",
    "veh.ins.none": "Aucune assurance enregistrée.",
    "veh.ins.noneShort": "Aucune vidange.",
    "veh.maint.none": "Aucun entretien.",

    // Insurance page
    "ins.title": "Documents véhicule",
    "ins.intro": "Assurance, vignette, carte grise — dates, scans et coûts (DA).",
    "ins.col.doc": "Document",
    "ins.col.ref": "Référence",
    "ins.col.start": "Début",
    "ins.col.end": "Fin",
    "ins.col.daysLeft": "Jours restants",
    "ins.col.cost": "Coût (DA)",
    "ins.col.status": "Statut",
    "ins.assurance": "Assurance",
    "ins.vignette": "Vignette",
    "ins.carte": "Carte grise",
    "ins.policy": "Police d'assurance",
    "ins.vignetteAuto": "Vignette automobile",
    "ins.cartePermis": "Carte grise / Permis",
    "ins.status.expired": "Expirée",
    "ins.status.soon": "Bientôt",
    "ins.status.valid": "Valide",
    "ins.status.expiredSince": "Expirée depuis",
    "ins.status.expiresIn": "Expire dans",
    "ins.status.validFor": "Valide",
    "ins.field.company": "Compagnie",
    "ins.field.agency": "Agence vignette",
    "ins.field.org": "Organisme",
    "ins.field.policyNo": "N° police",
    "ins.field.vignetteNo": "N° vignette",
    "ins.field.regNo": "N° immatriculation / carte",
    "ins.field.start": "Date début",
    "ins.field.end": "Date fin",
    "ins.field.cost": "Coût (DA)",
    "ins.field.ref": "Réf.",
    "ins.field.cost.short": "Coût",
    "ins.scan.has": "Document disponible",
    "ins.scan.none": "Aucun document",
    "ins.scan.scan": "Scan",
    "ins.scan.import": "Import",

    // Maintenance types
    "mt.filtre-air": "Filtre à air",
    "mt.filtre-carburant": "Filtre à carburant",
    "mt.filtre-habitacle": "Filtre habitacle",
    "mt.plaquettes-frein": "Plaquettes de frein",
    "mt.disques-frein": "Disques de frein",
    "mt.pneus": "Pneus",
    "mt.batterie": "Batterie",
    "mt.bougies": "Bougies d'allumage",
    "mt.courroie": "Courroie de distribution",
    "mt.liquide-frein": "Liquide de frein",
    "mt.liquide-refroidissement": "Liquide refroidissement",
    "mt.visite-technique": "Visite technique",
    "mt.autre": "Autre",
  },
  ar: {
    // Nav
    "nav.dashboard": "لوحة التحكم",
    "nav.vehicle": "السيارة",
    "nav.oil": "تغيير الزيت",
    "nav.maintenance": "الصيانة",
    "nav.insurance": "التأمين",
    "nav.admin": "المسؤول",
    "auth.logout": "تسجيل الخروج",
    "auth.signOut": "خروج",
    "lang.label": "اللغة",
    "loading": "جاري التحميل…",

    // Common
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.close": "إغلاق",
    "common.view": "عرض",
    "common.update": "تحديث",
    "common.add": "إضافة",
    "common.km": "كم",
    "common.days": "يوم",
    "common.months": "شهر",
    "common.notSet": "غير محدد",
    "common.none": "—",
    "common.confirmDelete": "حذف؟",
    "common.saving": "جاري الحفظ…",
    "common.required": "مطلوب",

    // Dashboard
    "dash.welcome": "مرحبا بك في صيانة السيارات",
    "dash.welcomeSub": "تابع تغيير الزيت، الصيانة، التأمين والتنبيهات في مكان واحد.",
    "dash.setupVehicle": "إعداد سيارتي",
    "dash.km": "المسافة المقطوعة",
    "dash.nextOil": "تغيير الزيت القادم",
    "dash.maintenances": "الصيانات",
    "dash.insurance": "التأمين",
    "dash.expired": "منتهي",
    "dash.oil.late": "تغيير الزيت متأخر!",
    "dash.oil.urgent": "تغيير الزيت عاجل",
    "dash.oil.soon": "تغيير الزيت قريبا",
    "dash.oil.ok": "تغيير الزيت محدّث",
    "dash.oil.next": "القادم عند",
    "dash.oil.remaining": "يتبقى",
    "dash.oil.over": "تجاوز بـ",
    "dash.oil.manage": "إدارة تغيير الزيت",
    "dash.oil.reset": "إعادة ضبط الزيت",
    "dash.oil.resetTip": "تسجيل تغيير الزيت بالعداد الحالي",
    "dash.oil.resetDisabledTip": "متاح عندما يتجاوز العداد التغيير القادم",
    "dash.oil.toastSaved": "تم تسجيل تغيير الزيت",
    "dash.maint.toDo": "صيانات قادمة",
    "dash.maint.see": "← عرض",
    "dash.kmUpdate": "تحديث المسافة المقطوعة",
    "dash.lastOil": "آخر تغيير زيت",
    "dash.noOil": "لا يوجد تغيير زيت مسجّل.",
    "dash.field.date": "التاريخ",
    "dash.field.oil": "الزيت",
    "dash.field.filter": "الفلتر",
    "dash.unit.ops": "عملية",

    // Oil page
    "oil.title": "تغيير الزيت",
    "oil.entries": "سجل",
    "oil.entries.plural": "سجلات",
    "oil.new": "تغيير زيت جديد",
    "oil.empty": "لا يوجد تغيير زيت مسجّل حتى الآن.",
    "oil.col.date": "التاريخ",
    "oil.col.km": "المسافة المقطوعة",
    "oil.col.oilType": "نوع الزيت",
    "oil.col.filter": "الفلتر",
    "oil.col.cost": "التكلفة",
    "oil.col.notes": "ملاحظات",
    "oil.confirmDelete": "حذف هذا التسجيل؟",
    "oil.kmLocked": "العداد الحالي (مقفل)",
    "oil.kmLockedHelp": "يتم استرداد العداد تلقائيا من السيارة. لتعديله، استعمل «تحديث المسافة المقطوعة» في لوحة التحكم.",
    "oil.oilType": "نوع الزيت",
    "oil.filterLabel": "فلتر الزيت",
    "oil.cost": "التكلفة (د.ج)",
    "oil.notes": "ملاحظات",
    "oil.setupFirst": "قم بإعداد سيارتك أولا.",

    // Maintenance page
    "maint.title": "الصيانة",
    "maint.ops": "عملية",
    "maint.ops.plural": "عمليات",
    "maint.new": "عملية جديدة",
    "maint.empty": "لا توجد عمليات مسجّلة.",
    "maint.kmRemaining": "كم متبقية",
    "maint.kmOver": "تجاوز بـ",
    "maint.daysRemaining": "يوم متبقي",
    "maint.daysOver": "منتهي منذ",
    "maint.type": "النوع",
    "maint.intervalKm": "الفاصل (كم)",
    "maint.intervalMonths": "الفاصل (أشهر)",
    "maint.cost": "التكلفة (د.ج)",
    "maint.kmHelp": "يتم استرداد العداد تلقائيا من السيارة. حدّثه من لوحة التحكم أو صفحة السيارة.",

    // Vehicle page
    "veh.title": "سيارتي",
    "veh.intro.empty": "أدخل معلومات سيارتك.",
    "veh.intro.editing": "عدّل المعلومات.",
    "veh.intro.saved": "المعلومات محفوظة.",
    "veh.viewAll": "عرض كل البيانات",
    "veh.matricule": "رقم اللوحة",
    "veh.brand": "الماركة",
    "veh.model": "الموديل",
    "veh.year": "السنة",
    "veh.color": "اللون",
    "veh.transmission": "علبة السرعات",
    "veh.transmission.short": "العلبة",
    "veh.km": "العداد الحالي",
    "veh.interval": "فاصل تغيير الزيت (كم) — مرجعي",
    "veh.interval.short": "فاصل تغيير الزيت",
    "veh.lastOil": "آخر تغيير زيت (كم)",
    "veh.lastOilHelp": "أدخل عداد آخر تغيير زيت. سيتم إنشاء سجل تلقائيا.",
    "veh.nextCalc": "حساب التغيير القادم",
    "veh.nextCalc.last": "آخر تغيير زيت:",
    "veh.nextCalc.interval": "الفاصل:",
    "veh.nextCalc.next": "التغيير القادم الإلزامي عند",
    "veh.nextCalc.remaining": "كم متبقية",
    "veh.color.placeholder": "أحمر، أبيض...",
    "veh.choose": "— اختر —",
    "veh.noModel": "لا يوجد موديل متاح",
    "veh.transmission.manual": "يدوية",
    "veh.transmission.auto": "أوتوماتيكية",
    "veh.modal.title": "كل بيانات السيارة",
    "veh.modal.sub": "ملخص شامل",
    "veh.section.vehicle": "السيارة",
    "veh.section.costs": "التكاليف الإجمالية",
    "veh.section.insurance": "التأمين",
    "veh.section.oil": "تغيير الزيت",
    "veh.section.maintenance": "الصيانات",
    "veh.costs.oil": "تغيير الزيت",
    "veh.costs.maint": "الصيانة",
    "veh.costs.total": "المجموع الكلي",
    "veh.ins.company": "الشركة",
    "veh.ins.policy": "رقم العقد",
    "veh.ins.from": "من",
    "veh.ins.to": "إلى",
    "veh.ins.status": "الحالة",
    "veh.ins.none": "لا يوجد تأمين مسجّل.",
    "veh.ins.noneShort": "لا يوجد تغيير زيت.",
    "veh.maint.none": "لا توجد صيانة.",

    // Insurance page
    "ins.title": "وثائق السيارة",
    "ins.intro": "التأمين، الفينيات، البطاقة الرمادية — التواريخ والمسحات والتكاليف (د.ج).",
    "ins.col.doc": "الوثيقة",
    "ins.col.ref": "المرجع",
    "ins.col.start": "البداية",
    "ins.col.end": "النهاية",
    "ins.col.daysLeft": "الأيام المتبقية",
    "ins.col.cost": "التكلفة (د.ج)",
    "ins.col.status": "الحالة",
    "ins.assurance": "التأمين",
    "ins.vignette": "الفينيات",
    "ins.carte": "البطاقة الرمادية",
    "ins.policy": "عقد التأمين",
    "ins.vignetteAuto": "فينيات السيارة",
    "ins.cartePermis": "البطاقة الرمادية / الرخصة",
    "ins.status.expired": "منتهية",
    "ins.status.soon": "قريبا",
    "ins.status.valid": "سارية",
    "ins.status.expiredSince": "منتهية منذ",
    "ins.status.expiresIn": "تنتهي خلال",
    "ins.status.validFor": "سارية",
    "ins.field.company": "الشركة",
    "ins.field.agency": "وكالة الفينيات",
    "ins.field.org": "الجهة",
    "ins.field.policyNo": "رقم العقد",
    "ins.field.vignetteNo": "رقم الفينيات",
    "ins.field.regNo": "رقم التسجيل / البطاقة",
    "ins.field.start": "تاريخ البداية",
    "ins.field.end": "تاريخ النهاية",
    "ins.field.cost": "التكلفة (د.ج)",
    "ins.field.ref": "المرجع",
    "ins.field.cost.short": "التكلفة",
    "ins.scan.has": "الوثيقة متوفرة",
    "ins.scan.none": "لا توجد وثيقة",
    "ins.scan.scan": "مسح",
    "ins.scan.import": "استيراد",

    // Maintenance types
    "mt.filtre-air": "فلتر الهواء",
    "mt.filtre-carburant": "فلتر الوقود",
    "mt.filtre-habitacle": "فلتر المقصورة",
    "mt.plaquettes-frein": "تيل الفرامل",
    "mt.disques-frein": "أقراص الفرامل",
    "mt.pneus": "العجلات",
    "mt.batterie": "البطارية",
    "mt.bougies": "البوجيهات",
    "mt.courroie": "سير التوزيع",
    "mt.liquide-frein": "زيت الفرامل",
    "mt.liquide-refroidissement": "سائل التبريد",
    "mt.visite-technique": "الفحص التقني",
    "mt.autre": "أخرى",
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

  const t = (k: Key) => (DICT[lang] as any)[k] ?? (DICT.fr as any)[k] ?? k;

  return <LangCtx.Provider value={{ lang, setLang, t, rtl: lang === "ar" }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

// Locale-aware number formatting (ar uses Latin digits to keep mixing with km/dates safe)
export function fmtNum(n: number, lang: Lang) {
  return n.toLocaleString(lang === "ar" ? "fr-FR" : "fr-FR");
}
export function fmtDate(d: string | Date, lang: Lang) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(lang === "ar" ? "fr-FR" : "fr-FR");
}

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
