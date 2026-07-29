import logo from "@/assets/archbyai-logo.png";
import mark from "/favicon.png";
import { cn } from "@/lib/utils";

/**
 * Logo officiel complet — jamais accompagné de texte (le nom est dans le logo).
 * Le ratio d'origine (1536×512) est toujours préservé : on ne contraint que la
 * hauteur, la largeur reste automatique et `object-contain` évite tout écrasement.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-1 py-0.5", className)}>
      <img
        src={logo}
        alt="ArchbyAI"
        width={1536}
        height={512}
        decoding="async"
        className="brand-logo-img h-8 w-auto max-w-full select-none object-contain object-left"
      />
    </span>
  );
}

/** Version icône seule (sidebar repliée, favicon, splash) — carré, jamais rogné. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-grid place-items-center p-1", className)}>
      <img
        src={mark}
        alt="ArchbyAI"
        width={512}
        height={512}
        decoding="async"
        className="brand-logo-img h-10 w-10 select-none object-contain"
      />
    </span>
  );
}
