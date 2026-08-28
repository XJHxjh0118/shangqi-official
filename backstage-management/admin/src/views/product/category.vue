<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import Sortable from "sortablejs";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from "@/api/category";
import I18nTextEditor from "@/components/I18nTextEditor.vue";
import {
  defaultLocaleTextEntries,
  buildLocaleTextEntries,
  filterLocaleTextPayload,
  localeLabel,
  missingRequiredLocaleText,
  type LocaleTextEntry
} from "@/utils/locale";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import CategoryDetailDialog from "@/components/CategoryDetailDialog.vue";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import {
  buildListQuery,
  ENABLED_FILTER_OPTIONS
} from "@/utils/list-query";

defineOptions({ name: "ProductCategory" });

type ChildDraft = {
  key: string;
  id?: number;
  code: string;
  enabled: boolean;
  i18n: LocaleTextEntry[];
};

const loading = ref(false);
const tree = ref<any[]>([]);
const allTree = ref<any[]>([]);
const filters = ref<Record<string, unknown>>({
  keyword: "",
  level: "",
  enabled: ""
});
const dialogVisible = ref(false);
const detailVisible = ref(false);
const detailRow = ref<any | null>(null);
const editingId = ref<number | null>(null);
const i18nEntries = ref<LocaleTextEntry[]>(defaultLocaleTextEntries());
const childList = ref<ChildDraft[]>([]);
const childListRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;
let childSeq = 0;

/** 父级只能选大类（根节点），保持两级树 */
const parentTreeOptions = ref<any[]>([]);

const form = reactive({
  code: "",
  parentId: undefined as number | undefined,
  sort: 0,
  enabled: true
});

const isMainCategoryForm = computed(() => !form.parentId);

function hasChildren(row: any) {
  return Array.isArray(row?.children) && row.children.length > 0;
}

function buildParentOptions(excludeId?: number | null, disableAll = false) {
  return (allTree.value || [])
    .filter((i: any) => i.id !== excludeId)
    .map((i: any) => ({
      id: i.id,
      label: `${i.nameZh} (${i.code})`,
      disabled: disableAll
    }));
}

function createChildDraft(): ChildDraft {
  childSeq += 1;
  return {
    key: `new-${Date.now()}-${childSeq}`,
    code: "",
    enabled: true,
    i18n: defaultLocaleTextEntries()
  };
}

function cloneChildren(row?: any): ChildDraft[] {
  const list = Array.isArray(row?.children) ? row.children : [];
  return list
    .slice()
    .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id)
    .map((item: any) => ({
      key: `id-${item.id}`,
      id: item.id,
      code: item.code,
      enabled: item.enabled !== false,
      i18n: buildLocaleTextEntries(item.i18n, {
        zh: item.nameZh,
        en: item.nameEn
      })
    }));
}

function childText(item: ChildDraft, locale: string) {
  return item.i18n.find(entry => entry.locale === locale)?.text || "";
}

function setChildText(item: ChildDraft, locale: string, value: string) {
  const row = item.i18n.find(entry => entry.locale === locale);
  if (row) row.text = value;
}

async function fetchParentOptions() {
  const res = await getCategories();
  allTree.value = res.data || [];
  parentTreeOptions.value = buildParentOptions();
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getCategories(buildListQuery(filters.value));
    tree.value = res.data || [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchList();
}

function destroySortable() {
  sortableInstance?.destroy();
  sortableInstance = null;
}

function initSortable() {
  destroySortable();
  if (!childListRef.value || childList.value.length < 2) return;
  sortableInstance = Sortable.create(childListRef.value, {
    animation: 160,
    handle: ".child-drag-handle",
    draggable: ".child-sort-item",
    ghostClass: "is-ghost",
    chosenClass: "is-chosen",
    onEnd: evt => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex == null || newIndex == null || oldIndex === newIndex) {
        return;
      }
      const next = [...childList.value];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      childList.value = next;
      nextTick(() => initSortable());
    }
  });
}

function addChild() {
  childList.value = [...childList.value, createChildDraft()];
}

function removeChild(index: number) {
  childList.value = childList.value.filter((_, i) => i !== index);
}

function openCreate(parentId?: number) {
  editingId.value = null;
  Object.assign(form, {
    code: "",
    parentId,
    sort: 0,
    enabled: true
  });
  i18nEntries.value = defaultLocaleTextEntries();
  childList.value = [];
  parentTreeOptions.value = buildParentOptions();
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    code: row.code,
    parentId: row.parentId || undefined,
    sort: row.sort,
    enabled: row.enabled
  });
  i18nEntries.value = buildLocaleTextEntries(row.i18n, {
    zh: row.nameZh,
    en: row.nameEn
  });
  childList.value = row.parentId ? [] : cloneChildren(row);
  parentTreeOptions.value = buildParentOptions(row.id, hasChildren(row));
  dialogVisible.value = true;
}

