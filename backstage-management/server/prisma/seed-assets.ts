import { execFileSync } from 'child_process'
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { dirname, join } from 'path'
import { ZipArchive } from 'archiver'
import sharp from 'sharp'

export type ProductKind =
  | 'floor-mat'
  | 'trunk-mat'
  | 'seat-cover'
  | 'visor'
  | 'car-cover'
  | 'scuff'
  | 'cable-bag'

export type ProductAssetSpec = {
  sku: string
  slug: string
  kind: ProductKind
  titleZh: string
  titleEn: string
  vehicleLabel: string
  accent: string
  photos?: string[]
  coverOnly?: boolean
}

export type GeneratedProductFiles = {
  cover: string
  gallery: string[]
  promo: string
  install: string
  pdf: string
  zip: string
}

export type SeedAssetMap = {
  logo: string
  favicon: string
  banners: string[]
  vehicles: Record<string, string>
  products: Record<string, GeneratedProductFiles>
}

const ROOT = join(process.cwd(), 'uploads', 'seed')
const PUBLIC = '/uploads/seed'

function url(rel: string) {
  return `${PUBLIC}/${rel.replace(/\\/g, '/')}`
}

function abs(rel: string) {
  return join(ROOT, rel)
}

function ensureFileDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true })
}

function esc(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pdfEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function resolveFfmpeg(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bin = require('ffmpeg-static') as string | null
    if (bin && existsSync(bin)) return bin
  } catch {
    /* optional */
  }
  return null
}

async function writePng(rel: string, svg: string, width: number, height: number) {
  const file = abs(rel)
  ensureFileDir(file)
  await sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(file)
  return url(rel)
}

async function writePhoto(
  rel: string,
  remoteUrl: string | undefined,
  fallbackSvg: string,
  width: number,
  height: number,
) {
  const file = abs(rel)
  ensureFileDir(file)
  if (remoteUrl) {
    try {
      const res = await fetch(remoteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SAIC-seed/1.0)',
          Accept: 'image/jpeg,image/webp,image/*',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 4000) throw new Error('too small')
      await sharp(buf)
        .resize(width, height, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 82 })
        .toFile(file)
      return url(rel)
    } catch (err) {
      console.warn(`photo fallback ${rel}:`, (err as Error).message)
    }
  }
  await sharp(Buffer.from(fallbackSvg))
    .resize(width, height, { fit: 'cover' })
    .jpeg({ quality: 82 })
    .toFile(file)
  return url(rel)
}

function writePdf(rel: string, title: string, lines: string[]) {
  const ops = [
    'BT',
    '/F1 18 Tf',
    '56 780 Td',
    `(${pdfEscape(title)}) Tj`,
    '/F1 11 Tf',
    '0 -28 Td',
    ...lines.flatMap((line, i) =>
      i === 0
        ? [`(${pdfEscape(line)}) Tj`]
        : ['0 -16 Td', `(${pdfEscape(line)}) Tj`],
    ),
    'ET',
  ].join('\n')

  let body = '%PDF-1.4\n'
  const offsets = [0]
  const obj = (n: number, content: string) => {
    offsets[n] = Buffer.byteLength(body)
    body += `${n} 0 obj\n${content}\nendobj\n`
  }
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  obj(
    3,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  )
  obj(4, `<< /Length ${Buffer.byteLength(ops)} >>\nstream\n${ops}\nendstream`)
  obj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const xref = Buffer.byteLength(body)
  body += 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 1; i <= 5; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const file = abs(rel)
  ensureFileDir(file)
  writeFileSync(file, body)
  return url(rel)
}

function writeZip(rel: string, files: Array<{ name: string; path: string }>) {
  const file = abs(rel)
  ensureFileDir(file)
  return new Promise<string>((resolve, reject) => {
    const output = createWriteStream(file)
    const archive = new ZipArchive({ zlib: { level: 9 } })
    output.on('close', () => resolve(url(rel)))
    archive.on('error', reject)
    archive.pipe(output)
    for (const item of files) {
      archive.file(item.path, { name: item.name })
    }
    void archive.finalize()
  })
}

function encodeMp4(inputPng: string, outputRel: string) {
  const ffmpeg = resolveFfmpeg()
  const outFile = abs(outputRel)
  ensureFileDir(outFile)
  if (ffmpeg) {
    execFileSync(
      ffmpeg,
      [
        '-y',
        '-loop',
        '1',
        '-i',
        inputPng,
        '-t',
        '3',
        '-vf',
        'scale=960:540:force_original_aspect_ratio=increase,crop=960:540,format=yuv420p',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '28',
        '-an',
        '-movflags',
        '+faststart',
        outFile,
      ],
      { stdio: 'ignore' },
    )
    return url(outputRel)
  }
  writeFileSync(outFile, MINI_MP4)
  return url(outputRel)
}

function carPath() {
  return 'M70 210 C90 210 108 168 150 166 H310 C338 138 392 138 418 166 H470 C498 166 512 188 512 210 H70 Z'
}

