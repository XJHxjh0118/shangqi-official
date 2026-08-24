# Official Website（Nuxt SSR）

前台门户，页面均在 `app/pages/`。

## 开发

```bash
npm install
cp .env.example .env
npm run dev
```

> 请使用 **npm** 安装依赖（与 `template/start/一键启动.bat` 一致），勿混用 pnpm，否则可能出现字体等资源 404。

访问 http://localhost:3000

## 页面

| 路径 | 说明 |
|------|------|
| `/` | 首页（电梯导航、产品区块） |
| `/products` | 产品列表 |
| `/products/[slug]` | 产品详情 |
| `/inquiry` | 意向咨询 |
| `/contact` | 联系我们 |

## 站点配置

Logo、主图、SEO、关于我们、页脚等通过 API `/car/public/site-settings` 读取，在后台 **站点内容 → 站点配置** 维护。接口全局前缀为 `/car`（不是 `/api`）。

## 构建

```bash
npm run build
npm run preview
```

Docker：见根目录 `Dockerfile`。

## 基建能力

- 统一安全响应头（`x-content-type-options`、`x-frame-options` 等）
- 全局错误处理插件（`app/plugins/error-handler.client.ts`）
- 分析埋点插件（`NUXT_PUBLIC_GTAG_ID` 可选）
- 示例全局中间件（去除尾部斜杠）
- 内置健康检查接口：`/api/health`
- GEO：`<SeoGeo>` / `<SeoGeoProduct>` / `<SeoGeoItemList>` 写入 Schema.org；`/llms.txt` 供大模型抓取
- 默认静态资源：`favicon.svg`、`og-default.svg`、`manifest.webmanifest`

## 质量检查

```bash
npm run lint
npm run typecheck
npm run format
```
