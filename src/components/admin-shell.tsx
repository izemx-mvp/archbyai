import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  Cpu,
  History,
  LayoutDashboard,
  Menu,
  Moon,
  Plug,
  Receipt,
  Sun,
  Users,
  UserCog,
} from "lucide-react";

import { AuroraBackground } from "@/components/aurora-background";
import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type Lien = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

/** Navigation du back-office : gestion du SaaS uniquement. */
export const adminNavigation: { titre: string; liens: Lien[] }[] = [
  {
    titre: "Pilotage",
    liens: [{ to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true }],
  },
  {
    titre: "Facturation",
    liens: [
      { to: "/admin/abonnements", label: "Abonnements SaaS", icon: Receipt },
      { to: "/admin/paiements", label: "Paiements", icon: CreditCard },
    ],
  },
  {
    titre: "Clients & comptes",
    liens: [
      { to: "/admin/utilisateurs", label: "Clients", icon: UserCog },
      { to: "/utilisateurs", label: "Comptes plateforme", icon: Users },
    ],
  },
  {
    titre: "Plateforme",
    liens: [
      { to: "/abonnements", label: "Abonnements API", icon: Plug },
      { to: "/services", label: "Services", icon: Cpu },
      { to: "/historique", label: "Historique", icon: History },
    ],
  },
];

function estActif(pathname: string, l: Lien) {
  return l.exact ? pathname === l.to : pathname === l.to || pathname.startsWith(`${l.to}/`);
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto p-3">
      {adminNavigation.map((groupe) => (
        <div key={groupe.titre} className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {groupe.titre}
          </p>
          {groupe.liens.map((l) => {
            const active = estActif(pathname, l);
            return (
              <Link
                key={l.to}
                to={l.to}
                preload="intent"
                onClick={onNavigate}
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
        </div>
      ))}
    </nav>
  );
}

function AdminThemeToggle() {
  const { toggleTheme } = useTheme();
  const [dark, setDark] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Basculer le thème clair / sombre"
      onClick={() => {
        toggleTheme();
        setDark(document.documentElement.classList.contains("dark"));
      }}
    >
      {dark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </Button>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center px-4">
        <BrandLogo className="h-10" />
      </div>
      <div className="px-4 pb-3">
        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary">
          Back-office · Gestion SaaS
        </span>
      </div>
      <AdminNav onNavigate={onNavigate} />
      <div className="flex items-center gap-1 border-t border-border p-3">
        <Button variant="ghost" size="sm" className="flex-1 justify-start" asChild>
          <Link to="/" onClick={onNavigate}>
            <ArrowLeft className="h-4 w-4" /> Front-office client
          </Link>
        </Button>
        <AdminThemeToggle />
      </div>
    </>
  );
}

/** Coque du back-office : sidebar dense, orientée données. */
export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <AuroraBackground intensity="subtle" />
      <div className="relative flex min-h-svh">
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-card/70 backdrop-blur-xl md:flex">
          <SidebarInner />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/70 px-3 py-2 backdrop-blur-xl md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ouvrir la navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[280px] flex-col p-0">
                <SheetTitle className="sr-only">Navigation back-office</SheetTitle>
                <SidebarInner onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <BrandLogo className="h-8" />
          </div>

          <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
