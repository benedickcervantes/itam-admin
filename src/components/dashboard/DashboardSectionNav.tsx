"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type DashboardSection = { id: string; label: string };

const DEFAULT_NAV_OFFSET = 52;
const LANDING_GAP = 8;

export function DashboardSectionNav({
  sections,
  toolbar,
}: {
  sections: DashboardSection[];
  toolbar?: ReactNode;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const barRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [navOffset, setNavOffset] = useState(DEFAULT_NAV_OFFSET);
  const clickScrollingRef = useRef(false);
  const clickScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    const root = document.querySelector<HTMLElement>(".page-content");
    if (!bar) return;

    const syncOffset = () => {
      const height = Math.ceil(bar.getBoundingClientRect().height);
      setNavOffset(height);
      root?.style.setProperty("--dashboard-nav-offset", `${height}px`);
    };

    syncOffset();
    const observer = new ResizeObserver(syncOffset);
    observer.observe(bar);
    window.addEventListener("resize", syncOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOffset);
      root?.style.removeProperty("--dashboard-nav-offset");
    };
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".page-content");
    if (!root || sections.length === 0) return;

    const computeActive = () => {
      if (clickScrollingRef.current) return;

      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 8) {
        setActive(sections[sections.length - 1]?.id ?? "");
        return;
      }

      if (root.scrollTop <= 8) {
        setActive(sections[0]?.id ?? "");
        return;
      }

      // Line just below the sticky nav; the section crossing it is "current".
      const line = root.getBoundingClientRect().top + navOffset + LANDING_GAP;

      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;

        if (el.getBoundingClientRect().top - line <= 1) {
          current = section.id;
        } else {
          break;
        }
      }

      setActive(current);
    };

    root.addEventListener("scroll", computeActive, { passive: true });
    window.addEventListener("resize", computeActive);
    computeActive();

    return () => {
      root.removeEventListener("scroll", computeActive);
      window.removeEventListener("resize", computeActive);
    };
  }, [sections, navOffset]);

  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;

    const activeTab = tabs.querySelector<HTMLButtonElement>(`[data-section-id="${active}"]`);
    if (!activeTab) return;

    const tabsRect = tabs.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const nextLeft = tabs.scrollLeft + (tabRect.left - tabsRect.left) - (tabsRect.width - tabRect.width) / 2;

    tabs.scrollTo({ left: Math.max(0, nextLeft), behavior: "smooth" });
  }, [active]);

  const scrollToSection = (id: string) => {
    const root = document.querySelector<HTMLElement>(".page-content");
    const section = document.getElementById(id);
    if (!root || !section) return;

    if (clickScrollTimerRef.current) {
      clearTimeout(clickScrollTimerRef.current);
    }

    const rootTop = root.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;
    const target = root.scrollTop + (sectionTop - rootTop) - navOffset - LANDING_GAP;

    clickScrollingRef.current = true;
    setActive(id);
    root.scrollTo({ top: Math.max(0, target), behavior: "smooth" });

    clickScrollTimerRef.current = setTimeout(() => {
      clickScrollingRef.current = false;
    }, 700);
  };

  return (
    <div
      ref={barRef}
      className="sticky top-0 z-20 -mx-3 mb-5 border-b border-slate-800/70 bg-[#0F172A]/95 px-3 py-2.5 backdrop-blur sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6"
    >
      {toolbar && (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-2.5">
          {toolbar}
        </div>
      )}
      <div
        ref={tabsRef}
        className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section) => {
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              type="button"
              data-section-id={section.id}
              onClick={() => scrollToSection(section.id)}
              aria-current={isActive ? "true" : undefined}
              className={`shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#2E7D9A]/20 text-sky-300 ring-1 ring-[#2E7D9A]/40"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
