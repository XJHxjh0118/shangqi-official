<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getProducts, updateProduct } from "@/api/product";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import { productI18nName } from "@/utils/locale";
import ProductDetailDrawer from "@/components/ProductDetailDrawer.vue";

defineOptions({ name: "CmsFeatured" });

const loading = ref(false);
const list = ref<any[]>([]);
const pickerVisible = ref(false);
const pickerFilters = ref<Record<string, unknown>>({ keyword: "" });
const pickerList = ref<any[]>([]);
const pickerLoading = ref(false);
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
  { prop: "coverUrl", label: "缩略图", width: 90, slot: true, toggleable: false },
  { prop: "sku", label: "SKU", width: 140 },
  { prop: "name", label: "名称", minWidth: 160, slot: true },
  { prop: "link", label: "跳转", minWidth: 180, slot: true },
  { prop: "sort", label: "排序", width: 140, slot: true }
];

const pickerColumns: ToolbarTableColumn[] = [
  { prop: "sku", label: "SKU", width: 140 },
  { prop: "name", label: "名称", minWidth: 160, slot: true }
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getProducts({
      page: 1,
      pageSize: 100,
      isFeatured: true
    });
    list.value = res.data?.list || [];
  } finally {
    loading.value = false;
  }
}

async function openPicker() {
  pickerVisible.value = true;
  pickerFilters.value = { keyword: "" };
  await searchPicker();
}

async function searchPicker() {
  pickerLoading.value = true;
  try {
    const res = await getProducts({
      page: 1,
      pageSize: 50,
      keyword: (pickerFilters.value.keyword as string) || undefined,
      status: "PUBLISHED"
    });
    pickerList.value = (res.data?.list || []).filter((i: any) => !i.isFeatured);
  } finally {
    pickerLoading.value = false;
  }
}

async function addFeatured(row: any) {
  await updateProduct(row.id, { isFeatured: true });
  ElMessage.success("已加入主推");
  pickerVisible.value = false;
  fetchList();
}

async function removeFeatured(row: any) {
  await updateProduct(row.id, { isFeatured: false });
  ElMessage.success("已移出主推");
  fetchList();
}

async function saveSort(row: any) {
  await updateProduct(row.id, { sort: row.sort });
  ElMessage.success("排序已更新");
}

function openDetail(row: any) {
  detailId.value = row.id;
  detailVisible.value = true;
}

onMounted(fetchList);

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
  else if (key === "remove") removeFeatured(row);
}

function onPickerAction(key: string, row: any) {
  if (key === "detail") openDetail(row);
  else if (key === "add") addFeatured(row);
}
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <ToolbarTable
        :columns="tableColumns"
        :data="list"
        :loading="loading"
        :show-pagination="false"
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-cms-featured-columns' }"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openPicker">添加主推产品</el-button>
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
        <template #sort="{ row }">
          <el-input-number
            v-model="row.sort"
            :min="0"
            size="small"
            @change="saveSort(row)"
          />
        </template>
        <template #action="{ row }">
          <ActionButtons
            :buttons="rowActions()"
            @action="({ key }) => onRowAction(key, row)"
          />
        </template>
      </ToolbarTable>
    </el-card>

    <el-dialog v-model="pickerVisible" title="选择已发布产品" width="640px">
      <SearchFilters
        v-model="pickerFilters"
        :fields="pickerFilterFields"
        :loading="pickerLoading"
        embedded
        :bordered="false"
        :show-label="false"
        @search="searchPicker"
        @reset="searchPicker"
      />
      <ToolbarTable
        :columns="pickerColumns"
        :data="pickerList"
        :loading="pickerLoading"
        :show-toolbar="false"
        :show-pagination="false"
        :table-props="{ height: 360 }"
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
    </el-dialog>

    <ProductDetailDrawer v-model="detailVisible" :product-id="detailId" />
  </div>
</template>
