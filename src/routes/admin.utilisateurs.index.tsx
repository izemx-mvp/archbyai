import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, KeyRound, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
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
import type { ClientCompte } from "@/lib/billing-data";

export const Route = createFileRoute("/admin/utilisateurs/")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — Back-office ArchbyAI" },
      { name: "description", content: "Création, modification et suppression des comptes back-office et clients ArchbyAI." },
      { property: "og:title", content: "Utilisateurs — Back-office ArchbyAI" },
      { property: "og:description", content: "Gestion complète des comptes back-office et clients ArchbyAI." },
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

const dateFr = () => new Intl.DateTimeFormat("fr-FR").format(new Date());

const formulaireVide: Omit<ClientCompte, "id"> = {
  nom: "",
  email: "",
  societe: "",
  role: "Utilisateur",
  statut: "actif",
  espace: "client",
  inscription: dateFr(),
  derniereActivite: "—",
};

function AdminUtilisateurs() {
  const { state, ready, majClient, supprimerClient, creerClient } = useBilling();
  const [confirm, setConfirm] = useState<{ type: "suspendre" | "supprimer"; client: ClientCompte } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [edition, setEdition] = useState<ClientCompte | null>(null);
  const [form, setForm] = useState<Omit<ClientCompte, "id">>(formulaireVide);

  const ouvrirCreation = () => {
    setEdition(null);
    setForm(formulaireVide);
    setFormOpen(true);
  };

  const ouvrirEdition = (c: ClientCompte) => {
    setEdition(c);
    const { id: _id, ...reste } = c;
    setForm(reste);
    setFormOpen(true);
  };

  const enregistrer = () => {
    if (!form.nom.trim() || !form.email.trim()) {
      toast.error("Le nom et l'e-mail sont obligatoires.");
      return;
    }
    if (edition) {
      majClient(edition.id, form);
      toast.success(`Compte de ${form.nom} mis à jour.`);
    } else {
      const cree = creerClient(form);
      toast.success(`Compte ${cree.id} créé pour ${cree.nom}.`);
    }
    setFormOpen(false);
  };

  const backoffice = state.clients.filter((c) => c.espace === "back-office").length;

  const columns: Column<ClientCompte>[] = [
    {
      key: "nom",
      header: "Compte",
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
    {
      key: "espace",
      header: "Espace",
      cell: (r) => (
        <StatusPill tone={r.espace === "back-office" ? "brand" : "info"} dot={false}>
          {r.espace === "back-office" ? "Back-office" : "Client"}
        </StatusPill>
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
          <Button variant="ghost" size="icon-sm" aria-label="Modifier le compte" onClick={() => ouvrirEdition(r)}>
            <Pencil className="h-4 w-4" />
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
      <PageHeader
        titre="Gestion des utilisateurs"
        description={`${state.clients.length} comptes — dont ${backoffice} membres du back-office et ${state.clients.length - backoffice} clients.`}
        actions={
          <Button variant="hero" onClick={ouvrirCreation}>
            <Plus className="h-4 w-4" /> Nouvel utilisateur
          </Button>
        }
      />

      <DataTable
        rows={state.clients}
        columns={columns}
        loading={!ready}
        pageSize={10}
        searchPlaceholder="Rechercher un compte, une société, un e-mail…"
        searchKeys={(r) => `${r.nom} ${r.email} ${r.societe} ${r.role} ${r.espace}`}
        filters={[
          { id: "espace", label: "Espace", options: [
            { value: "back-office", label: "Back-office" },
            { value: "client", label: "Client" },
          ] },
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
        matchFilter={(row, groupId, value) =>
          groupId === "espace" ? row.espace === value : groupId === "statut" ? row.statut === value : row.role === value
        }
        emptyTitle="Aucun compte trouvé"
        emptyDescription="Ajustez la recherche ou réinitialisez les filtres."
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edition ? `Modifier ${edition.nom}` : "Nouvel utilisateur"}</DialogTitle>
            <DialogDescription>
              {edition ? "Mettez à jour les informations du compte." : "Créez un compte back-office ou client."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-nom">Nom complet</Label>
              <Input id="u-nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Salma El Amrani" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">E-mail</Label>
              <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="prenom.nom@societe.ma" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-societe">Société</Label>
              <Input id="u-societe" value={form.societe} onChange={(e) => setForm({ ...form, societe: e.target.value })} placeholder="Atlas Immobilier" />
            </div>
            <div className="space-y-1.5">
              <Label>Espace</Label>
              <Select value={form.espace} onValueChange={(v) => setForm({ ...form, espace: v as ClientCompte["espace"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="back-office">Back-office</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as ClientCompte["role"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrateur">Administrateur</SelectItem>
                  <SelectItem value="Architecte">Architecte</SelectItem>
                  <SelectItem value="Utilisateur">Utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v as ClientCompte["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="invite">Invité</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button variant="hero" onClick={enregistrer}>{edition ? "Enregistrer" : "Créer le compte"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                ? "Le compte et ses abonnements associés seront définitivement retirés de la plateforme."
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
