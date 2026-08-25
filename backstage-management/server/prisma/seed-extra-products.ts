import { ProductStatus, type PrismaClient } from '@prisma/client'
import { generateCoverOnly, type ProductAssetSpec, type ProductKind } from './seed-assets'

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=82`
const px = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400`

export type ExtraDemoProduct = ProductAssetSpec & {
  category: string
  vehicles: string[]
  isHot?: boolean
  isNew?: boolean
  isFeatured?: boolean
  installLevel: string
  zh: { description: string; material: string; size: string; color: string }
  en: { description: string; material: string; size: string; color: string }
}

export const EXTRA_PRODUCT_PHOTOS: Record<string, string[]> = {
  'SQ-FM-MG5': [u('photo-1503376780353-7e6692767b70')],
  'SQ-FM-ZS': [u('photo-1549317661-bd32c8ce0db2')],
  'SQ-FM-D7': [u('photo-1502877338535-766e1452684a')],
  'SQ-FM-L6': [u('photo-1617531653332-bd46c24f2068')],
  'SQ-FM-R7': [u('photo-1492144534655-ae79c964c9d7')],
  'SQ-FM-MIFA': [u('photo-1511919884226-fd3cad34687c')],
  'SQ-TM-RX5': [px('3802510')],
  'SQ-TM-LS6': [u('photo-1486262715619-67b85e0b08d3')],
  'SQ-TM-ZS': [px('627678')],
  'SQ-TM-R7': [u('photo-1542362567-b07e54358753')],
  'SQ-SC-MG4': [px('1335077')],
  'SQ-SC-LS6': [u('photo-1550355291-bbee04a92027')],
  'SQ-SC-MIFA': [u('photo-1609521263047-f8f205293f24')],
  'SQ-WS-MG4': [u('photo-1542282088-fe8426682b8f')],
  'SQ-WS-RX5': [u('photo-1552519507-da3b142c6e3d')],
  'SQ-WS-L6': [u('photo-1560958089-b8a1929cea89')],
  'SQ-CC-MG4': [u('photo-1568605117036-5fe5e7bab0b7')],
  'SQ-CC-D7': [px('116675')],
  'SQ-SP-MG4': [u('photo-1605559424843-9e4c228bf1c2')],
  'SQ-SP-RX5': [px('170811')],
}

function extra(
  partial: Omit<ExtraDemoProduct, 'coverOnly' | 'kind'> & { kind: ProductKind },
): ExtraDemoProduct {
  return { ...partial, coverOnly: true }
}

