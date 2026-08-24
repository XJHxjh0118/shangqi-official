# DESIGN.md — 上汽经创全球经销商门户

> Source language: [Tesla on getdesign.md](https://getdesign.md/tesla/design-md) (`npx getdesign@latest add tesla`).
> Independent analysis of publicly observable Tesla patterns, adapted for SAIC dealer use. Not affiliated with Tesla.
> Spec: [Google DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/)

## Design read

B2B automotive dealer portal for global distributors. Tesla-style radical subtraction: full-viewport photography, near-zero chrome, one accent, product imagery carries the page. Trust-first, bilingual ZH/EN, mobile first.

Dials: `DESIGN_VARIANCE 6` · `MOTION_INTENSITY 4` · `VISUAL_DENSITY 4`

Adaptation from Tesla: keep 4px radii, zero shadows, zero gradients, two type weights, photography-first heroes. Replace Tesla Electric Blue with SAIC Crimson so the site is 上汽, not a Tesla clone.

## Colors

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#F7F7F7` | Page background (off-white, never `#fff`) |
| `--color-surface` | `#F4F4F4` | Soft well, form fill |
| `--color-ink` | `#171A20` | Headings, primary text |
| `--color-body` | `#393C41` | Body copy |
| `--color-muted` | `#5C5E62` | Secondary, captions |
| `--color-placeholder` | `#8E8E8E` | Placeholders |
| `--color-hairline` | `#E5E5E5` | Dividers only, never card borders |
| `--color-accent` | `#C41E3A` | Primary CTA only |
| `--color-on-accent` | `#F7F7F7` | Text on accent |
| `--color-hero` | `#171A20` | Full-bleed photography scrim / dark hero |

Dark mode (`prefers-color-scheme: dark`): canvas `#1C1F26`, surface `#242830`, ink `#F2F3F5`, body `#C8CAD0`, accent unchanged.

## Typography

Self-hosted Outfit (Latin) + PingFang SC / Microsoft YaHei (CJK). Weights 400 and 500 only.

| Style | Size | Weight | Line | Use |
| --- | --- | --- | --- | --- |
| Hero title | clamp(28px, 4vw, 40px) | 500 | 1.2 | Banner overlay, page H1 |
| Section title | 28px | 500 | 1.2 | Home blocks |
| Product name | 17px | 500 | 1.18 | Cards, detail H1 companion |
| Nav / button | 14px | 500 | 1.2 | Header, CTA |
| Body | 14px | 400 | 1.43 | Paragraphs, forms |
| Caption | 12px | 400 | 1.35 | SKU, meta |

## Radius / spacing / elevation

- Radius: `0` default, `4px` buttons/inputs/nav chips, `12px` media wells, `999px` dots only.
- Space: 4 / 8 / 16 / 24 / 32 / 48. Section padding `64px 24px` desktop, `40px 16px` mobile.
- Elevation: **none**. No box-shadow. Depth from photography, opacity, and z-index.
- No gradients on UI chrome.

## Motion

- Interactive: `0.33s cubic-bezier(0.32, 0.72, 0, 1)` on transform/opacity.
- Scroll reveal: fade + 16px rise, once, 0.6s. Honor `prefers-reduced-motion`.
- Hero carousel: 6s dwell, crossfade. Pause on hover/focus.

## Components

**Nav:** 64px, overlay on hero (transparent), frost `rgba(247,247,247,0.78)` after scroll. One row desktop. Hamburger → full-screen overlay on `<768px`.

**Button primary:** accent fill, 40px height, min 160px, 4px radius, 14/500, on-accent text.

**Button secondary:** canvas fill, 1px hairline, ink text, same metrics.

**Product card:** no border, no shadow. Image 4:3 in 12px well, name 17/500, SKU caption. List mode: 120px thumb + copy row.

**Hero:** `min-height: 100dvh`, full-bleed image, bottom-left title + two CTAs. Never `height: 100vh`.

**Input:** transparent or surface fill, 40px, 4px, body 14/400. Label above. Error below. No placeholder-as-label.

**Forms (Element Plus):** map to these tokens. No default Element blue.

## Layout families (home)

1. Full-bleed photography hero
2. Featured: one large product + stacked rail (not equal cards)
3. Hot: 4-col grid; New: horizontal snap row
4. Services: numbered stacked rows, not a 3-card row

Inner pages: page title 40/500, 24px below nav, then filters or split gallery.

## Do / Don't

Do: let product photos carry emotion. One accent. 4px controls. Bilingual nav.

Don't: Inter, purple glow, pill buttons, drop shadows, three equal feature cards, em-dashes, fake dashboards, overlay pills on images.
