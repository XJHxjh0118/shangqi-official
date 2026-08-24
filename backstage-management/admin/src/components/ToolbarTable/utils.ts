import type { ToolbarButtonItem } from "./types";

export function resolveBool(value?: boolean | (() => boolean)): boolean {
  if (typeof value === "function") return value();
  return !!value;
}

export function filterVisibleButtons(
  items: ToolbarButtonItem[]
): ToolbarButtonItem[] {
  return items.filter(item => !resolveBool(item.hidden));
}
