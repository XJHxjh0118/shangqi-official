<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import Sortable from "sortablejs";
import {
  createBanner,
  deleteBanner,
  getBanners,
  sortBanners,
  updateBanner
} from "@/api/banner";
import { uploadAsset } from "@/api/asset";
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
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import MediaPreviewTile from "@/components/MediaPreviewTile.vue";
import {
  buildListQuery,
  ENABLED_FILTER_OPTIONS
} from "@/utils/list-query";

defineOptions({ name: "CmsBanner" });

const loading = ref(false);
const list = ref<any[]>([]);
const filters = ref<Record<string, unknown>>({
  keyword: "",
  enabled: ""
});
const dialogVisible = ref(false);
const sortDialogVisible = ref(false);
const sortSaving = ref(false);
const editingId = ref<number | null>(null);
const imageUploading = ref(false);
const sortList = ref<any[]>([]);
const sortListRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;
const i18nEntries = ref<LocaleTextEntry[]>(defaultLocaleTextEntries());
const form = reactive({
  imageUrl: "",
  linkUrl: "",
  sort: 0,
  enabled: true,
  startAt: "" as string,
  endAt: "" as string
});

/** 把后端绝对地址转成走 Vite 代理的相对路径，便于本地预览 */
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

function destroySortable() {
  sortableInstance?.destroy();
  sortableInstance = null;
}

function initSortable() {
  destroySortable();
  if (!sortListRef.value || sortList.value.length < 2) return;
  sortableInstance = Sortable.create(sortListRef.value, {
    animation: 160,
    handle: ".banner-drag-handle",
    draggable: ".banner-sort-item",
    ghostClass: "is-ghost",
    chosenClass: "is-chosen",
    onEnd: evt => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex == null || newIndex == null || oldIndex === newIndex) {
        return;
      }
      const next = [...sortList.value];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      sortList.value = next;
      nextTick(() => initSortable());
    }
  });
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getBanners(buildListQuery(filters.value));
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
  const nextSort =
    list.value.reduce((max, row) => Math.max(max, Number(row.sort) || 0), -1) +
    1;
  Object.assign(form, {
    imageUrl: "",
    linkUrl: "",
    sort: nextSort,
    enabled: true,
    startAt: "",
    endAt: ""
  });
  i18nEntries.value = defaultLocaleTextEntries();
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    imageUrl: row.imageUrl || "",
    linkUrl: row.linkUrl || "",
    sort: row.sort ?? 0,
    enabled: row.enabled !== false,
    startAt: row.startAt
      ? String(row.startAt).slice(0, 19).replace("T", " ")
      : "",
    endAt: row.endAt ? String(row.endAt).slice(0, 19).replace("T", " ") : ""
  });
  i18nEntries.value = buildLocaleTextEntries(row.i18n, {
    zh: row.titleZh,
    en: row.titleEn
  });
  dialogVisible.value = true;
}

async function openSortDialog() {
  const res = await getBanners();
  const all = res.data || [];
  if (all.length < 2) {
    ElMessage.warning("至少需要 2 条 Banner 才能调整顺序");
    return;
  }
  sortList.value = all.map(item => ({ ...item }));
  sortDialogVisible.value = true;
}

function onSortDialogOpened() {
  nextTick(() => initSortable());
}

function onSortDialogClosed() {
  destroySortable();
  sortList.value = [];
}

async function saveSort() {
  sortSaving.value = true;
  try {
    await sortBanners(sortList.value.map(item => item.id));
    ElMessage.success("排序已保存");
    sortDialogVisible.value = false;
    fetchList();
  } catch (e: any) {
    ElMessage.error(e?.message || "排序保存失败");
  } finally {
    sortSaving.value = false;
  }
}

const tableColumns: ToolbarTableColumn[] = [
  { prop: "imageUrl", label: "预览", width: 120, slot: true, toggleable: false },
  { prop: "titleZh", label: "中文标题", minWidth: 160 },
  { prop: "titleEn", label: "英文标题", minWidth: 160 },
  { prop: "linkUrl", label: "跳转链接", minWidth: 180 },
  { prop: "sort", label: "排序", width: 80 },
  { prop: "schedule", label: "上下线", minWidth: 200, slot: true },
  { prop: "enabled", label: "启用", width: 80, slot: true }
];

