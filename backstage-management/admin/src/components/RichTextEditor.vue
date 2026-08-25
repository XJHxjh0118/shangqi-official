<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css";
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { createEditor, createToolbar } from "@wangeditor/editor";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { ElMessage } from "element-plus";
import { uploadAsset } from "@/api/asset";

defineOptions({ name: "RichTextEditor" });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    height?: number;
  }>(),
  {
    modelValue: "",
    placeholder: "请输入正文",
    height: 360
  }
);

const emit = defineEmits<{
  "update:modelValue": [string];
}>();

const uid = `rich-text-${Math.random().toString(36).slice(2, 10)}`;
const toolbarId = `${uid}-toolbar`;
const editorId = `${uid}-editor`;
let editor: IDomEditor | null = null;
let syncing = false;
let bootstrapped = false;

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    "group-video",
    "emotion",
    "codeBlock",
    "code",
    "todo",
    "fullScreen",
    "insertTable",
    "group-table"
  ]
};

function toStorageUrl(url?: string | null) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith("/uploads")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* keep original */
  }
  return url;
}

function destroyEditor() {
  editor?.destroy();
  editor = null;
  bootstrapped = false;
}

function create() {
  destroyEditor();

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: props.placeholder,
    MENU_CONF: {
      uploadImage: {
        allowedFileTypes: ["image/*"],
        maxFileSize: 10 * 1024 * 1024,
        async customUpload(
          file: File,
          insertFn: (url: string, alt: string, href: string) => void
        ) {
          try {
            const res = await uploadAsset(file);
            const url = toStorageUrl(res.data?.url || res.data?.thumbnailUrl);
            if (!url) {
              ElMessage.error("图片上传失败");
              return;
            }
            insertFn(url, file.name, url);
          } catch {
            ElMessage.error("图片上传失败");
          }
        }
      }
    },
    onChange(instance) {
      if (syncing) return;
      if (!bootstrapped) {
        bootstrapped = true;
        return;
      }
      emit("update:modelValue", instance.getHtml());
    }
  };

  editor = createEditor({
    selector: `#${editorId}`,
    html: props.modelValue || "",
    config: editorConfig,
    mode: "default"
  });
  createToolbar({
    editor,
    selector: `#${toolbarId}`,
    config: toolbarConfig,
    mode: "default"
  });
}

watch(
  () => props.modelValue,
  html => {
    if (!editor) return;
    const next = html || "";
    if (editor.getHtml() === next) return;
    syncing = true;
    editor.setHtml(next);
    syncing = false;
  }
);

onMounted(() => nextTick(create));
onBeforeUnmount(destroyEditor);
</script>

<template>
  <div class="rich-text-editor">
    <div :id="toolbarId" class="rich-text-editor__toolbar" />
    <div
      :id="editorId"
      class="rich-text-editor__body"
      :style="{ height: `${height}px` }"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: #fff;
}

.rich-text-editor__toolbar {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rich-text-editor__body {
  overflow-y: hidden;
}

.rich-text-editor :deep(.w-e-text-container) {
  height: 100% !important;
  background: #fff;
}

.rich-text-editor :deep(.w-e-text-placeholder) {
  font-style: normal;
  color: var(--el-text-color-placeholder);
}
</style>
