import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
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
import { useData } from "@/lib/store";
import type { Utilisateur } from "@/lib/mock-data";

export const Route = createFileRoute("/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — ArchbyAI Back-office" },
      {
        name: "description",
        content: "Gérez les accès administrateurs, architectes et utilisateurs de la plateforme ArchbyAI.",
      },
      { property: "og:title", content: "Utilisateurs — ArchbyAI Back-office" },
      { property: "og:description", content: "Gestion des accès et des rôles utilisateurs de la plateforme ArchbyAI." },
    ],
  }),
  component: UtilisateursPage,
});

const statutMap: Record<Utilisateur["statut"], { label: string; tone: Tone }> = {
  actif: { label: "Actif", tone: "success" },
  invite: { label: "Invité", tone: "info" },
  desactive: { label: "Désactivé", tone: "danger" },
};

const initiales = (nom: string) =>
  nom
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

type Role = Utilisateur["role"];
type FormState = { nom: string; email: string; role: Role; statut: Utilisateur["statut"] };
const emptyForm: FormState = { nom: "", email: "", role: "Utilisateur", statut: "invite" };

function UtilisateursPage() {
  const { state, ready, inviterUtilisateur, majUtilisateur, supprimerUtilisateur, notifier } = useData();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [erreurs, setErreurs] = useState<Partial<Record<keyof FormState, string>>>({});
  const [aSupprimer, setASupprimer] = useState<Utilisateur | null>(null);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(id);
  }, [ready]);

  const soumettre = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.nom.trim()) e.nom = "Le nom complet est obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = "Adresse e-mail invalide.";
    else if (state.utilisateurs.some((u) => u.email === form.email && u.id !== editId))
      e.email = "Cette adresse est déjà utilisée.";
    setErreurs(e);
    if (Object.keys(e).length) {
      toast.error("Veuillez corriger les champs en rouge.");
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      if (editId) {
        majUtilisateur(editId, { nom: form.nom, email: form.email, role: form.role, statut: form.statut });
        toast.success(`Profil de ${form.nom} mis à jour.`);
      } else {
        inviterUtilisateur({ nom: form.nom, email: form.email, role: form.role, statut: "invite" });
        notifier({ titre: "Utilisateur invité", detail: `${form.nom} · ${form.role}`, type: "success", to: "/utilisateurs" });
        toast.success(`Invitation envoyée à ${form.email}.`);
      }
      setSaving(false);
      setOpen(false);
    }, 450);
  };

  const columns: Column<Utilisateur>[] = [
    {
      key: "nom",
      header: "Utilisateur",
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
    { key: "role", header: "Rôle", cell: (r) => <StatusPill tone="brand" dot={false}>{r.role}</StatusPill> },
    { key: "statut", header: "Statut", cell: (r) => <StatusPill tone={statutMap[r.statut].tone}>{statutMap[r.statut].label}</StatusPill> },
    {
      key: "derniereConnexion",
      header: "Dernière connexion",
      sortable: true,
      value: (r) => r.derniereConnexion,
      cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.derniereConnexion}</span>,
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
            aria-label="Renvoyer l'invitation"
            onClick={() => {
              majUtilisateur(r.id, { statut: r.statut === "desactive" ? "invite" : r.statut });
              toast.success(`Invitation renvoyée à ${r.email}.`);
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Modifier l'utilisateur"
            onClick={() => {
              setEditId(r.id);
              setForm({ nom: r.nom, email: r.email, role: r.role, statut: r.statut });
              setErreurs({});
              setOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer l'utilisateur"
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
        titre="Utilisateurs"
        description="Configurez les accès à la plateforme et les rôles de chaque intervenant."
        actions={
          <Button
            variant="hero"
            onClick={() => {
              setEditId(null);
              setForm(emptyForm);
              setErreurs({});
              setOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" /> Inviter un utilisateur
          </Button>
        }
      />

      <DataTable
        rows={state.utilisateurs}
        columns={columns}
        loading={loading}
        searchPlaceholder="Rechercher un nom, un e-mail…"
        searchKeys={(r) => `${r.nom} ${r.email} ${r.role}`}
        filters={[
          {
            id: "role",
            label: "Rôle",
            options: [
              { value: "Administrateur", label: "Administrateur" },
              { value: "Architecte", label: "Architecte" },
              { value: "Utilisateur", label: "Utilisateur" },
            ],
          },
          {
            id: "statut",
            label: "Statut",
            options: [
              { value: "actif", label: "Actif" },
              { value: "invite", label: "Invité" },
              { value: "desactive", label: "Désactivé" },
            ],
          },
        ]}
        matchFilter={(row, groupId, value) => (groupId === "role" ? row.role === value : row.statut === value)}
        emptyTitle="Aucun utilisateur"
        emptyDescription="Invitez un premier utilisateur pour lui donner accès à la plateforme."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier l'utilisateur" : "Inviter un utilisateur"}</DialogTitle>
            <DialogDescription>
              {editId
                ? "Mettez à jour le profil, le rôle et le statut d'accès."
                : "L'utilisateur recevra une invitation par e-mail pour activer son compte."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Salma El Amrani"
                aria-invalid={!!erreurs.nom}
                className="h-11 rounded-xl"
              />
              {erreurs.nom && <p className="text-xs font-medium text-destructive">{erreurs.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="prenom.nom@archbyai.ma"
                aria-invalid={!!erreurs.email}
                className="h-11 rounded-xl"
              />
              {erreurs.email && <p className="text-xs font-medium text-destructive">{erreurs.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}>
                <SelectTrigger id="role" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Administrateur", "Architecte", "Utilisateur"] as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editId && (
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={form.statut}
                  onValueChange={(v) => setForm((f) => ({ ...f, statut: v as Utilisateur["statut"] }))}
                >
                  <SelectTrigger id="statut" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="invite">Invité</SelectItem>
                    <SelectItem value="desactive">Désactivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="hero" loading={saving} onClick={soumettre}>
              {editId ? "Enregistrer" : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {aSupprimer?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'accès de cet utilisateur à la plateforme sera immédiatement révoqué.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!aSupprimer) return;
                supprimerUtilisateur(aSupprimer.id);
                toast.success(`${aSupprimer.nom} a été supprimé.`);
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