const tableColumns: ToolbarTableColumn[] = [
  { prop: "nameZh", label: "中文名称", minWidth: 180, slot: true },
  { prop: "nameEn", label: "英文名称", minWidth: 160 },
  { prop: "level", label: "层级", width: 90, slot: true },
  { prop: "code", label: "编码", width: 140 },
  { prop: "sort", label: "排序", width: 80 },
  { prop: "enabled", label: "启用", width: 80, slot: true }
];

const filterFields: SearchFilterField[] = [
  { prop: "keyword", label: "关键词", placeholder: "名称 / 编码", width: 220 },
  {
    prop: "level",
    label: "层级",
    type: "select",
    placeholder: "层级",
    width: 140,
    options: [
      { label: "大类", value: "main" },
      { label: "子分类", value: "child" }
    ]
  },
  {
    prop: "enabled",
    label: "启用",
    type: "select",
    placeholder: "启用",
    width: 120,
    options: ENABLED_FILTER_OPTIONS
  }
];

async function refreshData() {
  await Promise.all([fetchParentOptions(), fetchList()]);
}

function buildChildrenPayload() {
  return childList.value.map((item, index) => ({
    id: item.id,
    code: item.code.trim(),
    enabled: item.enabled,
    sort: index,
    i18n: filterLocaleTextPayload(item.i18n).map(entry => ({
      locale: entry.locale,
      name: entry.text
    }))
  }));
}

