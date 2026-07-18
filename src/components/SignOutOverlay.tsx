"use client";

import { HardDrive, KeyRound, LogOut, Save, ShieldCheck } from "lucide-react";
import AuthRadarOverlay from "@/components/AuthRadarOverlay";

const BLIPS = [
  { label: "Parking your blip for the night", icon: Save },
  { label: "Asset vault doors sealing", icon: HardDrive },
  { label: "Admin transponder going quiet", icon: KeyRound },
  { label: "Scope fading to black", icon: ShieldCheck },
];

export default function SignOutOverlay({ onComplete }: { onComplete: () => void }) {
  return (
    <AuthRadarOverlay
      blips={BLIPS}
      title="Powering down the radar"
      subtitle="Last sweep of the inventory floor"
      doneTitle="Gone dark"
      doneSubtitle="Assets secured. Until the next ping."
      centerIcon={<LogOut className="h-8 w-8" />}
      zClassName="z-[60]"
      onComplete={onComplete}
    />
  );
}
