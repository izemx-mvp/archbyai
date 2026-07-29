import { useMemo } from "react";
import type { Simulation } from "@/lib/mock-data";

/**
 * Générateur de plan 2D : dispose les pièces (chambres, cuisines, sanitaires,
 * séjour, circulation) sur une trame proportionnelle à la superficie de l'étage.
 */
type Piece = { nom: string; x: number; y: number; w: number; h: number; ton: number };

const GRID_W = 12;
const GRID_H = 8;

export function genererPieces(sim: Simulation, etage: number): Piece[] {
  const parEtage = (n: number) => Math.max(0, Math.round(n / sim.etages));
  const chambres = sim.type === "Commercial" ? 0 : Math.max(etage === 0 ? 1 : 0, parEtage(sim.chambres ?? 0));
  const cuisines = sim.type === "Commercial" ? 0 : Math.max(etage === 0 ? 1 : 0, parEtage(sim.cuisines ?? 1));
  const sanitaires = Math.max(1, parEtage(sim.sanitaires ?? 2));

  /** Chaque pièce reçoit un poids : la trame est ensuite remplie intégralement. */
  const specs: { nom: string; poids: number; ton: number }[] = [];
  if (sim.type === "Commercial") {
    specs.push({ nom: etage === 0 ? "Hall commercial" : "Plateau bureaux", poids: 3.2, ton: 1 });
    specs.push({ nom: "Réserve", poids: 1.6, ton: 2 });
    specs.push({ nom: "Bureau gestion", poids: 1.4, ton: 4 });
  } else {
    specs.push({ nom: etage === 0 ? "Séjour" : "Salon d'étage", poids: 2.6, ton: 1 });
    for (let i = 0; i < cuisines; i += 1) specs.push({ nom: cuisines > 1 ? `Cuisine ${i + 1}` : "Cuisine", poids: 1.4, ton: 2 });
    for (let i = 0; i < chambres; i += 1) specs.push({ nom: `Chambre ${i + 1}`, poids: 1.5, ton: 4 });
  }
  for (let i = 0; i < sanitaires; i += 1) specs.push({ nom: sanitaires > 1 ? `Sanitaire ${i + 1}` : "Sanitaire", poids: 0.9, ton: 5 });
  if (sim.type !== "Villa" && (sim.appartementsParEtage ?? 0) > 1)
    specs.push({ nom: `Palier · ${sim.appartementsParEtage} appts`, poids: 1, ton: 0 });
  if (sim.sousSol && etage === 0) specs.push({ nom: "Accès sous-sol", poids: 0.9, ton: 6 });
  if (sim.type === "Villa" && etage === 0) {
    specs.push({ nom: "Jardin", poids: 1.8, ton: 3 });
    if (sim.piscine) specs.push({ nom: "Piscine", poids: 1.3, ton: 3 });
  } else if (sim.type !== "Commercial") {
    specs.push({ nom: etage === 0 ? "Terrasse" : "Balcon", poids: 1.1, ton: 3 });
  }
  specs.push({ nom: "Circulation", poids: 1.2, ton: 0 });

  // Répartition en rangées de poids équilibré, puis remplissage exact de la trame.
  const total = specs.reduce((a, s) => a + s.poids, 0);
  const rangees = Math.max(1, Math.min(4, Math.round(Math.sqrt(specs.length))));
  const cible = total / rangees;

  const groupes: typeof specs[] = [[]];
  let cumul = 0;
  specs.forEach((sp) => {
    const g = groupes[groupes.length - 1];
    if (g.length && cumul + sp.poids / 2 > cible && groupes.length < rangees) {
      groupes.push([sp]);
      cumul = sp.poids;
    } else {
      g.push(sp);
      cumul += sp.poids;
    }
  });

  const pieces: Piece[] = [];
  const hauteurRangee = GRID_H / groupes.length;
  groupes.forEach((groupe, r) => {
    const poidsRangee = groupe.reduce((a, s) => a + s.poids, 0);
    let x = 0;
    groupe.forEach((sp, i) => {
      const w = i === groupe.length - 1 ? GRID_W - x : (sp.poids / poidsRangee) * GRID_W;
      pieces.push({ nom: sp.nom, x, y: r * hauteurRangee, w, h: hauteurRangee, ton: sp.ton });
      x += w;
    });
  });

  return pieces;
}

const tons = [
  "var(--color-muted)",
  "color-mix(in oklab, var(--color-primary) 16%, transparent)",
  "color-mix(in oklab, var(--color-chart-2) 20%, transparent)",
  "color-mix(in oklab, var(--color-success) 16%, transparent)",
  "color-mix(in oklab, var(--color-chart-3) 18%, transparent)",
  "color-mix(in oklab, var(--color-info) 18%, transparent)",
  "color-mix(in oklab, var(--color-warning) 18%, transparent)",
];

export function Plan2D({ simulation, etage }: { simulation: Simulation; etage: number }) {
  const pieces = useMemo(() => genererPieces(simulation, etage), [simulation, etage]);
  const unite = 60;
  const largeur = GRID_W * unite;
  const hauteur = GRID_H * unite;
  const echelle = Math.sqrt(simulation.superficie / simulation.etages / (GRID_W * GRID_H));

  return (
    <svg
      viewBox={`-20 -20 ${largeur + 40} ${hauteur + 60}`}
      className="h-auto w-full rounded-xl bg-card"
      role="img"
      aria-label={`Plan 2D de la simulation ${simulation.reference}, étage ${etage}`}
    >
      <defs>
        <pattern id="trame" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect x={-20} y={-20} width={largeur + 40} height={hauteur + 60} fill="url(#trame)" />
      <rect
        x={0}
        y={0}
        width={largeur}
        height={hauteur}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={6}
        rx={4}
      />
      {pieces.map((p, i) => (
        <g key={`${p.nom}-${i}`} className="animate-rise" style={{ animationDelay: `${i * 45}ms` }}>
          <rect
            x={p.x * unite}
            y={p.y * unite}
            width={p.w * unite}
            height={p.h * unite}
            fill={tons[p.ton]}
            stroke="var(--color-primary)"
            strokeWidth={2}
          />
          <text
            x={p.x * unite + (p.w * unite) / 2}
            y={p.y * unite + (p.h * unite) / 2 - 4}
            textAnchor="middle"
            className="fill-foreground text-[13px] font-semibold"
          >
            {p.nom}
          </text>
          <text
            x={p.x * unite + (p.w * unite) / 2}
            y={p.y * unite + (p.h * unite) / 2 + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {Math.round(p.w * p.h * echelle * echelle * 10) / 10} m²
          </text>
        </g>
      ))}
      <text x={0} y={hauteur + 30} className="fill-muted-foreground text-[13px]">
        Échelle indicative · {Math.round(simulation.superficie / simulation.etages)} m² à l'étage {etage} ·
        normes urbaines marocaines
      </text>
    </svg>
  );
}
