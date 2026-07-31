import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Boxes,
  Building2,
  CheckCircle2,
  Cpu,
  LayoutGrid,
  Layers,
  Palette,
  Receipt,
  Sparkles,
  Upload,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-parts";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { compteCourant, formatMAD, planParId } from "@/lib/billing-data";
import { useBilling } from "@/lib/billing-store";
import { repartitionTypes } from "@/lib/mock-data";
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Espace client — ArchbyAI" },
      {
        name: "description",
        content:
          "Votre espace ArchbyAI : générez vos plans 2D et 3D par IA, suivez vos simulations et pilotez votre abonnement.",
      },
      { property: "og:title", content: "Espace client — ArchbyAI" },
      {
        property: "og:description",
        content: "Générez vos plans d'architecture par IA, suivez vos simulations et votre abonnement ArchbyAI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EspaceClient,
});

const raccourcis = [
  {
    to: "/nouvelle-simulation" as const,
    titre: "Créer un design par IA",
    detail: "Décrivez votre projet, l'IA génère le plan 2D et le modèle 3D.",
    icon: Sparkles,
  },
  {
    to: "/simulations" as const,
    titre: "Mes simulations",
    detail: "Retrouvez, comparez et partagez vos plans générés.",
    icon: Building2,
  },
  {
    to: "/tarifs" as const,
    titre: "Faire évoluer mon plan",
    detail: "Plus de simulations, export DWG/IFC et rendu 3D avancé.",
    icon: Receipt,
  },
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

function KpiCard({
  kpi,
  ready,
  index,
}: {
  kpi: { label: string; value: number; suffix?: string; hint: string; icon: typeof Layers };
  ready: boolean;
  index: number;
}) {
  const value = useCountUp(kpi.value, ready);
  return (
    <article
      className="hover-lift animate-rise group relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm"
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
      <p className="mt-3 text-xs text-muted-foreground">{kpi.hint}</p>
    </article>
  );
}

const statutSimulation = {
  validee: { label: "Validée", tone: "success" as const },
  generee: { label: "Générée", tone: "info" as const },
  en_cours: { label: "En cours", tone: "warning" as const },
  rejetee: { label: "Rejetée", tone: "danger" as const },
};

function EspaceClient() {
  const { state, ready: dataReady } = useData();
  const { state: billing } = useBilling();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!dataReady) return;
    const id = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(id);
  }, [dataReady]);

  const abonnement = billing.abonnements.find((a) => a.id === compteCourant.abonnementId);
  const plan = abonnement ? planParId(abonnement.plan) : undefined;
  const simulations = state.simulations;
  const dernieres = simulations.slice(0, 5);
  const validees = simulations.filter((s) => s.statut === "validee").length;
  const enCours = simulations.filter((s) => s.statut === "en_cours").length;
  const surfaceTotale = simulations.reduce((acc, s) => acc + s.superficie, 0);

  const kpis = [
    { label: "Designs générés", value: simulations.length, hint: "Depuis la création de votre compte", icon: Layers },
    { label: "Plans validés", value: validees, hint: "Prêts à l'export DWG / IFC", icon: CheckCircle2 },
    { label: "Générations en cours", value: enCours, hint: "Traitées par le moteur IA", icon: Cpu },
    { label: "Surface étudiée", value: surfaceTotale, suffix: " m²", hint: "Cumul de vos projets", icon: Boxes },
  ];

  const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];
  const consomme = 92;
  const quota = 150;

  return (
    <AppShell intensity="normal">
      <PageHeader
        titre="Bienvenue sur votre espace ArchbyAI"
        description="Générez vos plans 2D et vos maquettes 3D par intelligence artificielle, puis pilotez votre abonnement."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("Import du plan topographique disponible dans l'assistant de création.")}
            >
              <Upload className="h-4 w-4" /> Importer un plan
            </Button>
            <Button variant="hero" asChild>
              <Link to="/nouvelle-simulation">
                <Sparkles className="h-4 w-4" /> Créer un design IA
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {raccourcis.map((r, i) => (
          <Link
            key={r.to}
            to={r.to}
            preload="intent"
            style={{ animationDelay: `${i * 60}ms` }}
            className="hud-frame hover-lift animate-rise group relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <h2 className="mt-4 text-base font-bold">{r.titre}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} kpi={kpi} ready={ready} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">Mes dernières simulations</h2>
              <p className="text-sm text-muted-foreground">Plans 2D & modèles 3D générés récemment</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/simulations">Tout voir</Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {dernieres.map((s) => (
              <li key={s.id}>
                <Link
                  to="/plan/$reference"
                  params={{ reference: s.reference }}
                  preload="intent"
                  className="hover-lift flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-accent/40"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <LayoutGrid className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.reference}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.type} · {s.ville} · {s.superficie} m² · {s.etages} niveau(x)
                    </p>
                  </div>
                  <StatusPill tone={statutSimulation[s.statut].tone}>{statutSimulation[s.statut].label}</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mon abonnement</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight">Plan {plan?.nom ?? "—"}</h2>
              </div>
              <StatusPill tone="success">Actif</StatusPill>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {abonnement ? `${formatMAD(abonnement.montant)} · renouvellement le ${abonnement.renouvellement}` : "—"}
            </p>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Simulations ce cycle</span>
                <span>
                  {consomme} / {quota}
                </span>
              </div>
              <Progress value={Math.round((consomme / quota) * 100)} className="mt-2 h-2" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="hero" size="sm" asChild>
                <Link to="/mon-abonnement">Gérer mon abonnement</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/tarifs">Voir les plans</Link>
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">Répartition de mes projets</h2>
            </div>
            {ready ? (
              <>
                <div className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={repartitionTypes}
                        dataKey="value"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        stroke="none"
                      >
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
                <ul className="mt-1 space-y-2">
                  {repartitionTypes.map((t, i) => (
                    <li key={t.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full")} style={{ background: chartColors[i] }} />
                        {t.name}
                      </span>
                      <span className="font-semibold">{t.value} %</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Skeleton className="mt-4 h-[220px] w-full rounded-xl" />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
