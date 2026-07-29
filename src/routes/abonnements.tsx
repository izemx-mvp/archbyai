import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Pause, Play, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apis, type ApiSubscription } from "@/lib/mock-data";

export const Route = createFileRoute("/abonnements")({
  head: () => ({
    meta: [
      { title: "Abonnements API — ArchbyAI Back-office" },
      {
        name: "description",
        content: "Gérez les abonnements aux API ArchbyAI : quotas, plans, latence et renouvellements.",
      },
      { property: "og:title", content: "Abonnements API — ArchbyAI Back-office" },
      { property: "og:description", content: "Gérez les abonnements aux API ArchbyAI : quotas, plans et statuts." },
    ],
  }),
  component: AbonnementsPage,
});

const statutLabel: Record<ApiSubscription["statut"], { label: string; tone: Tone }> = {
  actif: { label: "Actif", tone: "success" },
  suspendu: { label: "Suspendu", tone: "warning" },
  erreur: { label: "Erreur", tone: "danger" },
  maintenance: { label: "Maintenance", tone: "info" },
};

function AbonnementsPage() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(id);
  }, []);

  const columns: Column<ApiSubscription>[] = [
    {
      key: "nom",
      header: "API",
      sortable: true,
      value: (r) => r.nom,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{r.nom}</p>
          <p className="truncate text-xs text-muted-foreground">{r.id}</p>
        </div>
      ),
    },
    { key: "client", header: "Client", sortable: true, value: (r) => r.client, cell: (r) => <span className="truncate">{r.client}</span> },
    {
      key: "plan",
      header: "Plan",
      cell: (r) => <StatusPill tone="brand" dot={false}>{r.plan}</StatusPill>,
    },
    {
      key: "quota",
      header: "Quota consommé",
      sortable: true,
      value: (r) => r.consomme / r.quota,
      cell: (r) => (
        <div className="w-40">
          <Progress value={Math.round((r.consomme / r.quota) * 100)} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {r.consomme.toLocaleString("fr-FR")} / {r.quota.toLocaleString("fr-FR")}
          </p>
        </div>
      ),
    },
    { key: "latence", header: "Latence", sortable: true, value: (r) => r.latence, cell: (r) => <span>{r.latence} ms</span> },
    {
      key: "statut",
      header: "Statut",
      cell: (r) => <StatusPill tone={statutLabel[r.statut].tone}>{statutLabel[r.statut].label}</StatusPill>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={r.statut === "actif" ? "Suspendre l'abonnement" : "Activer l'abonnement"}
            onClick={() =>
              r.statut === "actif"
                ? toast.warning(`Abonnement ${r.id} suspendu.`)
                : toast.success(`Abonnement ${r.id} activé.`)
            }
          >
            {r.statut === "actif" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        titre="Abonnements API"
        description="Gérez les abonnements aux API de la plateforme, leurs quotas et leurs plans."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Export CSV généré.")}>
              <Download className="h-4 w-4" /> Exporter
            </Button>
            <Button variant="hero" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Nouvel abonnement
            </Button>
          </>
        }
      />

      <DataTable
        rows={apis}
        columns={columns}
        loading={loading}
        searchPlaceholder="Rechercher une API ou un client…"
        searchKeys={(r) => `${r.nom} ${r.client} ${r.id} ${r.plan}`}
        filters={[
          {
            id: "statut",
            label: "Statut",
            options: [
              { value: "actif", label: "Actif" },
              { value: "suspendu", label: "Suspendu" },
              { value: "maintenance", label: "Maintenance" },
              { value: "erreur", label: "Erreur" },
            ],
          },
          {
            id: "plan",
            label: "Plan",
            options: [
              { value: "Découverte", label: "Découverte" },
              { value: "Pro", label: "Pro" },
              { value: "Entreprise", label: "Entreprise" },
            ],
          },
        ]}
        matchFilter={(row, groupId, value) =>
          groupId === "statut" ? row.statut === value : row.plan === value
        }
        emptyTitle="Aucun abonnement trouvé"
        emptyDescription="Modifiez les filtres ou créez un nouvel abonnement API."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel abonnement API</DialogTitle>
            <DialogDescription>Associez une API de la plateforme à un client et à un plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" placeholder="Nom du client" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api">API</Label>
              <Select>
                <SelectTrigger id="api" className="h-11 rounded-xl">
                  <SelectValue placeholder="Choisir une API" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan2d">Génération plan 2D</SelectItem>
                  <SelectItem value="rendu3d">Rendu 3D temps réel</SelectItem>
                  <SelectItem value="conformite">Conformité normes MA</SelectItem>
                  <SelectItem value="partage">Partage sécurisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quota">Quota mensuel</Label>
              <Input id="quota" type="number" placeholder="10000" className="h-11 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="hero"
              loading={saving}
              onClick={() => {
                setSaving(true);
                window.setTimeout(() => {
                  setSaving(false);
                  setOpen(false);
                  toast.success("Abonnement créé avec succès.");
                }, 800);
              }}
            >
              Créer l'abonnement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
