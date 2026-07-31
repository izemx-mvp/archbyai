import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, LayoutDashboard, Receipt, Users } from "lucide-react";

import { AuroraBackground } from "@/components/aurora-background";
import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const liens = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/admin/abonnements", label: "Abonnements", icon: Receipt },
  { to: "/admin/paiements", label: "Paiements", icon: CreditCard },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <AuroraBackground intensity="soft" />
      <div className="relative flex min-h-svh">
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-card/70 backdrop-blur-xl md:flex">
          <div className="flex h-16 items-center px-4">
            <BrandLogo className="h-10" />
          </div>
          <div className="px-4 pb-3">
            <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary">
              Back-office admin
            </span>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {liens.map((l) => {
              const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  preload="intent"
                  className={cn(
                    "sheen group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                    active
                      ? "neon bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <l.icon className="h-4 w-4 shrink-0" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-3">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Retour à l'application
              </Link>
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b border-border bg-card/70 px-3 py-2 backdrop-blur-xl md:hidden">
            {liens.map((l) => {
              const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <l.icon className="h-3.5 w-3.5" /> {l.label}
                </Link>
              );
            })}
          </div>
          <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
