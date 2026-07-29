import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  CheckCircle2,
  Cpu,
  Plug,
  Plus,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-parts";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { activites, apis, repartitionTypes, services, trafficSeries } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — ArchbyAI Back-office" },
      {
        name: "description",
        content:
          "Vue d'ensemble ArchbyAI : trafic des API, état des services, simulations de plans et activité récente.",
      },
      { property: "og:title", content: "Tableau de bord — ArchbyAI Back-office" },
      {
        property: "og:description",
        content: "Vue d'ensemble ArchbyAI : trafic des API, état des services et simulations de plans.",
      },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Appels API (7 j)", value: 33010, suffix: "", delta: "+12,4 %", icon: Zap, tone: "brand" as const },
  { label: "Simulations générées", value: 2563, suffix: "", delta: "+8,1 %", icon: Building2, tone: "info" as const },
  { label: "Abonnements actifs", value: 4, suffix: " / 7", delta: "stable", icon: Plug, tone: "success" as const },
  { label: "Disponibilité moyenne", value: 99, suffix: ",6 %", delta: "+0,3 pt", icon: Activity, tone: "success" as const },
];

function useCountUp(target: number, ready: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const total = 40;
    const id = window.setInterval(() => {
      frame += 1;
      setValue(Math.round(target * (1 - Math.pow(1 - frame / total, 3))));
      if (frame >= total) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [target, ready]);
  return value;
}

function KpiCard({ kpi, ready, index }: { kpi: (typeof kpis)[number]; ready: boolean; index: number }) {
  const value = useCountUp(kpi.value, ready);
  return (
    <article
      className="hover-lift group relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm animate-rise"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <kpi.icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-0.5 text-3xl font-extrabold tracking-tight">
        {ready ? value.toLocaleString("fr-FR") : <Skeleton className="h-9 w-24" />}
        <span className="text-xl">{kpi.suffix}</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success">
        <TrendingUp className="h-3.5 w-3.5" /> {kpi.delta}
        <span className="font-normal text-muted-foreground">vs semaine précédente</span>
      </div>
    </article>
  );
}

function Dashboard() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

  return (
    <AppShell intensity="normal">
      <PageHeader
        titre="Tableau de bord"
        description="Supervision en temps réel de la plateforme de génération de plans d'architecture."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("Import du plan topographique disponible dans Simulations.")}>
              <Upload className="h-4 w-4" /> Importer un plan
            </Button>
            <Button variant="hero" onClick={() => toast.success("Nouvelle simulation initialisée.")}>
              <Plus className="h-4 w-4" /> Nouvelle simulation
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} kpi={kpi} ready={ready} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">Trafic API & simulations</h2>
              <p className="text-sm text-muted-foreground">7 derniers jours</p>
            </div>
            <StatusPill tone="success">Temps réel</StatusPill>
          </div>
          {ready ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficSeries} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gAppels" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="jour" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 14,
                      color: "var(--color-popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="appels" name="Appels API" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#gAppels)" />
                  <Area type="monotone" dataKey="simulations" name="Simulations" stroke="var(--color-chart-3)" strokeWidth={2.5} fill="url(#gSim)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
          <h2 className="text-lg font-bold">Répartition des logements</h2>
          <p className="text-sm text-muted-foreground">Par type de simulation</p>
          {ready ? (
            <>
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={repartitionTypes} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4} stroke="none">
                      {repartitionTypes.map((_, i) => (
                        <Cell key={i} fill={chartColors[i]} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 14,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-2">
                {repartitionTypes.map((t, i) => (
                  <li key={t.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: chartColors[i] }} />
                      {t.name}
                    </span>
                    <span className="font-semibold">{t.value} %</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Skeleton className="mt-4 h-[260px] w-full rounded-xl" />
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm xl:col-span-2">
          <h2 className="text-lg font-bold">Consommation des quotas</h2>
          <p className="mb-4 text-sm text-muted-foreground">Principaux abonnements API</p>
          <ul className="space-y-4">
            {apis.slice(0, 4).map((api) => {
              const pct = Math.round((api.consomme / api.quota) * 100);
              return (
                <li key={api.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold">{api.nom}</span>
                    <span className={cn("shrink-0 font-semibold", pct >= 90 ? "text-destructive" : "text-muted-foreground")}>
                      {api.consomme.toLocaleString("fr-FR")} / {api.quota.toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
          <h2 className="text-lg font-bold">Activité récente</h2>
          <ul className="mt-4 space-y-4">
            {activites.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span
                  className={cn("mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg", {
                    "bg-success/12 text-success": a.type === "success",
                    "bg-warning/15 text-warning": a.type === "warning",
                    "bg-destructive/12 text-destructive": a.type === "error",
                    "bg-info/12 text-info": a.type === "info",
                  })}
                >
                  {a.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.titre}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                  <p className="text-[11px] text-muted-foreground">{a.temps}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
        <h2 className="text-lg font-bold">État des services</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="hover-lift rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate font-semibold">{s.nom}</p>
                <StatusPill tone={s.statut === "en_cours" ? "success" : s.statut === "degrade" ? "warning" : "danger"}>
                  {s.statut === "en_cours" ? "En cours" : s.statut === "degrade" ? "Dégradé" : "Arrêté"}
                </StatusPill>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{s.region}</p>
              <p className="mt-3 text-sm font-semibold">{s.uptime} % de disponibilité</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
