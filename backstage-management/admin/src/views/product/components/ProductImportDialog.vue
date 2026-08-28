<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  confirmImportProducts,
  downloadProductImportTemplate,
  importProducts,
  removeImportedProduct
} from "@/api/product";
import { productI18nName } from "@/utils/locale";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";

defineOptions({ name: "ProductImportDialog" });

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  imported: [];
}>();

const importing = ref(false);
const confirming = ref(false);
const downloadingTemplate = ref(false);
const importInputRef = ref<HTMLInputElement | null>(null);
const importedList = ref<any[]>([]);
const importErrors = ref<string[]>([]);
const importConfirmed = ref(false);
const previewId = ref("");
const importSummary = ref({ created: 0, updated: 0, failed: 0 });

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档"
};

const tableColumns: ToolbarTableColumn[] = [
  { prop: "sku", label: "SKU", minWidth: 140 },
  { prop: "name", label: "名称", minWidth: 180, slot: true },
  { prop: "category", label: "分类", minWidth: 160, slot: true },
  { prop: "vehicles", label: "适配车型", minWidth: 220, slot: true },
  { prop: "status", label: "状态", width: 110, slot: true }
];

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit("update:modelValue", val)
});

const resultTitle = computed(() => {
  const { created, updated, failed } = importSummary.value;
  const parts = [`新增 ${created} 条`, `更新 ${updated} 条`];
  if (failed) parts.push(`失败 ${failed} 条`);
  if (importConfirmed.value) {
    return `本次导入结果（${parts.join("，")}）`;
  }
  return `待确认导入（${parts.join("，")}）`;
});

function resetState() {
  importing.value = false;
  confirming.value = false;
  downloadingTemplate.value = false;
  importedList.value = [];
  importErrors.value = [];
  importConfirmed.value = false;
  previewId.value = "";
  importSummary.value = { created: 0, updated: 0, failed: 0 };
}

watch(
  () => props.modelValue,
  open => {
    if (open) resetState();
  }
);

function syncSummaryFromList() {
  importSummary.value = {
    created: importedList.value.filter(item => item.action !== "update").length,
    updated: importedList.value.filter(item => item.action === "update").length,
    failed: importErrors.value.length
  };
}

function downloadStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function i18nName(row: any) {
  return productI18nName(row);
}

function categoryPath(row: any) {
  const category = row.category;
  if (!category) return "—";
  if (category.parent?.nameZh) {
    return `${category.parent.nameZh} / ${category.nameZh}`;
  }
  return category.nameZh || "—";
}

function vehicleLabel(row: any) {
  const year =
    row.yearFrom && row.yearTo
      ? `${row.yearFrom}-${row.yearTo}`
      : row.yearFrom || row.yearTo || "";
  return `${row.brandZh || ""} ${row.modelZh || row.code || ""}${
    year ? ` (${year})` : ""
  }`.trim();
}

function statusTagType(status: string) {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED") return "info";
  return "warning";
}

function rowActions(): ActionButtonItem[] {
  return [{ key: "remove", label: "移除", type: "danger" }];
}

async function onDownloadTemplate() {
  downloadingTemplate.value = true;
  try {
    const blob = await downloadProductImportTemplate();
    downloadBlob(blob as Blob, `产品导入模板_${downloadStamp()}.xlsx`);
    ElMessage.success("模板已下载");
  } catch (err) {
    ElMessage.error(errorMessage(err, "模板下载失败"));
  } finally {
    downloadingTemplate.value = false;
  }
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    const res = await importProducts(file);
    const data = res.data;
    importedList.value = data?.list || [];
    importErrors.value = data?.errors || [];
    importConfirmed.value = false;
    previewId.value = data?.previewId || "";
    syncSummaryFromList();
    if (importErrors.value.length && importedList.value.length) {
      ElMessage.warning(
        `部分校验通过：新增 ${importSummary.value.created}，更新 ${importSummary.value.updated}，失败 ${importSummary.value.failed}。请核对后点击「确认导入」`
      );
    } else {
      ElMessage.success(
        `已解析 ${importedList.value.length} 条，请核对后点击「确认导入」`
      );
    }
  } catch (err) {
    importedList.value = [];
    importConfirmed.value = false;
    previewId.value = "";
    const msg = errorMessage(err, "导入失败");
    importErrors.value = msg
      .replace(/^导入失败，共 \d+ 条未通过校验：/, "")
      .split(/；|;/)
      .map(item => item.trim())
      .filter(Boolean);
    importSummary.value = {
      created: 0,
      updated: 0,
      failed: importErrors.value.length
    };
    ElMessage.error("导入失败，请查看下方原因");
  } finally {
    importing.value = false;
    input.value = "";
  }
}

