import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Power, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { services as initialServices, type ServiceItem } from "@/lib/mock-data";

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
  const [services, setServices] = useState(initialServices);
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = (svc: ServiceItem) => {
    setBusy(svc.id);
    window.setTimeout(() => {
      const demarrage = svc.statut === "arrete";
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, statut: demarrage ? "en_cours" : "arrete" } : s)),
      );
      setBusy(null);
      if (demarrage) toast.success(`${svc.nom} démarré.`);
      else toast.warning(`${svc.nom} arrêté.`);
    }, 700);
  };

  return (
    <AppShell>
      <PageHeader
        titre="Services"
        description="Démarrez, arrêtez et supervisez l'état des services de la plateforme."
        actions={
          <Button variant="outline" onClick={() => toast.info("Actualisation de l'état des services…")}>
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((svc, i) => (
          <article
            key={svc.id}
            className="hover-lift group relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm animate-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
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
                <Switch checked={svc.statut !== "arrete"} onCheckedChange={() => toggle(svc)} aria-label={`Activer ${svc.nom}`} />
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
    </AppShell>
  );
}
