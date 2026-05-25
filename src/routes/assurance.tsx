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
import { useServerFn } from "@tanstack/react-start";
import { scanDocument } from "@/lib/scan-doc.functions";
import { toast } from "sonner";
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
import { useLang } from "@/lib/i18n";
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
      { title: "Assurance & Vignette — Cars Maintenance" },
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
  const { t } = useLang();
  if (checked && isAdmin) return <AdminOverview view="insurance" />;

  const insJ = daysUntil(data.insurance?.dateFin);
  const vigJ = daysUntil(data.vignette?.dateFin);
  const vehJ = daysUntil(data.vehicleDoc?.dateFin);
  const insStatus = statusOf(insJ);
  const vigStatus = statusOf(vigJ);
  const vehStatus = statusOf(vehJ);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">{t("ins.title")}</h1>
        <p className="text-muted-foreground">{t("ins.intro")}</p>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden gradient-card shadow-card mb-6">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>{t("ins.col.doc")}</TableHead>
              <TableHead>{t("ins.col.ref")}</TableHead>
              <TableHead>{t("ins.col.start")}</TableHead>
              <TableHead>{t("ins.col.end")}</TableHead>
              <TableHead>{t("ins.col.daysLeft")}</TableHead>
              <TableHead className="text-right">{t("ins.col.cost")}</TableHead>
              <TableHead>{t("ins.col.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <RecapRow
              label={t("ins.assurance")}
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
              label={t("ins.vignette")}
              icon={ScrollText}
              ref1={data.vignette?.compagnie}
              ref2={data.vignette?.numero}
              dateDebut={data.vignette?.dateDebut}
              dateFin={data.vignette?.dateFin}
              j={vigJ}
              cout={data.vignette?.cout}
              status={vigStatus}
            />
            <RecapRow
              label={t("ins.carte")}
              icon={Car}
              ref1={data.vehicleDoc?.organisme}
              ref2={data.vehicleDoc?.numero}
              dateDebut={data.vehicleDoc?.dateDebut}
              dateFin={data.vehicleDoc?.dateFin}
              j={vehJ}
              cout={data.vehicleDoc?.cout}
              status={vehStatus}
            />
          </TableBody>
        </Table>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <DocumentCard
          kind="assurance"
          title={t("ins.policy")}
          icon={ShieldCheck}
          value={data.insurance}
          status={insStatus}
          j={insJ}
        />
        <DocumentCard
          kind="vignette"
          title={t("ins.vignetteAuto")}
          icon={ScrollText}
          value={data.vignette}
          status={vigStatus}
          j={vigJ}
        />
        <DocumentCard
          kind="vehicle"
          title={t("ins.cartePermis")}
          icon={Car}
          value={data.vehicleDoc}
          status={vehStatus}
          j={vehJ}
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
  const { t } = useLang();
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
        {j === null ? "—" : j < 0 ? `-${Math.abs(j)} ${t("common.days")}` : `${j} ${t("common.days")}`}
      </TableCell>
      <TableCell className="text-right font-mono">{cout != null ? `${cout.toLocaleString("fr-FR")}` : "—"}</TableCell>
      <TableCell>
        {status === null ? (
          <span className="text-xs text-muted-foreground">{t("common.notSet")}</span>
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
            {status === "expiree" ? t("ins.status.expired") : status === "bientot" ? t("ins.status.soon") : t("ins.status.valid")}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function useDocLabels() {
  const { t } = useLang();
  return {
    REF1_LABEL: {
      assurance: t("ins.field.company"),
      vignette: t("ins.field.agency"),
      vehicle: t("ins.field.org"),
    } as Record<DocKind, string>,
    REF2_LABEL: {
      assurance: t("ins.field.policyNo"),
      vignette: t("ins.field.vignetteNo"),
      vehicle: t("ins.field.regNo"),
    } as Record<DocKind, string>,
  };
}

type DocKind = "assurance" | "vignette" | "vehicle";

const REF1_KEY: Record<DocKind, string> = {
  assurance: "compagnie",
  vignette: "compagnie",
  vehicle: "organisme",
};
const REF2_KEY: Record<DocKind, string> = {
  assurance: "numeroPolice",
  vignette: "numero",
  vehicle: "numero",
};

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
  value: Insurance | Vignette | VehicleDoc | null;
  status: "ok" | "bientot" | "expiree" | null;
  j: number | null;
}) {
  const { t } = useLang();
  const { REF1_LABEL, REF2_LABEL } = useDocLabels();
  const [editing, setEditing] = useState(!value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const baseForm: any = {
    [REF1_KEY[kind]]: "",
    [REF2_KEY[kind]]: "",
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: "",
    cout: undefined,
    scanUrl: undefined,
  };

  const [form, setForm] = useState<any>((value as any) ?? baseForm);

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

  const persist = async (next: any) => {
    if (kind === "assurance") await updateInsurance(next as Insurance);
    else if (kind === "vignette") await updateVignette(next as Vignette);
    else await updateVehicleDoc(next as VehicleDoc);
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadDocument(kind, file);
      if (path) {
        const next: any = { ...form, scanUrl: path };
        setForm(next);
        await persist(next);
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
      await persist(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const dateDebut = form.dateDebut as string;
  const dateFin = form.dateFin as string;
  const cout = form.cout as number | undefined;
  const ref1 = form[REF1_KEY[kind]] ?? "";
  const ref2 = form[REF2_KEY[kind]] ?? "";

  const ringClass =
    status === "expiree"
      ? "border-destructive/40"
      : status === "bientot"
      ? "border-warning/40"
      : status === "ok"
      ? "border-success/40"
      : "border-border";

  return (
    <div className={`rounded-xl gradient-card shadow-card border ${ringClass} overflow-hidden text-sm`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2 border-b border-border/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="rounded-lg bg-primary/15 text-primary p-2 shrink-0">
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
            <div className="text-sm font-display truncate">{(value as any)?.[REF1_KEY[kind]] || t("common.notSet")}</div>
          </div>
        </div>
        {value && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md text-xs font-semibold hover:bg-primary/20"
          >
            <Pencil size={12} /> {t("common.edit")}
          </button>
        )}
      </div>

      {/* Status banner */}
      {status && (
        <div
          className={`px-4 py-2 text-xs flex items-center gap-2 border-b border-border/50 ${
            status === "expiree"
              ? "bg-destructive/10 text-destructive"
              : status === "bientot"
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
          }`}
        >
          {status === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          <span className="font-medium">
            {status === "expiree" && `${t("ins.status.expiredSince")} ${Math.abs(j!)} ${t("common.days")}`}
            {status === "bientot" && `${t("ins.status.expiresIn")} ${j} ${t("common.days")}`}
            {status === "ok" && `${t("ins.status.validFor")} ${j} ${t("common.days")}`}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-4 grid gap-3">
        {!editing && value ? (
          <div className="grid grid-cols-2 gap-2">
            <Mini label={t("ins.field.ref")} value={ref2 || "—"} mono />
            <Mini label={t("ins.field.cost.short")} value={value.cout != null ? `${value.cout.toLocaleString("fr-FR")} DA` : "—"} />
            <Mini label={t("ins.col.start")} value={dateDebut ? new Date(dateDebut).toLocaleDateString("fr-FR") : "—"} />
            <Mini label={t("ins.col.end")} value={dateFin ? new Date(dateFin).toLocaleDateString("fr-FR") : "—"} />
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label={REF1_LABEL[kind]}>
                <input value={ref1} onChange={(e) => set(REF1_KEY[kind], e.target.value)} className="input" />
              </Field>
              <Field label={REF2_LABEL[kind]}>
                <input value={ref2 || ""} onChange={(e) => set(REF2_KEY[kind], e.target.value)} className="input font-mono" />
              </Field>
              <Field label={t("ins.field.start")}>
                <input type="date" value={dateDebut} onChange={(e) => set("dateDebut", e.target.value)} className="input" />
              </Field>
              <Field label={t("ins.field.end")}>
                <input type="date" required value={dateFin} onChange={(e) => set("dateFin", e.target.value)} className="input" />
              </Field>
              <Field label={t("ins.field.cost")}>
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
                  className="px-3 py-1.5 rounded-md bg-secondary text-xs font-semibold"
                >
                  {t("common.cancel")}
                </button>
              )}
              <button
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
              >
                <Save size={14} /> {saving ? "…" : t("common.save")}
              </button>
            </div>
          </form>
        )}

        {/* Scanner — compact buttons row */}
        <div className="rounded-lg bg-secondary/40 border border-border/50 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <ImageIcon size={14} className="text-primary shrink-0" />
            <span className="truncate">{previewUrl ? t("ins.scan.has") : t("ins.scan.none")}</span>
          </div>
          <div className="flex gap-1.5">
            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            {previewUrl && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center gap-1 bg-accent/20 text-accent-foreground border border-accent/30 px-2 py-1 rounded-md text-xs font-semibold hover:bg-accent/30"
                title={t("common.view")}
              >
                <Eye size={12} /> {t("common.view")}
              </button>
            )}
            <button
              type="button"
              onClick={() => camRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold disabled:opacity-50"
              title={t("ins.scan.scan")}
            >
              {uploading ? <Loader2 className="animate-spin" size={12} /> : <Camera size={12} />} {t("ins.scan.scan")}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 bg-secondary text-foreground border border-border px-2 py-1 rounded-md text-xs font-semibold disabled:opacity-50"
              title={t("ins.scan.import")}
            >
              <ImageIcon size={12} /> {t("ins.scan.import")}
            </button>
          </div>
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

      <style>{`.input{width:100%;background:var(--color-input);border:1px solid var(--color-border);border-radius:.5rem;padding:.45rem .7rem;font-size:.8rem;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-ring)}`}</style>
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
