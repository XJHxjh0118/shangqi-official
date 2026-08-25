<template>
  <div
    class="search-filters"
    :class="{ 'is-embedded': embedded, 'is-bordered': bordered }"
    :style="rootStyle"
  >
    <slot name="header" />

    <div class="sf-bar">
      <div
        ref="gridRef"
        class="sf-grid"
        :class="{ 'is-row-collapsed': isRowCollapsed }"
      >
        <div
          v-for="field in displayFields"
          :key="field.prop"
          class="sf-field-wrap"
          :class="{ 'sf-field-wrap--wide': isWideFilterField(field) }"
          :style="wideFieldWrapStyle(field)"
        >
          <div class="sf-item" :class="[itemLayoutClass(field), 'sf-item--fixed']">
            <label v-if="shouldShowLabel(field)" class="sf-label">{{ field.label }}</label>
            <div
              class="sf-control"
              :class="{ 'sf-control--daterange': isWideFilterField(field) }"
              :style="controlStyle(field)"
            >
              <slot
                v-if="isSlotField(field)"
                :name="field.slot || field.prop"
                :field="field"
                :model="formModel"
                :value="formModel[field.prop]"
                :set-value="(val: unknown) => setFieldValue(field.prop, val)"
              />
              <el-input
                v-else-if="resolveType(field) === 'input'"
                :model-value="stringModelValue(field.prop)"
                :placeholder="fieldPlaceholder(field)"
                :disabled="field.disabled"
                :prefix-icon="resolveInputIcon(field, 'prefix')"
                :suffix-icon="resolveInputIcon(field, 'suffix')"
                v-bind="omitInputIconProps(field.componentProps)"
                :clearable="resolveClearable(field, clearable)"
                @update:model-value="(v) => setFieldValue(field.prop, v)"
                @keyup.enter="onSearch"
                @change="emitFieldChange(field)"
                @clear="emitFieldChange(field)"
              />
              <div
                v-else-if="resolveType(field) === 'select'"
                class="sf-select-wrap"
                :class="{ 'is-filled-clearable': shouldShowSelectClear(field) }"
              >
                <el-select
                  :model-value="selectModelValue(field.prop)"
                  :placeholder="fieldPlaceholder(field, TEXT.selectPlaceholder)"
                  :disabled="field.disabled"
                  :filterable="field.filterable"
                  class="sf-control-inner"
                  v-bind="omitClearableProp(field.componentProps)"
                  :clearable="false"
                  @update:model-value="(v) => onSelectChange(field, v)"
                >
                  <el-option
                    v-for="opt in field.options ?? []"
                    :key="String(opt.value)"
                    :label="opt.label"
                    :value="opt.value"
                    :disabled="opt.disabled"
                  />
                </el-select>
                <span
                  v-if="shouldShowSelectClear(field)"
                  class="sf-select-clear"
                  role="button"
                  aria-label="清除"
                  @click.stop="clearSelectField(field)"
                >
                  <el-icon><CircleClose /></el-icon>
                </span>
              </div>
              <div
                v-else-if="resolveType(field) === 'remote-select'"
                class="sf-select-wrap"
                :class="{ 'is-filled-clearable': shouldShowSelectClear(field) }"
              >
                <el-select
                  :model-value="selectModelValue(field.prop)"
                  :placeholder="fieldPlaceholder(field, TEXT.remoteSelectPlaceholder)"
                  :disabled="field.disabled"
                  filterable
                  remote
                  :reserve-keyword="resolveReserveKeyword(field)"
                  :remote-method="(query: string) => onRemoteSearch(field, query)"
                  :loading="resolveRemoteLoading(field)"
                  class="sf-control-inner"
                  v-bind="omitRemoteSelectProps(field.componentProps)"
                  :clearable="false"
                  @update:model-value="(v) => onSelectChange(field, v)"
                >
                  <el-option
                    v-for="opt in field.options ?? []"
                    :key="String(opt.value)"
                    :label="opt.label"
                    :value="opt.value"
                    :disabled="opt.disabled"
                  />
                </el-select>
                <span
                  v-if="shouldShowSelectClear(field)"
                  class="sf-select-clear"
                  role="button"
                  aria-label="清除"
                  @click.stop="clearSelectField(field)"
                >
                  <el-icon><CircleClose /></el-icon>
                </span>
              </div>
              <div
                v-else-if="resolveType(field) === 'tree-select'"
                class="sf-select-wrap"
                :class="{ 'is-filled-clearable': shouldShowSelectClear(field) }"
              >
                <el-tree-select
                  :model-value="selectModelValue(field.prop)"
                  :data="field.treeOptions ?? []"
                  :props="{ value: 'value', label: 'label', children: 'children', disabled: 'disabled' }"
                  value-key="value"
                  :placeholder="fieldPlaceholder(field, TEXT.selectPlaceholder)"
                  :disabled="field.disabled"
                  :filterable="field.filterable"
                  class="sf-control-inner"
                  v-bind="omitClearableProp(field.componentProps)"
                  :clearable="false"
                  check-strictly
                  default-expand-all
                  @update:model-value="(v) => onSelectChange(field, v)"
                />
                <span
                  v-if="shouldShowSelectClear(field)"
                  class="sf-select-clear"
                  role="button"
                  aria-label="清除"
                  @click.stop="clearSelectField(field)"
                >
                  <el-icon><CircleClose /></el-icon>
                </span>
              </div>
              <el-date-picker
                v-else-if="resolveType(field) === 'date'"
                :model-value="dateModelValue(field.prop)"
                type="date"
                :placeholder="fieldPlaceholder(field, TEXT.datePlaceholder)"
                :disabled="field.disabled"
                value-format="YYYY-MM-DD"
                class="sf-control-inner"
                v-bind="omitDatePickerManagedProps(field.componentProps)"
                :clearable="resolveClearable(field, clearable)"
                @update:model-value="(v) => onSelectChange(field, v)"
                @clear="emitFieldChange(field)"
              />
              <el-date-picker
                v-else-if="resolveType(field) === 'datetime'"
                :model-value="dateModelValue(field.prop)"
                type="datetime"
                :placeholder="fieldPlaceholder(field, TEXT.datetimePlaceholder)"
                :disabled="field.disabled"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="sf-control-inner"
                v-bind="omitDatePickerManagedProps(field.componentProps)"
                :clearable="resolveClearable(field, clearable)"
                @update:model-value="(v) => onSelectChange(field, v)"
                @clear="emitFieldChange(field)"
              />
              <el-date-picker
                v-else-if="resolveType(field) === 'daterange'"
                :model-value="dateRangeModelValue(field.prop)"
                type="daterange"
                range-separator="至"
                :start-placeholder="rangeStartPlaceholder(field)"
                :end-placeholder="rangeEndPlaceholder(field)"
                :disabled="field.disabled"
                value-format="YYYY-MM-DD"
                class="sf-control-inner sf-daterange-picker"
                v-bind="omitDatePickerManagedProps(field.componentProps)"
                :clearable="resolveClearable(field, clearable)"
                @update:model-value="(v) => onSelectChange(field, v)"
                @clear="emitFieldChange(field)"
              />
              <el-date-picker
                v-else-if="resolveType(field) === 'datetimerange'"
                :model-value="dateTimeRangeModelValue(field.prop)"
                type="datetimerange"
                range-separator="至"
                :start-placeholder="rangeStartPlaceholder(field)"
                :end-placeholder="rangeEndPlaceholder(field)"
                :disabled="field.disabled"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="sf-control-inner sf-daterange-picker"
                v-bind="omitDatePickerManagedProps(field.componentProps)"
                :clearable="resolveClearable(field, clearable)"
                @update:model-value="(v) => onSelectChange(field, v)"
                @clear="emitFieldChange(field)"
              />
            </div>
          </div>
        </div>
        <SearchFiltersActions
          action-class="sf-actions--flow"
          :expandable="showExpandToggle"
          :expanded="expanded"
          :expand-text="expandText"
          :collapse-text="collapseText"
          :show-actions="showActions"
          :loading="loading"
          :search-disabled="searchCooldown || searchPending"
          :query-text="queryText"
          :reset-text="resetText"
          :model="formModel"
          @search="onSearch"
          @reset="onReset"
          @toggle-expand="toggleExpand"
        >
          <template v-if="$slots['actions-prefix']" #actions-prefix>
            <slot name="actions-prefix" />
          </template>
          <template v-if="$slots.actions" #actions="slotProps">
            <slot name="actions" v-bind="slotProps" />
          </template>
          <template v-if="$slots['actions-suffix']" #actions-suffix>
            <slot name="actions-suffix" />
          </template>
          <template v-if="$slots['actions-right']" #actions-right="slotProps">
            <slot name="actions-right" v-bind="slotProps" />
          </template>
        </SearchFiltersActions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import CircleClose from "~icons/ep/circle-close";
