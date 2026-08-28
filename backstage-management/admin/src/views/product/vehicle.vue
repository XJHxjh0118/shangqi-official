<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle
} from "@/api/vehicle";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import VehicleDetailDialog from "@/components/VehicleDetailDialog.vue";
import { EN_TEXT_MAX, ZH_TEXT_MAX } from "@/utils/locale";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import {
  buildListQuery,
  ENABLED_FILTER_OPTIONS
} from "@/utils/list-query";

defineOptions({ name: "ProductVehicle" });

const loading = ref(false);
const list = ref<any[]>([]);
const filters = ref<Record<string, unknown>>({
  keyword: "",
  enabled: ""
});
const dialogVisible = ref(false);
const detailVisible = ref(false);
const detailRow = ref<any | null>(null);
const editingId = ref<number | null>(null);

const form = reactive({
  code: "",
  brandZh: "",
  brandEn: "",
  modelZh: "",
  modelEn: "",
  yearFrom: undefined as number | undefined,
  yearTo: undefined as number | undefined,
  sort: 0,
  enabled: true
});

function yearLabel(row: any) {
  if (row.yearFrom && row.yearTo) return `${row.yearFrom}-${row.yearTo}`;
  return row.yearFrom || row.yearTo || "-";
}

const yearRange = computed({
  get(): [string, string] | undefined {
    if (form.yearFrom == null && form.yearTo == null) return undefined;
    return [
      String(form.yearFrom ?? form.yearTo),
      String(form.yearTo ?? form.yearFrom)
    ];
  },
  set(val: [string, string] | null | undefined) {
    if (!val?.length) {
      form.yearFrom = undefined;
      form.yearTo = undefined;
      return;
    }
    const from = Number(val[0]);
    const to = Number(val[1]);
    form.yearFrom = Number.isFinite(from) ? from : undefined;
    form.yearTo = Number.isFinite(to) ? to : undefined;
  }
});

function disabledYear(date: Date) {
  const year = date.getFullYear();
  return year < 1990 || year > 2100;
}

const tableColumns: ToolbarTableColumn[] = [
  { prop: "code", label: "编码", width: 140 },
  { prop: "brandZh", label: "品牌（中）", width: 120 },
  { prop: "brandEn", label: "品牌（英）", width: 120 },
  { prop: "modelZh", label: "车型（中）", minWidth: 140, slot: true },
  { prop: "modelEn", label: "车型（英）", minWidth: 140 },
  { prop: "year", label: "年款", width: 140, slot: true },
  { prop: "sort", label: "排序", width: 80 },
  { prop: "enabled", label: "启用", width: 80, slot: true }
];

const filterFields: SearchFilterField[] = [
  {
    prop: "keyword",
    label: "关键词",
    placeholder: "编码 / 品牌 / 车型",
    width: 240
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

async function fetchList() {
  loading.value = true;
  try {
    const res = await getVehicles(buildListQuery(filters.value));
    list.value = res.data || [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchList();
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    code: "",
    brandZh: "",
    brandEn: "",
    modelZh: "",
    modelEn: "",
    yearFrom: undefined,
    yearTo: undefined,
    sort: list.value.length + 1,
    enabled: true
  });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    code: row.code,
    brandZh: row.brandZh,
    brandEn: row.brandEn,
    modelZh: row.modelZh,
    modelEn: row.modelEn,
    yearFrom: row.yearFrom || undefined,
    yearTo: row.yearTo || undefined,
    sort: row.sort,
    enabled: row.enabled
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.code?.trim()) {
    ElMessage.warning("请填写编码");
    return;
  }
  if (!form.brandZh?.trim()) {
    ElMessage.warning("请填写品牌中文");
    return;
  }
  if (!form.brandEn?.trim()) {
    ElMessage.warning("请填写品牌英文");
    return;
  }
  if (!form.modelZh?.trim()) {
    ElMessage.warning("请填写车型中文");
    return;
  }
  if (!form.modelEn?.trim()) {
    ElMessage.warning("请填写车型英文");
    return;
  }
  if (editingId.value) {
    await updateVehicle(editingId.value, form);
    ElMessage.success("更新成功");
  } else {
    await createVehicle(form);
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  fetchList();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除车型 ${row.brandZh} ${row.modelZh}？`, "提示", {
    type: "warning"
  });
  await deleteVehicle(row.id);
  ElMessage.success("已删除");
  fetchList();
}

function openDetail(row: any) {
  detailRow.value = row;
  detailVisible.value = true;
}

function rowActions(): ActionButtonItem[] {
  return [
    { key: "detail", label: "详情" },
    { key: "edit", label: "编辑" },
    { key: "delete", label: "删除", type: "danger" }
  ];
}

function onRowAction(key: string, row: any) {
  if (key === "detail") openDetail(row);
  else if (key === "edit") openEdit(row);
  else if (key === "delete") onDelete(row);
}

onMounted(fetchList);
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
        :data="list"
        :loading="loading"
        client-pagination
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-product-vehicle-columns' }"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openCreate">新建车型</el-button>
        </template>
        <template #modelZh="{ row }">
          <el-button link type="primary" @click="openDetail(row)">
            {{ row.modelZh }}
          </el-button>
        </template>
        <template #year="{ row }">{{ yearLabel(row) }}</template>
        <template #enabled="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? "是" : "否" }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <ActionButtons :buttons="rowActions()" @action="({ key }) => onRowAction(key, row)" />
        </template>
      </ToolbarTable>
    </el-card>

    <VehicleDetailDialog v-model="detailVisible" :row="detailRow" />

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑车型' : '新建车型'"
      width="560px"
    >
      <el-form label-width="108px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="品牌中文" required>
          <el-input
            v-model="form.brandZh"
            :maxlength="ZH_TEXT_MAX"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="品牌英文" required>
          <el-input
            v-model="form.brandEn"
            :maxlength="EN_TEXT_MAX"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="车型中文" required>
          <el-input
            v-model="form.modelZh"
            :maxlength="ZH_TEXT_MAX"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="车型英文" required>
          <el-input
            v-model="form.modelEn"
            :maxlength="EN_TEXT_MAX"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="年款">
          <el-date-picker
            v-model="yearRange"
            type="yearrange"
            value-format="YYYY"
            unlink-panels
            range-separator="至"
            start-placeholder="起始年"
            end-placeholder="截止年"
            :disabled-date="disabledYear"
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
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
