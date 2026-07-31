import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/page-parts";
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
import { formatMAD, planParId, type ClientCompte } from "@/lib/billing-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/utilisateurs/$id")({
  head: () => ({
    meta: [
      { title: "Fiche client — Back-office ArchbyAI" },
      { name: "description", content: "Profil client ArchbyAI : abonnement, historique de paiement et actions d'administration." },
      { property: "og:title", content: "Fiche client — Back-office ArchbyAI" },
      { property: "og:description", content: "Profil, abonnement et paiements d'un client ArchbyAI." },
    ],
  }),
  component: FicheClient,
});

const statutMap: Record<ClientCompte["statut"], { label: string; tone: Tone }> = {
  actif: { label: "Actif", tone: "success" },
  suspendu: { label: "Suspendu", tone: "danger" },
  invite: { label: "Invité", tone: "info" },
};
const paiementTone: Record<string, Tone> = { reussi: "success", echoue: "danger", rembourse: "warning", en_attente: "info" };
const paiementLabel: Record<string, string> = { reussi: "Réussi", echoue: "Échec", rembourse: "Remboursé", en_attente: "En attente" };

function FicheClient() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { state, majClient, supprimerClient } = useBilling();
  const client = state.clients.find((c) => c.id === id);
  const [edition, setEdition] = useState(false);
  const [form, setForm] = useState({ nom: client?.nom ?? "", email: client?.email ?? "", societe: client?.societe ?? "", role: client?.role ?? "Utilisateur" });
  const [confirm, setConfirm] = useState<"suspendre" | "supprimer" | null>(null);

  if (!client) {
    return (
      <EmptyState
        icon={ArrowLeft}
        titre="Client introuvable"
        description="Ce compte n'existe plus dans la base de démonstration."
        actionLabel="Retour à la liste"
        onAction={() => navigate({ to: "/admin/utilisateurs" })}
      />
    );
  }

  const abonnements = state.abonnements.filter((a) => a.clientId === client.id);
  const paiements = state.transactions.filter((t) => t.clientId === client.id);

  return (
    <>
      <PageHeader
        titre={client.nom}
        description={`${client.societe} · client depuis le ${client.inscription}`}
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link to="/admin/utilisateurs">
                <ArrowLeft className="h-4 w-4" /> Liste
              </Link>
            </Button>
            <Button variant="outline" onClick={() => { setForm({ nom: client.nom, email: client.email, societe: client.societe, role: client.role }); setEdition(true); }}>
              <Pencil className="h-4 w-4" /> Modifier
            </Button>
            <Button variant="outline" onClick={() => toast.success(`Lien de réinitialisation envoyé à ${client.email}.`)}>
              <KeyRound className="h-4 w-4" /> Réinitialiser le mot de passe
            </Button>
            {client.statut === "suspendu" ? (
              <Button variant="hero" onClick={() => { majClient(client.id, { statut: "actif" }); toast.success("Compte réactivé."); }}>
                <Play className="h-4 w-4" /> Réactiver
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setConfirm("suspendre")}>
                <Pause className="h-4 w-4" /> Suspendre
              </Button>
            )}
            <Button variant="outline" onClick={() => setConfirm("supprimer")}>
              <Trash2 className="h-4 w-4 text-destructive" /> Supprimer
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="animate-rise rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 font-bold text-primary">
                {client.nom.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-bold">{client.nom}</p>
              <p className="truncate text-xs text-muted-foreground">{client.email}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            {[
              ["Identifiant", client.id],
              ["Société", client.societe],
              ["Rôle", client.role],
              ["Dernière activité", client.derniereActivite],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="truncate font-semibold">{v}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Statut</dt>
              <dd><StatusPill tone={statutMap[client.statut].tone}>{statutMap[client.statut].label}</StatusPill></dd>
            </div>
          </dl>
        </section>

        <section className="animate-rise rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm lg:col-span-2">
          <h2 className="text-sm font-bold">Abonnements</h2>
          {abonnements.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucun abonnement rattaché à ce compte.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {abonnements.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-4">
                  <div>
                    <p className="text-sm font-bold">Plan {planParId(a.plan).nom} · {a.periodicite}</p>
                    <p className="text-xs text-muted-foreground">{a.id} · renouvellement le {a.renouvellement}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums">{formatMAD(a.montant)}</span>
                    <StatusPill tone={a.statut === "actif" ? "success" : a.statut === "essai" ? "info" : a.statut === "annule" ? "warning" : "danger"}>
                      {a.statut === "actif" ? "Actif" : a.statut === "essai" ? "Essai" : a.statut === "annule" ? "Résilié" : "Expiré"}
                    </StatusPill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-soft backdrop-blur-sm">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-bold">Historique de paiement</h2>
        </div>
        {paiements.length === 0 ? (
          <EmptyState icon={KeyRound} titre="Aucun paiement" description="Ce client n'a encore réglé aucune facture." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-muted/70">
                <tr>
                  {["Transaction", "Date", "Montant", "Méthode", "Statut"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paiements.map((t, i) => (
                  <tr key={t.id} className={cn("border-t border-border", i % 2 === 1 && "bg-muted/25")}>
                    <td className="px-4 py-3 font-semibold">{t.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">{formatMAD(t.montant)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.methode}</td>
                    <td className="px-4 py-3"><StatusPill tone={paiementTone[t.statut]}>{paiementLabel[t.statut]}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={edition} onOpenChange={setEdition}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>Mise à jour des informations du compte (démonstration).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-nom">Nom complet</Label>
              <Input id="c-nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">E-mail</Label>
              <Input id="c-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-soc">Société</Label>
              <Input id="c-soc" value={form.societe} onChange={(e) => setForm({ ...form, societe: e.target.value })} />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdition(false)}>Annuler</Button>
            <Button
              variant="hero"
              onClick={() => {
                if (!form.nom.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) {
                  toast.error("Nom et adresse e-mail valides requis.");
                  return;
                }
                majClient(client.id, { nom: form.nom, email: form.email, societe: form.societe, role: form.role as ClientCompte["role"] });
                setEdition(false);
                toast.success("Fiche client mise à jour.");
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "supprimer" ? `Supprimer le compte de ${client.nom} ?` : `Suspendre le compte de ${client.nom} ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "supprimer"
                ? "Le compte et ses abonnements seront définitivement retirés de la démonstration."
                : "L'accès sera bloqué jusqu'à réactivation manuelle."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirm === "supprimer") {
                  supprimerClient(client.id);
                  toast.success("Compte supprimé.");
                  navigate({ to: "/admin/utilisateurs" });
                } else {
                  majClient(client.id, { statut: "suspendu" });
                  toast.warning("Compte suspendu.");
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
