import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-parts";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { historique, type HistoriqueEntry } from "@/lib/mock-data";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique des appels — ArchbyAI Back-office" },
      {
        name: "description",
        content: "Consultez l'historique, l'état et le statut des appels aux API ArchbyAI.",
      },
      { property: "og:title", content: "Historique des appels — ArchbyAI Back-office" },
      { property: "og:description", content: "Historique, état et statut des appels aux API ArchbyAI." },
    ],
  }),
  component: HistoriquePage,
});

function HistoriquePage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(id);
  }, []);

  const columns: Column<HistoriqueEntry>[] = [
    { key: "date", header: "Date", sortable: true, value: (r) => r.date, cell: (r) => <span className="whitespace-nowrap font-medium">{r.date}</span> },
    { key: "api", header: "API", sortable: true, value: (r) => r.api, cell: (r) => <span className="truncate">{r.api}</span> },
    {
      key: "action",
      header: "Requête",
      cell: (r) => (
        <code className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{r.action}</code>
      ),
    },
    { key: "utilisateur", header: "Utilisateur", cell: (r) => <span className="truncate">{r.utilisateur}</span> },
    { key: "duree", header: "Durée", sortable: true, value: (r) => r.duree, cell: (r) => <span>{r.duree} ms</span> },
    {
      key: "code",
      header: "Code",
      sortable: true,
      value: (r) => r.code,
      cell: (r) => (
        <StatusPill tone={r.code < 300 ? "success" : r.code < 500 ? "warning" : "danger"}>{r.code}</StatusPill>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        titre="Historique des appels"
        description="Supervisez l'historique, l'état et le statut des API de la plateforme."
        actions={
          <Button variant="outline" onClick={() => toast.success("Journal exporté au format CSV.")}>
            <Download className="h-4 w-4" /> Exporter le journal
          </Button>
        }
      />

      <DataTable
        rows={historique}
        columns={columns}
        loading={loading}
        pageSize={6}
        searchPlaceholder="Rechercher un appel, une API, un utilisateur…"
        searchKeys={(r) => `${r.api} ${r.action} ${r.utilisateur} ${r.code}`}
        filters={[
          {
            id: "code",
            label: "Résultat",
            options: [
              { value: "succes", label: "Succès (2xx)" },
              { value: "client", label: "Erreur client (4xx)" },
              { value: "serveur", label: "Erreur serveur (5xx)" },
            ],
          },
        ]}
        matchFilter={(row, _g, value) =>
          value === "succes" ? row.code < 300 : value === "client" ? row.code >= 400 && row.code < 500 : row.code >= 500
        }
        emptyTitle="Aucun appel enregistré"
        emptyDescription="Aucun appel ne correspond à vos critères de recherche."
      />
    </AppShell>
  );
}
