import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/page-parts";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBilling } from "@/lib/billing-store";
import {
  compteCourant,
  formatMAD,
  planParId,
  plans,
  type MoyenPaiement,
  type PlanId,
  type Periodicite,
  type StatutAbonnement,
} from "@/lib/billing-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mon-abonnement")({
  head: () => ({
    meta: [
      { title: "Mon abonnement — ArchbyAI" },
      {
        name: "description",
        content:
          "Gérez votre abonnement ArchbyAI : plan en cours, moyens de paiement, factures et résiliation en libre-service.",
      },
      { property: "og:title", content: "Mon abonnement — ArchbyAI" },
      { property: "og:description", content: "Plan, paiement et factures de votre compte ArchbyAI." },
    ],
  }),
  component: MonAbonnementPage,
});

const statutMap: Record<StatutAbonnement, { label: string; tone: Tone }> = {
  actif: { label: "Actif", tone: "success" },
  essai: { label: "Période d'essai", tone: "info" },
  annule: { label: "Résilié", tone: "warning" },
  expire: { label: "Expiré", tone: "danger" },
};

const paiementTone: Record<string, Tone> = {
  reussi: "success",
  echoue: "danger",
  rembourse: "warning",
  en_attente: "info",
};
const paiementLabel: Record<string, string> = {
  reussi: "Payée",
  echoue: "Échec",
  rembourse: "Remboursée",
  en_attente: "En attente",
};

