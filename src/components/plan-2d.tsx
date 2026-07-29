import { useCallback, useMemo, useRef, useState } from "react";
import type { Simulation } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Plan 2D façon CAO (ArchiCAD) : murs épais avec poché, portes avec arc de
 * débattement, fenêtres sur façades, chaînes de cotation, nord et échelle.
 * Navigation entièrement à la souris : glisser = panoramique, molette = zoom.
 */
export type Piece = { nom: string; x: number; y: number; w: number; h: number; ton: number };

const GRID_W = 12;
const GRID_H = 8;
const UNITE = 60;
const MUR_EXT = 9;
const MUR_INT = 5;

export function genererPieces(sim: Simulation, etage: number): Piece[] {
  const parEtage = (n: number) => Math.max(0, Math.round(n / sim.etages));
  const chambres = sim.type === "Commercial" ? 0 : Math.max(etage === 0 ? 1 : 0, parEtage(sim.chambres ?? 0));
  const cuisines = sim.type === "Commercial" ? 0 : Math.max(etage === 0 ? 1 : 0, parEtage(sim.cuisines ?? 1));
  const sanitaires = Math.max(1, parEtage(sim.sanitaires ?? 2));

  const specs: { nom: string; poids: number; ton: number }[] = [];
  if (sim.type === "Commercial") {
    specs.push({ nom: etage === 0 ? "Hall commercial" : "Plateau bureaux", poids: 3.2, ton: 1 });
    specs.push({ nom: "Réserve", poids: 1.6, ton: 2 });
    specs.push({ nom: "Bureau gestion", poids: 1.4, ton: 4 });
  } else {
    specs.push({ nom: etage === 0 ? "Séjour" : "Salon d'étage", poids: 2.6, ton: 1 });
    for (let i = 0; i < cuisines; i += 1)
      specs.push({ nom: cuisines > 1 ? `Cuisine ${i + 1}` : "Cuisine", poids: 1.4, ton: 2 });
    for (let i = 0; i < chambres; i += 1) specs.push({ nom: `Chambre ${i + 1}`, poids: 1.5, ton: 4 });
  }
  for (let i = 0; i < sanitaires; i += 1)
    specs.push({ nom: sanitaires > 1 ? `Sanitaire ${i + 1}` : "Sanitaire", poids: 0.9, ton: 5 });
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

  const total = specs.reduce((a, s) => a + s.poids, 0);
  const rangees = Math.max(1, Math.min(4, Math.round(Math.sqrt(specs.length))));
  const cible = total / rangees;

  const groupes: (typeof specs)[] = [[]];
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
  "color-mix(in oklab, var(--color-muted) 70%, transparent)",
  "color-mix(in oklab, var(--color-primary) 12%, transparent)",
  "color-mix(in oklab, var(--color-chart-2) 16%, transparent)",
  "color-mix(in oklab, var(--color-success) 13%, transparent)",
  "color-mix(in oklab, var(--color-chart-3) 15%, transparent)",
  "color-mix(in oklab, var(--color-info) 15%, transparent)",
  "color-mix(in oklab, var(--color-warning) 15%, transparent)",
];

