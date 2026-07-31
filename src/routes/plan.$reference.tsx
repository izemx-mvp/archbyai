import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, CheckCircle2, Download, LayoutGrid, Share2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-parts";
import { Plan2D } from "@/components/plan-2d";
import {
  OPTIONS_ECLAIRAGE,
  OPTIONS_PEINTURE,
  OPTIONS_SOL,
  Plan3D,
} from "@/components/plan-3d";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Simulation } from "@/lib/mock-data";

export const Route = createFileRoute("/plan/$reference")({
  head: ({ params }) => ({
    meta: [
      { title: `Plan ${params.reference} — Vue 2D & 3D ArchbyAI` },
      {
        name: "description",
        content:
          "Visualisez le plan d'architecture en 2D et en 3D, personnalisez peinture, revêtement de sol et éclairage.",
      },
      { property: "og:title", content: `Plan ${params.reference} — Vue 2D & 3D ArchbyAI` },
      {
        property: "og:description",
        content: "Vue 2D et 3D du plan généré, avec personnalisation des matériaux et de l'éclairage.",
      },
    ],
  }),
  component: PlanPage,
});

const statutMap: Record<Simulation["statut"], { label: string; tone: Tone }> = {
  validee: { label: "Validée", tone: "success" },
  generee: { label: "Générée", tone: "info" },
  en_cours: { label: "En cours", tone: "warning" },
  rejetee: { label: "Rejetée", tone: "danger" },
};

