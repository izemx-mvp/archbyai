import logo from "@/assets/archbyai-logo.png";
import mark from "/favicon.png";
import { cn } from "@/lib/utils";

/** Logo officiel complet — jamais accompagné de texte (le nom est dans le logo). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="ArchbyAI"
      width={1536}
      height={512}
      className={cn("brand-logo-img h-9 w-auto select-none object-contain", className)}
    />
  );
}

/** Version icône seule (sidebar repliée, favicon, splash). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={mark}
      alt="ArchbyAI"
      width={512}
      height={512}
      className={cn("brand-logo-img h-8 w-8 select-none object-contain", className)}
    />
  );
}