import SearchFiltersActions from "./SearchFiltersActions.vue";
import type {
  SearchFilterColSpan,
  SearchFilterField,
  SearchFilterFieldChangePayload,
  SearchFilterFieldType,
  SearchFilterLayout,
  SearchFilterRemoteSearchPayload,
  SearchFiltersSearchPayload
} from "./types";
import {
  buildEmptyValues,
  cloneFilterValues,
  controlStyleForField,
  toCssWidth,
  resolveFieldPlaceholder,
  resolveRangeEndPlaceholder,
  resolveRangeStartPlaceholder,
  shouldShowFieldLabel,
  omitInputIconProps,
  omitClearableProp,
  omitDatePickerManagedProps,
  omitRemoteSelectProps,
  normalizeDateOnly,
  isWideFilterField,
  dateRangeControlStyle,
  normalizeDateRangeFilterValue,
  normalizeDateTimeRangeFilterValue,
  orderSearchFilterFields,
  resolveClearable,
  resolveInputIcon
} from "./utils";

defineOptions({ name: "SearchFilters" });

const TEXT = {
  selectPlaceholder: "请选择",
  remoteSelectPlaceholder: "请输入",
  datePlaceholder: "请选择",
  datetimePlaceholder: "请选择",
  rangeDatePlaceholder: "开始时间"
};

