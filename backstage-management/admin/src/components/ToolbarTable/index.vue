<template>
  <div class="toolbar-table">
    <div v-if="showToolbarRow" class="toolbar-table__toolbar">
      <div class="toolbar-table__toolbar-start">
        <slot name="toolbar-left" />
        <ToolbarButtonGroup
          v-if="hasToolbarButtons"
          :buttons="toolbarButtons"
          :max="toolbarButtonsMax"
          :more-trigger="toolbarButtonsMoreTrigger"
          @action="onToolbarButtonAction"
        />
      </div>
      <div class="toolbar-table__toolbar-end">
        <RightToolbar
          v-if="showToolbar"
          v-model:showSearch="showSearchModel"
          :columns="toolbarColumns"
          v-bind="toolbarBindProps"
          @queryTable="handleQueryTable"
        />
        <slot name="toolbar-right" />
      </div>
    </div>

    <div
      class="toolbar-table__body"
      :class="{ 'is-panel': panel, 'has-footer': innerShowPagination }"
    >
      <div class="toolbar-table__shell">
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="data"
          class="toolbar-table__table"
          v-bind="tableBindProps"
          @selection-change="onSelectionChange"
          @sort-change="onSortChange"
          @row-click="onRowClick"
          @expand-change="onExpandChange"
        >
          <template v-if="$slots.empty" #empty>
            <slot name="empty" />
          </template>

          <el-table-column
            v-if="selectionColumn"
            type="selection"
            :width="selectionColumn.width ?? selectionColumn.selectionWidth ?? 55"
            :align="resolveColumnAlign(selectionColumn)"
            :fixed="selectionColumn.fixed"
            :selectable="selectionColumn.selectable"
            :reserve-selection="selectionColumn.reserveSelection === true"
            :class-name="selectionColumn.className || 'toolbar-table__selection-col'"
          />

          <template v-for="col in bodyColumns" :key="getColumnKey(col)">
            <el-table-column
              v-if="col.type === 'index' && isColumnVisible(col)"
              type="index"
              :label="col.indexLabel ?? col.label ?? '#'"
              :width="col.width ?? 60"
              :align="resolveColumnAlign(col)"
              :fixed="col.fixed"
              :class-name="col.className"
            />

            <el-table-column
              v-else-if="col.type === 'expand' && isColumnVisible(col)"
              type="expand"
              :width="col.width ?? 48"
              :fixed="col.fixed"
              :class-name="col.className"
            >
              <template #default="scope">
                <slot :name="getSlotName(col) || 'expand'" v-bind="scope" />
              </template>
            </el-table-column>

            <el-table-column
              v-else-if="col.type === 'datetime' && isColumnVisible(col)"
              :prop="col.prop"
              :label="col.label"
              :width="resolveDatetimeColumnWidth(col)"
              :align="resolveColumnAlign(col)"
              :header-align="resolveColumnHeaderAlign(col)"
              :fixed="col.fixed"
              :show-overflow-tooltip="resolveShowOverflowTooltip(col)"
              :class-name="resolveColumnClassName(col)"
              :sortable="col.sortable"
            >
              <template v-if="col.headerSlot" #header>
                <slot :name="getHeaderSlotName(col)" />
              </template>
              <template #default="scope">
                <template v-if="col.slot">
                  <slot :name="getSlotName(col)" v-bind="scope" />
                </template>
                <template v-else-if="col.formatter">
                  {{
                    formatDatetimeCell(
                      col.formatter(
                        scope.row,
                        scope.column,
                        scope.row[col.prop!],
                        scope.$index
                      ),
                      col
                    )
                  }}
                </template>
                <template v-else>
                  {{ formatDatetimeCell(scope.row[col.prop!], col) }}
                </template>
              </template>
            </el-table-column>

            <el-table-column
              v-else-if="col.slot && isColumnVisible(col)"
              :prop="col.prop"
              :label="col.label"
              :width="resolveColumnWidth(col)"
              :min-width="resolveColumnMinWidth(col)"
              :align="resolveColumnAlign(col)"
              :header-align="resolveColumnHeaderAlign(col)"
              :fixed="col.fixed"
              :show-overflow-tooltip="resolveShowOverflowTooltip(col)"
              :class-name="resolveColumnClassName(col, ['toolbar-table__slot-col'])"
              :sortable="col.sortable"
            >
              <template v-if="col.headerSlot" #header>
                <slot :name="getHeaderSlotName(col)" />
              </template>
              <template #default="scope">
                <slot :name="getSlotName(col)" v-bind="scope" />
              </template>
            </el-table-column>

            <el-table-column
              v-else-if="col.formatter && isColumnVisible(col)"
              :prop="col.prop"
              :label="col.label"
              :width="resolveColumnWidth(col)"
              :min-width="resolveColumnMinWidth(col)"
              :align="resolveColumnAlign(col)"
              :header-align="resolveColumnHeaderAlign(col)"
              :fixed="col.fixed"
              :show-overflow-tooltip="resolveShowOverflowTooltip(col)"
              :class-name="resolveColumnClassName(col)"
              :sortable="col.sortable"
            >
              <template #default="scope">
                {{
                  formatToolbarTableCellDisplay(
                    col.formatter!(
                      scope.row,
                      scope.column,
                      scope.row[col.prop!],
                      scope.$index
                    )
                  )
                }}
              </template>
            </el-table-column>

            <el-table-column
              v-else-if="isColumnVisible(col)"
              :prop="col.prop"
              :label="col.label"
              :width="resolveColumnWidth(col)"
              :min-width="resolveColumnMinWidth(col)"
              :align="resolveColumnAlign(col)"
              :header-align="resolveColumnHeaderAlign(col)"
              :fixed="col.fixed"
              :show-overflow-tooltip="resolveShowOverflowTooltip(col)"
              :class-name="resolveColumnClassName(col)"
              :sortable="col.sortable"
            >
              <template v-if="col.prop" #default="scope">
                {{ formatToolbarTableCellDisplay(scope.row[col.prop]) }}
              </template>
            </el-table-column>
          </template>

          <el-table-column
            v-if="$slots.action"
            :label="actionColumnLabel"
            :width="resolvedActionColumnWidth"
            :fixed="actionColumnFixed"
            align="left"
            header-align="center"
            class-name="col-actions"
          >
            <template #default="scope">
              <slot name="action" v-bind="scope" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="innerShowPagination" class="toolbar-table__footer">
        <Pagination
          :total="paginationTotal"
          v-model:page="pageModel"
          v-model:limit="limitModel"
          v-bind="paginationBindProps"
          @pagination="handlePagination"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, useSlots, watch } from "vue";
