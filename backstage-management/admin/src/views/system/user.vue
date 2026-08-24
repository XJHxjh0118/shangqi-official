<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser
} from "@/api/user-manage";
import { getRoles, type RoleItem } from "@/api/role";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";

defineOptions({ name: "AccountStaff" });

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const roles = ref<RoleItem[]>([]);
const query = reactive({ page: 1, pageSize: 10 });
const filters = ref<Record<string, unknown>>({ keyword: "", role: "" });
const form = reactive({
  username: "",
  password: "",
  nickname: "",
  role: "EDITOR",
  enabled: true
});

const tableColumns: ToolbarTableColumn[] = [
  { prop: "username", label: "用户名", width: 160 },
  { prop: "nickname", label: "昵称", width: 140 },
  { prop: "role", label: "角色", minWidth: 160, slot: true },
  { prop: "enabled", label: "启用", width: 90, slot: true }
];

const filterFields = computed<SearchFilterField[]>(() => [
  { prop: "keyword", label: "关键词", placeholder: "用户名 / 昵称", width: 220 },
  {
    prop: "role",
    label: "角色",
    type: "select",
    placeholder: "角色",
    width: 160,
    options: roles.value.map(item => ({ label: item.name, value: item.code }))
  }
]);

function roleName(code: string) {
  return roles.value.find(r => r.code === code)?.name || code;
}

async function fetchRoles() {
  const res = await getRoles();
  roles.value = (res.data || []).filter(r => r.code !== "DEALER" && r.enabled);
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getUsers({
      page: query.page,
      pageSize: query.pageSize,
      keyword: (filters.value.keyword as string) || undefined,
      role: (filters.value.role as string) || undefined,
      kind: "staff"
    });
    list.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    username: "",
    password: "",
    nickname: "",
    role: roles.value[0]?.code || "EDITOR",
    enabled: true
  });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    username: row.username,
    password: "",
    nickname: row.nickname,
    role: row.role,
    enabled: row.enabled
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.username || !form.nickname) {
    ElMessage.warning("请填写用户名和昵称");
    return;
  }
  if (!editingId.value && !form.password) {
    ElMessage.warning("请填写密码");
    return;
  }
  if (editingId.value) {
    const payload: any = {
      nickname: form.nickname,
      role: form.role,
      enabled: form.enabled
    };
    if (form.password) payload.password = form.password;
    await updateUser(editingId.value, payload);
    ElMessage.success("更新成功");
  } else {
    await createUser({ ...form, role: form.role });
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  fetchList();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除账号 ${row.username}？`, "提示", {
    type: "warning"
  });
  await deleteUser(row.id);
  ElMessage.success("已删除");
  fetchList();
}

function handleSearch() {
  query.page = 1;
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

onMounted(async () => {
  await fetchRoles();
  fetchList();
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <p class="mb-4 text-sm text-gray-500">
        管理可登录后台的员工账号，角色权限在「角色管理」中配置。
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
        :toolbar-props="{ refresh: true, storageKey: 'admin-system-user-columns' }"
        @pagination="fetchList"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="success" @click="openCreate">新建后台账号</el-button>
        </template>
        <template #role="{ row }">{{ roleName(row.role) }}</template>
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
      :title="editingId ? '编辑后台账号' : '新建后台账号'"
      width="480px"
    >
      <el-form label-width="90px">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item :label="editingId ? '新密码' : '密码'" :required="!editingId">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="昵称" required>
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" style="width: 100%">
            <el-option
              v-for="item in roles"
              :key="item.code"
              :label="`${item.name}（${item.code}）`"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingId" label="启用">
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
