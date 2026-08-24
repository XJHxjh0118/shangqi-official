<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { getOperationLogs } from "@/api/operation-log";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";

defineOptions({ name: "SystemOperationLog" });

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 15
});
const filters = ref<Record<string, unknown>>({
  username: "",
  action: "",
  path: "",
  dateRange: []
});

const filterFields: SearchFilterField[] = [
  { prop: "username", label: "用户", placeholder: "用户", width: 160 },
  {
    prop: "action",
    label: "行为",
    type: "select",
    placeholder: "行为",
    width: 140,
    options: [
      { label: "新增", value: "新增" },
      { label: "修改", value: "修改" },
      { label: "删除", value: "删除" },
      { label: "导入", value: "导入" },
      { label: "排序", value: "排序" },
      { label: "批量修改", value: "批量修改" },
      { label: "审核通过", value: "审核通过" },
      { label: "审核拒绝", value: "审核拒绝" },
      { label: "重置密码", value: "重置密码" },
      { label: "更新状态", value: "更新状态" },
      { label: "绑定素材", value: "绑定素材" }
    ]
  },
  { prop: "path", label: "接口", placeholder: "接口", width: 220 },
  {
    prop: "dateRange",
    label: "时间",
    type: "datetimerange",
    placeholder: "时间范围"
  }
];

const tableColumns: ToolbarTableColumn[] = [
  { prop: "username", label: "用户", width: 120 },
  { prop: "action", label: "行为", width: 110 },
  { prop: "path", label: "接口", minWidth: 240 },
  { prop: "createdAt", label: "时间", type: "datetime", width: 180 },
  { prop: "description", label: "操作描述", minWidth: 280 }
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getOperationLogs({
      page: query.page,
      pageSize: query.pageSize,
      username: (filters.value.username as string) || undefined,
      action: (filters.value.action as string) || undefined,
      path: (filters.value.path as string) || undefined,
      startAt: (filters.value.dateRange as string[])?.[0] || undefined,
      endAt: (filters.value.dateRange as string[])?.[1] || undefined
    });
    list.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchList);

function handleSearch() {
  query.page = 1;
  fetchList();
}
</script>

<template>
  <div class="p-4">
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
        :total="total"
        v-model:page="query.page"
        v-model:limit="query.pageSize"
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-system-operation-log-columns' }"
        @pagination="fetchList"
        @query-table="fetchList"
      />
    </el-card>
  </div>
</template>
