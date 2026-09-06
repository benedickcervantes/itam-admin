export const DISPLAY_SCALE_STORAGE_KEY = "itam_display_scale";
export const DISPLAY_SCALE_MODE_KEY = "itam_display_scale_mode";
export const DISPLAY_SCALE_EVENT = "itam:display-scale";

export const DISPLAY_SCALE_OPTIONS = [60, 70, 75, 80, 90, 100] as const;
export type DisplayScalePercent = (typeof DISPLAY_SCALE_OPTIONS)[number];
export type DisplayScaleMode = "auto" | "manual";

export const DEFAULT_DISPLAY_SCALE: DisplayScalePercent = 100;

/** Manual override lives in memory only so a refresh returns to auto-detect. */
let sessionManualScale: DisplayScalePercent | null = null;

export function isDisplayScale(value: number): value is DisplayScalePercent {
  return (DISPLAY_SCALE_OPTIONS as readonly number[]).includes(value);
}

/** CSS pixels available to the page: monitor size, or the window if it is smaller. */
export function getDisplayWidth(): number {
  if (typeof window === "undefined") return 1920;
  const screenWidth = window.screen?.width || 1920;
  const availWidth = window.screen?.availWidth || screenWidth;
  const viewWidth = window.innerWidth || screenWidth;
  return Math.min(screenWidth, availWidth, viewWidth);
}

export function getDisplaySizeLabel(): string {
  if (typeof window === "undefined") return "";
  const width = Math.min(window.screen?.width || 0, window.innerWidth || 0) || getDisplayWidth();
  const height = Math.min(window.screen?.height || 0, window.innerHeight || 0);
  if (!width || !height) return `${getDisplayWidth()}px`;
  return `${width} × ${height}`;
}

/** Zoom-out more on compact laptop / 1366p-class displays. */
export function recommendDisplayScale(width = getDisplayWidth()): DisplayScalePercent {
  if (width <= 1100) return 60;
  if (width <= 1280) return 75;
  if (width <= 1440) return 80;
  if (width <= 1600) return 90;
  return 100;
}

export function readDisplayScaleMode(): DisplayScaleMode {
  return sessionManualScale == null ? "auto" : "manual";
}

export function resolveDisplayScale(): DisplayScalePercent {
  return sessionManualScale ?? recommendDisplayScale();
}

export function applyDisplayScale(percent: DisplayScalePercent) {
  const factor = percent / 100;
  const root = document.documentElement;
  root.dataset.uiScale = String(percent);
  root.dataset.uiScaleMode = readDisplayScaleMode();
  root.style.setProperty("--ui-scale", String(factor));
  root.style.removeProperty("zoom");
  root.style.removeProperty("width");
  root.style.removeProperty("height");
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

export function persistDisplayScale(percent: DisplayScalePercent) {
  sessionManualScale = percent;
  applyDisplayScale(percent);
  window.dispatchEvent(new CustomEvent(DISPLAY_SCALE_EVENT, { detail: percent }));
}

export function persistAutoDisplayScale() {
  sessionManualScale = null;
  const percent = recommendDisplayScale();
  applyDisplayScale(percent);
  window.dispatchEvent(new CustomEvent(DISPLAY_SCALE_EVENT, { detail: percent }));
}

/**
 * Always auto-detect on a full page load. Manual scale is session-only.
 * Keep recommend() thresholds in sync with recommendDisplayScale().
 */
export const DISPLAY_SCALE_BOOTSTRAP = `(function(){try{localStorage.removeItem("itam_display_scale");localStorage.removeItem("itam_display_scale_mode");var w=Math.min(screen.width||1920,screen.availWidth||screen.width||1920,window.innerWidth||1920);var n=w<=1100?60:w<=1280?75:w<=1440?80:w<=1600?90:100;var f=n/100;var r=document.documentElement;r.style.setProperty("--ui-scale",String(f));r.style.removeProperty("zoom");r.setAttribute("data-ui-scale",String(n));r.setAttribute("data-ui-scale-mode","auto");}catch(e){}})();`;
