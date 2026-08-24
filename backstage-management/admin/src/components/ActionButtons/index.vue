<template>
  <div
    v-if="visibleButtons.length"
    class="action-buttons"
    :class="{ 'is-link': link, 'is-icon': showIcon }"
    :style="rootStyle"
  >
    <template v-for="(btn, index) in primaryButtons" :key="buttonKey(btn, index)">
      <el-tooltip v-if="buttonTooltip(btn)" :content="buttonTooltip(btn)!" placement="top">
        <span
          class="action-buttons__tooltip-trigger"
          :class="{ 'is-disabled-trigger': resolveBool(btn.disabled) }"
        >
          <el-button
            v-bind="buttonProps(btn)"
            :icon="resolveButtonIcon(btn)"
            :size="size"
            @click="onButtonClick(btn, index)"
          >
            {{ showButtonLabel(btn) ? btn.label : undefined }}
          </el-button>
        </span>
      </el-tooltip>
      <el-button
        v-else
        v-bind="buttonProps(btn)"
        :icon="resolveButtonIcon(btn)"
        :size="size"
        @click="onButtonClick(btn, index)"
      >
        {{ showButtonLabel(btn) ? btn.label : undefined }}
      </el-button>
    </template>

    <el-dropdown
      v-if="overflowButtons.length"
      class="action-buttons__more"
      :trigger="moreTrigger"
      :teleported="teleported"
      @command="onDropdownCommand"
    >
      <span class="action-buttons__more-icon" role="button" tabindex="-1">
        <span class="action-buttons__more-dots" aria-hidden="true"><i /><i /><i /></span>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="(btn, index) in overflowButtons"
            :key="buttonKey(btn, index, 'overflow')"
            :command="buttonKey(btn, index, 'overflow')"
            :disabled="resolveBool(btn.disabled)"
            :divided="btn.divided"
            :style="itemColorStyle(btn)"
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
import type {
  ActionButtonItem,
  ActionButtonType,
  ActionButtonsProps
} from "./types";
import { filterVisibleButtons, resolveBool } from "./utils";

defineOptions({ name: "ActionButtons" });

const props = withDefaults(defineProps<ActionButtonsProps>(), {
  max: 0,
  size: "small",
  moreTrigger: "hover",
  link: true,
  showIcon: false,
  gap: 4,
  teleported: true
});

const emit = defineEmits<{
  action: [payload: { key: string; item: ActionButtonItem; index: number }];
}>();

const visibleButtons = computed(() => filterVisibleButtons(props.buttons));

const primaryButtons = computed(() => {
  const list = visibleButtons.value;
  if (!props.max || list.length <= props.max) return list;
  return list.slice(0, props.max);
});

const overflowButtons = computed(() => {
  const list = visibleButtons.value;
  if (!props.max || list.length <= props.max) return [];
  return list.slice(props.max);
});

const rootStyle = computed(() => ({
  "--action-buttons-gap": `${props.gap}px`
}));

function buttonKey(btn: ActionButtonItem, index: number, prefix = "primary") {
  return btn.key || `${prefix}-${index}-${btn.label}`;
}

function isIconOnly(btn: ActionButtonItem): boolean {
  if (btn.showIcon === false) return false;
  const iconMode = btn.showIcon === true || props.showIcon;
  return iconMode && Boolean(btn.icon);
}

function buttonTooltip(btn: ActionButtonItem): string | undefined {
  if (resolveBool(btn.disabled) && btn.disabledTooltip) {
    return btn.disabledTooltip;
  }
  if (btn.tooltip) return btn.tooltip;
  if (isIconOnly(btn)) return btn.label;
  return undefined;
}

function showButtonLabel(btn: ActionButtonItem): boolean {
  if (isIconOnly(btn)) return false;
  const isLink = btn.link ?? props.link;
  return !isLink || !btn.icon;
}

function resolveButtonIcon(btn: ActionButtonItem) {
  if (typeof btn.icon === "string") return undefined;
  if (isIconOnly(btn) || btn.icon) return btn.icon;
  return undefined;
}

const TYPE_COLOR_MAP: Partial<Record<ActionButtonType, string>> = {
  primary: "var(--el-color-primary)",
  success: "var(--el-color-success)",
  warning: "var(--el-color-warning)",
  danger: "var(--el-color-danger)",
  info: "var(--el-color-info)"
};

const DANGER_ACTION_LABELS = new Set(["删除", "移除", "清除", "下架"]);

function isDangerAction(btn: ActionButtonItem): boolean {
  if (btn.type === "danger") return true;
  return DANGER_ACTION_LABELS.has(btn.label.trim());
}