async function onConfirmImport() {
  const count = importedList.value.length;
  if (!count || !previewId.value) return;
  try {
    await ElMessageBox.confirm(`确定添加${count}个产品吗？`, "提示", {
      type: "warning"
    });
  } catch {
    return;
  }
  confirming.value = true;
  try {
    const res = await confirmImportProducts(
      previewId.value,
      importedList.value.map(item => item.sku).filter(Boolean)
    );
    const data = res.data;
    importedList.value = data?.list || [];
    importErrors.value = data?.errors || [];
    importConfirmed.value = true;
    previewId.value = "";
    importSummary.value = {
      created: data?.created || 0,
      updated: data?.updated || 0,
      failed: data?.failed || importErrors.value.length
    };
    emit("imported");
    if (importErrors.value.length) {
      ElMessage.warning(
        `已写入产品列表：新增 ${importSummary.value.created}，更新 ${importSummary.value.updated}，失败 ${importSummary.value.failed}`
      );
    } else {
      ElMessage.success(
        `已添加到产品列表：新增 ${importSummary.value.created} 条，更新 ${importSummary.value.updated} 条`
      );
    }
  } catch (err) {
    ElMessage.error(errorMessage(err, "确认导入失败"));
  } finally {
    confirming.value = false;
  }
}

async function onRemove(row: any) {
  if (!importConfirmed.value) {
    try {
      await ElMessageBox.confirm(
        `确认从本次导入中移除「${i18nName(row) || row.sku}」？`,
        "提示",
        { type: "warning" }
      );
    } catch {
      return;
    }
    importedList.value = importedList.value.filter(item => item.sku !== row.sku);
    syncSummaryFromList();
    ElMessage.success("已从本次导入中移除");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认移除已导入的产品「${i18nName(row) || row.sku}」？移除后将从产品列表中删除。`,
      "提示",
      { type: "warning" }
    );
  } catch {
    return;
  }
  await removeImportedProduct(row.id);
  importedList.value = importedList.value.filter(item => item.id !== row.id);
  emit("imported");
  ElMessage.success("已移除");
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="导入产品"
    width="960px"
    top="6vh"
    append-to-body
    destroy-on-close
    class="product-import-dialog"
  >
    <div class="import-dialog-body">
      <p class="import-hint">
        先下载 Excel 模板，按列填写后再导入。带
        <span class="text-red-500">*</span>
        的列为必填项。分类、状态、新品/热销/首页主推、适配车型请用下拉选择（选项随后台数据更新）；适配车型可在「适配车型1」到「适配车型8」中分别选择。导入后请核对列表，点击「确认导入」才会写入产品列表。
      </p>
      <div class="import-actions">
        <el-button
          type="primary"
          plain
          :loading="downloadingTemplate"
          @click="onDownloadTemplate"
        >
          下载 Excel 模板
        </el-button>
        <el-button :loading="importing" @click="importInputRef?.click()">
          导入 Excel
        </el-button>
        <input
          ref="importInputRef"
          type="file"
          accept=".xlsx,.xls"
          class="hidden-file"
          @change="onImportFile"
        />
      </div>

      <el-alert
        v-if="importErrors.length"
        class="import-alert"
        title="导入失败明细"
        type="error"
        :closable="false"
        show-icon
      >
        <ul class="import-error-list">
          <li v-for="(item, index) in importErrors" :key="index">{{ item }}</li>
        </ul>
      </el-alert>

      <div v-if="importedList.length" class="import-result">
        <div class="import-result-header">
          <span>{{ resultTitle }}</span>
          <el-button
            v-if="!importConfirmed"
            type="primary"
            :loading="confirming"
            :disabled="!previewId"
            @click="onConfirmImport"
          >
            确认导入
          </el-button>
        </div>
        <ToolbarTable
          :columns="tableColumns"
          :data="importedList"
          :show-toolbar="false"
          :show-pagination="false"
          :table-props="{ rowKey: 'sku', maxHeight: 360 }"
          action-column-label="操作"
        >
          <template #name="{ row }">{{ i18nName(row) }}</template>
          <template #category="{ row }">{{ categoryPath(row) }}</template>
          <template #vehicles="{ row }">
            <div v-if="row.vehicles?.length" class="vehicle-tags">
              <el-tag
                v-for="item in row.vehicles"
                :key="item.id"
                size="small"
                class="mr-1 mb-1"
              >
                {{ vehicleLabel(item) }}
              </el-tag>
            </div>
            <span v-else class="text-gray-400">—</span>
          </template>
          <template #status="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel[row.status] || row.status }}
            </el-tag>
          </template>
          <template #action="{ row }">
            <ActionButtons :buttons="rowActions()" @action="onRemove(row)" />
          </template>
        </ToolbarTable>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.import-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: min(68vh, 720px);
  overflow: auto;
}

.import-hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hidden-file {
  display: none;
}

.import-alert {
  flex-shrink: 0;
}

.import-error-list {
  margin: 6px 0 0;
  padding-left: 18px;
  line-height: 1.7;
}

.import-result {
  min-width: 0;
}

.import-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.vehicle-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
