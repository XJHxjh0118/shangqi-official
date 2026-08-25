<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getPageSeos, upsertPageSeo } from "@/api/page-seo";
import { getSiteSettings, updateSiteSettings } from "@/api/site-settings";
import RichTextEditor from "@/components/RichTextEditor.vue";
import {
  localeLabel,
  SEO_DESC_MAX,
  SEO_KEYWORDS_MAX,
  seoTitleMaxLength
} from "@/utils/locale";

defineOptions({ name: "CmsSeo" });

type PageSeoRow = {
  pageKey: string;
  titleZh?: string | null;
  titleEn?: string | null;
  keywordsZh?: string | null;
  keywordsEn?: string | null;
  descriptionZh?: string | null;
  descriptionEn?: string | null;
};

type SeoLocale = "zh" | "en";

const PAGE_CATALOG = [
  { key: "home", title: "首页", path: "/" },
  { key: "about", title: "关于我们", path: "/about" },
  { key: "products", title: "产品中心", path: "/products" },
  { key: "contact", title: "联系我们", path: "/contact" }
] as const;

const loading = ref(false);
const saving = ref(false);
const rows = ref<PageSeoRow[]>([]);
const activeKey = ref<(typeof PAGE_CATALOG)[number]["key"]>("home");
const localeTab = ref<SeoLocale>("zh");

const form = reactive({
  titleZh: "",
  titleEn: "",
  keywordsZh: "",
  keywordsEn: "",
  descriptionZh: "",
  descriptionEn: ""
});
const aboutBodyZh = ref("");
const aboutBodyEn = ref("");
const contactBodyZh = ref("");
const contactBodyEn = ref("");
const savedAboutBodyZh = ref("");
const savedAboutBodyEn = ref("");
const savedContactBodyZh = ref("");
const savedContactBodyEn = ref("");

const activePage = computed(
  () => PAGE_CATALOG.find(item => item.key === activeKey.value) || PAGE_CATALOG[0]
);
const isAboutPage = computed(() => activeKey.value === "about");
const isContactPage = computed(() => activeKey.value === "contact");
const hasPageBody = computed(() => isAboutPage.value || isContactPage.value);

const pageBody = computed({
  get() {
    if (isAboutPage.value) {
      return localeTab.value === "en" ? aboutBodyEn.value : aboutBodyZh.value;
    }
    if (isContactPage.value) {
      return localeTab.value === "en" ? contactBodyEn.value : contactBodyZh.value;
    }
    return "";
  },
  set(value: string) {
    if (isAboutPage.value) {
      if (localeTab.value === "en") aboutBodyEn.value = value;
      else aboutBodyZh.value = value;
      return;
    }
    if (isContactPage.value) {
      if (localeTab.value === "en") contactBodyEn.value = value;
      else contactBodyZh.value = value;
    }
  }
});

function normalizeHtml(html: string) {
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? html : "";
}

function toEditorHtml(value: string) {
  const html = (value || "").trim();
  if (!html) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(html)) return html;
  return `<p>${html.replace(/\n+/g, "</p><p>")}</p>`;
}

function snapshot() {
  return JSON.stringify({
    titleZh: form.titleZh.trim(),
    titleEn: form.titleEn.trim(),
    keywordsZh: form.keywordsZh.trim(),
    keywordsEn: form.keywordsEn.trim(),
    descriptionZh: form.descriptionZh.trim(),
    descriptionEn: form.descriptionEn.trim(),
    aboutBodyZh: isAboutPage.value ? normalizeHtml(aboutBodyZh.value) : "",
    aboutBodyEn: isAboutPage.value ? normalizeHtml(aboutBodyEn.value) : "",
    contactBodyZh: isContactPage.value ? normalizeHtml(contactBodyZh.value) : "",
    contactBodyEn: isContactPage.value ? normalizeHtml(contactBodyEn.value) : ""
  });
}

const savedSnapshot = ref("");
const isDirty = computed(() => snapshot() !== savedSnapshot.value);

function applyRow(row?: PageSeoRow | null) {
  Object.assign(form, {
    titleZh: row?.titleZh || "",
    titleEn: row?.titleEn || "",
    keywordsZh: row?.keywordsZh || "",
    keywordsEn: row?.keywordsEn || "",
    descriptionZh: row?.descriptionZh || "",
    descriptionEn: row?.descriptionEn || ""
  });
}

