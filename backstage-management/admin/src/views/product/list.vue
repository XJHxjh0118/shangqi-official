<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type UploadRequestOptions } from "element-plus";
import QuestionFilled from "~icons/ep/question-filled";
import {
  batchDeleteProducts,
  batchUpdateProducts,
  createProduct,
  deleteProduct,
  exportProducts,
  getProducts,
  updateProduct
} from "@/api/product";
import { getCategories } from "@/api/category";
import { getVehicles } from "@/api/vehicle";
import { useUserStoreHook } from "@/store/modules/user";
import {
  bindAssets,
  deleteAsset,
  getProductAssets,
  uploadAsset,
  uploadAssetsBatch
} from "@/api/asset";
import {
  DEFAULT_LOCALES,
  ensureDefaultLocales,
  isRequiredLocale,
  localeLabel,
  localeTextMaxLength,
  productI18nName,
  SEO_DESC_MAX,
  SEO_KEYWORDS_MAX,
  seoTitleMaxLength
} from "@/utils/locale";
import { buildProductSlugPreview } from "@/utils/slug";
import ToolbarTable from "@/components/ToolbarTable/index.vue";
import type { ToolbarTableColumn } from "@/components/ToolbarTable/types";
import ActionButtons from "@/components/ActionButtons/index.vue";
import type { ActionButtonItem } from "@/components/ActionButtons/types";
import SearchFilters from "@/components/SearchFilters/index.vue";
import type {
  SearchFilterField,
  SearchFilterTreeOption
} from "@/components/SearchFilters/types";
import ProductDetailDrawer from "./components/ProductDetailDrawer.vue";
import ProductImportDialog from "./components/ProductImportDialog.vue";
import MediaPreviewTile from "./components/MediaPreviewTile.vue";

defineOptions({ name: "ProductList" });

type I18nEntry = {
  locale: string;
  name: string;
  description: string;
  material: string;
  size: string;
  color: string;
  seoTitle: string;
  seoKeywords: string;
  seoDescription: string;
};

function createI18nEntry(locale: string): I18nEntry {
  return {
    locale,
    name: "",
    description: "",
    material: "",
    size: "",
    color: "",
    seoTitle: "",
    seoKeywords: "",
    seoDescription: ""
  };
}

function defaultI18nEntries(): I18nEntry[] {
  return DEFAULT_LOCALES.map(code => createI18nEntry(code));
}

const loading = ref(false);
const exporting = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const categoryTree = ref<any[]>([]);
const vehicleOptions = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const isDealer = computed(() =>
  (useUserStoreHook().roles || []).includes("dealer")
);

/** 树形 cascader：空 children 置为 undefined，避免出现不可选空节点 */
function toCategoryCascaderOptions(nodes: any[] = []): any[] {
  return nodes.map(node => {
    const children = toCategoryCascaderOptions(node.children || []);
    return {
      id: node.id,
      nameZh: `${node.nameZh} (${node.code})`,
      disabled: node.enabled === false,
      ...(children.length ? { children } : {})
    };
  });
}

const categoryCascaderOptions = computed(() =>
  toCategoryCascaderOptions(categoryTree.value)
);

const categoryCascaderProps = {
  value: "id",
  label: "nameZh",
  children: "children",
  emitPath: false,
  checkStrictly: true
};
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const detailVisible = ref(false);
const detailId = ref<number | null>(null);
const editingId = ref<number | null>(null);
const assets = ref<any[]>([]);
const coverUploading = ref(false);
const promoVideoUploading = ref(false);
const installVideoUploading = ref(false);
/** 素材区批量上传中的文件数 / 进度文案 */
const assetBatchPending = ref(0);
const assetBatchUploading = ref(false);
const assetBatchProgress = ref("");
const pendingAssetFiles: File[] = [];
/** 编辑时标记待删除的已入库素材，保存后再调用删除接口 */
const removedAssetIds = ref<number[]>([]);
let assetBatchTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_MANUAL_ASSETS = 3;
const MAX_PACK_ASSETS = 3;

const query = reactive({
  page: 1,
  pageSize: 10
});
const filters = ref<Record<string, unknown>>({
  keyword: "",
  status: "",
  categoryId: undefined
});

function toCategoryFilterOptions(nodes: any[] = []): SearchFilterTreeOption[] {
  return nodes.map(node => ({
    label: node.nameZh,
    value: node.id,
    children: node.children?.length
      ? toCategoryFilterOptions(node.children)
      : undefined
  }));
}

const filterFields = computed<SearchFilterField[]>(() => [
  { prop: "keyword", label: "关键词", placeholder: "SKU / 名称", width: 220 },
  {
    prop: "categoryId",
    label: "分类",
    type: "tree-select",
    placeholder: "全部分类",
    width: 220,
    filterable: true,
    treeOptions: toCategoryFilterOptions(categoryTree.value)
  },
  {
    prop: "status",
    label: "状态",
    type: "select",
    placeholder: "状态",
    width: 140,
    options: [
      { label: "草稿", value: "DRAFT" },
      { label: "已发布", value: "PUBLISHED" },
      { label: "已归档", value: "ARCHIVED" }
    ]
  }
]);

const form = reactive({
  sku: "",
  slug: "",
  categoryId: undefined as number | undefined,
  isNew: false,
  isHot: false,
  isFeatured: false,
  vehicleIds: [] as number[],
  installLevel: "",
  coverUrl: "",
  coverName: "",
  assetPackUrl: "",
  promoVideoUrl: "",
  promoVideoName: "",
  installVideoUrl: "",
  installVideoName: "",
  status: "DRAFT"
});

/** 多语言描述：仅中、英 */
const i18nEntries = ref<I18nEntry[]>(defaultI18nEntries());
const activeLocaleTab = ref("zh");
const seoLocaleTab = ref("zh");

