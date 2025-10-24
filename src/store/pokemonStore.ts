"use client";
import { create } from "zustand";

export type PokemonFiltersState = {
  search: string;
  type: string | null;
  generation: string | null;
  scrollY: number;
  setSearch: (s: string) => void;
  setType: (t: string | null) => void;
  setGeneration: (g: string | null) => void;
  setScrollY: (y: number) => void;
};

export const usePokemonFilters = create<PokemonFiltersState>((set) => ({
  search: "",
  type: null,
  generation: null,
  scrollY: 0,
  setSearch: (s) => set({ search: s }),
  setType: (t) => set({ type: t }),
  setGeneration: (g) => set({ generation: g }),
  setScrollY: (y) => set({ scrollY: y }),
}));
