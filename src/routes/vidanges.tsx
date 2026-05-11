import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { addOilChange, deleteOilChange } from "@/lib/storage";
import { useState } from "react";
import { Plus, Trash2, Droplet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/use-is-admin";
import { AdminOverview } from "@/components/admin-overview";

export const Route = createFileRoute("/vidanges")({
  head: () => ({
    meta: [
      { title: "Vidanges — MG5 Maintenance" },
      { name: "description", content: "Historique des vidanges, type d'huile et filtres." },
    ],
  }),
  component: OilChangesPage,
});

function OilChangesPage() {
  const data = useAppData();
  const { isAdmin, checked } = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    km: data.vehicle?.kmActuel ?? 0,
    typeHuile: "5W-30",
    filtreHuile: "",
    cout: "",
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await addOilChange({
        date: new Date(form.date).toISOString(),
        km: Number(form.km),
        typeHuile: form.typeHuile,
        filtreHuile: form.filtreHuile,
        cout: form.cout ? Number(form.cout) : undefined,
        notes: form.notes || undefined,
      });
      setOpen(false);
      setForm((f) => ({ ...f, filtreHuile: "", cout: "", notes: "" }));
    } finally {
      setSaving(false);
    }
  };

  if (checked && isAdmin) return <AdminOverview view="oil" />;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl">Vidanges</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data.oilChanges.length} entrée{data.oilChanges.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setForm((f) => ({ ...f, km: data.vehicle?.kmActuel ?? 0 })); setOpen(true); }}
          disabled={!data.vehicle}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={18} /> Nouvelle vidange
        </button>
      </div>

      {!data.vehicle && (
        <div className="rounded-xl bg-warning/10 border-l-4 border-warning p-4 text-sm mb-6">
          Configurez d'abord votre véhicule.
        </div>
      )}

      {data.oilChanges.length === 0 ? (
        <div className="rounded-2xl gradient-card p-10 text-center shadow-card">
          <Droplet className="mx-auto text-accent mb-3" size={40} />
          <p className="text-muted-foreground">Aucune vidange enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden gradient-card shadow-card">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Kilométrage</TableHead>
                <TableHead>Type d'huile</TableHead>
                <TableHead>Filtre</TableHead>
                <TableHead className="text-right">Coût</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.oilChanges.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {new Date(o.date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{o.km.toLocaleString("fr-FR")} km</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-medium">
                      <Droplet size={12} /> {o.typeHuile}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{o.filtreHuile || "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {o.cout != null ? `${o.cout} DH` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate" title={o.notes ?? ""}>
                    {o.notes || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirm("Supprimer cette vidange ?") && deleteOilChange(o.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-card w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-6 shadow-card grid gap-4"
          >
            <h2 className="text-2xl">Nouvelle vidange</h2>
            <Row label="Date">
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            </Row>
            <Row label="Kilométrage actuel (verrouillé)">
              <input
                type="text"
                value={`${(data.vehicle?.kmActuel ?? 0).toLocaleString("fr-FR")} km`}
                readOnly
                className="input opacity-80 cursor-not-allowed font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Le kilométrage est repris automatiquement du véhicule. Pour le modifier, utilisez « Mise à jour du kilométrage » dans le Tableau.
              </p>
            </Row>
            <Row label="Type d'huile">
              <input list="oils" required value={form.typeHuile} onChange={(e) => setForm({ ...form, typeHuile: e.target.value })} className="input" />
              <datalist id="oils">
                <option value="5W-30" />
                <option value="5W-40" />
                <option value="10W-40" />
                <option value="0W-20" />
              </datalist>
            </Row>
            <Row label="Filtre à huile">
              <input value={form.filtreHuile} onChange={(e) => setForm({ ...form, filtreHuile: e.target.value })} placeholder="Ex: Mann W 712/52" className="input" />
            </Row>
            <Row label="Coût (DH)">
              <input type="number" value={form.cout} onChange={(e) => setForm({ ...form, cout: e.target.value })} className="input" />
            </Row>
            <Row label="Notes">
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
            </Row>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
            <style>{`.input{width:100%;background:var(--color-input);border:1px solid var(--color-border);border-radius:.5rem;padding:.6rem .9rem;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-ring)}`}</style>
          </form>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
