"use client";
import { api } from "a2r/trpc/react";
import { usePokemonFilters } from "a2r/store/pokemonStore";

export function FiltersBar() {
  const { data: filters, isLoading, isError } = api.pokemon.filters.useQuery();
  const state = usePokemonFilters();


  return (
    <div className="w-full rounded-2xl bg-white/10 p-4 text-white shadow">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/80">Search</label>
          <input
            value={state.search}
            onChange={(e) => state.setSearch(e.target.value)}
            placeholder="Search by name (includes evolutions)"
            className="w-full rounded-xl bg-white px-3 py-2 text-gray-900 outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/80">Type</label>
          <select
            value={state.type ?? ""}
            onChange={(e) => state.setType(e.target.value || null)}
            className="w-full rounded-xl bg-white px-3 py-2 text-gray-900"
          >
            <option value="">All types</option>
            {!isLoading && !isError &&
              filters?.types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/80">Generation</label>
          <select
            value={state.generation ?? ""}
            onChange={(e) => state.setGeneration(e.target.value || null)}
            className="w-full rounded-xl bg-white px-3 py-2 text-gray-900"
          >
            <option value="">All generations</option>
            {!isLoading && !isError &&
              filters?.generations.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
