import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, KeyRound, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useBilling } from "@/lib/billing-store";
import type { ClientCompte } from "@/lib/billing-data";

export const Route = createFileRoute("/admin/utilisateurs/")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — Back-office ArchbyAI" },
      { name: "description", content: "Recherche, filtrage et administration des comptes clients ArchbyAI." },
      { property: "og:title", content: "Utilisateurs — Back-office ArchbyAI" },
      { property: "og:description", content: "Administration des comptes clients ArchbyAI." },
    ],
  }),
  component: AdminUtilisateurs,
});

const statutMap: Record<ClientCompte["statut"], { label: string; tone: Tone }> = {
  actif: { label: "Actif", tone: "success" },
  suspendu: { label: "Suspendu", tone: "danger" },
  invite: { label: "Invité", tone: "info" },
};

const initiales = (nom: string) => nom.split(" ").map((p) => p[0]).slice(0, 2).join("");

function AdminUtilisateurs() {
  const { state, ready, majClient, supprimerClient } = useBilling();
  const [confirm, setConfirm] = useState<{ type: "suspendre" | "supprimer"; client: ClientCompte } | null>(null);

  const columns: Column<ClientCompte>[] = [
    {
      key: "nom",
      header: "Client",
      sortable: true,
      value: (r) => r.nom,
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initiales(r.nom)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{r.nom}</p>
            <p className="truncate text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "societe", header: "Société", sortable: true, value: (r) => r.societe, cell: (r) => <span className="text-muted-foreground">{r.societe}</span> },
    { key: "role", header: "Rôle", cell: (r) => <StatusPill tone="brand" dot={false}>{r.role}</StatusPill> },
    { key: "statut", header: "Statut", cell: (r) => <StatusPill tone={statutMap[r.statut].tone}>{statutMap[r.statut].label}</StatusPill> },
    { key: "inscription", header: "Inscription", sortable: true, value: (r) => r.inscription, cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.inscription}</span> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Voir la fiche" asChild>
            <Link to="/admin/utilisateurs/$id" params={{ id: r.id }}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Réinitialiser le mot de passe"
            onClick={() => toast.success(`Lien de réinitialisation envoyé à ${r.email}.`)}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          {r.statut === "suspendu" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Réactiver le compte"
              onClick={() => {
                majClient(r.id, { statut: "actif" });
                toast.success(`Compte de ${r.nom} réactivé.`);
              }}
            >
              <Play className="h-4 w-4 text-success" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label="Suspendre le compte" onClick={() => setConfirm({ type: "suspendre", client: r })}>
              <Pause className="h-4 w-4 text-warning-foreground dark:text-warning" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" aria-label="Supprimer le compte" onClick={() => setConfirm({ type: "supprimer", client: r })}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader titre="Utilisateurs" description={`${state.clients.length} comptes clients enregistrés sur la plateforme.`} />

      <DataTable
        rows={state.clients}
        columns={columns}
        loading={!ready}
        pageSize={10}
        searchPlaceholder="Rechercher un client, une société, un e-mail…"
        searchKeys={(r) => `${r.nom} ${r.email} ${r.societe} ${r.role}`}
        filters={[
          { id: "statut", label: "Statut", options: [
            { value: "actif", label: "Actif" },
            { value: "suspendu", label: "Suspendu" },
            { value: "invite", label: "Invité" },
          ] },
          { id: "role", label: "Rôle", options: [
            { value: "Administrateur", label: "Administrateur" },
            { value: "Architecte", label: "Architecte" },
            { value: "Utilisateur", label: "Utilisateur" },
          ] },
        ]}
        matchFilter={(row, groupId, value) => (groupId === "statut" ? row.statut === value : row.role === value)}
        emptyTitle="Aucun client trouvé"
        emptyDescription="Ajustez la recherche ou réinitialisez les filtres."
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "supprimer"
                ? `Supprimer le compte de ${confirm.client.nom} ?`
                : `Suspendre le compte de ${confirm?.client.nom} ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "supprimer"
                ? "Le compte et ses abonnements associés seront définitivement retirés de la démonstration."
                : "L'accès à la plateforme sera bloqué jusqu'à réactivation manuelle."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirm) return;
                if (confirm.type === "supprimer") {
                  supprimerClient(confirm.client.id);
                  toast.success(`Compte de ${confirm.client.nom} supprimé.`);
                } else {
                  majClient(confirm.client.id, { statut: "suspendu" });
                  toast.warning(`Compte de ${confirm.client.nom} suspendu.`);
                }
                setConfirm(null);
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
