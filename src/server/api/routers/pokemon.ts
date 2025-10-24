import Pokedex, { type Chain } from "pokedex-promise-v2";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "a2r/server/api/trpc";

const P = new Pokedex();

// Helpers
const getIdFromUrl = (url: string) => {
  const m = /\/(\d+)\/?$/.exec(url);
  return m ? Number(m[1]) : undefined;
};

const toTitle = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type PokemonCore = {
  id: number;
  name: string;
  generation: string;
  types: string[];
  sprite: string | null;
  stats: { name: string; base: number }[];
  abilities: { name: string; is_hidden: boolean }[];
  height: number;
  weight: number;
};

// Array-only API: always receive names (species or pokemon) and return an array of cores
async function getPokemonCore(names: string[]): Promise<PokemonCore[]> {
  if (names.length === 0) return [];

  // 1) Fetch species for all names (they are species names in our flows)
  const speciesArr = await P.getPokemonSpeciesByName(names);

  // 2) From each species, pick the default variety's pokemon name (fallback to species name)
  const defaultPokemonNames = speciesArr.map((specie) => {
    const def = specie.varieties?.find((v) => v.is_default)?.pokemon.name;
    return def ?? specie.name;
  });

  // 3) Batch fetch the full pokemon details for all default varieties
  const pokemons = await P.getPokemonByName(defaultPokemonNames);

  // 4) Combine species (generation) with pokemon details, preserving order
  return pokemons.map((pokemon, idx) => {
    const specie = speciesArr[idx];
    const generationName = specie?.generation?.name ?? "unknown";
    const types = pokemon.types.map((t) => t.type.name);
    const sprite =
      pokemon.sprites.other?.["official-artwork"]?.front_default ??
      pokemon.sprites.other?.dream_world?.front_default ??
      pokemon.sprites.front_default ??
      null;
    const stats = pokemon.stats.map((s) => ({
      name: s.stat.name,
      base: s.base_stat,
    }));
    const abilities = pokemon.abilities.map((a) => ({
      name: a.ability.name,
      is_hidden: a.is_hidden,
    }));
    return {
      id: pokemon.id,
      name: pokemon.name,
      generation: generationName,
      types,
      sprite,
      stats,
      abilities,
      height: pokemon.height,
      weight: pokemon.weight,
    };
  });
}

async function getEvolutionChainForSpecies(species: Pokedex.PokemonSpecies) {
  const url = species.evolution_chain?.url;
  if (!url) return [] as { name: string; id: number; sprite: string | null }[];
  const chainId = getIdFromUrl(url);
  if (!chainId) return [];
  const chain = await P.getEvolutionChainById(chainId);

  const result: string[] = [];
  const stack: Chain[] = [];
  if (chain.chain) stack.push(chain.chain);
  while (stack.length) {
    const node = stack.pop();
    if (node?.species?.name) result.push(node.species.name);
    if (node?.evolves_to?.length) stack.push(...node.evolves_to);
  }
  const unique = Array.from(new Set(result));
  // Map to id + sprite (best-effort, parallel but limited)
  const details = await Promise.all(
    unique.map(async (name) => {
      try {
        const arr = await getPokemonCore([name]);
        const core = arr[0];
        if (!core) throw new Error("Not found");
        return { name: core.name, id: core.id, sprite: core.sprite };
      } catch {
        return {
          name,
          id:
            getIdFromUrl(
              (await P.getPokemonSpeciesByName(name)).url as string,
            ) ?? 0,
          sprite: null,
        };
      }
    }),
  );
  // sort by id asc
  details.sort((a, b) => a.id - b.id);
  return details;
}

async function getNamesForGeneration(genName: string) {
  const g = await P.getGenerationByName(genName);
  // Return species names only
  return g.pokemon_species.map((s) => s.name);
}

let speciesIndexPromise: Promise<{
  speciesNames: string[];
  index: Map<string, number>;
}> | null = null;
async function getAllSpeciesIndex() {
  speciesIndexPromise ??= (async () => {
    const list = await P.getPokemonSpeciesList({ limit: 20000, offset: 0 });

    const index = new Map<string, number>();
    for (const r of list.results) {
      const id = getIdFromUrl(r.url)!;
      index.set(r.name, id);
    }
    return { speciesNames: list.results.map((r) => r.name), index };
  })();
  return speciesIndexPromise;
}

async function getAllSpeciesNames() {
  const { speciesNames } = await getAllSpeciesIndex();
  return speciesNames;
}

// Extract all species names from an evolution chain tree
function speciesNamesFromChainNode(
  chain: Chain | undefined | null,
  acc: string[],
) {
  if (!chain) return;
  if (chain.species?.name) acc.push(chain.species.name);
  if (chain.evolves_to?.length) {
    for (const child of chain.evolves_to) speciesNamesFromChainNode(child, acc);
  }
}

async function expandByEvolutionChains(
  speciesNames: string[],
): Promise<Set<string>> {
  if (speciesNames.length === 0) return new Set();
  try {
    // 1) Batch fetch species details
    const speciesArr = await P.getPokemonSpeciesByName(speciesNames);

    // 2) Collect unique evolution chain IDs
    const chainIds = Array.from(
      new Set(
        speciesArr
          .map((s) => s.evolution_chain?.url)
          .filter((u): u is string => !!u)
          .map((u) => getIdFromUrl(u))
          .filter(
            (id): id is number => typeof id === "number" && !Number.isNaN(id),
          ),
      ),
    );

    if (chainIds.length === 0) return new Set();

    // 3) Batch fetch all chains and collect species names
    const chains = await Promise.all(
      chainIds.map((id) => P.getEvolutionChainById(id)),
    );

    const out = new Set<string>();
    for (const ch of chains) {
      const list: string[] = [];
      speciesNamesFromChainNode(ch.chain, list);
      for (const n of list) out.add(n);
    }
    return out;
  } catch {
    return new Set();
  }
}