const SEARCH_COOLDOWN_MS = 500;

const props = withDefaults(
  defineProps<{
    fields: SearchFilterField[];
    layout?: SearchFilterLayout;
    controlWidth?: string | number;
    controlMinWidth?: string | number;
    gutter?: number;
    colSpan?: SearchFilterColSpan;
    defaultValues?: Record<string, unknown>;
    showActions?: boolean;
    clearable?: boolean;
    queryText?: string;
    resetText?: string;
    expandable?: boolean;
    collapsedRows?: number;
    collapsedCount?: number;
    defaultCollapsed?: boolean;
    expandText?: string;
    collapseText?: string;
    loading?: boolean;
    displayMode?: "grid" | "inline" | "block";
    embedded?: boolean;
    bordered?: boolean;
    showLabel?: boolean;
    labelWidth?: string | number;
  }>(),
  {
    layout: "inline",
    controlWidth: 160,
    controlMinWidth: 160,
    gutter: 16,
    colSpan: () => ({ xs: 24, sm: 12, md: 8, lg: 6, xl: 6 }),
    showActions: true,
    clearable: true,
    queryText: "查询",
    resetText: "重置",
    expandable: false,
    collapsedCount: 4,
    defaultCollapsed: true,
    expandText: "展开",
    collapseText: "收起",
    loading: false,
    displayMode: "grid",
    embedded: false,
    bordered: true,
    showLabel: true,
    labelWidth: 70
  }
);

const formModel = defineModel<Record<string, unknown>>({ default: () => ({}) });

const emit = defineEmits<{
  search: [payload: SearchFiltersSearchPayload];
  reset: [payload: SearchFiltersSearchPayload];
  "field-change": [payload: SearchFilterFieldChangePayload];
  "remote-search": [payload: SearchFilterRemoteSearchPayload];
}>();

