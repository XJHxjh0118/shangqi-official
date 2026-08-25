<template>
  <div v-show="!hidden" class="toolbar-table-pagination">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="layout"
      :page-sizes="pageSizes"
      :pager-count="pagerCount"
      :total="total"
      :small="small"
      :hide-on-single-page="hideOnSinglePage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    total: number;
    page?: number;
    limit?: number;
    pageSizes?: number[];
    pagerCount?: number;
    layout?: string;
    background?: boolean;
    small?: boolean;
    hidden?: boolean;
    hideOnSinglePage?: boolean;
  }>(),
  {
    page: 1,
    limit: 10,
    pageSizes: () => [10, 20, 30, 50],
    pagerCount: 7,
    layout: "total, sizes, prev, pager, next, jumper",
    background: true,
    small: false,
    hidden: false,
    hideOnSinglePage: false
  }
);

const emit = defineEmits<{
  "update:page": [value: number];
  "update:limit": [value: number];
  pagination: [params: { page: number; limit: number }];
}>();

const currentPage = computed({
  get: () => props.page,
  set: (val: number) => emit("update:page", val)
});

const pageSize = computed({
  get: () => props.limit,
  set: (val: number) => emit("update:limit", val)
});

function handleSizeChange(val: number) {
  if (currentPage.value * val > props.total) {
    currentPage.value = 1;
  }
  emit("pagination", { page: currentPage.value, limit: val });
}

function handleCurrentChange(val: number) {
  emit("pagination", { page: val, limit: pageSize.value });
}
</script>

<style scoped lang="scss">
.toolbar-table-pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
