import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { updateVehicle, type Vehicle, MAINTENANCE_LABELS, type MaintenanceType } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { Save, FileText, X, Car, Droplet, Wrench, ShieldCheck, Gauge, Calendar, Coins } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listBrands, listModels } from "@/lib/admin.functions";
import { useIsAdmin } from "@/lib/use-is-admin";
import { AdminOverview } from "@/components/admin-overview";

export const Route = createFileRoute("/vehicule")({
  head: () => ({
    meta: [
      { title: "Véhicule — MG5 Maintenance" },
      { name: "description", content: "Informations matricule, transmission, couleur de votre véhicule." },
    ],
  }),
  component: VehiclePage,
});

function VehiclePage() {
  const data = useAppData();
  const [showAll, setShowAll] = useState(false);
  const nav = useNavigate();
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateVehicle(form);
    nav({ to: "/" });
  };

  if (checked && isAdmin) return <AdminOverview view="vehicles" />;

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl mb-2">Mon véhicule</h1>
          <p className="text-muted-foreground">
            {v ? "Modifiez les informations." : "Renseignez les informations de votre voiture."}
          </p>
        </div>
        {v && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/30 px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/25 transition"
          >
            <FileText size={18} /> Voir toutes les données
          </button>
        )}
      </div>

      {showAll && v && <FullDataModal data={data} onClose={() => setShowAll(false)} />}

      <form onSubmit={submit} className="rounded-2xl gradient-card p-6 md:p-8 shadow-card grid gap-5 md:grid-cols-2">
        <Field label="Matricule" required>
          <input
            value={form.matricule}
            onChange={(e) => set("matricule", e.target.value.toUpperCase())}
            placeholder="123456-A-7"
            required
            className="input font-mono"
          />
        </Field>

        <Field label="Marque" required>
          <input
            value={form.marque || "—"}
            readOnly
            disabled
            className="input opacity-70 cursor-not-allowed"
          />
        </Field>

        <Field label="Modèle" required>
          <select
            value={form.modele}
            onChange={(e) => set("modele", e.target.value)}
            required
            className="input"
            disabled={models.length === 0}
          >
            <option value="">{models.length ? "— Choisir —" : "Aucun modèle disponible"}</option>
            {models.map((m) => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Année">
          <input
            type="number"
            value={form.annee}
            onChange={(e) => set("annee", parseInt(e.target.value, 10) || 0)}
            className="input"
          />
        </Field>

        <Field label="Couleur">
          <input
            value={form.couleur}
            onChange={(e) => set("couleur", e.target.value)}
            placeholder="Rouge, Blanc..."
            className="input"
          />
        </Field>

        <Field label="Boîte de vitesse">
          <div className="grid grid-cols-2 gap-2">
            {(["manuelle", "automatique"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => set("transmission", t)}
                className={`py-3 rounded-lg font-medium capitalize transition ${
                  form.transmission === t
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Kilométrage actuel">
          <input
            type="number"
            value={form.kmActuel}
            onChange={(e) => set("kmActuel", parseInt(e.target.value, 10) || 0)}
            className="input"
          />
        </Field>

        <Field label="Intervalle vidange (km)">
          <input
            type="number"
            value={form.intervalleVidange}
            onChange={(e) => set("intervalleVidange", parseInt(e.target.value, 10) || 10000)}
            className="input"
          />
        </Field>

        <div className="md:col-span-2 flex justify-end">
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90">
            <Save size={18} /> Enregistrer
          </button>
        </div>
      </form>

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
  const totalOil = useMemo(() => data.oilChanges.reduce((s, o) => s + (Number(o.cout) || 0), 0), [data.oilChanges]);
  const totalMaint = useMemo(() => data.maintenance.reduce((s, m) => s + (Number(m.cout) || 0), 0), [data.maintenance]);
  const total = totalOil + totalMaint;
  const ins = data.insurance;
  const insDays = ins?.dateFin ? Math.ceil((+new Date(ins.dateFin) - Date.now()) / 86400000) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-3 md:p-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-background border border-border rounded-2xl shadow-card w-full max-w-4xl my-4 md:my-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/15 text-primary p-2"><FileText size={20} /></div>
            <div>
              <h2 className="text-xl font-display">Toutes les données du véhicule</h2>
              <p className="text-xs text-muted-foreground">Synthèse complète</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary" aria-label="Fermer"><X size={18} /></button>
        </div>

        <div className="p-5 grid gap-5">
          {/* Vehicle */}
          <Section icon={Car} title="Véhicule" tone="primary">
            <Grid>
              <Info label="Matricule" value={v.matricule || "—"} mono />
              <Info label="Marque" value={v.marque} />
              <Info label="Modèle" value={v.modele} />
              <Info label="Année" value={String(v.annee)} />
              <Info label="Couleur" value={v.couleur || "—"} />
              <Info label="Transmission" value={v.transmission} />
              <Info label="Km actuel" value={v.kmActuel.toLocaleString("fr-FR") + " km"} />
              <Info label="Intervalle vidange" value={v.intervalleVidange.toLocaleString("fr-FR") + " km"} />
            </Grid>
          </Section>

          {/* Costs */}
          <Section icon={Coins} title="Coûts cumulés" tone="success">
            <Grid>
              <Info label="Vidanges" value={`${totalOil.toLocaleString("fr-FR")} DH`} />
              <Info label="Entretiens" value={`${totalMaint.toLocaleString("fr-FR")} DH`} />
              <Info label="Total global" value={`${total.toLocaleString("fr-FR")} DH`} highlight />
            </Grid>
          </Section>

          {/* Insurance */}
          <Section icon={ShieldCheck} title="Assurance" tone={insDays === null ? "muted" : insDays < 0 ? "destructive" : insDays <= 30 ? "warning" : "success"}>
            {ins ? (
              <Grid>
                <Info label="Compagnie" value={ins.compagnie || "—"} />
                <Info label="N° police" value={ins.numeroPolice || "—"} mono />
                <Info label="Du" value={ins.dateDebut ? new Date(ins.dateDebut).toLocaleDateString("fr-FR") : "—"} />
                <Info label="Au" value={ins.dateFin ? new Date(ins.dateFin).toLocaleDateString("fr-FR") : "—"} />
                {insDays !== null && (
                  <Info label="Statut" value={insDays < 0 ? `Expirée ${Math.abs(insDays)}j` : `${insDays} j restants`} highlight />
                )}
              </Grid>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune assurance enregistrée.</p>
            )}
          </Section>

          {/* Oil changes */}
          <Section icon={Droplet} title={`Vidanges (${data.oilChanges.length})`} tone="primary">
            {data.oilChanges.length ? (
              <div className="grid gap-2">
                {data.oilChanges.map((o) => (
                  <div key={o.id} className="rounded-lg bg-secondary/40 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} />{new Date(o.date).toLocaleDateString("fr-FR")}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Gauge size={11} />{o.km.toLocaleString("fr-FR")} km</span>
                      <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs">{o.typeHuile}</span>
                      {o.filtreHuile && <span className="text-xs text-muted-foreground">Filtre: {o.filtreHuile}</span>}
                    </div>
                    <span className="font-mono text-sm">{o.cout != null ? `${o.cout} DH` : "—"}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucune vidange.</p>}
          </Section>

          {/* Maintenance */}
          <Section icon={Wrench} title={`Entretiens (${data.maintenance.length})`} tone="warning">
            {data.maintenance.length ? (
              <div className="grid gap-2">
                {data.maintenance.map((m) => {
                  const def = MAINTENANCE_LABELS[m.type as MaintenanceType];
                  return (
                    <div key={m.id} className="rounded-lg bg-secondary/40 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold">{def?.label ?? m.type}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} />{new Date(m.date).toLocaleDateString("fr-FR")}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Gauge size={11} />{m.km.toLocaleString("fr-FR")} km</span>
                      </div>
                      <span className="font-mono text-sm">{m.cout != null ? `${m.cout} DH` : "—"}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucun entretien.</p>}
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
    <div className={`rounded-xl gradient-card border ${map[tone]} p-4 shadow-card`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold mb-3">
        <Icon size={14} /> {title}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>;
}

function Info({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-secondary/40 rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-semibold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
