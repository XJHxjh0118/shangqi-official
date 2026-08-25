<script setup lang="ts">
import { nextTick, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import {
  HANDLE_METHODS,
  HANDLE_RESULTS,
  type HandleLeadPayload
} from "@/views/lead/handle";

defineOptions({ name: "LeadHandleDialog" });

const props = defineProps<{
  modelValue: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: HandleLeadPayload];
}>();

const formRef = ref<FormInstance>();
const form = reactive<HandleLeadPayload>({
  handleMethod: "",
  handleResult: "",
  handleRemark: ""
});

const rules: FormRules = {
  handleMethod: [{ required: true, message: "请选择处理方式", trigger: "change" }],
  handleResult: [{ required: true, message: "请选择处理结论", trigger: "change" }],
  handleRemark: [
    { required: true, message: "请填写处理说明", trigger: "blur" },
    { min: 2, message: "处理说明至少 2 个字", trigger: "blur" }
  ]
};

const handlerName = () => {
  const user = useUserStoreHook();
  return user.nickname || user.username || "-";
};

watch(
  () => props.modelValue,
  async visible => {
    if (!visible) return;
    Object.assign(form, {
      handleMethod: "",
      handleResult: "",
      handleRemark: ""
    });
    await nextTick();
    formRef.value?.clearValidate();
  }
);

function close() {
  emit("update:modelValue", false);
}

async function submit() {
  await formRef.value?.validate();
  emit("submit", {
    handleMethod: form.handleMethod,
    handleResult: form.handleResult,
    handleRemark: form.handleRemark.trim()
  });
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="处理记录"
    width="560px"
    append-to-body
    @close="close"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="mb-4"
      title="请登记沟通方式和处理结论，填写说明后才会标记为已处理。"
    />
    <slot />
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="96px"
      class="mt-3"
    >
      <el-form-item label="处理人">
        <el-input :model-value="handlerName()" disabled />
      </el-form-item>
      <el-form-item label="处理方式" prop="handleMethod">
        <el-select v-model="form.handleMethod" placeholder="请选择" style="width: 100%">
          <el-option
            v-for="item in HANDLE_METHODS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="处理结论" prop="handleResult">
        <el-select v-model="form.handleResult" placeholder="请选择" style="width: 100%">
          <el-option
            v-for="item in HANDLE_RESULTS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="处理说明" prop="handleRemark">
        <el-input
          v-model="form.handleRemark"
          type="textarea"
          :rows="5"
          maxlength="2000"
          show-word-limit
          placeholder="记录沟通内容、客户意向、下一步安排等"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确认处理</el-button>
    </template>
  </el-dialog>
</template>
