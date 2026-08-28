import type { SearchFilterOption } from "@/components/SearchFilters/types";

export type ListQueryParams = {
  keyword?: string;
  enabled?: string;
  level?: string;
  isSystem?: string;
};

export const ENABLED_FILTER_OPTIONS: SearchFilterOption[] = [
  { label: "是", value: "true" },
  { label: "否", value: "false" }
];

export const ENABLED_STATUS_OPTIONS: SearchFilterOption[] = [
  { label: "启用", value: "true" },
  { label: "停用", value: "false" }
];

export function buildListQuery(
  filters: Record<string, unknown>
): ListQueryParams {
  const params: ListQueryParams = {};
  const keyword = String(filters.keyword ?? "").trim();
  if (keyword) params.keyword = keyword;

  if (filters.enabled === "true" || filters.enabled === "false") {
    params.enabled = String(filters.enabled);
  }
  if (filters.level === "main" || filters.level === "child") {
    params.level = String(filters.level);
  }
  if (filters.isSystem === "true" || filters.isSystem === "false") {
    params.isSystem = String(filters.isSystem);
  }
  return params;
}
