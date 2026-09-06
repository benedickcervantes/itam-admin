"use client";

/**
 * Scales the admin shell like Windows display scale without using html { zoom }.
 * Root zoom breaks table overflow and chart measurement; this keeps the real
 * viewport intact and only paints the inner layout smaller/larger.
 */
export function DisplayScaleFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full overflow-hidden bg-[#0F172A]">
      <div
        className="origin-top-left"
        style={{
          width: "calc(100% / var(--ui-scale, 1))",
          height: "calc(100% / var(--ui-scale, 1))",
          transform: "scale(var(--ui-scale, 1))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
