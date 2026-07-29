import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Champ de recherche premium avec icône, raccourci clavier et bouton d'effacement. */
export function SearchField({
  value,
  onChange,
  placeholder = "Rechercher…",
  shortcut = "⌘K",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  shortcut?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("group relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-card/70 pl-10 pr-20 text-sm shadow-soft outline-none backdrop-blur-sm transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/12"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {value && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Effacer la recherche"
            onClick={() => onChange("")}
            className="h-7 w-7"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {shortcut && !value && (
          <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-block">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}
