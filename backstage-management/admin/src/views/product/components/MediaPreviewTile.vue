<script setup lang="ts">
import { computed, ref } from "vue";
import ZoomIn from "~icons/ep/zoom-in";
import VideoPlay from "~icons/ep/video-play";
import Delete from "~icons/ep/delete";

defineOptions({ name: "MediaPreviewTile" });

const props = withDefaults(
  defineProps<{
    src: string;
    type?: "image" | "video";
    badge?: string;
    name?: string;
    width?: number;
    height?: number;
    previewList?: string[];
    previewIndex?: number;
    showName?: boolean;
    showBadge?: boolean;
    deletable?: boolean;
    previewable?: boolean;
    embedded?: boolean;
  }>(),
  {
    type: "image",
    width: 104,
    height: 104,
    previewIndex: 0,
    showName: true,
    showBadge: true,
    deletable: true,
    previewable: true,
    embedded: false
  }
);

const emit = defineEmits<{
  remove: [];
}>();

const previewImageRef = ref<{
  $el?: HTMLElement;
} | null>(null);
const videoDialogVisible = ref(false);

const frameStyle = computed(() => {
  if (props.embedded) {
    return { width: "100%", height: "100%" };
  }
  return {
    width: `${props.width}px`,
    height: `${props.height}px`
  };
});

const imagePreviewList = computed(() => {
  if (props.previewList?.length) return props.previewList;
  return props.src ? [props.src] : [];
});

function openImagePreview() {
  const inner = previewImageRef.value?.$el?.querySelector(
    ".el-image__inner"
  ) as HTMLElement | null;
  inner?.click();
}

function openPreview() {
  if (!props.previewable || !props.src) return;
  if (props.type === "video") {
    videoDialogVisible.value = true;
    return;
  }
  openImagePreview();
}

function onRemove() {
  emit("remove");
}
</script>

<template>
  <div
    class="media-preview-tile"
    :class="{ 'is-embedded': embedded }"
    :style="embedded ? undefined : { width: `${width}px` }"
  >
    <div
      class="media-preview-tile__frame"
      :class="{ 'is-embedded': embedded }"
      :style="frameStyle"
    >
      <img
        v-if="type === 'image'"
        :src="src"
        class="media-preview-tile__media"
        alt=""
      />
      <video
        v-else
        class="media-preview-tile__media"
        preload="metadata"
        muted
        playsinline
        :src="src"
      />

      <div class="media-preview-tile__overlay">
        <button
          v-if="previewable"
          type="button"
          class="media-preview-tile__action"
          :title="type === 'video' ? '播放' : '放大'"
          :aria-label="type === 'video' ? '播放' : '放大'"
          @click.stop="openPreview"
        >
          <IconifyIconOffline
            :icon="type === 'video' ? VideoPlay : ZoomIn"
            class="media-preview-tile__icon"
          />
        </button>
        <button
          v-if="deletable"
          type="button"
          class="media-preview-tile__action media-preview-tile__action--danger"
          title="删除"
          aria-label="删除"
          @click.stop="onRemove"
        >
          <IconifyIconOffline :icon="Delete" class="media-preview-tile__icon" />
        </button>
      </div>

      <span v-if="showBadge && badge" class="media-preview-tile__badge">
        {{ badge }}
      </span>

      <el-image
        v-if="type === 'image' && previewable"
        ref="previewImageRef"
        class="media-preview-tile__preview-proxy"
        :src="src"
        :preview-src-list="imagePreviewList"
        :initial-index="previewIndex"
        fit="cover"
        preview-teleported
      />
    </div>

    <p
      v-if="showName && name"
      class="media-preview-tile__name"
      :title="name"
    >
      {{ name }}
    </p>

    <div v-if="$slots.actions" class="media-preview-tile__actions">
      <slot name="actions" />
    </div>

    <el-dialog
      v-if="type === 'video'"
      v-model="videoDialogVisible"
      :title="name || '视频预览'"
      width="min(92vw, 860px)"
      append-to-body
      destroy-on-close
      class="media-preview-tile__video-dialog"
      @click.stop
    >
      <video
        v-if="videoDialogVisible"
        class="media-preview-tile__player"
        :src="src"
        controls
        autoplay
        playsinline
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.media-preview-tile {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
}

.media-preview-tile.is-embedded {
  width: 100%;
  height: 100%;
}

.media-preview-tile__frame.is-embedded {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
  background: transparent;
}

.media-preview-tile__frame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: #111;
}

.media-preview-tile__media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-preview-tile__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  background: rgba(0, 0, 0, 0.45);
  transition: opacity 0.18s ease;
}

.media-preview-tile__frame:hover .media-preview-tile__overlay,
.media-preview-tile__frame:focus-within .media-preview-tile__overlay {
  opacity: 1;
}

.media-preview-tile__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.media-preview-tile__action:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: scale(1.05);
}

.media-preview-tile__action--danger:hover {
  background: rgba(245, 108, 108, 0.85);
}

.media-preview-tile__icon {
  font-size: 16px;
}

.media-preview-tile__badge {
  position: absolute;
  left: 4px;
  top: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: none;
}

.media-preview-tile__preview-proxy {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.media-preview-tile__name {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-preview-tile__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 2px;
}

.media-preview-tile__player {
  display: block;
  width: 100%;
  max-height: min(70vh, 520px);
  background: #000;
  border-radius: 6px;
}
</style>