import RightToolbar from "./RightToolbar.vue";
import Pagination from "./Pagination.vue";
import ToolbarButtonGroup from "./ToolbarButtonGroup.vue";
import type {
  ToolbarButtonItem,
  ToolbarButtonsTrigger,
  ToolbarColumnsMap,
  ToolbarTableColumn
} from "./types";
import {
  formatToolbarTableCellDisplay,
  TOOLBAR_TABLE_DATETIME_WIDTH,
  TOOLBAR_TABLE_EMPTY_TEXT
} from "./cellDisplay";
import { LIST_DATETIME_PATTERN, parseTime } from "./parseTime";

interface Props {
  columns: ToolbarTableColumn[];
  data?: any[];
  loading?: boolean;
  showToolbar?: boolean;
  showPagination?: boolean;
  showSearch?: boolean;
  hasSearchArea?: boolean;
  toolbarProps?: Record<string, any>;
  tableProps?: Record<string, any>;
  paginationProps?: Record<string, any>;
  total?: number;
  page?: number;
  limit?: number;
  actionColumnLabel?: string;
  /** 操作列宽。不传或 `auto` 时按按钮实际宽度动态计算 */
  actionColumnWidth?: string | number;
  actionColumnFixed?: boolean | "left" | "right";
  panel?: boolean;
  toolbarButtons?: ToolbarButtonItem[];
  toolbarButtonsMax?: number;
  toolbarButtonsMoreTrigger?: ToolbarButtonsTrigger;
  defaultShowOverflowTooltip?: boolean;
  paginationShowWhen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  showToolbar: true,
  showPagination: true,
  showSearch: false,
  hasSearchArea: false,
  toolbarProps: () => ({}),
  tableProps: () => ({}),
  paginationProps: () => ({}),
  total: 0,
  page: 1,
  limit: 10,
  actionColumnLabel: "操作",
  actionColumnWidth: "auto",
  actionColumnFixed: "right",
  panel: false,
  toolbarButtons: () => [],
  toolbarButtonsMax: 5,
  toolbarButtonsMoreTrigger: "hover",
  defaultShowOverflowTooltip: true
});

