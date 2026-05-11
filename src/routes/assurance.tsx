import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import {
  updateInsurance,
  updateVignette,
  updateVehicleDoc,
  uploadDocument,
  getDocumentUrl,
  type Insurance,
  type Vignette,
  type VehicleDoc,
} from "@/lib/storage";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Save,
  Pencil,
  Camera,
  Image as ImageIcon,
  ScrollText,
  Car,
  Loader2,
  Eye,
} from "lucide-react";
import { useIsAdmin } from "@/lib/use-is-admin";
import { AdminOverview } from "@/components/admin-overview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/assurance")({
  head: () => ({
    meta: [
      { title: "Assurance & Vignette — MG5 Maintenance" },
      { name: "description", content: "Suivi assurance, vignette, dates et coûts." },
    ],
  }),
  component: InsurancePage,
});

function daysUntil(d?: string) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function statusOf(j: number | null) {
  if (j === null) return null;
  if (j < 0) return "expiree" as const;
  if (j <= 30) return "bientot" as const;
  return "ok" as const;
}

function InsurancePage() {
  const data = useAppData();
  const { isAdmin, checked } = useIsAdmin();
  if (checked && isAdmin) return <AdminOverview view="insurance" />;

  const insJ = daysUntil(data.insurance?.dateFin);
  const vigJ = daysUntil(data.vignette?.dateFin);
  const insStatus = statusOf(insJ);
  const vigStatus = statusOf(vigJ);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Assurance & Vignette</h1>
        <p className="text-muted-foreground">Polices, échéances, scans et coûts (DA).</p>
      </div>

      {/* Récap table */}
      <div className="rounded-2xl border border-border overflow-hidden gradient-card shadow-card mb-6">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Début</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Jours restants</TableHead>
              <TableHead className="text-right">Coût (DA)</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <RecapRow
              label="Assurance"
              icon={ShieldCheck}
              ref1={data.insurance?.compagnie}
              ref2={data.insurance?.numeroPolice}
              dateDebut={data.insurance?.dateDebut}
              dateFin={data.insurance?.dateFin}
              j={insJ}
              cout={data.insurance?.cout}
              status={insStatus}
            />
            <RecapRow
              label="Vignette"
              icon={ScrollText}
              ref1={data.vignette?.compagnie}
              ref2={data.vignette?.numero}
              dateDebut={data.vignette?.dateDebut}
              dateFin={data.vignette?.dateFin}
              j={vigJ}
              cout={data.vignette?.cout}
              status={vigStatus}
            />
          </TableBody>
        </Table>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DocumentCard
          kind="assurance"
          title="Police d'assurance"
          icon={ShieldCheck}
          value={data.insurance}
          status={insStatus}
          j={insJ}
        />
        <DocumentCard
          kind="vignette"
          title="Vignette automobile"
          icon={ScrollText}
          value={data.vignette}
          status={vigStatus}
          j={vigJ}
        />
      </div>
    </AppShell>
  );
}

