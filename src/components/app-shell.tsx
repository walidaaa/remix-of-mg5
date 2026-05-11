import { Link, useLocation } from "@tanstack/react-router";
import { Car, Droplet, ShieldCheck, Gauge, Wrench, LogOut, ShieldUser } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const baseLinks = [
  { to: "/", label: "Tableau", icon: Gauge },
  { to: "/vehicule", label: "Véhicule", icon: Car },
  { to: "/vidanges", label: "Vidanges", icon: Droplet },
  { to: "/entretien", label: "Entretien", icon: Wrench },
  { to: "/assurance", label: "Assurance", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? data?.display_name ?? null));
  }, [user]);

  const links = isAdmin
    ? ([...baseLinks, { to: "/admin" as const, label: "Admin", icon: ShieldUser }] as const)
    : baseLinks;

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64 pt-14 md:pt-0">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl text-primary leading-none">MG5</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Maintenance</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {username ?? user?.email}
          </span>
          <button
            onClick={() => signOut()}
            aria-label="Déconnexion"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 text-xs font-medium"
          >
            <LogOut size={14} /> <span>Sortir</span>
          </button>
        </div>
      </header>

      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur p-6 gap-2">
        <div className="mb-8">
          <div className="font-display text-3xl text-primary">MG5</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Maintenance</div>
        </div>
        {links.map((l) => {
          const active = pathname === l.to;
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{l.label}</span>
            </Link>
          );
        })}
        <div className="mt-auto pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground truncate mb-2 px-2">
            {username ?? user?.email}
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={16} /> <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="px-4 md:px-10 py-6 md:py-10 max-w-5xl mx-auto">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className={`grid ${links.length === 6 ? "grid-cols-6" : "grid-cols-5"}`}>
          {links.map((l) => {
            const active = pathname === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
