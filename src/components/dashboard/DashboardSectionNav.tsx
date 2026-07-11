"use client";

import { useEffect, useState } from "react";

export type DashboardSection = { id: string; label: string };

export function DashboardSectionNav({ sections }: { sections: DashboardSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".page-content");
    if (!root) return;

    // Height taken up by the sticky nav (so we don't count area hidden behind it).
    const NAV_OFFSET = 56;

    const computeActive = () => {
      const rootRect = root.getBoundingClientRect();
      const viewTop = rootRect.top + NAV_OFFSET;
      const viewBottom = rootRect.bottom;

      // Absolute bottom → highlight the last section outright.
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) {
        setActive(sections[sections.length - 1]?.id ?? "");
        return;
      }

      // Otherwise pick whichever section occupies the most of the visible area.
      let best = sections[0]?.id ?? "";
      let bestVisible = -1;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const visible = Math.min(rect.bottom, viewBottom) - Math.max(rect.top, viewTop);
        if (visible > bestVisible) {
          bestVisible = visible;
          best = s.id;
        }
      }
      setActive(best);
    };

    root.addEventListener("scroll", computeActive, { passive: true });
    window.addEventListener("resize", computeActive);
    computeActive();
    return () => {
      root.removeEventListener("scroll", computeActive);
      window.removeEventListener("resize", computeActive);
    };
  }, [sections]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <div className="sticky top-0 z-20 -mx-3 mb-5 border-b border-slate-800/70 bg-[#0F172A]/85 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleClick(s.id)}
              aria-current={isActive ? "true" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#2E7D9A]/20 text-sky-300 ring-1 ring-[#2E7D9A]/40"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
