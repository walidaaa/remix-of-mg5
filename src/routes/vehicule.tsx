import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { updateVehicle, addOilChange, type Vehicle } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { Save, FileText, X, Car, Droplet, Wrench, ShieldCheck, Gauge, Calendar, Coins, Pencil } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listBrands, listModels } from "@/lib/admin.functions";
import { useIsAdmin } from "@/lib/use-is-admin";
import { AdminOverview } from "@/components/admin-overview";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/vehicule")({
  head: () => ({
    meta: [
      { title: "Véhicule — Cars Maintenance" },
      { name: "description", content: "Informations matricule, transmission, couleur de votre véhicule." },
    ],
  }),
  component: VehiclePage,
});

function VehiclePage() {
  const data = useAppData();
  const { t } = useLang();
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const { isAdmin, checked } = useIsAdmin();
  const v = data.vehicle;
  const fetchBrands = useServerFn(listBrands);
  const fetchModels = useServerFn(listModels);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<Vehicle>(
    v ?? {
      matricule: "",
      marque: "",
      modele: "",
      couleur: "",
      transmission: "automatique",
      annee: new Date().getFullYear(),
      kmActuel: 0,
      intervalleVidange: 10000,
    }
  );
  const [dernierVidangeKm, setDernierVidangeKm] = useState<string>("");

  useEffect(() => {
    fetchBrands().then((b) => {
      setBrands(b);
      if (!form.marque && b[0]) setForm((f) => ({ ...f, marque: b[0].name }));
    }).catch(() => {});
  }, [fetchBrands]);

  useEffect(() => {
    if (!form.marque) { setModels([]); return; }
    fetchModels({ data: { brandName: form.marque } })
      .then((m) => setModels(m))
      .catch(() => setModels([]));
  }, [form.marque, fetchModels]);

  useEffect(() => { if (v) setForm(v); }, [v]);

  const set = <K extends keyof Vehicle>(k: K, val: Vehicle[K]) =>
    setForm((f) => ({ ...f, [k]: val }));

  const isFirstSetup = !v || data.oilChanges.length === 0;
  const prochainKm = useMemo(() => {
    const base = data.oilChanges[0]?.km ?? Number(dernierVidangeKm || 0);
    return base + (form.intervalleVidange || 0);
  }, [data.oilChanges, dernierVidangeKm, form.intervalleVidange]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateVehicle(form);
    if (isFirstSetup && dernierVidangeKm && Number(dernierVidangeKm) > 0) {
      await addOilChange({
        date: new Date().toISOString(),
        km: Number(dernierVidangeKm),
        typeHuile: "5W-30",
        filtreHuile: "",
      });
    }
    setEditing(false);
  };

  const showForm = !v || editing;

  if (checked && isAdmin) return <AdminOverview view="vehicles" />;

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl mb-2">{t("veh.title")}</h1>
          <p className="text-muted-foreground">
            {!v ? t("veh.intro.empty") : editing ? t("veh.intro.editing") : t("veh.intro.saved")}
          </p>
        </div>
        {v && (
          <div className="flex flex-wrap gap-2">
            {!editing && (
              <button
                type="button"
                onClick={() => { setForm(v); setEditing(true); }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold shadow-glow hover:opacity-90 transition"
              >
                <Pencil size={18} /> {t("common.edit")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/30 px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/25 transition"
            >
              <FileText size={18} /> {t("veh.viewAll")}
            </button>
          </div>
        )}
      </div>

      {showAll && v && <FullDataModal data={data} onClose={() => setShowAll(false)} />}

      {!showForm && v && (
        <div className="rounded-2xl gradient-card p-6 md:p-8 shadow-card">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Info label={t("veh.matricule")} value={v.matricule || "—"} mono />
            <Info label={t("veh.brand")} value={v.marque || "—"} />
            <Info label={t("veh.model")} value={v.modele || "—"} />
            <Info label={t("veh.year")} value={String(v.annee)} />
            <Info label={t("veh.color")} value={v.couleur || "—"} />
            <Info label={t("veh.transmission.short")} value={t(`veh.transmission.${v.transmission === "automatique" ? "auto" : "manual"}` as any)} />
            <Info label={t("dash.km")} value={v.kmActuel.toLocaleString("fr-FR") + " " + t("common.km")} highlight />
            <Info label={t("veh.interval.short")} value={v.intervalleVidange.toLocaleString("fr-FR") + " " + t("common.km")} />
          </div>
        </div>
      )}

      {showForm && (
      <form onSubmit={submit} className="rounded-2xl gradient-card p-6 md:p-8 shadow-card grid gap-5 md:grid-cols-2">
        <Field label={t("veh.matricule")} required>
          <input
            value={form.matricule}
            onChange={(e) => set("matricule", e.target.value.toUpperCase())}
            placeholder="123456-A-7"
            required
            className="input font-mono"
          />
        </Field>

        <Field label={t("veh.brand")} required>
          <input
            value={form.marque || "—"}
            readOnly
            disabled
            className="input opacity-70 cursor-not-allowed"
          />
        </Field>

        <Field label={t("veh.model")} required>
          <select
            value={form.modele}
            onChange={(e) => set("modele", e.target.value)}
            required
            className="input"
            disabled={models.length === 0}
          >
            <option value="">{models.length ? t("veh.choose") : t("veh.noModel")}</option>
            {models.map((m) => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </Field>

        <Field label={t("veh.year")}>
          <input
            type="number"
            value={form.annee}
            onChange={(e) => set("annee", parseInt(e.target.value, 10) || 0)}
            className="input"
          />
        </Field>

        <Field label={t("veh.color")}>
          <input
            value={form.couleur}
            onChange={(e) => set("couleur", e.target.value)}
            placeholder={t("veh.color.placeholder")}
            className="input"
          />
        </Field>

        <Field label={t("veh.transmission")}>
          <div className="grid grid-cols-2 gap-2">
            {(["manuelle", "automatique"] as const).map((tp) => (
              <button
                type="button"
                key={tp}
                onClick={() => set("transmission", tp)}
                className={`py-3 rounded-lg font-medium capitalize transition ${
                  form.transmission === tp
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`veh.transmission.${tp === "automatique" ? "auto" : "manual"}` as any)}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t("veh.km")}>
          <input
            type="number"
            value={form.kmActuel}
            onChange={(e) => set("kmActuel", parseInt(e.target.value, 10) || 0)}
            className="input"
          />
        </Field>

        <Field label={t("veh.interval")}>
          <input
            type="number"
            value={form.intervalleVidange}
            onChange={(e) => set("intervalleVidange", parseInt(e.target.value, 10) || 10000)}
            className="input"
          />
        </Field>

        {isFirstSetup && (
          <Field label={t("veh.lastOil")}>
            <input
              type="number"
              value={dernierVidangeKm}
              onChange={(e) => setDernierVidangeKm(e.target.value)}
              placeholder="Ex: 45000"
              className="input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("veh.lastOilHelp")}
            </p>
          </Field>
        )}

        {(form.intervalleVidange > 0 && (data.oilChanges[0]?.km || Number(dernierVidangeKm) > 0)) && (
          <div className="md:col-span-2 rounded-xl border border-primary/30 bg-primary/10 p-4 grid gap-1">
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">{t("veh.nextCalc")}</div>
            <div className="text-sm text-muted-foreground">
              {t("veh.nextCalc.last")} <span className="font-mono text-foreground">{(data.oilChanges[0]?.km ?? Number(dernierVidangeKm || 0)).toLocaleString("fr-FR")} {t("common.km")}</span>
              {" + "}{t("veh.nextCalc.interval")} <span className="font-mono text-foreground">{form.intervalleVidange.toLocaleString("fr-FR")} {t("common.km")}</span>
            </div>
            <div className="text-lg font-display text-primary">
              {t("veh.nextCalc.next")} {prochainKm.toLocaleString("fr-FR")} {t("common.km")}
              {form.kmActuel > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({(prochainKm - form.kmActuel).toLocaleString("fr-FR")} {t("veh.nextCalc.remaining")})
                </span>
              )}
            </div>
          </div>
        )}

        <div className="md:col-span-2 flex justify-end gap-2">
          {v && (
            <button type="button" onClick={() => { setEditing(false); setForm(v); }} className="inline-flex items-center gap-2 bg-secondary text-foreground px-5 py-3 rounded-lg font-semibold hover:opacity-90">
              {t("common.cancel")}
            </button>
          )}
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90">
            <Save size={18} /> {t("common.save")}
          </button>
        </div>
      </form>
      )}

      <style>{`
        .input {
          width: 100%;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          border-radius: 0.625rem;
          padding: 0.75rem 1rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: var(--color-ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 25%, transparent);
        }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </div>
      {children}
    </label>
  );
}

function FullDataModal({ data, onClose }: { data: ReturnType<typeof useAppData>; onClose: () => void }) {
  const v = data.vehicle!;
  const { t } = useLang();
  const totalOil = useMemo(() => data.oilChanges.reduce((s, o) => s + (Number(o.cout) || 0), 0), [data.oilChanges]);
  const totalMaint = useMemo(() => data.maintenance.reduce((s, m) => s + (Number(m.cout) || 0), 0), [data.maintenance]);
  const total = totalOil + totalMaint;
  const ins = data.insurance;
  const insDays = ins?.dateFin ? Math.ceil((+new Date(ins.dateFin) - Date.now()) / 86400000) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-2 md:p-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl md:rounded-2xl shadow-card w-full max-w-4xl my-2 md:my-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 md:p-5 border-b border-border sticky top-0 bg-background rounded-t-xl md:rounded-t-2xl z-10">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="rounded-lg bg-primary/15 text-primary p-1.5 md:p-2 shrink-0"><FileText size={16} className="md:hidden" /><FileText size={20} className="hidden md:block" /></div>
            <div className="min-w-0">
              <h2 className="text-sm md:text-xl font-display truncate">{t("veh.modal.title")}</h2>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">{t("veh.modal.sub")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 rounded-lg hover:bg-secondary shrink-0" aria-label={t("common.close")}><X size={16} /></button>
        </div>

        <div className="p-3 md:p-5 grid gap-3 md:gap-5">
          <Section icon={Car} title={t("veh.section.vehicle")} tone="primary">
            <Grid>
              <Info label={t("veh.matricule")} value={v.matricule || "—"} mono />
              <Info label={t("veh.brand")} value={v.marque} />
              <Info label={t("veh.model")} value={v.modele} />
              <Info label={t("veh.year")} value={String(v.annee)} />
              <Info label={t("veh.color")} value={v.couleur || "—"} />
              <Info label={t("veh.transmission.short")} value={t(`veh.transmission.${v.transmission === "automatique" ? "auto" : "manual"}` as any)} />
              <Info label={t("dash.km")} value={v.kmActuel.toLocaleString("fr-FR") + " " + t("common.km")} />
              <Info label={t("veh.interval.short")} value={v.intervalleVidange.toLocaleString("fr-FR") + " " + t("common.km")} />
            </Grid>
          </Section>

          <Section icon={Coins} title={t("veh.section.costs")} tone="success">
            <Grid>
              <Info label={t("veh.costs.oil")} value={`${totalOil.toLocaleString("fr-FR")} DA`} />
              <Info label={t("veh.costs.maint")} value={`${totalMaint.toLocaleString("fr-FR")} DA`} />
              <Info label={t("veh.costs.total")} value={`${total.toLocaleString("fr-FR")} DA`} highlight />
            </Grid>
          </Section>

          <Section icon={ShieldCheck} title={t("veh.section.insurance")} tone={insDays === null ? "muted" : insDays < 0 ? "destructive" : insDays <= 30 ? "warning" : "success"}>
            {ins ? (
              <Grid>
                <Info label={t("veh.ins.company")} value={ins.compagnie || "—"} />
                <Info label={t("veh.ins.policy")} value={ins.numeroPolice || "—"} mono />
                <Info label={t("veh.ins.from")} value={ins.dateDebut ? new Date(ins.dateDebut).toLocaleDateString("fr-FR") : "—"} />
                <Info label={t("veh.ins.to")} value={ins.dateFin ? new Date(ins.dateFin).toLocaleDateString("fr-FR") : "—"} />
                {insDays !== null && (
                  <Info label={t("veh.ins.status")} value={insDays < 0 ? `${t("ins.status.expired")} ${Math.abs(insDays)} ${t("common.days")}` : `${insDays} ${t("common.days")}`} highlight />
                )}
              </Grid>
            ) : (
              <p className="text-sm text-muted-foreground">{t("veh.ins.none")}</p>
            )}
          </Section>

          <Section icon={Droplet} title={`${t("veh.section.oil")} (${data.oilChanges.length})`} tone="primary">
            {data.oilChanges.length ? (
              <div className="grid gap-2">
                {data.oilChanges.map((o) => (
                  <div key={o.id} className="rounded-lg bg-secondary/40 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} />{new Date(o.date).toLocaleDateString("fr-FR")}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Gauge size={11} />{o.km.toLocaleString("fr-FR")} {t("common.km")}</span>
                      <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs">{o.typeHuile}</span>
                      {o.filtreHuile && <span className="text-xs text-muted-foreground">{t("dash.field.filter")}: {o.filtreHuile}</span>}
                    </div>
                    <span className="font-mono text-sm">{o.cout != null ? `${o.cout} DA` : "—"}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">{t("veh.ins.noneShort")}</p>}
          </Section>

          <Section icon={Wrench} title={`${t("veh.section.maintenance")} (${data.maintenance.length})`} tone="warning">
            {data.maintenance.length ? (
              <div className="grid gap-2">
                {data.maintenance.map((m) => {
                  return (
                    <div key={m.id} className="rounded-lg bg-secondary/40 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold">{t(`mt.${m.type}` as any)}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} />{new Date(m.date).toLocaleDateString("fr-FR")}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Gauge size={11} />{m.km.toLocaleString("fr-FR")} {t("common.km")}</span>
                      </div>
                      <span className="font-mono text-sm">{m.cout != null ? `${m.cout} DA` : "—"}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">{t("veh.maint.none")}</p>}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, tone, children }: { icon: any; title: string; tone: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    primary: "border-primary/30 text-primary",
    success: "border-success/30 text-success",
    warning: "border-warning/30 text-warning",
    destructive: "border-destructive/30 text-destructive",
    muted: "border-border text-muted-foreground",
  };
  return (
    <div className={`rounded-lg md:rounded-xl gradient-card border ${map[tone]} p-2.5 md:p-4 shadow-card`}>
      <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-wider font-semibold mb-2 md:mb-3">
        <Icon size={13} /> {title}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">{children}</div>;
}

function Info({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-secondary/40 rounded-lg p-2 md:p-2.5">
      <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className={`mt-0.5 text-xs md:text-sm break-words ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-semibold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
