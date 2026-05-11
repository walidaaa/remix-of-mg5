import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListUsers,
  adminCreateUser,
  adminDeleteUser,
  adminResetPassword,
  adminResetVidange,
  adminSetBlocked,
  adminListAllVehicles,
  adminGetUserData,
  listBrands,
  adminAddBrand,
  adminDeleteBrand,
  listModels,
  adminAddModel,
  adminDeleteModel,
} from "@/lib/admin.functions";
import { Plus, Trash2, KeyRound, ShieldCheck, Users, Tag, Loader2, Car, RotateCcw, Lock, Unlock, Database, ChevronDown, ChevronRight, Droplet, Wrench, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MG5 Maintenance" }] }),
  component: AdminPage,
});

type UserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  role: "admin" | "user";
  blocked: boolean;
  vehicle: { marque: string; modele: string; matricule: string; km_actuel: number; intervalle_vidange: number } | null;
};
type Brand = { id: string; name: string };

function AdminPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"users" | "vehicles" | "brands" | "models">("users");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        if (!data) nav({ to: "/" });
      });
  }, [user, loading, nav]);

  if (loading || isAdmin === null) {
    return (
      <AppShell>
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin" /></div>
      </AppShell>
    );
  }
  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="text-primary" />
        <h1 className="text-3xl">Administration</h1>
      </div>
      <p className="text-muted-foreground mb-6">Gérez les utilisateurs et les marques de véhicules.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={16} />}>
          Utilisateurs
        </TabBtn>
        <TabBtn active={tab === "vehicles"} onClick={() => setTab("vehicles")} icon={<Database size={16} />}>
          Tous les véhicules
        </TabBtn>
        <TabBtn active={tab === "brands"} onClick={() => setTab("brands")} icon={<Tag size={16} />}>
          Marques
        </TabBtn>
        <TabBtn active={tab === "models"} onClick={() => setTab("models")} icon={<Car size={16} />}>
          Modèles
        </TabBtn>
      </div>

      {tab === "users" ? <UsersTab /> : tab === "vehicles" ? <VehiclesTab /> : tab === "brands" ? <BrandsTab /> : <ModelsTab />}
    </AppShell>
  );
}