function canCollapseFilters(): boolean {
  return Boolean(
    props.expandable || (props.collapsedRows != null && props.collapsedRows > 0)
  );
}

function initialExpanded(): boolean {
  if (!canCollapseFilters()) return true;
  return !props.defaultCollapsed;
}

const gridRef = ref<HTMLElement>();
const expanded = ref(initialExpanded());
const rowCount = ref(0);
let gridResizeObserver: ResizeObserver | undefined;
let measureScheduled = false;

const useRowCollapse = computed(
  () => props.collapsedRows != null && props.collapsedRows > 0
);

const collapseActive = computed(() => canCollapseFilters() && !expanded.value);
const isRowCollapsed = computed(() => collapseActive.value && useRowCollapse.value);

const visibleFields = computed(() =>
  orderSearchFilterFields(props.fields.filter(f => !f.hidden))
);

const displayFields = computed(() => {
  const list = visibleFields.value;
  if (!collapseActive.value) return list;

  if (useRowCollapse.value) {
    return list.filter(field => !field.expandOnly);
  }

  let normalShown = 0;
  return list.filter(field => {
    if (field.expandOnly) return false;
    if (normalShown < props.collapsedCount) {
      normalShown++;
      return true;
    }
    return false;
  });
});

const showExpandToggle = computed(() => {
  if (useRowCollapse.value) {
    return rowCount.value > (props.collapsedRows ?? 0);
  }
  if (!props.expandable) return false;
  const normalCount = visibleFields.value.filter(field => !field.expandOnly).length;
  return normalCount > props.collapsedCount;
});

function measureFieldRows(): void {
  if (!useRowCollapse.value) {
    rowCount.value = 0;
    clearCollapsedFieldHidden();
    return;
  }

  const grid = gridRef.value;
  if (!grid) return;

  const wraps = Array.from(grid.querySelectorAll<HTMLElement>(".sf-field-wrap"));
  if (!wraps.length) {
    rowCount.value = 0;
    return;
  }

  wraps.forEach(el => el.classList.remove("is-sf-row-collapsed-hidden"));
  void grid.offsetHeight;

  const rowTops: number[] = [];
  const wrapRowIndex: number[] = [];

  wraps.forEach(el => {
    const top = el.offsetTop;
    let rowIndex = rowTops.findIndex(item => Math.abs(item - top) <= 4);
    if (rowIndex < 0) {
      rowIndex = rowTops.length;
      rowTops.push(top);
    }
    wrapRowIndex.push(rowIndex);
  });

  const order = rowTops
    .map((top, index) => ({ top, index }))
    .sort((a, b) => a.top - b.top);
  const remap = new Map(order.map((item, sortedIndex) => [item.index, sortedIndex]));
  const normalizedRowIndex = wrapRowIndex.map(idx => remap.get(idx) ?? idx);

  rowCount.value = order.length;

  const limit = props.collapsedRows ?? 0;
  const shouldHide = collapseActive.value && limit > 0;
  wraps.forEach((el, i) => {
    const hide = shouldHide && (normalizedRowIndex[i] ?? 0) >= limit;
    el.classList.toggle("is-sf-row-collapsed-hidden", hide);
  });
}

function clearCollapsedFieldHidden(): void {
  const grid = gridRef.value;
  if (!grid) return;
  grid
    .querySelectorAll<HTMLElement>(".sf-field-wrap.is-sf-row-collapsed-hidden")
    .forEach(el => {
      el.classList.remove("is-sf-row-collapsed-hidden");
    });
}

function scheduleMeasureFieldRows(): void {
  if (measureScheduled) return;
  measureScheduled = true;
  nextTick(() => {
    measureScheduled = false;
    measureFieldRows();
  });
}

watch(
  [visibleFields, () => props.collapsedRows, expanded, displayFields],
  scheduleMeasureFieldRows,
  { deep: true }
);

onMounted(() => {
  scheduleMeasureFieldRows();
  if (!gridRef.value || typeof ResizeObserver === "undefined") return;
  gridResizeObserver = new ResizeObserver(scheduleMeasureFieldRows);
  gridResizeObserver.observe(gridRef.value);
});

