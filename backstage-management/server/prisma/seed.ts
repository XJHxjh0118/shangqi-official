import { AssetType, PrismaClient, ProductStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { generateSeedAssets, type ProductAssetSpec } from './seed-assets'

const prisma = new PrismaClient()

const VEHICLES = [
  { code: 'mg4-2024', brandZh: '名爵', brandEn: 'MG', modelZh: 'MG4', modelEn: 'MG4', yearFrom: 2023, yearTo: 2026, sort: 1, accent: '#c8102e' },
  { code: 'mg5-2023', brandZh: '名爵', brandEn: 'MG', modelZh: 'MG5', modelEn: 'MG5', yearFrom: 2021, yearTo: 2025, sort: 2, accent: '#9f1239' },
  { code: 'mg-zs-2022', brandZh: '名爵', brandEn: 'MG', modelZh: 'ZS', modelEn: 'ZS', yearFrom: 2020, yearTo: 2025, sort: 3, accent: '#be123c' },
  { code: 'rx5-2023', brandZh: '荣威', brandEn: 'Roewe', modelZh: 'RX5', modelEn: 'RX5', yearFrom: 2022, yearTo: 2026, sort: 4, accent: '#1d4ed8' },
  { code: 'marvel-r-2023', brandZh: '荣威', brandEn: 'Roewe', modelZh: 'Marvel R', modelEn: 'Marvel R', yearFrom: 2021, yearTo: 2024, sort: 5, accent: '#2563eb' },
  { code: 'd7-2024', brandZh: '荣威', brandEn: 'Roewe', modelZh: 'D7', modelEn: 'D7', yearFrom: 2023, yearTo: 2026, sort: 6, accent: '#1e40af' },
  { code: 'ls6-2024', brandZh: '智己', brandEn: 'IM', modelZh: 'LS6', modelEn: 'LS6', yearFrom: 2023, yearTo: 2026, sort: 7, accent: '#c4a574' },
  { code: 'l6-2024', brandZh: '智己', brandEn: 'IM', modelZh: 'L6', modelEn: 'L6', yearFrom: 2024, yearTo: 2026, sort: 8, accent: '#d6b98a' },
  { code: 'mifa9-2023', brandZh: '大通', brandEn: 'Maxus', modelZh: 'MIFA 9', modelEn: 'MIFA 9', yearFrom: 2022, yearTo: 2026, sort: 9, accent: '#334155' },
  { code: 'r7-2023', brandZh: '飞凡', brandEn: 'Rising', modelZh: 'R7', modelEn: 'R7', yearFrom: 2022, yearTo: 2025, sort: 10, accent: '#ea580c' },
] as const

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=82`
const px = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400`

const VEHICLE_PHOTOS: Record<string, string> = {
  'mg4-2024': u('photo-1617788138017-80ad40651399'),
  'mg5-2023': u('photo-1494976388531-d1058494cdd8'),
  'mg-zs-2022': u('photo-1583121274602-3e2820c69888'),
  'rx5-2023': u('photo-1552519507-da3b142c6e3d'),
  'marvel-r-2023': u('photo-1492144534655-ae79c964c9d7'),
  'd7-2024': u('photo-1605559424843-9e4c228bf1c2'),
  'ls6-2024': u('photo-1560958089-b8a1929cea89'),
  'l6-2024': u('photo-1617531653332-bd46c24f2068'),
  'mifa9-2023': u('photo-1502877338535-766e1452684a'),
  'r7-2023': u('photo-1503376780353-7e6692767b70'),
}

const PRODUCT_PHOTOS: Record<string, string[]> = {
  'SQ-FM-MG4': [u('photo-1550355291-bbee04a92027'), u('photo-1609521263047-f8f205293f24')],
  'SQ-FM-RX5': [px('5214413'), px('3992776')],
  'SQ-FM-LS6': [u('photo-1542362567-b07e54358753'), u('photo-1560958089-b8a1929cea89')],
  'SQ-TM-MG4': [u('photo-1486262715619-67b85e0b08d3'), px('627678')],
  'SQ-TM-MIFA': [px('170811'), px('116675')],
  'SQ-SC-MR': [px('1335077'), u('photo-1542362567-b07e54358753')],
  'SQ-WS-ZS': [u('photo-1511919884226-fd3cad34687c'), u('photo-1542282088-fe8426682b8f')],
  'SQ-CC-R7': [u('photo-1568605117036-5fe5e7bab0b7'), u('photo-1485291571150-772bcfc10da5')],
  'SQ-SP-L6': [u('photo-1605559424843-9e4c228bf1c2'), u('photo-1552519507-da3b142c6e3d')],
  'SQ-EV-D7': [u('photo-1593941707882-a5bba14938c7'), px('110844')],
}

type DemoProduct = ProductAssetSpec & {
  category: string
  vehicles: string[]
  isHot?: boolean
  isNew?: boolean
  isFeatured?: boolean
  installLevel: string
  zh: { description: string; material: string; size: string; color: string }
  en: { description: string; material: string; size: string; color: string }
}

const PRODUCTS: DemoProduct[] = [
  {
    sku: 'SQ-FM-MG4',
    slug: 'mg4-tpe-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['mg4-2024', 'mg5-2023'],
    titleZh: 'MG4 全包围 TPE 脚垫',
    titleEn: 'MG4 All-weather TPE floor mat',
    vehicleLabel: 'MG4 / MG5',
    accent: '#c8102e',
    isHot: true,
    isFeatured: true,
    installLevel: '卡扣快装',
    zh: {
      description: '按 MG4 座舱地板开模，覆盖主副驾与后排通道，预留踏板与充电口避让位。',
      material: 'TPE 环保弹性体',
      size: 'MG4 专车定制',
      color: '黑色 / 红边',
    },
    en: {
      description: 'Molded for the MG4 cabin floor, covering front rows and rear tunnel with pedal and charge-port cutouts.',
      material: 'TPE elastomer',
      size: 'MG4 specific',
      color: 'Black / red piping',
    },
  },
  {
    sku: 'SQ-FM-RX5',
    slug: 'roewe-rx5-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['rx5-2023', 'd7-2024'],
    titleZh: '荣威 RX5 全包围脚垫',
    titleEn: 'Roewe RX5 all-weather floor mat',
    vehicleLabel: 'RX5 / D7',
    accent: '#1d4ed8',
    isFeatured: true,
    installLevel: '卡扣快装',
    zh: {
      description: '适配荣威 RX5 地板走线与座椅滑轨，后排可翻折清洁，适合家庭与网约车场景。',
      material: 'TPE + 织物包边',
      size: 'RX5 专车定制',
      color: '深灰',
    },
    en: {
      description: 'Cut for Roewe RX5 floor routing and seat rails. Rear section folds for cleaning, suited to family and fleet use.',
      material: 'TPE with fabric binding',
      size: 'RX5 specific',
      color: 'Charcoal',
    },
  },
  {
    sku: 'SQ-FM-LS6',
    slug: 'im-ls6-floor-mat',
    kind: 'floor-mat',
    category: 'floor-mats',
    vehicles: ['ls6-2024', 'l6-2024'],
    titleZh: '智己 LS6 星空脚垫',
    titleEn: 'IM LS6 starlight floor mat',
    vehicleLabel: 'LS6 / L6',
    accent: '#c4a574',
    isHot: true,
    installLevel: '卡扣快装',
    zh: {
      description: '针对智己 LS6 平底座舱与无线充电区让位，边缘卡扣对应原厂定位孔。',
      material: 'TPE 哑光',
      size: 'LS6 专车定制',
      color: '炭黑 / 金边',
    },
    en: {
      description: 'Shaped for the IM LS6 flat floor and wireless charging zone, clipping into OEM locating holes.',
      material: 'Matte TPE',
      size: 'LS6 specific',
      color: 'Carbon / gold edge',
    },
  },
  {
    sku: 'SQ-TM-MG4',
    slug: 'mg4-trunk-mat',
    kind: 'trunk-mat',
    category: 'trunk-mats',
    vehicles: ['mg4-2024'],
    titleZh: 'MG4 后备箱垫',
    titleEn: 'MG4 cargo trunk mat',
    vehicleLabel: 'MG4',
    accent: '#9f1239',
    isNew: true,
    installLevel: '即铺即用',
    zh: {
      description: '覆盖 MG4 后备厢底部与门槛翻边，防水防刮，适配 5 座日常装载。',
      material: 'XPE 复合',
      size: 'MG4 后备厢',
      color: '黑色',
    },
    en: {
      description: 'Covers the MG4 cargo floor and sill lip. Waterproof and scuff-resistant for daily 5-seat loading.',
      material: 'XPE composite',
      size: 'MG4 cargo',
      color: 'Black',
    },
  },
  {
    sku: 'SQ-TM-MIFA',
    slug: 'maxus-mifa9-trunk-mat',
    kind: 'trunk-mat',
    category: 'trunk-mats',
    vehicles: ['mifa9-2023'],
    titleZh: '大通 MIFA 9 七座后备箱垫',
    titleEn: 'Maxus MIFA 9 seven-seat cargo mat',
    vehicleLabel: 'MIFA 9',
    accent: '#334155',
    isNew: true,
    isFeatured: true,
    installLevel: '即铺即用',
    zh: {
      description: '按 MIFA 9 三排座椅放倒后的装载面开模，适合商务接驳与家庭长途。',
      material: 'TPO 耐磨层',
      size: 'MIFA 9 七座',
      color: '深灰',
    },
    en: {
      description: 'Molded for the MIFA 9 load floor with third-row folded, for shuttle and family trips.',
      material: 'TPO wear layer',
      size: 'MIFA 9 seven-seat',
      color: 'Dark grey',
    },
  },
  {
    sku: 'SQ-SC-MR',
    slug: 'roewe-marvel-r-seat-cover',
    kind: 'seat-cover',
    category: 'seat-covers',
    vehicles: ['marvel-r-2023', 'd7-2024'],
    titleZh: '荣威 Marvel R 座椅套',
    titleEn: 'Roewe Marvel R seat cover',
    vehicleLabel: 'Marvel R / D7',
    accent: '#2563eb',
    installLevel: '专业安装',
    zh: {
      description: '保留 Marvel R 侧气囊缝线与座椅加热走线，头枕与靠背分体包装便于经销商施工。',
      material: '耐磨超纤',
      size: '前排 + 后排',
      color: '黑 / 米拼色',
    },
    en: {
      description: 'Keeps Marvel R side-airbag seams and heater routing. Headrest and backrest packed separately for dealer fitment.',
      material: 'Wear-resistant microfiber',
      size: 'Front + rear',
      color: 'Black / beige',
    },
  },
  {
    sku: 'SQ-WS-ZS',
    slug: 'mg-zs-weather-shield',
    kind: 'visor',
    category: 'weather-shields',
    vehicles: ['mg-zs-2022', 'mg5-2023'],
    titleZh: 'MG ZS 晴雨挡',
    titleEn: 'MG ZS weather shield',
    vehicleLabel: 'ZS / MG5',
    accent: '#be123c',
    isHot: true,
    installLevel: '卡扣快装',
    zh: {
      description: '贴合 ZS 门框弧度，下雨时可开窗通风，不影响后视镜视野。',
      material: 'PMMA 加厚',
      size: '四门一套',
      color: '烟熏黑',
    },
    en: {
      description: 'Follows the ZS door-frame curve so windows can stay cracked in rain without blocking mirror sightlines.',
      material: 'Thickened PMMA',
      size: 'Set of 4 doors',
      color: 'Smoke black',
    },
  },
  {
    sku: 'SQ-CC-R7',
    slug: 'rising-r7-car-cover',
    kind: 'car-cover',
    category: 'car-covers',
    vehicles: ['r7-2023', 'ls6-2024'],
    titleZh: '飞凡 R7 车衣',
    titleEn: 'Rising R7 car cover',
    vehicleLabel: 'R7 / LS6',
    accent: '#ea580c',
    installLevel: '即铺即用',
    zh: {
      description: '防晒防尘，预留充电口拉链，适合户外停放的智己 / 飞凡车型。',
      material: 'PEVA 复合',
      size: '中型 SUV',
      color: '银灰',
    },
    en: {
      description: 'Sun and dust protection with a charge-port zipper, for outdoor parking of Rising / IM SUVs.',
      material: 'PEVA composite',
      size: 'Mid-size SUV',
      color: 'Silver grey',
    },
  },
  {
    sku: 'SQ-SP-L6',
    slug: 'im-l6-scuff-plate',
    kind: 'scuff',
    category: 'scuff-plates',
    vehicles: ['l6-2024', 'ls6-2024'],
    titleZh: '智己 L6 迎宾踏板',
    titleEn: 'IM L6 illuminated scuff plate',
    vehicleLabel: 'L6 / LS6',
    accent: '#d6b98a',
    isNew: true,
    installLevel: '专业安装',
    zh: {
      description: '开门点亮车型字标，走线接入原厂门槛灯插接件，不破坏线束。',
      material: '不锈钢 + LED',
      size: '四门门槛',
      color: '拉丝银',
    },
    en: {
      description: 'Lights the model mark when doors open. Plugs into the OEM sill-lamp connector without cutting the harness.',
      material: 'Stainless steel + LED',
      size: 'Four-door sills',
      color: 'Brushed silver',
    },
  },
  {
    sku: 'SQ-EV-D7',
    slug: 'roewe-d7-charge-bag',
    kind: 'cable-bag',
    category: 'ev-cables',
    vehicles: ['d7-2024', 'marvel-r-2023', 'ls6-2024'],
    titleZh: '荣威 D7 充电收纳包',
    titleEn: 'Roewe D7 charge cable bag',
    vehicleLabel: 'D7 / Marvel R / LS6',
    accent: '#1e40af',
    isFeatured: true,
    installLevel: '即铺即用',
    zh: {
      description: '可放随车充电枪与便携线，分隔层防止刮伤，适配上汽系纯电后备厢侧袋。',
      material: '防水牛津布',
      size: '420 × 280 × 120 mm',
      color: '藏青',
    },
    en: {
      description: 'Holds the portable charger and cable in split pockets, sized for SAIC EV cargo side bays.',
      material: 'Waterproof Oxford',
      size: '420 × 280 × 120 mm',
      color: 'Navy',
    },
  },
]

async function wipeDemoCatalog() {
  await prisma.inquiryItem.deleteMany()
  await prisma.inquiry.deleteMany()
  await prisma.contactMessage.deleteMany()
  await prisma.shareLink.deleteMany()
  await prisma.productAsset.deleteMany()
  await prisma.productVehicle.deleteMany()
  await prisma.product.deleteMany()
  await prisma.homeVehicle.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.category.deleteMany({ where: { parentId: { not: null } } })
  await prisma.category.deleteMany()
  await prisma.banner.deleteMany()
  await prisma.serviceItem.deleteMany()
  await prisma.contactPerson.deleteMany()
}

async function upsertCategory(
  code: string,
  nameZh: string,
  nameEn: string,
  sort: number,
  parentId?: number,
) {
  return prisma.category.upsert({
    where: { code },
    update: { nameZh, nameEn, sort, parentId: parentId ?? null, enabled: true },
    create: {
      code,
      nameZh,
      nameEn,
      sort,
      parentId: parentId ?? null,
      i18n: {
        create: [
          { locale: 'zh', name: nameZh },
          { locale: 'en', name: nameEn },
        ],
      },
    },
  })
}

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10)
  const editorHash = await bcrypt.hash('editor123', 10)
  const dealerHash = await bcrypt.hash('dealer123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminHash,
      nickname: '系统管理员',
      role: 'ADMIN',
    },
  })
  await prisma.user.upsert({
    where: { username: 'editor' },
    update: {},
    create: {
      username: 'editor',
      passwordHash: editorHash,
      nickname: '内容运营',
      role: 'EDITOR',
    },
  })
  await prisma.user.upsert({
    where: { username: 'dealer' },
    update: {
      email: 'dealer@saicventure.com',
      company: '上海名爵附件经销商',
      contactName: '张海宁',
      region: 'CN',
      regionalManager: '李明远',
      address: '浦东新区上汽大道 1 号',
      phone: '+86 21 0000 1001',
    },
    create: {
      username: 'dealer',
      passwordHash: dealerHash,
      nickname: '名爵经销商',
      email: 'dealer@saicventure.com',
      company: '上海名爵附件经销商',
      contactName: '张海宁',
      region: 'CN',
      regionalManager: '李明远',
      address: '浦东新区上汽大道 1 号',
      phone: '+86 21 0000 1001',
      role: 'DEALER',
    },
  })

  const assets = await generateSeedAssets(
    VEHICLES.map((v) => ({
      code: v.code,
      brandZh: v.brandZh,
      modelZh: v.modelZh,
      yearFrom: v.yearFrom,
      yearTo: v.yearTo,
      accent: v.accent,
      photo: VEHICLE_PHOTOS[v.code],
    })),
    PRODUCTS.map((p) => ({ ...p, photos: PRODUCT_PHOTOS[p.sku] })),
  )

  await wipeDemoCatalog()

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      siteNameZh: '上汽经创',
      siteNameEn: 'SAIC Venture',
      logoUrl: assets.logo,
      faviconUrl: assets.favicon,
      heroImageUrl: assets.banners[0],
      seoKeywordsZh: '上汽,MG,荣威,智己,大通,飞凡,原厂附件,脚垫,后备箱垫',
      seoKeywordsEn: 'SAIC,MG,Roewe,IM,Maxus,Rising,OEM accessory,floor mat',
      seoDescriptionZh: '上汽系车型原厂附件与装车配件门户，覆盖 MG、荣威、智己、大通、飞凡。',
      seoDescriptionEn:
        'OEM accessory portal for SAIC vehicles: MG, Roewe, IM, Maxus and Rising.',
      footerTextZh: '上汽经创 · 面向全球经销商的上汽系附件门户',
      footerTextEn: 'SAIC Venture · Accessory portal for global SAIC dealers',
      contactEmail: 'parts@saicventure.com',
      contactPhone: '+86 21 0000 1888',
      aboutTitleZh: '关于上汽经创',
      aboutTitleEn: 'About SAIC Venture',
      aboutBodyZh:
        '上汽经创为全球经销商提供上汽系车型（MG、荣威、智己、大通、飞凡）原厂附件与装车配件。\n\n目录按座舱、后备厢、外观与新能源划分，每款产品标注适配年款、安装等级，并配有产品视频、安装视频、说明书 PDF 与经销商素材包，便于选型、询盘与到店施工。',
      aboutBodyEn:
        'SAIC Venture supplies OEM accessories for MG, Roewe, IM, Maxus and Rising to dealers worldwide.\n\nThe catalog is grouped by cabin, cargo, exterior and EV kits. Each item lists fitment years and install level, with product film, install film, PDF and a dealer asset pack.',
    },
    create: {
      id: 1,
      siteNameZh: '上汽经创',
      siteNameEn: 'SAIC Venture',
      logoUrl: assets.logo,
      faviconUrl: assets.favicon,
      heroImageUrl: assets.banners[0],
      seoKeywordsZh: '上汽,MG,荣威,智己,大通,飞凡,原厂附件',
      seoKeywordsEn: 'SAIC,MG,Roewe,IM,Maxus,Rising,OEM accessory',
      seoDescriptionZh: '上汽系车型原厂附件与装车配件门户。',
      seoDescriptionEn: 'OEM accessory portal for SAIC vehicles.',
      footerTextZh: '上汽经创 · 面向全球经销商的上汽系附件门户',
      footerTextEn: 'SAIC Venture · Accessory portal for global SAIC dealers',
      contactEmail: 'parts@saicventure.com',
      contactPhone: '+86 21 0000 1888',
      aboutTitleZh: '关于上汽经创',
      aboutTitleEn: 'About SAIC Venture',
      aboutBodyZh: '上汽经创为全球经销商提供上汽系车型原厂附件与装车配件。',
      aboutBodyEn: 'SAIC Venture supplies OEM accessories for SAIC vehicles to dealers worldwide.',
    },
  })

  const interior = await upsertCategory('interior', '座舱内饰', 'Cabin interior', 1)
  const trunk = await upsertCategory('trunk', '后备厢', 'Cargo', 2)
  const exterior = await upsertCategory('exterior', '外观件', 'Exterior', 3)
  const ev = await upsertCategory('ev', '新能源附件', 'EV accessories', 4)

  const leaves = {
    'floor-mats': await upsertCategory('floor-mats', '脚垫', 'Floor mats', 1, interior.id),
    'seat-covers': await upsertCategory('seat-covers', '座椅套', 'Seat covers', 2, interior.id),
    'trunk-mats': await upsertCategory('trunk-mats', '后备箱垫', 'Trunk mats', 1, trunk.id),
    'weather-shields': await upsertCategory('weather-shields', '晴雨挡', 'Weather shields', 1, exterior.id),
    'car-covers': await upsertCategory('car-covers', '车衣', 'Car covers', 2, exterior.id),
    'scuff-plates': await upsertCategory('scuff-plates', '迎宾踏板', 'Scuff plates', 1, ev.id),
    'ev-cables': await upsertCategory('ev-cables', '充电收纳', 'Charge kits', 2, ev.id),
  }

  const vehicleRows: Record<string, { id: number }> = {}
  for (const v of VEHICLES) {
    vehicleRows[v.code] = await prisma.vehicle.create({
      data: {
        code: v.code,
        brandZh: v.brandZh,
        brandEn: v.brandEn,
        modelZh: v.modelZh,
        modelEn: v.modelEn,
        yearFrom: v.yearFrom,
        yearTo: v.yearTo,
        sort: v.sort,
      },
    })
  }

  const homeCodes = ['mg4-2024', 'rx5-2023', 'ls6-2024', 'mifa9-2023', 'r7-2023', 'mg-zs-2022']
  for (const [i, code] of homeCodes.entries()) {
    await prisma.homeVehicle.create({
      data: {
        vehicleId: vehicleRows[code].id,
        imageUrl: assets.vehicles[code],
        sort: i + 1,
      },
    })
  }

  const createdProducts: Array<{ id: number; sku: string }> = []
  for (const [i, p] of PRODUCTS.entries()) {
    const files = assets.products[p.sku]
    if (!files) throw new Error(`missing assets for ${p.sku}`)
    const categoryId = leaves[p.category as keyof typeof leaves].id
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        categoryId,
        status: ProductStatus.PUBLISHED,
        sort: i + 1,
        isHot: Boolean(p.isHot),
        isNew: Boolean(p.isNew),
        isFeatured: Boolean(p.isFeatured),
        installLevel: p.installLevel,
        coverUrl: files.cover,
        coverName: `${p.sku}-cover.jpg`,
        promoVideoUrl: files.promo,
        promoVideoName: `${p.sku}-promo.mp4`,
        installVideoUrl: files.install,
        installVideoName: `${p.sku}-install.mp4`,
        assetPackUrl: files.zip,
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
          create: p.vehicles.map((code) => ({ vehicleId: vehicleRows[code].id })),
        },
        assets: {
          create: [
            ...files.gallery.map((imageUrl, idx) => ({
              type: AssetType.IMAGE,
              url: imageUrl,
              name: `${p.sku}-${idx === 0 ? 'cover' : 'detail'}.jpg`,
              sort: idx,
            })),
            {
              type: AssetType.PDF,
              url: files.pdf,
              name: `${p.sku}-install-guide.pdf`,
              sort: 10,
            },
            {
              type: AssetType.OTHER,
              url: files.zip,
              name: `${p.sku}-asset-pack.zip`,
              sort: 20,
            },
          ],
        },
      },
    })
    createdProducts.push({ id: product.id, sku: product.sku })
  }

  await prisma.banner.createMany({
    data: [
      {
        titleZh: 'MG4 原厂脚垫现货',
        titleEn: 'MG4 OEM floor mats in stock',
        imageUrl: assets.banners[0],
        linkUrl: '/products?category=floor-mats',
        sort: 1,
      },
      {
        titleZh: '智己新能源装车套装',
        titleEn: 'IM EV install kits',
        imageUrl: assets.banners[1],
        linkUrl: '/products?category=ev',
        sort: 2,
      },
      {
        titleZh: '全球经销商询盘通道',
        titleEn: 'Dealer inquiry desk',
        imageUrl: assets.banners[2],
        linkUrl: '/inquiry',
        sort: 3,
      },
    ],
  })
  const banners = await prisma.banner.findMany({ orderBy: { sort: 'asc' } })
  for (const banner of banners) {
    await prisma.bannerI18n.createMany({
      data: [
        { bannerId: banner.id, locale: 'zh', title: banner.titleZh },
        { bannerId: banner.id, locale: 'en', title: banner.titleEn },
      ],
    })
  }

  await prisma.serviceItem.createMany({
    data: [
      {
        code: 'fitment',
        titleZh: '车型精确适配',
        titleEn: 'Exact vehicle fitment',
        bodyZh: '按 MG、荣威、智己、大通、飞凡年款开模，列表可筛选适配车型。',
        bodyEn: 'Molded by MG, Roewe, IM, Maxus and Rising model years. Filter the catalog by vehicle.',
        sort: 1,
      },
      {
        code: 'warranty',
        titleZh: '原厂附件质保',
        titleEn: 'OEM accessory warranty',
        bodyZh: '卡扣件与线束插接件按原厂接口设计，随车附件质保政策可在后台配置。',
        bodyEn: 'Clips and harness plugs follow OEM interfaces. Warranty copy can be updated in admin.',
        sort: 2,
      },
      {
        code: 'dealer-kit',
        titleZh: '经销商装车资料',
        titleEn: 'Dealer install pack',
        bodyZh: '每款产品含安装视频、说明书 PDF 与海报素材包，方便到店培训。',
        bodyEn: 'Each item includes install film, PDF and a poster pack for in-store training.',
        sort: 3,
      },
      {
        code: 'logistics',
        titleZh: '全球发运支持',
        titleEn: 'Global dispatch',
        bodyZh: '覆盖亚洲、欧洲、中东与拉美经销商的询盘与出货协同。',
        bodyEn: 'Inquiry and dispatch coordination for dealers in Asia, Europe, the Middle East and Latin America.',
        sort: 4,
      },
    ],
  })

  await prisma.contactPerson.createMany({
    data: [
      { regionZh: '华东', regionEn: 'East China', name: '王磊', email: 'east@saicventure.com', phone: '+86 21 0000 2001', sort: 1 },
      { regionZh: '华南', regionEn: 'South China', name: '陈倩', email: 'south@saicventure.com', phone: '+86 20 0000 2002', sort: 2 },
      { regionZh: '欧洲', regionEn: 'Europe', name: 'Anna Keller', email: 'eu@saicventure.com', phone: '+49 30 0000 2003', sort: 3 },
      { regionZh: '东南亚', regionEn: 'Southeast Asia', name: '李明', email: 'sea@saicventure.com', phone: '+66 2 000 2004', sort: 4 },
      { regionZh: '中东', regionEn: 'Middle East', name: 'Omar Haddad', email: 'me@saicventure.com', phone: '+971 4 000 2005', sort: 5 },
    ],
  })

  const pageSeos = [
    {
      pageKey: 'home',
      titleZh: '上汽经创 | 原厂附件门户',
      titleEn: 'SAIC Venture | OEM accessories',
      keywordsZh: '上汽附件,MG脚垫,荣威后备箱垫,智己迎宾踏板',
      keywordsEn: 'SAIC accessory,MG floor mat,Roewe trunk mat,IM scuff plate',
      descriptionZh: '浏览 MG、荣威、智己、大通、飞凡原厂附件，提交多产品询盘。',
      descriptionEn: 'Browse OEM accessories for MG, Roewe, IM, Maxus and Rising. Submit multi-item inquiries.',
    },
    {
      pageKey: 'products',
      titleZh: '产品中心 | 上汽附件',
      titleEn: 'Products | SAIC accessories',
      keywordsZh: '脚垫,座椅套,晴雨挡,充电收纳',
      keywordsEn: 'floor mat,seat cover,weather shield,charge bag',
      descriptionZh: '按分类与适配车型筛选上汽系装车配件。',
      descriptionEn: 'Filter SAIC vehicle accessories by category and fitment.',
    },
    {
      pageKey: 'about',
      titleZh: '关于上汽经创',
      titleEn: 'About SAIC Venture',
      keywordsZh: '上汽经创,经销商,原厂附件',
      keywordsEn: 'SAIC Venture,dealer,OEM accessory',
      descriptionZh: '上汽系车型原厂附件与全球经销商服务。',
      descriptionEn: 'OEM accessories and dealer services for SAIC vehicles.',
    },
    {
      pageKey: 'contact',
      titleZh: '区域联系 | 上汽经创',
      titleEn: 'Contact | SAIC Venture',
      keywordsZh: '经销商对接,配件询盘',
      keywordsEn: 'dealer desk,parts inquiry',
      descriptionZh: '按区域联系上汽附件对接人。',
      descriptionEn: 'Reach a regional SAIC accessory contact.',
    },
    {
      pageKey: 'join',
      titleZh: '加入我们 | 附件与海外运营',
      titleEn: 'Careers | Accessory and overseas ops',
      keywordsZh: '产品适配工程师,经销商运营',
      keywordsEn: 'fitment engineer,dealer operations',
      descriptionZh: '招聘车型适配、海外经销商运营与附件开发岗位。',
      descriptionEn: 'Hiring for vehicle fitment, overseas dealer ops and accessory development.',
    },
  ]
  for (const page of pageSeos) {
    await prisma.pageSeo.upsert({
      where: { pageKey: page.pageKey },
      update: page,
      create: page,
    })
  }

  const first = createdProducts[0]
  const second = createdProducts[4]
  if (first && second) {
    await prisma.inquiry.create({
      data: {
        company: '吉隆坡 MG 经销商',
        contactName: 'Ahmad Rahman',
        email: 'ahmad@mg-kl.example',
        phone: '+60 3 0000 3001',
        region: '东南亚',
        message: '需要 MG4 脚垫与 MIFA 9 后备箱垫的到岸报价与交期。',
        items: {
          create: [
            { productId: first.id, quantity: 20, note: '黑红配色' },
            { productId: second.id, quantity: 8, note: '七座版' },
          ],
        },
      },
    })
    await prisma.shareLink.create({
      data: {
        token: 'demo-saic-kit',
        title: 'MG / 智己 主推附件',
        productIds: JSON.stringify(createdProducts.slice(0, 4).map((row) => row.id)),
        enabled: true,
      },
    })
  }

  await prisma.contactMessage.create({
    data: {
      name: '刘婷',
      email: 'liu.ting@example.com',
      company: '广州荣威 4S',
      region: '华南',
      content: '咨询 Marvel R 座椅套气囊认证与安装工时。',
    },
  })

  console.log(
    `Seed complete: ${PRODUCTS.length} products, ${VEHICLES.length} vehicles, assets under uploads/seed`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
