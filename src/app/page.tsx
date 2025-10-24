import { HydrateClient } from "a2r/trpc/server";
import { FiltersBar } from "a2r/app/_components/FiltersBar";
import { PokemonList } from "a2r/app/_components/PokemonList";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#e3350d] via-[#f7a31c] to-[#2a75bb] text-white">
        <div className="container mx-auto flex flex-col gap-6 px-4 py-8">
          <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
            Pokédex Real‑Time
          </h1>
          <FiltersBar />
          <PokemonList />
        </div>
      </main>
    </HydrateClient>
  );
}