onBeforeUnmount(() => {
  gridResizeObserver?.disconnect();
});

const fieldsStructureKey = computed(() =>
  props.fields
    .map(field => `${field.prop}:${field.type ?? "input"}:${field.hidden ? 1 : 0}`)
    .join("|")
);

function filterModelsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = a[key];
    const right = b[key];
    if (left === right) continue;
    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length || left.some((v, i) => v !== right[i])) {
        return false;
      }
      continue;
    }
    return false;
  }
  return true;
}

watch(fieldsStructureKey, () => ensureModelKeys(), { immediate: true });

watch(
  () => props.defaultValues,
  () => {
    if (!Object.keys(formModel.value ?? {}).length && props.defaultValues) {
      formModel.value = cloneFilterValues(props.defaultValues);
    }
  },
  { deep: true, immediate: true }
);

function normalizeFieldValue(field: SearchFilterField, value: unknown): unknown {
  const type = resolveType(field);
  if (type === "daterange") return normalizeDateRangeFilterValue(value);
  if (type === "datetimerange") return normalizeDateTimeRangeFilterValue(value);
  if (type === "date") return normalizeDateOnly(value) ?? undefined;
  return value;
}

function ensureModelKeys() {
  const base = {
    ...buildEmptyValues(props.fields),
    ...cloneFilterValues(props.defaultValues),
    ...cloneFilterValues(formModel.value)
  };
  for (const field of props.fields) {
    if (field.hidden) continue;
    if (field.prop in base) {
      base[field.prop] = normalizeFieldValue(field, base[field.prop]);
    }
  }
  const current = formModel.value ?? {};
  if (filterModelsEqual(current, base)) return;
  formModel.value = base;
}

function resolveType(field: SearchFilterField): SearchFilterFieldType {
  return field.type ?? "input";
}

function isSlotField(field: SearchFilterField) {
  return resolveType(field) === "slot";
}

function itemLayout(field: SearchFilterField): SearchFilterLayout {
  return field.layout ?? props.layout;
}

function itemLayoutClass(field: SearchFilterField) {
  return `sf-item--${itemLayout(field)}`;
}

const rootStyle = computed(() => ({
  "--sf-control-min-width": toCssWidth(props.controlMinWidth, "160px"),
  "--sf-field-gap": `${props.gutter}px`,
  "--sf-label-width": toCssWidth(props.labelWidth, "70px")
}));

function controlStyle(field: SearchFilterField) {
  return controlStyleForField(field, {
    controlWidth: props.controlWidth,
    controlMinWidth: props.controlMinWidth,
    fieldGap: props.gutter,
    labelWidth: props.labelWidth,
    showLabel: props.showLabel
  });
}

function wideFieldWrapStyle(field: SearchFilterField) {
  if (!isWideFilterField(field)) return undefined;
  return dateRangeControlStyle(field, {
    controlWidth: props.controlWidth,
    fieldGap: props.gutter,
    labelWidth: props.labelWidth,
    showLabel: props.showLabel
  });
}

function stringModelValue(prop: string): string {
  const v = formModel.value[prop];
  if (v === undefined || v === null) return "";
  return String(v);
}

type SelectModelValue = string | number | boolean | string[] | number[] | undefined;

function selectModelValue(prop: string): SelectModelValue {
  const v = formModel.value[prop];
  if (v === undefined || v === null || v === "") return undefined;
  if (Array.isArray(v)) return v as string[] | number[];
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return v;
  }
  return undefined;
}

function dateModelValue(prop: string): string | undefined {
  return normalizeDateOnly(formModel.value[prop]);
}

function dateRangeModelValue(prop: string): [string, string] | undefined {
  return normalizeDateRangeFilterValue(formModel.value[prop]) ?? undefined;
}

function dateTimeRangeModelValue(prop: string): [string, string] | undefined {
  return normalizeDateTimeRangeFilterValue(formModel.value[prop]) ?? undefined;
}

