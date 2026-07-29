import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Home, Sparkles, Store, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Simulation } from "@/lib/mock-data";

export const Route = createFileRoute("/nouvelle-simulation")({
  head: () => ({
    meta: [
      { title: "Nouvelle simulation — ArchbyAI" },
      {
        name: "description",
        content:
          "Générez un plan d'architecture : logement non commercial, commercial ou villa, conforme aux normes marocaines.",
      },
      { property: "og:title", content: "Nouvelle simulation — ArchbyAI" },
      {
        property: "og:description",
        content: "Choisissez le type de logement et ses critères pour générer un plan 2D et 3D.",
      },
    ],
  }),
  component: NouvelleSimulationPage,
});

type TypeLogement = Simulation["type"];

const types: { valeur: TypeLogement; titre: string; texte: string; icone: typeof Home }[] = [
  { valeur: "Non commercial", titre: "Logement non commercial", texte: "Immeuble d'habitation, appartements par étage.", icone: Home },
  { valeur: "Commercial", titre: "Logement commercial", texte: "Locaux commerciaux, plateaux et réserves.", icone: Store },
  { valeur: "Villa", titre: "Villa", texte: "Maison individuelle avec jardin et piscine.", icone: Building2 },
];

const VILLES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès", "Oujda"];

type Criteres = {
  ville: string;
  superficie: number;
  etages: number;
  chambres: number;
  cuisines: number;
  sanitaires: number;
  facades: number;
  sousSol: boolean;
  appartementsParEtage: number;
  superficieJardin: number;
  piscine: boolean;
};

const defaut: Criteres = {
  ville: "Casablanca",
  superficie: 320,
  etages: 2,
  chambres: 4,
  cuisines: 1,
  sanitaires: 2,
  facades: 2,
  sousSol: false,
  appartementsParEtage: 2,
  superficieJardin: 150,
  piscine: false,
};

function ChampNombre({
  id,
  label,
  value,
  min = 0,
  onChange,
  suffixe,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
  suffixe?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {suffixe ? ` (${suffixe})` : ""}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 rounded-xl"
      />
    </div>
  );
}