const emit = defineEmits<{
  "update:showSearch": [value: boolean];
  "update:page": [value: number];
  "update:limit": [value: number];
  queryTable: [];
  pagination: [params: { page: number; limit: number }];
  selectionChange: [selection: any[]];
  sortChange: [data: { column: any; prop: string; order: string | null }];
  rowClick: [row: any, column: any, event: Event];
  expandChange: [row: any, expandedRows: any[]];
  toolbarAction: [payload: { key: string; item: ToolbarButtonItem; index: number }];
}>();

const slots = useSlots();
const tableRef = ref();
const toolbarColumns = reactive<ToolbarColumnsMap>({});

const ACTION_CELL_PADDING_X = 32;
const ACTION_COLUMN_MIN = 72;
const autoActionWidth = ref(ACTION_COLUMN_MIN);

const isAutoActionWidth = computed(
  () =>
    props.actionColumnWidth == null ||
    props.actionColumnWidth === "" ||
    props.actionColumnWidth === "auto"
);

const resolvedActionColumnWidth = computed(() =>
  isAutoActionWidth.value ? autoActionWidth.value : props.actionColumnWidth
);

function measureActionColumn() {
  if (!isAutoActionWidth.value) return;
  const root = tableRef.value?.$el as HTMLElement | undefined;
  if (!root) return;

  const inners = root.querySelectorAll<HTMLElement>(
    "td.col-actions .action-buttons"
  );
  let content = 0;
  inners.forEach(el => {
    content = Math.max(content, el.scrollWidth);
  });
  if (!content) {
    const cells = root.querySelectorAll<HTMLElement>("td.col-actions > .cell");
    cells.forEach(el => {
      content = Math.max(content, el.scrollWidth);
    });
  }

  const header = root.querySelector<HTMLElement>("th.col-actions > .cell");
  const headerWidth = header?.scrollWidth ?? ACTION_COLUMN_MIN;
  const next = Math.ceil(
    Math.max(
      ACTION_COLUMN_MIN,
      headerWidth,
      content ? content + ACTION_CELL_PADDING_X : 0
    ) + 4
  );
  if (Math.abs(next - autoActionWidth.value) < 1) return;
  autoActionWidth.value = next;
  nextTick(() => tableRef.value?.doLayout?.());
}

function scheduleMeasureActionColumn() {
  if (!isAutoActionWidth.value) return;
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(measureActionColumn);
    });
  });
}

watch(
  () => [props.data, props.loading, props.actionColumnWidth] as const,
  () => scheduleMeasureActionColumn(),
  { deep: true }
);

onMounted(scheduleMeasureActionColumn);

const selectionColumn = computed(
  () => props.columns.find(item => item.type === "selection") ?? null
);

const bodyColumns = computed(() =>
  props.columns.filter(col => col.type !== "selection")
);

function getColumnKey(col: ToolbarTableColumn): string {
  return col.key ?? col.prop ?? col.label ?? String(col.type);
}

function getSlotName(col: ToolbarTableColumn): string {
  if (typeof col.slot === "string") return col.slot;
  return col.prop ?? col.key ?? "";
}

function getHeaderSlotName(col: ToolbarTableColumn): string {
  if (typeof col.headerSlot === "string") return col.headerSlot;
  return col.prop ?? col.key ?? "";
}

function isDatetimeColumn(col: ToolbarTableColumn): boolean {
  return col.type === "datetime";
}

function resolveDatetimeColumnWidth(col: ToolbarTableColumn): string | number {
  if (col.width != null && col.width !== "") return col.width;
  if (col.minWidth != null && col.minWidth !== "") return col.minWidth;
  return TOOLBAR_TABLE_DATETIME_WIDTH;
}

