import type { Component } from "vue";
import type { SearchFilterField, SearchFilterFieldType } from "./types";

export function cloneFilterValues(
  source?: Record<string, unknown>
): Record<string, unknown> {
  if (!source) return {};
  return JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
}

export function buildEmptyValues(
  fields: SearchFilterField[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.hidden) continue;
    if (result[field.prop] !== undefined) continue;
    result[field.prop] = inferEmptyValue(field);
  }
  return result;
}

function inferEmptyValue(field: SearchFilterField): unknown {
  const type = field.type ?? "input";
  if (type === "daterange" || type === "datetimerange") return null;
  if (type === "select" || type === "remote-select") {
    const props = field.componentProps ?? {};
    if (props.multiple === true) return [];
    return "";
  }
  return undefined;
}

export function toCssWidth(width?: string | number, fallback = "160px"): string {
  if (width === undefined || width === null || width === "") return fallback;
  return typeof width === "number" ? `${width}px` : width;
}

export const DEFAULT_CONTROL_WIDTH = 160;
export const DEFAULT_LABEL_WIDTH = 70;
export const LABEL_CONTROL_GAP = 8;

export function parseControlWidth(
  value: string | number,
  fallback = DEFAULT_CONTROL_WIDTH
): number {
  if (typeof value === "number") return value;
  const parsed = Number.parseInt(String(value).replace(/px$/, ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function shortFilterFieldWidth(
  controlWidth: string | number = DEFAULT_CONTROL_WIDTH,
  labelWidth: string | number = DEFAULT_LABEL_WIDTH,
  showLabel = true
): number {
  const unitControl = parseControlWidth(controlWidth);
  if (!showLabel) return unitControl;
  return parseControlWidth(labelWidth, DEFAULT_LABEL_WIDTH) + LABEL_CONTROL_GAP + unitControl;
}

export function hasFieldLabel(field: SearchFilterField): boolean {
  return Boolean(field.label?.trim());
}

const GENERIC_SELECT_PLACEHOLDERS = new Set(["请选择", "请选择..."]);
const GENERIC_INPUT_PLACEHOLDERS = new Set(["请输入", "请输入..."]);
const GENERIC_DATE_PLACEHOLDERS = new Set([
  "年/月/日",
  "YYYY/MM/DD",
  "yyyy/mm/dd",
  "请选择",
  "开始时间",
  "结束时间"
]);

export const FILTER_INPUT_PLACEHOLDER = "请输入";
export const FILTER_SELECT_PLACEHOLDER = "请选择";
export const FILTER_RANGE_START_PLACEHOLDER = "开始时间";
export const FILTER_RANGE_END_PLACEHOLDER = "结束时间";

function isGenericSelectPlaceholder(text: string): boolean {
  return GENERIC_SELECT_PLACEHOLDERS.has(text.trim());
}

function isGenericInputPlaceholder(text: string): boolean {
  return GENERIC_INPUT_PLACEHOLDERS.has(text.trim());
}

function isGenericDatePlaceholder(text: string): boolean {
  return GENERIC_DATE_PLACEHOLDERS.has(text.trim());
}

export function defaultPlaceholderByType(type: SearchFilterFieldType): string {
  if (type === "input" || type === "remote-select") return FILTER_INPUT_PLACEHOLDER;
  if (
    type === "select" ||
    type === "tree-select" ||
    type === "date" ||
    type === "datetime" ||
    type === "slot"
  ) {
    return FILTER_SELECT_PLACEHOLDER;
  }
  return "";
}

export function resolveFieldPlaceholder(
  field: SearchFilterField,
  fallback: string,
  options?: { hideLabel?: boolean; type?: SearchFilterFieldType }
): string {
  const explicit = field.placeholder?.trim();
  const label = field.label?.trim();
  const type = options?.type ?? field.type ?? "input";
  const hideLabel = options?.hideLabel ?? false;
  const typeDefault = defaultPlaceholderByType(type);

  if (!hideLabel) {
    return explicit || typeDefault || fallback;
  }

  if (hideLabel && label) {
    if (
      explicit &&
      !isGenericSelectPlaceholder(explicit) &&
      !isGenericInputPlaceholder(explicit)
    ) {
      return explicit;
    }
    if (type === "input") return `请输入${label}`;
    if (type === "remote-select") return explicit || `请输入${label}`;
    if (type === "select" || type === "tree-select") return `请选择${label}`;
    if (type === "date" || type === "datetime") return label;
    if (type === "slot") return explicit || `请选择${label}`;
    return label;
  }

  return explicit || typeDefault || fallback;
}

export function resolveRangeStartPlaceholder(
  field: SearchFilterField,
  fallback: string,
  hideLabel?: boolean
): string {
  const fromProps = field.componentProps?.startPlaceholder;
  if (typeof fromProps === "string" && fromProps.trim()) {
    const text = fromProps.trim();
    if (hideLabel && isGenericDatePlaceholder(text)) return "开始时间";
    return text;
  }
  return FILTER_RANGE_START_PLACEHOLDER || fallback;
}

export function resolveRangeEndPlaceholder(
  field: SearchFilterField,
  fallback: string,
  hideLabel?: boolean
): string {
  const fromProps = field.componentProps?.endPlaceholder;
  if (typeof fromProps === "string" && fromProps.trim()) {
    const text = fromProps.trim();
    if (hideLabel && isGenericDatePlaceholder(text)) return "结束时间";
    return text;
  }
  return FILTER_RANGE_END_PLACEHOLDER || fallback;
}

export function shouldShowFieldLabel(
  field: SearchFilterField,
  showLabel = true
): boolean {
  return showLabel !== false && hasFieldLabel(field);
}

export function resolveInputIcon(
  field: SearchFilterField,
  position: "prefix" | "suffix"
): Component | undefined {
  return position === "prefix" ? field.prefixIcon : field.suffixIcon;
}

export function omitInputIconProps(
  props?: Record<string, unknown>
): Record<string, unknown> {
  if (!props) return {};
  const { "prefix-icon": _prefix, "suffix-icon": _suffix, clearable: _clearable, ...rest } =
    props;
  return rest;
}

export function omitClearableProp(
  props?: Record<string, unknown>
): Record<string, unknown> {
  if (!props) return {};
  const { clearable: _clearable, ...rest } = props;
  return rest;
}

export function omitDatePickerManagedProps(
  props?: Record<string, unknown>
): Record<string, unknown> {
  if (!props) return {};
  const {
    clearable: _clearable,
    valueFormat: _valueFormat,
    "value-format": _valueFormatKebab,
    ...rest
  } = props;
  return rest;
}

const DATE_ONLY_RE = /^(\d{4}-\d{2}-\d{2})$/;

export function normalizeDateOnly(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = String(value).trim();
  if (!raw) return undefined;
  if (DATE_ONLY_RE.test(raw)) return raw;
  const isoDatePart = raw.split("T")[0]?.trim();
  if (isoDatePart && DATE_ONLY_RE.test(isoDatePart)) return isoDatePart;
  const spaceDatePart = raw.split(" ")[0]?.trim();
  if (spaceDatePart && DATE_ONLY_RE.test(spaceDatePart)) return spaceDatePart;
  const matched = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return matched ? matched[1] : undefined;
}

export function normalizeDateRangeFilterValue(
  value: unknown
): [string, string] | null {
  if (value == null || value === "") return null;
  if (!Array.isArray(value) || value.length !== 2) return null;
  const start = normalizeDateOnly(value[0]);
  const end = normalizeDateOnly(value[1]);
  if (!start || !end) return null;
  return [start, end];
}

export function normalizeDateTimeRangeFilterValue(
  value: unknown
): [string, string] | null {
  if (value == null || value === "") return null;
  if (!Array.isArray(value) || value.length !== 2) return null;
  const start = value[0] == null ? "" : String(value[0]).trim();
  const end = value[1] == null ? "" : String(value[1]).trim();
  if (!start || !end) return null;
  return [start, end];
}

export function omitRemoteSelectProps(
  props?: Record<string, unknown>
): Record<string, unknown> {
  if (!props) return {};
  const {
    remote: _remote,
    filterable: _filterable,
    "remote-method": _remoteMethod,
    remoteMethod: _remoteMethodCamel,
    loading: _loading,
    "reserve-keyword": _reserveKeyword,
    reserveKeyword: _reserveKeywordCamel,
    clearable: _clearable,
    ...rest
  } = props;
  return rest;
}

export function resolveClearable(
  field: SearchFilterField,
  globalClearable = true
): boolean {
  if (field.clearable === false) return false;
  if (field.clearable === true) return true;
  return globalClearable !== false;
}

function resolveFieldType(field: SearchFilterField): SearchFilterFieldType {
  return field.type ?? "input";
}

export function isWideFilterField(field: SearchFilterField): boolean {
  const type = resolveFieldType(field);
  return type === "daterange" || type === "datetimerange";
}

export interface WideFilterFieldSizeOptions {
  controlWidth?: string | number;
  fieldGap?: number;
  labelWidth?: string | number;
  showLabel?: boolean;
}

export function dateRangeControlStyle(
  field: SearchFilterField,
  controlWidthOrOptions: string | number | WideFilterFieldSizeOptions = DEFAULT_CONTROL_WIDTH,
  fieldGap = 16,
  labelWidth: string | number = DEFAULT_LABEL_WIDTH,
  showLabel = true
): Record<string, string> {
  if (field.width !== undefined) {
    const style: Record<string, string> = {
      width: toCssWidth(field.width),
      maxWidth: "100%"
    };
    if (field.minWidth !== undefined) {
      style.minWidth = toCssWidth(field.minWidth);
    }
    return style;
  }

  const options: WideFilterFieldSizeOptions =
    typeof controlWidthOrOptions === "object" && controlWidthOrOptions !== null
      ? controlWidthOrOptions
      : {
          controlWidth: controlWidthOrOptions,
          fieldGap,
          labelWidth,
          showLabel
        };

  const shortUnit = shortFilterFieldWidth(
    options.controlWidth ?? DEFAULT_CONTROL_WIDTH,
    options.labelWidth ?? DEFAULT_LABEL_WIDTH,
    options.showLabel !== false
  );
  const gap = Number.isFinite(options.fieldGap) ? Number(options.fieldGap) : 16;
  const totalWidth = shortUnit * 2 + gap;
  return {
    width: `${totalWidth}px`,
    minWidth: `${totalWidth}px`,
    maxWidth: "100%"
  };
}

export interface SearchFilterControlSizeOptions {
  controlWidth: string | number;
  controlMinWidth?: string | number;
  fieldGap?: number;
  labelWidth?: string | number;
  showLabel?: boolean;
}

export function controlStyleForField(
  field: SearchFilterField,
  options: SearchFilterControlSizeOptions | string | number
): Record<string, string> {
  const size: SearchFilterControlSizeOptions =
    typeof options === "object" && options !== null && "controlWidth" in options
      ? options
      : { controlWidth: options as string | number };

  const minWidthValue = field.minWidth ?? size.controlMinWidth ?? 160;

  if (isWideFilterField(field)) {
    return {
      flex: "1 1 auto",
      width: "auto",
      minWidth: "0",
      maxWidth: "100%"
    };
  }

  const width = field.width !== undefined ? field.width : size.controlWidth;
  return {
    width: toCssWidth(width),
    minWidth: toCssWidth(minWidthValue),
    maxWidth: "100%"
  };
}

export function orderSearchFilterFields(
  fields: SearchFilterField[]
): SearchFilterField[] {
  const leading: SearchFilterField[] = [];
  const dateRanges: SearchFilterField[] = [];
  for (const field of fields) {
    const type = field.type ?? "input";
    if (type === "daterange" || type === "datetimerange") {
      dateRanges.push(field);
    } else {
      leading.push(field);
    }
  }
  if (!dateRanges.length) return fields;
  return [...leading, ...dateRanges];
}

export function parseDateRange(range: unknown): { start?: string; end?: string } {
  const normalized = normalizeDateRangeFilterValue(range);
  if (!normalized) return {};
  return { start: normalized[0], end: normalized[1] };
}

export function parseDateTimeRange(range: unknown): {
  start?: string;
  end?: string;
} {
  const normalized = normalizeDateTimeRangeFilterValue(range);
  if (!normalized) return {};
  return { start: normalized[0], end: normalized[1] };
}
