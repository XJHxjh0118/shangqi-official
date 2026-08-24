export const DEALER_REGIONS = [
  { value: 'CN', zh: '中国大陆', en: 'Chinese Mainland' },
  { value: 'HK', zh: '中国香港', en: 'Hong Kong, China' },
  { value: 'MO', zh: '中国澳门', en: 'Macao, China' },
  { value: 'TW', zh: '中国台湾', en: 'Taiwan, China' },
  { value: 'MY', zh: '马来西亚', en: 'Malaysia' },
  { value: 'TH', zh: '泰国', en: 'Thailand' },
  { value: 'ID', zh: '印度尼西亚', en: 'Indonesia' },
  { value: 'SG', zh: '新加坡', en: 'Singapore' },
  { value: 'VN', zh: '越南', en: 'Vietnam' },
  { value: 'PH', zh: '菲律宾', en: 'Philippines' },
  { value: 'AE', zh: '阿联酋', en: 'United Arab Emirates' },
  { value: 'SA', zh: '沙特阿拉伯', en: 'Saudi Arabia' },
  { value: 'AU', zh: '澳大利亚', en: 'Australia' },
  { value: 'NZ', zh: '新西兰', en: 'New Zealand' },
  { value: 'DE', zh: '德国', en: 'Germany' },
  { value: 'GB', zh: '英国', en: 'United Kingdom' },
  { value: 'US', zh: '美国', en: 'United States' },
  { value: 'OTHER', zh: '其他地区', en: 'Other' },
] as const

export type DealerRegionValue = (typeof DEALER_REGIONS)[number]['value']

export function regionLabel(value: string | null | undefined, locale: string) {
  if (!value) return ''
  const row = DEALER_REGIONS.find((item) => item.value === value)
  if (!row) return value
  return locale === 'en' ? row.en : row.zh
}