function resolveColumnWidth(col: ToolbarTableColumn): string | number | undefined {
  if (col.width != null && col.width !== "") return col.width;
  return undefined;
}

function resolveColumnMinWidth(
  col: ToolbarTableColumn
): string | number | undefined {
  if (resolveColumnWidth(col) != null) return undefined;
  return col.minWidth;
}

function resolveColumnClassName(
  col: ToolbarTableColumn,
  extra: string[] = []
): string | undefined {
  const parts = [...extra];
  if (col.className) parts.push(col.className);
  if (isDatetimeColumn(col)) parts.push("toolbar-table__time-col");
  return parts.length ? parts.join(" ") : undefined;
}

function formatDatetimeCell(value: unknown, col: ToolbarTableColumn): string {
  if (value == null || value === "") return TOOLBAR_TABLE_EMPTY_TEXT;
  const raw = String(value).trim();
  if (!raw || raw === "-" || raw === "—" || /^0+[-/]0+[-/]0+/.test(raw)) {
    return TOOLBAR_TABLE_EMPTY_TEXT;
  }
  const pattern = col.datetimePattern || LIST_DATETIME_PATTERN;
  const formatted = parseTime(raw, pattern);
  if (!formatted || /^0+[-/]0+[-/]0+/.test(formatted)) {
    return TOOLBAR_TABLE_EMPTY_TEXT;
  }
  return formatted;
}

function isToggleableColumn(col: ToolbarTableColumn): boolean {
  if (col.type === "selection" || col.type === "index" || col.type === "expand") {
    return false;
  }
  if (col.toggleable === false) return false;
  return Boolean(col.label);
}

function syncToolbarColumns(): void {
  const nextKeys = new Set<string>();
  props.columns.forEach(col => {
    if (!isToggleableColumn(col)) return;
    const key = getColumnKey(col);
    nextKeys.add(key);
    if (!toolbarColumns[key]) {
      toolbarColumns[key] = { label: col.label!, visible: col.visible ?? true };
    } else {
      toolbarColumns[key].label = col.label!;
      if (col.visible !== undefined) toolbarColumns[key].visible = col.visible;
    }
  });
  Object.keys(toolbarColumns).forEach(key => {
    if (!nextKeys.has(key)) delete toolbarColumns[key];
  });
}

watch(() => props.columns, syncToolbarColumns, { immediate: true, deep: true });

watch(
  toolbarColumns,
  () => {
    nextTick(() => tableRef.value?.doLayout?.());
  },
  { deep: true }
);

function isColumnVisible(col: ToolbarTableColumn): boolean {
  if (col.type === "selection" || col.type === "index" || col.type === "expand") {
    return true;
  }
  if (col.toggleable === false) return true;
  const key = getColumnKey(col);
  if (toolbarColumns[key]) return toolbarColumns[key].visible;
  return col.visible ?? true;
}

function isMetaColumn(col: ToolbarTableColumn): boolean {
  return col.type === "selection" || col.type === "index" || col.type === "expand";
}

const firstContentColumnKey = computed(() => {
  const col = props.columns.find(item => !isMetaColumn(item));
  return col ? getColumnKey(col) : "";
});

function resolveColumnAlign(col: ToolbarTableColumn): "left" | "center" | "right" {
  if (col.align) return col.align;
  if (isMetaColumn(col)) return "center";
  if (getColumnKey(col) === firstContentColumnKey.value) return "left";
  return "center";
}

function resolveColumnHeaderAlign(
  col: ToolbarTableColumn
): "left" | "center" | "right" {
  if (col.headerAlign) return col.headerAlign;
  return resolveColumnAlign(col);
}

function resolveShowOverflowTooltip(col: ToolbarTableColumn): boolean {
  if (col.showOverflowTooltip !== undefined) return col.showOverflowTooltip;
  if (col.slot) return false;
  return props.defaultShowOverflowTooltip;
}

const hasToolbarButtons = computed(() => props.toolbarButtons.length > 0);

