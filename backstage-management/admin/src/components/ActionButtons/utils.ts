import { hasPerms } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import type { ActionButtonItem } from "./types";

export function resolveBool(value?: boolean | (() => boolean)): boolean {
  if (typeof value === "function") return value();
  return !!value;
}

export function hasButtonPermi(permi?: string | string[]): boolean {
  if (!permi) return true;
  const list = Array.isArray(permi) ? permi : [permi];
  if (!list.length) return true;
  return list.some(item => hasPerms(item));
}

export function hasButtonRole(roles?: string | string[]): boolean {
  if (!roles) return true;
  const list = Array.isArray(roles) ? roles : [roles];
  if (!list.length) return true;
  const userRoles = useUserStoreHook().roles || [];
  return list.some(role => userRoles.includes(role));
}

export function isActionButtonVisible(item: ActionButtonItem): boolean {
  if (resolveBool(item.hidden)) return false;
  if (!hasButtonPermi(item.permi)) return false;
  if (!hasButtonRole(item.roles)) return false;
  return true;
}

export function filterVisibleButtons(
  items: ActionButtonItem[]
): ActionButtonItem[] {
  return items.filter(isActionButtonVisible);
}

export const ACTION_COLUMN_CLASS = "col-actions";

export const ACTION_COLUMN_SIDE_PADDING = 20;

/** 根据操作列按钮文案估算列宽（默认按全部按钮计算） */
export function estimateActionColumnWidth(
  labels: string[],
  options?: {
    max?: number;
    sidePadding?: number;
    charWidth?: number;
    moreWidth?: number;
    iconOnly?: boolean;
    iconWidth?: number;
    extraWidth?: number;
  }
): number {
  const max = options?.max && options.max > 0 ? options.max : labels.length;
  const sidePadding = (options?.sidePadding ?? ACTION_COLUMN_SIDE_PADDING) * 2;
  const charWidth = options?.charWidth ?? 12;
  const btnPadding = 8;
  const moreWidth = options?.moreWidth ?? 20;
  const iconWidth = options?.iconWidth ?? 28;
  const extraWidth = options?.extraWidth ?? 10;

  if (!labels.length) return sidePadding + 60 + extraWidth;

  let width = sidePadding;
  for (const label of labels.slice(0, max || labels.length)) {
    width += options?.iconOnly ? iconWidth : label.length * charWidth + btnPadding;
  }
  if (max && labels.length > max) width += moreWidth;
  return Math.ceil(width + extraWidth);
}
