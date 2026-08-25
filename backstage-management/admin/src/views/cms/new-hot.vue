<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { batchUpdateProducts, getProducts, updateProduct } from "@/api/product";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import { productI18nName } from "@/utils/locale";
import ProductDetailDrawer from "@/components/ProductDetailDrawer.vue";

defineOptions({ name: "CmsNewHot" });

const tab = ref<"new" | "hot">("new");
const loading = ref(false);
const list = ref<any[]>([]);
const pickerVisible = ref(false);
const pickerFilters = ref<Record<string, unknown>>({ keyword: "" });
const pickerList = ref<any[]>([]);
const pickerLoading = ref(false);
const pickerPage = ref(1);
const pickerPageSize = ref(20);
const pickerTotal = ref(0);
const pickerSelected = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const batchLoading = ref(false);
const removeLoading = ref(false);
const detailVisible = ref(false);
const detailId = ref<number | null>(null);

const pickerFilterFields: SearchFilterField[] = [
  { prop: "keyword", label: "关键词", placeholder: "SKU / 名称", width: 240 }
];

function i18nName(row: any) {
  return productI18nName(row);
}

function toDisplayUrl(url?: string | null) {
  if (!url) return "";
  try {
    const u = new URL(url, window.location.origin);
    if (u.pathname.startsWith("/uploads")) return `${u.pathname}${u.search}`;
  } catch {
    /* ignore */
  }
  return url || "";
}

const tableColumns: ToolbarTableColumn[] = [
  { type: "selection", selectionWidth: 48 },
  { prop: "coverUrl", label: "缩略图", width: 90, slot: true, toggleable: false },
  { prop: "sku", label: "SKU", width: 140 },
  { prop: "name", label: "名称", minWidth: 160, slot: true },
  { prop: "link", label: "跳转", minWidth: 180, slot: true }
];

const pickerColumns: ToolbarTableColumn[] = [
  { type: "selection", selectionWidth: 48, reserveSelection: true },
  { prop: "sku", label: "SKU", width: 140 },
  { prop: "name", label: "名称", minWidth: 160, slot: true }
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getProducts({
      page: 1,
      pageSize: 100,
      ...(tab.value === "new" ? { isNew: true } : { isHot: true })
    });
    list.value = res.data?.list || [];
  } finally {
    loading.value = false;
  }
}

async function openPicker() {
  pickerVisible.value = true;
  pickerFilters.value = { keyword: "" };
  pickerPage.value = 1;
  pickerSelected.value = [];
  await searchPicker();
}

async function searchPicker() {
  pickerLoading.value = true;
  try {
    const res = await getProducts({
      page: pickerPage.value,
      pageSize: pickerPageSize.value,
      keyword: (pickerFilters.value.keyword as string) || undefined,
      status: "PUBLISHED",
      ...(tab.value === "new" ? { isNew: false } : { isHot: false })
    });
    pickerList.value = res.data?.list || [];
    pickerTotal.value = res.data?.total || 0;
  } finally {
    pickerLoading.value = false;
  }
}

function handlePickerSearch() {
  pickerPage.value = 1;
  searchPicker();
}

function onPickerSelectionChange(rows: any[]) {
  pickerSelected.value = rows;
}

function tagPayload(enabled: boolean) {
  return tab.value === "new" ? { isNew: enabled } : { isHot: enabled };
}

function tagLabel() {
  return tab.value === "new" ? "新品" : "热销";
}

async function addItem(row: any) {
  await updateProduct(row.id, tagPayload(true));
  ElMessage.success(`已加入${tagLabel()}`);
  await Promise.all([searchPicker(), fetchList()]);
}

async function addSelected() {
  const ids = pickerSelected.value.map(row => row.id);
  if (!ids.length) {
    ElMessage.warning("请先勾选产品");
    return;
  }
  batchLoading.value = true;
  try {
    await batchUpdateProducts({ ids, ...tagPayload(true) });
    ElMessage.success(`已加入 ${ids.length} 个${tagLabel()}产品`);
    pickerVisible.value = false;
    fetchList();
  } finally {
    batchLoading.value = false;
  }
}

async function removeItem(row: any) {
  await updateProduct(row.id, tagPayload(false));
  ElMessage.success("已移出");
  fetchList();
}

function onSelectionChange(rows: any[]) {
  selectedIds.value = rows.map(row => row.id);
}

