<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  DEFAULT_LOCALES,
  localeLabel,
  localeTextMaxLength,
  type LocaleTextEntry
} from "@/utils/locale";

const props = withDefaults(
  defineProps<{
    modelValue: LocaleTextEntry[];
    /** 字段文案，如「名称」「标题」 */
    fieldLabel?: string;
  }>(),
  {
    fieldLabel: "名"
  }
);

const emit = defineEmits<{
  "update:modelValue": [LocaleTextEntry[]];
}>();

const activeTab = ref(props.modelValue[0]?.locale || "zh");

watch(
  () => props.modelValue.map(e => e.locale).join(","),
  () => {
    if (!props.modelValue.some(e => e.locale === activeTab.value)) {
      activeTab.value = props.modelValue[0]?.locale || "zh";
    }
  }
);

const entries = computed({
  get: () => props.modelValue,
  set: (val: LocaleTextEntry[]) => emit("update:modelValue", val)
});
</script>

<template>
  <div class="i18n-text-editor">
    <el-tabs v-model="activeTab" type="card" class="i18n-tabs">
      <el-tab-pane
        v-for="entry in entries"
        :key="entry.locale"
        :name="entry.locale"
        :label="localeLabel(entry.locale)"
      >
        <el-form-item
          :label="`${localeLabel(entry.locale)}${fieldLabel}`"
          :required="(DEFAULT_LOCALES as readonly string[]).includes(entry.locale)"
        >
          <el-input
            v-model="entry.text"
            :maxlength="localeTextMaxLength(entry.locale)"
            show-word-limit
            :placeholder="`请输入${localeLabel(entry.locale)}${fieldLabel}`"
          />
        </el-form-item>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.i18n-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
</style>
