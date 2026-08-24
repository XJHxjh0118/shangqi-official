<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getProduct } from "@/api/product";
import { localeLabel, productI18nName } from "@/utils/locale";
import { parseTime } from "@/components/ToolbarTable/parseTime";

defineOptions({ name: "ProductDetailDrawer" });

const props = defineProps<{
  modelValue: boolean;
  productId?: number | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const loading = ref(false);
const detail = ref<any>(null);
const localeTab = ref("zh");

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档"
};

function statusTagType(status: string) {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED") return "info";
  return "warning";
}

function toDisplayUrl(url?: string | null) {
  if (!url) return "";
  try {
    const u = new URL(url, window.location.origin);
    if (u.pathname.startsWith("/uploads")) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* ignore */
  }
  return url || "";
}

function vehicleLabel(row: any) {
  const year =
    row.yearFrom && row.yearTo
      ? `${row.yearFrom}-${row.yearTo}`
      : row.yearFrom || row.yearTo || "";
  return `${row.brandZh} ${row.modelZh}${year ? ` (${year})` : ""}`;
}

function categoryPath(row: any) {
  const category = row?.category;
  if (!category) return "—";
  if (category.parent?.nameZh) {
    return `${category.parent.nameZh} / ${category.nameZh}`;
  }
  return category.nameZh || "—";
}

const i18nEntries = computed(() => {
  const i18n = detail.value?.i18n;
  if (!i18n) return [];
  if (Array.isArray(i18n)) return i18n;
  return Object.entries(i18n).map(([locale, val]: [string, any]) => ({
    locale,
    ...(val || {})
  }));
});

const activeI18n = computed(
  () =>
    i18nEntries.value.find((item: any) => item.locale === localeTab.value) ||
    i18nEntries.value[0]
);

const materials = computed(() => detail.value?.materials || []);
const manuals = computed(() => detail.value?.manuals || []);
const assetPacks = computed(() => detail.value?.assetPacks || []);
const vehicles = computed(() => detail.value?.vehicles || []);

watch(
  () => [props.modelValue, props.productId] as const,
  async ([open, id]) => {
    if (!open || !id) return;
    loading.value = true;
    try {
      const res = await getProduct(id);
      detail.value = res.data;
      localeTab.value = "zh";
    } catch {
      detail.value = null;
    } finally {
      loading.value = false;
    }
  }
);
</script>

