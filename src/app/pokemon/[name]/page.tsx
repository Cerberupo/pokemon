import { api, HydrateClient } from "a2r/trpc/server";
import { EvolutionStrip } from "a2r/app/_components/EvolutionStrip";
import { StatsTable } from "a2r/app/_components/StatsTable";
import { BackToListLink } from "a2r/app/_components/BackToListLink";

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const data = await api.pokemon.byName({ name });

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#2a75bb] via-[#3c5aa6] to-[#1b53ba] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <BackToListLink />
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-1 rounded-2xl bg-white/10 p-6">
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <div className="h-48 w-48 overflow-hidden rounded-2xl bg-white/10">
                  {data.sprite ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.sprite}
                      alt={data.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/50">
                      N/A
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200">
                      #{data.id}
                    </span>
                    <h1 className="truncate text-3xl font-bold capitalize">
                      {data.name}
                    </h1>
                  </div>
                  <div className="mt-1 text-white/80 capitalize">
                    {(data.generation ?? "unknown").replace(/-/g, " ")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(data.types ?? []).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white/10 px-3 py-1 capitalize"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <StatsTable
                stats={data.stats ?? []}
                height={data.height ?? 0}
                weight={data.weight ?? 0}
                abilities={data.abilities ?? []}
              />
            </div>
          </div>

          <div className="mt-6">
            <EvolutionStrip
              evolutions={data.evolutions}
              currentName={data.name}
            />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
