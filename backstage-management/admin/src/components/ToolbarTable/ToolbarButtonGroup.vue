<template>
  <div v-if="visibleButtons.length" class="toolbar-button-group">
    <template v-for="(btn, index) in primaryButtons" :key="buttonKey(btn, index)">
      <el-button
        v-bind="buttonProps(btn)"
        :icon="btn.icon"
        :loading="resolveBool(btn.loading)"
        @click="onButtonClick(btn, index)"
      >
        {{ btn.label }}
      </el-button>
    </template>

    <el-dropdown
      v-if="overflowButtons.length"
      class="toolbar-button-group__more"
      :trigger="moreTrigger"
      :teleported="teleported"
      @command="onDropdownCommand"
    >
      <el-button>
        更多
        <el-icon class="toolbar-button-group__more-arrow"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="(btn, index) in overflowButtons"
            :key="buttonKey(btn, index, 'overflow')"
            :command="buttonKey(btn, index, 'overflow')"
            :disabled="resolveBool(btn.disabled) || resolveBool(btn.loading)"
            :divided="btn.divided"
          >
            {{ btn.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ArrowDown from "~icons/ep/arrow-down";
import type { ToolbarButtonItem, ToolbarButtonsTrigger } from "./types";
import { filterVisibleButtons, resolveBool } from "./utils";

interface Props {
  buttons: ToolbarButtonItem[];
  max?: number;
  moreTrigger?: ToolbarButtonsTrigger;
  teleported?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  max: 5,
  moreTrigger: "hover",
  teleported: true
});

const emit = defineEmits<{
  action: [payload: { key: string; item: ToolbarButtonItem; index: number }];
}>();

const visibleButtons = computed(() => filterVisibleButtons(props.buttons));

const primaryButtons = computed(() => {
  const list = visibleButtons.value;
  if (list.length <= props.max) return list;
  return list.slice(0, props.max);
});

const overflowButtons = computed(() => {
  const list = visibleButtons.value;
  if (list.length <= props.max) return [];
  return list.slice(props.max);
});

function buttonKey(btn: ToolbarButtonItem, index: number, prefix = "primary") {
  return btn.key || `${prefix}-${index}-${btn.label}`;
}

function buttonProps(btn: ToolbarButtonItem) {
  return {
    type: btn.type && btn.type !== "default" ? btn.type : undefined,
    plain: btn.plain,
    disabled: resolveBool(btn.disabled) || resolveBool(btn.loading)
  };
}

function onButtonClick(btn: ToolbarButtonItem, index: number) {
  if (resolveBool(btn.disabled) || resolveBool(btn.loading)) return;
  const key = btn.key || String(index);
  emit("action", { key, item: btn, index });
}

function onDropdownCommand(command: string) {
  const btn = overflowButtons.value.find(
    (item, index) => buttonKey(item, index, "overflow") === command
  );
  if (!btn) return;
  const index = visibleButtons.value.indexOf(btn);
  onButtonClick(btn, index >= 0 ? index : props.max);
}
</script>

<style scoped lang="scss">
.toolbar-button-group {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-button-group__more {
  flex-shrink: 0;
}

.toolbar-button-group__more-arrow {
  margin-left: 4px;
}
</style>