const showToolbarRow = computed(
  () =>
    props.showToolbar ||
    hasToolbarButtons.value ||
    Boolean(slots["toolbar-left"]) ||
    Boolean(slots.toolbar) ||
    Boolean(slots["toolbar-right"])
);

function onToolbarButtonAction(payload: {
  key: string;
  item: ToolbarButtonItem;
  index: number;
}): void {
  emit("toolbarAction", payload);
}

const searchToggleEnabled = computed(() => {
  const searchOverride = props.toolbarProps?.search;
  return searchOverride !== undefined
    ? Boolean(searchOverride)
    : props.hasSearchArea;
});

const showSearchModel = computed({
  get: () => (searchToggleEnabled.value ? props.showSearch : false),
  set: (val: boolean) => {
    if (searchToggleEnabled.value) emit("update:showSearch", val);
  }
});

function toPositiveInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const paginationTotal = computed(() => toPositiveInt(props.total, 0));

const paginationLimit = computed(() => {
  const fromProp = toPositiveInt(props.limit, 0);
  return fromProp > 0 ? fromProp : 10;
});

const pageModel = computed({
  get: () => toPositiveInt(props.page, 1),
  set: (val: number) => emit("update:page", val)
});

const limitModel = computed({
  get: () => paginationLimit.value,
  set: (val: number) => emit("update:limit", val)
});

const innerShowPagination = computed(() => {
  if (!props.showPagination) return false;
  if (props.paginationShowWhen !== undefined) return props.paginationShowWhen;
  return paginationTotal.value > 0;
});

const toolbarBindProps = computed(() => {
  const { columns: _c, showSearch: _s, search: _search, ...rest } =
    props.toolbarProps || {};
  return {
    refresh: false,
    search: searchToggleEnabled.value,
    ...rest
  };
});

const tableBindProps = computed(() => {
  const rest = { ...(props.tableProps || {}) };
  return {
    border: false,
    ...rest
  };
});

const paginationBindProps = computed(() => {
  const {
    total: _t,
    page: _p,
    limit: _l,
    hideOnSinglePage: _h,
    ...rest
  } = props.paginationProps || {};
  return {
    hideOnSinglePage: false,
    ...rest
  };
});

function handleQueryTable(): void {
  emit("queryTable");
}

function handlePagination(params: { page: number; limit: number }): void {
  emit("pagination", params);
}

function onSelectionChange(selection: any[]): void {
  emit("selectionChange", selection);
}

function onSortChange(data: {
  column: any;
  prop: string;
  order: string | null;
}): void {
  emit("sortChange", data);
}

function onRowClick(row: any, column: any, event: Event): void {
  emit("rowClick", row, column, event);
}

function onExpandChange(row: any, expandedRows: any[]): void {
  scheduleMeasureActionColumn();
  emit("expandChange", row, expandedRows);
}

defineExpose({
  tableRef
});
</script>

<style scoped lang="scss">
$toolbar-table-header-bg: #f7f8fa;
$toolbar-table-radius: 12px;
$toolbar-table-border-color: rgba(0, 0, 0, 0.1);
$toolbar-table-row-border-color: rgba(0, 0, 0, 0.06);
$toolbar-table-header-height: 42px;
$toolbar-table-cell-padding-x: 16px;
$toolbar-table-cell-padding-y: 10px;

.toolbar-table {
  width: 100%;
}

.toolbar-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  margin: 0 0 12px;
  padding: 0;
}

.toolbar-table__toolbar-start,
.toolbar-table__toolbar-end {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.toolbar-table__toolbar-end {
  margin-left: auto;
}

.toolbar-table__body {
  display: flex;
  flex-direction: column;
  overflow: visible;

  &.is-panel {
    position: relative;
    border-radius: $toolbar-table-radius;
    background: var(--el-bg-color);

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border: 1px solid $toolbar-table-border-color;
      border-radius: inherit;
      pointer-events: none;
      z-index: 3;
    }

    .toolbar-table__shell {
      border: none;
      border-radius: 0;
      overflow: visible;
      box-shadow: none;

      &::after {
        display: none;
      }
    }
  }
}

