import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CheckCheck,
  ChevronLeft,
  Cpu,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelsTopLeft,
  Plug,
  Settings,
  Sun,
  Users,
  UserCog,
  Sparkles,
} from "lucide-react";

import { AuroraBackground } from "@/components/aurora-background";
import { BrandLogo, BrandMark } from "@/components/brand";
import { SearchField } from "@/components/search-field";
import { StatusPill } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "archbyai-sidebar-collapsed";

const navigation = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/abonnements", label: "Abonnements API", icon: Plug },
  { to: "/services", label: "Services", icon: Cpu },
  { to: "/historique", label: "Historique", icon: History },
  { to: "/simulations", label: "Simulations", icon: Building2 },
  { to: "/nouvelle-simulation", label: "Nouvelle simulation", icon: Sparkles },
  { to: "/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function useCurrentNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return navigation.find((n) => n.to === pathname) ?? navigation[0];
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className={cn("flex flex-col gap-1", collapsed ? "px-3" : "px-3")}>
      {navigation.map((item) => {
        const active = pathname === item.to;
        const link = (
          <Link
            to={item.to}
            onClick={onNavigate}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-11 items-center rounded-xl text-sm font-medium",
              "transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]",
              collapsed ? "w-11 justify-center px-0" : "w-full gap-3 px-3",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-300",
                collapsed ? "-left-2" : "left-0",
                active ? "opacity-100" : "scale-y-0 opacity-0",
              )}
            />
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110",
                active && "text-primary",
              )}
            />
            <span
              className={cn(
                "min-w-0 truncate transition-opacity duration-200",
                collapsed && "pointer-events-none hidden",
              )}
            >
              {item.label}
            </span>
          </Link>
        );

        return collapsed ? (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          <div key={item.to}>{link}</div>
        );
      })}
    </nav>
  );
}

function SidebarInner({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center px-0" : "px-4")}>
        <Link to="/" aria-label="ArchbyAI" onClick={onNavigate} className="rounded-xl">
          {collapsed ? <BrandMark /> : <BrandLogo />}
        </Link>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {!collapsed && (
          <p className="px-6 pb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Pilotage
          </p>
        )}
        <NavList collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-3")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Mon profil — Mohamed Toufella"
                onClick={() => {
                  onNavigate?.();
                  navigate({ to: "/parametres" });
                }}
                className="mx-auto grid h-11 w-11 place-items-center rounded-xl transition-colors hover:bg-sidebar-accent/60"
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/25">
                  <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">MT</AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Mohamed Toufella — Administrateur</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => {
              onNavigate?.();
              navigate({ to: "/parametres" });
            }}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-sidebar-accent/60"
          >
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/25">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">MT</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Mohamed Toufella</p>
              <p className="truncate text-xs text-muted-foreground">Administrateur</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { toggleTheme } = useTheme();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Basculer le thème clair / sombre"
      onClick={() => {
        toggleTheme();
        setDark(document.documentElement.classList.contains("dark"));
      }}
      className="relative"
    >
      <Sun className={cn("h-[18px] w-[18px] transition-all duration-500", dark ? "scale-0 -rotate-90" : "scale-100 rotate-0")} />
      <Moon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-500",
          dark ? "scale-100 rotate-0" : "scale-0 rotate-90",
        )}
      />
    </Button>
  );
}

