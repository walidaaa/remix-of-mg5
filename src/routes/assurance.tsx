import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { updateInsurance, type Insurance } from "@/lib/storage";
import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Save } from "lucide-react";

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
  const ins = data.insurance;
  const [form, setForm] = useState<Insurance>(
    ins ?? {
      compagnie: "",
      numeroPolice: "",
      dateDebut: new Date().toISOString().slice(0, 10),
      dateFin: "",
    }
  );

  const joursRestants = ins?.dateFin
    ? Math.ceil((new Date(ins.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const status =
    joursRestants === null
      ? null
      : joursRestants < 0
      ? "expiree"
      : joursRestants <= 30
      ? "bientot"
      : "ok";

  return (
    <AppShell>
      <h1 className="text-3xl mb-2">Assurance</h1>
      <p className="text-muted-foreground mb-8">Gérez votre police d'assurance.</p>

      {status && (
        <div className={`rounded-2xl p-5 mb-6 border-l-4 shadow-card ${
          status === "expiree" ? "bg-destructive/10 border-destructive"
          : status === "bientot" ? "bg-warning/10 border-warning"
          : "bg-success/10 border-success"
        }`}>
          <div className="flex items-center gap-3">
            {status === "ok" ? <CheckCircle2 className="text-success" size={28} />
              : <AlertTriangle className={status === "bientot" ? "text-warning" : "text-destructive"} size={28} />}
            <div>
              <div className="font-semibold">
                {status === "expiree" && `Assurance expirée depuis ${Math.abs(joursRestants!)} jours`}
                {status === "bientot" && `Expire dans ${joursRestants} jours`}
                {status === "ok" && `Valide encore ${joursRestants} jours`}
              </div>
              <div className="text-sm text-muted-foreground">
                Échéance : {new Date(ins!.dateFin).toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); updateInsurance(form); }}
        className="rounded-2xl gradient-card p-6 md:p-8 shadow-card grid md:grid-cols-2 gap-5"
      >
        <div className="md:col-span-2 flex items-center gap-3 mb-2">
          <ShieldCheck className="text-accent" />
          <h2 className="text-xl">Police d'assurance</h2>
        </div>

        <Field label="Compagnie">
          <input value={form.compagnie} onChange={(e) => setForm({ ...form, compagnie: e.target.value })} className="input" placeholder="Ex: AXA, Wafa..." />
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

        <div className="md:col-span-2 flex justify-end">
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-glow">
            <Save size={18} /> Enregistrer
          </button>
        </div>

        <style>{`.input{width:100%;background:var(--color-input);border:1px solid var(--color-border);border-radius:.625rem;padding:.75rem 1rem;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-ring) 25%,transparent)}`}</style>
      </form>
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
