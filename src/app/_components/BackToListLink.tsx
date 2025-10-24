"use client";
import { useRouter } from "next/navigation";

export function BackToListLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // Prefer going back to preserve scroll/history when possible
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          // Fallback to pushing home without forcing scroll to top
          router.push("/", { scroll: false });
        }
      }}
      className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
    >
      ← Back to list
    </button>
  );
}
