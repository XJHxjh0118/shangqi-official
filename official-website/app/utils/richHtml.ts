import { resolveAssetUrl } from '~/utils/media'

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i

export function isRichHtml(value: string) {
  return HTML_TAG_RE.test(value)
}

export function sanitizeRichHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*("|')[\s\S]*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
}

export function rewriteRichHtmlAssets(html: string, apiBase: string) {
  return html.replace(
    /(src|href)=("|')([^"']+)\2/gi,
    (full, attr: string, quote: string, url: string) => {
      const isUpload =
        /\/uploads(\/|$)/i.test(url) || /^https?:\/\/[^/]+\/uploads(\/|$)/i.test(url)
      if (attr.toLowerCase() === 'href' && !isUpload) return full
      const resolved = resolveAssetUrl(url, apiBase)
      return resolved ? `${attr}=${quote}${resolved}${quote}` : full
    },
  )
}

export function prepareRichHtml(html: string, apiBase: string) {
  return rewriteRichHtmlAssets(sanitizeRichHtml(html), apiBase)
}
