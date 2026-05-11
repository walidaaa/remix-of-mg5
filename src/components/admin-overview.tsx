import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListAllVehicles,
  adminListAllOilChanges,
  adminListAllMaintenance,
  adminListAllInsurance,
} from "@/lib/admin.functions";
import { AppShell } from "@/components/app-shell";
import { getBrandImage } from "@/lib/brand-images";
import { Car, Droplet, Wrench, ShieldCheck, Users, Gauge, Calendar, ChevronLeft, ChevronRight, Search, X, Eye, Coins, FileText } from "lucide-react";
import { MAINTENANCE_LABELS, type MaintenanceType } from "@/lib/storage";

type View = "dashboard" | "vehicles" | "oil" | "maintenance" | "insurance";

const PAGE_SIZES = [10, 20, 50] as const;

export function AdminOverview({ view }: { view: View }) {
  const fetchVeh = useServerFn(adminListAllVehicles);
  const fetchOils = useServerFn(adminListAllOilChanges);
  const fetchMaint = useServerFn(adminListAllMaintenance);
  const fetchIns = useServerFn(adminListAllInsurance);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [oils, setOils] = useState<any[]>([]);
  const [maint, setMaint] = useState<any[]>([]);
  const [ins, setIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchVeh().catch(() => []),
      fetchOils().catch(() => []),
      fetchMaint().catch(() => []),
      fetchIns().catch(() => []),
    ]).then(([v, o, m, i]) => {
      setVehicles(v as any[]);
      setOils(o as any[]);
      setMaint(m as any[]);
      setIns(i as any[]);
      setLoading(false);
    });
  }, [fetchVeh, fetchOils, fetchMaint, fetchIns]);

  if (loading) {
    return (
      <AppShell>
        <div className="grid gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (view === "dashboard") return <Dashboard vehicles={vehicles} oils={oils} maint={maint} ins={ins} />;
  if (view === "vehicles") return <Vehicles vehicles={vehicles} oils={oils} maint={maint} ins={ins} />;
  if (view === "oil") return <Oils oils={oils} />;
  if (view === "maintenance") return <Maint items={maint} />;
  return <Ins items={ins} />;
}

function usePagination<T>(items: T[]) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  useEffect(() => { setPage(1); }, [pageSize, total]);

  return { pageItems, page: safePage, setPage, pageSize, setPageSize, totalPages, total, start };
}

function PaginationBar({
  page, setPage, pageSize, setPageSize, totalPages, total, start, count,
}: {
  page: number; setPage: (n: number) => void;
  pageSize: number; setPageSize: (n: number) => void;
  totalPages: number; total: number; start: number; count: number;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl gradient-card border border-border p-3 shadow-card">
      <div className="text-xs text-muted-foreground">
        Affichage <strong className="text-foreground">{start + 1}</strong>–<strong className="text-foreground">{start + count}</strong> sur <strong className="text-foreground">{total}</strong>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Par page</span>
        <div className="flex rounded-lg overflow-hidden border border-border">
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setPageSize(s)}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                pageSize === s ? "bg-primary text-primary-foreground" : "bg-secondary/40 hover:bg-secondary text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-secondary/40 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Précédent"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-mono px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-secondary/40 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Suivant"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="mb-5 relative max-w-xl">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-card transition"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary text-muted-foreground"
          aria-label="Effacer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function useFilter<T>(items: T[], query: string, getFields: (item: T) => Array<string | number | null | undefined>) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      getFields(it).some((f) => f != null && String(f).toLowerCase().includes(q))
    );
  }, [items, query, getFields]);
}

function Header({ icon: Icon, title, subtitle, count }: { icon: any; title: string; subtitle: string; count?: number }) {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
        <Icon size={14} /> Vue Super Admin
      </div>
      <h1 className="text-3xl md:text-4xl">{title}</h1>
      <p className="text-muted-foreground mt-1">
        {subtitle}
        {count !== undefined && <> · <strong className="text-foreground">{count}</strong></>}
      </p>
    </div>
  );
}

function OwnerBadge({ owner }: { owner: any }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary text-xs">
      <Users size={11} /> {owner?.username || owner?.display_name || "—"}
    </span>
  );
}