function PlanPage() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  const { state, ready, majSimulation, journaliser } = useData();
  const simulation = state.simulations.find((s) => s.reference === reference);

  const [etage, setEtage] = useState(0);
  const [plein2d, setPlein2d] = useState(false);
  const [peinture, setPeinture] = useState(OPTIONS_PEINTURE[0].valeur);
  const [sol, setSol] = useState<string>(OPTIONS_SOL[0]);
  const [eclairage, setEclairage] = useState<string>(OPTIONS_ECLAIRAGE[0]);

  useEffect(() => {
    if (!simulation?.personnalisation) return;
    setPeinture(simulation.personnalisation.peinture);
    setSol(simulation.personnalisation.sol);
    setEclairage(simulation.personnalisation.eclairage);
  }, [simulation?.id]);

  if (!ready) {
    return (
      <AppShell>
        <Skeleton className="skeleton-brand h-12 w-72 rounded-xl" />
        <Skeleton className="skeleton-brand mt-6 h-[480px] w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (!simulation) {
    return (
      <AppShell>
        <PageHeader titre="Plan introuvable" description={`Aucune simulation ne porte la référence ${reference}.`} />
        <Button variant="hero" onClick={() => navigate({ to: "/simulations" })}>
          Retour aux simulations
        </Button>
      </AppShell>
    );
  }

  const enregistrerPersonnalisation = () => {
    majSimulation(simulation.id, {
      personnalisation: {
        peinture,
        sol: sol as NonNullable<Simulation["personnalisation"]>["sol"],
        eclairage: eclairage as NonNullable<Simulation["personnalisation"]>["eclairage"],
      },
    });
    journaliser({
      api: "Personnalisation matériaux",
      action: "PATCH /v1/simulations/customization",
      utilisateur: simulation.auteur,
      code: 200,
      duree: 132,
    });
    toast.success("Personnalisation enregistrée.");
  };

  const partager = async () => {
    const lien = `${window.location.origin}/plan/${simulation.reference}`;
    try {
      await navigator.clipboard.writeText(lien);
      toast.success("Lien sécurisé copié — partagez-le pour recueillir des retours.");
    } catch {
      toast.info(lien);
    }
    journaliser({ api: "Partage sécurisé", action: "POST /v1/simulations/share", utilisateur: simulation.auteur, code: 200, duree: 74 });
  };

  const exporterSvg = () => {
    const svg = document.querySelector<SVGSVGElement>("#plan2d svg");
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${simulation.reference}-etage-${etage}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plan 2D exporté en SVG.");
  };

  return (
    <AppShell intensity="normal">
      <PageHeader
        titre={`Plan ${simulation.reference}`}
        description={`${simulation.type} · ${simulation.ville} · ${simulation.superficie} m² · ${simulation.etages} étage(s)`}
        actions={
          <>
            <Button variant="outline" onClick={partager}>
              <Share2 className="h-4 w-4" /> Partager
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                majSimulation(simulation.id, { statut: "validee" });
                toast.success(`${simulation.reference} validée.`);
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Valider la simulation
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill tone={statutMap[simulation.statut].tone}>{statutMap[simulation.statut].label}</StatusPill>
        <StatusPill tone="brand" dot={false}>{simulation.type}</StatusPill>
        {simulation.style && <StatusPill tone="info" dot={false}>{simulation.style}</StatusPill>}
        {simulation.toiture && <StatusPill tone="info" dot={false}>Toiture {simulation.toiture.toLowerCase()}</StatusPill>}
        {simulation.piscine && <StatusPill tone="success" dot={false}>Piscine</StatusPill>}
        {simulation.jardin && <StatusPill tone="success" dot={false}>Jardin {simulation.superficieJardin ? `${simulation.superficieJardin} m²` : ""}</StatusPill>}
        {simulation.terrasse && <StatusPill tone="success" dot={false}>Terrasse</StatusPill>}
        {simulation.garage && <StatusPill tone="success" dot={false}>Garage</StatusPill>}
        {simulation.panneauxSolaires && <StatusPill tone="success" dot={false}>Panneaux solaires</StatusPill>}
        {simulation.sousSol && <StatusPill tone="success" dot={false}>Sous-sol</StatusPill>}
        <span className="text-xs text-muted-foreground">Auteur : {simulation.auteur} · créée le {simulation.date}</span>
      </div>

      {simulation.description && (
        <p className="mb-4 rounded-2xl border border-border bg-card/70 p-4 text-sm italic text-muted-foreground shadow-soft backdrop-blur-sm">
          « {simulation.description} »
        </p>
      )}

      <Tabs defaultValue="2d" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="2d" className="gap-2 rounded-lg">
            <LayoutGrid className="h-4 w-4" /> Vue 2D
          </TabsTrigger>
          <TabsTrigger value="3d" className="gap-2 rounded-lg">
            <Box className="h-4 w-4" /> Vue 3D
          </TabsTrigger>
        </TabsList>

        <TabsContent value="2d" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: simulation.etages }).map((_, i) => (
                <Button key={i} variant={i === etage ? "hero" : "outline"} size="sm" onClick={() => setEtage(i)}>
                  {i === 0 ? "RDC" : `Étage ${i}`}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPlein2d(true)}>
                <Maximize2 className="h-4 w-4" /> Plein écran
              </Button>
              <Button variant="outline" size="sm" onClick={exporterSvg}>
                <Download className="h-4 w-4" /> Exporter le plan
              </Button>
            </div>
          </div>
          <div id="plan2d" className="rounded-2xl border border-border bg-card/85 p-4 shadow-soft backdrop-blur-sm">
            <Plan2D simulation={simulation} etage={etage} />
          </div>

          {plein2d && (
            <div className="fixed inset-0 z-[90] flex flex-col bg-background/98 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-2 text-sm font-bold">{simulation.reference}</span>
                  {Array.from({ length: simulation.etages }).map((_, i) => (
                    <Button key={i} variant={i === etage ? "hero" : "outline"} size="sm" onClick={() => setEtage(i)}>
                      {i === 0 ? "RDC" : `Étage ${i}`}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setPlein2d(false)}>
                  <Minimize2 className="h-4 w-4" /> Quitter (Échap)
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <Plan2D simulation={simulation} etage={etage} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="3d" className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-border bg-card/85 p-4 shadow-soft backdrop-blur-sm">
            <Plan3D simulation={simulation} peinture={peinture} sol={sol} eclairage={eclairage} />
          </div>
          <aside className="space-y-5 rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
            <div>
              <h2 className="font-bold">Personnalisation</h2>
              <p className="text-xs text-muted-foreground">Peinture, revêtement du sol et éclairage du logement.</p>
            </div>

            <div className="space-y-2">
              <Label>Couleur de la peinture</Label>
              <div className="flex flex-wrap gap-2">
                {OPTIONS_PEINTURE.map((c) => (
                  <button
                    key={c.valeur}
                    type="button"
                    aria-label={c.nom}
                    title={c.nom}
                    onClick={() => setPeinture(c.valeur)}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition-transform hover:scale-110",
                      peinture === c.valeur ? "border-primary ring-2 ring-primary/30" : "border-border",
                    )}
                    style={{ background: c.valeur }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sol">Revêtement du sol</Label>
              <Select value={sol} onValueChange={setSol}>
                <SelectTrigger id="sol" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS_SOL.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eclairage">Éclairage</Label>
              <Select value={eclairage} onValueChange={setEclairage}>
                <SelectTrigger id="eclairage" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS_ECLAIRAGE.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aménagements extérieurs</Label>
              {([
                ["Piscine", "piscine"],
                ["Jardin paysager", "jardin"],
                ["Terrasse & pergola", "terrasse"],
                ["Garage", "garage"],
                ["Clôture & portail", "cloture"],
                ["Panneaux solaires", "panneauxSolaires"],
              ] as const).map(([label, cle]) => (
                <label key={cle} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm">
                  {label}
                  <Switch
                    checked={!!simulation[cle]}
                    aria-label={label}
                    onCheckedChange={(v) =>
                      majSimulation(simulation.id, {
                        [cle]: v,
                        ...(cle === "jardin" && v && !simulation.arbres ? { arbres: 6 } : {}),
                      })
                    }
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="hero" onClick={enregistrerPersonnalisation}>
                Enregistrer la personnalisation
              </Button>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  majSimulation(simulation.id, { statut: "rejetee" });
                  toast.warning(`${simulation.reference} rejetée.`);
                }}
              >
                <XCircle className="h-4 w-4" /> Rejeter la simulation
              </Button>
            </div>
          </aside>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
