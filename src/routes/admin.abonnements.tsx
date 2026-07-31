import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgePercent, CalendarPlus, Eye, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBilling } from "@/lib/billing-store";
import {
  formatMAD,
  planParId,
  plans,
  type AbonnementClient,
  type PlanId,
  type Periodicite,
} from "@/lib/billing-data";

export const Route = createFileRoute("/admin/abonnements")({
  head: () => ({
    meta: [
      { title: "Abonnements — Back-office ArchbyAI" },
      { name: "description", content: "Suivi et gestion des abonnements actifs, en essai, résiliés ou expirés d'ArchbyAI." },
      { property: "og:title", content: "Abonnements — Back-office ArchbyAI" },
      { property: "og:description", content: "Gestion des plans, remises et résiliations ArchbyAI." },
    ],
  }),
  component: AdminAbonnements,
});

const statutMap: Record<AbonnementClient["statut"], { label: string; tone: Tone }> = {
  actif: { label: "Actif", tone: "success" },
  essai: { label: "Essai", tone: "info" },
  annule: { label: "Résilié", tone: "warning" },
  expire: { label: "Expiré", tone: "danger" },
};

function AdminAbonnements() {
  const { state, ready, changerPlan, changerStatutAbonnement, appliquerRemise, prolongerEssai } = useBilling();
  const [detail, setDetail] = useState<AbonnementClient | null>(null);
  const [planDialog, setPlanDialog] = useState<AbonnementClient | null>(null);
  const [remiseDialog, setRemiseDialog] = useState<AbonnementClient | null>(null);
  const [annulation, setAnnulation] = useState<AbonnementClient | null>(null);
  const [choix, setChoix] = useState<{ plan: PlanId; periodicite: Periodicite }>({ plan: "pro", periodicite: "mensuel" });
  const [remise, setRemise] = useState("10");

  const columns: Column<AbonnementClient>[] = [
    {
      key: "client",
      header: "Client",
      sortable: true,
      value: (r) => r.client,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{r.client}</p>
          <p className="truncate text-xs text-muted-foreground">{r.id} · {r.email}</p>
        </div>
      ),
    },
    { key: "plan", header: "Plan", sortable: true, value: (r) => r.plan, cell: (r) => <StatusPill tone="brand" dot={false}>{planParId(r.plan).nom}</StatusPill> },
    { key: "periodicite", header: "Cycle", cell: (r) => <span className="capitalize text-muted-foreground">{r.periodicite}</span> },
    { key: "montant", header: "Montant", sortable: true, value: (r) => r.montant, cell: (r) => <span className="font-bold tabular-nums">{formatMAD(r.montant)}</span> },
    { key: "debut", header: "Début", sortable: true, value: (r) => r.debut, cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.debut}</span> },
    { key: "renouvellement", header: "Renouvellement", sortable: true, value: (r) => r.renouvellement, cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.renouvellement}</span> },
    { key: "statut", header: "Statut", cell: (r) => <StatusPill tone={statutMap[r.statut].tone}>{statutMap[r.statut].label}</StatusPill> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Détail de l'abonnement" onClick={() => setDetail(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Changer de plan" onClick={() => { setChoix({ plan: r.plan, periodicite: r.periodicite }); setPlanDialog(r); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Appliquer une remise" onClick={() => { setRemise(String(r.remise ?? 10)); setRemiseDialog(r); }}>
            <BadgePercent className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Prolonger l'essai" onClick={() => { prolongerEssai(r.id, 14); toast.success(`Essai prolongé de 14 jours pour ${r.client}.`); }}>
            <CalendarPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Résilier l'abonnement" onClick={() => setAnnulation(r)}>
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titre="Abonnements"
        description={`${state.abonnements.filter((a) => a.statut === "actif").length} abonnements actifs sur ${state.abonnements.length}.`}
      />

      <DataTable
        rows={state.abonnements}
        columns={columns}
        loading={!ready}
        pageSize={10}
        searchPlaceholder="Rechercher un client, un identifiant d'abonnement…"
        searchKeys={(r) => `${r.client} ${r.email} ${r.id} ${planParId(r.plan).nom}`}
        filters={[
          { id: "statut", label: "Statut", options: [
            { value: "actif", label: "Actif" },
            { value: "essai", label: "Essai" },
            { value: "annule", label: "Résilié" },
            { value: "expire", label: "Expiré" },
          ] },
          { id: "plan", label: "Plan", options: plans.map((p) => ({ value: p.id, label: p.nom })) },
          { id: "periode", label: "Période", options: [
            { value: "2026-s1", label: "Début S1 2026" },
            { value: "2026-s2", label: "Début S2 2026" },
          ] },
        ]}
        matchFilter={(row, groupId, value) => {
          if (groupId === "statut") return row.statut === value;
          if (groupId === "plan") return row.plan === value;
          const mois = Number(row.debut.split("/")[1]);
          return value === "2026-s1" ? mois <= 6 : mois > 6;
        }}
        emptyTitle="Aucun abonnement"
        emptyDescription="Modifiez les filtres pour afficher d'autres abonnements."
      />

      {/* Détail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Abonnement {detail?.id}</DialogTitle>
            <DialogDescription>{detail?.client} · {detail?.email}</DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className="space-y-3 text-sm">
              {[
                ["Plan", planParId(detail.plan).nom],
                ["Cycle", detail.periodicite],
                ["Montant", formatMAD(detail.montant)],
                ["Remise", detail.remise ? `${detail.remise} %` : "—"],
                ["Début", detail.debut],
                ["Renouvellement", detail.renouvellement],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold capitalize">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Statut</dt>
                <dd><StatusPill tone={statutMap[detail.statut].tone}>{statutMap[detail.statut].label}</StatusPill></dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            {detail && (
              <Button variant="outline" asChild>
                <Link to="/admin/utilisateurs/$id" params={{ id: detail.clientId }}>Voir la fiche client</Link>
              </Button>
            )}
            <Button variant="hero" onClick={() => setDetail(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Changement de plan */}
      <Dialog open={!!planDialog} onOpenChange={(o) => !o && setPlanDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le plan de {planDialog?.client}</DialogTitle>
            <DialogDescription>Le nouveau tarif s'applique dès le prochain cycle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={choix.plan} onValueChange={(v) => setChoix({ ...choix, plan: v as PlanId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cycle</Label>
              <Select value={choix.periodicite} onValueChange={(v) => setChoix({ ...choix, periodicite: v as Periodicite })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(null)}>Annuler</Button>
            <Button
              variant="hero"
              onClick={() => {
                if (!planDialog) return;
                const p = planParId(choix.plan);
                changerPlan(planDialog.id, choix.plan, choix.periodicite, choix.periodicite === "mensuel" ? p.prixMensuel : p.prixAnnuel);
                toast.success(`${planDialog.client} est passé au plan ${p.nom}.`);
                setPlanDialog(null);
              }}
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remise */}
      <Dialog open={!!remiseDialog} onOpenChange={(o) => !o && setRemiseDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Appliquer une remise</DialogTitle>
            <DialogDescription>Remise commerciale sur l'abonnement {remiseDialog?.id}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="remise">Remise (%)</Label>
            <Input id="remise" value={remise} onChange={(e) => setRemise(e.target.value)} inputMode="numeric" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemiseDialog(null)}>Annuler</Button>
            <Button
              variant="hero"
              onClick={() => {
                const v = Number(remise);
                if (Number.isNaN(v) || v < 0 || v > 100) {
                  toast.error("Saisissez une remise entre 0 et 100 %.");
                  return;
                }
                if (remiseDialog) appliquerRemise(remiseDialog.id, v);
                toast.success(`Remise de ${v} % appliquée.`);
                setRemiseDialog(null);
              }}
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Résiliation */}
      <AlertDialog open={!!annulation} onOpenChange={(o) => !o && setAnnulation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Résilier l'abonnement de {annulation?.client} ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'accès reste actif jusqu'au {annulation?.renouvellement}, puis le compte bascule en lecture seule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (annulation) changerStatutAbonnement(annulation.id, "annule");
                toast.warning("Abonnement résilié.");
                setAnnulation(null);
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