function setFieldValue(prop: string, value: unknown) {
  formModel.value = { ...formModel.value, [prop]: value };
}

function onSelectChange(field: SearchFilterField, value: unknown) {
  const type = resolveType(field);
  let next = value;
  if (type === "daterange") next = normalizeDateRangeFilterValue(value);
  else if (type === "datetimerange") next = normalizeDateTimeRangeFilterValue(value);
  else if (type === "date") next = normalizeDateOnly(value) ?? undefined;
  setFieldValue(field.prop, next);
  emitFieldChange(field);
}

function shouldShowSelectClear(field: SearchFilterField): boolean {
  if (field.disabled) return false;
  if (!resolveClearable(field, props.clearable)) return false;
  const v = formModel.value[field.prop];
  if (v === undefined || v === null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function clearSelectField(field: SearchFilterField) {
  const multiple = field.componentProps?.multiple === true;
  setFieldValue(field.prop, multiple ? [] : undefined);
  emitFieldChange(field);
}

function resolveReserveKeyword(field: SearchFilterField): boolean {
  if (field.reserveKeyword === false) return false;
  const fromProps =
    field.componentProps?.reserveKeyword ?? field.componentProps?.["reserve-keyword"];
  if (fromProps === false) return false;
  return true;
}

function resolveRemoteLoading(field: SearchFilterField): boolean {
  if (field.remoteLoading === true) return true;
  return field.componentProps?.loading === true;
}

function onRemoteSearch(field: SearchFilterField, query: string) {
  emit("remote-search", { prop: field.prop, query, field });
  field.remoteMethod?.(query);
}

function emitFieldChange(field: SearchFilterField) {
  emit("field-change", {
    prop: field.prop,
    value: normalizeFieldValue(field, formModel.value[field.prop]),
    field
  });
}

function shouldShowLabel(field: SearchFilterField) {
  return shouldShowFieldLabel(field, props.showLabel);
}

function hideFieldLabel() {
  return props.showLabel === false;
}

function fieldPlaceholder(field: SearchFilterField, fallback = "") {
  return resolveFieldPlaceholder(field, fallback, {
    hideLabel: hideFieldLabel(),
    type: resolveType(field)
  });
}

function rangeStartPlaceholder(field: SearchFilterField) {
  return resolveRangeStartPlaceholder(field, TEXT.rangeDatePlaceholder, hideFieldLabel());
}

function rangeEndPlaceholder(field: SearchFilterField) {
  return resolveRangeEndPlaceholder(field, TEXT.rangeDatePlaceholder, hideFieldLabel());
}

function getValues(): SearchFiltersSearchPayload {
  const values = cloneFilterValues(formModel.value);
  for (const field of props.fields) {
    if (field.hidden) continue;
    if (field.prop in values) {
      values[field.prop] = normalizeFieldValue(field, values[field.prop]);
    }
  }
  return values;
}

function runSearch() {
  emit("search", getValues());
}

const searchCooldown = ref(false);
const searchPending = ref(false);
let searchBlockedUntil = 0;
let searchCooldownTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.loading,
  loading => {
    if (!loading) searchPending.value = false;
  }
);

function onSearch() {
  if (props.loading || searchPending.value) return;
  const now = Date.now();
  if (now < searchBlockedUntil) return;
  searchBlockedUntil = now + SEARCH_COOLDOWN_MS;
  searchCooldown.value = true;
  searchPending.value = true;
  if (searchCooldownTimer) clearTimeout(searchCooldownTimer);
  searchCooldownTimer = setTimeout(() => {
    searchCooldown.value = false;
    searchCooldownTimer = null;
  }, SEARCH_COOLDOWN_MS);
  runSearch();
  nextTick(() => {
    if (!props.loading) searchPending.value = false;
  });
}

onBeforeUnmount(() => {
  if (searchCooldownTimer) clearTimeout(searchCooldownTimer);
});

function onReset() {
  if (props.defaultValues) {
    formModel.value = cloneFilterValues(props.defaultValues);
  } else {
    formModel.value = buildEmptyValues(props.fields);
  }
  emit("reset", getValues());
}

function toggleExpand() {
  expanded.value = !expanded.value;
}

defineExpose({
  getValues,
  search: onSearch,
  reset: onReset,
  toggleExpand
});
</script>

<style scoped lang="scss">
$sf-font-size: 14px;
$sf-control-height: 32px;
$sf-text-color: #000;
$sf-border-color: rgba(0, 0, 0, 0.1);

.search-filters {
  flex-shrink: 0;
  margin-bottom: 16px;

  &.is-bordered {
    padding: 12px;
    border-radius: 12px;
    background: var(--el-bg-color);
    box-sizing: border-box;
  }

  &:not(.is-bordered) {
    margin-bottom: 12px;
  }

  &.is-embedded {
    margin-bottom: 12px;
  }
}

.sf-bar {
  width: 100%;
}

.sf-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px var(--sf-field-gap, 16px);
  width: 100%;
}

