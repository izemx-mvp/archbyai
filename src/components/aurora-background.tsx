import { cn } from "@/lib/utils";

type Intensity = "subtle" | "normal" | "vivid";

const opacity: Record<Intensity, string> = {
  subtle: "opacity-[0.28] dark:opacity-[0.32]",
  normal: "opacity-50 dark:opacity-55",
  vivid: "opacity-80 dark:opacity-75",
};

/** Fond vibrant animé (blobs dégradés + maillage), adapté clair/sombre. */
export function AuroraBackground({
  intensity = "normal",
  className,
}: {
  intensity?: Intensity;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", opacity[intensity], className)}
    >
      <div className="absolute -left-[15%] -top-[20%] h-[45rem] w-[45rem] rounded-full bg-primary/40 blur-[110px] animate-blob" />
      <div
        className="absolute right-[-10%] top-[5%] h-[38rem] w-[38rem] rounded-full bg-primary-glow/40 blur-[120px] animate-blob"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute bottom-[-20%] left-[25%] h-[40rem] w-[40rem] rounded-full bg-brand/30 blur-[130px] animate-blob"
        style={{ animationDelay: "-14s" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}
