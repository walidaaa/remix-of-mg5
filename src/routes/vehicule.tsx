import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { updateVehicle, type Vehicle } from "@/lib/storage";
import { useState } from "react";
import { Save } from "lucide-react";

export const Route = createFileRoute("/vehicule")({
  head: () => ({
    meta: [
      { title: "Véhicule — MG5 Maintenance" },
      { name: "description", content: "Informations matricule, transmission, couleur de votre MG5." },
    ],
  }),
  component: VehiclePage,
});

function VehiclePage() {
  const data = useAppData();
  const nav = useNavigate();
  const v = data.vehicle;
  const [form, setForm] = useState<Vehicle>(
    v ?? {
      matricule: "",
      marque: "MG",
      modele: "MG5",
      couleur: "Blanc",
      transmission: "automatique",
      annee: new Date().getFullYear(),
      kmActuel: 0,
      intervalleVidange: 10000,
    }
  );

  const set = <K extends keyof Vehicle>(k: K, val: Vehicle[K]) =>
    setForm((f) => ({ ...f, [k]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle(form);
    nav({ to: "/" });
  };

  return (
    <AppShell>
      <h1 className="text-3xl mb-2">Mon véhicule</h1>
      <p className="text-muted-foreground mb-8">
        {v ? "Modifiez les informations." : "Renseignez les informations de votre voiture."}
      </p>

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

        <Field label="Marque">
          <input value={form.marque} onChange={(e) => set("marque", e.target.value)} className="input" />
        </Field>

        <Field label="Modèle">
          <input value={form.modele} onChange={(e) => set("modele", e.target.value)} className="input" />
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
