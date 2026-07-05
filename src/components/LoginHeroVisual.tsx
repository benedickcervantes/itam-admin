"use client";

import { type ComponentType } from "react";
import { Laptop, Monitor, Printer, Router, Server } from "lucide-react";

function IconTile({
  icon: Icon,
  variant = "secondary",
  size = "md",
}: {
  icon: ComponentType<{ className?: string }>;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}) {
  const shell =
    variant === "primary"
      ? "border-[#2E7D9A]/30 bg-[#2E7D9A]/10 shadow-[0_0_20px_rgba(46,125,154,0.2)]"
      : "border-slate-600/40 bg-slate-800/50";

  const dimensions =
    size === "lg"
      ? "h-11 w-11 rounded-xl min-[375px]:h-12 min-[375px]:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 md:rounded-2xl"
      : size === "md"
        ? "h-9 w-9 rounded-xl min-[375px]:h-10 min-[375px]:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 md:rounded-2xl"
        : "h-8 w-8 rounded-lg min-[375px]:h-9 min-[375px]:w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 md:rounded-xl";

  const iconSize =
    size === "lg"
      ? "h-5 w-5 min-[375px]:h-6 min-[375px]:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
      : size === "md"
        ? "h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7"
        : "h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 sm:h-4 sm:w-4 md:h-5 md:w-5";

  const iconColor = variant === "primary" ? "text-[#2E7D9A]" : "text-slate-300";

  return (
    <div className={`flex items-center justify-center border ${shell} ${dimensions}`}>
      <Icon className={`${iconSize} ${iconColor}`} />
    </div>
  );
}

export default function LoginHeroVisual() {
  return (
    <div className="relative mb-4 w-full max-w-[280px] rounded-[20px] border border-white/5 bg-[#1E293B]/50 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md min-[375px]:mb-5 min-[375px]:max-w-[320px] min-[375px]:rounded-[22px] sm:mb-6 sm:max-w-[360px] sm:rounded-[24px] md:mb-7 md:max-w-[400px] lg:mb-8 lg:max-w-[440px] xl:max-w-[480px]">
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-[#1E3A5F] via-[#0F172A] to-[#0F172A] min-[375px]:rounded-[18px] sm:rounded-[20px] lg:rounded-[18px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(46,125,154,0.2),transparent_55%)]" />

        <div className="relative z-10 h-full w-full">
          <div className="absolute left-1/2 top-[14%] -translate-x-1/2 sm:top-[16%]">
            <IconTile icon={Laptop} variant="primary" size="md" />
          </div>
          <div className="absolute left-[10%] top-1/2 -translate-y-1/2 sm:left-[12%]">
            <IconTile icon={Printer} size="sm" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <IconTile icon={Server} variant="primary" size="lg" />
          </div>
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 sm:right-[12%]">
            <IconTile icon={Monitor} variant="primary" size="md" />
          </div>
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 sm:bottom-[20%]">
            <IconTile icon={Router} size="sm" />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[31%] h-[18%] w-px -translate-x-1/2 bg-gradient-to-b from-[#2E7D9A]/40 to-transparent sm:top-[32%] sm:h-[16%]" />
          <div className="pointer-events-none absolute bottom-[31%] left-1/2 h-[18%] w-px -translate-x-1/2 bg-gradient-to-t from-[#2E7D9A]/40 to-transparent sm:bottom-[32%] sm:h-[16%]" />
          <div className="pointer-events-none absolute left-[24%] top-1/2 h-px w-[20%] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#2E7D9A]/30 to-transparent sm:left-[26%] sm:w-[22%]" />
          <div className="pointer-events-none absolute right-[24%] top-1/2 h-px w-[20%] -translate-y-1/2 bg-gradient-to-l from-transparent via-[#2E7D9A]/30 to-transparent sm:right-[26%] sm:w-[22%]" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-2 sm:bottom-3 md:bottom-4">
          <p className="px-2 text-[9px] font-medium tracking-[0.12em] text-slate-400 uppercase min-[375px]:text-[10px] sm:text-xs sm:tracking-widest">
            IT Hardware Asset Management
          </p>
        </div>
      </div>
    </div>
  );
}
