<script setup lang="ts">
const props = defineProps<{
  name: string
  sku: string
  description: string
  image?: string
}>()

useGeoCurrentName(() => props.name)
</script>

<template>
  <SchemaOrgProduct
    :name="name"
    :sku="sku"
    :description="description"
    :image="image"
  />
</template>
