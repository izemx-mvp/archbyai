import { useCallback, useEffect, useRef, useState } from "react";
import type { Simulation } from "@/lib/mock-data";

const sols: Record<string, string> = {
  Carrelage: "repeating-conic-gradient(#d8d3ca 0% 25%, #efece6 0% 50%) 0 0/44px 44px",
  Parquet: "repeating-linear-gradient(90deg,#b07a45 0 22px,#9c6a3a 22px 24px)",
  "Béton ciré": "linear-gradient(135deg,#b9b6b1,#8f8c87)",
  Zellige: "repeating-conic-gradient(#1f6f8b 0% 25%, #e9e2d0 0% 50%) 0 0/28px 28px",
};

const eclairages: Record<string, { teinte: string; force: number; ambiance: number }> = {
  Chaud: { teinte: "#ffb457", force: 0.55, ambiance: 1.04 },
  Neutre: { teinte: "#ffffff", force: 0.34, ambiance: 1 },
  Froid: { teinte: "#8ec9ff", force: 0.45, ambiance: 0.96 },
};

/**
 * Vue 3D isométrique en CSS 3D (sans WebGL, 60 fps).
 * Navigation 100 % souris : glisser = orbite, molette = zoom, double-clic = recadrage.
 * Amortissement par requestAnimationFrame pour un rendu fluide façon ArchiCAD.
 */
