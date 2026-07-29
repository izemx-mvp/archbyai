import { useState } from "react";
import type { Simulation } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const sols: Record<string, string> = {
  Carrelage: "repeating-conic-gradient(#d8d3ca 0% 25%, #efece6 0% 50%) 0 0/44px 44px",
  Parquet: "repeating-linear-gradient(90deg,#b07a45 0 22px,#9c6a3a 22px 24px)",
  "Béton ciré": "linear-gradient(135deg,#b9b6b1,#8f8c87)",
  Zellige: "repeating-conic-gradient(#1f6f8b 0% 25%, #e9e2d0 0% 50%) 0 0/28px 28px",
};

const eclairages: Record<string, { teinte: string; force: number }> = {
  Chaud: { teinte: "#ffb457", force: 0.5 },
  Neutre: { teinte: "#ffffff", force: 0.32 },
  Froid: { teinte: "#8ec9ff", force: 0.42 },
};

/**
 * Vue 3D isométrique du logement, construite en CSS 3D (performante, sans WebGL).
 * Rotation à la souris, personnalisation peinture / sol / éclairage (§5.3).
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
  const [angle, setAngle] = useState(-32);
  const [inclinaison, setInclinaison] = useState(58);
  const etages = Math.min(6, Math.max(1, simulation.etages));
  const lum = eclairages[eclairage] ?? eclairages.Neutre;

  return (
    <div className="space-y-4">
      <div
        className="relative grid h-[420px] place-items-center overflow-hidden rounded-2xl border border-border bg-gradient-brand-soft"
        style={{ perspective: "1400px" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 50% at 50% 20%, ${lum.teinte}${Math.round(lum.force * 160).toString(16)}, transparent 70%)`,
          }}
        />
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${inclinaison}deg) rotateZ(${angle}deg)`,
          }}
        >
          {/* Terrain / jardin */}
          <div
            className="absolute rounded-xl"
            style={{
              width: 320,
              height: 280,
              left: -160,
              top: -140,
              transform: "translateZ(-6px)",
              background:
                simulation.type === "Villa"
                  ? "linear-gradient(135deg,#8fbf7a,#5f9350)"
                  : "linear-gradient(135deg,#cfcabf,#a8a49b)",
            }}
          />
          {simulation.type === "Villa" && simulation.piscine && (
            <div
              className="absolute rounded-lg"
              style={{
                width: 90,
                height: 54,
                left: 60,
                top: 60,
                transform: "translateZ(-2px)",
                background: "linear-gradient(135deg,#4cc4e8,#1d7fa8)",
                boxShadow: "inset 0 0 14px rgba(0,0,0,.35)",
              }}
            />
          )}

          {Array.from({ length: etages }).map((_, i) => {
            const h = 46;
            const w = simulation.type === "Commercial" ? 220 : 180;
            const d = simulation.type === "Commercial" ? 150 : 130;
            return (
              <div key={i} style={{ transformStyle: "preserve-3d" }}>
                {/* dalle */}
                <div
                  className="absolute rounded-sm"
                  style={{
                    width: w,
                    height: d,
                    left: -w / 2,
                    top: -d / 2,
                    transform: `translateZ(${i * h + h}px)`,
                    background: sols[sol] ?? sols.Carrelage,
                    boxShadow: "0 2px 12px rgba(0,0,0,.25)",
                  }}
                />
                {/* murs */}
                {[
                  { rot: `rotateX(90deg)`, ty: -d / 2, len: w, vert: false },
                  { rot: `rotateX(90deg)`, ty: d / 2, len: w, vert: false },
                  { rot: `rotateY(90deg)`, ty: 0, len: d, vert: true },
                ].map((m, k) => (
                  <div
                    key={k}
                    className="absolute"
                    style={{
                      width: m.vert ? d : w,
                      height: h,
                      left: m.vert ? -d / 2 : -w / 2,
                      top: -h / 2,
                      transform: m.vert
                        ? `translateX(${(k === 2 ? -1 : 1) * (w / 2)}px) translateZ(${i * h + h / 2}px) rotateY(90deg)`
                        : `translateY(${m.ty}px) translateZ(${i * h + h / 2}px) rotateX(90deg)`,
                      background: peinture,
                      filter: `brightness(${1 - k * 0.12}) saturate(1.05)`,
                      border: "1px solid rgba(0,0,0,.15)",
                    }}
                  />
                ))}
              </div>
            );
          })}
          {/* toiture */}
          <div
            className="absolute rounded-sm"
            style={{
              width: simulation.type === "Commercial" ? 220 : 180,
              height: simulation.type === "Commercial" ? 150 : 130,
              left: (simulation.type === "Commercial" ? -220 : -180) / 2,
              top: (simulation.type === "Commercial" ? -150 : -130) / 2,
              transform: `translateZ(${etages * 46 + 46}px)`,
              background: `linear-gradient(135deg, ${peinture}, rgba(0,0,0,.45))`,
            }}
          />
        </div>

        <p className="absolute bottom-3 left-4 text-xs text-muted-foreground">
          {etages} niveau(x) · {simulation.superficie} m² · éclairage {eclairage.toLowerCase()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
          Rotation ({angle}°)
          <input
            type="range"
            min={-180}
            max={180}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className={cn("w-full accent-[var(--color-primary)]")}
            aria-label="Rotation de la vue 3D"
          />
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
          Inclinaison ({inclinaison}°)
          <input
            type="range"
            min={20}
            max={80}
            value={inclinaison}
            onChange={(e) => setInclinaison(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
            aria-label="Inclinaison de la vue 3D"
          />
        </label>
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
