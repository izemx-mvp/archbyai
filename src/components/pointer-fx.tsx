import { useEffect } from "react";

/**
 * Suivi global du curseur : alimente les variables `--px` / `--py` des éléments
 * portant l'utilitaire `.spotlight` (halo lumineux) sans re-render React.
 */
export function PointerFx() {
  useEffect(() => {
    let frame = 0;
    let last: Element | null = null;

    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const target = (e.target as Element | null)?.closest?.(".spotlight") ?? null;
        if (target !== last) last = target;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        (target as HTMLElement).style.setProperty("--px", `${e.clientX - rect.left}px`);
        (target as HTMLElement).style.setProperty("--py", `${e.clientY - rect.top}px`);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