export const EXTRA_PRODUCTS: ExtraDemoProduct[] = [
  extra({
    sku: 'SQ-FM-MG5',
    slug: 'mg5-tpe-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['mg5-2023', 'mg4-2024'],
    titleZh: 'MG5 全包围 TPE 脚垫',
    titleEn: 'MG5 all-weather TPE floor mat',
    vehicleLabel: 'MG5 / MG4',
    accent: '#9f1239',
    isNew: true,
    installLevel: '卡扣快装',
    zh: {
      description: '按 MG5 地板走线开模，覆盖主副驾与后排通道，预留踏板避让。',
      material: 'TPE 环保弹性体',
      size: 'MG5 专车定制',
      color: '黑色 / 红边',
    },
    en: {
      description: 'Molded for the MG5 floor routing, covering front rows and rear tunnel.',
      material: 'TPE elastomer',
      size: 'MG5 specific',
      color: 'Black / red piping',
    },
  }),
  extra({
    sku: 'SQ-FM-ZS',
    slug: 'mg-zs-tpe-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['mg-zs-2022'],
    titleZh: 'MG ZS 全包围脚垫',
    titleEn: 'MG ZS all-weather floor mat',
    vehicleLabel: 'ZS',
    accent: '#be123c',
    isHot: true,
    installLevel: '卡扣快装',
    zh: {
      description: '贴合 ZS 座椅滑轨与中央通道，后排可翻折清洁。',
      material: 'TPE + 织物包边',
      size: 'ZS 专车定制',
      color: '深灰',
    },
    en: {
      description: 'Follows ZS seat rails and center tunnel. Rear section folds for cleaning.',
      material: 'TPE with fabric binding',
      size: 'ZS specific',
      color: 'Charcoal',
    },
  }),
  extra({
    sku: 'SQ-FM-D7',
    slug: 'roewe-d7-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['d7-2024', 'marvel-r-2023'],
    titleZh: '荣威 D7 全包围脚垫',
    titleEn: 'Roewe D7 all-weather floor mat',
    vehicleLabel: 'D7 / Marvel R',
    accent: '#1e40af',
    isFeatured: true,
    installLevel: '卡扣快装',
    zh: {
      description: '适配荣威 D7 平底座舱，边缘卡扣对应原厂定位孔。',
      material: 'TPE 哑光',
      size: 'D7 专车定制',
      color: '炭黑',
    },
    en: {
      description: 'Shaped for the Roewe D7 flat floor, clipping into OEM locating holes.',
      material: 'Matte TPE',
      size: 'D7 specific',
      color: 'Carbon',
    },
  }),
  extra({
    sku: 'SQ-FM-L6',
    slug: 'im-l6-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['l6-2024', 'ls6-2024'],
    titleZh: '智己 L6 星空脚垫',
    titleEn: 'IM L6 starlight floor mat',
    vehicleLabel: 'L6 / LS6',
    accent: '#d6b98a',
    isNew: true,
    installLevel: '卡扣快装',
    zh: {
      description: '针对智己 L6 无线充电区让位，包边不易卷起。',
      material: 'TPE 哑光',
      size: 'L6 专车定制',
      color: '炭黑 / 金边',
    },
    en: {
      description: 'Cut around the IM L6 wireless charging zone with anti-curl binding.',
      material: 'Matte TPE',
      size: 'L6 specific',
      color: 'Carbon / gold edge',
    },
  }),
  extra({
    sku: 'SQ-FM-R7',
    slug: 'rising-r7-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['r7-2023'],
    titleZh: '飞凡 R7 全包围脚垫',
    titleEn: 'Rising R7 all-weather floor mat',
    vehicleLabel: 'R7',
    accent: '#ea580c',
    installLevel: '卡扣快装',
    zh: {
      description: '覆盖 R7 前舱与后排通道，防水防刮，适合户外停放后的清洁。',
      material: 'TPE 环保弹性体',
      size: 'R7 专车定制',
      color: '黑色',
    },
    en: {
      description: 'Covers the R7 cabin and rear tunnel. Waterproof for outdoor parking cleanup.',
      material: 'TPE elastomer',
      size: 'R7 specific',
      color: 'Black',
    },
  }),
  extra({
    sku: 'SQ-FM-MIFA',
    slug: 'maxus-mifa9-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['mifa9-2023'],
    titleZh: '大通 MIFA 9 七座脚垫',
    titleEn: 'Maxus MIFA 9 seven-seat floor mat',
    vehicleLabel: 'MIFA 9',
    accent: '#334155',
    isHot: true,
    installLevel: '卡扣快装',
    zh: {
      description: '按 MIFA 9 三排座舱开模，二三排通道可拆洗。',
      material: 'TPE + 织物包边',
      size: 'MIFA 9 七座',
      color: '深灰',
    },
    en: {
      description: 'Molded for the MIFA 9 three-row cabin. Second and third-row sections are removable.',
      material: 'TPE with fabric binding',
      size: 'MIFA 9 seven-seat',
      color: 'Dark grey',
    },
  }),
  extra({
    sku: 'SQ-TM-RX5',
    slug: 'roewe-rx5-trunk-mat',
    kind: 'trunk-mat',
    category: 'trunk-mats',
    vehicles: ['rx5-2023'],
    titleZh: '荣威 RX5 后备箱垫',
    titleEn: 'Roewe RX5 cargo trunk mat',
    vehicleLabel: 'RX5',
    accent: '#1d4ed8',
    isNew: true,
    installLevel: '即铺即用',
    zh: {
      description: '覆盖 RX5 后备厢底部与门槛翻边，防水防刮。',
      material: 'XPE 复合',
      size: 'RX5 后备厢',
      color: '黑色',
    },
    en: {
      description: 'Covers the RX5 cargo floor and sill lip. Waterproof and scuff-resistant.',
      material: 'XPE composite',
      size: 'RX5 cargo',
      color: 'Black',
    },
  }),
  extra({
    sku: 'SQ-TM-LS6',
    slug: 'im-ls6-trunk-mat',
    kind: 'trunk-mat',
    category: 'trunk-mats',
    vehicles: ['ls6-2024', 'l6-2024'],
    titleZh: '智己 LS6 后备箱垫',
    titleEn: 'IM LS6 cargo trunk mat',
    vehicleLabel: 'LS6 / L6',
    accent: '#c4a574',
    isFeatured: true,
    installLevel: '即铺即用',
    zh: {
      description: '贴合 LS6 电动尾门下沿，装载面防滑纹不易移位。',
      material: 'TPO 耐磨层',
      size: 'LS6 后备厢',
      color: '炭黑',
    },
    en: {
      description: 'Follows the LS6 powered-tailgate lip with a non-slip load surface.',
      material: 'TPO wear layer',
      size: 'LS6 cargo',
      color: 'Carbon',
    },
  }),
  extra({
    sku: 'SQ-TM-ZS',
    slug: 'mg-zs-trunk-mat',
    kind: 'trunk-mat',
    category: 'trunk-mats',
    vehicles: ['mg-zs-2022'],
    titleZh: 'MG ZS 后备箱垫',
    titleEn: 'MG ZS cargo trunk mat',
    vehicleLabel: 'ZS',
    accent: '#be123c',
    installLevel: '即铺即用',
    zh: {
      description: '覆盖 ZS 后备厢底部，适配日常购物与亲子出行。',
      material: 'XPE 复合',
      size: 'ZS 后备厢',
      color: '黑色',
    },
    en: {
      description: 'Covers the ZS cargo floor for daily shopping and family trips.',
      material: 'XPE composite',
      size: 'ZS cargo',
      color: 'Black',
    },
  }),
  extra({
    sku: 'SQ-TM-R7',
    slug: 'rising-r7-trunk-mat',
    kind: 'trunk-mat',
    category: 'trunk-mats',
    vehicles: ['r7-2023'],
    titleZh: '飞凡 R7 后备箱垫',
    titleEn: 'Rising R7 cargo trunk mat',
    vehicleLabel: 'R7',
    accent: '#ea580c',
    installLevel: '即铺即用',
    zh: {
      description: '按 R7 后备厢轮廓开模，门槛翻边防止货物刮伤保险杠。',
      material: 'TPO 耐磨层',
      size: 'R7 后备厢',
      color: '深灰',
    },
    en: {
      description: 'Molded to the R7 cargo outline with a sill lip that protects the bumper.',
      material: 'TPO wear layer',
      size: 'R7 cargo',
      color: 'Dark grey',
    },
  }),
  extra({
    sku: 'SQ-SC-MG4',
    slug: 'mg4-seat-cover',
    kind: 'seat-cover',
    category: 'seat-covers',
    vehicles: ['mg4-2024', 'mg5-2023'],
    titleZh: 'MG4 座椅套',
    titleEn: 'MG4 seat cover',
    vehicleLabel: 'MG4 / MG5',
    accent: '#c8102e',
    isNew: true,
    installLevel: '专业安装',
    zh: {
      description: '保留侧气囊缝线，头枕与靠背分体包装便于经销商施工。',
      material: '耐磨超纤',
      size: '前排 + 后排',
      color: '黑 / 红拼色',
    },
    en: {
      description: 'Keeps side-airbag seams. Headrest and backrest packed separately for dealer fitment.',
      material: 'Wear-resistant microfiber',
      size: 'Front + rear',
      color: 'Black / red',
    },
  }),
  extra({
    sku: 'SQ-SC-LS6',
    slug: 'im-ls6-seat-cover',
    kind: 'seat-cover',
    category: 'seat-covers',
    vehicles: ['ls6-2024'],
    titleZh: '智己 LS6 座椅套',
    titleEn: 'IM LS6 seat cover',
    vehicleLabel: 'LS6',
    accent: '#c4a574',
    isHot: true,
    installLevel: '专业安装',
    zh: {
      description: '贴合 LS6 一体式座椅曲线，保留加热与通风走线。',
      material: '耐磨超纤',
      size: '前排 + 后排',
      color: '黑 / 米拼色',
    },
    en: {
      description: 'Follows the LS6 one-piece seat curve and keeps heater and ventilation routing.',
      material: 'Wear-resistant microfiber',
      size: 'Front + rear',
      color: 'Black / beige',
    },
  }),
  extra({
    sku: 'SQ-SC-MIFA',
    slug: 'maxus-mifa9-seat-cover',
    kind: 'seat-cover',
    category: 'seat-covers',
    vehicles: ['mifa9-2023'],
    titleZh: '大通 MIFA 9 七座座椅套',
    titleEn: 'Maxus MIFA 9 seven-seat cover',
    vehicleLabel: 'MIFA 9',
    accent: '#334155',
    installLevel: '专业安装',
    zh: {
      description: '覆盖三排座椅，二三排可单独更换，适合商务接驳高频使用。',
      material: '耐磨超纤',
      size: '七座三排',
      color: '深灰',
    },
    en: {
      description: 'Covers all three rows. Second and third rows can be replaced separately for shuttle fleets.',
      material: 'Wear-resistant microfiber',
      size: 'Seven-seat three-row',
      color: 'Dark grey',
    },
  }),
  extra({
    sku: 'SQ-WS-MG4',
    slug: 'mg4-weather-shield',
    kind: 'visor',
    category: 'weather-shields',
    vehicles: ['mg4-2024'],
    titleZh: 'MG4 晴雨挡',
    titleEn: 'MG4 weather shield',
    vehicleLabel: 'MG4',
    accent: '#c8102e',
    isFeatured: true,
    installLevel: '卡扣快装',
    zh: {
      description: '贴合 MG4 门框弧度，下雨时可开窗通风，不影响后视镜视野。',
      material: 'PMMA 加厚',
      size: '四门一套',
      color: '烟熏黑',
    },
    en: {
      description: 'Follows the MG4 door-frame curve so windows can stay cracked in rain.',
      material: 'Thickened PMMA',
      size: 'Set of 4 doors',
      color: 'Smoke black',
    },
  }),
  extra({
    sku: 'SQ-WS-RX5',
    slug: 'roewe-rx5-weather-shield',
    kind: 'visor',
    category: 'weather-shields',
    vehicles: ['rx5-2023', 'd7-2024'],
    titleZh: '荣威 RX5 晴雨挡',
    titleEn: 'Roewe RX5 weather shield',
    vehicleLabel: 'RX5 / D7',
    accent: '#1d4ed8',
    installLevel: '卡扣快装',
    zh: {
      description: '卡扣固定不伤漆，适配 RX5 与 D7 门框。',
      material: 'PMMA 加厚',
      size: '四门一套',
      color: '烟熏黑',
    },
    en: {
      description: 'Clip-on fit without paint damage, for RX5 and D7 door frames.',
      material: 'Thickened PMMA',
      size: 'Set of 4 doors',
      color: 'Smoke black',
    },
  }),
  extra({
    sku: 'SQ-WS-L6',
    slug: 'im-l6-weather-shield',
    kind: 'visor',
    category: 'weather-shields',
    vehicles: ['l6-2024', 'ls6-2024'],
    titleZh: '智己 L6 晴雨挡',
    titleEn: 'IM L6 weather shield',
    vehicleLabel: 'L6 / LS6',
    accent: '#d6b98a',
    isNew: true,
    installLevel: '卡扣快装',
    zh: {
      description: '贴合智己无框车门上沿，低风噪设计。',
      material: 'PMMA 加厚',
      size: '四门一套',
      color: '烟熏黑',
    },
    en: {
      description: 'Follows the IM frameless-door upper edge with a low-noise profile.',
      material: 'Thickened PMMA',
      size: 'Set of 4 doors',
      color: 'Smoke black',
    },
  }),
  extra({
    sku: 'SQ-CC-MG4',
    slug: 'mg4-car-cover',
    kind: 'car-cover',
    category: 'car-covers',
    vehicles: ['mg4-2024', 'mg5-2023'],
    titleZh: 'MG4 车衣',
    titleEn: 'MG4 car cover',
    vehicleLabel: 'MG4 / MG5',
    accent: '#c8102e',
    installLevel: '即铺即用',
    zh: {
      description: '防晒防尘，预留充电口拉链，适合户外停放。',
      material: 'PEVA 复合',
      size: '紧凑型两厢',
      color: '银灰',
    },
    en: {
      description: 'Sun and dust protection with a charge-port zipper for outdoor parking.',
      material: 'PEVA composite',
      size: 'Compact hatchback',
      color: 'Silver grey',
    },
  }),
  extra({
    sku: 'SQ-CC-D7',
    slug: 'roewe-d7-car-cover',
    kind: 'car-cover',
    category: 'car-covers',
    vehicles: ['d7-2024', 'marvel-r-2023'],
    titleZh: '荣威 D7 车衣',
    titleEn: 'Roewe D7 car cover',
    vehicleLabel: 'D7 / Marvel R',
    accent: '#1e40af',
    isHot: true,
    installLevel: '即铺即用',
    zh: {
      description: '加厚防刮层，适配中型轿车车身，夜间反光条便于辨认。',
      material: 'PEVA 复合',
      size: '中型轿车',
      color: '银灰',
    },
    en: {
      description: 'Thicker scratch layer for mid-size sedans, with night reflective strips.',
      material: 'PEVA composite',
      size: 'Mid-size sedan',
      color: 'Silver grey',
    },
  }),
  extra({
    sku: 'SQ-SP-MG4',
    slug: 'mg4-scuff-plate',
    kind: 'scuff',
    category: 'scuff-plates',
    vehicles: ['mg4-2024'],
    titleZh: 'MG4 迎宾踏板',
    titleEn: 'MG4 illuminated scuff plate',
    vehicleLabel: 'MG4',
    accent: '#c8102e',
    isFeatured: true,
    installLevel: '专业安装',
    zh: {
      description: '开门点亮 MG 字标，走线接入原厂门槛灯插接件。',
      material: '不锈钢 + LED',
      size: '四门门槛',
      color: '拉丝银',
    },
    en: {
      description: 'Lights the MG mark when doors open. Plugs into the OEM sill-lamp connector.',
      material: 'Stainless steel + LED',
      size: 'Four-door sills',
      color: 'Brushed silver',
    },
  }),
  extra({
    sku: 'SQ-SP-RX5',
    slug: 'roewe-rx5-scuff-plate',
    kind: 'scuff',
    category: 'scuff-plates',
    vehicles: ['rx5-2023', 'd7-2024'],
    titleZh: '荣威 RX5 迎宾踏板',
    titleEn: 'Roewe RX5 illuminated scuff plate',
    vehicleLabel: 'RX5 / D7',
    accent: '#1d4ed8',
    isNew: true,
    installLevel: '专业安装',
    zh: {
      description: '不锈钢门槛条带 LED 字标，不破坏原厂线束。',
      material: '不锈钢 + LED',
      size: '四门门槛',
      color: '拉丝银',
    },
    en: {
      description: 'Stainless sill plates with LED lettering, without cutting the OEM harness.',
      material: 'Stainless steel + LED',
      size: 'Four-door sills',
      color: 'Brushed silver',
    },
  }),
]

