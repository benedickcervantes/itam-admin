const COMPUTER_TYPES = new Set(["LAPTOP", "DESKTOP", "ALL_IN_ONE"]);

/** Desktops, laptops, and all-in-ones. Peripherals and infrastructure are excluded. */
export function isComputerAsset(asset: {
  item_type?: string | null;
  device_type?: string | null;
}) {
  if (asset.item_type && COMPUTER_TYPES.has(asset.item_type)) return true;
  if (!asset.item_type && asset.device_type && COMPUTER_TYPES.has(asset.device_type)) return true;
  return false;
}
