import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CheckCheck,
  Command,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Search,
  ShieldCheck,
  Settings,
  Sparkles,
  Sun,
  UserCog,
} from "lucide-react";

import { AuroraBackground } from "@/components/aurora-background";
import { PointerFx } from "@/components/pointer-fx";
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

const navigation = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  { to: "/nouvelle-simulation", label: "Créer un design IA", icon: Sparkles },
  { to: "/simulations", label: "Mes simulations", icon: Building2 },
  { to: "/tarifs", label: "Tarifs", icon: CreditCard },
  { to: "/mon-abonnement", label: "Mon abonnement", icon: Receipt },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function useCurrentNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return navigation.find((n) => n.to === pathname) ?? navigation[0];
}

/** Barre de navigation horizontale « command deck » avec indicateur glissant. */
function CommandDeck() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    const place = () => {
      const el = itemRefs.current[pathname];
      const list = listRef.current;
      if (!el || !list) {
        setIndicator((i) => ({ ...i, ready: false }));
        return;
      }
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    place();
    window.addEventListener("resize", place);
    const t = window.setTimeout(place, 220);
    return () => {
      window.removeEventListener("resize", place);
      window.clearTimeout(t);
    };
  }, [pathname]);

  return (
    <div
      ref={listRef}
      className="hud-glass relative flex items-center gap-0.5 overflow-x-auto rounded-full p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <span
        aria-hidden
        className="neon pointer-events-none absolute bottom-1 top-1 rounded-full bg-primary transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.34,1.35,0.64,1)]"
        style={{ left: indicator.left, width: indicator.width, opacity: indicator.ready ? 1 : 0 }}
      />
      {navigation.map((item) => {
        const active = pathname === item.to;
        const link = (
          <Link
            key={item.to}
            to={item.to}
            preload="intent"
            ref={(el) => {
              itemRefs.current[item.to] = el;
            }}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "sheen group relative z-10 flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[13px] font-semibold",
              "transition-[color,transform,padding] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] hover:-translate-y-0.5",
              active ? "px-4 text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "h-[17px] w-[17px] shrink-0 transition-transform duration-300 group-hover:scale-110",
                active && "drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]",
              )}
            />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-400 ease-[cubic-bezier(0.34,1.3,0.64,1)]",
                active ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0",
              )}
            >
              {item.label}
            </span>
          </Link>
        );

        return active ? (
          link
        ) : (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent sideOffset={10}>{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** Menu plein écran (mobile / tablette) : grille de tuiles HUD. */
function MobileNavGrid({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <BrandLogo className="h-11" />
      </div>
      <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4">
        {navigation.map((item, i) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              style={{ animationDelay: `${i * 35}ms` }}
              className={cn(
                "hud-frame animate-pop flex aspect-square flex-col justify-end gap-2 rounded-2xl border p-4 text-left",
                "transition-all duration-300 hover:-translate-y-1",
                active ? "neon border-primary/50 bg-primary/10" : "border-border bg-card/70 backdrop-blur-xl",
              )}
            >
              <item.icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Dock flottant façon HUD : accès instantané aux actions clés. */
function QuickDock() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { toggleTheme } = useTheme();

  const actions = [
    { label: "Tableau de bord", icon: LayoutDashboard, run: () => navigate({ to: "/" }), to: "/" },
    { label: "Simulations", icon: Building2, run: () => navigate({ to: "/simulations" }), to: "/simulations" },
    {
      label: "Nouvelle simulation",
      icon: Sparkles,
      run: () => navigate({ to: "/nouvelle-simulation" }),
      to: "/nouvelle-simulation",
    },
    {
      label: "Recherche",
      icon: Search,
      run: () => document.getElementById("recherche-globale")?.querySelector("input")?.focus(),
    },
    { label: "Thème", icon: Moon, run: toggleTheme },
  ] as const;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:hidden">
      <div className="hud-glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
        {actions.map((a) => {
          const active = "to" in a && a.to === pathname;
          return (
            <button
              key={a.label}
              onClick={a.run}
              aria-label={a.label}
              className={cn(
                "sheen grid h-11 w-11 place-items-center rounded-full transition-all duration-300",
                "hover:-translate-y-1.5 hover:scale-110 active:scale-95",
                active ? "neon bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <a.icon className="h-[18px] w-[18px]" />
            </button>
          );
        })}
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
      ...state.simulations.map((s) => ({ id: s.id, label: s.reference, meta: `${s.type} · ${s.ville}`, to: "/simulations" as const })),
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
        placeholder="Rechercher une simulation, une référence…"
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
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <PointerFx />
      <div className="tech-grid pointer-events-none fixed inset-0 -z-10 opacity-[0.35]" aria-hidden />

      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
          <div className="hud-glass mx-auto flex w-full max-w-[1600px] items-center gap-3 rounded-2xl px-3 py-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ouvrir le menu" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] border-sidebar-border bg-sidebar/95 p-0 backdrop-blur-2xl">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <MobileNavGrid onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link to="/" aria-label="ArchbyAI" className="shrink-0 rounded-xl">
              <BrandLogo className="h-11" />
            </Link>

            <div className="mx-1 hidden h-8 w-px bg-border lg:block" />

            <div className="hidden min-w-0 lg:block">
              <CommandDeck />
            </div>


            <div className="ml-auto flex shrink-0 items-center gap-1">
              <div className="hidden w-56 xl:block 2xl:w-72">
                <GlobalSearch id="recherche-globale" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Recherche globale"
                    className="xl:hidden"
                    onClick={() =>
                      document.getElementById("recherche-globale-mobile")?.querySelector("input")?.focus()
                    }
                  >
                    <Command className="h-[18px] w-[18px]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Recherche · ⌘K</TooltipContent>
              </Tooltip>
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
                  <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Back-office (admin)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onSelect={() => navigate({ to: "/connexion" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mx-auto mt-2 max-w-[1600px] xl:hidden">
            <GlobalSearch id="recherche-globale-mobile" />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-5 pt-4 text-sm sm:px-7">
          <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
            Espace client
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="truncate font-semibold">{current.label}</span>
        </div>

        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-5 pb-28 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      <QuickDock />
    </TooltipProvider>
  );
}
