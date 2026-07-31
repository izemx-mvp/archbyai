import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CreditCard, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/page-parts";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/lib/billing-store";
import { formatMAD, inscriptionsSeries, revenusSeries } from "@/lib/billing-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Back-office admin — ArchbyAI" },
      { name: "description", content: "Pilotage du MRR, des abonnés actifs, des inscriptions et du churn ArchbyAI." },
      { property: "og:title", content: "Back-office admin — ArchbyAI" },
      { property: "og:description", content: "Indicateurs de revenus, abonnements et paiements ArchbyAI." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { state } = useBilling();
  const actifs = state.abonnements.filter((a) => a.statut === "actif");
  const mrr = actifs.reduce((t, a) => t + (a.periodicite === "annuel" ? a.montant / 12 : a.montant), 0);
  const churn = state.abonnements.filter((a) => a.statut === "annule" || a.statut === "expire").length;
  const echecs = state.transactions.filter((t) => t.statut === "echoue").length;

  const kpis = [
    { label: "MRR", valeur: formatMAD(Math.round(mrr)), delta: "+9,2 %", positif: true, icon: TrendingUp },
    { label: "Abonnés actifs", valeur: String(actifs.length), delta: "+3 ce mois", positif: true, icon: Users },
    { label: "Inscriptions (7 j)", valeur: "14", delta: "+16 %", positif: true, icon: UserPlus },
    { label: "Clients churnés", valeur: String(churn), delta: `${((churn / state.abonnements.length) * 100).toFixed(1)} % de churn`, positif: false, icon: TrendingDown },
  ];

  return (
    <>
      <PageHeader
        titre="Vue d'ensemble"
        description="Revenus, abonnements et santé de la base clients ArchbyAI."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/paiements">
              Voir les paiements <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <article
            key={k.label}
            style={{ animationDelay: `${i * 70}ms` }}
            className="hover-lift animate-rise relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <k.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight">{k.valeur}</p>
            <p className={`mt-3 text-xs font-semibold ${k.positif ? "text-success" : "text-destructive"}`}>{k.delta}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="animate-rise rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold">Tendance des revenus</h2>
              <p className="text-xs text-muted-foreground">Encaissements et MRR sur 6 mois.</p>
            </div>
            <StatusPill tone="success" dot={false}>+9,2 % MoM</StatusPill>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenusSeries}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mois" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} width={48} className="text-xs" />
                <RTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }}
                  formatter={(v: number) => formatMAD(v)}
                />
                <Area type="monotone" dataKey="revenus" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="mrr" stroke="var(--color-chart-2)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="animate-rise rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold">Inscriptions hebdomadaires</h2>
            <p className="text-xs text-muted-foreground">Nouveaux comptes vs résiliations.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inscriptionsSeries}>
                <XAxis dataKey="semaine" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} width={28} className="text-xs" />
                <RTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }}
                />
                <Bar dataKey="inscriptions" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="churn" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="animate-rise rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{echecs} paiement{echecs > 1 ? "s" : ""} en échec</p>
              <p className="text-xs text-muted-foreground">Relancez les prélèvements pour éviter la suspension des comptes.</p>
            </div>
          </div>
          <Button variant="hero" asChild>
            <Link to="/admin/paiements">Traiter les échecs</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
