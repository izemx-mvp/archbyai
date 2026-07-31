import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-parts";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/lib/billing-store";
import { compteCourant, formatMAD, plans, type PlanId, type Periodicite } from "@/lib/billing-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs & plans — ArchbyAI" },
      {
        name: "description",
        content:
          "Comparez les plans Découverte, Pro et Entreprise d'ArchbyAI : simulations 2D/3D, export DWG et conformité aux normes marocaines.",
      },
      { property: "og:title", content: "Tarifs & plans — ArchbyAI" },
      { property: "og:description", content: "Comparez les plans ArchbyAI et changez d'offre en quelques secondes." },
    ],
  }),
  component: TarifsPage,
});

function TarifsPage() {
  const [periodicite, setPeriodicite] = useState<Periodicite>("mensuel");
  const { state, changerPlan } = useBilling();
  const navigate = useNavigate();

  const abonnement = state.abonnements.find((a) => a.id === compteCourant.abonnementId);
  const planActuel = abonnement?.plan;
  const ordre: PlanId[] = ["decouverte", "pro", "entreprise"];

  const souscrire = (id: PlanId) => {
    const plan = plans.find((p) => p.id === id)!;
    const montant = periodicite === "mensuel" ? plan.prixMensuel : plan.prixAnnuel;
    if (!abonnement) return;
    changerPlan(abonnement.id, id, periodicite, montant);
    toast.success(`Plan ${plan.nom} activé (${periodicite}).`, {
      description: `Prochain prélèvement : ${formatMAD(montant)}.`,
    });
    navigate({ to: "/mon-abonnement" });
  };

  return (
    <AppShell intensity="normal">
      <PageHeader
        titre="Tarifs & plans"
        description="Choisissez l'offre adaptée à votre volume de simulations. Changement possible à tout moment."
        actions={
          <div className="hud-glass flex items-center gap-1 rounded-full p-1">
            {(["mensuel", "annuel"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodicite(p)}
                className={cn(
                  "sheen rounded-full px-4 py-2 text-xs font-bold capitalize transition-all duration-300",
                  periodicite === p ? "neon bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "annuel" ? "Annuel · –2 mois" : "Mensuel"}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan, i) => {
          const prix = periodicite === "mensuel" ? plan.prixMensuel : plan.prixAnnuel;
          const actuel = plan.id === planActuel;
          const superieur = ordre.indexOf(plan.id) > ordre.indexOf(planActuel ?? "decouverte");
          return (
            <article
              key={plan.id}
              style={{ animationDelay: `${i * 80}ms` }}
              className={cn(
                "hover-lift animate-rise relative flex flex-col overflow-hidden rounded-2xl border bg-card/85 p-6 shadow-soft backdrop-blur-sm",
                plan.populaire ? "border-primary/50 neon" : "border-border",
              )}
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">{plan.nom}</h2>
                {plan.populaire && (
                  <StatusPill tone="brand" dot={false}>
                    <Sparkles className="h-3 w-3" /> Populaire
                  </StatusPill>
                )}
                {actuel && <StatusPill tone="success">Plan actuel</StatusPill>}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{plan.accroche}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight">{formatMAD(prix)}</span>
                <span className="text-sm text-muted-foreground">
                  / {periodicite === "mensuel" ? "mois" : "an"} HT
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-primary">{plan.simulations}</p>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {plan.fonctionnalites.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={actuel ? "outline" : plan.populaire ? "hero" : "default"}
                disabled={actuel}
                onClick={() => souscrire(plan.id)}
              >
                {actuel ? "Votre plan actuel" : superieur ? "Passer à ce plan" : "Rétrograder vers ce plan"}
              </Button>
            </article>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-soft backdrop-blur-sm">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-bold">Comparatif détaillé</h2>
          <p className="text-xs text-muted-foreground">Toutes les fonctionnalités incluses dans chaque offre.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-muted/70">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fonctionnalité
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {p.nom}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(plans.flatMap((p) => p.fonctionnalites))).map((f, i) => (
                <tr key={f} className={cn("border-t border-border", i % 2 === 1 && "bg-muted/25")}>
                  <td className="px-4 py-3 font-medium">{f}</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      {p.fonctionnalites.includes(f) ? (
                        <Check className="mx-auto h-4 w-4 text-success" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
