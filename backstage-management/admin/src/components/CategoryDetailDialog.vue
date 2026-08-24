<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "CategoryDetailDialog" });

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

const children = computed(() =>
  Array.isArray(props.row?.children) ? props.row.children : []
);

const isChild = computed(() => Boolean(props.row?.parentId));
</script>

<template>
  <el-dialog
    v-model="visible"
    title="分类详情"
    width="560px"
    align-center
    append-to-body
    destroy-on-close
  >
    <el-descriptions v-if="row" :column="1" border>
      <el-descriptions-item label="层级">
        <el-tag :type="isChild ? 'info' : 'primary'" size="small" effect="plain">
          {{ isChild ? "子分类" : "大类" }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="编码">{{ row.code || "—" }}</el-descriptions-item>
      <el-descriptions-item label="中文名称">
        {{ row.nameZh || "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="英文名称">
        {{ row.nameEn || "—" }}
      </el-descriptions-item>
      <el-descriptions-item v-if="isChild" label="所属大类">
        {{ row.parent?.nameZh || "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="排序">{{ row.sort ?? "—" }}</el-descriptions-item>
      <el-descriptions-item label="启用">
        <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
          {{ row.enabled ? "是" : "否" }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <template v-if="row && !isChild">
      <p class="section-title">子分类（{{ children.length }}）</p>
      <el-table v-if="children.length" :data="children" size="small" border>
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="nameZh" label="中文名" min-width="120" />
        <el-table-column prop="nameEn" label="英文名" min-width="140" />
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column label="启用" width="80">
          <template #default="{ row: child }">
            <el-tag :type="child.enabled ? 'success' : 'info'" size="small">
              {{ child.enabled ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无子分类" :image-size="64" />
    </template>

    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.section-title {
  margin: 16px 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
