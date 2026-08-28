<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getMessage, getMessages, handleMessage } from "@/api/message";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import LeadHandleDialog from "./components/LeadHandleDialog.vue";
import { parseTime } from "@/components/ToolbarTable/parseTime";
import {
  HANDLE_METHODS,
  HANDLE_RESULTS,
  handleOptionLabel,
  type HandleLeadPayload
} from "./handle";

defineOptions({ name: "LeadMessage" });

const STATUS_NEW = "NEW";
const STATUS_HANDLED = "HANDLED";

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const handleVisible = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const detail = ref<any | null>(null);
const handleTarget = ref<any | null>(null);
const query = reactive({ page: 1, pageSize: 15 });
const filters = ref<Record<string, unknown>>({ keyword: "", status: "" });

const filterFields: SearchFilterField[] = [
  { prop: "keyword", label: "关键词", placeholder: "姓名 / 邮箱 / 公司 / 内容", width: 260 },
  {
    prop: "status",
    label: "状态",
    type: "select",
    placeholder: "状态",
    width: 140,
    options: [
      { label: "待处理", value: STATUS_NEW },
      { label: "已处理", value: STATUS_HANDLED }
    ]
  }
];

const tableColumns: ToolbarTableColumn[] = [
  { prop: "name", label: "姓名", width: 120 },
  { prop: "email", label: "邮箱", minWidth: 180 },
  { prop: "company", label: "公司", minWidth: 140 },
  { prop: "region", label: "区域", width: 110 },
  { prop: "content", label: "留言", minWidth: 200 },
  { prop: "status", label: "状态", width: 90, slot: true },
  { prop: "handledBy", label: "处理人", width: 110 },
  { prop: "handledAt", label: "处理时间", type: "datetime", width: 180 },
  { prop: "createdAt", label: "提交时间", type: "datetime", width: 180 }
];

function statusLabel(status: string) {
  return status === STATUS_HANDLED ? "已处理" : "待处理";
}

function statusType(status: string) {
  return status === STATUS_HANDLED ? "success" : "warning";
}

function formatTime(value?: string) {
  return parseTime(value) || "-";
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getMessages({
      page: query.page,
      pageSize: query.pageSize,
      keyword: (filters.value.keyword as string) || undefined,
      status: (filters.value.status as string) || undefined
    });
    list.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

async function openDetail(row: any) {
  dialogVisible.value = true;
  detail.value = row;
  detailLoading.value = true;
  try {
    const res = await getMessage(row.id);
    detail.value = res.data || row;
  } finally {
    detailLoading.value = false;
  }
}

function openHandle(row: any) {
  handleTarget.value = row;
  handleVisible.value = true;
}

async function submitHandle(payload: HandleLeadPayload) {
  if (!handleTarget.value?.id) return;
  saving.value = true;
  try {
    await handleMessage(handleTarget.value.id, payload);
    ElMessage.success("已记录处理结果");
    handleVisible.value = false;
    if (detail.value?.id === handleTarget.value.id) {
      const res = await getMessage(handleTarget.value.id);
      detail.value = res.data || detail.value;
    }
    fetchList();
  } finally {
    saving.value = false;
  }
}

function rowActions(row: any): ActionButtonItem[] {
  return [
    { key: "view", label: "查看" },
    {
      key: "handle",
      label: "处理",
      hidden: row.status === STATUS_HANDLED
    }
  ];
}

function onRowAction(key: string, row: any) {
  if (key === "view") openDetail(row);
  else if (key === "handle") openHandle(row);
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
        :total="total"
        v-model:page="query.page"
        v-model:limit="query.pageSize"
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-lead-message-columns' }"
        @pagination="fetchList"
        @query-table="fetchList"
      >
        <template #status="{ row }">
          <el-tag :type="statusType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <ActionButtons :buttons="rowActions(row)" @action="({ key }) => onRowAction(key, row)" />
        </template>
      </ToolbarTable>
    </el-card>

    <el-dialog v-model="dialogVisible" title="留言详情" width="640px">
      <el-skeleton :loading="detailLoading" animated :rows="6">
        <template #default>
          <el-descriptions v-if="detail" :column="1" border>
            <el-descriptions-item label="姓名">{{ detail.name || "-" }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ detail.email || "-" }}</el-descriptions-item>
            <el-descriptions-item label="公司">{{ detail.company || "-" }}</el-descriptions-item>
            <el-descriptions-item label="区域">{{ detail.region || "-" }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType(detail.status)" size="small">
                {{ statusLabel(detail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ formatTime(detail.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="留言内容">
              <div class="lead-content">{{ detail.content || "-" }}</div>
            </el-descriptions-item>
          </el-descriptions>
          <div v-if="detail?.status === STATUS_HANDLED" class="mt-4 mb-2 text-sm text-gray-500">
            处理记录
          </div>
          <el-descriptions
            v-if="detail?.status === STATUS_HANDLED"
            :column="1"
            border
          >
            <el-descriptions-item label="处理人">{{ detail.handledBy || "-" }}</el-descriptions-item>
            <el-descriptions-item label="处理时间">{{ formatTime(detail.handledAt) }}</el-descriptions-item>
            <el-descriptions-item label="处理方式">
              {{ handleOptionLabel(HANDLE_METHODS, detail.handleMethod) }}
            </el-descriptions-item>
            <el-descriptions-item label="处理结论">
              {{ handleOptionLabel(HANDLE_RESULTS, detail.handleResult) }}
            </el-descriptions-item>
            <el-descriptions-item label="处理说明">
              <div class="lead-content">{{ detail.handleRemark || "-" }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </el-skeleton>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button
          v-if="detail && detail.status !== STATUS_HANDLED"
          type="primary"
          @click="openHandle(detail)"
        >
          处理
        </el-button>
      </template>
    </el-dialog>

    <LeadHandleDialog v-model="handleVisible" :loading="saving" @submit="submitHandle">
      <div v-if="handleTarget" class="handle-summary">
        <div><strong>{{ handleTarget.name }}</strong> · {{ handleTarget.email }}</div>
        <div class="lead-content mt-1">{{ handleTarget.content }}</div>
      </div>
    </LeadHandleDialog>
  </div>
</template>

<style scoped>
.lead-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.handle-summary {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
</style>
