<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "VehicleDetailDialog" });

const props = defineProps<{
  modelValue: boolean;
  row?: any | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

function yearLabel(row: any) {
  if (!row) return "—";
  if (row.yearFrom && row.yearTo) return `${row.yearFrom}-${row.yearTo}`;
  return row.yearFrom || row.yearTo || "—";
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="车型详情"
    width="480px"
    align-center
    append-to-body
    destroy-on-close
  >
    <el-descriptions v-if="row" :column="1" border>
      <el-descriptions-item label="编码">{{ row.code || "—" }}</el-descriptions-item>
      <el-descriptions-item label="品牌（中）">
        {{ row.brandZh || "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="品牌（英）">
        {{ row.brandEn || "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="车型（中）">
        {{ row.modelZh || "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="车型（英）">
        {{ row.modelEn || "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="年款">{{ yearLabel(row) }}</el-descriptions-item>
      <el-descriptions-item label="排序">{{ row.sort ?? "—" }}</el-descriptions-item>
      <el-descriptions-item label="启用">
        <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
          {{ row.enabled ? "是" : "否" }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
