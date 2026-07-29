import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { Simulation } from "@/lib/mock-data";

/** La scène WebGL est chargée uniquement côté client (three.js n'est pas rendu en SSR). */
const Scene = lazy(() => import("@/components/plan-3d-scene"));

function Chargement({ message }: { message: string }) {
  return (
    <div className="grid h-[560px] place-items-center rounded-2xl border border-border bg-gradient-brand-soft">
      <div className="flex flex-col items-center gap-3 text-sm font-semibold text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        {message}
      </div>
    </div>
  );
}

/**
 * Maquette 3D temps réel (WebGL / three.js) : murs, cloisons, baies vitrées,
 * revêtements, éclairage solaire et ombres portées. Navigation 100 % souris.
 */
export function Plan3D(props: { simulation: Simulation; peinture: string; sol: string; eclairage: string }) {
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  if (!monte) return <Chargement message="Initialisation du moteur 3D…" />;

  return (
    <Suspense fallback={<Chargement message="Construction de la maquette…" />}>
      <Scene {...props} />
    </Suspense>
  );
}

export const OPTIONS_SOL = ["Carrelage", "Parquet", "Béton ciré", "Zellige"] as const;
export const OPTIONS_ECLAIRAGE = ["Chaud", "Neutre", "Froid"] as const;
export const OPTIONS_PEINTURE = [
  { nom: "Blanc cassé", valeur: "#f2ede4" },
  { nom: "Terre de Marrakech", valeur: "#c4714a" },
  { nom: "Bleu Majorelle", valeur: "#3b5bdb" },
  { nom: "Sable", valeur: "#d8c39a" },
  { nom: "Vert olive", valeur: "#6f7d4f" },
  { nom: "Gris ardoise", valeur: "#4b5563" },
];
