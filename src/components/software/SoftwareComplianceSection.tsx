"use client";

import { useCallback, useEffect, useState } from "react";
import { AppWindow, CircleCheck, PackagePlus, TriangleAlert } from "lucide-react";
import { MiniStat } from "@/components/dashboard/MiniStat";
import { fetchSoftwareSummary, type SoftwareSummary } from "@/lib/api/software";

export function SoftwareComplianceSection() {
  const [data, setData] = useState<SoftwareSummary | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await fetchSoftwareSummary());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load software compliance");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section id="software" className="scroll-mt-[var(--dashboard-nav-offset,4rem)] h-full">
      <div className="card flex h-full flex-col p-4">
        <h3 className="mb-3 font-medium text-white">Software Compliance</h3>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!data && !error && (
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-800/50" />
            ))}
          </div>
        )}
        {data && (
          <div className="grid flex-1 grid-cols-1 content-start gap-2 sm:grid-cols-2">
            <MiniStat icon={AppWindow} color="teal" label="Computers" value={data.computers} href="/software" />
            <MiniStat icon={CircleCheck} color="emerald" label="Complete" value={data.complete} href="/software?compliance=complete" />
            <MiniStat icon={TriangleAlert} color="amber" label="Missing standard" value={data.missing} href="/software?compliance=missing" />
            <MiniStat icon={PackagePlus} color="violet" label="With extras" value={data.with_extras} href="/software?compliance=extras" />
          </div>
        )}
      </div>
    </section>
  );
}
