"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DISPLAY_SCALE_EVENT } from "@/lib/display-scale";

type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
  clip: string;
};

function clipRootFor(host: HTMLElement): HTMLElement {
  return (
    host.closest<HTMLElement>("[data-drawer-scroll], .page-content") ?? document.documentElement
  );
}

function measure(host: HTMLElement): Box | null {
  const hostRect = host.getBoundingClientRect();
  if (hostRect.width < 8 || hostRect.height < 8) return null;

  const clipRect = clipRootFor(host).getBoundingClientRect();
  const left = Math.max(hostRect.left, clipRect.left, 0);
  const top = Math.max(hostRect.top, clipRect.top, 0);
  const right = Math.min(hostRect.right, clipRect.right, window.innerWidth);
  const bottom = Math.min(hostRect.bottom, clipRect.bottom, window.innerHeight);
  if (right - left < 8 || bottom - top < 8) return null;

  return {
    left: hostRect.left,
    top: hostRect.top,
    width: hostRect.width,
    height: hostRect.height,
    clip: `inset(${top - hostRect.top}px ${hostRect.right - right}px ${hostRect.bottom - bottom}px ${left - hostRect.left}px)`,
  };
}

export function PdfPreviewFrame({
  title,
  src,
  className,
  zIndex = 25,
}: {
  title: string;
  src: string;
  className?: string;
  zIndex?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const sync = () => setBox(measure(host));
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(host);
    const clipRoot = clipRootFor(host);
    if (clipRoot !== host) observer.observe(clipRoot);

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    window.addEventListener(DISPLAY_SCALE_EVENT, sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener(DISPLAY_SCALE_EVENT, sync);
    };
  }, [src]);

  return (
    <>
      <div ref={hostRef} className={className} />
      {box &&
        createPortal(
          <iframe
            title={title}
            src={src}
            className="border-0 bg-white"
            style={{
              position: "fixed",
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              clipPath: box.clip,
              zIndex,
            }}
          />,
          document.body,
        )}
    </>
  );
}
