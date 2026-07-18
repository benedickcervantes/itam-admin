"use client";

import { Laptop, ScanLine, Server, ShieldCheck } from "lucide-react";
import AuthRadarOverlay from "@/components/AuthRadarOverlay";

const BLIPS = [
  { label: "Friend or foe? Checking asset IDs", icon: ShieldCheck },
  { label: "Laptop blip at 2 o'clock (probably)", icon: Laptop },
  { label: "Barcodes, do you copy?", icon: ScanLine },
  { label: "Command center entering range", icon: Server },
];

export default function LoginSuccessOverlay({
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
      title="Spinning up the asset radar"
      subtitle="One sweep. Zero mystery hardware… hopefully"
      doneTitle={firstName ? `Contact confirmed, ${firstName}` : "All contacts locked"}
      doneSubtitle="Dropping you onto the asset map…"
      centerIcon={<Server className="h-8 w-8" />}
      onComplete={onComplete}
    />
  );
}
