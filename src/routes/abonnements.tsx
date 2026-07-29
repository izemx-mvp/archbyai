import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/lib/store";
import type { ApiSubscription, Plan } from "@/lib/mock-data";

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

const API_OPTIONS = [
  "Génération plan 2D",
  "Rendu 3D temps réel",
  "Conformité normes MA",
  "Upload plan topographique",
  "Partage sécurisé",
  "Estimation coûts",
  "Personnalisation matériaux",
];

type FormState = { nom: string; client: string; plan: Plan; quota: string };
const emptyForm: FormState = { nom: "", client: "", plan: "Pro", quota: "10000" };

function AbonnementsPage() {
  const { state, ready, creerAbonnement, majAbonnement, supprimerAbonnement, journaliser, notifier } = useData();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [erreurs, setErreurs] = useState<Partial<Record<keyof FormState, string>>>({});
  const [aSupprimer, setASupprimer] = useState<ApiSubscription | null>(null);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(id);
  }, [ready]);

  const ouvrirCreation = () => {
    setEditId(null);
    setForm(emptyForm);
    setErreurs({});
    setOpen(true);
  };

  const ouvrirEdition = (row: ApiSubscription) => {
    setEditId(row.id);
    setForm({ nom: row.nom, client: row.client, plan: row.plan, quota: String(row.quota) });
    setErreurs({});
    setOpen(true);
  };

  const valider = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.client.trim()) e.client = "Le nom du client est obligatoire.";
    if (!form.nom) e.nom = "Sélectionnez une API.";
    const quota = Number(form.quota);
    if (!Number.isFinite(quota) || quota <= 0) e.quota = "Le quota doit être un nombre supérieur à 0.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = () => {
    if (!valider()) {
      toast.error("Veuillez corriger les champs en rouge.");
      return;
    }
    setSaving(true);
    const quota = Number(form.quota);
    window.setTimeout(() => {
      if (editId) {
        majAbonnement(editId, { nom: form.nom, client: form.client, plan: form.plan, quota });
        journaliser({ api: form.nom, action: "PATCH /v1/subscriptions", utilisateur: "m.toufella", code: 200, duree: 142 });
        toast.success(`Abonnement ${editId} mis à jour.`);
      } else {
        const cree = creerAbonnement({
          nom: form.nom,
          client: form.client,
          plan: form.plan,
          statut: "actif",
          quota,
          consomme: 0,
          latence: 0,
          renouvellement: new Intl.DateTimeFormat("fr-FR").format(
            new Date(Date.now() + 365 * 24 * 3600 * 1000),
          ),
        });
        journaliser({ api: form.nom, action: "POST /v1/subscriptions", utilisateur: "m.toufella", code: 201, duree: 318 });
        notifier({ titre: "Nouvel abonnement API", detail: `${form.client} · Plan ${form.plan}`, type: "info", to: "/abonnements" });
        toast.success(`Abonnement ${cree.id} créé.`);
      }
      setSaving(false);
      setOpen(false);
    }, 450);
  };

  const columns = useMemo<Column<ApiSubscription>[]>(
    () => [
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
      { key: "plan", header: "Plan", cell: (r) => <StatusPill tone="brand" dot={false}>{r.plan}</StatusPill> },
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
      { key: "statut", header: "Statut", cell: (r) => <StatusPill tone={statutLabel[r.statut].tone}>{statutLabel[r.statut].label}</StatusPill> },
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
              onClick={() => {
                const suspendre = r.statut === "actif";
                majAbonnement(r.id, { statut: suspendre ? "suspendu" : "actif" });
                journaliser({
                  api: r.nom,
                  action: suspendre ? "POST /v1/subscriptions/suspend" : "POST /v1/subscriptions/resume",
                  utilisateur: "m.toufella",
                  code: 200,
                  duree: 96,
                });
                suspendre ? toast.warning(`Abonnement ${r.id} suspendu.`) : toast.success(`Abonnement ${r.id} activé.`);
              }}
            >
              {r.statut === "actif" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Modifier l'abonnement" onClick={() => ouvrirEdition(r)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Supprimer l'abonnement"
              className="text-destructive"
              onClick={() => setASupprimer(r)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [majAbonnement, journaliser],
  );

  const exporter = () => {
    const entetes = ["id", "nom", "client", "plan", "statut", "quota", "consomme", "latence", "renouvellement"];
    const csv = [
      entetes.join(";"),
      ...state.apis.map((a) => entetes.map((k) => String(a[k as keyof ApiSubscription])).join(";")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "abonnements-archbyai.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${state.apis.length} abonnements exportés en CSV.`);
  };

  return (
    <AppShell>
      <PageHeader
        titre="Abonnements API"
        description="Gérez les abonnements aux API de la plateforme, leurs quotas et leurs plans."
        actions={
          <>
            <Button variant="outline" onClick={exporter}>
              <Download className="h-4 w-4" /> Exporter
            </Button>
            <Button variant="hero" onClick={ouvrirCreation}>
              <Plus className="h-4 w-4" /> Nouvel abonnement
            </Button>
          </>
        }
      />

      <DataTable
        rows={state.apis}
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
        matchFilter={(row, groupId, value) => (groupId === "statut" ? row.statut === value : row.plan === value)}
        emptyTitle="Aucun abonnement trouvé"
        emptyDescription="Modifiez les filtres ou créez un nouvel abonnement API."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? `Modifier ${editId}` : "Nouvel abonnement API"}</DialogTitle>
            <DialogDescription>Associez une API de la plateforme à un client et à un plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                placeholder="Nom du client"
                aria-invalid={!!erreurs.client}
                className="h-11 rounded-xl"
              />
              {erreurs.client && <p className="text-xs font-medium text-destructive">{erreurs.client}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="api">API</Label>
              <Select value={form.nom} onValueChange={(v) => setForm((f) => ({ ...f, nom: v }))}>
                <SelectTrigger id="api" className="h-11 rounded-xl" aria-invalid={!!erreurs.nom}>
                  <SelectValue placeholder="Choisir une API" />
                </SelectTrigger>
                <SelectContent>
                  {API_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erreurs.nom && <p className="text-xs font-medium text-destructive">{erreurs.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm((f) => ({ ...f, plan: v as Plan }))}>
                <SelectTrigger id="plan" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Découverte", "Pro", "Entreprise"] as Plan[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quota">Quota mensuel</Label>
              <Input
                id="quota"
                type="number"
                value={form.quota}
                onChange={(e) => setForm((f) => ({ ...f, quota: e.target.value }))}
                placeholder="10000"
                aria-invalid={!!erreurs.quota}
                className="h-11 rounded-xl"
              />
              {erreurs.quota && <p className="text-xs font-medium text-destructive">{erreurs.quota}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="hero" loading={saving} onClick={soumettre}>
              {editId ? "Enregistrer" : "Créer l'abonnement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'abonnement {aSupprimer?.id} ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'accès de « {aSupprimer?.client} » à l'API « {aSupprimer?.nom} » sera immédiatement révoqué. Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!aSupprimer) return;
                supprimerAbonnement(aSupprimer.id);
                journaliser({
                  api: aSupprimer.nom,
                  action: "DELETE /v1/subscriptions",
                  utilisateur: "m.toufella",
                  code: 200,
                  duree: 121,
                });
                toast.success(`Abonnement ${aSupprimer.id} supprimé.`);
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
