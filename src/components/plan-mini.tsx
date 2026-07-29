import { useMemo } from "react";
import { genererPieces } from "@/components/plan-2d";
import type { Simulation } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const GRID_W = 12;
const GRID_H = 8;
const UNITE = 60;

/** Aperçu schématique statique du plan (miniature du niveau RDC). */
export function PlanMini({
  simulation,
  etage = 0,
  className,
}: {
  simulation: Simulation;
  etage?: number;
  className?: string;
}) {
  const pieces = useMemo(() => genererPieces(simulation, etage), [simulation, etage]);
  const largeur = GRID_W * UNITE;
  const hauteur = GRID_H * UNITE;
  const echelle = Math.sqrt(simulation.superficie / Math.max(1, simulation.etages) / (GRID_W * GRID_H));

  return (
    <svg
      viewBox={`-14 -14 ${largeur + 28} ${hauteur + 28}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={`Aperçu schématique du plan ${simulation.reference}`}
    >
      <defs>
        <pattern id="mini-hachure" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="stroke-primary/40" strokeWidth={2} />
        </pattern>
      </defs>

      {/* trame technique */}
      <g className="stroke-border" strokeWidth={0.6} opacity={0.7}>
        {Array.from({ length: GRID_W + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i * UNITE} y1={0} x2={i * UNITE} y2={hauteur} />
        ))}
        {Array.from({ length: GRID_H + 1 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * UNITE} x2={largeur} y2={i * UNITE} />
        ))}
      </g>

      {/* murs extérieurs */}
      <rect x={0} y={0} width={largeur} height={hauteur} fill="url(#mini-hachure)" className="stroke-primary" strokeWidth={9} />
      <rect x={7} y={7} width={largeur - 14} height={hauteur - 14} className="fill-card stroke-primary/70" strokeWidth={2} />

      {/* pièces */}
      {pieces.map((p, i) => {
        const x = p.x * UNITE + 9;
        const y = p.y * UNITE + 9;
        const w = p.w * UNITE - 18;
        const h = p.h * UNITE - 18;
        const surface = (p.w * UNITE * echelle * (p.h * UNITE * echelle)) / (UNITE * UNITE);
        return (
          <g key={i} className="animate-rise" style={{ animationDelay: `${i * 45}ms` }}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={3}
              className="fill-primary/10 stroke-primary/45"
              strokeWidth={1.5}
            />
            {w > 70 && h > 42 && (
              <>
                <text x={x + w / 2} y={y + h / 2 - 3} textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
                  {p.nom}
                </text>
                <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {surface.toFixed(1)} m²
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* nord */}
      <g transform={`translate(${largeur - 26} 26)`}>
        <circle r={13} className="fill-card stroke-border" strokeWidth={1} />
        <path d="M0,-9 L4.5,6 L0,3 L-4.5,6 Z" className="fill-primary" />
        <text y={-15} textAnchor="middle" className="fill-muted-foreground text-[9px] font-bold">
          N
        </text>
      </g>
    </svg>
  );
}
