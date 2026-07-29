import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Intensity = "subtle" | "normal" | "vivid";

const opacity: Record<Intensity, string> = {
  subtle: "opacity-[0.45] dark:opacity-[0.5]",
  normal: "opacity-70 dark:opacity-75",
  vivid: "opacity-100",
};

const canvasAlpha: Record<Intensity, number> = { subtle: 0.35, normal: 0.6, vivid: 0.9 };

type Node = { x: number; y: number; vx: number; vy: number; r: number };

/**
 * Fond « blueprint vivant » : grille en perspective qui défile, réseau de nœuds
 * paramétriques reliés (maillage IA), balayage lumineux type scanner CAO et
 * blobs de dégradé de marque. S'adapte au thème clair / sombre.
 */
export function AuroraBackground({
  intensity = "normal",
  className,
}: {
  intensity?: Intensity;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alpha = canvasAlpha[intensity];
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let nodes: Node[] = [];

    const lire = () => {
      const s = getComputedStyle(canvas);
      return { trait: s.color, accent: s.borderTopColor };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const densite = Math.round((w * h) / 34000);
      nodes = Array.from({ length: Math.max(24, Math.min(90, densite)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.7,
      }));
    };

    const grillePerspective = (couleur: string) => {
      const horizon = h * 0.52;
      ctx.strokeStyle = couleur;
      ctx.lineWidth = 1;

      // fuyantes
      for (let i = -14; i <= 14; i += 1) {
        const x = w / 2 + i * (w / 12);
        ctx.globalAlpha = alpha * 0.16;
        ctx.beginPath();
        ctx.moveTo(w / 2 + i * 26, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // lignes de profondeur qui défilent
      for (let i = 0; i < 16; i += 1) {
        const p = ((i + (t * 0.06) % 1) / 16) ** 2.6;
        const y = horizon + p * (h - horizon);
        ctx.globalAlpha = alpha * 0.18 * (0.25 + p);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const maillage = (couleur: string, accent: string) => {
      const seuil = Math.min(190, Math.max(120, w / 9));
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > seuil) continue;
          ctx.globalAlpha = alpha * 0.3 * (1 - d / seuil);
          ctx.strokeStyle = couleur;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.04 + n.x * 0.02);
        ctx.globalAlpha = alpha * 0.75 * pulse;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const balayage = (accent: string) => {
      const y = ((t * 1.1) % (h + 300)) - 150;
      const g = ctx.createLinearGradient(0, y - 120, 0, y + 120);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, accent);
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = alpha * 0.12;
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 120, w, 240);
      ctx.globalAlpha = 1;
    };

    const boucle = () => {
      const { trait, accent } = lire();
      ctx.clearRect(0, 0, w, h);
      grillePerspective(trait);
      maillage(trait, accent);
      balayage(accent);
      t += reduced ? 0 : 1;
      raf = requestAnimationFrame(boucle);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(boucle);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", opacity[intensity], className)}
    >
      {/* nappes de dégradé de marque */}
      <div className="absolute -left-[15%] -top-[20%] h-[45rem] w-[45rem] rounded-full bg-primary/30 blur-[120px] animate-blob" />
      <div
        className="absolute right-[-12%] top-[2%] h-[38rem] w-[38rem] rounded-full bg-primary-glow/30 blur-[130px] animate-blob"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute bottom-[-22%] left-[22%] h-[40rem] w-[40rem] rounded-full bg-brand/25 blur-[140px] animate-blob"
        style={{ animationDelay: "-14s" }}
      />

      {/* couche vectorielle animée (grille en perspective + maillage + scanner) */}
      <canvas
        ref={ref}
        className="absolute inset-0 h-full w-full text-primary [border-top-color:var(--color-brand)] [mask-image:radial-gradient(ellipse_at_50%_35%,black,transparent_82%)]"
      />

      {/* vignette douce pour la lisibilité */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_35%,var(--color-background)_100%)] opacity-70" />
    </div>
  );
}
