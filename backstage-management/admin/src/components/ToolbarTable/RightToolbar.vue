<template>
  <div class="toolbar-right">
    <el-tooltip v-if="search" effect="dark" :content="showSearch ? '收起搜索' : '展开搜索'" placement="top">
      <el-button circle :icon="showSearch ? ArrowUp : ArrowDown" @click="toggleSearch" />
    </el-tooltip>
    <el-tooltip v-if="refresh" effect="dark" content="刷新" placement="top">
      <el-button circle :icon="Refresh" @click="handleRefresh" />
    </el-tooltip>
    <el-dropdown
      v-if="hasToggleableColumns"
      trigger="click"
      :hide-on-click="false"
      teleported
      popper-class="toolbar-table-column-dropdown"
    >
      <span class="toolbar-right__trigger">
        <el-tooltip effect="dark" content="显隐列" placement="top">
          <el-button circle :icon="Menu" />
        </el-tooltip>
      </span>
      <template #dropdown>
        <el-dropdown-menu class="toolbar-right__menu">
          <el-dropdown-item @click.stop>
            <el-checkbox
              :model-value="isChecked"
              :indeterminate="isIndeterminate"
              @change="toggleCheckAll"
              @click.stop
            >
              列展示
            </el-checkbox>
          </el-dropdown-item>
          <div class="toolbar-right__line" />
          <div class="toolbar-right__list">
            <el-dropdown-item
              v-for="entry in columnEntries"
              :key="entry.key"
              @click.stop
            >
              <el-checkbox
                v-model="entry.item.visible"
                @change="(val: boolean) => onColumnVisibleChange(val, entry.key)"
                @click.stop
              >
                {{ entry.item.label }}
              </el-checkbox>
            </el-dropdown-item>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ArrowDown from "~icons/ep/arrow-down";
import ArrowUp from "~icons/ep/arrow-up";
import Menu from "~icons/ep/menu";
import Refresh from "~icons/ep/refresh";
import type { ToolbarColumnsMap, ToolbarColumnVisible } from "./types";

interface ColumnEntry {
  key: string;
  item: ToolbarColumnVisible;
}

const props = withDefaults(
  defineProps<{
    showSearch?: boolean;
    columns?: ToolbarColumnsMap | ToolbarColumnVisible[];
    search?: boolean;
    refresh?: boolean;
    storageKey?: string;
  }>(),
  {
    showSearch: false,
    columns: () => ({}),
    search: false,
    refresh: false,
    storageKey: ""
  }
);

const emit = defineEmits<{
  "update:showSearch": [value: boolean];
  queryTable: [];
}>();

const storageRestored = ref(false);

const columnEntries = computed<ColumnEntry[]>(() => {
  if (Array.isArray(props.columns)) {
    return props.columns.map((item, index) => ({
      key: String((item as ToolbarColumnVisible & { key?: string }).key ?? index),
      item
    }));
  }
  return Object.keys(props.columns || {}).map(key => ({
    key,
    item: (props.columns as ToolbarColumnsMap)[key]
  }));
});

const hasToggleableColumns = computed(() => columnEntries.value.length > 0);
const isChecked = computed(() =>
  columnEntries.value.every(({ item }) => item.visible)
);
const isIndeterminate = computed(
  () =>
    columnEntries.value.some(({ item }) => item.visible) && !isChecked.value
);

function toggleSearch() {
  emit("update:showSearch", !props.showSearch);
}

function handleRefresh() {
  emit("queryTable");
}

function restoreStorage() {
  if (!props.storageKey) return;
  try {
    const raw = localStorage.getItem(props.storageKey);
    if (!raw) return;
    const saved = JSON.parse(raw) as Record<string, boolean>;
    columnEntries.value.forEach((entry, index) => {
      const stored = Array.isArray(props.columns) ? saved[index] : saved[entry.key];
      if (stored !== undefined) entry.item.visible = stored;
    });
  } catch {
    /* ignore */
  }
}

function saveStorage() {
  if (!props.storageKey) return;
  try {
    const state: Record<string, boolean> = {};
    columnEntries.value.forEach((entry, index) => {
      if (Array.isArray(props.columns)) {
        state[index] = entry.item.visible;
      } else {
        state[entry.key] = entry.item.visible;
      }
    });
    localStorage.setItem(props.storageKey, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function onColumnVisibleChange(event: boolean, key: string) {
  if (Array.isArray(props.columns)) {
    const col = props.columns.find(
      (item, index) =>
        String((item as ToolbarColumnVisible & { key?: string }).key ?? index) ===
        key
    );
    if (col) col.visible = event;
  } else if (props.columns?.[key]) {
    props.columns[key].visible = event;
  }
  saveStorage();
}

function toggleCheckAll() {
  const next = !isChecked.value;
  columnEntries.value.forEach(({ item }) => {
    item.visible = next;
  });
  saveStorage();
}

watch(
  columnEntries,
  () => {
    if (!props.storageKey || storageRestored.value || !columnEntries.value.length) {
      return;
    }
    restoreStorage();
    storageRestored.value = true;
  },
  { immediate: true }
);

defineExpose({ refresh: handleRefresh });
</script>

<style scoped lang="scss">
.toolbar-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right__trigger {
  display: inline-flex;
}

.toolbar-right__line {
  width: 90%;
  height: 1px;
  margin: 4px auto;
  background: var(--el-border-color-lighter);
}

.toolbar-right__list {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.el-dropdown-menu__item) {
  line-height: 30px;
  padding: 0 16px;
}
</style>