function RecapRow({
  label,
  icon: Icon,
  ref1,
  ref2,
  dateDebut,
  dateFin,
  j,
  cout,
  status,
}: {
  label: string;
  icon: any;
  ref1?: string;
  ref2?: string;
  dateDebut?: string;
  dateFin?: string;
  j: number | null;
  cout?: number;
  status: "ok" | "bientot" | "expiree" | null;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="inline-flex items-center gap-2">
          <Icon size={16} className="text-primary" /> {label}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        <div>{ref1 || "—"}</div>
        {ref2 && <div className="font-mono">{ref2}</div>}
      </TableCell>
      <TableCell className="whitespace-nowrap">{dateDebut ? new Date(dateDebut).toLocaleDateString("fr-FR") : "—"}</TableCell>
      <TableCell className="whitespace-nowrap">{dateFin ? new Date(dateFin).toLocaleDateString("fr-FR") : "—"}</TableCell>
      <TableCell className="font-mono">
        {j === null ? "—" : j < 0 ? `-${Math.abs(j)} j` : `${j} j`}
      </TableCell>
      <TableCell className="text-right font-mono">{cout != null ? `${cout.toLocaleString("fr-FR")}` : "—"}</TableCell>
      <TableCell>
        {status === null ? (
          <span className="text-xs text-muted-foreground">Non renseigné</span>
        ) : (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
              status === "expiree"
                ? "bg-destructive/15 text-destructive"
                : status === "bientot"
                ? "bg-warning/15 text-warning"
                : "bg-success/15 text-success"
            }`}
          >
            {status === "ok" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {status === "expiree" ? "Expirée" : status === "bientot" ? "Bientôt" : "Valide"}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

type DocKind = "assurance" | "vignette";

function DocumentCard({
  kind,
  title,
  icon: Icon,
  value,
  status,
  j,
}: {
  kind: DocKind;
  title: string;
  icon: any;
  value: Insurance | Vignette | null;
  status: "ok" | "bientot" | "expiree" | null;
  j: number | null;
}) {
  const [editing, setEditing] = useState(!value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const baseInsurance: Insurance = {
    compagnie: "",
    numeroPolice: "",
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: "",
    cout: undefined,
    scanUrl: undefined,
  };
  const baseVignette: Vignette = {
    compagnie: "",
    numero: "",
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: "",
    cout: undefined,
    scanUrl: undefined,
  };

  const [form, setForm] = useState<Insurance | Vignette>(
    (value as any) ?? (kind === "assurance" ? baseInsurance : baseVignette),
  );

  useEffect(() => {
    if (value) setForm(value as any);
    setEditing(!value);
  }, [value]);

  useEffect(() => {
    setPreviewUrl(null);
    if (value?.scanUrl) {
      getDocumentUrl(value.scanUrl).then(setPreviewUrl);
    }
  }, [value?.scanUrl]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadDocument(kind, file);
      if (path) {
        const next: any = { ...form, scanUrl: path };
        setForm(next);
        if (kind === "assurance") await updateInsurance(next);
        else await updateVignette(next);
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (kind === "assurance") await updateInsurance(form as Insurance);
      else await updateVignette(form as Vignette);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const dateDebut = (form as any).dateDebut as string;
  const dateFin = (form as any).dateFin as string;
  const cout = (form as any).cout as number | undefined;
  const ref1 = kind === "assurance" ? (form as Insurance).compagnie : (form as Vignette).compagnie;
  const ref2Key = kind === "assurance" ? "numeroPolice" : "numero";
  const ref2 = (form as any)[ref2Key];

  const ringClass =
    status === "expiree"
      ? "border-destructive/40"
      : status === "bientot"
      ? "border-warning/40"
      : status === "ok"
      ? "border-success/40"
      : "border-border";

  return (
    <div className={`rounded-2xl gradient-card shadow-card border ${ringClass} overflow-hidden`}>
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-3 border-b border-border/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-primary/15 text-primary p-2.5 shrink-0">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
            <div className="text-lg font-display truncate">{value?.compagnie || "Non renseigné"}</div>
          </div>
        </div>
        {value && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 bg-primary/15 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/25"
          >
            <Pencil size={14} /> Modifier
          </button>
        )}
      </div>

      {/* Status banner */}
      {status && (
        <div
          className={`px-5 py-3 text-sm flex items-center gap-2 border-b border-border/50 ${
            status === "expiree"
              ? "bg-destructive/10 text-destructive"
              : status === "bientot"
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
          }`}
        >
          {status === "ok" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="font-medium">
            {status === "expiree" && `Expirée depuis ${Math.abs(j!)} jours`}
            {status === "bientot" && `Expire dans ${j} jours`}
            {status === "ok" && `Valide encore ${j} jours`}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-5 grid gap-4">
        {!editing && value ? (
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Référence" value={ref2 || "—"} mono />
            <Mini label="Coût" value={value.cout != null ? `${value.cout.toLocaleString("fr-FR")} DA` : "—"} />
            <Mini label="Date début" value={dateDebut ? new Date(dateDebut).toLocaleDateString("fr-FR") : "—"} />
            <Mini label="Date fin" value={dateFin ? new Date(dateFin).toLocaleDateString("fr-FR") : "—"} />
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Compagnie / Agence">
                <input value={ref1} onChange={(e) => set("compagnie", e.target.value)} className="input" />
              </Field>
              <Field label={kind === "assurance" ? "N° police" : "N° vignette"}>
                <input value={ref2 || ""} onChange={(e) => set(ref2Key, e.target.value)} className="input font-mono" />
              </Field>
              <Field label="Date début">
                <input type="date" value={dateDebut} onChange={(e) => set("dateDebut", e.target.value)} className="input" />
              </Field>
              <Field label="Date fin">
                <input type="date" required value={dateFin} onChange={(e) => set("dateFin", e.target.value)} className="input" />
              </Field>
              <Field label="Coût (DA)">
                <input
                  type="number"
                  value={cout ?? ""}
                  onChange={(e) => set("cout", e.target.value ? Number(e.target.value) : undefined)}
                  className="input"
                  placeholder="0"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              {value && (
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm(value as any); }}
                  className="px-4 py-2 rounded-lg bg-secondary font-semibold"
                >
                  Annuler
                </button>
              )}
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold shadow-glow disabled:opacity-50"
              >
                <Save size={16} /> {saving ? "…" : "Enregistrer"}
              </button>
            </div>
          </form>
        )}

        {/* Scanner */}
        <div className="rounded-xl bg-secondary/40 border border-border/50 p-4 grid gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ImageIcon size={16} className="text-primary" /> Document scanné
            </div>
            <div className="flex gap-2">
              <input
                ref={camRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => camRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-semibold shadow-glow disabled:opacity-50"
              >
                {uploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />} Scanner
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 bg-secondary text-foreground px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                <ImageIcon size={14} /> Importer
              </button>
            </div>
          </div>

          {previewUrl ? (
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="relative group rounded-lg overflow-hidden border border-border bg-background"
            >
              <img src={previewUrl} alt={`Scan ${title}`} className="w-full max-h-56 object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 text-white text-sm font-semibold">
                  <Eye size={14} /> Agrandir
                </span>
              </div>
            </button>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
              Aucun document. Utilisez « Scanner » pour photographier la {kind}.
            </div>
          )}
        </div>
      </div>

      {showPreview && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <img src={previewUrl} alt="Scan" className="max-h-full max-w-full object-contain" />
        </div>
      )}

      <style>{`.input{width:100%;background:var(--color-input);border:1px solid var(--color-border);border-radius:.5rem;padding:.55rem .85rem;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-ring)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Mini({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-background/60 rounded-lg p-3 border border-border/50">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