function NouvelleSimulationPage() {
  const navigate = useNavigate();
  const { creerSimulation, journaliser, notifier } = useData();
  const [type, setType] = useState<TypeLogement>("Non commercial");
  const [c, setC] = useState<Criteres>(defaut);
  const [fichier, setFichier] = useState<string | null>(null);
  const [generation, setGeneration] = useState(false);

  const set = <K extends keyof Criteres>(k: K, v: Criteres[K]) => setC((p) => ({ ...p, [k]: v }));

  const generer = () => {
    if (c.superficie <= 0 || c.etages <= 0) {
      toast.error("La superficie et le nombre d'étages doivent être supérieurs à 0.");
      return;
    }
    setGeneration(true);
    window.setTimeout(() => {
      const sim = creerSimulation({
        type,
        ville: c.ville,
        superficie: c.superficie,
        etages: c.etages,
        chambres: type === "Commercial" ? 0 : c.chambres,
        statut: "generee",
        auteur: "Mohamed Toufella",
        sanitaires: c.sanitaires,
        cuisines: c.cuisines,
        facades: type === "Villa" ? undefined : c.facades,
        sousSol: c.sousSol,
        appartementsParEtage: type === "Villa" ? undefined : c.appartementsParEtage,
        superficieJardin: type === "Villa" ? c.superficieJardin : undefined,
        piscine: type === "Villa" ? c.piscine : undefined,
        planTopographique: fichier ?? undefined,
      });
      journaliser({
        api: "Génération plan 2D",
        action: "POST /v1/simulations",
        utilisateur: "m.toufella",
        code: 201,
        duree: 842,
      });
      notifier({
        titre: "Plan généré",
        detail: `${sim.reference} · ${type} · ${c.ville}`,
        type: "success",
        to: "/simulations",
      });
      setGeneration(false);
      toast.success(`Plan ${sim.reference} généré — vues 2D et 3D disponibles.`);
      navigate({ to: "/plan/$reference", params: { reference: sim.reference } });
    }, 900);
  };

  return (
    <AppShell intensity="normal">
      <PageHeader
        titre="Nouvelle simulation"
        description="Renseignez les critères de votre logement : le plan est généré en 2D puis visualisable en 3D, selon les normes et standards d'urbanisme marocains."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
            <h2 className="text-lg font-bold">1. Type de logement</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {types.map((t) => (
                <button
                  key={t.valeur}
                  type="button"
                  onClick={() => setType(t.valeur)}
                  className={cn(
                    "glow-card rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5",
                    type === t.valeur ? "border-primary bg-primary/8 shadow-glow" : "border-border bg-card/60",
                  )}
                >
                  <t.icone className={cn("h-5 w-5", type === t.valeur ? "text-primary" : "text-muted-foreground")} />
                  <p className="mt-2 font-semibold">{t.titre}</p>
                  <p className="text-xs text-muted-foreground">{t.texte}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
            <h2 className="text-lg font-bold">2. Critères de la simulation</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Select value={c.ville} onValueChange={(v) => set("ville", v)}>
                  <SelectTrigger id="ville" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VILLES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ChampNombre id="superficie" label="Superficie totale" suffixe="m²" value={c.superficie} onChange={(v) => set("superficie", v)} />
              <ChampNombre id="etages" label="Nombre d'étages" value={c.etages} min={1} onChange={(v) => set("etages", v)} />
              {type !== "Commercial" && (
                <ChampNombre id="chambres" label="Nombre de chambres" value={c.chambres} onChange={(v) => set("chambres", v)} />
              )}
              <ChampNombre id="cuisines" label="Nombre de cuisines" value={c.cuisines} onChange={(v) => set("cuisines", v)} />
              <ChampNombre id="sanitaires" label="Nombre de sanitaires" value={c.sanitaires} onChange={(v) => set("sanitaires", v)} />
              {type !== "Villa" && (
                <>
                  <ChampNombre id="facades" label="Nombre de façades" value={c.facades} onChange={(v) => set("facades", v)} />
                  <ChampNombre
                    id="appartements"
                    label="Appartements par étage"
                    value={c.appartementsParEtage}
                    onChange={(v) => set("appartementsParEtage", v)}
                  />
                </>
              )}
              {type === "Villa" && (
                <ChampNombre
                  id="jardin"
                  label="Superficie du jardin"
                  suffixe="m²"
                  value={c.superficieJardin}
                  onChange={(v) => set("superficieJardin", v)}
                />
              )}
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
                <span className="text-sm font-medium">Avec sous-sol</span>
                <Switch checked={c.sousSol} onCheckedChange={(v) => set("sousSol", v)} aria-label="Avec sous-sol" />
              </label>
              {type === "Villa" && (
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
                  <span className="text-sm font-medium">Avec piscine</span>
                  <Switch checked={c.piscine} onCheckedChange={(v) => set("piscine", v)} aria-label="Avec piscine" />
                </label>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
            <h2 className="font-bold">Plan topographique</h2>
            <p className="text-xs text-muted-foreground">Optionnel — importez votre plan existant pour affiner la génération.</p>
            <label className="mt-4 grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5">
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">{fichier ?? "Déposer ou sélectionner un fichier"}</span>
              <span className="text-xs text-muted-foreground">PDF, DWG, PNG ou JPG</span>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.dwg,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFichier(f.name);
                  toast.success(`${f.name} importé.`);
                }}
              />
            </label>
          </section>

          <section className="gradient-ring rounded-2xl border border-border bg-card/85 p-5 shadow-soft backdrop-blur-sm">
            <h2 className="font-bold">Génération IA</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              La simulation respecte les normes et standards d'architecture et d'urbanisme du Maroc. Elle reste une aide
              à la décision et doit être approuvée par un architecte.
            </p>
            <Button className="mt-4 w-full" variant="hero" loading={generation} onClick={generer}>
              <Sparkles className="h-4 w-4" /> Générer le plan d'architecture
            </Button>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