async function getSpeciesNamesForType(typeName: string) {
  // Fetch the type data which lists all pokemon (forms/varieties) that have this type
  const t = await P.getTypeByName(typeName);

  // 1) Batch fetch all listed pokemon to know their species names
  const listedPokemonNames = t.pokemon.map((p) => p.pokemon.name);
  const listedPokemons = await P.getPokemonByName(listedPokemonNames);
  const uniqueSpeciesNames = Array.from(
    new Set(listedPokemons.map((pk) => pk.species.name)),
  );

  if (uniqueSpeciesNames.length === 0) return [];

  // 2) Batch fetch those species to resolve their default variety pokemon names
  const speciesArr = await P.getPokemonSpeciesByName(uniqueSpeciesNames);
  const defaultPokemonNames = speciesArr.map((specie) => {
    const def = specie.varieties?.find((v) => v.is_default)?.pokemon.name;
    return def ?? specie.name;
  });

  // 3) Batch fetch default pokemons and filter by type strictly on default form
  const defaultPokemons = await P.getPokemonByName(defaultPokemonNames);
  const result: string[] = [];
  for (let i = 0; i < defaultPokemons.length; i++) {
    const pk = defaultPokemons[i];
    if (!pk) continue;
    const hasType = pk.types.some((t) => t.type.name === typeName);
    if (hasType) {
      // speciesArr[i] corresponds to this default pokemon
      result.push(speciesArr[i]!.name);
    }
  }

  return Array.from(new Set(result));
}

export const pokemonRouter = createTRPCRouter({
  filters: publicProcedure.query(async () => {
    const [typesList, gensList] = await Promise.all([
      P.getTypesList(),
      P.getGenerationsList(),
    ]);
    const types = typesList.results
      .map((r) => ({ value: r.name, label: toTitle(r.name) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    // order generations by id from URL
    const gens = gensList.results
      .map((r) => ({
        value: r.name,
        label: toTitle(r.name),
        id: getIdFromUrl(r.url)!,
      }))
      .sort((a, b) => a.id - b.id)
      .map(({ value, label }) => ({ value, label }));
    return { types, generations: gens };
  }),

  list: publicProcedure
    .input(
      z.object({
        type: z.string().optional().nullable(),
        generation: z.string().optional().nullable(),
        search: z.string().optional().nullable(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // We operate on SPECIES names to avoid variants/forms
        let candidateSpecies: Set<string> | null = null;

        // Prepare inputs in parallel
        const [typeSpecies, genSpecies, allSpecies] = await Promise.all([
          input.type ? getSpeciesNamesForType(input.type) : null,
          input.generation ? getNamesForGeneration(input.generation) : null,
          input.search && input.search.trim().length > 0
            ? getAllSpeciesNames()
            : null,
        ]);

        console.log(JSON.stringify(typeSpecies, null, 2));

        if (typeSpecies) {
          candidateSpecies = new Set(typeSpecies);
        }
        if (genSpecies) {
          candidateSpecies = candidateSpecies
            ? new Set(genSpecies.filter((n) => candidateSpecies!.has(n)))
            : new Set(genSpecies);
        }

        // Apply search over species + expand by evolution chains
        if (allSpecies && input.search) {
          const q = input.search.trim().toLowerCase();
          const baseMatches = new Set(allSpecies.filter((n) => n.includes(q)));
          const expanded = new Set<string>();
          // Batch expansion by evolution chains: fetch species and chains in groups
          const expandedSet = await expandByEvolutionChains(
            Array.from(baseMatches),
          );
          expandedSet.forEach((name) => expanded.add(name));
          const searchSet = new Set<string>([...baseMatches, ...expanded]);
          candidateSpecies = candidateSpecies
            ? new Set([...candidateSpecies].filter((n) => searchSet.has(n)))
            : searchSet;
        }

        // Build ordered list using species index
        let speciesOrdered: { species: string; speciesId: number }[];
        const { index: speciesIndex, speciesNames } =
          await getAllSpeciesIndex();
        if (candidateSpecies) {
          speciesOrdered = Array.from(candidateSpecies).map((s) => ({
            species: s,
            speciesId: speciesIndex.get(s) ?? Number.MAX_SAFE_INTEGER,
          }));
          speciesOrdered.sort((a, b) => a.speciesId - b.speciesId);
        } else {
          speciesOrdered = speciesNames
            .map((s) => ({ species: s, speciesId: speciesIndex.get(s)! }))
            .sort((a, b) => a.speciesId - b.speciesId);
        }

        const total = speciesOrdered.length;

        // Map ALL species to default variety pokemon name and fetch core in batch (no pagination)
        const names = speciesOrdered.map(({ species }) => species);
        const items = await getPokemonCore(names);

        // Always return full list without pagination metadata
        return { total, items };
      } catch (e) {
        console.error(e);
        throw e;
      }
    }),

  byName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const core = (await getPokemonCore([input.name]))[0]!;
      if (!core) throw new Error("Pokemon not found");
      const species = await P.getPokemonSpeciesByName(input.name);
      const evolutions = await getEvolutionChainForSpecies(species);
      return { ...core, evolutions };
    }),
});
