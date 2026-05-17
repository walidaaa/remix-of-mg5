import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { addOilChange, deleteOilChange, updateOilChange } from "@/lib/storage";
import { useState } from "react";
import { Plus, Trash2, Droplet, Pencil } from "lucide-react";
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
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/vidanges")({
  head: () => ({
    meta: [
      { title: "Vidanges — Cars Maintenance" },
      { name: "description", content: "Historique des vidanges, type d'huile et filtres." },
    ],
  }),
  component: OilChangesPage,
});

function OilChangesPage() {
  const data = useAppData();
  const { isAdmin, checked } = useIsAdmin();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    km: data.vehicle?.kmActuel ?? 0,
    typeHuile: "5W-30",
    filtreHuile: "",
    cout: "",
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    id: "",
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
        km: data.vehicle?.kmActuel ?? Number(form.km),
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

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !editForm.id) return;
    setSaving(true);
    try {
      await updateOilChange({
        id: editForm.id,
        date: "",
        km: 0,
        typeHuile: "",
        filtreHuile: editForm.filtreHuile,
        cout: editForm.cout ? Number(editForm.cout) : undefined,
        notes: editForm.notes || undefined,
      });
      setEditOpen(false);
      setEditForm({ id: "", filtreHuile: "", cout: "", notes: "" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (o: typeof data.oilChanges[0]) => {
    setEditForm({
      id: o.id,
      filtreHuile: o.filtreHuile || "",
      cout: o.cout != null ? String(o.cout) : "",
      notes: o.notes || "",
    });
    setEditOpen(true);
  };

  if (checked && isAdmin) return <AdminOverview view="oil" />;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl">{t("oil.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data.oilChanges.length} {data.oilChanges.length > 1 ? t("oil.entries.plural") : t("oil.entries")}
          </p>
        </div>
        <button
          onClick={() => { setForm((f) => ({ ...f, km: data.vehicle?.kmActuel ?? 0 })); setOpen(true); }}
          disabled={!data.vehicle}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={18} /> {t("oil.new")}
        </button>
      </div>

      {!data.vehicle && (
        <div className="rounded-xl bg-warning/10 border-l-4 border-warning p-4 text-sm mb-6">
          {t("oil.setupFirst")}
        </div>
      )}

      {data.oilChanges.length === 0 ? (
        <div className="rounded-2xl gradient-card p-10 text-center shadow-card">
          <Droplet className="mx-auto text-accent mb-3" size={40} />
          <p className="text-muted-foreground">{t("oil.empty")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden gradient-card shadow-card">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>{t("oil.col.date")}</TableHead>
                <TableHead>{t("oil.col.km")}</TableHead>
                <TableHead>{t("oil.col.oilType")}</TableHead>
                <TableHead>{t("oil.col.filter")}</TableHead>
                <TableHead className="text-right">{t("oil.col.cost")}</TableHead>
                <TableHead>{t("oil.col.notes")}</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.oilChanges.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {new Date(o.date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{o.km.toLocaleString("fr-FR")} {t("common.km")}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-medium">
                      <Droplet size={12} /> {o.typeHuile}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{o.filtreHuile || "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {o.cout != null ? `${o.cout} DA` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate" title={o.notes ?? ""}>
                    {o.notes || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(o)}
                        className="text-muted-foreground hover:text-primary"
                        aria-label={t("common.edit")}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirm(t("oil.confirmDelete")) && deleteOilChange(o.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
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
            <h2 className="text-2xl">{t("oil.new")}</h2>
            <Row label={t("oil.col.date")}>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            </Row>
            <Row label={t("oil.kmLocked")}>
              <input
                type="text"
                value={`${(data.vehicle?.kmActuel ?? 0).toLocaleString("fr-FR")} ${t("common.km")}`}
                readOnly
                className="input opacity-80 cursor-not-allowed font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("oil.kmLockedHelp")}
              </p>
            </Row>
            <Row label={t("oil.oilType")}>
              <input list="oils" required value={form.typeHuile} onChange={(e) => setForm({ ...form, typeHuile: e.target.value })} className="input" />
              <datalist id="oils">
                <option value="5W-30" />
                <option value="5W-40" />
                <option value="10W-40" />
                <option value="0W-20" />
              </datalist>
            </Row>
            <Row label={t("oil.filterLabel")}>
              <input value={form.filtreHuile} onChange={(e) => setForm({ ...form, filtreHuile: e.target.value })} placeholder="Ex: Mann W 712/52" className="input" />
            </Row>
            <Row label={t("oil.cost")}>
              <input type="number" value={form.cout} onChange={(e) => setForm({ ...form, cout: e.target.value })} className="input" />
            </Row>
            <Row label={t("oil.notes")}>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
            </Row>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-secondary">{t("common.cancel")}</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50">{saving ? t("common.saving") : t("common.save")}</button>
            </div>
            <style>{`.input{width:100%;background:var(--color-input);border:1px solid var(--color-border);border-radius:.5rem;padding:.6rem .9rem;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-ring)}`}</style>
          </form>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setEditOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitEdit}
            className="bg-card w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-6 shadow-card grid gap-4"
          >
            <h2 className="text-2xl">{t("common.edit")}</h2>
            <Row label={t("oil.filterLabel")}>
              <input value={editForm.filtreHuile} onChange={(e) => setEditForm({ ...editForm, filtreHuile: e.target.value })} placeholder="Ex: Mann W 712/52" className="input" />
            </Row>
            <Row label={t("oil.cost")}>
              <input type="number" value={editForm.cout} onChange={(e) => setEditForm({ ...editForm, cout: e.target.value })} className="input" />
            </Row>
            <Row label={t("oil.notes")}>
              <textarea rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="input" />
            </Row>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-lg bg-secondary">{t("common.cancel")}</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50">{saving ? t("common.saving") : t("common.save")}</button>
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
