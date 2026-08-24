export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const site = String(config.public.siteUrl || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  )
  const name = String(config.public.siteName || 'Official Website')

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300')

  return `# ${name}

> SAIC Venture dealer portal for OEM vehicle accessories. Floor mats, trunk mats, seat covers, weather shields and EV install kits for MG, Roewe, IM, Maxus and Rising, with fitment, inquiry and contact.

## Site

- [Home](${site}/)
- [Products](${site}/products)
- [About](${site}/about)
- [Contact](${site}/contact)
- [Careers](${site}/join)
- [Inquiry](${site}/inquiry)

## Catalog

Cabin (floor mats, seat covers), cargo (trunk mats), exterior (weather shields, car covers) and EV kits (scuff plates, charge bags). Filter by vehicle model year.

## Audience

OEM / aftermarket dealers across Asia, Europe, Oceania, Southeast Asia, Americas, Middle East, Africa, Latin America and Russia.

## Optional

- [Sitemap](${site}/sitemap.xml)
`
})
