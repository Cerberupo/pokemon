"use client";
import Link from "next/link";

export type EvolutionEntry = { id: number; name: string; sprite: string | null };

export function EvolutionStrip({
  evolutions,
  currentName,
}: {
  evolutions: EvolutionEntry[];
  currentName: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-white">
      <h4 className="mb-3 text-lg font-semibold">Evolution Chain</h4>
      <div className="flex flex-wrap items-stretch gap-3">
        {evolutions.map((e, idx) => (
          <div key={e.id} className="flex items-center gap-3">
            <Link
              href={`/pokemon/${e.name}`}
              className={`flex w-40 items-center gap-3 rounded-xl px-3 py-2 transition ${
                e.name === currentName
                  ? "bg-emerald-500/30 ring-2 ring-emerald-300"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-white/10">
                {e.sprite ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.sprite} alt={e.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/50">N/A</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate capitalize">{e.name}</div>
                <div className="text-xs text-white/60">#{e.id}</div>
              </div>
            </Link>
            {idx < evolutions.length - 1 && (
              <span className="text-white/50">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
