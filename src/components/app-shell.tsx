import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
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
import { activites } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/abonnements", label: "Abonnements API", icon: Plug },
  { to: "/services", label: "Services", icon: Cpu },
  { to: "/historique", label: "Historique", icon: History },
  { to: "/simulations", label: "Simulations", icon: Building2 },
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
    <nav className="flex flex-col gap-1 px-3">
      {navigation.map((item) => {
        const active = pathname === item.to;
        const link = (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300",
                active ? "opacity-100" : "scale-y-0 opacity-0",
              )}
            />
            <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );

        return collapsed ? (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
}

function SidebarInner({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center px-5", collapsed && "justify-center px-0")}>
        <Link to="/" aria-label="ArchbyAI" onClick={onNavigate}>
          {collapsed ? <BrandMark /> : <BrandLogo className="h-8" />}
        </Link>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto pb-4">
        {!collapsed && (
          <p className="px-6 pb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Pilotage
          </p>
        )}
        <NavList collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/60",
            collapsed && "justify-center",
          )}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/25">
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">MT</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Mohamed Toufella</p>
              <p className="truncate text-xs text-muted-foreground">Administrateur</p>
            </div>
          )}
        </div>
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
      <Sun className={cn("h-[18px] w-[18px] transition-all duration-300", dark ? "scale-0 -rotate-90" : "scale-100 rotate-0")} />
      <Moon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          dark ? "scale-100 rotate-0" : "scale-0 rotate-90",
        )}
      />
    </Button>
  );
}

function NotificationsMenu() {
  const toneMap = { success: "success", warning: "warning", error: "danger", info: "info" } as const;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] rounded-2xl p-0 shadow-elevated">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-bold">Notifications</p>
          <StatusPill tone="brand" dot={false}>
            {activites.length} nouvelles
          </StatusPill>
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {activites.map((a) => (
            <li key={a.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", {
                "bg-success": a.type === "success",
                "bg-warning": a.type === "warning",
                "bg-destructive": a.type === "error",
                "bg-info": a.type === "info",
              })}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{a.titre}</p>
                <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.temps}</p>
              </div>
              <StatusPill tone={toneMap[a.type]} className="ml-auto self-center" dot={false}>
                •
              </StatusPill>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
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
  const [query, setQuery] = useState("");
  const current = useCurrentNav();
  const navigate = useNavigate();

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

  return (
    <TooltipProvider delayDuration={150}>
      <AuroraBackground intensity={intensity} />
      <div className="flex min-h-screen w-full">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300 ease-out lg:block",
            collapsed ? "w-[76px]" : "w-[264px]",
          )}
        >
          <SidebarInner collapsed={collapsed} />
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            onClick={() => setCollapsed((c) => !c)}
            className="absolute -right-4 top-20 h-8 w-8 rounded-full"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
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
                <span className="text-muted-foreground">Back-office</span>
                <span className="text-muted-foreground/50">/</span>
                <span className="truncate font-semibold">{current.label}</span>
              </div>

              <div id="recherche-globale" className="ml-auto hidden w-full max-w-sm md:block">
                <SearchField value={query} onChange={setQuery} placeholder="Rechercher une API, un service…" />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
                <ThemeToggle />
                <NotificationsMenu />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Menu utilisateur"
                      className="ml-1 rounded-full ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