async function submit() {
  if (!form.code?.trim()) {
    ElMessage.warning("请填写编码");
    return;
  }
  const missing = missingRequiredLocaleText(i18nEntries.value);
  if (missing) {
    ElMessage.warning(`请填写${localeLabel(missing)}名`);
    return;
  }

  if (isMainCategoryForm.value) {
    for (let i = 0; i < childList.value.length; i++) {
      const child = childList.value[i];
      const index = i + 1;
      if (!child.code.trim()) {
        ElMessage.warning(`请填写第 ${index} 个子分类的编码`);
        return;
      }
      const zhEntry = child.i18n.find(e => e.locale === "zh");
      if (!zhEntry?.text?.trim()) {
        ElMessage.warning(`请填写第 ${index} 个子分类的中文名`);
        return;
      }
      const enEntry = child.i18n.find(e => e.locale === "en");
      if (!enEntry?.text?.trim()) {
        ElMessage.warning(`请填写第 ${index} 个子分类的英文名`);
        return;
      }
    }
  }

  const texts = filterLocaleTextPayload(i18nEntries.value);
  const payload: Record<string, unknown> = {
    ...form,
    i18n: texts.map(t => ({ locale: t.locale, name: t.text }))
  };
  if (isMainCategoryForm.value) {
    payload.children = buildChildrenPayload();
  }

  if (editingId.value) {
    await updateCategory(editingId.value, payload);
    ElMessage.success("更新成功");
  } else {
    await createCategory(payload);
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  refreshData();
}

async function onDelete(row: any) {
  if (hasChildren(row)) {
    ElMessage.warning("该主分类下仍有子分类，无法删除");
    return;
  }
  await ElMessageBox.confirm(`确认删除分类 ${row.nameZh}？`, "提示", {
    type: "warning"
  });
  await deleteCategory(row.id);
  ElMessage.success("已删除");
  refreshData();
}

function openDetail(row: any) {
  if (row.parentId) {
    const parent = allTree.value.find((item: any) => item.id === row.parentId);
    detailRow.value = { ...row, parent };
  } else {
    detailRow.value = row;
  }
  detailVisible.value = true;
}

function rowActions(row: any): ActionButtonItem[] {
  const locked = hasChildren(row);
  return [
    { key: "detail", label: "详情" },
    { key: "child", label: "子分类", type: "success", hidden: !!row.parentId },
    { key: "edit", label: "编辑" },
    {
      key: "delete",
      label: "删除",
      type: "danger",
      disabled: locked,
      disabledTooltip: locked ? "该主分类下仍有子分类，无法删除" : undefined
    }
  ];
}

function onRowAction(key: string, row: any) {
  if (key === "detail") openDetail(row);
  else if (key === "child") openCreate(row.id);
  else if (key === "edit") openEdit(row);
  else if (key === "delete") onDelete(row);
}

watch(
  () => [dialogVisible.value, childList.value.length] as const,
  async ([visible]) => {
    if (!visible) {
      destroySortable();
      return;
    }
    await nextTick();
    initSortable();
  }
);

onMounted(refreshData);
onBeforeUnmount(destroySortable);
</script>

<template>
  <div class="page-fill">
    <el-card shadow="never">
      <SearchFilters
        v-model="filters"
        :fields="filterFields"
        :loading="loading"
        embedded
        :bordered="false"
        :show-label="false"
        @search="handleSearch"
        @reset="handleSearch"
      />
      <ToolbarTable
        :columns="tableColumns"
        :data="tree"
        :loading="loading"
        client-pagination
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-product-category-columns' }"
        :table-props="{
          rowKey: 'id',
          defaultExpandAll: true,
          treeProps: { children: 'children' }
        }"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openCreate()">新建大类</el-button>
        </template>
        <template #nameZh="{ row }">
          <el-button link type="primary" @click="openDetail(row)">
            {{ row.nameZh }}
          </el-button>
        </template>
        <template #level="{ row }">
          <el-tag :type="row.parentId ? 'info' : 'primary'" size="small" effect="plain">
            {{ row.parentId ? "子分类" : "大类" }}
          </el-tag>
        </template>
        <template #enabled="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? "是" : "否" }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <ActionButtons
            :buttons="rowActions(row)"
            @action="({ key }) => onRowAction(key, row)"
          />
        </template>
      </ToolbarTable>
    </el-card>

    <CategoryDetailDialog v-model="detailVisible" :row="detailRow" />

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑分类' : form.parentId ? '新建子分类' : '新建大类'"
      width="720px"
    >
      <el-form label-width="96px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!editingId" />
        </el-form-item>
        <p class="form-section-title">多语言名称</p>
        <I18nTextEditor v-model="i18nEntries" field-label="名" />
        <el-form-item label="父级">
          <el-tree-select
            v-model="form.parentId"
            :data="parentTreeOptions"
            :props="{
              label: 'label',
              value: 'id',
              children: 'children',
              disabled: 'disabled'
            }"
            clearable
            check-strictly
            filterable
            placeholder="空则为大类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>

      <div v-if="isMainCategoryForm" class="child-sort">
        <div class="child-sort-head">
          <p class="form-section-title">子分类</p>
          <span class="child-sort-hint">拖拽调整顺序，保存大类时一并提交</span>
        </div>
        <ul v-if="childList.length" ref="childListRef" class="child-sort-list">
          <li
            v-for="(item, index) in childList"
            :key="item.key"
            class="child-sort-item"
          >
            <span class="child-drag-handle" title="拖拽排序" aria-label="拖拽排序">
              <i /><i /><i />
            </span>
            <div class="child-sort-fields">
              <el-input v-model="item.code" placeholder="编码" :disabled="!!item.id" />
              <el-input
                :model-value="childText(item, 'zh')"
                placeholder="中文名"
                maxlength="20"
                @update:model-value="value => setChildText(item, 'zh', value)"
              />
              <el-input
                :model-value="childText(item, 'en')"
                placeholder="英文名"
                maxlength="80"
                @update:model-value="value => setChildText(item, 'en', value)"
              />
            </div>
            <el-switch v-model="item.enabled" inline-prompt active-text="启" inactive-text="停" />
            <el-button link type="danger" @click="removeChild(index)">删除</el-button>
          </li>
        </ul>
        <el-button class="child-add-btn" plain @click="addChild">添加子分类</el-button>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.form-section-title {
  margin: 0 0 8px;
  padding: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.child-sort {
  margin-top: 8px;
}

.child-sort-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.child-sort-head .form-section-title {
  flex: 1;
  margin-bottom: 10px;
}

.child-sort-hint {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.child-sort-list {
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.child-sort-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.child-sort-item.is-chosen {
  border-color: var(--el-color-primary-light-5);
}

.child-sort-item.is-ghost {
  opacity: 0.55;
}

.child-drag-handle {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  width: 14px;
  height: 18px;
  cursor: grab;
  flex-shrink: 0;
}

.child-drag-handle:active {
  cursor: grabbing;
}

.child-drag-handle i {
  display: block;
  height: 2px;
  border-radius: 1px;
  background: var(--el-text-color-placeholder);
}

.child-sort-fields {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 8px;
}

.child-add-btn {
  width: 100%;
}
</style>
