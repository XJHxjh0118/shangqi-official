<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { exportProducts, importProducts } from "@/api/product";

defineOptions({ name: "ProductImportExport" });

const importing = ref(false);
const exporting = ref(false);
const importInputRef = ref<HTMLInputElement | null>(null);

async function onExport() {
  exporting.value = true;
  try {
    const blob = await exportProducts();
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch {
    ElMessage.error("导出失败");
  } finally {
    exporting.value = false;
  }
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    await importProducts(file);
    ElMessage.success("导入完成");
  } catch {
    ElMessage.error("导入失败");
  } finally {
    importing.value = false;
    input.value = "";
  }
}
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <p class="mb-6 text-sm text-gray-500">
        通过 Excel 批量维护产品。建议先导出模板，按列填写后再导入。
      </p>
      <div class="flex gap-3">
        <el-button type="primary" :loading="exporting" @click="onExport">
          导出 Excel
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
    </el-card>
  </div>
</template>

<style scoped>
.hidden-file {
  display: none;
}
</style>
