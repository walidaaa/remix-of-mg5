import { Link, useLocation } from "@tanstack/react-router";
import { Car, Droplet, ShieldCheck, ScanLine, Gauge, Wrench, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/", label: "Tableau", icon: Gauge },
  { to: "/vehicule", label: "Véhicule", icon: Car },
  { to: "/vidanges", label: "Vidanges", icon: Droplet },
  { to: "/entretien", label: "Entretien", icon: Wrench },
  { to: "/assurance", label: "Assurance", icon: ShieldCheck },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur p-6 gap-2">
        <div className="mb-8">
          <div className="font-display text-3xl text-primary">MG5</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            Maintenance
          </div>
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
      </aside>

      {/* Main */}
      <main className="px-4 md:px-10 py-6 md:py-10 max-w-5xl mx-auto">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-6">
          {links.map((l) => {
            const active = pathname === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
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
