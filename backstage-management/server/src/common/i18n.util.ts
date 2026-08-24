/** 从多语言条目同步门户兼容的 zh / en 字段 */

import { BadRequestException } from '@nestjs/common';

export type NameI18nItem = { locale: string; name: string };
export type TitleI18nItem = { locale: string; title: string };

export const REQUIRED_LOCALES = ['zh', 'en'] as const;

function pickText(
  items: Array<{ locale: string; text: string }>,
  locale: string,
) {
  return items.find((i) => i.locale === locale)?.text?.trim() || '';
}

export function assertRequiredLocales(
  items: Array<{ locale: string }>,
  kind = '内容',
) {
  const labels: Record<string, string> = { zh: '中文', en: '英文' };
  for (const code of REQUIRED_LOCALES) {
    if (!items.some((i) => i.locale === code)) {
      throw new BadRequestException(`请填写${labels[code] || code}${kind}`);
    }
  }
}

export function syncNameZhEn(i18n: NameI18nItem[]) {
  const items = i18n.map((i) => ({ locale: i.locale, text: i.name }));
  const zh = pickText(items, 'zh');
  const en = pickText(items, 'en');
  return {
    nameZh: zh || en || '',
    nameEn: en || zh || '',
  };
}

export function syncTitleZhEn(i18n: TitleI18nItem[]) {
  const items = i18n.map((i) => ({ locale: i.locale, text: i.title }));
  const zh = pickText(items, 'zh');
  const en = pickText(items, 'en');
  return {
    titleZh: zh || en || '',
    titleEn: en || zh || '',
  };
}

/** 兼容旧入参：无 i18n 时由 nameZh/nameEn 生成 */
export function resolveNameI18n(input: {
  i18n?: NameI18nItem[];
  nameZh?: string;
  nameEn?: string;
}): NameI18nItem[] {
  if (input.i18n?.length) {
    return input.i18n
      .map((i) => ({
        locale: i.locale.trim(),
        name: (i.name || '').trim(),
      }))
      .filter((i) => i.locale && i.name);
  }
  const rows: NameI18nItem[] = [];
  if (input.nameZh?.trim()) {
    rows.push({ locale: 'zh', name: input.nameZh.trim() });
  }
  if (input.nameEn?.trim()) {
    rows.push({ locale: 'en', name: input.nameEn.trim() });
  }
  return rows;
}

export function resolveTitleI18n(input: {
  i18n?: TitleI18nItem[];
  titleZh?: string;
  titleEn?: string;
}): TitleI18nItem[] {
  if (input.i18n?.length) {
    return input.i18n
      .map((i) => ({
        locale: i.locale.trim(),
        title: (i.title || '').trim(),
      }))
      .filter((i) => i.locale && i.title);
  }
  const rows: TitleI18nItem[] = [];
  if (input.titleZh?.trim()) {
    rows.push({ locale: 'zh', title: input.titleZh.trim() });
  }
  if (input.titleEn?.trim()) {
    rows.push({ locale: 'en', title: input.titleEn.trim() });
  }
  return rows;
}
