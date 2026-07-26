"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type DashboardSection = {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: LucideIcon;
};

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
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  const [canScroll, setCanScroll] = useState({ left: false, right: false });
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

  useLayoutEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;

    const syncIndicator = (centerActive: boolean) => {
      const activeTab = tabs.querySelector<HTMLButtonElement>(`[data-section-id="${active}"]`);
      if (!activeTab) return;

      const left = activeTab.offsetLeft;
      const width = activeTab.offsetWidth;
      setIndicator({ left, width, ready: true });

      if (!centerActive) return;
      const nextLeft = left - (tabs.clientWidth - width) / 2;
      tabs.scrollTo({ left: Math.max(0, nextLeft), behavior: "smooth" });
    };

    syncIndicator(true);
    const observer = new ResizeObserver(() => syncIndicator(false));
    observer.observe(tabs);

    return () => observer.disconnect();
  }, [active, sections]);

  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;

    const syncScrollEdges = () => {
      const maxScroll = tabs.scrollWidth - tabs.clientWidth;
      setCanScroll({
        left: tabs.scrollLeft > 4,
        right: tabs.scrollLeft < maxScroll - 4,
      });
    };

    syncScrollEdges();
    tabs.addEventListener("scroll", syncScrollEdges, { passive: true });
    window.addEventListener("resize", syncScrollEdges);
    const observer = new ResizeObserver(syncScrollEdges);
    observer.observe(tabs);

    return () => {
      tabs.removeEventListener("scroll", syncScrollEdges);
      window.removeEventListener("resize", syncScrollEdges);
      observer.disconnect();
    };
  }, [sections]);

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
      className="sticky top-0 z-20 -mx-3 mb-5 border-b border-slate-800/80 bg-[#0F172A]/92 px-3 py-2.5 backdrop-blur-md sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6"
    >
      {toolbar && (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/60 pb-2.5 sm:gap-3">
          {toolbar}
        </div>
      )}

      <div className="relative">
        {canScroll.left && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0F172A] to-transparent"
          />
        )}
        {canScroll.right && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0F172A] to-transparent"
          />
        )}

        <div
          ref={tabsRef}
          role="navigation"
          aria-label="Dashboard sections"
          className="relative flex snap-x snap-mandatory gap-0.5 overflow-x-auto scroll-smooth rounded-lg border border-slate-700/80 bg-slate-800/50 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {indicator.ready && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-1 bottom-1 rounded-md bg-[#2E7D9A]/22 ring-1 ring-[#2E7D9A]/45 transition-[left,width] duration-300 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}

          {sections.map((section) => {
            const isActive = active === section.id;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                data-section-id={section.id}
                onClick={() => scrollToSection(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={`relative z-[1] inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/50 ${
                  isActive
                    ? "text-sky-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-sky-300" : "text-slate-500"}`}
                    aria-hidden
                  />
                )}
                <span className="sm:hidden">{section.shortLabel ?? section.label}</span>
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