export async function insertExtraProducts(prisma: PrismaClient) {
  const categories = await prisma.category.findMany({ select: { id: true, code: true } })
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, code: true } })
  const categoryByCode = new Map(categories.map((item) => [item.code, item.id]))
  const vehicleByCode = new Map(vehicles.map((item) => [item.code, item.id]))
  let created = 0
  let skipped = 0

  for (const [index, p] of EXTRA_PRODUCTS.entries()) {
    const exists = await prisma.product.findUnique({ where: { sku: p.sku } })
    if (exists) {
      skipped += 1
      continue
    }
    const categoryId = categoryByCode.get(p.category)
    if (!categoryId) throw new Error(`分类不存在：${p.category}`)
    const vehicleIds = p.vehicles.map((code) => {
      const id = vehicleByCode.get(code)
      if (!id) throw new Error(`车型不存在：${code}`)
      return id
    })
    const cover = await generateCoverOnly({
      ...p,
      photos: EXTRA_PRODUCT_PHOTOS[p.sku],
    })
    await prisma.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        categoryId,
        status: ProductStatus.PUBLISHED,
        sort: 100 + index,
        isHot: Boolean(p.isHot),
        isNew: Boolean(p.isNew),
        isFeatured: Boolean(p.isFeatured),
        installLevel: p.installLevel,
        coverUrl: cover,
        coverName: `${p.sku}-cover.jpg`,
        i18n: {
          create: [
            {
              locale: 'zh',
              name: p.titleZh,
              description: p.zh.description,
              material: p.zh.material,
              size: p.zh.size,
              color: p.zh.color,
              seoTitle: `${p.titleZh} | 上汽经创`,
              seoKeywords: `${p.titleZh},${p.vehicleLabel},上汽附件`,
              seoDescription: p.zh.description,
            },
            {
              locale: 'en',
              name: p.titleEn,
              description: p.en.description,
              material: p.en.material,
              size: p.en.size,
              color: p.en.color,
              seoTitle: `${p.titleEn} | SAIC Venture`,
              seoKeywords: `${p.titleEn},${p.vehicleLabel},SAIC accessory`,
              seoDescription: p.en.description,
            },
          ],
        },
        vehicles: {
          create: vehicleIds.map((vehicleId) => ({ vehicleId })),
        },
      },
    })
    created += 1
    console.log(`created ${p.sku}`)
  }

  return { created, skipped }
}
