"use client";

type Stat = { name: string; base: number };

type Props = {
  stats: Stat[];
  height: number;
  weight: number;
  abilities: { name: string; is_hidden: boolean }[];
};

export function StatsTable({ stats, height, weight, abilities }: Props) {
  const pretty = (s: string) =>
    s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-white">
      <h4 className="mb-3 text-lg font-semibold">Stats & Info</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <table className="w-full text-sm">
            <tbody>
              {stats.map((s) => (
                <tr key={s.name}>
                  <td className="py-1 pr-3 text-white/80 capitalize">
                    {s.name}
                  </td>
                  <td className="py-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block min-w-[2ch] text-right">
                        {s.base}
                      </span>
                      <div className="h-2 w-full rounded bg-white/10">
                        <div
                          className="h-2 rounded bg-emerald-400"
                          style={{
                            width: `${Math.min(100, (s.base / 180) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-white/80">Height:</span> {height / 10} m
          </div>
          <div>
            <span className="text-white/80">Weight:</span> {weight / 10} kg
          </div>
          <div>
            <span className="text-white/80">Abilities:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {abilities.map((a) => (
                <span
                  key={a.name}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize"
                  title={a.is_hidden ? "Hidden ability" : undefined}
                >
                  {pretty(a.name)}
                  {a.is_hidden ? " *" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
