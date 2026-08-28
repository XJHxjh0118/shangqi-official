<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import {
  createServiceItem,
  deleteServiceItem,
  getServiceItems,
  updateServiceItem
} from "@/api/service";
import { uploadAsset } from "@/api/asset";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import { EN_TEXT_MAX, ZH_TEXT_MAX } from "@/utils/locale";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import {
  buildListQuery,
  ENABLED_FILTER_OPTIONS
} from "@/utils/list-query";

defineOptions({ name: "CmsService" });

const loading = ref(false);
const list = ref<any[]>([]);
const filters = ref<Record<string, unknown>>({
  keyword: "",
  enabled: ""
});
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const iconUploading = ref(false);

const form = reactive({
  code: "",
  titleZh: "",
  titleEn: "",
  bodyZh: "",
  bodyEn: "",
  iconUrl: "",
  sort: 0,
  enabled: true
});

function toDisplayUrl(url?: string | null) {
  if (!url) return "";
  try {
    const u = new URL(url, window.location.origin);
    if (u.pathname.startsWith("/uploads")) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}

const tableColumns: ToolbarTableColumn[] = [
  { prop: "iconUrl", label: "图标", width: 80, slot: true, toggleable: false },
  { prop: "code", label: "编码", width: 140 },
  { prop: "titleZh", label: "中文标题", minWidth: 140 },
  { prop: "titleEn", label: "英文标题", minWidth: 140 },
  { prop: "sort", label: "排序", width: 80 },
  { prop: "enabled", label: "启用", width: 80, slot: true }
];

const filterFields: SearchFilterField[] = [
  {
    prop: "keyword",
    label: "关键词",
    placeholder: "编码 / 标题",
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
    const res = await getServiceItems(buildListQuery(filters.value));
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
    titleZh: "",
    titleEn: "",
    bodyZh: "",
    bodyEn: "",
    iconUrl: "",
    sort: list.value.length + 1,
    enabled: true
  });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    code: row.code,
    titleZh: row.titleZh,
    titleEn: row.titleEn,
    bodyZh: row.bodyZh || "",
    bodyEn: row.bodyEn || "",
    iconUrl: row.iconUrl || "",
    sort: row.sort,
    enabled: row.enabled
  });
  dialogVisible.value = true;
}

async function uploadIcon(options: UploadRequestOptions) {
  const file = options.file as File;
  if (!file.type.startsWith("image/")) {
    ElMessage.warning("只能上传图片");
    options.onError?.(new Error("invalid") as any);
    return;
  }
  iconUploading.value = true;
  try {
    const res = await uploadAsset(file);
    form.iconUrl = res.data?.url || res.data?.thumbnailUrl || "";
    options.onSuccess?.(res as any);
  } catch (e: any) {
    options.onError?.(e);
    ElMessage.error(e?.message || "上传失败");
  } finally {
    iconUploading.value = false;
  }
}

async function submit() {
  if (!form.code?.trim()) {
    ElMessage.warning("请填写编码");
    return;
  }
  if (!form.titleZh?.trim()) {
    ElMessage.warning("请填写中文标题");
    return;
  }
  if (!form.titleEn?.trim()) {
    ElMessage.warning("请填写英文标题");
    return;
  }
  if (editingId.value) {
    await updateServiceItem(editingId.value, form);
    ElMessage.success("更新成功");
  } else {
    await createServiceItem(form);
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  fetchList();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除 ${row.titleZh}？`, "提示", {
    type: "warning"
  });
  await deleteServiceItem(row.id);
  ElMessage.success("已删除");
  fetchList();
}

function rowActions(): ActionButtonItem[] {
  return [
    { key: "edit", label: "编辑" },
    { key: "delete", label: "删除", type: "danger" }
  ];
}

function onRowAction(key: string, row: any) {
  if (key === "edit") openEdit(row);
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
        :toolbar-props="{ refresh: true, storageKey: 'admin-cms-service-columns' }"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openCreate">新建服务条目</el-button>
        </template>
        <template #iconUrl="{ row }">
          <el-image
            v-if="row.iconUrl"
            :src="toDisplayUrl(row.iconUrl)"
            style="width: 36px; height: 36px"
            fit="cover"
          />
          <span v-else>-</span>
        </template>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑服务条目' : '新建服务条目'"
      width="640px"
    >
      <el-form label-width="96px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="中文标题" required>
          <el-input
            v-model="form.titleZh"
            :maxlength="ZH_TEXT_MAX"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="英文标题" required>
          <el-input
            v-model="form.titleEn"
            :maxlength="EN_TEXT_MAX"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="中文说明">
          <el-input
            v-model="form.bodyZh"
            type="textarea"
            :rows="3"
            :maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="英文说明">
          <el-input
            v-model="form.bodyEn"
            type="textarea"
            :rows="3"
            :maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="图标">
          <el-upload
            :show-file-list="false"
            accept="image/*"
            :http-request="uploadIcon"
            :disabled="iconUploading"
          >
            <el-button :loading="iconUploading">上传图标</el-button>
          </el-upload>
          <el-image
            v-if="form.iconUrl"
            :src="toDisplayUrl(form.iconUrl)"
            class="mt-2"
            style="width: 64px; height: 64px"
            fit="cover"
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
