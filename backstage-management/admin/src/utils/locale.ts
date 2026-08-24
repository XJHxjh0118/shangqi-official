/** 后台暂定仅中、英 */
export const LOCALE_OPTIONS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "英文" }
] as const;

export type LocaleCode = (typeof LOCALE_OPTIONS)[number]["value"];

export const DEFAULT_LOCALES = ["zh", "en"] as const;
export type DefaultLocale = (typeof DEFAULT_LOCALES)[number];

/** 中文输入上限 */
export const ZH_TEXT_MAX = 20;
/** 英文输入上限 */
export const EN_TEXT_MAX = 80;

export function localeTextMaxLength(locale: string) {
  return locale === "en" ? EN_TEXT_MAX : ZH_TEXT_MAX;
}

/** 搜索结果标题：中文约 30–60 字，英文约 50–70 字符 */
export const SEO_TITLE_ZH_MAX = 60;
export const SEO_TITLE_EN_MAX = 70;
export const SEO_KEYWORDS_MAX = 200;
export const SEO_DESC_MAX = 160;

export function seoTitleMaxLength(locale: string) {
  return locale === "en" ? SEO_TITLE_EN_MAX : SEO_TITLE_ZH_MAX;
}

export type LocaleTextEntry = {
  locale: string;
  text: string;
};

export function localeLabel(code: string) {
  return LOCALE_OPTIONS.find(l => l.value === code)?.label || code;
}

export function isRequiredLocale(code: string) {
  return (DEFAULT_LOCALES as readonly string[]).includes(code);
}

export function createLocaleTextEntry(locale: string): LocaleTextEntry {
  return { locale, text: "" };
}

export function defaultLocaleTextEntries(): LocaleTextEntry[] {
  return DEFAULT_LOCALES.map(code => createLocaleTextEntry(code));
}

function sortLocaleRows<T extends { locale: string }>(rows: T[]): T[] {
  const order = new Map(LOCALE_OPTIONS.map((l, i) => [l.value, i]));
  return rows.sort(
    (a, b) =>
      (order.get(a.locale as LocaleCode) ?? 99) -
      (order.get(b.locale as LocaleCode) ?? 99)
  );
}

/** 只保留中英，缺的补空行 */
export function ensureDefaultLocales<T extends { locale: string }>(
  rows: T[],
  createEmpty: (locale: string) => T
): T[] {
  const byLocale = new Map(
    rows.filter(e => isRequiredLocale(e.locale)).map(e => [e.locale, e])
  );
  const next = DEFAULT_LOCALES.map(
    code => byLocale.get(code) ?? createEmpty(code)
  );
  return sortLocaleRows(next);
}

/** 从接口 i18n 或旧字段组装表单条目，始终带上中英 */
export function buildLocaleTextEntries(
  i18n: Array<{ locale: string; name?: string; title?: string }> | undefined,
  fallback?: { zh?: string; en?: string }
): LocaleTextEntry[] {
  const rows: LocaleTextEntry[] = (i18n || [])
    .map(i => ({
      locale: i.locale,
      text: (i.name ?? i.title ?? "").trim()
    }))
    .filter(i => i.locale);

  if (!rows.length && fallback) {
    if (fallback.zh) rows.push({ locale: "zh", text: fallback.zh });
    if (fallback.en) rows.push({ locale: "en", text: fallback.en });
  }

  const byLocale = new Map(rows.map(e => [e.locale, e]));
  if (fallback?.zh && byLocale.has("zh") && !byLocale.get("zh")?.text) {
    byLocale.get("zh")!.text = fallback.zh;
  }
  if (fallback?.en && byLocale.has("en") && !byLocale.get("en")?.text) {
    byLocale.get("en")!.text = fallback.en;
  }

  return ensureDefaultLocales([...byLocale.values()], createLocaleTextEntry);
}

export function filterLocaleTextPayload(entries: LocaleTextEntry[]) {
  return entries
    .filter(e => isRequiredLocale(e.locale))
    .map(e => ({ locale: e.locale, text: e.text.trim() }));
}

export function missingRequiredLocaleText(entries: LocaleTextEntry[]) {
  return DEFAULT_LOCALES.find(code => {
    const row = entries.find(e => e.locale === code);
    return !row?.text?.trim();
  });
}

/** 产品详情 i18n 为 { zh, en } 对象；兼容旧的数组 */
export function productI18nName(row: any, locale = "zh") {
  const i18n = row?.i18n;
  if (!i18n) return row?.sku || "";
  if (Array.isArray(i18n)) {
    return (
      i18n.find((item: any) => item.locale === locale)?.name ||
      i18n.find((item: any) => item.locale === "zh")?.name ||
      row.sku ||
      ""
    );
  }
  return i18n[locale]?.name || i18n.zh?.name || i18n.en?.name || row.sku || "";
}
