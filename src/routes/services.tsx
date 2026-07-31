import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Power, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useData } from "@/lib/store";
import type { ServiceItem } from "@/lib/mock-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — ArchbyAI Back-office" },
      {
        name: "description",
        content: "Démarrez, arrêtez et supervisez les services ArchbyAI : moteur IA, rendu 3D, passerelle API.",
      },
      { property: "og:title", content: "Services — ArchbyAI Back-office" },
      { property: "og:description", content: "Démarrez, arrêtez et supervisez les services de la plateforme ArchbyAI." },
    ],
  }),
  component: ServicesPage,
});

const statutMap: Record<ServiceItem["statut"], { label: string; tone: Tone }> = {
  en_cours: { label: "En cours", tone: "success" },
  degrade: { label: "Dégradé", tone: "warning" },
  arrete: { label: "Arrêté", tone: "danger" },
};

function ServicesPage() {
  const { state, ready, basculerService, journaliser, notifier } = useData();
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setLoading(false), 400);
    return () => window.clearTimeout(id);
  }, [ready]);

  const toggle = (svc: ServiceItem) => {
    setBusy(svc.id);
    window.setTimeout(() => {
      const suivant = basculerService(svc.id);
      setBusy(null);
      journaliser({
        api: svc.nom,
        action: suivant === "en_cours" ? "POST /v1/services/start" : "POST /v1/services/stop",
        utilisateur: "m.toufella",
        code: 200,
        duree: 640,
      });
      if (suivant === "en_cours") {
        toast.success(`${svc.nom} démarré.`);
        notifier({ titre: "Service démarré", detail: svc.nom, type: "success", to: "/services" });
      } else {
        toast.warning(`${svc.nom} arrêté.`);
        notifier({ titre: "Service arrêté", detail: svc.nom, type: "error", to: "/services" });
      }
    }, 550);
  };

  if (loading) {
    return (
      <AdminShell>
        <PageHeader titre="Services" description="Démarrez, arrêtez et supervisez l'état des services de la plateforme." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-brand h-64 w-full rounded-2xl" />
          ))}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader
        titre="Services"
        description="Démarrez, arrêtez et supervisez l'état des services de la plateforme."
        actions={
          <Button
            variant="outline"
            loading={refreshing}
            onClick={() => {
              setRefreshing(true);
              window.setTimeout(() => {
                setRefreshing(false);
                toast.success(`${state.services.length} services actualisés.`);
              }, 600);
            }}
          >
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.services.map((svc, i) => (
          <article
            key={svc.id}
            className="glow-card group relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm animate-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/25" />
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">{svc.nom}</h2>
                <p className="truncate text-xs text-muted-foreground">{svc.description}</p>
              </div>
              <StatusPill tone={statutMap[svc.statut].tone}>{statutMap[svc.statut].label}</StatusPill>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Server className="h-3.5 w-3.5" /> Hébergement
                </dt>
                <dd className="truncate font-medium">{svc.region}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Version</dt>
                <dd className="font-medium">{svc.version}</dd>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <dt className="text-muted-foreground">Disponibilité</dt>
                  <dd className="font-semibold">{svc.uptime} %</dd>
                </div>
                <Progress value={svc.uptime} className="h-2" />
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={svc.statut !== "arrete"}
                  disabled={busy === svc.id}
                  onCheckedChange={() => toggle(svc)}
                  aria-label={`Activer ${svc.nom}`}
                />
                Service actif
              </label>
              <Button
                variant={svc.statut === "arrete" ? "hero" : "outline"}
                size="sm"
                loading={busy === svc.id}
                onClick={() => toggle(svc)}
              >
                <Power className="h-3.5 w-3.5" />
                {svc.statut === "arrete" ? "Démarrer" : "Arrêter"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