function Dashboard({ vehicles, oils, maint, ins }: any) {
  const totalCost =
    oils.reduce((s: number, o: any) => s + (Number(o.cout) || 0), 0) +
    maint.reduce((s: number, m: any) => s + (Number(m.cout) || 0), 0);
  const expiredIns = ins.filter((i: any) => i.date_fin && new Date(i.date_fin) < new Date()).length;
  return (
    <AppShell>
      <Header icon={Gauge} title="Tableau de bord — Super Admin" subtitle="Synthèse globale de tous les utilisateurs et véhicules" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={Car} label="Véhicules" value={vehicles.length} tone="primary" />
        <Stat icon={Droplet} label="Vidanges" value={oils.length} tone="accent" />
        <Stat icon={Wrench} label="Entretiens" value={maint.length} tone="warning" />
        <Stat icon={ShieldCheck} label={`Assurances (${expiredIns} expirées)`} value={ins.length} tone={expiredIns > 0 ? "destructive" : "success"} />
      </div>

      <div className="rounded-2xl gradient-card p-6 shadow-card mb-6">
        <h3 className="text-lg mb-4">Coût total enregistré</h3>
        <div className="font-display text-4xl text-primary">{totalCost.toLocaleString("fr-FR")} <span className="text-base text-muted-foreground">DH</span></div>
      </div>

      <h3 className="text-xl mb-4">Derniers véhicules</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.slice(0, 6).map((v: any) => (
          <VehicleCard key={v.user_id} v={v} />
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: string }) {
  const ring: Record<string, string> = {
    primary: "border-primary/30 text-primary",
    accent: "border-accent/30 text-accent",
    warning: "border-warning/30 text-warning",
    success: "border-success/30 text-success",
    destructive: "border-destructive/30 text-destructive",
  };
  return (
    <div className={`rounded-xl gradient-card border ${ring[tone]} p-4 shadow-card`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon size={14} /> {label}
      </div>
      <div className="font-display text-3xl mt-2 text-foreground">{value}</div>
    </div>
  );
}

function VehicleCard({ v, onView }: { v: any; onView?: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden gradient-card shadow-card border border-border flex flex-col">
      <div className="relative h-32">
        <img src={getBrandImage(v.marque)} alt={v.marque} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs uppercase tracking-wider text-primary font-semibold">{v.marque} · {v.annee}</div>
        <div className="font-display text-2xl">{v.modele}</div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{v.matricule || "—"}</span>
          <OwnerBadge owner={v.owner} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-secondary/40 rounded p-2">
            <div className="text-muted-foreground">KM</div>
            <div className="font-semibold">{(v.km_actuel || 0).toLocaleString("fr-FR")}</div>
          </div>
          <div className="bg-secondary/40 rounded p-2">
            <div className="text-muted-foreground">Vidanges</div>
            <div className="font-semibold">{v.oil_count}</div>
          </div>
        </div>
        {onView && (
          <button
            onClick={onView}
            className="mt-3 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
          >
            <Eye size={15} /> Voir toutes les données
          </button>
        )}
      </div>
    </div>
  );
}

function Vehicles({ vehicles, oils, maint, ins }: any) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const filtered = useFilter<any>(vehicles, q, (v) => [
    v.marque, v.modele, v.matricule, v.couleur, v.annee, v.transmission,
    v.owner?.username, v.owner?.display_name,
  ]);
  const p = usePagination<any>(filtered);
  return (
    <AppShell>
      <Header icon={Car} title="Tous les véhicules" subtitle="Tous les véhicules de tous les utilisateurs" count={vehicles.length} />
      <SearchBar value={q} onChange={setQ} placeholder="Rechercher par marque, modèle, matricule, propriétaire…" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {p.pageItems.map((v: any) => (
          <VehicleCard key={v.user_id} v={v} onView={() => setSelected(v)} />
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">Aucun véhicule.</p>}
      </div>
      <PaginationBar {...p} count={p.pageItems.length} />
      {selected && (
        <VehicleDetailModal
          vehicle={selected}
          oils={oils.filter((o: any) => o.user_id === selected.user_id)}
          maint={maint.filter((m: any) => m.user_id === selected.user_id)}
          insurance={ins.find((i: any) => i.user_id === selected.user_id) || null}
          onClose={() => setSelected(null)}
        />
      )}
    </AppShell>
  );
}

function VehicleDetailModal({ vehicle, oils, maint, insurance, onClose }: {
  vehicle: any; oils: any[]; maint: any[]; insurance: any | null; onClose: () => void;
}) {
  const totalOil = oils.reduce((s, o) => s + (Number(o.cout) || 0), 0);
  const totalMaint = maint.reduce((s, m) => s + (Number(m.cout) || 0), 0);
  const total = totalOil + totalMaint;
  const insDays = insurance?.date_fin ? Math.ceil((+new Date(insurance.date_fin) - Date.now()) / 86400000) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-3 md:p-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-background border border-border rounded-2xl shadow-card w-full max-w-4xl my-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={getBrandImage(vehicle.marque)} alt={vehicle.marque} className="w-full h-40 object-cover rounded-t-2xl" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent rounded-t-2xl" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 hover:bg-background border border-border" aria-label="Fermer">
            <X size={18} />
          </button>
          <div className="absolute bottom-3 left-5">
            <div className="text-xs uppercase tracking-wider text-primary font-bold">{vehicle.marque} · {vehicle.annee}</div>
            <div className="font-display text-3xl">{vehicle.modele}</div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{vehicle.matricule || "—"}</span>
              <OwnerBadge owner={vehicle.owner} />
            </div>
          </div>
        </div>

        <div className="p-5 grid gap-5">
          <DetailSection icon={Car} title="Informations véhicule" tone="primary">
            <DetailGrid>
              <DetailInfo label="Matricule" value={vehicle.matricule || "—"} mono />
              <DetailInfo label="Marque" value={vehicle.marque} />
              <DetailInfo label="Modèle" value={vehicle.modele} />
              <DetailInfo label="Année" value={String(vehicle.annee)} />
              <DetailInfo label="Couleur" value={vehicle.couleur || "—"} />
              <DetailInfo label="Transmission" value={vehicle.transmission} />
              <DetailInfo label="Km actuel" value={(vehicle.km_actuel || 0).toLocaleString("fr-FR") + " km"} />
              <DetailInfo label="Intervalle vidange" value={(vehicle.intervalle_vidange || 0).toLocaleString("fr-FR") + " km"} />
            </DetailGrid>
          </DetailSection>

          <DetailSection icon={Coins} title="Coûts cumulés" tone="success">
            <DetailGrid>
              <DetailInfo label="Vidanges" value={`${totalOil.toLocaleString("fr-FR")} DH`} />
              <DetailInfo label="Entretiens" value={`${totalMaint.toLocaleString("fr-FR")} DH`} />
              <DetailInfo label="Total" value={`${total.toLocaleString("fr-FR")} DH`} highlight />
            </DetailGrid>
          </DetailSection>

          <DetailSection
            icon={ShieldCheck}
            title="Assurance"
            tone={insDays === null ? "muted" : insDays < 0 ? "destructive" : insDays <= 30 ? "warning" : "success"}
          >
            {insurance ? (
              <DetailGrid>
                <DetailInfo label="Compagnie" value={insurance.compagnie || "—"} />
                <DetailInfo label="N° police" value={insurance.numero_police || "—"} mono />
                <DetailInfo label="Du" value={insurance.date_debut ? new Date(insurance.date_debut).toLocaleDateString("fr-FR") : "—"} />
                <DetailInfo label="Au" value={insurance.date_fin ? new Date(insurance.date_fin).toLocaleDateString("fr-FR") : "—"} />
                {insDays !== null && (
                  <DetailInfo label="Statut" value={insDays < 0 ? `Expirée ${Math.abs(insDays)}j` : `${insDays} j restants`} highlight />
                )}
              </DetailGrid>
            ) : <p className="text-sm text-muted-foreground">Aucune assurance enregistrée.</p>}
          </DetailSection>

          <DetailSection icon={Droplet} title={`Vidanges (${oils.length})`} tone="primary">
            {oils.length ? (
              <div className="grid gap-2">
                {oils.map((o) => (
                  <div key={o.id} className="rounded-lg bg-secondary/40 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} />{new Date(o.date).toLocaleDateString("fr-FR")}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Gauge size={11} />{o.km.toLocaleString("fr-FR")} km</span>
                      <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs">{o.type_huile}</span>
                      {o.filtre_huile && <span className="text-xs text-muted-foreground">Filtre: {o.filtre_huile}</span>}
                    </div>
                    <span className="font-mono text-sm">{o.cout != null ? `${o.cout} DH` : "—"}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucune vidange.</p>}
          </DetailSection>

          <DetailSection icon={Wrench} title={`Entretiens (${maint.length})`} tone="warning">
            {maint.length ? (
              <div className="grid gap-2">
                {maint.map((m) => {
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
          </DetailSection>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ icon: Icon, title, tone, children }: { icon: any; title: string; tone: string; children: React.ReactNode }) {
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

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>;
}

function DetailInfo({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-secondary/40 rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-semibold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Oils({ oils }: any) {
  const [q, setQ] = useState("");
  const filtered = useFilter<any>(oils, q, (o) => [
    o.vehicle?.marque, o.vehicle?.modele, o.vehicle?.matricule,
    o.type_huile, o.filtre_huile, o.notes,
    o.owner?.username, o.owner?.display_name,
  ]);
  const p = usePagination<any>(filtered);
  return (
    <AppShell>
      <Header icon={Droplet} title="Toutes les vidanges" subtitle="Historique global" count={oils.length} />
      <SearchBar value={q} onChange={setQ} placeholder="Rechercher par véhicule, type d'huile, propriétaire…" />
      <div className="grid gap-3">
        {p.pageItems.map((o: any) => (
          <div key={o.id} className="rounded-xl gradient-card p-4 shadow-card flex items-center gap-4 flex-wrap">
            <div className="rounded-lg bg-primary/15 text-primary p-3"><Droplet size={20} /></div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{o.vehicle?.marque} {o.vehicle?.modele}</span>
                <OwnerBadge owner={o.owner} />
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                <span><Calendar size={10} className="inline mr-1" />{new Date(o.date).toLocaleDateString("fr-FR")}</span>
                <span><Gauge size={10} className="inline mr-1" />{o.km.toLocaleString("fr-FR")} km</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary">{o.type_huile}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono">{o.cout != null ? `${o.cout} DH` : "—"}</div>
              {o.filtre_huile && <div className="text-xs text-muted-foreground">{o.filtre_huile}</div>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">Aucune vidange.</p>}
      </div>
      <PaginationBar {...p} count={p.pageItems.length} />
    </AppShell>
  );
}

function Maint({ items }: any) {
  const [q, setQ] = useState("");
  const filtered = useFilter<any>(items, q, (m) => [
    m.type, MAINTENANCE_LABELS[m.type as MaintenanceType]?.label,
    m.vehicle?.marque, m.vehicle?.modele, m.vehicle?.matricule,
    m.owner?.username, m.owner?.display_name, m.notes,
  ]);
  const p = usePagination<any>(filtered);
  return (
    <AppShell>
      <Header icon={Wrench} title="Tous les entretiens" subtitle="Historique global" count={items.length} />
      <SearchBar value={q} onChange={setQ} placeholder="Rechercher par type, véhicule, propriétaire…" />
      <div className="grid md:grid-cols-2 gap-3">
        {p.pageItems.map((m: any) => {
          const def = MAINTENANCE_LABELS[m.type as MaintenanceType];
          return (
            <div key={m.id} className="rounded-xl gradient-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-warning/15 text-warning p-2"><Wrench size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{def?.label ?? m.type}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(m.date).toLocaleDateString("fr-FR")} · {m.km.toLocaleString("fr-FR")} km
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <OwnerBadge owner={m.owner} />
                    {m.vehicle && <span className="text-xs text-muted-foreground">{m.vehicle.marque} {m.vehicle.modele}</span>}
                  </div>
                </div>
                <div className="text-sm font-mono">{m.cout != null ? `${m.cout} DH` : "—"}</div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-muted-foreground">Aucun entretien.</p>}
      </div>
      <PaginationBar {...p} count={p.pageItems.length} />
    </AppShell>
  );
}

function Ins({ items }: any) {
  const [q, setQ] = useState("");
  const filtered = useFilter<any>(items, q, (i) => [
    i.compagnie, i.numero_police,
    i.vehicle?.marque, i.vehicle?.modele, i.vehicle?.matricule,
    i.owner?.username, i.owner?.display_name,
  ]);
  const p = usePagination<any>(filtered);
  return (
    <AppShell>
      <Header icon={ShieldCheck} title="Toutes les assurances" subtitle="Polices de tous les utilisateurs" count={items.length} />
      <SearchBar value={q} onChange={setQ} placeholder="Rechercher par compagnie, n° police, véhicule, propriétaire…" />
      <div className="grid md:grid-cols-2 gap-3">
        {p.pageItems.map((i: any) => {
          const j = i.date_fin ? Math.ceil((+new Date(i.date_fin) - Date.now()) / 86400000) : null;
          const tone = j === null ? "muted" : j < 0 ? "destructive" : j <= 30 ? "warning" : "success";
          const cls = tone === "destructive" ? "border-destructive bg-destructive/10"
            : tone === "warning" ? "border-warning bg-warning/10"
            : tone === "success" ? "border-success bg-success/10" : "border-border";
          return (
            <div key={i.user_id} className={`rounded-xl p-4 shadow-card border-l-4 gradient-card ${cls}`}>
              <div className="flex items-start gap-3">
                <ShieldCheck className={tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-success"} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{i.compagnie || "—"}</div>
                  <div className="text-xs text-muted-foreground font-mono">{i.numero_police || "—"}</div>
                  <div className="text-xs mt-1">
                    {i.date_debut && <>Du {new Date(i.date_debut).toLocaleDateString("fr-FR")} </>}
                    {i.date_fin && <>au {new Date(i.date_fin).toLocaleDateString("fr-FR")}</>}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <OwnerBadge owner={i.owner} />
                    {i.vehicle && <span className="text-xs text-muted-foreground">{i.vehicle.marque} {i.vehicle.modele}</span>}
                  </div>
                </div>
                {j !== null && (
                  <div className="text-right text-xs">
                    {j < 0 ? `Expirée ${Math.abs(j)}j` : `${j} j`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-muted-foreground">Aucune assurance.</p>}
      </div>
      <PaginationBar {...p} count={p.pageItems.length} />
    </AppShell>
  );
}
