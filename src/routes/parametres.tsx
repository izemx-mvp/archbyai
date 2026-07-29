import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Globe, KeyRound, Moon, Save, Shield, Sun } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — ArchbyAI Back-office" },
      {
        name: "description",
        content: "Configurez les accès aux plateformes, la sécurité et l'apparence du back-office ArchbyAI.",
      },
      { property: "og:title", content: "Paramètres — ArchbyAI Back-office" },
      { property: "og:description", content: "Configuration des accès, de la sécurité et de l'apparence ArchbyAI." },
    ],
  }),
  component: ParametresPage,
});

function Card({ titre, description, children }: { titre: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/85 p-6 shadow-soft backdrop-blur-sm animate-rise">
      <h2 className="text-lg font-bold">{titre}</h2>
      <p className="mb-5 text-sm text-muted-foreground">{description}</p>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ParametresPage() {
  const { setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      toast.success("Paramètres enregistrés.");
    }, 700);
  };

  return (
    <AppShell>
      <PageHeader
        titre="Paramètres"
        description="Configurez les accès aux plateformes, la sécurité et l'apparence de l'application."
        actions={
          <Button variant="hero" loading={saving} onClick={save}>
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        }
      />

      <Tabs defaultValue="plateformes">
        <TabsList className="h-11 rounded-xl">
          <TabsTrigger value="plateformes" className="rounded-lg">
            <Globe className="mr-2 h-4 w-4" /> Plateformes
          </TabsTrigger>
          <TabsTrigger value="securite" className="rounded-lg">
            <Shield className="mr-2 h-4 w-4" /> Sécurité
          </TabsTrigger>
          <TabsTrigger value="apparence" className="rounded-lg">
            <Sun className="mr-2 h-4 w-4" /> Apparence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plateformes" className="mt-4 space-y-4">
          <Card titre="Accès aux plateformes" description="Point d'entrée des API RESTful et hébergement des services.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endpoint">URL de la passerelle API</Label>
                <Input id="endpoint" defaultValue="https://api.archbyai.ma/v1" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hebergement">Mode d'hébergement</Label>
                <Select defaultValue="azure">
                  <SelectTrigger id="hebergement" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azure">Cloud Azure — App Service</SelectItem>
                    <SelectItem value="onpremise">Serveur on-premise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bdd">Base de données</Label>
                <Input id="bdd" defaultValue="MySQL 8.0 — archbyai_prod" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="charge">Charge simultanée maximale</Label>
                <Input id="charge" type="number" defaultValue={5000} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes d'exploitation</Label>
              <Textarea id="notes" rows={3} placeholder="Consignes internes…" className="rounded-xl" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="securite" className="mt-4 space-y-4">
          <Card titre="Sécurité & accès" description="Protégez la base de données et les données confidentielles.">
            {[
              { id: "mfa", label: "Authentification à deux facteurs", desc: "Obligatoire pour les administrateurs" },
              { id: "https", label: "Forcer HTTPS", desc: "Toutes les requêtes API sont chiffrées" },
              { id: "liens", label: "Liens de partage sécurisés", desc: "Simulations en lecture seule et expirables" },
              { id: "audit", label: "Journalisation d'audit", desc: "Conservation des journaux pendant 12 mois" },
            ].map((opt) => (
              <div key={opt.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{opt.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                <Switch defaultChecked aria-label={opt.label} />
              </div>
            ))}
            <Button variant="outline" onClick={() => toast.success("Nouvelle clé API générée.")}>
              <KeyRound className="h-4 w-4" /> Régénérer la clé API
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="apparence" className="mt-4 space-y-4">
          <Card titre="Apparence" description="Thème de l'interface, mémorisé sur cet appareil.">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setTheme("light")}
                className="hover-lift flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4 text-left"
              >
                <Sun className="h-5 w-5 text-brand" />
                <span>
                  <span className="block font-semibold">Mode clair</span>
                  <span className="block text-xs text-muted-foreground">Idéal en environnement lumineux</span>
                </span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className="hover-lift flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4 text-left"
              >
                <Moon className="h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">Mode sombre</span>
                  <span className="block text-xs text-muted-foreground">Confort visuel prolongé</span>
                </span>
              </button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
