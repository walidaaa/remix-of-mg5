import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MG5 Maintenance" },
      { name: "description", content: "Suivi vidange, kilométrage, assurance et scanner pour votre MG5." },
      { name: "author", content: "MG5 Maintenance" },
      { property: "og:title", content: "MG5 Maintenance" },
      { property: "og:description", content: "Suivi vidange, kilométrage, assurance et scanner pour votre MG5." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { AuthProvider, useAuth } from "@/lib/auth";
import { useRouter as useTanRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = new Set(["/login", "/setup"]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useTanRouter();
  const pathname = router.state.location.pathname;
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!PUBLIC_PATHS.has(pathname)) router.navigate({ to: "/login" });
      return;
    }
    // Logged in: decide where to land
    let cancelled = false;
    setRouting(true);
    (async () => {
      const [{ data: role }, { data: veh }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
        supabase.from("vehicles").select("matricule").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      const isAdmin = !!role;
      const hasVehicle = !!veh && !!veh.matricule;

      if (PUBLIC_PATHS.has(pathname)) {
        router.navigate({ to: isAdmin ? "/admin" : hasVehicle ? "/" : "/vehicule" });
      } else if (!isAdmin && !hasVehicle && pathname !== "/vehicule") {
        router.navigate({ to: "/vehicule" });
      }
      setRouting(false);
    })();
    return () => { cancelled = true; };
  }, [user, loading, pathname, router]);

  if (loading || routing) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm">Chargement…</div>
      </div>
    );
  }
  if (!user && !PUBLIC_PATHS.has(pathname)) return null;
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <Outlet />
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
