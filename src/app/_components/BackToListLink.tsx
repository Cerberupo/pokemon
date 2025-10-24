"use client";
import { useRouter } from "next/navigation";

export function BackToListLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        router.push("/", { scroll: false });
      }}
      className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
    >
      ← Back to list
    </button>
  );
}
