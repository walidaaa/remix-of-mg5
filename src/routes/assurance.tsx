import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { updateInsurance, type Insurance } from "@/lib/storage";
import { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Save, Calendar, Hash, Building2, Pencil, Clock } from "lucide-react";
import { useIsAdmin } from "@/lib/use-is-admin";
import { AdminOverview } from "@/components/admin-overview";

export const Route = createFileRoute("/assurance")({
  head: () => ({
    meta: [
      { title: "Assurance — MG5 Maintenance" },
      { name: "description", content: "Suivi de votre assurance auto." },
    ],
  }),
  component: InsurancePage,
});

function InsurancePage() {
  const data = useAppData();
  const { isAdmin, checked } = useIsAdmin();
  const ins = data.insurance;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Insurance>(
    ins ?? {
      compagnie: "",
      numeroPolice: "",
      dateDebut: new Date().toISOString().slice(0, 10),
      dateFin: "",
    }
  );

  useEffect(() => { if (ins) setForm(ins); }, [ins]);

  const joursRestants = ins?.dateFin
    ? Math.ceil((new Date(ins.dateFin).getTime() - Date.now()) / 86400000)
    : null;
  const dureeJours = ins?.dateDebut && ins?.dateFin
    ? Math.max(0, Math.ceil((new Date(ins.dateFin).getTime() - new Date(ins.dateDebut).getTime()) / 86400000))
    : null;
  const progression = dureeJours && joursRestants !== null
    ? Math.min(100, Math.max(0, ((dureeJours - Math.max(0, joursRestants)) / dureeJours) * 100))
    : 0;

  const status =
    joursRestants === null
      ? null
      : joursRestants < 0
      ? "expiree"
      : joursRestants <= 30
      ? "bientot"
      : "ok";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updateInsurance(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (checked && isAdmin) return <AdminOverview view="insurance" />;

  const showForm = !ins || editing;

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl mb-2">Assurance</h1>
          <p className="text-muted-foreground">
            {!ins ? "Renseignez votre police d'assurance." : editing ? "Modifiez votre police." : "Police active."}
          </p>
        </div>
        {ins && !editing && (
          <button
            onClick={() => { setForm(ins); setEditing(true); }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold shadow-glow hover:opacity-90"
          >
            <Pencil size={18} /> Modifier
          </button>
        )}
      </div>

      {!showForm && ins && (
        <div className="grid gap-5">
          {status && (
            <div className={`rounded-2xl p-5 border-l-4 shadow-card ${
              status === "expiree" ? "bg-destructive/10 border-destructive"
              : status === "bientot" ? "bg-warning/10 border-warning"
              : "bg-success/10 border-success"
            }`}>
              <div className="flex items-center gap-3">
                {status === "ok" ? <CheckCircle2 className="text-success" size={28} />
                  : <AlertTriangle className={status === "bientot" ? "text-warning" : "text-destructive"} size={28} />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg">
                    {status === "expiree" && `Assurance expirée depuis ${Math.abs(joursRestants!)} jours`}
                    {status === "bientot" && `Expire dans ${joursRestants} jours`}
                    {status === "ok" && `Valide encore ${joursRestants} jours`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Échéance : {new Date(ins.dateFin).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
              {dureeJours !== null && (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        status === "expiree" ? "bg-destructive"
                        : status === "bientot" ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${progression}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>{new Date(ins.dateDebut).toLocaleDateString("fr-FR")}</span>
                    <span>{new Date(ins.dateFin).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl gradient-card p-6 md:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-primary/15 text-primary p-3"><ShieldCheck size={22} /></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Police d'assurance</div>
                <div className="text-xl font-display">{ins.compagnie || "—"}</div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <DataCard icon={Building2} label="Compagnie" value={ins.compagnie || "—"} />
              <DataCard icon={Hash} label="N° de police" value={ins.numeroPolice || "—"} mono />
              <DataCard icon={Calendar} label="Date de début" value={ins.dateDebut ? new Date(ins.dateDebut).toLocaleDateString("fr-FR") : "—"} />
              <DataCard icon={Calendar} label="Date de fin" value={ins.dateFin ? new Date(ins.dateFin).toLocaleDateString("fr-FR") : "—"} />
              {joursRestants !== null && (
                <DataCard
                  icon={Clock}
                  label="Jours restants"
                  value={joursRestants < 0 ? `Expirée (${Math.abs(joursRestants)} j)` : `${joursRestants} jours`}
                  highlight
                />
              )}
              {dureeJours !== null && (
                <DataCard icon={Clock} label="Durée totale" value={`${dureeJours} jours`} />
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl gradient-card p-6 md:p-8 shadow-card grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2 flex items-center gap-3 mb-2">
            <ShieldCheck className="text-accent" />
            <h2 className="text-xl">Police d'assurance</h2>
          </div>

          <Field label="Compagnie">
            <input value={form.compagnie} onChange={(e) => setForm({ ...form, compagnie: e.target.value })} className="input" placeholder="Ex: SAA, CAAR, CAAT..." />
          </Field>
          <Field label="N° de police">
            <input value={form.numeroPolice} onChange={(e) => setForm({ ...form, numeroPolice: e.target.value })} className="input font-mono" />
          </Field>
          <Field label="Date de début">
            <input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} className="input" />
          </Field>
          <Field label="Date de fin">
            <input type="date" required value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} className="input" />
          </Field>

          <div className="md:col-span-2 flex justify-end gap-2">
            {ins && (
              <button type="button" onClick={() => { setEditing(false); setForm(ins); }} className="px-5 py-3 rounded-lg bg-secondary font-semibold">
                Annuler
              </button>
            )}
            <button disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-glow disabled:opacity-50">
              <Save size={18} /> {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>

          <style>{`.input{width:100%;background:var(--color-input);border:1px solid var(--color-border);border-radius:.625rem;padding:.75rem 1rem;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-ring) 25%,transparent)}`}</style>
        </form>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      {children}
    </label>
  );
}

function DataCard({ icon: Icon, label, value, mono, highlight }: { icon: any; label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-secondary/40 rounded-xl p-3.5 border border-border/50">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        <Icon size={11} /> {label}
      </div>
      <div className={`${mono ? "font-mono" : ""} ${highlight ? "text-primary font-semibold" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