function MonAbonnementPage() {
  const {
    state,
    changerPlan,
    changerStatutAbonnement,
    ajouterMoyen,
    majMoyen,
    definirDefaut,
    supprimerMoyen,
  } = useBilling();

  const abonnement = state.abonnements.find((a) => a.id === compteCourant.abonnementId);
  const factures = state.transactions.filter((t) => t.clientId === compteCourant.clientId);

  const [dialogPlan, setDialogPlan] = useState(false);
  const [nouveauPlan, setNouveauPlan] = useState<PlanId>(abonnement?.plan ?? "pro");
  const [nouvellePeriode, setNouvellePeriode] = useState<Periodicite>(abonnement?.periodicite ?? "mensuel");
  const [confirmAnnulation, setConfirmAnnulation] = useState(false);
  const [moyenDialog, setMoyenDialog] = useState<{ open: boolean; edit?: MoyenPaiement }>({ open: false });
  const [moyenASupprimer, setMoyenASupprimer] = useState<MoyenPaiement | null>(null);
  const [carte, setCarte] = useState({ titulaire: "", numero: "", expiration: "", marque: "Visa" as MoyenPaiement["marque"] });

  if (!abonnement) return null;
  const plan = planParId(abonnement.plan);
  const prixCible =
    nouvellePeriode === "mensuel" ? planParId(nouveauPlan).prixMensuel : planParId(nouveauPlan).prixAnnuel;
  const proratisation = Math.round((prixCible - abonnement.montant) * 0.6);

  const ouvrirMoyen = (edit?: MoyenPaiement) => {
    setCarte(
      edit
        ? { titulaire: edit.titulaire, numero: `•••• •••• •••• ${edit.fin}`, expiration: edit.expiration, marque: edit.marque }
        : { titulaire: "", numero: "", expiration: "", marque: "Visa" },
    );
    setMoyenDialog({ open: true, edit });
  };

  const enregistrerMoyen = () => {
    const chiffres = carte.numero.replace(/\D/g, "");
    if (!carte.titulaire.trim() || chiffres.length < 4 || !/^\d{2}\/\d{4}$/.test(carte.expiration)) {
      toast.error("Vérifiez le titulaire, le numéro de carte et la date (MM/AAAA).");
      return;
    }
    const fin = chiffres.slice(-4);
    if (moyenDialog.edit) {
      majMoyen(moyenDialog.edit.id, { titulaire: carte.titulaire, expiration: carte.expiration, marque: carte.marque, fin });
      toast.success("Moyen de paiement mis à jour.");
    } else {
      ajouterMoyen({ titulaire: carte.titulaire, expiration: carte.expiration, marque: carte.marque, fin, defaut: state.moyensPaiement.length === 0 });
      toast.success("Carte ajoutée à votre compte.");
    }
    setMoyenDialog({ open: false });
  };

  return (
    <AppShell intensity="normal">
      <PageHeader
        titre="Mon abonnement"
        description="Plan en cours, moyens de paiement et historique de facturation."
        actions={
          <Button variant="outline" asChild>
            <Link to="/tarifs">
              Voir les plans <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="hover-lift animate-rise relative overflow-hidden rounded-2xl border border-border bg-card/85 p-6 shadow-soft backdrop-blur-sm lg:col-span-2">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Votre plan</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Plan {plan.nom}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.simulations} · facturation {abonnement.periodicite === "mensuel" ? "mensuelle" : "annuelle"}</p>
            </div>
            <StatusPill tone={statutMap[abonnement.statut].tone}>{statutMap[abonnement.statut].label}</StatusPill>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Montant", valeur: formatMAD(abonnement.montant), icon: CreditCard },
              { label: abonnement.statut === "annule" ? "Fin d'accès" : "Prochain renouvellement", valeur: abonnement.renouvellement, icon: CalendarClock },
              { label: "Depuis le", valeur: abonnement.debut, icon: FileText },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-muted/25 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5" /> {item.label}
                </div>
                <p className="mt-1.5 text-lg font-bold tracking-tight">{item.valeur}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Simulations consommées ce cycle</span>
              <span>92 / 150</span>
            </div>
            <Progress value={61} className="mt-2 h-2" />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="hero" onClick={() => setDialogPlan(true)}>
              Changer de plan
            </Button>
            {abonnement.statut === "annule" || abonnement.statut === "expire" ? (
              <Button
                variant="outline"
                onClick={() => {
                  changerStatutAbonnement(abonnement.id, "actif");
                  toast.success("Abonnement réactivé. Bon retour parmi nous !");
                }}
              >
                <RotateCcw className="h-4 w-4" /> Réactiver l'abonnement
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setConfirmAnnulation(true)}>
                <XCircle className="h-4 w-4" /> Résilier
              </Button>
            )}
          </div>
        </section>

        <section className="animate-rise overflow-hidden rounded-2xl border border-border bg-card/85 shadow-soft backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border p-4">
            <h2 className="text-sm font-bold">Moyens de paiement</h2>
            <Button variant="ghost" size="sm" onClick={() => ouvrirMoyen()}>
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          {state.moyensPaiement.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              titre="Aucune carte enregistrée"
              description="Ajoutez une carte pour automatiser le renouvellement de votre abonnement."
              actionLabel="Ajouter une carte"
              onAction={() => ouvrirMoyen()}
            />
          ) : (
            <ul className="divide-y divide-border">
              {state.moyensPaiement.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-14 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-[10px] font-extrabold uppercase">
                    {m.marque}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">•••• {m.fin}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.titulaire} · exp. {m.expiration}
                    </p>
                  </div>
                  {m.defaut ? (
                    <StatusPill tone="success" dot={false}>Par défaut</StatusPill>
                  ) : (
                    <Button variant="ghost" size="icon-sm" aria-label="Définir par défaut" onClick={() => { definirDefaut(m.id); toast.success(`Carte •••• ${m.fin} définie par défaut.`); }}>
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label="Modifier la carte" onClick={() => ouvrirMoyen(m)}>
                    <CreditCard className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Supprimer la carte" onClick={() => setMoyenASupprimer(m)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-soft backdrop-blur-sm">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-bold">Historique de facturation</h2>
          <p className="text-xs text-muted-foreground">Vos factures et paiements ArchbyAI.</p>
        </div>
        {factures.length === 0 ? (
          <EmptyState
            icon={FileText}
            titre="Aucune facture pour le moment"
            description="Vos factures apparaîtront ici dès le premier prélèvement de votre abonnement."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
                <tr>
                  {["Facture", "Date", "Montant", "Statut", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f, i) => (
                  <tr key={f.id} className={cn("border-t border-border transition-colors hover:bg-accent/45", i % 2 === 1 && "bg-muted/25")}>
                    <td className="px-4 py-3.5 font-semibold">{f.facture}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{f.date}</td>
                    <td className="px-4 py-3.5 font-bold tabular-nums">{formatMAD(f.montant)}</td>
                    <td className="px-4 py-3.5">
                      <StatusPill tone={paiementTone[f.statut]}>{paiementLabel[f.statut]}</StatusPill>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => toast.success(`Facture ${f.facture} téléchargée (PDF).`)}>
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Changement de plan */}
      <Dialog open={dialogPlan} onOpenChange={setDialogPlan}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer de plan</DialogTitle>
            <DialogDescription>Le changement prend effet immédiatement, au prorata du cycle en cours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={nouveauPlan} onValueChange={(v) => setNouveauPlan(v as PlanId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Périodicité</Label>
              <Select value={nouvellePeriode} onValueChange={(v) => setNouvellePeriode(v as Periodicite)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuel">Mensuelle</SelectItem>
                  <SelectItem value="annuel">Annuelle (–2 mois)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-border bg-muted/25 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nouveau montant</span><span className="font-bold">{formatMAD(prixCible)}</span></div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-muted-foreground">Ajustement au prorata</span>
                <span className={cn("font-bold", proratisation >= 0 ? "text-warning-foreground dark:text-warning" : "text-success")}>
                  {proratisation >= 0 ? "+" : "−"} {formatMAD(Math.abs(proratisation))}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPlan(false)}>Annuler</Button>
            <Button
              variant="hero"
              onClick={() => {
                changerPlan(abonnement.id, nouveauPlan, nouvellePeriode, prixCible);
                setDialogPlan(false);
                toast.success(`Plan ${planParId(nouveauPlan).nom} activé.`);
              }}
            >
              Confirmer le changement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Carte */}
      <Dialog open={moyenDialog.open} onOpenChange={(o) => setMoyenDialog({ open: o })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{moyenDialog.edit ? "Modifier la carte" : "Ajouter une carte"}</DialogTitle>
            <DialogDescription>Démonstration : aucune donnée bancaire réelle n'est transmise.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titulaire">Titulaire</Label>
              <Input id="titulaire" value={carte.titulaire} onChange={(e) => setCarte({ ...carte, titulaire: e.target.value })} placeholder="Nom sur la carte" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero">Numéro de carte</Label>
              <Input id="numero" value={carte.numero} onChange={(e) => setCarte({ ...carte, numero: e.target.value })} placeholder="4242 4242 4242 4242" inputMode="numeric" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exp">Expiration</Label>
                <Input id="exp" value={carte.expiration} onChange={(e) => setCarte({ ...carte, expiration: e.target.value })} placeholder="09/2028" />
              </div>
              <div className="space-y-1.5">
                <Label>Réseau</Label>
                <Select value={carte.marque} onValueChange={(v) => setCarte({ ...carte, marque: v as MoyenPaiement["marque"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="CMI">CMI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoyenDialog({ open: false })}>Annuler</Button>
            <Button variant="hero" onClick={enregistrerMoyen}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Résiliation */}
      <AlertDialog open={confirmAnnulation} onOpenChange={setConfirmAnnulation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Résilier votre abonnement {plan.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous conservez l'accès jusqu'au {abonnement.renouvellement}. Vos plans 2D/3D restent consultables,
              mais la génération de nouvelles simulations sera désactivée. Vous pouvez réactiver à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester abonné</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                changerStatutAbonnement(abonnement.id, "annule");
                toast.warning("Abonnement résilié.", { description: `Accès maintenu jusqu'au ${abonnement.renouvellement}.` });
              }}
            >
              Confirmer la résiliation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suppression carte */}
      <AlertDialog open={!!moyenASupprimer} onOpenChange={(o) => !o && setMoyenASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la carte •••• {moyenASupprimer?.fin} ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible dans cette démonstration.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (moyenASupprimer) supprimerMoyen(moyenASupprimer.id);
                toast.success("Moyen de paiement supprimé.");
                setMoyenASupprimer(null);
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
