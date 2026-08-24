<script setup lang="ts">
type ListItem = {
  name: string
  url: string
}

defineProps<{
  items: ListItem[]
}>()
</script>

<template>
  <SchemaOrgItemList
    v-if="items.length"
    :item-list-element="
      items.map((item) => ({
        name: item.name,
        item: item.url,
      }))
    "
  />
</template>
