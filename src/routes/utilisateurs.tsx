import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-parts";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { utilisateurs, type Utilisateur } from "@/lib/mock-data";

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

function UtilisateursPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(id);
  }, []);

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
        <div className="flex justify-end">
          <Button variant="ghost" size="icon-sm" aria-label="Envoyer un e-mail" onClick={() => toast.success(`Invitation renvoyée à ${r.email}`)}>
            <Mail className="h-4 w-4" />
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
          <Button variant="hero" onClick={() => toast.success("Invitation envoyée.")}>
            <UserPlus className="h-4 w-4" /> Inviter un utilisateur
          </Button>
        }
      />

      <DataTable
        rows={utilisateurs}
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
    </AppShell>
  );
}
