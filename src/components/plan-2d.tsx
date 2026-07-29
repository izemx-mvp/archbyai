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
  const chambres = etage === 0 ? Math.max(0, Math.ceil((sim.chambres ?? 0) / sim.etages)) : Math.floor((sim.chambres ?? 0) / sim.etages);
  const cuisines = etage === 0 ? Math.max(1, sim.cuisines ?? 1) : Math.max(0, (sim.cuisines ?? 1) - 1);
  const sanitaires = Math.max(1, Math.round((sim.sanitaires ?? 2) / sim.etages));
  const commercial = sim.type === "Commercial";

  const pieces: Piece[] = [];
  let x = 0;
  let y = 0;
  const pousser = (nom: string, w: number, h: number, ton: number) => {
    if (x + w > GRID_W) {
      x = 0;
      y += h;
    }
    if (y + h > GRID_H) return;
    pieces.push({ nom, x, y, w, h, ton });
    x += w;
  };

  if (commercial) {
    pousser(etage === 0 ? "Hall commercial" : "Plateau bureaux", 7, 4, 1);
    pousser("Réserve", 5, 4, 2);
  } else {
    pousser(etage === 0 ? "Séjour" : "Salon d'étage", 6, 4, 1);
    pousser("Cuisine", cuisines > 0 ? 3 : 0, 4, 2);
    pousser("Terrasse", 3, 4, 3);
  }

  for (let i = 0; i < chambres; i += 1) pousser(`Chambre ${i + 1}`, 3, 2, 4);
  for (let i = 0; i < sanitaires; i += 1) pousser(`Sanitaire ${i + 1}`, 2, 2, 5);
  if (sim.sousSol && etage === 0) pousser("Accès sous-sol", 2, 2, 6);
  if (sim.type === "Villa" && etage === 0 && sim.piscine) pousser("Piscine", 4, 2, 3);
  pousser("Circulation", GRID_W - (x % GRID_W || GRID_W) || 2, 2, 0);

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