function wheels() {
  return `
    <circle cx="170" cy="214" r="22" fill="#0b0d10" stroke="#d6dde6" stroke-width="6"/>
    <circle cx="430" cy="214" r="22" fill="#0b0d10" stroke="#d6dde6" stroke-width="6"/>
  `
}

function brandSvg(width: number, height: number) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#10141a"/>
  <rect x="18" y="${height / 2 - 18}" width="8" height="36" fill="#c8102e"/>
  <text x="40" y="${height / 2 + 8}" fill="#f4f6f8" font-size="${Math.round(height * 0.38)}" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700">上汽经创</text>
</svg>`
}

function bannerSvg(title: string, subtitle: string, accent: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="720" viewBox="0 0 1600 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10141a"/>
      <stop offset="100%" stop-color="#1b2430"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="720" fill="url(#g)"/>
  <rect x="0" y="0" width="12" height="720" fill="${accent}"/>
  <g transform="translate(820 220) scale(1.6)">${wheels()}<path d="${carPath()}" fill="${accent}" opacity="0.92"/></g>
  <text x="80" y="300" fill="#f4f6f8" font-size="54" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700">${esc(title)}</text>
  <text x="80" y="360" fill="#c5ccd6" font-size="26" font-family="Microsoft YaHei, SimHei, sans-serif">${esc(subtitle)}</text>
  <text x="80" y="640" fill="#8b95a3" font-size="18" font-family="Arial, sans-serif">SAIC Venture · OEM accessory kit</text>
</svg>`
}

function vehicleSvg(brand: string, model: string, years: string, accent: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#12171e"/>
  <rect x="0" y="0" width="800" height="8" fill="${accent}"/>
  <g transform="translate(90 90)">${wheels()}<path d="${carPath()}" fill="${accent}"/></g>
  <text x="48" y="420" fill="#f4f6f8" font-size="36" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700">${esc(brand)} ${esc(model)}</text>
  <text x="48" y="458" fill="#9aa4b2" font-size="18" font-family="Arial, sans-serif">${esc(years)}</text>
</svg>`
}

function productArt(kind: ProductKind, accent: string) {
  if (kind === 'floor-mat') {
    return `
      <rect x="90" y="90" width="150" height="220" rx="18" fill="${accent}" opacity="0.95"/>
      <rect x="270" y="90" width="150" height="220" rx="18" fill="${accent}" opacity="0.8"/>
      <rect x="90" y="340" width="150" height="90" rx="14" fill="${accent}" opacity="0.7"/>
      <rect x="270" y="340" width="150" height="90" rx="14" fill="${accent}" opacity="0.55"/>`
  }
  if (kind === 'trunk-mat') {
    return `<rect x="80" y="120" width="380" height="260" rx="22" fill="${accent}"/><path d="M120 160 H420 L400 340 H140 Z" fill="#0f1318" opacity="0.25"/>`
  }
  if (kind === 'seat-cover') {
    return `
      <rect x="120" y="110" width="110" height="170" rx="18" fill="${accent}"/>
      <rect x="120" y="290" width="110" height="90" rx="16" fill="${accent}" opacity="0.75"/>
      <rect x="280" y="110" width="110" height="170" rx="18" fill="${accent}" opacity="0.85"/>
      <rect x="280" y="290" width="110" height="90" rx="16" fill="${accent}" opacity="0.6"/>`
  }
  if (kind === 'visor') {
    return `<path d="M80 200 C180 120 360 120 460 200 L430 250 C340 190 180 190 110 250 Z" fill="${accent}"/>`
  }
  if (kind === 'car-cover') {
    return `<g transform="translate(-40 40) scale(0.95)">${wheels()}<path d="${carPath()}" fill="${accent}" opacity="0.45"/><path d="M80 120 C160 60 420 60 500 140 L490 210 H90 Z" fill="${accent}"/></g>`
  }
  if (kind === 'scuff') {
    return `<rect x="70" y="220" width="400" height="36" rx="8" fill="${accent}"/><rect x="90" y="228" width="80" height="20" rx="4" fill="#f4f6f8" opacity="0.35"/>`
  }
  return `<rect x="150" y="140" width="220" height="250" rx="24" fill="${accent}"/><rect x="180" y="180" width="160" height="90" rx="12" fill="#0f1318" opacity="0.25"/>`
}

function productSvg(
  spec: ProductAssetSpec,
  angle: 'cover' | 'detail' | 'promo' | 'install',
) {
  const kicker =
    angle === 'install'
      ? 'INSTALL GUIDE'
      : angle === 'promo'
        ? 'PRODUCT FILM'
        : angle === 'detail'
          ? spec.vehicleLabel
          : spec.sku
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#10141a"/>
  <rect x="0" y="0" width="900" height="10" fill="${spec.accent}"/>
  <g transform="translate(180 80)">${productArt(spec.kind, spec.accent)}</g>
  <text x="48" y="560" fill="#8b95a3" font-size="18" font-family="Arial, sans-serif">${esc(kicker)}</text>
  <text x="48" y="610" fill="#f4f6f8" font-size="34" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700">${esc(spec.titleZh)}</text>
  <text x="48" y="650" fill="#c5ccd6" font-size="20" font-family="Arial, sans-serif">${esc(spec.titleEn)}</text>
</svg>`
}

