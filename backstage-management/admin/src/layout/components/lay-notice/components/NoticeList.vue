<script setup lang="ts">
import { PropType } from "vue";
import { ListItem } from "../data";
import NoticeItem from "./NoticeItem.vue";

defineProps({
  list: {
    type: Array as PropType<Array<ListItem>>,
    default: () => []
  },
  emptyText: {
    type: String,
    default: ""
  },
  moreText: {
    type: String,
    default: ""
  }
});

const emit = defineEmits<{
  (e: "open", item: ListItem): void;
  (e: "more"): void;
}>();
</script>

<template>
  <div v-if="list.length">
    <NoticeItem
      v-for="(item, index) in list"
      :key="index"
      :noticeItem="item"
      @open="emit('open', $event)"
    />
    <button v-if="moreText" class="notice-more" type="button" @click="emit('more')">
      {{ moreText }}
    </button>
  </div>
  <el-empty v-else :description="emptyText" />
</template>

<style scoped>
.notice-more {
  display: block;
  width: 100%;
  padding: 10px 0 16px;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 13px;
  cursor: pointer;
}
</style>
