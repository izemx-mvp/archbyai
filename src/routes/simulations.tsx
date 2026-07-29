import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Box, Eye, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { simulations, type Simulation } from "@/lib/mock-data";

export const Route = createFileRoute("/simulations")({
  head: () => ({
    meta: [
      { title: "Simulations — ArchbyAI Back-office" },
      {
        name: "description",
        content:
          "Suivez les simulations de plans d'architecture 2D et 3D : logements non commerciaux, commerciaux et villas.",
      },
      { property: "og:title", content: "Simulations — ArchbyAI Back-office" },
      { property: "og:description", content: "Suivi des simulations de plans d'architecture 2D et 3D ArchbyAI." },
    ],
  }),
  component: SimulationsPage,
});

const statutMap: Record<Simulation["statut"], { label: string; tone: Tone }> = {
  validee: { label: "Validée", tone: "success" },
  generee: { label: "Générée", tone: "info" },
  en_cours: { label: "En cours", tone: "warning" },
  rejetee: { label: "Rejetée", tone: "danger" },
};

function SimulationsPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(id);
  }, []);

  const columns: Column<Simulation>[] = [
    {
      key: "reference",
      header: "Référence",
      sortable: true,
      value: (r) => r.reference,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{r.reference}</p>
          <p className="truncate text-xs text-muted-foreground">{r.auteur}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (r) => <StatusPill tone="brand" dot={false}>{r.type}</StatusPill> },
    { key: "ville", header: "Ville", sortable: true, value: (r) => r.ville, cell: (r) => r.ville },
    { key: "superficie", header: "Superficie", sortable: true, value: (r) => r.superficie, cell: (r) => `${r.superficie} m²` },
    { key: "etages", header: "Étages / chambres", cell: (r) => `${r.etages} étage(s) · ${r.chambres} ch.` },
    { key: "statut", header: "Statut", cell: (r) => <StatusPill tone={statutMap[r.statut].tone}>{statutMap[r.statut].label}</StatusPill> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Visualiser en 3D" onClick={() => toast.info(`Ouverture de la vue 3D — ${r.reference}`)}>
            <Box className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Visualiser le plan 2D" onClick={() => toast.info(`Aperçu 2D — ${r.reference}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Partager un lien sécurisé"
            onClick={() => toast.success("Lien sécurisé de la simulation copié.")}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        titre="Simulations"
        description="Plans d'architecture générés par l'IA, conformes aux normes et standards marocains."
        actions={
          <Button variant="hero" onClick={() => toast.success("Nouvelle simulation initialisée.")}>
            <Plus className="h-4 w-4" /> Nouvelle simulation
          </Button>
        }
      />

      <DataTable
        rows={simulations}
        columns={columns}
        loading={loading}
        searchPlaceholder="Rechercher une référence, une ville, un auteur…"
        searchKeys={(r) => `${r.reference} ${r.ville} ${r.auteur} ${r.type}`}
        filters={[
          {
            id: "type",
            label: "Type de logement",
            options: [
              { value: "Non commercial", label: "Non commercial" },
              { value: "Commercial", label: "Commercial" },
              { value: "Villa", label: "Villa" },
            ],
          },
          {
            id: "statut",
            label: "Statut",
            options: [
              { value: "validee", label: "Validée" },
              { value: "generee", label: "Générée" },
              { value: "en_cours", label: "En cours" },
              { value: "rejetee", label: "Rejetée" },
            ],
          },
        ]}
        matchFilter={(row, groupId, value) => (groupId === "type" ? row.type === value : row.statut === value)}
        emptyTitle="Aucune simulation"
        emptyDescription="Lancez une nouvelle simulation pour générer un plan d'architecture."
      />
    </AppShell>
  );
}
