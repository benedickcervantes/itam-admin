"use client";

import { KeyRound, Laptop, RefreshCw, ShieldCheck } from "lucide-react";
import AuthRadarOverlay from "@/components/AuthRadarOverlay";

const BLIPS = [
  { label: "Recalibrating your last sweep", icon: RefreshCw },
  { label: "Tags blinking back online", icon: ShieldCheck },
  { label: "That monitor wandered off-grid again", icon: KeyRound },
  { label: "Workspace signal reacquired", icon: Laptop },
];

export default function SessionLoadingOverlay({
  userName,
  onComplete,
}: {
  userName?: string | null;
  onComplete: () => void;
}) {
  const firstName = userName?.split(" ")[0];

  return (
    <AuthRadarOverlay
      blips={BLIPS}
      title="Still on the scope"
      subtitle="Dusting off your last known blips"
      doneTitle={firstName ? `Back on radar, ${firstName}` : "Signal locked"}
      doneSubtitle="Rejoining the asset map…"
      centerIcon={<RefreshCw className="h-8 w-8" />}
      onComplete={onComplete}
    />
  );
}
