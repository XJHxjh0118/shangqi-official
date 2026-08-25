# DESIGN.md — 上汽经创全球经销商门户

> Source language: [Tesla on getdesign.md](https://getdesign.md/tesla/design-md) (`npx getdesign@latest add tesla`).
> Independent analysis of publicly observable Tesla patterns, adapted for SAIC dealer use. Not affiliated with Tesla.
> Spec: [Google DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/)

## Design read

B2B automotive dealer portal for global distributors. Night showroom: dark canvas, full-viewport photography as the light source, near-zero chrome, one accent. Dealers scan fitment after hours on laptops; the interface recedes so product photos carry trust. Bilingual ZH/EN, mobile first.

Dials: `DESIGN_VARIANCE 6` · `MOTION_INTENSITY 4` · `VISUAL_DENSITY 4`

Adaptation from Tesla: keep 4px radii, zero shadows, zero UI gradients, two type weights, photography-first heroes. Replace Tesla Electric Blue with SAIC Crimson. **Dark is the only theme** — not an inversion of a light site, not `prefers-color-scheme` switching.

## Colors

Composed for dim rooms. Canvas is near-black with a cool iron tint; surfaces lift one step; type stays high-contrast. Accent is reserved for primary actions.

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#0B0D11` | Page background (never `#000`) |
| `--color-surface` | `#15191F` | Media wells, form fill |
| `--color-ink` | `#F3F4F6` | Headings, primary text |
| `--color-body` | `#C5C8CE` | Body copy |
| `--color-muted` | `#A8ADB5` | Secondary, captions |
| `--color-placeholder` | `#8B919B` | Placeholders |
| `--color-hairline` | `#2A303A` | Dividers only, never card borders |
| `--color-accent` | `#C41E3A` | Primary CTA only |
| `--color-on-accent` | `#F7F7F7` | Text on accent |
| `--color-hero` | `#07080B` | Photography scrim / dark wells |
| `--color-on-hero` | `#F3F4F6` | Type and HUD marks on photography |

`html { color-scheme: dark }`. Native controls, scrollbars, and `theme-color` follow canvas.

**Canvas atmosphere (not UI chrome):** painted on `body` (fixed `::before` / `::after`), so it cannot be covered by layout stacking or hydration. Crimson instrument wash, 64px technical grid, perspective floor grid, and a 16s scan band. Pause the scan when `prefers-reduced-motion: reduce`.

## Typography

Self-hosted Outfit (Latin) + PingFang SC / Microsoft YaHei (CJK). Weights 400 and 500 only.

| Style | Size | Weight | Line | Use |
| --- | --- | --- | --- | --- |
| Hero title | clamp(28px, 4vw, 40px) | 500 | 1.2 | Banner overlay, page H1 |
| Section title | 28px | 500 | 1.2 | Home blocks |
| Product name | 17px | 500 | 1.18 | Cards, detail H1 companion |
| Nav / button | 14px | 500 | 1.2 | Header, CTA |
| Body | 14px | 400 | 1.43 | Paragraphs, forms |
| Caption | 12px | 400 | 1.35 | SKU, meta, cover flags |

## Radius / spacing / elevation

- Radius: `0` default, `4px` buttons/inputs/nav chips/cover flags, `12px` media wells, `999px` dots only.
- Space: 4 / 8 / 16 / 24 / 32 / 48. Section padding `64px 24px` desktop, `40px 16px` mobile.
- Elevation: **none**. No box-shadow. Depth from photography, surface vs canvas, opacity, and z-index.
- No gradients on UI chrome. Photography scrims and the site atmosphere wash may fade.

## Motion

- Interactive: `0.33s cubic-bezier(0.32, 0.72, 0, 1)` on transform/opacity.
- Scroll reveal: fade + 16px rise, once, 0.6s. Honor `prefers-reduced-motion`.
- Home scroll video: lerp toward target time (`tau=8`), never `play()`. Honor `prefers-reduced-motion` (snap, skip frame-bank).
- Home elevator: smooth `scrollIntoView`, current item + page progress. Hidden `<1100px`.
- Site atmosphere scan: 16s linear loop, pause with reduced motion.

## Components

**Nav:** 64px. On the home scroll-video track: transparent, `--color-on-hero` type (MG4 film is dark). After leaving the 500vh track or on inner pages: frost `color-mix(canvas 78%, transparent)` + blur. One row desktop. Hamburger → full-screen overlay on `<768px`.

**Button primary:** accent fill, 40px height, min 160px, 4px radius, 14/500, on-accent text.

**Button secondary:** canvas fill, 1px hairline, ink text, same metrics. On hero photography: `--color-on-hero` fill at 92% with hero-colored text.

**Product card:** no border, no shadow. Image 4:3 in 12px well. Cover flags (主推 / 新品 / 热门) sit top-left as 4px rectangles — not pills. Name 17/500, SKU + fitment captions. Grid: 3 columns from 1100px. List: hairline rows, 200px thumb desktop.

**Hero:** 500vh scroll track. Images come from CMS Banner (enabled, in-schedule, sort order). Sticky full-viewport crossfade, no `play()`. Overlay copy is sequential. No color overlay on the photos.

**Input:** surface fill, 40px, 4px, body 14/400. Label above. Error below. No placeholder-as-label.

**Forms (Element Plus):** map to these tokens. Overlay/dropdowns use surface, not white. No default Element blue.

## Layout families (home)

1. Full-bleed scroll-tied video hero (500vh track)
2. Featured: one large product + stacked rail (not equal cards)
3. New: coverflow carousel (center-large, edge fade); Hot: 3-col grid
4. Services: numbered stacked rows, not a 3-card row
5. Right-edge elevator on wide screens

Inner pages: page title 40/500, 24px below nav, then filters or split gallery.

**Inquiry (cart):** two columns from 960px. Line items left (photo well, name, SKU, stepper, remove). Sticky dealer form right. Stacked on mobile. No shadows.

## Do / Don't

Do: let product photos carry light and emotion. One accent. 4px controls. Bilingual nav. Keep the room dark. Let the canvas read as a night instrument bay, not a blank charcoal fill.

Don't: Inter, purple glow, neon edges, pill buttons, drop shadows, three equal feature cards, em-dashes, fake dashboards, light canvas, OS-driven theme switching.