<template>
  <el-drawer
    v-model="visible"
    title="产品详情"
    size="560px"
    append-to-body
    destroy-on-close
    class="product-detail-drawer"
  >
    <div v-loading="loading" class="detail-body">
      <template v-if="detail">
        <div class="hero">
          <el-image
            v-if="detail.cover?.url"
            :src="toDisplayUrl(detail.cover.url)"
            fit="cover"
            class="hero-cover"
            :preview-src-list="[toDisplayUrl(detail.cover.url)]"
            preview-teleported
          />
          <div v-else class="hero-cover is-empty">暂无封面</div>
          <div class="hero-meta">
            <p class="hero-sku">{{ detail.sku }}</p>
            <h3 class="hero-name">{{ productI18nName(detail) }}</h3>
            <div class="hero-tags">
              <el-tag :type="statusTagType(detail.status)" size="small">
                {{ statusLabel[detail.status] || detail.status }}
              </el-tag>
              <el-tag v-if="detail.isNew" size="small">新品</el-tag>
              <el-tag v-if="detail.isHot" size="small" type="danger">热销</el-tag>
              <el-tag v-if="detail.isFeatured" size="small" type="warning">
                主推
              </el-tag>
            </div>
          </div>
        </div>

        <el-descriptions :column="1" border class="block">
          <el-descriptions-item label="Slug">
            {{ detail.slug || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="分类">
            {{ categoryPath(detail) }}
          </el-descriptions-item>
          <el-descriptions-item label="规格标签">
            {{ detail.installLevel || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="适配车型">
            <template v-if="vehicles.length">
              <el-tag
                v-for="item in vehicles"
                :key="item.id"
                size="small"
                class="mr-1 mb-1"
                effect="plain"
              >
                {{ vehicleLabel(item) }}
              </el-tag>
            </template>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="前台路径">
            /products/{{ detail.slug }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ parseTime(detail.createdAt) || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ parseTime(detail.updatedAt) || "—" }}
          </el-descriptions-item>
        </el-descriptions>

        <p class="section-title">多语言内容</p>
        <el-tabs v-model="localeTab" type="card" class="locale-tabs">
          <el-tab-pane
            v-for="entry in i18nEntries"
            :key="entry.locale"
            :name="entry.locale"
            :label="localeLabel(entry.locale)"
          />
        </el-tabs>
        <el-descriptions :column="1" border class="block">
          <el-descriptions-item label="名称">
            {{ activeI18n?.name || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            <p class="multiline">{{ activeI18n?.description || "—" }}</p>
          </el-descriptions-item>
          <el-descriptions-item label="材质">
            {{ activeI18n?.material || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="尺寸">
            {{ activeI18n?.size || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="颜色">
            {{ activeI18n?.color || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="SEO 标题">
            {{ activeI18n?.seoTitle || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="SEO 关键词">
            {{ activeI18n?.seoKeywords || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="SEO 描述">
            <p class="multiline">{{ activeI18n?.seoDescription || "—" }}</p>
          </el-descriptions-item>
        </el-descriptions>

        <p class="section-title">媒体与素材</p>
        <div class="media-section">
          <div class="media-row">
            <div class="media-item">
              <span class="media-label">宣传视频</span>
              <video
                v-if="detail.promoVideo?.url"
                class="media-video"
                controls
                preload="metadata"
                :src="toDisplayUrl(detail.promoVideo.url)"
              />
              <div v-else class="media-empty">未上传</div>
            </div>
            <div class="media-item">
              <span class="media-label">安装示范</span>
              <video
                v-if="detail.installVideo?.url"
                class="media-video"
                controls
                preload="metadata"
                :src="toDisplayUrl(detail.installVideo.url)"
              />
              <div v-else class="media-empty">未上传</div>
            </div>
          </div>

          <div class="media-block">
            <span class="media-label">产品图</span>
            <div v-if="materials.length" class="thumb-grid">
              <el-image
                v-for="item in materials"
                :key="item.id || item.url"
                :src="toDisplayUrl(item.thumbnailUrl || item.url)"
                fit="cover"
                class="thumb"
                :preview-src-list="
                  materials.map((a: any) => toDisplayUrl(a.url || a.thumbnailUrl))
                "
                preview-teleported
              />
            </div>
            <div v-else class="media-empty">未上传</div>
          </div>

          <div class="media-block">
            <span class="media-label">说明书</span>
            <div v-if="manuals.length" class="file-list">
              <a
                v-for="item in manuals"
                :key="item.id || item.url"
                class="file-link"
                :href="toDisplayUrl(item.url)"
                target="_blank"
                rel="noopener"
              >
                {{ item.name || "说明书.pdf" }}
              </a>
            </div>
            <div v-else class="media-empty">未上传</div>
          </div>

          <div class="media-block">
            <span class="media-label">素材包</span>
            <div v-if="assetPacks.length" class="file-list">
              <a
                v-for="item in assetPacks"
                :key="item.id || item.url"
                class="file-link"
                :href="toDisplayUrl(item.url)"
                target="_blank"
                rel="noopener"
              >
                {{ item.name || "素材包.zip" }}
              </a>
            </div>
            <div v-else class="media-empty">未上传</div>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="未找到产品信息" />
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-body {
  min-height: 240px;
}

.hero {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
}

.hero-cover {
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.hero-cover.is-empty {
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.hero-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.hero-sku {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hero-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.block {
  margin-bottom: 16px;
}

.section-title {
  margin: 4px 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.locale-tabs {
  margin-bottom: 10px;
}

.locale-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.multiline {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
}

.media-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.media-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.media-item,
.media-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.media-video {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  background: #111;
  object-fit: cover;
}

.media-empty {
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.thumb-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-link {
  color: var(--el-color-primary);
  text-decoration: none;
  word-break: break-all;
}

.file-link:hover {
  text-decoration: underline;
}

.mr-1 {
  margin-right: 4px;
}

.mb-1 {
  margin-bottom: 4px;
}
</style>
