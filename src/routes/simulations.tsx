import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, CheckCircle2, Eye, LayoutGrid, Plus, Share2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { PlanMini } from "@/components/plan-mini";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useData } from "@/lib/store";
import type { Simulation } from "@/lib/mock-data";

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
  const navigate = useNavigate();
  const { state, ready, majSimulation, supprimerSimulation, journaliser, notifier } = useData();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Simulation | null>(null);
  const [aSupprimer, setASupprimer] = useState<Simulation | null>(null);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(id);
  }, [ready]);

  const partager = async (r: Simulation) => {
    const lien = `${window.location.origin}/simulations?ref=${r.reference}`;
    try {
      await navigator.clipboard.writeText(lien);
      toast.success("Lien sécurisé copié dans le presse-papiers.");
    } catch {
      toast.info(lien);
    }
    journaliser({ api: "Partage sécurisé", action: "POST /v1/simulations/share", utilisateur: r.auteur, code: 200, duree: 88 });
  };

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
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Ouvrir le plan 2D"
            onClick={() => navigate({ to: "/plan/$reference", params: { reference: r.reference } })}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Ouvrir la vue 3D"
            onClick={() => navigate({ to: "/plan/$reference", params: { reference: r.reference } })}
          >
            <Box className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Voir le détail de la simulation" onClick={() => setDetail(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Partager un lien sécurisé" onClick={() => partager(r)}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer la simulation"
            className="text-destructive"
            onClick={() => setASupprimer(r)}
          >
            <Trash2 className="h-4 w-4" />
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
          <Button variant="hero" onClick={() => navigate({ to: "/nouvelle-simulation" })}>
            <Plus className="h-4 w-4" /> Nouvelle simulation
          </Button>
        }
      />

      <DataTable
        rows={state.simulations}
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

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" /> {detail.reference}
                </SheetTitle>
                <SheetDescription>
                  {detail.type} · {detail.ville} · créée le {detail.date}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-brand-soft p-4">
                  <PlanMini simulation={detail} />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Aperçu schématique du plan — {detail.superficie} m² sur {detail.etages} étage(s).
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate({ to: "/plan/$reference", params: { reference: detail.reference } })}
                    >
                      Vue détaillée
                    </Button>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Statut", statutMap[detail.statut].label],
                    ["Auteur", detail.auteur],
                    ["Superficie", `${detail.superficie} m²`],
                    ["Étages", String(detail.etages)],
                    ["Chambres", String(detail.chambres)],
                    ["Ville", detail.ville],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-border bg-card/70 p-3">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-0.5 font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="hero"
                    onClick={() => {
                      majSimulation(detail.id, { statut: "validee" });
                      setDetail({ ...detail, statut: "validee" });
                      toast.success(`${detail.reference} validée.`);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Valider
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      majSimulation(detail.id, { statut: "rejetee" });
                      setDetail({ ...detail, statut: "rejetee" });
                      toast.warning(`${detail.reference} rejetée.`);
                    }}
                  >
                    <XCircle className="h-4 w-4" /> Rejeter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/plan/$reference", params: { reference: detail.reference } })}
                  >
                    <Box className="h-4 w-4" /> Ouvrir les vues 2D / 3D
                  </Button>
                  <Button variant="ghost" onClick={() => partager(detail)}>
                    <Share2 className="h-4 w-4" /> Partager
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {aSupprimer?.reference} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le plan généré et ses partages sécurisés seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!aSupprimer) return;
                supprimerSimulation(aSupprimer.id);
                journaliser({
                  api: "Génération plan 2D",
                  action: "DELETE /v1/simulations",
                  utilisateur: "m.toufella",
                  code: 200,
                  duree: 104,
                });
                toast.success(`${aSupprimer.reference} supprimée.`);
                setASupprimer(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
