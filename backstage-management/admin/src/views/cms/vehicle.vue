<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import {
  createHomeVehicle,
  deleteHomeVehicle,
  getHomeVehicleOptions,
  getHomeVehicles,
  updateHomeVehicle
} from "@/api/home-vehicle";
import { uploadAsset } from "@/api/asset";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import MediaPreviewTile from "@/components/MediaPreviewTile.vue";

defineOptions({ name: "CmsVehicle" });

const loading = ref(false);
const list = ref<any[]>([]);
const vehicleOptions = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const imageUploading = ref(false);

const form = reactive({
  vehicleId: undefined as number | undefined,
  imageUrl: "",
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

function yearLabel(row: any) {
  if (row?.yearFrom && row?.yearTo) return `${row.yearFrom}-${row.yearTo}`;
  return row?.yearFrom || row?.yearTo || "";
}

function vehicleName(row: any) {
  const brand = row?.brandZh || "";
  const model = row?.modelZh || "";
  const years = yearLabel(row);
  return [brand, model, years].filter(Boolean).join(" ");
}

const usedVehicleIds = computed(() => new Set(list.value.map(item => item.vehicleId)));

const selectableVehicles = computed(() =>
  vehicleOptions.value.filter(item => {
    if (editingId.value && item.id === form.vehicleId) return true;
    return !usedVehicleIds.value.has(item.id);
  })
);

const tableColumns: ToolbarTableColumn[] = [
  { prop: "imageUrl", label: "展示图", width: 120, slot: true, toggleable: false },
  { prop: "vehicle", label: "车型", minWidth: 200, slot: true },
  { prop: "link", label: "跳转", minWidth: 180, slot: true },
  { prop: "sort", label: "排序", width: 80 },
  { prop: "enabled", label: "启用", width: 80, slot: true }
];

async function fetchList() {
  loading.value = true;
  try {
    const [homeRes, vehicleRes] = await Promise.all([
      getHomeVehicles(),
      getHomeVehicleOptions()
    ]);
    list.value = homeRes.data || [];
    vehicleOptions.value = vehicleRes.data || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  const nextSort =
    list.value.reduce((max, row) => Math.max(max, Number(row.sort) || 0), -1) +
    1;
  Object.assign(form, {
    vehicleId: undefined,
    imageUrl: "",
    sort: nextSort,
    enabled: true
  });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    vehicleId: row.vehicleId,
    imageUrl: row.imageUrl || "",
    sort: row.sort ?? 0,
    enabled: row.enabled !== false
  });
  dialogVisible.value = true;
}

async function uploadImage(options: UploadRequestOptions) {
  const file = options.file as File;
  if (!file.type.startsWith("image/")) {
    ElMessage.warning("只能上传图片");
    options.onError?.(new Error("invalid") as any);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning("图片大小不能超过 10MB");
    options.onError?.(new Error("too large") as any);
    return;
  }
  imageUploading.value = true;
  try {
    const res = await uploadAsset(file);
    form.imageUrl = res.data?.url || res.data?.thumbnailUrl || "";
    options.onSuccess?.(res as any);
    ElMessage.success("图片上传成功");
  } catch (e: any) {
    options.onError?.(e);
    ElMessage.error(e?.message || "图片上传失败");
  } finally {
    imageUploading.value = false;
  }
}

function clearImage() {
  form.imageUrl = "";
}

async function submit() {
  if (!form.vehicleId) {
    ElMessage.warning("请选择车型");
    return;
  }
  if (!form.imageUrl) {
    ElMessage.warning("请上传展示图");
    return;
  }
  const payload = {
    vehicleId: form.vehicleId,
    imageUrl: form.imageUrl,
    sort: form.sort,
    enabled: form.enabled
  };
  if (editingId.value) {
    await updateHomeVehicle(editingId.value, payload);
    ElMessage.success("更新成功");
  } else {
    await createHomeVehicle(payload);
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  fetchList();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(
    `确认从首页移除 ${vehicleName(row.vehicle)}？`,
    "提示",
    { type: "warning" }
  );
  await deleteHomeVehicle(row.id);
  ElMessage.success("已移除");
  fetchList();
}

function rowActions(): ActionButtonItem[] {
  return [
    { key: "edit", label: "编辑" },
    { key: "delete", label: "移除", type: "danger" }
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
      <p class="page-hint">
        配置官网首页底部展示的适配车型。点击后会带上该车型条件进入产品列表筛选。
      </p>
      <ToolbarTable
        :columns="tableColumns"
        :data="list"
        :loading="loading"
        client-pagination
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-cms-vehicle-columns' }"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openCreate">添加首页车型</el-button>
        </template>
        <template #imageUrl="{ row }">
          <el-image
            v-if="row.imageUrl"
            :src="toDisplayUrl(row.imageUrl)"
            style="width: 80px; height: 48px"
            fit="cover"
            :preview-src-list="[toDisplayUrl(row.imageUrl)]"
            preview-teleported
          />
          <span v-else class="text-gray-400">-</span>
        </template>
        <template #vehicle="{ row }">
          {{ vehicleName(row.vehicle) || "-" }}
        </template>
        <template #link="{ row }">
          /products?vehicleId={{ row.vehicleId }}
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
      :title="editingId ? '编辑首页车型' : '添加首页车型'"
      width="560px"
    >
      <el-form label-width="96px">
        <el-form-item label="车型" required>
          <el-select
            v-model="form.vehicleId"
            filterable
            :disabled="!!editingId"
            placeholder="选择已有车型"
            style="width: 100%"
          >
            <el-option
              v-for="item in selectableVehicles"
              :key="item.id"
              :label="vehicleName(item)"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="展示图" required>
          <div class="image-upload">
            <MediaPreviewTile
              v-if="form.imageUrl"
              :src="toDisplayUrl(form.imageUrl)"
              type="image"
              :width="240"
              :height="120"
              :show-name="false"
              :show-badge="false"
              @remove="clearImage"
            />
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :http-request="uploadImage"
              :disabled="imageUploading"
            >
              <el-button type="primary" :loading="imageUploading">
                {{ form.imageUrl ? "重新上传" : "上传图片" }}
              </el-button>
            </el-upload>
            <p class="upload-tip">建议横图，jpg / png / webp，不超过 10MB</p>
          </div>
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

<style scoped>
.page-hint {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.upload-tip {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}
</style>