.toolbar-table__shell {
  position: relative;
  border: none;
  border-radius: $toolbar-table-radius;
  background: var(--el-bg-color);
  overflow-x: auto;
  overflow-y: visible;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 1px solid $toolbar-table-border-color;
    border-radius: inherit;
    pointer-events: none;
    z-index: 3;
  }
}

.toolbar-table__body.has-footer:not(.is-panel) {
  .toolbar-table__shell {
    border-radius: $toolbar-table-radius $toolbar-table-radius 0 0;

    &::after {
      border-bottom: none;
      border-radius: $toolbar-table-radius $toolbar-table-radius 0 0;
    }
  }

  .toolbar-table__footer {
    position: relative;
    background: var(--el-bg-color);
    border: none;
    border-radius: 0 0 $toolbar-table-radius $toolbar-table-radius;
    padding: 12px 16px;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border: 1px solid $toolbar-table-border-color;
      border-top: none;
      border-radius: inherit;
      pointer-events: none;
      z-index: 3;
    }
  }
}

.toolbar-table__body.is-panel.has-footer .toolbar-table__footer {
  padding: 12px 16px 0;
  background: var(--el-bg-color);
}

.toolbar-table__footer {
  flex-shrink: 0;
}

.toolbar-table__table {
  width: 100%;
  --el-table-border-color: #{$toolbar-table-row-border-color};
  --el-table-header-bg-color: #{$toolbar-table-header-bg};
  --el-table-row-hover-bg-color: var(--el-color-primary-light-9);

  border: none !important;
  border-radius: 0;
  background: var(--el-bg-color);

  :deep(.toolbar-table__time-col) .cell {
    white-space: nowrap;
  }

  :deep(.toolbar-table__selection-col .cell),
  :deep(.el-table-column--selection .cell) {
    padding-left: 10px;
    padding-right: 10px;
  }
}

:deep(.toolbar-table__table) {
  &::before,
  &::after {
    display: none;
  }

  .el-table__inner-wrapper::before,
  .el-table__inner-wrapper::after {
    display: none;
  }

  .el-table__border-left-patch,
  .el-table__border-right-patch {
    display: none;
  }

  .el-table__header-wrapper {
    overflow: hidden;
  }

  th.el-table__cell {
    background: $toolbar-table-header-bg !important;
    font-weight: 400;
    font-size: 14px;
    line-height: 22px;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid $toolbar-table-border-color !important;
    border-right: none !important;
    padding: $toolbar-table-cell-padding-y 0;
    height: $toolbar-table-header-height !important;

    .cell {
      padding-left: $toolbar-table-cell-padding-x;
      padding-right: $toolbar-table-cell-padding-x;
      white-space: nowrap;
      word-break: keep-all;
      overflow: visible;
      text-overflow: clip;
    }
  }

  td.el-table__cell {
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    border-bottom: 1px solid $toolbar-table-row-border-color !important;
    border-right: none !important;
    padding: $toolbar-table-cell-padding-y 0;
    background: var(--el-bg-color);
  }

  .cell {
    padding-left: $toolbar-table-cell-padding-x;
    padding-right: $toolbar-table-cell-padding-x;
  }

  .el-table__cell.el-table-column--selection .cell {
    padding-left: 10px;
    padding-right: 10px;
  }

  .cell.el-tooltip {
    box-sizing: border-box;
    max-width: 100%;
  }

  &.el-table--border {
    border: none !important;

    .el-table__cell,
    .el-table__header .el-table__cell {
      border-right: none !important;
    }
  }
}

.toolbar-table__body :deep(.toolbar-table-pagination) {
  padding: 0;
  margin-top: 0;
  background: inherit;
}

:deep(td.col-actions .cell) {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;
  overflow: visible;
}

:deep(th.col-actions .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.col-actions .el-button.is-link) {
  padding: 0 4px;
  height: auto;
  min-height: 0;
  margin: 0;
}

:deep(.toolbar-table__slot-col.is-center .cell),
:deep(th.toolbar-table__slot-col.is-center .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.toolbar-table__slot-col.is-right .cell),
:deep(th.toolbar-table__slot-col.is-right .cell) {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
