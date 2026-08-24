/** 面向 AI 检索 / 搜索引擎的服务区域（GEO） */
export const GEO_AREAS = [
  'Asia',
  'Europe',
  'Oceania',
  'Southeast Asia',
  'Americas',
  'Middle East',
  'Africa',
  'Latin America',
  'Russia',
] as const

export const GEO_AREA_LABELS = {
  zh: [
    '亚洲',
    '欧洲',
    '大洋洲',
    '东南亚',
    '美洲',
    '中东',
    '非洲',
    '拉丁美洲',
    '俄罗斯',
  ],
  en: [...GEO_AREAS],
} as const