.sf-field-wrap {
  flex: 0 0 auto;
  max-width: 100%;
}

.sf-field-wrap.is-sf-row-collapsed-hidden {
  display: none !important;
}

.sf-field-wrap--wide {
  flex: 0 0 auto;
  min-width: 0;
  box-sizing: border-box;

  .sf-item {
    width: 100%;
  }

  .sf-control {
    flex: 1 1 auto;
    min-width: 0;
    width: auto;
  }
}

.sf-item {
  display: flex;
  gap: 8px;
  margin-bottom: 0;
  min-width: 0;
}

.sf-item--inline {
  flex-direction: row;
  align-items: center;

  .sf-label {
    flex: 0 0 var(--sf-label-width, 70px);
    width: var(--sf-label-width, 70px);
    max-width: var(--sf-label-width, 70px);
    margin-bottom: 0;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
    line-height: 32px;
  }

  .sf-control:not(.sf-control--daterange) {
    flex: 0 0 auto;
  }

  .sf-control--daterange {
    flex: 1 1 auto;
    min-width: 0;
  }
}

.sf-item--fixed {
  .sf-control:not(.sf-control--daterange) {
    flex: 0 0 auto;
  }
}

.sf-item--vertical {
  flex-direction: column;
  align-items: stretch;

  .sf-label {
    width: var(--sf-label-width, 70px);
    max-width: 100%;
    box-sizing: border-box;
    text-align: right;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .sf-control {
    width: 100%;
  }

  .sf-control--daterange {
    width: auto;
    align-self: flex-start;
  }
}

.sf-label {
  font-size: $sf-font-size;
  font-weight: 400;
  line-height: 22px;
  color: $sf-text-color;
  text-align: right;
}

.sf-control {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-date-editor.el-input__wrapper) {
    min-height: $sf-control-height;
    height: $sf-control-height;
    border-radius: 4px;
  }
}

.sf-control:not(.sf-control--daterange) {
  min-width: var(--sf-control-min-width, 160px);

  :deep(.el-input),
  :deep(.el-select),
  :deep(.el-date-editor.el-input) {
    min-width: inherit;
  }
}

.sf-control-inner {
  width: 100%;
}

.sf-select-wrap {
  position: relative;
  width: 100%;

  &.is-filled-clearable {
    :deep(.el-select__suffix .el-select__caret) {
      opacity: 0;
      pointer-events: none;
    }
  }
}

.sf-select-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: -8px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--el-text-color-secondary);
  }
}

.sf-control--daterange {
  .sf-control-inner,
  .sf-daterange-picker {
    width: 100%;
  }

  :deep(.el-date-editor--daterange),
  :deep(.el-date-editor--datetimerange) {
    width: 100% !important;
    --el-date-editor-width: 100%;
  }

  :deep(.el-range__icon) {
    display: none;
  }

  :deep(.el-range-input) {
    width: auto !important;
    flex: 0 1 auto;
    min-width: 0;
  }

  :deep(.el-range-separator) {
    flex: 0 0 auto;
    width: auto;
    padding: 0 4px;
    color: var(--el-text-color-secondary);
  }
}
</style>
