import { useState } from "react";
import { Check, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { StatusPill } from "@/components/status-pill";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBilling } from "@/lib/billing-store";
import { formatMAD, type PlanTarif } from "@/lib/billing-data";

const vide = {
  id: "",
  nom: "",
  accroche: "",
  prixMensuel: 0,
  prixAnnuel: 0,
  simulations: "",
  populaire: false,
  fonctionnalites: "",
};
type Formulaire = typeof vide;

const slug = (v: string) =>
  v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Onglet « Gestion des plans » : CRUD complet sur les offres tarifaires. */
export function AdminPlans() {
  const { state, creerPlan, majPlan, supprimerPlan } = useBilling();
  const [open, setOpen] = useState(false);
  const [edition, setEdition] = useState<PlanTarif | null>(null);
  const [form, setForm] = useState<Formulaire>(vide);
  const [suppression, setSuppression] = useState<PlanTarif | null>(null);

  const ouvrirCreation = () => {
    setEdition(null);
    setForm(vide);
    setOpen(true);
  };

  const ouvrirEdition = (p: PlanTarif) => {
    setEdition(p);
    setForm({
      id: String(p.id),
      nom: p.nom,
      accroche: p.accroche,
      prixMensuel: p.prixMensuel,
      prixAnnuel: p.prixAnnuel,
      simulations: p.simulations,
      populaire: !!p.populaire,
      fonctionnalites: p.fonctionnalites.join("\n"),
    });
    setOpen(true);
  };

  const enregistrer = () => {
    if (!form.nom.trim()) {
      toast.error("Le nom du plan est obligatoire.");
      return;
    }
    const donnees: PlanTarif = {
      id: edition ? String(edition.id) : slug(form.nom) || `plan-${Date.now()}`,
      nom: form.nom.trim(),
      accroche: form.accroche.trim(),
      prixMensuel: Number(form.prixMensuel) || 0,
      prixAnnuel: Number(form.prixAnnuel) || 0,
      simulations: form.simulations.trim() || "—",
      populaire: form.populaire,
      fonctionnalites: form.fonctionnalites.split("\n").map((f) => f.trim()).filter(Boolean),
    };
    if (edition) {
      majPlan(String(edition.id), donnees);
      toast.success(`Plan ${donnees.nom} mis à jour.`);
    } else {
      if (state.plans.some((p) => p.id === donnees.id)) {
        toast.error("Un plan portant ce nom existe déjà.");
        return;
      }
      creerPlan(donnees);
      toast.success(`Plan ${donnees.nom} créé.`);
    }
    setOpen(false);
  };

  const abonnesParPlan = (id: PlanTarif["id"]) => state.abonnements.filter((a) => a.plan === id).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {state.plans.length} offres tarifaires publiées sur la page Tarifs du front-office.
        </p>
        <Button variant="hero" onClick={ouvrirCreation}>
          <Plus className="h-4 w-4" /> Nouveau plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.plans.map((p, i) => (
          <article
            key={p.id}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-rise spotlight flex flex-col rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-extrabold tracking-tight">{p.nom}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.accroche}</p>
              </div>
              {p.populaire && (
                <StatusPill tone="brand" dot={false}>
                  <Star className="mr-1 h-3 w-3" /> Populaire
                </StatusPill>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight">{formatMAD(p.prixMensuel)}</span>
              <span className="text-xs text-muted-foreground">/ mois</span>
            </div>
            <p className="text-xs text-muted-foreground">{formatMAD(p.prixAnnuel)} / an · {p.simulations}</p>

            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {p.fonctionnalites.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {abonnesParPlan(p.id)} abonné{abonnesParPlan(p.id) > 1 ? "s" : ""}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={`Modifier le plan ${p.nom}`} onClick={() => ouvrirEdition(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Supprimer le plan ${p.nom}`} onClick={() => setSuppression(p)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edition ? `Modifier le plan ${edition.nom}` : "Nouveau plan"}</DialogTitle>
            <DialogDescription>Ces informations alimentent la page Tarifs et les abonnements.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-nom">Nom du plan</Label>
              <Input id="p-nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Pro" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-accroche">Accroche</Label>
              <Input id="p-accroche" value={form.accroche} onChange={(e) => setForm({ ...form, accroche: e.target.value })} placeholder="Pour les agences qui produisent des plans chaque semaine." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-mensuel">Prix mensuel (MAD)</Label>
              <Input id="p-mensuel" inputMode="numeric" value={form.prixMensuel} onChange={(e) => setForm({ ...form, prixMensuel: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-annuel">Prix annuel (MAD)</Label>
              <Input id="p-annuel" inputMode="numeric" value={form.prixAnnuel} onChange={(e) => setForm({ ...form, prixAnnuel: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-quota">Quota affiché</Label>
              <Input id="p-quota" value={form.simulations} onChange={(e) => setForm({ ...form, simulations: e.target.value })} placeholder="50 simulations / mois" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-fonc">Fonctionnalités (une par ligne)</Label>
              <Textarea id="p-fonc" rows={5} value={form.fonctionnalites} onChange={(e) => setForm({ ...form, fonctionnalites: e.target.value })} placeholder={"Génération de plans 2D\nExport DWG"} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2 sm:col-span-2">
              <Label htmlFor="p-pop" className="cursor-pointer">Mettre en avant (badge « Populaire »)</Label>
              <Switch id="p-pop" checked={form.populaire} onCheckedChange={(v) => setForm({ ...form, populaire: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="hero" onClick={enregistrer}>{edition ? "Enregistrer" : "Créer le plan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!suppression} onOpenChange={(o) => !o && setSuppression(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le plan {suppression?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {suppression && abonnesParPlan(suppression.id) > 0
                ? `${abonnesParPlan(suppression.id)} abonnement(s) utilisent encore ce plan : ils resteront actifs mais sans offre associée.`
                : "Le plan disparaîtra de la page Tarifs du front-office."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (suppression) supprimerPlan(String(suppression.id));
                toast.success("Plan supprimé.");
                setSuppression(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
