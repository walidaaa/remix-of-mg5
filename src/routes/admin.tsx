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
  listBrands,
  adminAddBrand,
  adminDeleteBrand,
  listModels,
  adminAddModel,
  adminDeleteModel,
} from "@/lib/admin.functions";
import { Plus, Trash2, KeyRound, ShieldCheck, Users, Tag, Loader2, Car } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MG5 Maintenance" }] }),
  component: AdminPage,
});

type UserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  role: "admin" | "user";
  vehicle: { marque: string; modele: string; matricule: string } | null;
};
type Brand = { id: string; name: string };

function AdminPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"users" | "brands">("users");
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

      <div className="flex gap-2 mb-6">
        <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={16} />}>
          Utilisateurs
        </TabBtn>
        <TabBtn active={tab === "brands"} onClick={() => setTab("brands")} icon={<Tag size={16} />}>
          Marques
        </TabBtn>
      </div>

      {tab === "users" ? <UsersTab /> : <BrandsTab />}
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
  const fetchBrands = useServerFn(listBrands);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [brand, setBrand] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [u, b] = await Promise.all([list(), fetchBrands()]);
      setUsers(u);
      setBrands(b);
      if (!brand && b[0]) setBrand(b[0].name);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await create({ data: { username, password, brand: brand || undefined } });
      setUsername(""); setPassword("");
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
        <form onSubmit={submit} className="rounded-2xl gradient-card p-5 shadow-card grid gap-3 md:grid-cols-4">
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
          <button disabled={busy} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold disabled:opacity-50">
            {busy ? "..." : "Créer"}
          </button>
          {err && <div className="md:col-span-4 text-sm text-destructive">{err}</div>}
        </form>
      )}

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Véhicule</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{u.username ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      u.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.vehicle ? `${u.vehicle.marque} ${u.vehicle.modele} ${u.vehicle.matricule}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onReset(u.id, u.username)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-secondary"
                      title="Réinitialiser mot de passe"
                    >
                      <KeyRound size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(u.id, u.username)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-destructive hover:bg-destructive/10 ml-1"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

  const refresh = async () => setBrands(await list());
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
