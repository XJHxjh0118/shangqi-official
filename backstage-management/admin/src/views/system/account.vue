<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  approveUser,
  createUser,
  deleteUser,
  getUser,
  getUsers,
  rejectUser,
  resetUserPassword,
  updateUser
} from "@/api/user-manage";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";

defineOptions({ name: "AccountList" });

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const drawerVisible = ref(false);
const editingId = ref<number | null>(null);
const detailRow = ref<any | null>(null);
const detailLoading = ref(false);
const editLoading = ref(false);
const resetVisible = ref(false);
const resetSaving = ref(false);
const resetTarget = ref<any | null>(null);
const createPwdVisible = ref(false);
const resetPwdVisible = ref(false);
const resetConfirmVisible = ref(false);
const query = reactive({
  page: 1,
  pageSize: 10
});
const filters = ref<Record<string, unknown>>({ keyword: "", status: "" });
const form = reactive({
  email: "",
  password: "",
  company: "",
  contactName: "",
  phone: "",
  region: "",
  regionalManager: "",
  address: "",
  enabled: true
});
const resetForm = reactive({
  password: "",
  confirm: ""
});

const statusLabel: Record<string, string> = {
  PENDING: "待审批",
  APPROVED: "已通过",
  REJECTED: "已拒绝"
};

function statusType(status: string) {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "info";
}

const tableColumns: ToolbarTableColumn[] = [
  { prop: "company", label: "公司名称", minWidth: 160 },
  { prop: "contactName", label: "联系人", width: 120, slot: true },
  { prop: "email", label: "邮箱", minWidth: 180, slot: true },
  { prop: "phone", label: "电话", width: 130 },
  { prop: "region", label: "国家/地区", width: 140 },
  { prop: "regionalManager", label: "区域经理", width: 120 },
  { prop: "address", label: "详细地址", minWidth: 160, slot: true },
  { prop: "status", label: "审批", width: 100, slot: true },
  { prop: "enabled", label: "状态", width: 90, slot: true }
];

const filterFields: SearchFilterField[] = [
  { prop: "keyword", label: "关键词", placeholder: "公司 / 联系人 / 邮箱", width: 240 },
  {
    prop: "status",
    label: "审批状态",
    type: "select",
    placeholder: "审批状态",
    width: 140,
    options: [
      { label: "待审批", value: "PENDING" },
      { label: "已通过", value: "APPROVED" },
      { label: "已拒绝", value: "REJECTED" }
    ]
  }
];

function formatTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getUsers({
      page: query.page,
      pageSize: query.pageSize,
      keyword: (filters.value.keyword as string) || undefined,
      status: (filters.value.status as string) || undefined,
      kind: "dealer"
    });
    list.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function clearAccountForm() {
  Object.assign(form, {
    email: "",
    password: "",
    company: "",
    contactName: "",
    phone: "",
    region: "",
    regionalManager: "",
    address: "",
    enabled: true
  });
}

function fillForm(row: any) {
  Object.assign(form, {
    email: row.email || row.username || "",
    password: "",
    company: row.company || "",
    contactName: row.contactName || row.nickname || "",
    phone: row.phone || "",
    region: row.region || "",
    regionalManager: row.regionalManager || "",
    address: row.address || "",
    enabled: row.enabled !== false
  });
}

async function fetchDetail(id: number) {
  const res = await getUser(id);
  const row = res.data;
  if (!row) throw new Error("未获取到账号详情");
  return row;
}

function openCreate() {
  editingId.value = null;
  createPwdVisible.value = false;
  clearAccountForm();
  dialogVisible.value = true;
}

async function openEdit(row: any) {
  editingId.value = row.id;
  clearAccountForm();
  dialogVisible.value = true;
  editLoading.value = true;
  try {
    const detail = await fetchDetail(row.id);
    fillForm(detail);
  } catch {
    ElMessage.error("获取账号详情失败");
    dialogVisible.value = false;
  } finally {
    editLoading.value = false;
  }
}