/** 无 ffmpeg 时的占位 MP4（约 1KB，可被浏览器识别） */
const MINI_MP4 = Buffer.from(
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAsJtZGF0AAACnwYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxOWY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAE2WIhAAh/+AAg4eSQB8BAAAD6AAAH0gB4QAAAwAAD/+IARAAAAMAA///gYw=',
  'base64',
)

export async function generateSeedAssets(
  vehicles: Array<{
    code: string
    brandZh: string
    modelZh: string
    yearFrom: number
    yearTo: number
    accent: string
    photo?: string
  }>,
  products: ProductAssetSpec[],
): Promise<SeedAssetMap> {
  if (existsSync(ROOT)) rmSync(ROOT, { recursive: true, force: true })
  mkdirSync(ROOT, { recursive: true })

  const logo = await writePng('brand/logo.png', brandSvg(640, 160), 640, 160)
  const favicon = await writePng('brand/favicon.png', brandSvg(128, 128), 128, 128)

  const bannerSpecs = [
    {
      file: 'banners/oem-mats.jpg',
      title: '上汽原厂脚垫',
      subtitle: 'MG / 荣威 / 智己 车型精确开模',
      accent: '#c8102e',
      photo:
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=82',
    },
    {
      file: 'banners/ev-kit.jpg',
      title: '新能源装车附件',
      subtitle: '迎宾踏板、充电收纳与后备厢方案',
      accent: '#c4a574',
      photo:
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=82',
    },
    {
      file: 'banners/dealer.jpg',
      title: '全球经销商门户',
      subtitle: '资料包、适配查询与询盘一次完成',
      accent: '#3b82f6',
      photo:
        'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1600&q=82',
    },
  ]
  const banners: string[] = []
  for (const item of bannerSpecs) {
    banners.push(
      await writePhoto(
        item.file,
        item.photo,
        bannerSvg(item.title, item.subtitle, item.accent),
        1600,
        720,
      ),
    )
  }

  const vehicleUrls: Record<string, string> = {}
  for (const v of vehicles) {
    vehicleUrls[v.code] = await writePhoto(
      `vehicles/${v.code}.jpg`,
      v.photo,
      vehicleSvg(v.brandZh, v.modelZh, `${v.yearFrom}-${v.yearTo}`, v.accent),
      1200,
      750,
    )
  }

  const productFiles: Record<string, GeneratedProductFiles> = {}
  for (const spec of products) {
    const dir = `products/${spec.slug}`
    const coverRel = `${dir}/cover.jpg`
    const detailRel = `${dir}/detail.jpg`
    const cover = await writePhoto(
      coverRel,
      spec.photos?.[0],
      productSvg(spec, 'cover'),
      1400,
      1050,
    )
    if (spec.coverOnly) {
      productFiles[spec.sku] = {
        cover,
        gallery: [cover],
        promo: '',
        install: '',
        pdf: '',
        zip: '',
      }
      continue
    }
    const detail = await writePhoto(
      detailRel,
      spec.photos?.[1] || spec.photos?.[0],
      productSvg(spec, 'detail'),
      1400,
      1050,
    )
    const promo = encodeMp4(abs(coverRel), `${dir}/promo.mp4`)
    const install = encodeMp4(abs(detailRel), `${dir}/install.mp4`)
    const pdf = writePdf(`${dir}/install-guide.pdf`, `${spec.sku} Install Guide`, [
      spec.titleEn,
      `Fitment: ${spec.vehicleLabel}`,
      '1. Clean the cabin / cargo surface.',
      '2. Align clips or velcro to OEM points.',
      '3. Press edges and check pedal / lid clearance.',
      'Dealer note: keep this sheet with the accessory kit.',
    ])
    const zip = await writeZip(`${dir}/asset-pack.zip`, [
      { name: `${spec.sku}-cover.jpg`, path: abs(coverRel) },
      { name: `${spec.sku}-detail.jpg`, path: abs(detailRel) },
      { name: `${spec.sku}-install-guide.pdf`, path: abs(`${dir}/install-guide.pdf`) },
    ])
    productFiles[spec.sku] = {
      cover,
      gallery: [cover, detail],
      promo,
      install,
      pdf,
      zip,
    }
  }

  return { logo, favicon, banners, vehicles: vehicleUrls, products: productFiles }
}

export async function generateCoverOnly(spec: ProductAssetSpec) {
  mkdirSync(ROOT, { recursive: true })
  const dir = `products/${spec.slug}`
  const coverRel = `${dir}/cover.jpg`
  return writePhoto(
    coverRel,
    spec.photos?.[0],
    productSvg(spec, 'cover'),
    1400,
    1050,
  )
}