function truncateText(text: string, max: number) {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

const seoPreviewEntry = computed(
  () =>
    i18nEntries.value.find(item => item.locale === seoLocaleTab.value) ||
    i18nEntries.value[0]
);

const seoPreviewTitle = computed(() => {
  const entry = seoPreviewEntry.value;
  return truncateText(
    entry?.seoTitle || entry?.name || "产品标题",
    seoTitleMaxLength(seoLocaleTab.value)
  );
});

const seoPreviewDescription = computed(() => {
  const entry = seoPreviewEntry.value;
  return truncateText(
    entry?.seoDescription ||
      entry?.description ||
      "不填写时将使用产品描述作为搜索摘要",
    SEO_DESC_MAX
  );
});

const seoPreviewPath = computed(() => {
  const slug = editingId.value
    ? form.slug.trim()
    : slugPreview.value || "product-slug";
  return `/products/${slug}`;
});

const slugPreview = computed(() => {
  const enName = i18nEntries.value.find(item => item.locale === "en")?.name || "";
  return buildProductSlugPreview(form.sku, enName);
});

const slugTip =
  "用于官网产品详情页地址，例如 /products/mg4-floor-mat。系统根据 SKU 自动生成并保证唯一，创建后不建议修改。";

/** 把后端绝对地址转成走 Vite 代理的相对路径，便于本地预览 */
function toDisplayUrl(url?: string | null) {
  if (!url) return "";
  try {
    const u = new URL(url, window.location.origin);
    if (u.pathname.startsWith("/uploads")) {
      return `${u.pathname}${u.search}`;
    }
    return url;
  } catch {
    return url;
  }
}

function coverSrc(row: any) {
  return row?.cover?.url || row?.coverUrl || "";
}

async function loadOptions() {
  const [cRes, vRes] = await Promise.all([getCategories(), getVehicles()]);
  categoryTree.value = cRes.data || [];
  vehicleOptions.value = vRes.data || [];
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getProducts({
      page: query.page,
      pageSize: query.pageSize,
      keyword: (filters.value.keyword as string) || undefined,
      status: (filters.value.status as string) || undefined,
      categoryId: (filters.value.categoryId as number) || undefined
    });
    list.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadAssets(productId: number) {
  const res = await getProductAssets(productId);
  const data = res.data;
  if (Array.isArray(data)) {
    assets.value = data;
    return;
  }
  assets.value = [
    ...(data?.materials || []).map((item: any) => ({
      ...item,
      type: item.type || "IMAGE"
    })),
    ...(data?.manuals || []).map((item: any) => ({
      ...item,
      type: item.type || "PDF"
    })),
    ...(data?.assetPacks || []).map((item: any) => ({
      ...item,
      type: item.type || "OTHER"
    }))
  ];
}

function resetForm() {
  editingId.value = null;
  assets.value = [];
  removedAssetIds.value = [];
  pendingAssetFiles.splice(0, pendingAssetFiles.length);
  assetBatchPending.value = 0;
  assetBatchProgress.value = "";
  i18nEntries.value = defaultI18nEntries();
  activeLocaleTab.value = "zh";
  seoLocaleTab.value = "zh";
  Object.assign(form, {
    sku: "",
    slug: "",
    categoryId: undefined,
    isNew: false,
    isHot: false,
    isFeatured: false,
    vehicleIds: [],
    installLevel: "",
    coverUrl: "",
    coverName: "",
    assetPackUrl: "",
    promoVideoUrl: "",
    promoVideoName: "",
    installVideoUrl: "",
    installVideoName: "",
    status: "DRAFT"
  });
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

async function openEdit(row: any) {
  editingId.value = row.id;
  removedAssetIds.value = [];
  const rows: I18nEntry[] = Array.isArray(row.i18n)
    ? row.i18n
    : Object.entries(row.i18n || {}).map(([locale, val]: any) => ({
        locale,
        name: val?.name || "",
        description: val?.description || "",
        material: val?.material || "",
        size: val?.size || "",
        color: val?.color || "",
        seoTitle: val?.seoTitle || "",
        seoKeywords: val?.seoKeywords || "",
        seoDescription: val?.seoDescription || ""
      }));
  i18nEntries.value = ensureDefaultLocales(
    rows.map((i: any) => ({
      locale: i.locale,
      name: i.name || "",
      description: i.description || "",
      material: i.material || "",
      size: i.size || "",
      color: i.color || "",
      seoTitle: i.seoTitle || "",
      seoKeywords: i.seoKeywords || "",
      seoDescription: i.seoDescription || ""
    })),
    createI18nEntry
  );
  activeLocaleTab.value = "zh";
  seoLocaleTab.value = "zh";
  Object.assign(form, {
    sku: row.sku,
    slug: row.slug,
    categoryId: row.categoryId,
    isNew: row.isNew,
    isHot: row.isHot,
    isFeatured: row.isFeatured,
    vehicleIds: (row.vehicles || []).map(
      (v: any) => v.vehicleId || v.vehicle?.id || v.id
    ),
    installLevel: row.installLevel || "",
    coverUrl: row.cover?.url || "",
    coverName: row.cover?.name || "",
    assetPackUrl: row.assetPacks?.[0]?.url || "",
    promoVideoUrl: row.promoVideo?.url || "",
    promoVideoName: row.promoVideo?.name || "",
    installVideoUrl: row.installVideo?.url || "",
    installVideoName: row.installVideo?.name || "",
    status: row.status
  });
  dialogVisible.value = true;
  await loadAssets(row.id);
}

function buildPayload() {
  const payload: Record<string, unknown> = {
    sku: form.sku,
    categoryId: form.categoryId,
    isNew: form.isNew,
    isHot: form.isHot,
    isFeatured: form.isFeatured,
    vehicleIds: form.vehicleIds,
    installLevel: form.installLevel || undefined,
    coverUrl: form.coverUrl || null,
    coverName: form.coverName || null,
    assetPackUrl: form.assetPackUrl || null,
    promoVideoUrl: form.promoVideoUrl || null,
    promoVideoName: form.promoVideoName || null,
    installVideoUrl: form.installVideoUrl || null,
    installVideoName: form.installVideoName || null,
    status: form.status,
    i18n: i18nEntries.value.map(e => ({
      locale: e.locale,
      name: e.name.trim(),
      description: e.description.trim(),
      material: e.material.trim() || undefined,
      size: e.size.trim() || undefined,
      color: e.color.trim() || undefined,
      seoTitle: e.seoTitle.trim() || undefined,
      seoKeywords: e.seoKeywords.trim() || undefined,
      seoDescription: e.seoDescription.trim() || undefined
    }))
  };
  return payload;
}

async function submit() {
  if (!form.sku?.trim()) {
    ElMessage.warning("请填写 SKU");
    return;
  }
  if (!form.categoryId) {
    ElMessage.warning("请选择分类");
    return;
  }
  const zhEntry = i18nEntries.value.find(e => e.locale === "zh");
  if (!zhEntry?.name?.trim()) {
    activeLocaleTab.value = "zh";
    ElMessage.warning("请填写中文名");
    return;
  }
  const enEntry = i18nEntries.value.find(e => e.locale === "en");
  if (!enEntry?.name?.trim()) {
    activeLocaleTab.value = "en";
    ElMessage.warning("请填写英文名");
    return;
  }
  const payload = buildPayload();
  payload.i18n = payload.i18n.filter((e: { locale: string }) =>
    isRequiredLocale(e.locale)
  );
  if (editingId.value) {
    const productId = editingId.value;
    await updateProduct(productId, payload);

    if (removedAssetIds.value.length) {
      await Promise.all(
        removedAssetIds.value.map(assetId => deleteAsset(assetId))
      );
    }

    const pending = assets.value.filter((a: any) => a._pending);
    if (pending.length) {
      await bindAssets(
        productId,
        pending.map((a: any, i: number) => ({
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
          originalUrl: a.originalUrl,
          type: a.type,
          name: a.name,
          size: a.size,
          sort: i
        }))
      );
    }

    removedAssetIds.value = [];
    ElMessage.success("更新成功");
    dialogVisible.value = false;
  } else {
    const res = await createProduct(payload);
    const created = res.data;
    if (!created?.id) {
      ElMessage.success("创建成功");
      dialogVisible.value = false;
      fetchList();
      return;
    }
    editingId.value = created.id;
    const pending = assets.value.filter((a: any) => a._pending);
    if (pending.length) {
      await bindAssets(
        created.id,
        pending.map((a: any, i: number) => ({
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
          originalUrl: a.originalUrl,
          type: a.type,
          name: a.name,
          size: a.size,
          sort: i
        }))
      );
      const extra: Record<string, string> = {};
      if (!form.coverUrl) {
        const firstImage = pending.find((a: any) => a.type === "IMAGE");
        if (firstImage?.url) {
          form.coverUrl = firstImage.url;
          form.coverName = firstImage.name || "";
          extra.coverUrl = firstImage.url;
          extra.coverName = firstImage.name || "";
        }
      }
      const firstPack = pending.find((a: any) => isPackAsset(a));
      if (firstPack?.url) {
        form.assetPackUrl = firstPack.url;
        extra.assetPackUrl = firstPack.url;
      }
      if (Object.keys(extra).length) {
        await updateProduct(created.id, extra);
      }
    }
    await loadAssets(created.id);
    ElMessage.success("创建成功，素材已关联");
  }
  fetchList();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除产品 ${row.sku}？`, "提示", {
    type: "warning"
  });
  await deleteProduct(row.id);
  ElMessage.success("已删除");
  fetchList();
}

function i18nName(row: any) {
  return productI18nName(row);
}

function categoryPath(row: any) {
  const category = row.category;
  if (!category) return "—";
  if (category.parent?.nameZh) {
    return `${category.parent.nameZh} / ${category.nameZh}`;
  }
  return category.nameZh;
}

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

const tableColumns = computed<ToolbarTableColumn[]>(() => [
  ...(isDealer.value
    ? []
    : [{ type: "selection" as const, selectionWidth: 48, reserveSelection: true }]),
  { prop: "coverUrl", label: "封面", width: 90, slot: true, toggleable: false },
  { prop: "sku", label: "SKU", minWidth: 140 },
  { prop: "name", label: "名称", minWidth: 160, slot: true },
  { prop: "category", label: "分类", minWidth: 160, slot: true },
  { prop: "tags", label: "标签", width: 120, slot: true },
  { prop: "status", label: "状态", width: 110, slot: true }
]);

function beforeImageUpload(file: File) {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.warning("只能上传图片文件");
    return false;
  }
  const maxMb = 20;
  if (file.size > maxMb * 1024 * 1024) {
    ElMessage.warning(`图片大小不能超过 ${maxMb}MB`);
    return false;
  }
  return true;
}

function beforeManualUpload(file: File) {
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  if (!isPdf) {
    ElMessage.warning("说明书请上传 PDF 文件");
    return false;
  }
  const maxMb = 30;
  if (file.size > maxMb * 1024 * 1024) {
    ElMessage.warning(`「${file.name}」超过 ${maxMb}MB 限制`);
    return false;
  }
  return true;
}

function beforePackUpload(file: File) {
  const name = file.name.toLowerCase();
  const ok =
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    name.endsWith(".zip");
  if (!ok) {
    ElMessage.warning("素材包请上传 ZIP 文件");
    return false;
  }
  const maxMb = 50;
  if (file.size > maxMb * 1024 * 1024) {
    ElMessage.warning(`素材包大小不能超过 ${maxMb}MB`);
    return false;
  }
  return true;
}

function beforeVideoUpload(file: File) {
  const name = file.name.toLowerCase();
  const ok =
    file.type.startsWith("video/") ||
    [".mp4", ".webm", ".mov", ".m4v"].some((ext) => name.endsWith(ext));
  if (!ok) {
    ElMessage.warning("请上传视频文件（mp4 / webm / mov）");
    return false;
  }
  const maxMb = 50;
  if (file.size > maxMb * 1024 * 1024) {
    ElMessage.warning(`视频大小不能超过 ${maxMb}MB`);
    return false;
  }
  return true;
}

async function uploadCover(options: UploadRequestOptions) {
  const file = options.file as File;
  if (!beforeImageUpload(file)) {
    options.onError?.(new Error("invalid file") as any);
    return;
  }
  coverUploading.value = true;
  try {
    // 不传 productId：拿到 URL 写入封面，随产品保存
    const res = await uploadAsset(file);
    // 封面存展示图（1920 WebP），列表缩略图由 thumbnailUrl 提供
    const url = res.data?.url || res.data?.thumbnailUrl || "";
    if (!url) throw new Error("上传未返回地址");
    form.coverUrl = url;
    form.coverName = res.data?.name || file.name || "";
    options.onSuccess?.(res as any);
    ElMessage.success("封面上传成功");
  } catch (e: any) {
    options.onError?.(e);
    ElMessage.error(e?.message || "封面上传失败");
  } finally {
    coverUploading.value = false;
  }
}

function mapUploadedToPending(list: any[]) {
  const stamp = Date.now();
  return list.map((item: any, i: number) => ({
    id: `pending-${stamp}-${i}`,
    _pending: true,
    type: item.type || "OTHER",
    url: item.url,
    thumbnailUrl: item.thumbnailUrl,
    originalUrl: item.originalUrl,
    name: item.name,
    size: item.size
  }));
}

function applyPendingAssets(mapped: any[]) {
  assets.value = [...assets.value, ...mapped];
  if (!form.coverUrl) {
    const firstImage = mapped.find((a: any) => a.type === "IMAGE");
    if (firstImage?.url) {
      form.coverUrl = firstImage.url;
      form.coverName = firstImage.name || "";
    }
  }
  syncPackUrlFromAssets();
}

async function flushProductAssetBatch() {
  if (!pendingAssetFiles.length || assetBatchUploading.value) {
    return;
  }
  const files = pendingAssetFiles.splice(0, pendingAssetFiles.length);
  assetBatchUploading.value = true;
  assetBatchPending.value = files.length;
  assetBatchProgress.value = `正在上传 ${files.length} 个文件并生成缩略图…`;
  try {
    const res = await uploadAssetsBatch(files);
    const list = res.data?.list || [];
    const count = res.data?.count ?? list.length;
    const mapped = mapUploadedToPending(list);
    applyPendingAssets(mapped);
    ElMessage.success(`已上传 ${count} 个素材，保存产品后生效`);
  } catch (e: any) {
    ElMessage.error(e?.message || "素材批量上传失败");
    throw e;
  } finally {
    assetBatchUploading.value = false;
    assetBatchPending.value = pendingAssetFiles.length;
    assetBatchProgress.value = pendingAssetFiles.length
      ? `队列中还有 ${pendingAssetFiles.length} 个文件…`
      : "";
    if (pendingAssetFiles.length) {
      assetBatchTimer = setTimeout(() => {
        void flushProductAssetBatch();
      }, 120);
    }
  }
}

/** 拖拽/多选后短时合并为一次批量请求（新建也可直接上传） */
function queueAssetFile(file: File, options: UploadRequestOptions) {
  pendingAssetFiles.push(file);
  assetBatchPending.value = pendingAssetFiles.length;
  assetBatchProgress.value = `已选择 ${pendingAssetFiles.length} 个文件，即将批量上传…`;
  if (assetBatchTimer) clearTimeout(assetBatchTimer);
  assetBatchTimer = setTimeout(() => {
    void flushProductAssetBatch()
      .then(() => options.onSuccess?.({} as any))
      .catch(e => options.onError?.(e));
  }, 280);
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isZipFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    name.endsWith(".zip")
  );
}

function queuedCount(kind: "manual" | "pack") {
  return pendingAssetFiles.filter(file =>
    kind === "manual" ? isPdfFile(file) : isZipFile(file)
  ).length;
}

async function enqueueProductAsset(options: UploadRequestOptions) {
  const file = options.file as File;
  if (!beforeImageUpload(file)) {
    options.onError?.(new Error("invalid file") as any);
    return;
  }
  queueAssetFile(file, options);
}

async function enqueueManualAsset(options: UploadRequestOptions) {
  const file = options.file as File;
  if (!beforeManualUpload(file)) {
    options.onError?.(new Error("invalid file") as any);
    return;
  }
  if (manualAssets.value.length + queuedCount("manual") >= MAX_MANUAL_ASSETS) {
    ElMessage.warning(`说明书最多上传 ${MAX_MANUAL_ASSETS} 个`);
    options.onError?.(new Error("limit exceeded") as any);
    return;
  }
  queueAssetFile(file, options);
}

async function enqueuePackAsset(options: UploadRequestOptions) {
  const file = options.file as File;
  if (!beforePackUpload(file)) {
    options.onError?.(new Error("invalid file") as any);
    return;
  }
  if (packAssets.value.length + queuedCount("pack") >= MAX_PACK_ASSETS) {
    ElMessage.warning(`素材包最多上传 ${MAX_PACK_ASSETS} 个`);
    options.onError?.(new Error("limit exceeded") as any);
    return;
  }
  queueAssetFile(file, options);
}

async function uploadProductVideo(
  options: UploadRequestOptions,
  field: "promoVideoUrl" | "installVideoUrl",
  nameField: "promoVideoName" | "installVideoName",
  uploading: typeof promoVideoUploading
) {
  const file = options.file as File;
  if (!beforeVideoUpload(file)) {
    options.onError?.(new Error("invalid file") as any);
    return;
  }
  uploading.value = true;
  try {
    const res = await uploadAsset(file);
    const url = res.data?.url || "";
    if (!url) throw new Error("上传未返回地址");
    form[field] = url;
    form[nameField] = res.data?.name || file.name || "";
    options.onSuccess?.(res as any);
    ElMessage.success("视频上传成功，请点击保存生效");
  } catch (e: any) {
    options.onError?.(e);
    ElMessage.error(e?.message || "视频上传失败");
  } finally {
    uploading.value = false;
  }
}

function uploadPromoVideo(options: UploadRequestOptions) {
  return uploadProductVideo(
    options,
    "promoVideoUrl",
    "promoVideoName",
    promoVideoUploading
  );
}

function uploadInstallVideo(options: UploadRequestOptions) {
  return uploadProductVideo(
    options,
    "installVideoUrl",
    "installVideoName",
    installVideoUploading
  );
}

function clearCover() {
  form.coverUrl = "";
  form.coverName = "";
}

function clearPromoVideo() {
  form.promoVideoUrl = "";
  form.promoVideoName = "";
}

function clearInstallVideo() {
  form.installVideoUrl = "";
  form.installVideoName = "";
}

function setAsCover(asset: any) {
  if (asset.type && asset.type !== "IMAGE") {
    ElMessage.warning("请选择图片素材设为封面");
    return;
  }
  form.coverUrl = asset.url || asset.thumbnailUrl || "";
  form.coverName = asset.name || "";
  ElMessage.success("已设为封面，请点击保存生效");
}

function assetLabel(asset: any) {
  if (asset.type === "PDF") return "说明书";
  if (isPackAsset(asset)) return "素材包";
  if (asset.type === "OTHER") return "海报/其他";
  if (asset.type === "VIDEO") return "视频";
  return "产品图";
}

function isImageAsset(asset: any) {
  return !asset.type || asset.type === "IMAGE";
}

function isManualAsset(asset: any) {
  return asset.type === "PDF";
}

function isPackAsset(asset: any) {
  if (asset?.type && asset.type !== "OTHER") return false;
  const n = `${asset?.name || ""} ${asset?.url || ""}`.toLowerCase();
  return n.includes(".zip") || asset?.type === "OTHER" || asset?._legacy;
}

const imageAssets = computed(() =>
  assets.value.filter((a: any) => isImageAsset(a))
);

const manualAssets = computed(() =>
  assets.value.filter((a: any) => isManualAsset(a))
);

const packAssets = computed(() => {
  const listed = assets.value.filter((a: any) => isPackAsset(a));
  if (listed.length) return listed;
  if (form.assetPackUrl) {
    return [
      {
        id: "legacy-pack",
        url: form.assetPackUrl,
        name: "素材包.zip",
        type: "OTHER",
        _legacy: true
      }
    ];
  }
  return [];
});

function syncPackUrlFromAssets() {
  const first = assets.value.find((a: any) => isPackAsset(a));
  form.assetPackUrl = first?.url || "";
}

function assetPreviewUrl(asset: any) {
  return toDisplayUrl(asset.thumbnailUrl || asset.url);
}

async function onRemoveAsset(asset: any) {
  await ElMessageBox.confirm(
    `确认移除素材「${asset.name || assetLabel(asset)}」？保存后生效。`,
    "提示",
    { type: "warning" }
  );
  if (asset._legacy || asset.id === "legacy-pack") {
    form.assetPackUrl = "";
    ElMessage.success("已移除，保存后生效");
    return;
  }
  if (asset._pending || typeof asset.id === "string") {
    assets.value = assets.value.filter((a: any) => a.id !== asset.id);
    syncPackUrlFromAssets();
    clearCoverIfMatches(asset);
    ElMessage.success("已移除");
    return;
  }
  if (typeof asset.id === "number" && !removedAssetIds.value.includes(asset.id)) {
    removedAssetIds.value.push(asset.id);
  }
  assets.value = assets.value.filter((a: any) => a.id !== asset.id);
  syncPackUrlFromAssets();
  clearCoverIfMatches(asset);
  ElMessage.success("已标记移除，保存后生效");
}

function clearCoverIfMatches(asset: any) {
  const assetUrl = asset.url || asset.thumbnailUrl || "";
  if (!form.coverUrl || !assetUrl) return;
  if (toDisplayUrl(form.coverUrl) === toDisplayUrl(assetUrl)) {
    form.coverUrl = "";
    form.coverName = "";
  }
}

function vehicleLabel(row: any) {
  const year =
    row.yearFrom && row.yearTo
      ? `${row.yearFrom}-${row.yearTo}`
      : row.yearFrom || row.yearTo || "";
  return `${row.brandZh} ${row.modelZh}${year ? ` (${year})` : ""}`;
}

function onSelectionChange(rows: any[]) {
  selectedIds.value = rows.map(r => r.id);
}

async function onBatch(payload: Record<string, unknown>, label: string) {
  if (!selectedIds.value.length) {
    ElMessage.warning("请先勾选产品");
    return;
  }
  await ElMessageBox.confirm(
    `确认将已选 ${selectedIds.value.length} 条设为${label}？`,
    "批量操作",
    { type: "warning" }
  );
  await batchUpdateProducts({ ids: selectedIds.value, ...payload });
  ElMessage.success("批量更新成功");
  fetchList();
}

async function onBatchDelete() {
  if (!selectedIds.value.length) {
    ElMessage.warning("请先勾选产品");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除已选的 ${selectedIds.value.length} 个产品吗？删除后不可恢复。`,
      "批量删除",
      { type: "warning" }
    );
  } catch {
    return;
  }
  await batchDeleteProducts(selectedIds.value);
  selectedIds.value = [];
  ElMessage.success("已删除");
  fetchList();
}

function downloadStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

async function onExportSelected() {
  if (!selectedIds.value.length) {
    ElMessage.warning("请先勾选要导出的产品");
    return;
  }
  exporting.value = true;
  try {
    const blob = await exportProducts(selectedIds.value);
    downloadBlob(
      blob as Blob,
      `产品导出_${downloadStamp()}.xlsx`
    );
    ElMessage.success(`已导出 ${selectedIds.value.length} 个产品`);
  } catch (err) {
    ElMessage.error(errorMessage(err, "导出失败"));
  } finally {
    exporting.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function openDetail(row: any) {
  detailId.value = row.id;
  detailVisible.value = true;
}

function rowActions(): ActionButtonItem[] {
  return [
    { key: "detail", label: "详情" },
    { key: "edit", label: isDealer.value ? "查看" : "编辑" },
    { key: "delete", label: "删除", type: "danger", hidden: isDealer.value }
  ];
}

function onRowAction(key: string, row: any) {
  if (key === "detail") openDetail(row);
  else if (key === "edit") openEdit(row);
  else if (key === "delete") onDelete(row);
}

onMounted(async () => {
  await loadOptions();
  await fetchList();
});
</script>

<template>
  <div class="page-fill">
    <el-card shadow="never">
      <SearchFilters
        v-model="filters"
        :fields="filterFields"
        :loading="loading"
        embedded
        :bordered="false"
        :show-label="false"
        @search="handleSearch"
        @reset="handleSearch"
      />
      <ToolbarTable
        :columns="tableColumns"
        :data="list"
        :loading="loading"
        :total="total"
        v-model:page="query.page"
        v-model:limit="query.pageSize"
        show-toolbar
        :toolbar-props="{ refresh: true, storageKey: 'admin-product-list-columns' }"
        :table-props="{ rowKey: 'id' }"
        @pagination="fetchList"
        @query-table="fetchList"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <template v-if="!isDealer">
            <el-button type="success" @click="openCreate">新建产品</el-button>
            <el-button @click="importDialogVisible = true">导入产品</el-button>
            <el-button @click="onBatch({ status: 'PUBLISHED' }, '已发布')">
              批量发布
            </el-button>
            <el-button @click="onBatch({ status: 'DRAFT' }, '草稿')">
              批量下架
            </el-button>
            <el-button type="danger" plain @click="onBatchDelete">
              批量删除
            </el-button>
            <el-button type="primary" :loading="exporting" @click="onExportSelected">
              导出
            </el-button>
          </template>
        </template>
        <template #coverUrl="{ row }">
          <el-image
            v-if="coverSrc(row)"
            :src="toDisplayUrl(coverSrc(row))"
            fit="cover"
            style="width: 56px; height: 56px; border-radius: 4px"
            :preview-src-list="[toDisplayUrl(coverSrc(row))]"
            preview-teleported
          />
          <span v-else class="text-gray-400">-</span>
        </template>
        <template #name="{ row }">
          <el-button link type="primary" @click="openDetail(row)">
            {{ i18nName(row) }}
          </el-button>
        </template>
        <template #category="{ row }">{{ categoryPath(row) }}</template>
        <template #tags="{ row }">
          <el-tag v-if="row.isNew" size="small" class="mr-1">新品</el-tag>
          <el-tag v-if="row.isHot" size="small" type="danger">热销</el-tag>
          <el-tag v-if="row.isFeatured" size="small" type="warning">主推</el-tag>
        </template>
        <template #status="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusLabel[row.status] || row.status }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <ActionButtons :buttons="rowActions()" @action="({ key }) => onRowAction(key, row)" />
        </template>
      </ToolbarTable>
    </el-card>

    <ProductDetailDrawer v-model="detailVisible" :product-id="detailId" />
    <ProductImportDialog
      v-model="importDialogVisible"
      @imported="fetchList"
    />

    <el-dialog
      v-model="dialogVisible"
      class="product-dialog"
      :title="editingId ? '编辑产品' : '新建产品'"
      width="820px"
      top="4vh"
      align-center
      destroy-on-close
      append-to-body
      @closed="resetForm"
    >
      <div class="product-dialog-body">
        <el-form label-width="96px" class="product-form">
          <p class="form-section-title">基本信息</p>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="SKU" required>
                <el-input v-model="form.sku" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item>
                <template #label>
                  <span class="label-with-tip">
                    URL 别名
                    <el-tooltip :content="slugTip" placement="top">
                      <el-icon class="label-tip-icon"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </span>
                </template>
                <template v-if="editingId">
                  <span class="slug-readonly">{{ form.slug }}</span>
                </template>
                <p v-else class="slug-auto-hint">
                  系统将自动生成：
                  <strong>{{ slugPreview || "填写 SKU 后生成" }}</strong>
                </p>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分类" required>
                <el-cascader
                  v-model="form.categoryId"
                  :options="categoryCascaderOptions"
                  :props="categoryCascaderProps"
                  clearable
                  filterable
                  placeholder="请选择分类"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-select v-model="form.status" style="width: 100%">
                  <el-option label="草稿" value="DRAFT" />
                  <el-option label="已发布" value="PUBLISHED" />
                  <el-option label="已归档" value="ARCHIVED" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规格标签">
                <el-input v-model="form.installLevel" placeholder="可选，如：标准版" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标签">
                <el-checkbox v-model="form.isNew">新品</el-checkbox>
                <el-checkbox v-model="form.isHot">热销</el-checkbox>
                <el-checkbox v-model="form.isFeatured">首页主推</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="适配车型">
                <el-select
                  v-model="form.vehicleIds"
                  multiple
                  filterable
                  collapse-tags
                  placeholder="选择适配车型 / 年款"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in vehicleOptions"
                    :key="item.id"
                    :label="vehicleLabel(item)"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <p class="form-section-title">多语言内容</p>
          <el-tabs v-model="activeLocaleTab" type="card" class="i18n-tabs">
            <el-tab-pane
              v-for="entry in i18nEntries"
              :key="entry.locale"
              :name="entry.locale"
              :label="localeLabel(entry.locale)"
            >
              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item
                    :label="`${localeLabel(entry.locale)}名`"
                    :required="isRequiredLocale(entry.locale)"
                  >
                    <el-input
                      v-model="entry.name"
                      :maxlength="localeTextMaxLength(entry.locale)"
                      show-word-limit
                      :placeholder="`请输入${localeLabel(entry.locale)}名`"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="`${localeLabel(entry.locale)}描述`">
                    <el-input
                      v-model="entry.description"
                      type="textarea"
                      :rows="3"
                      :maxlength="localeTextMaxLength(entry.locale)"
                      show-word-limit
                      :placeholder="`请输入${localeLabel(entry.locale)}描述`"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="材质">
                    <el-input
                      v-model="entry.material"
                      :maxlength="localeTextMaxLength(entry.locale)"
                      show-word-limit
                      placeholder="可选"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="尺寸">
                    <el-input
                      v-model="entry.size"
                      :maxlength="localeTextMaxLength(entry.locale)"
                      show-word-limit
                      placeholder="可选"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="颜色">
                    <el-input
                      v-model="entry.color"
                      :maxlength="localeTextMaxLength(entry.locale)"
                      show-word-limit
                      placeholder="可选"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>

          <p class="form-section-title">搜索引擎优化</p>
          <p class="seo-hint">
            控制搜索引擎和社交分享展示。不填则回退到产品名称与描述。标题建议 50–60 字，描述建议 80–160 字。
          </p>
          <div class="serp-preview">
            <div class="serp-preview-kicker">搜索结果预览</div>
            <div class="serp-url">{{ seoPreviewPath }}</div>
            <div class="serp-title">{{ seoPreviewTitle }}</div>
            <div class="serp-desc">{{ seoPreviewDescription }}</div>
          </div>
          <el-tabs v-model="seoLocaleTab" type="card" class="i18n-tabs">
            <el-tab-pane
              v-for="entry in i18nEntries"
              :key="`seo-${entry.locale}`"
              :name="entry.locale"
              :label="localeLabel(entry.locale)"
            >
              <el-form-item label="SEO 标题">
                <el-input
                  v-model="entry.seoTitle"
                  :maxlength="seoTitleMaxLength(entry.locale)"
                  show-word-limit
                  :placeholder="entry.name || '默认使用产品名称'"
                />
              </el-form-item>
              <el-form-item label="SEO 关键词">
                <el-input
                  v-model="entry.seoKeywords"
                  :maxlength="SEO_KEYWORDS_MAX"
                  show-word-limit
                  placeholder="逗号分隔，如：汽车配件, 原厂质保"
                />
              </el-form-item>
              <el-form-item label="SEO 描述">
                <el-input
                  v-model="entry.seoDescription"
                  type="textarea"
                  :rows="3"
                  :maxlength="SEO_DESC_MAX"
                  show-word-limit
                  :placeholder="entry.description || '默认使用产品描述'"
                />
              </el-form-item>
            </el-tab-pane>
          </el-tabs>

          <p class="form-section-title">媒体与素材</p>
          <div class="media-board">
            <div class="media-field">
              <div class="media-field-head">
                <span class="media-field-label">封面图</span>
                <span class="media-field-hint">jpg / png / webp · ≤20MB</span>
              </div>
              <el-upload
                class="tile-dropzone"
                :class="{ 'is-filled': form.coverUrl }"
                drag
                accept="image/*"
                :show-file-list="false"
                :http-request="uploadCover"
                :disabled="coverUploading"
              >
                <div class="tile-inner">
                  <MediaPreviewTile
                    v-if="form.coverUrl && !coverUploading"
                    :src="toDisplayUrl(form.coverUrl)"
                    type="image"
                    embedded
                    :show-name="false"
                    :show-badge="false"
                    @click.stop
                    @remove="clearCover"
                  />
                  <template v-else>
                    <span class="asset-drop-icon" aria-hidden="true">⬆</span>
                    <span class="el-upload__text">
                      {{ coverUploading ? "上传中…" : "上传" }}
                    </span>
                  </template>
                </div>
              </el-upload>
            </div>

            <div class="media-field media-field--assets">
              <div class="media-field-head">
                <span class="media-field-label">产品素材</span>
                <span class="media-field-hint">jpg / png / webp · ≤20MB</span>
              </div>
              <div class="asset-row">
                <el-upload
                  class="tile-dropzone"
                  drag
                  multiple
                  accept="image/*"
                  :show-file-list="false"
                  :http-request="enqueueProductAsset"
                  :disabled="assetBatchUploading"
                >
                  <div class="tile-inner">
                    <span class="asset-drop-icon" aria-hidden="true">⬆</span>
                    <span class="el-upload__text">
                      {{ assetBatchUploading ? "上传中…" : "批量" }}
                    </span>
                  </div>
                </el-upload>
                <div v-if="imageAssets.length" class="asset-grid">
                  <MediaPreviewTile
                    v-for="(asset, index) in imageAssets"
                    :key="asset.id"
                    :src="assetPreviewUrl(asset)"
                    type="image"
                    badge="产品图"
                    :name="asset.name || '产品图'"
                    :preview-list="
                      imageAssets.map((a: any) =>
                        toDisplayUrl(a.url || a.thumbnailUrl)
                      )
                    "
                    :preview-index="index"
                    @remove="onRemoveAsset(asset)"
                  >
                    <template #actions>
                      <el-button
                        link
                        type="primary"
                        size="small"
                        @click="setAsCover(asset)"
                      >
                        设为封面
                      </el-button>
                    </template>
                  </MediaPreviewTile>
                </div>
              </div>
              <p v-if="assetBatchProgress" class="asset-progress">
                {{ assetBatchProgress }}
              </p>
            </div>

            <div class="media-row">
              <div class="media-field">
                <div class="media-field-head">
                  <span class="media-field-label">宣传视频</span>
                  <span class="media-field-hint">mp4 / webm / mov · ≤50MB</span>
                </div>
                <el-upload
                  class="tile-dropzone"
                  :class="{ 'is-filled': form.promoVideoUrl }"
                  drag
                  accept="video/*,.mp4,.webm,.mov"
                  :show-file-list="false"
                  :http-request="uploadPromoVideo"
                  :disabled="promoVideoUploading"
                >
                  <div class="tile-inner">
                    <MediaPreviewTile
                      v-if="form.promoVideoUrl && !promoVideoUploading"
                      :src="toDisplayUrl(form.promoVideoUrl)"
                      type="video"
                      embedded
                      :name="form.promoVideoName || '宣传视频'"
                      :show-name="false"
                      :show-badge="false"
                      @click.stop
                      @remove="clearPromoVideo"
                    />
                    <template v-else>
                      <span class="asset-drop-icon" aria-hidden="true">⬆</span>
                      <span class="el-upload__text">
                        {{ promoVideoUploading ? "上传中…" : "上传" }}
                      </span>
                    </template>
                  </div>
                </el-upload>
              </div>

              <div class="media-field">
                <div class="media-field-head">
                  <span class="media-field-label">安装示范视频</span>
                  <span class="media-field-hint">mp4 / webm / mov · ≤50MB</span>
                </div>
                <el-upload
                  class="tile-dropzone"
                  :class="{ 'is-filled': form.installVideoUrl }"
                  drag
                  accept="video/*,.mp4,.webm,.mov"
                  :show-file-list="false"
                  :http-request="uploadInstallVideo"
                  :disabled="installVideoUploading"
                >
                  <div class="tile-inner">
                    <MediaPreviewTile
                      v-if="form.installVideoUrl && !installVideoUploading"
                      :src="toDisplayUrl(form.installVideoUrl)"
                      type="video"
                      embedded
                      :name="form.installVideoName || '安装示范视频'"
                      :show-name="false"
                      :show-badge="false"
                      @click.stop
                      @remove="clearInstallVideo"
                    />
                    <template v-else>
                      <span class="asset-drop-icon" aria-hidden="true">⬆</span>
                      <span class="el-upload__text">
                        {{ installVideoUploading ? "上传中…" : "上传" }}
                      </span>
                    </template>
                  </div>
                </el-upload>
              </div>
            </div>

            <div class="media-field media-field--assets">
              <div class="media-field-head">
                <span class="media-field-label">说明书</span>
                <span class="media-field-hint">PDF · ≤30MB · 最多 3 个</span>
              </div>
              <div class="asset-row">
                <el-upload
                  v-if="manualAssets.length < MAX_MANUAL_ASSETS"
                  class="tile-dropzone"
                  drag
                  multiple
                  accept=".pdf,application/pdf"
                  :show-file-list="false"
                  :http-request="enqueueManualAsset"
                  :disabled="assetBatchUploading"
                >
                  <div class="tile-inner">
                    <span class="asset-drop-icon" aria-hidden="true">⬆</span>
                    <span class="el-upload__text">
                      {{ assetBatchUploading ? "上传中…" : "PDF" }}
                    </span>
                  </div>
                </el-upload>
                <div v-if="manualAssets.length" class="asset-grid">
                  <div
                    v-for="asset in manualAssets"
                    :key="asset.id"
                    class="asset-item"
                  >
                    <div class="asset-thumb-wrap">
                      <a
                        class="asset-thumb asset-thumb--file"
                        :href="toDisplayUrl(asset.url)"
                        target="_blank"
                        rel="noopener"
                      >
                        <img
                          v-if="asset.thumbnailUrl"
                          :src="assetPreviewUrl(asset)"
                          alt=""
                        />
                        <span v-else>PDF</span>
                      </a>
                      <span class="asset-badge">说明书</span>
                    </div>
                    <p class="asset-name" :title="asset.name">
                      {{ asset.name || "说明书" }}
                    </p>
                    <div class="asset-actions">
                      <el-button
                        link
                        type="danger"
                        size="small"
                        @click="onRemoveAsset(asset)"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="media-field media-field--assets">
              <div class="media-field-head">
                <span class="media-field-label">素材包</span>
                <span class="media-field-hint">ZIP ≤50MB · 最多 3 个 · 未上传则自动打包</span>
              </div>
              <div class="asset-row">
                <el-upload
                  v-if="packAssets.length < MAX_PACK_ASSETS"
                  class="tile-dropzone"
                  drag
                  multiple
                  accept=".zip,application/zip,application/x-zip-compressed"
                  :show-file-list="false"
                  :http-request="enqueuePackAsset"
                  :disabled="assetBatchUploading"
                >
                  <div class="tile-inner">
                    <span class="asset-drop-icon" aria-hidden="true">⬆</span>
                    <span class="el-upload__text">
                      {{ assetBatchUploading ? "上传中…" : "ZIP" }}
                    </span>
                  </div>
                </el-upload>
                <div v-if="packAssets.length" class="asset-grid">
                  <div
                    v-for="asset in packAssets"
                    :key="asset.id"
                    class="asset-item"
                  >
                    <div class="asset-thumb-wrap">
                      <a
                        class="asset-thumb asset-thumb--file"
                        :href="toDisplayUrl(asset.url)"
                        target="_blank"
                        rel="noopener"
                      >
                        <img
                          v-if="asset.thumbnailUrl"
                          :src="assetPreviewUrl(asset)"
                          alt=""
                        />
                        <span v-else>ZIP</span>
                      </a>
                      <span class="asset-badge">素材包</span>
                    </div>
                    <p class="asset-name" :title="asset.name">
                      {{ asset.name || "素材包.zip" }}
                    </p>
                    <div class="asset-actions">
                      <el-button
                        link
                        type="danger"
                        size="small"
                        @click="onRemoveAsset(asset)"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.product-dialog-body {
  max-height: min(72vh, 680px);
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
}

.form-section-title {
  margin: 0 0 12px;
  padding: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.label-tip-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: help;
}

.slug-auto-hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.slug-auto-hint strong {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.slug-readonly {
  font-size: 13px;
  line-height: 32px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.product-form > .form-section-title:not(:first-child) {
  margin-top: 8px;
}

.product-form > .form-section-title + .media-board {
  margin-top: 4px;
}

.i18n-tabs {
  margin-bottom: 8px;
}

.i18n-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.seo-hint {
  margin: -4px 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.serp-preview {
  margin: 0 0 14px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.serp-preview-kicker {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.serp-url {
  font-size: 12px;
  line-height: 1.4;
  color: #202124;
}

.serp-title {
  margin-top: 2px;
  font-size: 18px;
  line-height: 1.35;
  color: #1a0dab;
}

.serp-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.45;
  color: #4d5156;
}

.media-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.media-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px 24px;
}

.media-row .media-field {
  width: 140px;
}

.media-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.media-field--assets {
  width: 100%;
}

.media-field-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.media-field--assets .media-field-head {
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.media-field-label {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-regular);
}

.media-field-hint {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.media-field--assets .media-field-hint {
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-dropzone {
  --el-upload-dragger-padding-vertical: 0;
  --el-upload-dragger-padding-horizontal: 0;
}

.tile-dropzone :deep(.el-upload),
.tile-dropzone :deep(.el-upload-dragger) {
  width: 104px;
  height: 104px;
}

.tile-dropzone :deep(.el-upload-dragger) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 104px;
  padding: 0;
  overflow: hidden;
  background: var(--el-fill-color-blank);
  border-style: dashed;
}

.tile-dropzone.is-filled :deep(.el-upload-dragger) {
  border-style: solid;
}

.tile-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 104px;
  height: 104px;
}

.asset-drop-icon {
  font-size: 16px;
  line-height: 1;
  color: var(--el-color-primary);
}

.tile-dropzone :deep(.el-upload__text) {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.asset-progress {
  margin: 0;
  color: var(--el-color-primary);
  font-size: 13px;
}

.asset-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.asset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.asset-item {
  width: 104px;
}

.asset-thumb-wrap {
  position: relative;
}

.asset-thumb {
  width: 104px;
  height: 104px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  display: block;
  object-fit: cover;
  overflow: hidden;
  background: #111;
}

.asset-thumb--file {
  display: grid;
  place-items: center;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.asset-thumb--file img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-badge {
  position: absolute;
  left: 4px;
  top: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
}

.asset-name {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-actions {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .media-field--assets .media-field-head {
    flex-wrap: wrap;
  }

  .media-field--assets .media-field-hint {
    text-align: left;
    white-space: normal;
  }
}

.hidden-file {
  display: none;
}
</style>