const filterFields: SearchFilterField[] = [
  {
    prop: "keyword",
    label: "关键词",
    placeholder: "标题 / 跳转链接",
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

function beforeImageUpload(file: File) {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.warning("只能上传图片文件");
    return false;
  }
  const maxMb = 10;
  if (file.size > maxMb * 1024 * 1024) {
    ElMessage.warning(`图片大小不能超过 ${maxMb}MB`);
    return false;
  }
  return true;
}

async function uploadImage(options: UploadRequestOptions) {
  const file = options.file as File;
  if (!beforeImageUpload(file)) {
    options.onError?.(new Error("invalid file") as any);
    return;
  }
  imageUploading.value = true;
  try {
    const res = await uploadAsset(file);
    const url = res.data?.url || res.data?.thumbnailUrl || "";
    if (!url) throw new Error("上传未返回地址");
    form.imageUrl = url;
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
  const missing = missingRequiredLocaleText(i18nEntries.value);
  if (missing) {
    ElMessage.warning(`请填写${localeLabel(missing)}标题`);
    return;
  }
  if (!form.imageUrl) {
    ElMessage.warning("请上传图片");
    return;
  }
  const texts = filterLocaleTextPayload(i18nEntries.value);
  const payload = {
    ...form,
    startAt: form.startAt || null,
    endAt: form.endAt || null,
    i18n: texts.map(t => ({ locale: t.locale, title: t.text }))
  };
  if (editingId.value) {
    await updateBanner(editingId.value, payload);
    ElMessage.success("更新成功");
  } else {
    await createBanner(payload);
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  fetchList();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm("确认删除该 Banner？", "提示", {
    type: "warning"
  });
  await deleteBanner(row.id);
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
        :data="list"
        :loading="loading"
        client-pagination
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-cms-banner-columns' }"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openCreate">新建 Banner</el-button>
          <el-button @click="openSortDialog">调整顺序</el-button>
          <span class="banner-hero-hint">
            启用中的 Banner 按排序出现在官网首页首屏，滚动时依次切换。建议 1920×1080 横图。
          </span>
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
        <template #schedule="{ row }">
          <span v-if="row.startAt || row.endAt">
            {{ row.startAt ? String(row.startAt).slice(0, 16).replace("T", " ") : "立即" }}
            ~
            {{ row.endAt ? String(row.endAt).slice(0, 16).replace("T", " ") : "长期" }}
          </span>
          <span v-else>长期有效</span>
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
      :title="editingId ? '编辑 Banner' : '新建 Banner'"
      width="600px"
    >
      <el-form label-width="96px">
        <p class="form-section-title">多语言标题</p>
        <I18nTextEditor v-model="i18nEntries" field-label="标题" />
        <el-form-item label="Banner 图" required>
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
            <p class="upload-tip">
              用于官网首页首屏。支持 jpg / png / webp，建议 1920×1080，单张不超过 10MB
            </p>
          </div>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="上线时间">
          <el-date-picker
            v-model="form.startAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="不填则立即生效"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="下线时间">
          <el-date-picker
            v-model="form.endAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="不填则长期有效"
            style="width: 100%"
          />
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

    <el-dialog
      v-model="sortDialogVisible"
      title="调整 Banner 顺序"
      width="640px"
      destroy-on-close
      @opened="onSortDialogOpened"
      @closed="onSortDialogClosed"
    >
      <p class="sort-hint">拖拽左侧手柄调整官网首页首屏图片顺序，保存后滚动切换生效</p>
      <ul ref="sortListRef" class="banner-sort-list">
        <li
          v-for="(item, index) in sortList"
          :key="item.id"
          class="banner-sort-item"
        >
          <span class="banner-drag-handle" title="拖拽排序" aria-label="拖拽排序">
            <i /><i /><i />
          </span>
          <span class="banner-sort-index">{{ index + 1 }}</span>
          <el-image
            v-if="item.imageUrl"
            class="banner-sort-thumb"
            :src="toDisplayUrl(item.imageUrl)"
            fit="cover"
          />
          <div v-else class="banner-sort-thumb is-empty">无图</div>
          <div class="banner-sort-meta">
            <strong>{{ item.titleZh || "未填写中文标题" }}</strong>
            <span>{{ item.titleEn || "No English title" }}</span>
          </div>
          <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
            {{ item.enabled ? "启用" : "停用" }}
          </el-tag>
        </li>
      </ul>
      <template #footer>
        <el-button @click="sortDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="sortSaving" @click="saveSort">
          保存顺序
        </el-button>
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

.banner-hero-hint {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.sort-hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.banner-sort-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
  overflow: auto;
}

.banner-sort-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.banner-sort-item.is-chosen {
  border-color: var(--el-color-primary-light-5);
}

.banner-sort-item.is-ghost {
  opacity: 0.55;
}

.banner-drag-handle {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  width: 14px;
  height: 18px;
  cursor: grab;
  flex-shrink: 0;
}

.banner-drag-handle:active {
  cursor: grabbing;
}

.banner-drag-handle i {
  display: block;
  height: 2px;
  border-radius: 1px;
  background: var(--el-text-color-placeholder);
}

.banner-sort-index {
  width: 22px;
  flex-shrink: 0;
  text-align: center;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.banner-sort-thumb {
  width: 80px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.banner-sort-thumb.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.banner-sort-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-sort-meta strong,
.banner-sort-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-sort-meta span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
