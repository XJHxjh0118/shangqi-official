<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type ElTree } from "element-plus";
import {
  createRole,
  deleteRole,
  getRoleMenus,
  getRoles,
  updateRole,
  type MenuNode,
  type RoleItem
} from "@/api/role";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type { SearchFilterField } from "@/components/SearchFilters/types";
import {
  buildListQuery,
  ENABLED_STATUS_OPTIONS
} from "@/utils/list-query";

defineOptions({ name: "AccountRole" });

const loading = ref(false);
const list = ref<RoleItem[]>([]);
const filters = ref<Record<string, unknown>>({
  keyword: "",
  enabled: "",
  isSystem: ""
});
const menuTree = ref<MenuNode[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const treeRef = ref<InstanceType<typeof ElTree>>();
const form = reactive({
  code: "",
  name: "",
  description: "",
  enabled: true
});
const isSystem = ref(false);
const isAdmin = ref(false);
const isDealer = ref(false);

const tableColumns: ToolbarTableColumn[] = [
  { prop: "name", label: "角色名称", minWidth: 140 },
  { prop: "code", label: "角色标识", width: 140 },
  { prop: "description", label: "说明", minWidth: 220 },
  { prop: "menus", label: "菜单权限", width: 110, slot: true },
  { prop: "isSystem", label: "类型", width: 110, slot: true },
  { prop: "enabled", label: "状态", width: 90, slot: true }
];

const filterFields: SearchFilterField[] = [
  {
    prop: "keyword",
    label: "关键词",
    placeholder: "名称 / 标识 / 说明",
    width: 240
  },
  {
    prop: "isSystem",
    label: "类型",
    type: "select",
    placeholder: "类型",
    width: 140,
    options: [
      { label: "系统内置", value: "true" },
      { label: "自定义", value: "false" }
    ]
  },
  {
    prop: "enabled",
    label: "状态",
    type: "select",
    placeholder: "状态",
    width: 120,
    options: ENABLED_STATUS_OPTIONS
  }
];

const treeProps = {
  children: "children",
  label: "title"
};

async function fetchList() {
  loading.value = true;
  try {
    const [rolesRes, menusRes] = await Promise.all([
      getRoles(buildListQuery(filters.value)),
      getRoleMenus()
    ]);
    list.value = rolesRes.data || [];
    menuTree.value = menusRes.data || [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchList();
}

function menuCount(row: RoleItem) {
  if (row.code === "ADMIN") return "全部";
  return `${row.menus?.length || 0} 项`;
}

function collectKeys(nodes: MenuNode[]): string[] {
  return nodes.flatMap(node => [
    node.key,
    ...(node.children ? collectKeys(node.children) : [])
  ]);
}

function resetForm() {
  Object.assign(form, {
    code: "",
    name: "",
    description: "",
    enabled: true
  });
  isSystem.value = false;
  isAdmin.value = false;
  isDealer.value = false;
  nextTick(() => treeRef.value?.setCheckedKeys([]));
}

function openCreate() {
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: RoleItem) {
  editingId.value = row.id;
  isSystem.value = row.isSystem;
  isAdmin.value = row.code === "ADMIN";
  isDealer.value = row.code === "DEALER";
  Object.assign(form, {
    code: row.code,
    name: row.name,
    description: row.description || "",
    enabled: row.enabled
  });
  dialogVisible.value = true;
  nextTick(() => {
    const keys = isAdmin.value ? collectKeys(menuTree.value) : row.menus || [];
    treeRef.value?.setCheckedKeys(keys);
  });
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写角色名称");
    return;
  }
  if (!editingId.value && !form.code.trim()) {
    ElMessage.warning("请填写角色标识");
    return;
  }
  const menus = isDealer.value
    ? []
    : isAdmin.value
      ? collectKeys(menuTree.value)
      : [
          ...((treeRef.value?.getCheckedKeys(false) as string[]) || []),
          ...((treeRef.value?.getHalfCheckedKeys() as string[]) || [])
        ];
  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    enabled: form.enabled,
    menus
  };
  if (editingId.value) {
    await updateRole(editingId.value, payload);
    ElMessage.success("更新成功");
  } else {
    await createRole({ ...payload, code: form.code.trim() });
    ElMessage.success("创建成功");
  }
  dialogVisible.value = false;
  fetchList();
}

async function onDelete(row: RoleItem) {
  await ElMessageBox.confirm(`确认删除角色「${row.name}」？`, "提示", {
    type: "warning"
  });
  await deleteRole(row.id);
  ElMessage.success("已删除");
  fetchList();
}

function rowActions(row: RoleItem): ActionButtonItem[] {
  return [
    { key: "edit", label: "编辑" },
    { key: "delete", label: "删除", type: "danger", hidden: row.isSystem }
  ];
}

function onRowAction(key: string, row: RoleItem) {
  if (key === "edit") openEdit(row);
  else if (key === "delete") onDelete(row);
}

onMounted(fetchList);
</script>

<template>
  <div class="page-fill">
    <el-card shadow="never">
      <p class="mb-4 text-sm text-gray-500">
        配置后台角色及其可访问的菜单。系统内置角色不可删除。
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
        client-pagination
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-system-role-columns' }"
        @query-table="fetchList"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="openCreate">新建角色</el-button>
        </template>
        <template #menus="{ row }">{{ menuCount(row) }}</template>
        <template #isSystem="{ row }">
          <el-tag :type="row.isSystem ? 'warning' : 'info'" size="small">
            {{ row.isSystem ? "系统内置" : "自定义" }}
          </el-tag>
        </template>
        <template #enabled="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? "启用" : "停用" }}
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
      :title="editingId ? '编辑角色' : '新建角色'"
      width="640px"
    >
      <el-form label-width="96px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.name" placeholder="如：SEO运营" />
        </el-form-item>
        <el-form-item label="角色标识" required>
          <el-input
            v-model="form.code"
            :disabled="!!editingId"
            placeholder="如：SEO，保存后不可改"
          />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item v-if="!isAdmin" label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <p v-if="isDealer" class="text-xs text-gray-400">
            经销商仅用于前台账号，不配置后台菜单。
          </p>
          <el-tree
            v-else
            ref="treeRef"
            :data="menuTree"
            :props="treeProps"
            node-key="key"
            show-checkbox
            default-expand-all
            :class="{ 'is-readonly': isAdmin }"
          />
          <p v-if="isAdmin" class="mt-2 text-xs text-gray-400">
            管理员默认拥有全部菜单，不可更改。
          </p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.is-readonly {
  pointer-events: none;
  opacity: 0.85;
}
</style>