/** Cote horizontale ou verticale avec tirets et valeur en mètres. */
function Cote({
  x1,
  y1,
  x2,
  y2,
  valeur,
  vertical,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  valeur: string;
  vertical?: boolean;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g className="stroke-muted-foreground" strokeWidth={1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#coteFin)" markerEnd="url(#coteFin)" />
      <line x1={x1} y1={vertical ? y1 : y1 - 5} x2={vertical ? x1 + 5 : x1} y2={vertical ? y1 : y1 + 5} />
      <line x1={x2} y1={vertical ? y2 : y2 - 5} x2={vertical ? x2 + 5 : x2} y2={vertical ? y2 : y2 + 5} />
      <text
        x={vertical ? mx - 6 : mx}
        y={vertical ? my : my - 6}
        textAnchor="middle"
        transform={vertical ? `rotate(-90 ${mx - 6} ${my})` : undefined}
        className="fill-muted-foreground stroke-none text-[10px] font-semibold tracking-wide"
      >
        {valeur}
      </text>
    </g>
  );
}

export function Plan2D({ simulation, etage }: { simulation: Simulation; etage: number }) {
  const pieces = useMemo(() => genererPieces(simulation, etage), [simulation, etage]);
  const largeur = GRID_W * UNITE;
  const hauteur = GRID_H * UNITE;
  const echelle = Math.sqrt(simulation.superficie / simulation.etages / (GRID_W * GRID_H));
  const metres = (u: number) => `${(u * UNITE * echelle * 0.0166 * 60) / 60 === 0 ? 0 : (u * echelle).toFixed(2)} m`;

  const [vue, setVue] = useState({ x: 0, y: 0, z: 1 });
  const [survol, setSurvol] = useState<number | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, ox: vue.x, oy: vue.y };
    },
    [vue.x, vue.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    setVue((v) => ({ ...v, x: d.ox + (e.clientX - d.x) / v.z, y: d.oy + (e.clientY - d.y) / v.z }));
  }, []);

  const finDrag = useCallback(() => {
    drag.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    setVue((v) => ({ ...v, z: Math.min(3.2, Math.max(0.5, v.z * (e.deltaY < 0 ? 1.12 : 0.89))) }));
  }, []);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`-70 -60 ${largeur + 150} ${hauteur + 150}`}
        className={cn(
          "h-auto w-full touch-none select-none rounded-xl bg-card transition-[filter] duration-300",
          drag.current ? "cursor-grabbing" : "cursor-grab",
        )}
        role="img"
        aria-label={`Plan 2D de la simulation ${simulation.reference}, étage ${etage}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finDrag}
        onPointerLeave={finDrag}
        onWheel={onWheel}
        onDoubleClick={() => setVue({ x: 0, y: 0, z: 1 })}
      >
        <defs>
          <pattern id="trame" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          </pattern>
          <pattern id="poche" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--color-primary)" opacity="0.9" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-card)" strokeWidth="1.6" opacity="0.35" />
          </pattern>
          <marker id="coteFin" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <circle cx="4" cy="4" r="1.6" fill="var(--color-muted-foreground)" />
          </marker>
        </defs>

        <rect x={-70} y={-60} width={largeur + 150} height={hauteur + 150} fill="url(#trame)" />

        <g transform={`translate(${largeur / 2} ${hauteur / 2}) scale(${vue.z}) translate(${vue.x - largeur / 2} ${vue.y - hauteur / 2})`}>
          {/* Dalle */}
          <rect x={0} y={0} width={largeur} height={hauteur} fill="var(--color-card)" />

          {/* Pièces + cloisons */}
          {pieces.map((p, i) => {
            const x = p.x * UNITE;
            const y = p.y * UNITE;
            const w = p.w * UNITE;
            const h = p.h * UNITE;
            const actif = survol === i;
            return (
              <g
                key={`${p.nom}-${i}`}
                className="animate-rise transition-opacity"
                style={{ animationDelay: `${i * 40}ms` }}
                onPointerEnter={() => setSurvol(i)}
                onPointerLeave={() => setSurvol((s) => (s === i ? null : s))}
              >
                <rect
                  x={x + MUR_INT / 2}
                  y={y + MUR_INT / 2}
                  width={Math.max(0, w - MUR_INT)}
                  height={Math.max(0, h - MUR_INT)}
                  fill={tons[p.ton]}
                  opacity={actif ? 1 : 0.85}
                  stroke={actif ? "var(--color-primary)" : "transparent"}
                  strokeWidth={1.5}
                />
                {/* Cloison : contour de la pièce */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeOpacity={0.55}
                  strokeWidth={MUR_INT}
                />
                {/* Porte : ouverture + arc de débattement sur le mur gauche */}
                {w > 60 && h > 50 && (
                  <g className="stroke-primary" fill="none">
                    <line x1={x} y1={y + h / 2 - 16} x2={x} y2={y + h / 2 + 16} stroke="var(--color-card)" strokeWidth={MUR_INT + 1} />
                    <path d={`M ${x} ${y + h / 2 + 16} A 32 32 0 0 1 ${x + 32} ${y + h / 2 - 16}`} strokeWidth={1.2} strokeOpacity={0.6} />
                    <line x1={x} y1={y + h / 2 + 16} x2={x + 32} y2={y + h / 2 + 16} strokeWidth={1.6} />
                  </g>
                )}
                <text
                  x={x + w / 2}
                  y={y + h / 2 - 3}
                  textAnchor="middle"
                  className="pointer-events-none fill-foreground text-[13px] font-bold"
                >
                  {p.nom}
                </text>
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 15}
                  textAnchor="middle"
                  className="pointer-events-none fill-muted-foreground text-[11px] font-medium"
                >
                  {Math.round(p.w * p.h * echelle * echelle * 10) / 10} m² ·{" "}
                  {(p.w * echelle).toFixed(1)}×{(p.h * echelle).toFixed(1)} m
                </text>
              </g>
            );
          })}

          {/* Murs porteurs extérieurs (poché) */}
          <rect
            x={-MUR_EXT / 2}
            y={-MUR_EXT / 2}
            width={largeur + MUR_EXT}
            height={hauteur + MUR_EXT}
            fill="none"
            stroke="url(#poche)"
            strokeWidth={MUR_EXT}
          />

          {/* Fenêtres sur les façades */}
          {Array.from({ length: Math.max(2, Math.min(6, simulation.facades ?? 3)) }).map((_, i, arr) => {
            const pas = largeur / (arr.length + 1);
            const cx = pas * (i + 1);
            return (
              <g key={`fen-${i}`}>
                <line x1={cx - 26} y1={0} x2={cx + 26} y2={0} stroke="var(--color-card)" strokeWidth={MUR_EXT + 2} />
                <line x1={cx - 26} y1={0} x2={cx + 26} y2={0} stroke="var(--color-info)" strokeWidth={2.4} />
                <line x1={cx - 26} y1={hauteur} x2={cx + 26} y2={hauteur} stroke="var(--color-card)" strokeWidth={MUR_EXT + 2} />
                <line x1={cx - 26} y1={hauteur} x2={cx + 26} y2={hauteur} stroke="var(--color-info)" strokeWidth={2.4} />
              </g>
            );
          })}

          {/* Chaînes de cotation */}
          <Cote x1={0} y1={-30} x2={largeur} y2={-30} valeur={metres(GRID_W)} />
          <Cote x1={-34} y1={0} x2={-34} y2={hauteur} valeur={metres(GRID_H)} vertical />

          {/* Nord */}
          <g transform={`translate(${largeur + 34} 12)`}>
            <circle r={16} cx={0} cy={12} fill="none" stroke="var(--color-border)" strokeWidth={1.2} />
            <path d="M0 -2 L6 20 L0 15 L-6 20 Z" className="fill-primary" />
            <text y={-8} textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold">
              N
            </text>
          </g>

          {/* Échelle graphique */}
          <g transform={`translate(0 ${hauteur + 44})`}>
            <rect width={UNITE} height={6} className="fill-primary" />
            <rect x={UNITE} width={UNITE} height={6} className="fill-muted-foreground" opacity={0.5} />
            <text y={20} className="fill-muted-foreground text-[10px] font-semibold">
              0
            </text>
            <text x={UNITE * 2} y={20} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold">
              {(2 * echelle).toFixed(1)} m
            </text>
          </g>
        </g>

        <text x={-60} y={hauteur + 78} className="fill-muted-foreground text-[12px]">
          Échelle indicative · {Math.round(simulation.superficie / simulation.etages)} m² à l&apos;étage {etage} ·
          normes urbaines marocaines · glisser pour déplacer, molette pour zoomer
        </text>
      </svg>

      <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-border bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
        Zoom {Math.round(vue.z * 100)}%
      </div>
    </div>
  );
}
