export type StatColor = "teal" | "amber" | "violet" | "emerald" | "orange" | "red";

export const STAT_COLOR_STYLES: Record<StatColor, { bg: string; text: string }> = {
  teal: { bg: "bg-sky-500/15", text: "text-sky-400" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-300" },
  violet: { bg: "bg-violet-500/15", text: "text-violet-300" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300" },
  orange: { bg: "bg-orange-500/15", text: "text-orange-300" },
  red: { bg: "bg-red-500/15", text: "text-red-300" },
};