function fillFromKey(pageKey: string) {
  const row = rows.value.find(item => item.pageKey === pageKey);
  applyRow(row);
  savedSnapshot.value = snapshot();
}

function truncateText(text: string, max: number) {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

const previewTitle = computed(() => {
  const title =
    localeTab.value === "en"
      ? form.titleEn || form.titleZh
      : form.titleZh || form.titleEn;
  return truncateText(title || activePage.value.title, seoTitleMaxLength(localeTab.value));
});

const previewDescription = computed(() => {
  const description =
    localeTab.value === "en"
      ? form.descriptionEn || form.descriptionZh
      : form.descriptionZh || form.descriptionEn;
  return truncateText(
    description || "不填写时搜索引擎可能抓取页面正文作为摘要",
    SEO_DESC_MAX
  );
});

async function fetchList() {
  loading.value = true;
  try {
    const [seoRes, settingsRes] = await Promise.all([
      getPageSeos(),
      getSiteSettings()
    ]);
    rows.value = seoRes.data || [];
    aboutBodyZh.value = toEditorHtml(settingsRes.data?.aboutBodyZh || "");
    aboutBodyEn.value = toEditorHtml(settingsRes.data?.aboutBodyEn || "");
    contactBodyZh.value = toEditorHtml(settingsRes.data?.contactBodyZh || "");
    contactBodyEn.value = toEditorHtml(settingsRes.data?.contactBodyEn || "");
    savedAboutBodyZh.value = aboutBodyZh.value;
    savedAboutBodyEn.value = aboutBodyEn.value;
    savedContactBodyZh.value = contactBodyZh.value;
    savedContactBodyEn.value = contactBodyEn.value;
    fillFromKey(activeKey.value);
  } finally {
    loading.value = false;
  }
}

async function selectPage(pageKey: (typeof PAGE_CATALOG)[number]["key"]) {
  if (pageKey === activeKey.value) return;
  if (isDirty.value) {
    try {
      await ElMessageBox.confirm("当前页面有未保存的修改，切换后将丢失。", "提示", {
        type: "warning",
        confirmButtonText: "放弃并切换",
        cancelButtonText: "继续编辑"
      });
    } catch {
      return;
    }
  }
  aboutBodyZh.value = savedAboutBodyZh.value;
  aboutBodyEn.value = savedAboutBodyEn.value;
  contactBodyZh.value = savedContactBodyZh.value;
  contactBodyEn.value = savedContactBodyEn.value;
  activeKey.value = pageKey;
  localeTab.value = "zh";
  fillFromKey(pageKey);
}

async function save() {
  saving.value = true;
  try {
    const payload = {
      pageKey: activeKey.value,
      titleZh: form.titleZh.trim(),
      titleEn: form.titleEn.trim(),
      keywordsZh: form.keywordsZh.trim(),
      keywordsEn: form.keywordsEn.trim(),
      descriptionZh: form.descriptionZh.trim(),
      descriptionEn: form.descriptionEn.trim()
    };
    await upsertPageSeo(payload);
    if (isAboutPage.value) {
      const nextAboutZh = normalizeHtml(aboutBodyZh.value);
      const nextAboutEn = normalizeHtml(aboutBodyEn.value);
      await updateSiteSettings({
        aboutBodyZh: nextAboutZh,
        aboutBodyEn: nextAboutEn
      });
      aboutBodyZh.value = nextAboutZh;
      aboutBodyEn.value = nextAboutEn;
      savedAboutBodyZh.value = nextAboutZh;
      savedAboutBodyEn.value = nextAboutEn;
    }
    if (isContactPage.value) {
      const nextContactZh = normalizeHtml(contactBodyZh.value);
      const nextContactEn = normalizeHtml(contactBodyEn.value);
      await updateSiteSettings({
        contactBodyZh: nextContactZh,
        contactBodyEn: nextContactEn
      });
      contactBodyZh.value = nextContactZh;
      contactBodyEn.value = nextContactEn;
      savedContactBodyZh.value = nextContactZh;
      savedContactBodyEn.value = nextContactEn;
    }
    const index = rows.value.findIndex(item => item.pageKey === activeKey.value);
    if (index >= 0) {
      rows.value[index] = { ...rows.value[index], ...payload };
    } else {
      rows.value.push(payload);
    }
    savedSnapshot.value = snapshot();
    ElMessage.success("已保存");
  } finally {
    saving.value = false;
  }
}

onMounted(fetchList);
</script>

<template>
  <div class="page-fill">
    <el-card v-loading="loading" shadow="never" class="seo-card">
      <div class="seo-layout">
        <aside class="seo-nav">
          <p class="seo-nav-title">官网页面</p>
          <p class="seo-nav-hint">选择页面后配置搜索展示</p>
          <button
            v-for="item in PAGE_CATALOG"
            :key="item.key"
            type="button"
            class="seo-nav-item"
            :class="{ 'is-active': item.key === activeKey }"
            @click="selectPage(item.key)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.path }}</span>
          </button>
        </aside>

        <section class="seo-editor">
          <div class="seo-editor-head">
            <div>
              <h2>{{ activePage.title }}</h2>
              <p>配置搜索引擎与社交分享展示，不填则使用页面默认标题和描述。</p>
            </div>
            <el-button type="primary" :loading="saving" @click="save">保存</el-button>
          </div>

          <div class="serp-preview">
            <div class="serp-preview-kicker">搜索结果预览</div>
            <div class="serp-url">{{ activePage.path }}</div>
            <div class="serp-title">{{ previewTitle }}</div>
            <div class="serp-desc">{{ previewDescription }}</div>
          </div>

          <el-tabs v-model="localeTab" type="card" class="seo-tabs">
            <el-tab-pane
              v-for="locale in ['zh', 'en']"
              :key="locale"
              :name="locale"
              :label="localeLabel(locale)"
            >
              <el-form label-width="96px">
                <el-form-item :label="`${localeLabel(locale)}标题`">
                  <el-input
                    v-model="form[locale === 'en' ? 'titleEn' : 'titleZh']"
                    :maxlength="seoTitleMaxLength(locale)"
                    show-word-limit
                    :placeholder="`建议 ${locale === 'en' ? '50–70' : '30–60'} 字`"
                  />
                </el-form-item>
                <el-form-item :label="`${localeLabel(locale)}关键词`">
                  <el-input
                    v-model="form[locale === 'en' ? 'keywordsEn' : 'keywordsZh']"
                    :maxlength="SEO_KEYWORDS_MAX"
                    show-word-limit
                    :placeholder="locale === 'en' ? 'comma separated' : '逗号分隔'"
                  />
                </el-form-item>
                <el-form-item :label="`${localeLabel(locale)}描述`">
                  <el-input
                    v-model="form[locale === 'en' ? 'descriptionEn' : 'descriptionZh']"
                    type="textarea"
                    :rows="4"
                    :maxlength="SEO_DESC_MAX"
                    show-word-limit
                    placeholder="建议 80–160 字，用于搜索结果摘要"
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>

          <div v-if="hasPageBody" class="about-body-editor">
            <div class="about-body-editor__head">
              <strong>{{ localeTab === "en" ? "英文正文" : "中文正文" }}</strong>
              <span>展示在{{ activePage.title }}页面，支持文字样式、图片和超链接</span>
            </div>
            <RichTextEditor
              :key="`${activeKey}-${localeTab}`"
              v-model="pageBody"
              :placeholder="
                localeTab === 'en'
                  ? `Enter the English body for ${activePage.title}`
                  : `请输入${activePage.title}的中文正文`
              "
            />
          </div>
        </section>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.seo-card :deep(.el-card__body) {
  padding: 0;
}

.seo-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.seo-nav {
  padding: 16px 12px;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  overflow: auto;
}

.seo-nav-title {
  margin: 0 8px 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.seo-nav-hint {
  margin: 0 8px 12px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.seo-nav-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  margin: 0 0 6px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.seo-nav-item strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.seo-nav-item span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.seo-nav-item:hover {
  background: var(--el-fill-color-light);
}

.seo-nav-item.is-active {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.seo-editor {
  min-height: 0;
  padding: 20px 24px 24px;
  overflow: auto;
}

.seo-editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.seo-editor-head h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.seo-editor-head p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.serp-preview {
  margin: 0 0 16px;
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

.seo-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.about-body-editor {
  margin-top: 8px;
}

.about-body-editor__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.about-body-editor__head strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.about-body-editor__head span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .seo-layout {
    grid-template-columns: 1fr;
  }

  .seo-nav {
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
</style>
