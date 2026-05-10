import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import {
  addMaintenance,
  deleteMaintenance,
  getMaintenanceStatus,
  MAINTENANCE_LABELS,
  type MaintenanceType,
} from "@/lib/storage";
import { useState } from "react";
import { Plus, Trash2, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/entretien")({
  head: () => ({
    meta: [
      { title: "Entretien — MG5 Maintenance" },
      { name: "description", content: "Suivi entretien : filtres, freins, pneus, batterie, courroie." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MaintenanceType>("filtre-air");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    km: data.vehicle?.kmActuel ?? 0,
    intervalleKm: MAINTENANCE_LABELS["filtre-air"].defaultKm,
    intervalleMois: MAINTENANCE_LABELS["filtre-air"].defaultMois ?? 0,
    cout: "",
    notes: "",
  });

  const onTypeChange = (t: MaintenanceType) => {
    setType(t);
    const def = MAINTENANCE_LABELS[t];
    setForm((f) => ({ ...f, intervalleKm: def.defaultKm, intervalleMois: def.defaultMois ?? 0 }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenance({
      type,
      date: new Date(form.date).toISOString(),
      km: Number(form.km),
      intervalleKm: form.intervalleKm || undefined,
      intervalleMois: form.intervalleMois || undefined,
      cout: form.cout ? Number(form.cout) : undefined,
      notes: form.notes || undefined,
    });
    setOpen(false);
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl">Entretien</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data.maintenance.length} opération{data.maintenance.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={!data.vehicle}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={18} /> Nouvelle opération
        </button>
      </div>

      {data.maintenance.length === 0 ? (
        <div className="rounded-2xl gradient-card p-10 text-center shadow-card">
          <Wrench className="mx-auto text-accent mb-3" size={40} />
          <p className="text-muted-foreground">Aucune opération enregistrée.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {data.maintenance.map((m) => {
            const def = MAINTENANCE_LABELS[m.type];
            const st = getMaintenanceStatus(m, data.vehicle);
            const color =
              st.alerte === "depasse" ? "destructive"
              : st.alerte === "urgent" ? "destructive"
              : st.alerte === "bientot" ? "warning"
              : "success";
            return (
              <div key={m.id} className={`rounded-xl gradient-card p-5 shadow-card border-l-4 ${
                color === "destructive" ? "border-destructive"
                : color === "warning" ? "border-warning" : "border-success"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 rounded-lg p-2 ${
                    color === "success" ? "bg-success/15 text-success"
                    : color === "warning" ? "bg-warning/15 text-warning"
                    : "bg-destructive/15 text-destructive"
                  }`}>
                    {color === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{def.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(m.date).toLocaleDateString("fr-FR")} · {m.km.toLocaleString("fr-FR")} km
                    </div>
                    <div className="text-sm mt-2">
                      {st.kmRestants !== null && (
                        <div>{st.kmRestants > 0 ? `${st.kmRestants.toLocaleString("fr-FR")} km restants` : `Dépassé de ${Math.abs(st.kmRestants).toLocaleString("fr-FR")} km`}</div>
                      )}
                      {st.joursRestants !== null && (
                        <div>{st.joursRestants > 0 ? `${st.joursRestants} jours restants` : `Expiré depuis ${Math.abs(st.joursRestants)} j`}</div>
                      )}
                    </div>
                    {m.notes && <div className="text-xs text-muted-foreground mt-2">{m.notes}</div>}
                  </div>
                  <button onClick={() => confirm("Supprimer ?") && deleteMaintenance(m.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-card w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-6 shadow-card grid gap-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl">Nouvelle opération</h2>
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Type</div>
              <select value={type} onChange={(e) => onTypeChange(e.target.value as MaintenanceType)} className="input">
                {Object.entries(MAINTENANCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Date</div>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
              </label>
              <label className="block">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Kilométrage</div>
                <input type="number" required value={form.km} onChange={(e) => setForm({ ...form, km: Number(e.target.value) })} className="input" />
              </label>
              <label className="block">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Intervalle (km)</div>
                <input type="number" value={form.intervalleKm} onChange={(e) => setForm({ ...form, intervalleKm: Number(e.target.value) })} className="input" />
              </label>
              <label className="block">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Intervalle (mois)</div>
                <input type="number" value={form.intervalleMois} onChange={(e) => setForm({ ...form, intervalleMois: Number(e.target.value) })} className="input" />
              </label>
            </div>
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Coût (DH)</div>
              <input type="number" value={form.cout} onChange={(e) => setForm({ ...form, cout: e.target.value })} className="input" />
            </label>
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</div>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-secondary">Annuler</button>
              <button className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">Enregistrer</button>
            </div>
            <style>{`.input{width:100%;background:var(--color-input);border:1px solid var(--color-border);border-radius:.5rem;padding:.6rem .9rem;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-ring)}`}</style>
          </form>
        </div>
      )}
    </AppShell>
  );
}
