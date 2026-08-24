/** ToolbarTable 空值占位符 */
export const TOOLBAR_TABLE_EMPTY_TEXT = "-";

/** 时间列默认固定宽度（容纳 YYYY-MM-DD HH:mm:ss） */
export const TOOLBAR_TABLE_DATETIME_WIDTH = 180;

export function isToolbarTableEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/** 普通列 / formatter 列统一空值展示 */
export function formatToolbarTableCellDisplay(value: unknown): string {
  if (isToolbarTableEmptyValue(value)) return TOOLBAR_TABLE_EMPTY_TEXT;
  return String(value);
}
