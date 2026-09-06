"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  applyDisplayScale,
  DEFAULT_DISPLAY_SCALE,
  DISPLAY_SCALE_EVENT,
  persistAutoDisplayScale,
  persistDisplayScale,
  readDisplayScaleMode,
  recommendDisplayScale,
  resolveDisplayScale,
  type DisplayScaleMode,
  type DisplayScalePercent,
} from "@/lib/display-scale";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(DISPLAY_SCALE_EVENT, onStoreChange);
  window.addEventListener("resize", onStoreChange);
  window.screen?.orientation?.addEventListener("change", onStoreChange);
  return () => {
    window.removeEventListener(DISPLAY_SCALE_EVENT, onStoreChange);
    window.removeEventListener("resize", onStoreChange);
    window.screen?.orientation?.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(): DisplayScalePercent {
  return resolveDisplayScale();
}

function getModeSnapshot(): DisplayScaleMode {
  return readDisplayScaleMode();
}

function getRecommendedSnapshot(): DisplayScalePercent {
  return recommendDisplayScale();
}

function getServerSnapshot(): DisplayScalePercent {
  return DEFAULT_DISPLAY_SCALE;
}

function getServerModeSnapshot(): DisplayScaleMode {
  return "auto";
}

export function useDisplayScale() {
  const scale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mode = useSyncExternalStore(subscribe, getModeSnapshot, getServerModeSnapshot);
  const recommended = useSyncExternalStore(subscribe, getRecommendedSnapshot, getServerSnapshot);

  useEffect(() => {
    applyDisplayScale(resolveDisplayScale());
  }, [scale, mode]);

  const setScale = useCallback((percent: DisplayScalePercent) => {
    persistDisplayScale(percent);
  }, []);

  const setAuto = useCallback(() => {
    persistAutoDisplayScale();
  }, []);

  return { scale, mode, recommended, setScale, setAuto };
}