async function openDetail(row: any) {
  detailRow.value = null;
  drawerVisible.value = true;
  detailLoading.value = true;
  try {
    detailRow.value = await fetchDetail(row.id);
  } catch {
    ElMessage.error("获取账号详情失败");
    drawerVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

async function submit() {
  if (!form.email || !form.company || !form.contactName) {
    ElMessage.warning("请填写邮箱、公司名称和联系人");
    return;
  }
  if (!editingId.value && (!form.password || form.password.length < 6)) {
    ElMessage.warning("请填写至少 6 位密码");
    return;
  }
  const payload: any = {
    username: form.email,
    nickname: form.contactName,
    email: form.email,
    company: form.company,
    contactName: form.contactName,
    phone: form.phone || undefined,
    region: form.region || undefined,
    regionalManager: form.regionalManager || undefined,
    address: form.address || undefined,
    role: "DEALER",
    enabled: form.enabled
  };
  if (!editingId.value) payload.password = form.password;
  if (editingId.value) {
    await updateUser(editingId.value, payload);
    ElMessage.success("更新成功");
  } else {
    await createUser(payload);
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  fetchList();
}

async function onApprove(row: any) {
  await approveUser(row.id);
  ElMessage.success("已通过审批，账号可登录前台");
  fetchList();
}

async function onReject(row: any) {
  await ElMessageBox.confirm(`确认拒绝 ${row.company || row.email}？`, "提示", {
    type: "warning"
  });
  await rejectUser(row.id);
  ElMessage.success("已拒绝");
  fetchList();
}

async function onToggleEnabled(row: any) {
  const next = !row.enabled;
  await updateUser(row.id, { enabled: next });
  ElMessage.success(next ? "已启用" : "已下架");
  fetchList();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除账号 ${row.email || row.username}？`, "提示", {
    type: "warning"
  });
  await deleteUser(row.id);
  ElMessage.success("已删除");
  fetchList();
}

function openReset(row: any) {
  resetTarget.value = row;
  resetForm.password = "";
  resetForm.confirm = "";
  resetPwdVisible.value = false;
  resetConfirmVisible.value = false;
  resetVisible.value = true;
}

async function submitReset() {
  if (!resetTarget.value?.id) return;
  if (!resetForm.password || resetForm.password.length < 6) {
    ElMessage.warning("新密码至少 6 位");
    return;
  }
  if (resetForm.password !== resetForm.confirm) {
    ElMessage.warning("两次输入的密码不一致");
    return;
  }
  resetSaving.value = true;
  try {
    await resetUserPassword(resetTarget.value.id, { password: resetForm.password });
    ElMessage.success("密码已重置");
    resetVisible.value = false;
  } finally {
    resetSaving.value = false;
  }
}

onMounted(fetchList);

function handleSearch() {
  query.page = 1;
  fetchList();
}

function rowActions(row: any): ActionButtonItem[] {
  return [
    { key: "detail", label: "详情" },
    { key: "approve", label: "通过", type: "success", hidden: row.status !== "PENDING" },
    { key: "reject", label: "拒绝", type: "warning", hidden: row.status !== "PENDING" },
    { key: "edit", label: "编辑" },
    { key: "reset", label: "重置密码", type: "warning" },
    { key: "toggle", label: row.enabled ? "下架" : "启用" },
    { key: "delete", label: "删除", type: "danger" }
  ];
}

function onRowAction(key: string, row: any) {
  if (key === "detail") openDetail(row);
  else if (key === "approve") onApprove(row);
  else if (key === "reject") onReject(row);
  else if (key === "edit") openEdit(row);
  else if (key === "reset") openReset(row);
  else if (key === "toggle") onToggleEnabled(row);
  else if (key === "delete") onDelete(row);
}
</script>

<template>
  <div class="page-fill">
    <el-card shadow="never">
      <p class="mb-4 text-sm text-gray-500">
        管理官网前台经销商账号：审批、下架与维护联系信息。
      </p>
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
        :toolbar-props="{ refresh: true, storageKey: 'admin-system-account-columns' }"
        @pagination="fetchList"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="success" @click="openCreate">新建前台账号</el-button>
        </template>
        <template #contactName="{ row }">
          {{ row.contactName || row.nickname || "-" }}
        </template>
        <template #email="{ row }">{{ row.email || row.username }}</template>
        <template #address="{ row }">{{ row.address || "-" }}</template>
        <template #status="{ row }">
          <el-tag :type="statusType(row.status)" size="small">
            {{ statusLabel[row.status] || row.status }}
          </el-tag>
        </template>
        <template #enabled="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? "启用" : "下架" }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <ActionButtons
            :buttons="rowActions(row)"
            @action="({ key }) => onRowAction(key, row)"
          />
        </template>
      </ToolbarTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑前台账号' : '新建前台账号'"
      width="560px"
    >
      <div v-loading="editLoading">
      <el-form label-width="108px">
        <el-form-item label="登录邮箱" required>
          <el-input v-model="form.email" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="密码" required>
          <el-input
            v-model="form.password"
            :type="createPwdVisible ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="请设置登录密码，至少 6 位"
          >
            <template #suffix>
              <span
                class="pwd-eye"
                :title="createPwdVisible ? '隐藏密码' : '查看密码'"
                @click="createPwdVisible = !createPwdVisible"
              >
                <svg
                  v-if="!createPwdVisible"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
                  <path d="M9.9 5.1A11 11 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-4.2 4.8" />
                  <path d="M6.1 6.1C3.6 7.8 1 12 1 12s4 7 11 7a10.7 10.7 0 0 0 4.1-.8" />
                </svg>
              </span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="公司名称" required>
          <el-input v-model="form.company" />
        </el-form-item>
        <el-form-item label="联系人姓名" required>
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="form.region" placeholder="国家 / 省市区" />
        </el-form-item>
        <el-form-item label="区域经理">
          <el-input v-model="form.regionalManager" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item v-if="editingId" label="启用">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="下架" />
        </el-form-item>
      </el-form>
      </div>
      <template #footer>
        <el-button v-if="editingId" @click="openReset({ id: editingId, email: form.email })">
          重置密码
        </el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="drawerVisible"
      title="前台账号详情"
      size="420px"
      destroy-on-close
    >
      <div v-loading="detailLoading">
      <el-descriptions v-if="detailRow" :column="1" border>
        <el-descriptions-item label="登录邮箱">
          {{ detailRow.email || detailRow.username || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="公司名称">
          {{ detailRow.company || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ detailRow.contactName || detailRow.nickname || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="电话">
          {{ detailRow.phone || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="区域">
          {{ detailRow.region || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="区域经理">
          {{ detailRow.regionalManager || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="详细地址">
          {{ detailRow.address || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="审批状态">
          <el-tag :type="statusType(detailRow.status)" size="small">
            {{ statusLabel[detailRow.status] || detailRow.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag :type="detailRow.enabled ? 'success' : 'info'" size="small">
            {{ detailRow.enabled ? "启用" : "下架" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(detailRow.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatTime(detailRow.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>
      </div>
      <template #footer>
        <el-button
          v-if="detailRow"
          type="warning"
          @click="openReset(detailRow)"
        >
          重置密码
        </el-button>
      </template>
    </el-drawer>

    <el-dialog
      v-model="resetVisible"
      title="重置密码"
      width="420px"
      append-to-body
    >
      <p class="mb-4 text-sm text-gray-500">
        为「{{ resetTarget?.email || resetTarget?.username || "该账号" }}」设置新的登录密码。
      </p>
      <el-form label-width="96px">
        <el-form-item label="新密码" required>
          <el-input
            v-model="resetForm.password"
            :type="resetPwdVisible ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="至少 6 位"
          >
            <template #suffix>
              <span class="pwd-eye" @click="resetPwdVisible = !resetPwdVisible">
                {{ resetPwdVisible ? "隐藏" : "显示" }}
              </span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input
            v-model="resetForm.confirm"
            :type="resetConfirmVisible ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="再次输入新密码"
          >
            <template #suffix>
              <span
                class="pwd-eye"
                @click="resetConfirmVisible = !resetConfirmVisible"
              >
                {{ resetConfirmVisible ? "隐藏" : "显示" }}
              </span>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetSaving" @click="submitReset">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.pwd-eye {
  display: inline-flex;
  align-items: center;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  user-select: none;
}
.pwd-eye:hover {
  color: var(--el-color-primary);
}
</style>