export function Plan3D({
  simulation,
  peinture,
  sol,
  eclairage,
}: {
  simulation: Simulation;
  peinture: string;
  sol: string;
  eclairage: string;
}) {
  const etages = Math.min(6, Math.max(1, simulation.etages));
  const lum = eclairages[eclairage] ?? eclairages.Neutre;
  const scene = useRef<HTMLDivElement>(null);

  /** Cible pilotée par la souris ; la caméra la rejoint progressivement. */
  const cible = useRef({ rot: -32, inc: 58, zoom: 1 });
  const cam = useRef({ rot: -32, inc: 58, zoom: 1 });
  const drag = useRef<{ x: number; y: number; rot: number; inc: number } | null>(null);
  const [actif, setActif] = useState(false);
  const [hud, setHud] = useState({ rot: -32, inc: 58, zoom: 1 });

  useEffect(() => {
    let raf = 0;
    let compteur = 0;
    const boucle = () => {
      const c = cam.current;
      const t = cible.current;
      c.rot += (t.rot - c.rot) * 0.16;
      c.inc += (t.inc - c.inc) * 0.16;
      c.zoom += (t.zoom - c.zoom) * 0.16;
      if (scene.current) {
        scene.current.style.transform = `scale3d(${c.zoom},${c.zoom},1) rotateX(${c.inc}deg) rotateZ(${c.rot}deg)`;
      }
      compteur += 1;
      if (compteur % 6 === 0) {
        setHud({ rot: Math.round(c.rot), inc: Math.round(c.inc), zoom: c.zoom });
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, rot: cible.current.rot, inc: cible.current.inc };
    setActif(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    cible.current.rot = d.rot + (e.clientX - d.x) * 0.45;
    cible.current.inc = Math.min(88, Math.max(8, d.inc - (e.clientY - d.y) * 0.32));
  }, []);

  const fin = useCallback(() => {
    drag.current = null;
    setActif(false);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    cible.current.zoom = Math.min(2.4, Math.max(0.55, cible.current.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  }, []);

  const h = 46;
  const w = simulation.type === "Commercial" ? 220 : 180;
  const d = simulation.type === "Commercial" ? 150 : 130;
  const ouvertures = Math.max(2, Math.min(5, simulation.facades ?? 3));

  return (
    <div
      className="relative grid h-[480px] cursor-grab place-items-center overflow-hidden rounded-2xl border border-border bg-gradient-brand-soft active:cursor-grabbing"
      style={{ perspective: "1500px", filter: `brightness(${lum.ambiance})` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={fin}
      onPointerLeave={fin}
      onWheel={onWheel}
      onDoubleClick={() => {
        cible.current = { rot: -32, inc: 58, zoom: 1 };
      }}
      role="application"
      aria-label="Vue 3D interactive : glisser pour pivoter, molette pour zoomer"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 50% 18%, ${lum.teinte}${Math.round(lum.force * 160).toString(16)}, transparent 72%)`,
        }}
      />

      <div ref={scene} className="relative will-change-transform" style={{ transformStyle: "preserve-3d" }}>
        {/* Terrain */}
        <div
          className="absolute rounded-2xl"
          style={{
            width: 340,
            height: 300,
            left: -170,
            top: -150,
            transform: "translateZ(-8px)",
            background:
              simulation.type === "Villa"
                ? "linear-gradient(135deg,#8fbf7a,#5f9350)"
                : "linear-gradient(135deg,#cfcabf,#a8a49b)",
            boxShadow: "0 30px 60px rgba(10,25,60,.28)",
          }}
        />
        {simulation.type === "Villa" && simulation.piscine && (
          <div
            className="absolute rounded-lg"
            style={{
              width: 96,
              height: 58,
              left: 62,
              top: 62,
              transform: "translateZ(-3px)",
              background: "linear-gradient(135deg,#4cc4e8,#1d7fa8)",
              boxShadow: "inset 0 0 16px rgba(0,0,0,.4)",
            }}
          />
        )}

        {Array.from({ length: etages }).map((_, i) => (
          <div key={i} style={{ transformStyle: "preserve-3d" }}>
            {/* Dalle / revêtement du sol */}
            <div
              className="absolute rounded-sm"
              style={{
                width: w,
                height: d,
                left: -w / 2,
                top: -d / 2,
                transform: `translateZ(${i * h + h}px)`,
                background: sols[sol] ?? sols.Carrelage,
                boxShadow: "0 3px 14px rgba(0,0,0,.25)",
              }}
            />
            {/* Murs + ouvertures */}
            {[
              { vert: false, ty: -d / 2, sombre: 0 },
              { vert: false, ty: d / 2, sombre: 0.1 },
              { vert: true, sens: -1, sombre: 0.18 },
              { vert: true, sens: 1, sombre: 0.24 },
            ].map((m, k) => (
              <div
                key={k}
                className="absolute overflow-hidden"
                style={{
                  width: m.vert ? d : w,
                  height: h,
                  left: m.vert ? -d / 2 : -w / 2,
                  top: -h / 2,
                  transform: m.vert
                    ? `translateX(${(m.sens ?? 1) * (w / 2)}px) translateZ(${i * h + h / 2}px) rotateY(90deg)`
                    : `translateY(${m.ty}px) translateZ(${i * h + h / 2}px) rotateX(90deg)`,
                  background: peinture,
                  filter: `brightness(${1 - m.sombre}) saturate(1.05)`,
                  border: "1px solid rgba(0,0,0,.15)",
                }}
              >
                {Array.from({ length: ouvertures }).map((__, o) => (
                  <span
                    key={o}
                    className="absolute rounded-[2px]"
                    style={{
                      width: 22,
                      height: 16,
                      top: h / 2 - 10,
                      left: ((m.vert ? d : w) / (ouvertures + 1)) * (o + 1) - 11,
                      background: `linear-gradient(160deg, ${lum.teinte}, rgba(20,40,70,.75))`,
                      boxShadow: `0 0 12px ${lum.teinte}66`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* Toiture */}
        <div
          className="absolute rounded-sm"
          style={{
            width: w + 12,
            height: d + 12,
            left: -(w + 12) / 2,
            top: -(d + 12) / 2,
            transform: `translateZ(${etages * h}px)`,
            background: `linear-gradient(135deg, ${peinture}, rgba(0,0,0,.5))`,
            boxShadow: "0 10px 30px rgba(0,0,0,.3)",
          }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
        <span>
          {etages} niveau(x) · {simulation.superficie} m² · éclairage {eclairage.toLowerCase()}
        </span>
        <span className={actif ? "text-primary" : undefined}>
          Orbite {hud.rot}° · Inclinaison {hud.inc}° · Zoom {Math.round(hud.zoom * 100)}% — glisser / molette /
          double-clic
        </span>
      </div>
    </div>
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
