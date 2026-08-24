<template>
  <div class="sf-actions" :class="actionClass">
    <div class="sf-actions__left">
      <slot name="actions-prefix" />
      <el-button
        v-if="expandable"
        link
        type="primary"
        class="sf-expand-btn"
        @click="emit('toggle-expand')"
      >
        {{ expanded ? collapseText : expandText }}
        <el-icon class="sf-expand-icon" :class="{ 'is-expanded': expanded }">
          <ArrowDown />
        </el-icon>
      </el-button>
      <slot
        name="actions"
        :model="model"
        :search="() => emit('search')"
        :reset="() => emit('reset')"
      />
      <slot name="actions-suffix" />
    </div>
    <div class="sf-actions__right">
      <template v-if="showActions">
        <el-button
          type="primary"
          class="sf-search-btn"
          :loading="loading"
          :disabled="loading || searchDisabled"
          @click="emit('search')"
        >
          {{ queryText }}
        </el-button>
        <el-tooltip :content="resetText" placement="top">
          <el-button class="sf-icon-btn" @click="emit('reset')">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
      <slot name="actions-right" :model="model" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ArrowDown from "~icons/ep/arrow-down";
import RefreshRight from "~icons/ep/refresh-right";

defineProps<{
  actionClass?: string | Record<string, boolean>;
  expandable?: boolean;
  expanded?: boolean;
  expandText?: string;
  collapseText?: string;
  showActions?: boolean;
  loading?: boolean;
  searchDisabled?: boolean;
  queryText?: string;
  resetText?: string;
  model?: Record<string, unknown>;
}>();

const emit = defineEmits<{
  search: [];
  reset: [];
  "toggle-expand": [];
}>();
</script>

<style scoped lang="scss">
.sf-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);

  &--flow,
  &--inline,
  &--block {
    margin-left: auto;
    flex: 0 0 auto;
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    align-items: center;
    align-self: flex-end;

    .sf-actions__left:empty {
      display: none;
    }

    .sf-actions__left {
      flex: 0 0 auto;
      min-width: 0;
    }

    .sf-actions__right {
      margin-left: 0;
    }
  }

  :deep(.sf-search-btn.el-button) {
    min-height: 32px;
    height: 32px;
    padding: 0 16px;
    font-size: 14px;
    border-radius: 4px;
  }

  :deep(.sf-icon-btn.el-button) {
    min-width: 32px;
    width: 32px;
    min-height: 32px;
    height: 32px;
    padding: 0;
    font-size: 16px;
    border-radius: 4px;
  }

  :deep(.sf-expand-btn.el-button) {
    padding-left: 4px;
    padding-right: 4px;
    height: 32px;
  }
}

.sf-actions__left {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  flex: 0 1 auto;
  min-width: 0;
}

.sf-actions__right {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  flex-shrink: 0;
  margin-left: auto;
}

.sf-expand-icon {
  margin-left: 2px;
  transition: transform 0.2s;

  &.is-expanded {
    transform: rotate(180deg);
  }
}
</style>
