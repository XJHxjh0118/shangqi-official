# Official Site API Server

NestJS + Prisma + SQLite 模板 API。

## 快速启动

```bash
cd backstage-management/server
cp .env.example .env
npm install
npm run prisma:generate
npm exec prisma db push --accept-data-loss   # 首次或 schema 变更后
npm run prisma:seed
npm run start:dev
```

> 请使用项目内的 Prisma（`npm run` / `npm exec prisma`），勿用全局 `npx prisma`（可能是 v7，与 schema 不兼容）。

- API: http://localhost:3001/car
- Swagger: http://localhost:3001/car/docs
- 默认账号: `admin` / `admin123`
- Seed 会生成 10 款上汽系附件（脚垫/后备箱垫等）及小体积图片、视频、PDF、ZIP，目录在 `uploads/seed/`

## 主要模块

- `/car/cms/site-settings/detail` — 站点配置（Logo、SEO、主图等）
- `/car/public/site-settings` — 前台公开读取
- `/car/product/list`、`/car/cms/banner/list` — 内容与展示
