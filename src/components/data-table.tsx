import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Filter, RotateCcw, X, Inbox } from "lucide-react";

import { EmptyState, TableSkeleton } from "@/components/page-parts";
import { SearchField } from "@/components/search-field";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  cell: (row: T) => ReactNode;
  value?: (row: T) => string | number;
};

export type FilterGroup = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchPlaceholder = "Rechercher…",
  searchKeys,
  loading = false,
  pageSize = 6,
  emptyTitle = "Aucun résultat",
  emptyDescription = "Ajustez votre recherche ou réinitialisez les filtres.",
  matchFilter,
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: FilterGroup[];
  searchPlaceholder?: string;
  searchKeys: (row: T) => string;
  loading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  matchFilter?: (row: T, groupId: string, value: string) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const activeCount = Object.values(active).flat().length;

  const toggle = (groupId: string, value: string) => {
    setPage(1);
    setActive((prev) => {
      const list = prev[groupId] ?? [];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [groupId]: next };
    });
  };

  const filtered = useMemo(() => {
    let data = rows.filter((r) => searchKeys(r).toLowerCase().includes(query.toLowerCase()));
    for (const [groupId, values] of Object.entries(active)) {
      if (!values.length || !matchFilter) continue;
      data = data.filter((r) => values.some((v) => matchFilter(r, groupId, v)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.value) {
        data = [...data].sort((a, b) => {
          const av = col.value!(a);
          const bv = col.value!(b);
          const res = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? res : -res;
        });
      }
    }
    return data;
  }, [rows, query, active, sort, columns, searchKeys, matchFilter]);

  const [perPage, setPerPage] = useState(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const current = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-soft backdrop-blur-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="w-full lg:max-w-sm">
          <SearchField value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder={searchPlaceholder} shortcut={null} />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {filters.map((group) => (
            <Popover key={group.id}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3.5 w-3.5" />
                  {group.label}
                  {(active[group.id]?.length ?? 0) > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {active[group.id]!.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 rounded-2xl p-2 shadow-elevated">
                {group.options.map((opt) => {
                  const checked = active[group.id]?.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggle(group.id, opt.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                        checked && "bg-accent font-semibold",
                      )}
                    >
                      {opt.label}
                      {checked && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          ))}
          {(activeCount > 0 || query) && (
            <Button variant="ghost" size="sm" onClick={() => { setActive({}); setQuery(""); setPage(1); }}>
              <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          {Object.entries(active).flatMap(([groupId, values]) =>
            values.map((v) => (
              <button key={`${groupId}-${v}`} onClick={() => toggle(groupId, v)} className="animate-pop">
                <StatusPill tone="brand" dot={false} className="gap-1.5 hover:opacity-80">
                  {v} <X className="h-3 w-3" />
                </StatusPill>
              </button>
            )),
          )}
        </div>
      )}

      {loading ? (
        <TableSkeleton cols={columns.length} />
      ) : current.length === 0 ? (
        <EmptyState icon={Inbox} titre={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                      col.className,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        onClick={() =>
                          setSort((s) =>
                            s?.key === col.key ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: col.key, dir: "asc" },
                          )
                        }
                      >
                        {col.header} <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-border transition-colors hover:bg-accent/45",
                    i % 2 === 1 && "bg-muted/25",
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3.5 align-middle", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · page {safePage} sur {totalPages}
          </p>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Lignes
            <select
              aria-label="Nombre de lignes par page"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none transition-colors focus:border-primary/60"
            >
              {[6, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
          <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
            Précédent
          </Button>
          {pageNumbers.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - pageNumbers[i - 1] > 1 && (
                <span className="px-1 text-xs text-muted-foreground">…</span>
              )}
              <Button
                variant={p === safePage ? "hero" : "ghost"}
                size="icon-sm"
                aria-label={`Page ${p}`}
                aria-current={p === safePage ? "page" : undefined}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            </span>
          ))}
          <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
            Suivant
          </Button>
        </nav>
      </div>
    </section>
  );
}
