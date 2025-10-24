"use client";
import { api } from "a2r/trpc/react";
import { usePokemonFilters } from "a2r/store/pokemonStore";
import { PokemonCard } from "./PokemonCard";
import { useEffect, useRef, useState } from "react";

export function PokemonList() {
  const state = usePokemonFilters();

  // Debounce search input to avoid firing a query on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(state.search);
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(state.search), 400);
    return () => clearTimeout(handle);
  }, [state.search]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    api.pokemon.list.useQuery({
      type: state.type ?? undefined,
      generation: state.generation ?? undefined,
      search: debouncedSearch || undefined,
    });

  // Restore scroll position after data has been loaded and rendered
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    if (!data?.items || data.items.length === 0) return;
    const y = usePokemonFilters.getState().scrollY;
    if (!y || y <= 0) return;
    hasRestored.current = true;
    // Use double rAF to ensure layout is fully committed before restoring scroll
    window.scrollTo({ top: y });
  }, [data]);

  if (isLoading) {
    return <div className="text-center text-white/80">Loading Pokémon...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-red-500/20 p-4 text-red-200">
        <div className="font-semibold">Error loading Pokémon</div>
        <div className="text-sm opacity-80">{String(error.message)}</div>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.items.map((p) => (
          <PokemonCard key={p.id} p={p} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-white/70">
          {data && <span>Total: {data.total}</span>}
          {isFetching && <span className="ml-2 animate-pulse">Updating…</span>}
        </div>
      </div>
    </div>
  );
}