function TabBtn({
  active, onClick, children, icon,
}: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function UsersTab() {
  const list = useServerFn(adminListUsers);
  const create = useServerFn(adminCreateUser);
  const del = useServerFn(adminDeleteUser);
  const reset = useServerFn(adminResetPassword);
  const resetVidange = useServerFn(adminResetVidange);
  const setBlocked = useServerFn(adminSetBlocked);
  const fetchBrands = useServerFn(listBrands);
  const fetchModels = useServerFn(listModels);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [u, b] = await Promise.all([list(), fetchBrands()]);
      setUsers(u);
      setBrands(b);
      if (!brand && b[0]) setBrand(b[0].name);
    } catch (e) {
      console.error("admin refresh failed", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh().catch((e) => console.error(e)); }, []);

  useEffect(() => {
    if (!brand) { setModels([]); setModel(""); return; }
    fetchModels({ data: { brandName: brand } }).then((m) => {
      setModels(m);
      setModel((curr) => (m.find((x) => x.name === curr) ? curr : ""));
    }).catch(() => setModels([]));
  }, [brand, fetchModels]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await create({ data: { username, password, brand: brand || undefined, model: model || undefined } });
      setUsername(""); setPassword(""); setModel("");
      setShowForm(false);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string, uname: string | null) => {
    if (!confirm(`Supprimer "${uname}" et toutes ses données ?`)) return;
    await del({ data: { userId: id } });
    refresh();
  };
  const onReset = async (id: string, uname: string | null) => {
    const np = prompt(`Nouveau mot de passe pour "${uname}" (min 6 caractères) :`);
    if (!np || np.length < 6) return;
    try {
      await reset({ data: { userId: id, password: np } });
      alert("Mot de passe réinitialisé.");
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    }
  };
  const onResetVidange = async (id: string, uname: string | null) => {
    if (!confirm(`Approuver et réinitialiser la vidange de "${uname}" (KM → 0) ?`)) return;
    try {
      await resetVidange({ data: { userId: id } });
      await refresh();
    } catch (e: any) { alert(e?.message ?? "Erreur"); }
  };
  const onToggleBlock = async (id: string, uname: string | null, blocked: boolean) => {
    const action = blocked ? "débloquer" : "bloquer";
    if (!confirm(`Voulez-vous ${action} "${uname}" ?`)) return;
    try {
      await setBlocked({ data: { userId: id, blocked: !blocked } });
      await refresh();
    } catch (e: any) { alert(e?.message ?? "Erreur"); }
  };

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{users.length} utilisateur(s)</div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-glow"
        >
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl gradient-card p-5 shadow-card grid gap-3 md:grid-cols-5">
          <input
            placeholder="Username" required minLength={3} value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input bg-input border border-border rounded-lg px-3 py-2"
          />
          <input
            type="password" placeholder="Mot de passe" required minLength={6} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input bg-input border border-border rounded-lg px-3 py-2"
          />
          <select
            value={brand} onChange={(e) => setBrand(e.target.value)}
            className="bg-input border border-border rounded-lg px-3 py-2"
          >
            <option value="">— Marque —</option>
            {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <select
            value={model} onChange={(e) => setModel(e.target.value)}
            className="bg-input border border-border rounded-lg px-3 py-2"
            disabled={!brand || models.length === 0}
          >
            <option value="">{models.length ? "— Modèle —" : "Aucun modèle"}</option>
            {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
          <button disabled={busy} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold disabled:opacity-50">
            {busy ? "..." : "Créer"}
          </button>
          {err && <div className="md:col-span-5 text-sm text-destructive">{err}</div>}
        </form>
      )}

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const km = u.vehicle?.km_actuel ?? 0;
                const interval = u.vehicle?.intervalle_vidange ?? 10000;
                const overdue = !!u.vehicle && km >= interval;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-block text-xs px-2 py-1 rounded ${
                        u.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>{u.role}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.vehicle ? `${u.vehicle.marque} ${u.vehicle.modele} ${u.vehicle.matricule}` : "—"}
                    </TableCell>
                    <TableCell className={overdue ? "text-destructive font-semibold" : ""}>
                      {u.vehicle ? km.toLocaleString("fr-FR") : "—"}
                    </TableCell>
                    <TableCell>
                      {u.blocked ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive/15 text-destructive">
                          <Lock size={12} /> Bloqué
                        </span>
                      ) : overdue ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-warning/15 text-warning">
                          Vidange requise
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-success/15 text-success">
                          OK
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex flex-wrap gap-1 justify-end">
                        {u.vehicle && (
                          <Button
                            size="sm"
                            variant={overdue ? "default" : "secondary"}
                            onClick={() => onResetVidange(u.id, u.username)}
                            title="Approuver / Reset vidange (KM → 0)"
                          >
                            <RotateCcw size={14} /> Reset vidange
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={u.blocked ? "secondary" : "destructive"}
                          onClick={() => onToggleBlock(u.id, u.username, u.blocked)}
                          title={u.blocked ? "Débloquer" : "Bloquer"}
                        >
                          {u.blocked ? <><Unlock size={14} /> Débloquer</> : <><Lock size={14} /> Bloquer</>}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onReset(u.id, u.username)} title="Réinitialiser mot de passe">
                          <KeyRound size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(u.id, u.username)} title="Supprimer" className="text-destructive hover:text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function VehiclesTab() {
  const list = useServerFn(adminListAllVehicles);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    list().then((r) => setRows(r as any[])).finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
  const filtered = rows.filter((v) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [v.marque, v.modele, v.matricule, v.couleur, v.owner?.username, v.owner?.display_name]
      .some((x) => (x ?? "").toString().toLowerCase().includes(s));
  });

  if (loading) return <div className="grid place-items-center py-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground">{filtered.length} véhicule(s)</div>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (marque, modèle, matricule, propriétaire)…"
          className="bg-input border border-border rounded-lg px-3 py-2 text-sm w-full md:w-96"
        />
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Propriétaire</TableHead>
              <TableHead>Marque / Modèle</TableHead>
              <TableHead>Matricule</TableHead>
              <TableHead>Année</TableHead>
              <TableHead>Couleur</TableHead>
              <TableHead>Trans.</TableHead>
              <TableHead>KM</TableHead>
              <TableHead>Interv.</TableHead>
              <TableHead>Dernière vidange</TableHead>
              <TableHead>Vidanges</TableHead>
              <TableHead>Assurance</TableHead>
              <TableHead>Entretiens</TableHead>
              <TableHead>Créé le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => {
              const overdue = (v.km_actuel ?? 0) >= (v.intervalle_vidange ?? 10000);
              return (
                <TableRow key={v.user_id}>
                  <TableCell>
                    <div className="font-medium">{v.owner?.username ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{v.owner?.display_name ?? ""}</div>
                    {v.owner?.blocked && (
                      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-destructive/15 text-destructive mt-1">
                        <Lock size={10} /> Bloqué
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{v.marque} {v.modele}</TableCell>
                  <TableCell>{v.matricule || "—"}</TableCell>
                  <TableCell>{v.annee}</TableCell>
                  <TableCell>{v.couleur || "—"}</TableCell>
                  <TableCell className="capitalize text-xs">{v.transmission}</TableCell>
                  <TableCell className={overdue ? "text-destructive font-semibold" : ""}>
                    {(v.km_actuel ?? 0).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{(v.intervalle_vidange ?? 10000).toLocaleString("fr-FR")}</TableCell>
                  <TableCell className="text-xs">
                    {v.last_oil ? (
                      <>
                        <div>{fmtDate(v.last_oil.date)}</div>
                        <div className="text-muted-foreground">{v.last_oil.km?.toLocaleString("fr-FR")} km · {v.last_oil.type_huile}</div>
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{v.oil_count}</TableCell>
                  <TableCell className="text-xs">
                    {v.insurance ? (
                      <>
                        <div className="font-medium">{v.insurance.compagnie || "—"}</div>
                        <div className="text-muted-foreground">{v.insurance.numero_police || ""}</div>
                        <div className="text-muted-foreground">{fmtDate(v.insurance.date_debut)} → {fmtDate(v.insurance.date_fin)}</div>
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{v.maintenance_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(v.created_at)}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">Aucun véhicule</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BrandsTab() {
  const list = useServerFn(listBrands);
  const add = useServerFn(adminAddBrand);
  const del = useServerFn(adminDeleteBrand);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    try { setBrands(await list()); } catch (e) { console.error(e); }
  };
  useEffect(() => { refresh(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await add({ data: { name } });
      setName("");
      refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          required maxLength={50} placeholder="Nouvelle marque (ex: BMW)"
          className="flex-1 bg-input border border-border rounded-lg px-3 py-2"
        />
        <button disabled={busy} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold disabled:opacity-50">
          <Plus size={16} /> Ajouter
        </button>
      </form>
      {err && <div className="text-sm text-destructive">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {brands.map((b) => (
          <div key={b.id} className="flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2">
            <span className="font-medium">{b.name}</span>
            <button
              onClick={async () => {
                if (!confirm(`Supprimer "${b.name}" ?`)) return;
                await del({ data: { id: b.id } });
                refresh();
              }}
              className="text-destructive hover:bg-destructive/10 p-1 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelsTab() {
  const fetchBrands = useServerFn(listBrands);
  const fetchModels = useServerFn(listModels);
  const add = useServerFn(adminAddModel);
  const del = useServerFn(adminDeleteModel);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands().then((b) => {
      setBrands(b);
      if (!brandId && b[0]) setBrandId(b[0].id);
    }).catch((e) => console.error(e));
  }, []);

  const refresh = async () => {
    if (!brandId) return;
    const m = await fetchModels({ data: { brandId } });
    setModels(m);
  };
  useEffect(() => { refresh().catch((e) => console.error(e)); }, [brandId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await add({ data: { brandId, name } });
      setName("");
      refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex gap-2 items-center">
        <label className="text-sm text-muted-foreground">Marque :</label>
        <select
          value={brandId} onChange={(e) => setBrandId(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-2"
        >
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          required maxLength={80} placeholder="Nouveau modèle (ex: MG5 Luxury)"
          className="flex-1 bg-input border border-border rounded-lg px-3 py-2"
        />
        <button disabled={busy || !brandId} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold disabled:opacity-50">
          <Plus size={16} /> Ajouter
        </button>
      </form>
      {err && <div className="text-sm text-destructive">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {models.map((m) => (
          <div key={m.id} className="flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2">
            <span className="font-medium">{m.name}</span>
            <button
              onClick={async () => {
                if (!confirm(`Supprimer "${m.name}" ?`)) return;
                await del({ data: { id: m.id } });
                refresh();
              }}
              className="text-destructive hover:bg-destructive/10 p-1 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {models.length === 0 && <div className="text-sm text-muted-foreground col-span-full">Aucun modèle.</div>}
      </div>
    </div>
  );
}