function resolveActionType(btn: ActionButtonItem): ActionButtonType {
  if (isDangerAction(btn)) return "danger";
  if (!btn.type || btn.type === "default") return "primary";
  if (
    btn.type === "warning" ||
    btn.type === "success" ||
    btn.type === "info" ||
    btn.type === "danger"
  ) {
    return btn.type;
  }
  return "primary";
}

function buttonProps(btn: ActionButtonItem) {
  const isLink = btn.link ?? props.link;
  const disabled = resolveBool(btn.disabled);
  const hasCustomColor = Boolean(btn.color) && !disabled;
  const type = !hasCustomColor && !disabled ? resolveActionType(btn) : undefined;
  const style = resolveColorStyle(btn, isLink, disabled);
  return {
    type: hasCustomColor ? undefined : type,
    plain: btn.plain,
    link: isLink,
    disabled,
    style
  };
}

function resolveButtonColor(btn: ActionButtonItem): string {
  if (btn.color) return btn.color;
  const semanticType = resolveActionType(btn);
  return TYPE_COLOR_MAP[semanticType] ?? "var(--el-color-primary)";
}

const DISABLED_ACTION_COLOR = "var(--el-text-color-disabled)";

function resolveColorStyle(
  btn: ActionButtonItem,
  isLink: boolean,
  disabled = resolveBool(btn.disabled)
): Record<string, string> | undefined {
  if (disabled) {
    if (!isLink) return { color: DISABLED_ACTION_COLOR };
    return linkColorVars(DISABLED_ACTION_COLOR, true);
  }
  if (!isLink) {
    if (btn.color) return { color: btn.color };
    return undefined;
  }
  return linkColorVars(resolveButtonColor(btn));
}

function linkColorVars(color: string, isDisabled = false): Record<string, string> {
  if (isDisabled) {
    return {
      color: DISABLED_ACTION_COLOR,
      "--el-button-hover-link-text-color": DISABLED_ACTION_COLOR,
      "--el-button-active-color": DISABLED_ACTION_COLOR
    };
  }
  return {
    color,
    "--el-button-hover-link-text-color": color,
    "--el-button-active-color": color
  };
}

function itemColorStyle(btn: ActionButtonItem): Record<string, string> | undefined {
  if (resolveBool(btn.disabled)) {
    return { color: DISABLED_ACTION_COLOR };
  }
  if (btn.color) return { color: btn.color };
  return { color: resolveButtonColor(btn) };
}

function onButtonClick(btn: ActionButtonItem, index: number) {
  if (resolveBool(btn.disabled)) return;
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
.action-buttons {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  gap: var(--action-buttons-gap, 4px);
  overflow: visible;
}

.action-buttons__tooltip-trigger {
  display: inline-flex;
  vertical-align: middle;
}

.action-buttons__tooltip-trigger.is-disabled-trigger {
  cursor: not-allowed;
}

.action-buttons__tooltip-trigger.is-disabled-trigger :deep(.el-button) {
  pointer-events: none;
}

.action-buttons__more {
  flex-shrink: 0;
}

.action-buttons__more-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  line-height: 1;
  outline: none;
  flex-shrink: 0;

  &:hover,
  &:focus,
  &:focus-visible {
    color: var(--el-color-primary);
  }
}

.action-buttons__more-dots {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  vertical-align: middle;
  flex-shrink: 0;

  i {
    display: block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
}

.action-buttons.is-link {
  gap: 2px;

  :deep(.el-button.is-link) {
    font-size: 14px;
    font-weight: 400;
  }

  :deep(.el-button.is-link.is-disabled),
  :deep(.el-button.is-link.is-disabled:hover),
  :deep(.el-button.is-link.is-disabled:focus-visible) {
    color: var(--el-text-color-disabled) !important;
    --el-button-hover-link-text-color: var(--el-text-color-disabled);
    --el-button-active-color: var(--el-text-color-disabled);
    text-decoration: none;
    opacity: 1;
  }

  :deep(.el-button.is-link:hover:not(.is-disabled)),
  :deep(.el-button.is-link:focus-visible:not(.is-disabled)) {
    text-decoration: underline;
    text-underline-offset: 2px;
    color: var(--el-button-hover-link-text-color);
  }
}

.action-buttons.is-icon.is-link {
  :deep(.el-button.is-link:hover:not(.is-disabled)),
  :deep(.el-button.is-link:focus-visible:not(.is-disabled)) {
    text-decoration: none;
  }
}
</style>
