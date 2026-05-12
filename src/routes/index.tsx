import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { getNextOilChange, getMaintenanceStatus, MAINTENANCE_LABELS, updateKm, addOilChange } from "@/lib/storage";
import { toast } from "sonner";
import { RotateCcw, Camera, Pencil, Loader2, X, Check } from "lucide-react";
import { Car, Droplet, AlertTriangle, CheckCircle2, Gauge, Settings2, Palette, Wrench, ShieldCheck, Calendar, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { getBrandImage } from "@/lib/brand-images";
import { useIsAdmin } from "@/lib/use-is-admin";
import { AdminOverview } from "@/components/admin-overview";
import { useLang } from "@/lib/i18n";
import { useServerFn } from "@tanstack/react-start";
import { scanOdometer } from "@/lib/odometer.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cars Maintenance — Tableau de bord" },
      { name: "description", content: "Suivi vidange, entretien, assurance et alertes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useAppData();
  const { isAdmin, checked } = useIsAdmin();
  const { t, lang } = useLang();
  const v = data.vehicle;
  const next = getNextOilChange(data);
  const [km, setKm] = useState("");

  if (checked && isAdmin) return <AdminOverview view="dashboard" />;

  if (!data.loaded) {
    return (
      <AppShell>
        <div className="rounded-2xl overflow-hidden shadow-card">
          <div className="relative h-56 md:h-72 bg-card animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[0,1,2,3].map((i) => <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />)}
        </div>
      </AppShell>
    );
  }

  if (!v) {
    return (
      <AppShell>
        <div className="rounded-2xl overflow-hidden shadow-card">
          <div className="relative h-64 md:h-80 bg-card" />
          <div className="p-8 text-center -mt-16 relative">
            <h1 className="text-4xl mb-3">{t("dash.welcome")}</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("dash.welcomeSub")}</p>
            <Link
              to="/vehicule"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90"
            >
              {t("dash.setupVehicle")} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const oilColor =
    next.alerte === "depasse" || next.alerte === "urgent" ? "destructive"
    : next.alerte === "bientot" ? "warning" : "success";

  const maintAlerts = data.maintenance
    .map((m) => ({ m, st: getMaintenanceStatus(m, v) }))
    .filter((x) => x.st.alerte !== "ok");

  const insStatus = (() => {
    const ins = data.insurance;
    if (!ins?.dateFin) return null;
    const j = Math.ceil((+new Date(ins.dateFin) - Date.now()) / 86400000);
    return { j, etat: j < 0 ? "expiree" : j <= 30 ? "bientot" : "ok" };
  })();

  return (
    <AppShell>
      <div className="relative rounded-2xl overflow-hidden shadow-card mb-6 bg-card">
        <div className="relative h-72 md:h-96">
          <img
            src={getBrandImage(v.marque)}
            alt={`${v.marque} ${v.modele}`}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-white/90 font-semibold drop-shadow">
              {v.marque} · {v.annee}
            </div>
            <h1 className="text-4xl md:text-6xl mt-1 leading-none text-white drop-shadow-lg">{v.modele}</h1>
            <div className="flex items-center gap-3 mt-3 text-sm flex-wrap">
              <span className="font-mono bg-black/50 backdrop-blur px-3 py-1 rounded-md border border-white/20 text-white">{v.matricule}</span>
              <span className="flex items-center gap-1 text-white/90"><Settings2 size={14} /> {v.transmission}</span>
              <span className="flex items-center gap-1 text-white/90"><Palette size={14} /> {v.couleur}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Gauge} label={t("dash.km")} value={v.kmActuel.toLocaleString("fr-FR")} unit={t("common.km")} tone="primary" />
        <StatCard icon={Droplet} label={t("dash.nextOil")} value={next.kmRestants !== null ? `${Math.max(next.kmRestants, 0).toLocaleString("fr-FR")}` : "—"} unit={t("common.km")} tone={oilColor} />
        <StatCard icon={Wrench} label={t("dash.maintenances")} value={String(data.maintenance.length)} unit={t("dash.unit.ops")} tone="accent" />
        <StatCard
          icon={ShieldCheck}
          label={t("dash.insurance")}
          value={insStatus ? (insStatus.j < 0 ? t("dash.expired") : `${insStatus.j} ${t("common.days")}`) : "—"}
          unit=""
          tone={insStatus ? (insStatus.etat === "ok" ? "success" : insStatus.etat === "bientot" ? "warning" : "destructive") : "muted"}
        />
      </div>

      <AlertBanner
        tone={oilColor}
        title={
          next.alerte === "depasse" ? t("dash.oil.late")
          : next.alerte === "urgent" ? t("dash.oil.urgent")
          : next.alerte === "bientot" ? t("dash.oil.soon")
          : t("dash.oil.ok")
        }
        body={
          <>
            {t("dash.oil.next")} <strong className="text-foreground">{next.prochainKm?.toLocaleString("fr-FR")} {t("common.km")}</strong>
            {next.kmRestants !== null && (next.kmRestants > 0
              ? <> · {t("dash.oil.remaining")} <strong className="text-foreground">{next.kmRestants.toLocaleString("fr-FR")} {t("common.km")}</strong></>
              : <> · {t("dash.oil.over")} <strong className="text-foreground">{Math.abs(next.kmRestants).toLocaleString("fr-FR")} {t("common.km")}</strong></>)}
          </>
        }
        cta={{ to: "/vidanges", label: t("dash.oil.manage") }}
        resetEnabled={next.kmRestants !== null && next.kmRestants <= 0}
        resetLabel={t("dash.oil.reset")}
        resetTip={t("dash.oil.resetTip")}
        resetDisabledTip={t("dash.oil.resetDisabledTip")}
        onReset={async () => {
          const last = data.oilChanges[0];
          await addOilChange({
            date: new Date().toISOString(),
            km: v.kmActuel,
            typeHuile: last?.typeHuile || "5W-30",
            filtreHuile: last?.filtreHuile || "",
          });
          toast.success(t("dash.oil.toastSaved"));
        }}
      />

      {maintAlerts.length > 0 && (
        <div className="rounded-2xl gradient-card p-6 mb-6 shadow-card">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-warning" /> {t("dash.maint.toDo")}
          </h3>
          <div className="space-y-2">
            {maintAlerts.slice(0, 4).map(({ m, st }) => {
              const tone = st.alerte === "bientot" ? "warning" : "destructive";
              return (
                <div key={m.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg ${tone === "warning" ? "bg-warning/10" : "bg-destructive/10"}`}>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t(`mt.${m.type}` as any)}</div>
                    <div className="text-xs text-muted-foreground">
                      {st.kmRestants !== null && <>{st.kmRestants > 0 ? `${st.kmRestants.toLocaleString("fr-FR")} ${t("common.km")}` : `${t("maint.kmOver")} ${Math.abs(st.kmRestants).toLocaleString("fr-FR")} ${t("common.km")}`}</>}
                      {st.kmRestants !== null && st.joursRestants !== null && " · "}
                      {st.joursRestants !== null && <>{st.joursRestants > 0 ? `${st.joursRestants} ${t("common.days")}` : `${t("maint.daysOver")} ${Math.abs(st.joursRestants)} ${t("common.days")}`}</>}
                    </div>
                  </div>
                  <Link to="/entretien" className="text-xs text-primary shrink-0">{t("dash.maint.see")}</Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl gradient-card p-4 md:p-6 mb-6 shadow-card">
        <h3 className="text-base md:text-lg mb-3 flex items-center gap-2"><Gauge size={18} className="text-accent" /> {t("dash.kmUpdate")}</h3>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(km, 10);
            if (!isNaN(n) && n >= v.kmActuel) {
              updateKm(n);
              setKm("");
            }
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            placeholder={`≥ ${v.kmActuel.toLocaleString("fr-FR")}`}
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="flex-1 min-w-0 bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 whitespace-nowrap shrink-0">
            {t("common.update")}
          </button>
        </form>
      </div>

      <div className="rounded-2xl gradient-card p-6 shadow-card">
        <h3 className="text-lg mb-4 flex items-center gap-2"><Droplet size={20} className="text-accent" /> {t("dash.lastOil")}</h3>
        {data.oilChanges[0] ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat label={t("dash.field.date")} value={new Date(data.oilChanges[0].date).toLocaleDateString("fr-FR")} icon={Calendar} />
            <Stat label={t("dash.km")} value={`${data.oilChanges[0].km.toLocaleString("fr-FR")} ${t("common.km")}`} icon={Gauge} />
            <Stat label={t("dash.field.oil")} value={data.oilChanges[0].typeHuile} icon={Droplet} />
            <Stat label={t("dash.field.filter")} value={data.oilChanges[0].filtreHuile || "—"} icon={Wrench} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("dash.noOil")}</p>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, unit, tone }: { icon: any; label: string; value: string; unit: string; tone: string }) {
  const ring = {
    primary: "border-primary/30 text-primary",
    accent: "border-accent/30 text-accent",
    success: "border-success/30 text-success",
    warning: "border-warning/30 text-warning",
    destructive: "border-destructive/30 text-destructive",
    muted: "border-border text-muted-foreground",
  }[tone] || "border-border";
  return (
    <div className={`rounded-xl gradient-card border ${ring} p-4 shadow-card`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-2xl text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function AlertBanner({ tone, title, body, cta, onReset, resetEnabled = true, resetLabel = "Reset", resetTip = "", resetDisabledTip = "" }: { tone: string; title: string; body: React.ReactNode; cta: { to: string; label: string }; onReset?: () => void | Promise<void>; resetEnabled?: boolean; resetLabel?: string; resetTip?: string; resetDisabledTip?: string }) {
  const cls = tone === "destructive" ? "bg-destructive/10 border-destructive"
    : tone === "warning" ? "bg-warning/10 border-warning" : "bg-success/10 border-success";
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  const iconCls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-destructive";
  return (
    <div className={`rounded-2xl p-6 mb-6 shadow-card border-l-4 ${cls}`}>
      <div className="flex items-start gap-4">
        <Icon className={`shrink-0 ${iconCls}`} size={28} />
        <div className="flex-1">
          <h2 className="text-xl mb-1">{title}</h2>
          <p className="text-sm text-muted-foreground">{body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link to={cta.to} className="text-sm text-primary hover:underline">
              {cta.label} →
            </Link>
            {onReset && (
              <button
                onClick={() => resetEnabled && onReset()}
                disabled={!resetEnabled}
                title={resetEnabled ? resetTip : resetDisabledTip}
                className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw size={14} /> {resetLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Icon size={12} /> {label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}