function NotificationsMenu() {
  const { state, marquerLues, marquerLue } = useData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const notifications = state.notifications;
  const nonLues = notifications.filter((n) => !n.lue).length;
  const toneMap = { success: "success", warning: "warning", error: "danger", info: "info" } as const;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && nonLues > 0) window.setTimeout(marquerLues, 900);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications (${nonLues} non lues)`} className="relative">
          <Bell className="h-[18px] w-[18px]" />
          {nonLues > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-brand-foreground ring-2 ring-background">
              {nonLues}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] rounded-2xl p-0 shadow-elevated">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-sm font-bold">Notifications</p>
          {nonLues > 0 ? (
            <Button variant="ghost" size="sm" onClick={marquerLues}>
              <CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
            </Button>
          ) : (
            <StatusPill tone="success" dot={false}>
              À jour
            </StatusPill>
          )}
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {notifications.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune notification.</li>
          )}
          {notifications.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => {
                  marquerLue(a.id);
                  setOpen(false);
                  navigate({ to: a.to });
                }}
                className={cn(
                  "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
                  !a.lue && "bg-primary/5",
                )}
              >
                <span
                  className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", {
                    "bg-success": a.type === "success",
                    "bg-warning": a.type === "warning",
                    "bg-destructive": a.type === "error",
                    "bg-info": a.type === "info",
                  })}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", a.lue ? "font-medium" : "font-bold")}>{a.titre}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.temps}</p>
                </div>
                <StatusPill tone={toneMap[a.type]} className="self-center" dot={false}>
                  •
                </StatusPill>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Recherche globale : interroge réellement les données de la plateforme. */
function GlobalSearch({ id }: { id?: string }) {
  const { state } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const index = useMemo(
    () => [
      ...state.apis.map((a) => ({ id: a.id, label: a.nom, meta: `${a.client} · ${a.plan}`, to: "/abonnements" as const })),
      ...state.services.map((s) => ({ id: s.id, label: s.nom, meta: s.region, to: "/services" as const })),
      ...state.simulations.map((s) => ({ id: s.id, label: s.reference, meta: `${s.type} · ${s.ville}`, to: "/simulations" as const })),
      ...state.utilisateurs.map((u) => ({ id: u.id, label: u.nom, meta: u.email, to: "/utilisateurs" as const })),
    ],
    [state],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.filter((i) => `${i.label} ${i.meta} ${i.id}`.toLowerCase().includes(q)).slice(0, 6);
  }, [query, index]);

  return (
    <div id={id} className="relative w-full">
      <SearchField
        value={query}
        onChange={(v) => {
          setQuery(v);
          setOpen(true);
        }}
        placeholder="Rechercher une API, un service, une simulation…"
      />
      {open && query.trim().length > 0 && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setOpen(false)} tabIndex={-1} />
          <div className="animate-pop absolute left-0 right-0 top-13 z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-elevated">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun résultat pour « {query} ».</p>
            ) : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {results.map((r) => (
                  <li key={`${r.to}-${r.id}`}>
                    <button
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        navigate({ to: r.to });
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{r.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.meta}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{r.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({
  children,
  intensity = "subtle",
}: {
  children: ReactNode;
  intensity?: "subtle" | "normal";
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = useCurrentNav();
  const navigate = useNavigate();

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("recherche-globale")?.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });

  return (
    <TooltipProvider delayDuration={150}>
      <AuroraBackground intensity={intensity} />
      <div className="flex min-h-screen w-full">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 overflow-visible border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:block",
            "transition-[width] duration-400 ease-[cubic-bezier(0.34,1.2,0.64,1)]",
            collapsed ? "w-[76px]" : "w-[264px]",
          )}
        >
          <SidebarInner collapsed={collapsed} />
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            onClick={toggleCollapsed}
            className="absolute -right-4 top-20 z-40 h-8 w-8 rounded-full"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-400", collapsed && "rotate-180")} />
          </Button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ouvrir le menu" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SidebarInner collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
                <PanelsTopLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
                  Back-office
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <span className="truncate font-semibold">{current.label}</span>
              </div>

              <div className="ml-auto hidden w-full max-w-sm md:block">
                <GlobalSearch id="recherche-globale" />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
                <ThemeToggle />
                <NotificationsMenu />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Menu utilisateur"
                      className="ml-1 rounded-full ring-offset-background transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Avatar className="h-9 w-9 ring-2 ring-primary/25">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">MT</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-elevated">
                    <DropdownMenuLabel>
                      <p className="text-sm font-semibold">Mohamed Toufella</p>
                      <p className="text-xs font-normal text-muted-foreground">Administrateur</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate({ to: "/parametres" })}>
                      <UserCog className="mr-2 h-4 w-4" /> Mon profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate({ to: "/parametres" })}>
                      <Settings className="mr-2 h-4 w-4" /> Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onSelect={() => navigate({ to: "/connexion" })}>
                      <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="border-t border-border/60 px-4 pb-3 pt-2 md:hidden">
              <GlobalSearch />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
