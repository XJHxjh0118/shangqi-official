<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getInquiries } from "@/api/inquiry";
import { getMessages } from "@/api/message";
import { getUsers } from "@/api/user-manage";
import { parseTime } from "@/components/ToolbarTable/parseTime";
import BellIcon from "~icons/ep/bell";
import NoticeList from "./components/NoticeList.vue";
import { noticesData, type ListItem, type TabItem } from "./data";

const PREVIEW_SIZE = 8;

const router = useRouter();
const dropdownRef = ref();
const notices = ref<TabItem[]>(noticesData.map(tab => ({ ...tab, list: [] })));
const activeKey = ref("2");

const noticesNum = computed(() =>
  notices.value.reduce((sum, tab) => sum + (tab.total ?? tab.list.length), 0)
);

const getLabel = computed(
  () => (item: TabItem) => {
    const count = item.total ?? item.list.length;
    return item.name + (count > 0 ? `(${count})` : "");
  }
);

function listOf(res: { data?: { list?: unknown[]; total?: number } }) {
  return {
    list: (res.data?.list || []) as Record<string, unknown>[],
    total: Number(res.data?.total || 0)
  };
}

function formatTime(value?: unknown) {
  return parseTime(value, "{y}-{m}-{d} {h}:{i}") || "";
}

async function loadNotices() {
  const [messagesRes, inquiriesRes, usersRes] = await Promise.allSettled([
    getMessages({ page: 1, pageSize: PREVIEW_SIZE, status: "NEW" }),
    getInquiries({ page: 1, pageSize: PREVIEW_SIZE, status: "NEW" }),
    getUsers({
      page: 1,
      pageSize: PREVIEW_SIZE,
      status: "PENDING",
      kind: "dealer"
    })
  ]);

  const messages =
    messagesRes.status === "fulfilled" ? listOf(messagesRes.value) : { list: [], total: 0 };
  const inquiries =
    inquiriesRes.status === "fulfilled" ? listOf(inquiriesRes.value) : { list: [], total: 0 };
  const users =
    usersRes.status === "fulfilled" ? listOf(usersRes.value) : { list: [], total: 0 };

  const messageItems: ListItem[] = [
    ...messages.list.map(row => ({
      at: Date.parse(String(row.createdAt || "")),
      item: {
        title: `${String(row.name || "访客")} · 联系留言`,
        description: String(row.content || row.email || ""),
        datetime: formatTime(row.createdAt),
        extra: "待处理",
        status: "warning" as const,
        type: "2",
        path: "/lead/message"
      }
    })),
    ...inquiries.list.map(row => ({
      at: Date.parse(String(row.createdAt || "")),
      item: {
        title: `${String(row.contactName || row.company || "经销商")} · 产品询盘`,
        description: String(row.message || row.company || row.email || ""),
        datetime: formatTime(row.createdAt),
        extra: "待处理",
        status: "warning" as const,
        type: "2",
        path: "/lead/inquiry"
      }
    }))
  ]
    .sort((a, b) => (Number.isNaN(b.at) ? 0 : b.at) - (Number.isNaN(a.at) ? 0 : a.at))
    .slice(0, PREVIEW_SIZE)
    .map(row => row.item);

  const todoItems: ListItem[] = users.list.map(row => ({
    title: String(row.company || row.contactName || row.email || "前台账号"),
    description: [row.contactName, row.email, row.region].filter(Boolean).join(" · "),
    datetime: formatTime(row.createdAt),
    extra: "待审批",
    status: "warning" as const,
    type: "3",
    path: "/account/list"
  }));

  notices.value = notices.value.map(tab => {
    if (tab.key === "2") {
      return {
        ...tab,
        list: messageItems,
        total: messages.total + inquiries.total,
        morePath: inquiries.total > messages.total ? "/lead/inquiry" : "/lead/message"
      };
    }
    if (tab.key === "3") {
      return {
        ...tab,
        list: todoItems,
        total: users.total,
        morePath: "/account/list"
      };
    }
    return { ...tab, list: [], total: 0 };
  });
}

function closeDropdown() {
  dropdownRef.value?.handleClose?.();
}

function openItem(item: ListItem) {
  if (!item.path) return;
  router.push(item.path);
  closeDropdown();
}

function openMore(tab: TabItem) {
  if (!tab.morePath) return;
  router.push(tab.morePath);
  closeDropdown();
}

function onVisibleChange(visible: boolean) {
  if (visible) loadNotices();
}

onMounted(() => {
  loadNotices();
});
</script>

<template>
  <el-dropdown
    ref="dropdownRef"
    trigger="click"
    placement="bottom-end"
    @visible-change="onVisibleChange"
  >
    <span
      :class="[
        'dropdown-badge',
        'navbar-bg-hover',
        'select-none',
        Number(noticesNum) !== 0 && 'mr-[10px]'
      ]"
    >
      <el-badge :value="Number(noticesNum) === 0 ? '' : noticesNum" :max="99">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="BellIcon" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-tabs
          v-model="activeKey"
          :stretch="true"
          class="dropdown-tabs"
          :style="{ width: notices.length === 0 ? '200px' : '330px' }"
        >
          <el-empty
            v-if="notices.length === 0"
            description="暂无消息"
            :image-size="60"
          />
          <span v-else>
            <template v-for="item in notices" :key="item.key">
              <el-tab-pane :label="getLabel(item)" :name="`${item.key}`">
                <el-scrollbar max-height="330px">
                  <div class="noticeList-container">
                    <NoticeList
                      :list="item.list"
                      :emptyText="item.emptyText"
                      :moreText="
                        (item.total || 0) > item.list.length ? '查看全部' : ''
                      "
                      @open="openItem"
                      @more="openMore(item)"
                    />
                  </div>
                </el-scrollbar>
              </el-tab-pane>
            </template>
          </span>
        </el-tabs>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.dropdown-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 48px;
  cursor: pointer;

  .header-notice-icon {
    font-size: 18px;
  }
}

.dropdown-tabs {
  .noticeList-container {
    padding: 15px 24px 0;
  }

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap)::after {
    height: 1px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0 36px;
  }
}
</style>
