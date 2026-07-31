import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Eye, RotateCcw, Undo2 } from "lucide-react";
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
import { useBilling } from "@/lib/billing-store";
import { formatMAD, type Transaction } from "@/lib/billing-data";

export const Route = createFileRoute("/admin/paiements")({
  head: () => ({
    meta: [
      { title: "Paiements — Back-office ArchbyAI" },
      { name: "description", content: "Transactions ArchbyAI : encaissements, échecs, remboursements et export CSV." },
      { property: "og:title", content: "Paiements — Back-office ArchbyAI" },
      { property: "og:description", content: "Suivi des transactions et des remboursements ArchbyAI." },
    ],
  }),
  component: AdminPaiements,
});

const statutMap: Record<Transaction["statut"], { label: string; tone: Tone }> = {
  reussi: { label: "Réussi", tone: "success" },
  echoue: { label: "Échec", tone: "danger" },
  rembourse: { label: "Remboursé", tone: "warning" },
  en_attente: { label: "En attente", tone: "info" },
};

function AdminPaiements() {
  const { state, ready, changerStatutTransaction } = useBilling();
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [remboursement, setRemboursement] = useState<Transaction | null>(null);

  const reussis = state.transactions.filter((t) => t.statut === "reussi");
  const revenuYtd = reussis.reduce((s, t) => s + t.montant, 0);
  const revenuMtd = reussis.filter((t) => t.date.split("/")[1] === "07").reduce((s, t) => s + t.montant, 0);
  const abonnesActifs = state.abonnements.filter((a) => a.statut === "actif").length;
  const churn = ((state.abonnements.filter((a) => a.statut === "annule" || a.statut === "expire").length / state.abonnements.length) * 100).toFixed(1);
  const echecs = state.transactions.filter((t) => t.statut === "echoue").length;

  const resume = [
    { label: "Revenus (mois en cours)", valeur: formatMAD(revenuMtd) },
    { label: "Revenus (année)", valeur: formatMAD(revenuYtd) },
    { label: "Abonnés actifs", valeur: String(abonnesActifs) },
    { label: "Taux de churn", valeur: `${churn} %` },
    { label: "Paiements en échec", valeur: String(echecs) },
  ];

  const exporterCsv = () => {
    const entetes = ["id", "date", "client", "abonnement", "montant", "methode", "statut", "facture"];
    const lignes = state.transactions.map((t) =>
      [t.id, t.date, t.client, t.abonnementId, t.montant, t.methode, t.statut, t.facture].join(";"),
    );
    const blob = new Blob([[entetes.join(";"), ...lignes].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions-archbyai.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV généré.");
  };

  const columns: Column<Transaction>[] = [
    { key: "id", header: "Transaction", sortable: true, value: (r) => r.id, cell: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "date", header: "Date", sortable: true, value: (r) => r.date, cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.date}</span> },
    {
      key: "client",
      header: "Client",
      sortable: true,
      value: (r) => r.client,
      cell: (r) => (
        <Link to="/admin/utilisateurs/$id" params={{ id: r.clientId }} className="font-medium hover:text-primary">
          {r.client}
        </Link>
      ),
    },
    { key: "montant", header: "Montant", sortable: true, value: (r) => r.montant, cell: (r) => <span className="font-bold tabular-nums">{formatMAD(r.montant)}</span> },
    { key: "methode", header: "Méthode", cell: (r) => <span className="text-muted-foreground">{r.methode}</span> },
    { key: "statut", header: "Statut", cell: (r) => <StatusPill tone={statutMap[r.statut].tone}>{statutMap[r.statut].label}</StatusPill> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Détail de la transaction" onClick={() => setDetail(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          {r.statut === "echoue" && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Relancer le paiement"
              onClick={() => {
                changerStatutTransaction(r.id, "reussi");
                toast.success(`Paiement ${r.id} relancé avec succès.`);
              }}
            >
              <RotateCcw className="h-4 w-4 text-success" />
            </Button>
          )}
          {r.statut === "reussi" && (
            <Button variant="ghost" size="icon-sm" aria-label="Rembourser" onClick={() => setRemboursement(r)}>
              <Undo2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titre="Paiements"
        description="Toutes les transactions de la plateforme, avec relance et remboursement."
        actions={
          <Button variant="hero" onClick={exporterCsv}>
            <Download className="h-4 w-4" /> Exporter en CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {resume.map((r, i) => (
          <article
            key={r.label}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-rise rounded-2xl border border-border bg-card/85 p-4 shadow-soft backdrop-blur-sm"
          >
            <p className="text-xs font-medium text-muted-foreground">{r.label}</p>
            <p className="mt-1.5 text-xl font-extrabold tracking-tight">{r.valeur}</p>
          </article>
        ))}
      </div>

      <DataTable
        rows={state.transactions}
        columns={columns}
        loading={!ready}
        pageSize={10}
        searchPlaceholder="Rechercher une transaction, un client, une facture…"
        searchKeys={(r) => `${r.id} ${r.client} ${r.facture} ${r.methode}`}
        filters={[
          { id: "statut", label: "Statut", options: [
            { value: "reussi", label: "Réussi" },
            { value: "echoue", label: "Échec" },
            { value: "rembourse", label: "Remboursé" },
            { value: "en_attente", label: "En attente" },
          ] },
          { id: "methode", label: "Méthode", options: [
            { value: "Visa", label: "Visa" },
            { value: "Mastercard", label: "Mastercard" },
            { value: "Virement", label: "Virement CMI" },
          ] },
        ]}
        matchFilter={(row, groupId, value) =>
          groupId === "statut" ? row.statut === value : row.methode.startsWith(value)
        }
        emptyTitle="Aucune transaction"
        emptyDescription="Ajustez la recherche ou réinitialisez les filtres."
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction {detail?.id}</DialogTitle>
            <DialogDescription>Facture {detail?.facture}</DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className="space-y-3 text-sm">
              {[
                ["Client", detail.client],
                ["Abonnement", detail.abonnementId],
                ["Montant", formatMAD(detail.montant)],
                ["Méthode", detail.methode],
                ["Date", detail.date],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
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
                <Link to="/admin/utilisateurs/$id" params={{ id: detail.clientId }}>Fiche client</Link>
              </Button>
            )}
            <Button variant="hero" onClick={() => setDetail(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!remboursement} onOpenChange={(o) => !o && setRemboursement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rembourser {remboursement && formatMAD(remboursement.montant)} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le remboursement de la transaction {remboursement?.id} sera envoyé à {remboursement?.client}. Action irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (remboursement) changerStatutTransaction(remboursement.id, "rembourse");
                toast.success("Remboursement effectué.");
                setRemboursement(null);
              }}
            >
              Confirmer le remboursement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