async function removeSelected() {
  if (!selectedIds.value.length) {
    ElMessage.warning("请先勾选产品");
    return;
  }
  await ElMessageBox.confirm(
    `确认将已选 ${selectedIds.value.length} 个产品移出${tagLabel()}？`,
    "批量移出",
    { type: "warning" }
  );
  removeLoading.value = true;
  try {
    await batchUpdateProducts({ ids: selectedIds.value, ...tagPayload(false) });
    ElMessage.success(`已移出 ${selectedIds.value.length} 个${tagLabel()}产品`);
    selectedIds.value = [];
    fetchList();
  } finally {
    removeLoading.value = false;
  }
}

watch(tab, () => {
  selectedIds.value = [];
  fetchList();
});
onMounted(fetchList);

function openDetail(row: any) {
  detailId.value = row.id;
  detailVisible.value = true;
}

function rowActions(): ActionButtonItem[] {
  return [
    { key: "detail", label: "详情" },
    { key: "remove", label: "移出", type: "danger" }
  ];
}

function pickerRowActions(): ActionButtonItem[] {
  return [
    { key: "detail", label: "详情" },
    { key: "add", label: "加入" }
  ];
}

function onRowAction(key: string, row: any) {
  if (key === "detail") openDetail(row);
  else if (key === "remove") removeItem(row);
}

function onPickerAction(key: string, row: any) {
  if (key === "detail") openDetail(row);
  else if (key === "add") addItem(row);
}
</script>

<template>
  <div class="page-fill">
    <el-card shadow="never">
      <el-tabs v-model="tab">
        <el-tab-pane label="新品推荐" name="new" />
        <el-tab-pane label="热销" name="hot" />
      </el-tabs>
      <ToolbarTable
        :columns="tableColumns"
        :data="list"
        :loading="loading"
        client-pagination
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-cms-new-hot-columns' }"
        :table-props="{ rowKey: 'id' }"
        @query-table="fetchList"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openPicker">
            {{ tab === "new" ? "添加新品" : "添加热销" }}
          </el-button>
          <el-button
            type="danger"
            plain
            :disabled="!selectedIds.length"
            :loading="removeLoading"
            @click="removeSelected"
          >
            批量移出
          </el-button>
        </template>
        <template #coverUrl="{ row }">
          <el-image
            v-if="row.cover?.url"
            :src="toDisplayUrl(row.cover?.url)"
            fit="cover"
            style="width: 56px; height: 56px"
          />
          <span v-else>-</span>
        </template>
        <template #name="{ row }">
          <el-button link type="primary" @click="openDetail(row)">
            {{ i18nName(row) }}
          </el-button>
        </template>
        <template #link="{ row }">/products/{{ row.slug }}</template>
        <template #action="{ row }">
          <ActionButtons
            :buttons="rowActions()"
            @action="({ key }) => onRowAction(key, row)"
          />
        </template>
      </ToolbarTable>
    </el-card>

    <el-dialog
      v-model="pickerVisible"
      title="选择已发布产品"
      width="720px"
      destroy-on-close
    >
      <SearchFilters
        v-model="pickerFilters"
        :fields="pickerFilterFields"
        :loading="pickerLoading"
        embedded
        :bordered="false"
        :show-label="false"
        @search="handlePickerSearch"
        @reset="handlePickerSearch"
      />
      <ToolbarTable
        :columns="pickerColumns"
        :data="pickerList"
        :loading="pickerLoading"
        :total="pickerTotal"
        v-model:page="pickerPage"
        v-model:limit="pickerPageSize"
        :show-toolbar="false"
        :table-props="{ rowKey: 'id', height: 360 }"
        :pagination-props="{ layout: 'total, prev, pager, next' }"
        @pagination="searchPicker"
        @selection-change="onPickerSelectionChange"
      >
        <template #name="{ row }">
          <el-button link type="primary" @click="openDetail(row)">
            {{ i18nName(row) }}
          </el-button>
        </template>
        <template #action="{ row }">
          <ActionButtons
            :buttons="pickerRowActions()"
            @action="({ key }) => onPickerAction(key, row)"
          />
        </template>
      </ToolbarTable>
      <template #footer>
        <div class="picker-footer">
          <span class="picker-count">已选 {{ pickerSelected.length }} 项</span>
          <div>
            <el-button @click="pickerVisible = false">取消</el-button>
            <el-button
              type="primary"
              :disabled="!pickerSelected.length"
              :loading="batchLoading"
              @click="addSelected"
            >
              批量加入
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <ProductDetailDrawer v-model="detailVisible" :product-id="detailId" />
  </div>
</template>

<style scoped>
.picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.picker-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
