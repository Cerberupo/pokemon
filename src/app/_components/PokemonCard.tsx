"use client";
import Link from "next/link";
import { usePokemonFilters } from "a2r/store/pokemonStore";

export type PokemonSummary = {
  id: number;
  name: string;
  generation: string;
  types: string[];
  sprite: string | null;
};

export function PokemonCard({ p }: { p: PokemonSummary }) {
  const state = usePokemonFilters();
  return (
    <Link
      href={`/pokemon/${p.name}`}
      onClick={() => {
        // Persist current scroll before navigating away
        try {
          state.setScrollY(window.scrollY);
        } catch {}
      }}
      className="group rounded-2xl bg-white/10 p-4 transition hover:bg-white/20"
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/10">
          {p.sprite ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.sprite}
              alt={p.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/50">
              N/A
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-baseline gap-2">
            <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200">
              #{p.id}
            </span>
            <h3 className="truncate text-lg font-semibold text-white capitalize">
              {p.name}
            </h3>
          </div>
          <div className="mt-1 text-sm text-white/80 capitalize">
            {p.generation.replace(/-/g, " ")}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.types.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white capitalize"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
