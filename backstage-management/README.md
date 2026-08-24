# Backstage Management

NestJS API + Vue Admin 运营后台。

| 子目录 | 说明 |
|--------|------|
| `server/` | API、Prisma、SQLite |
| `admin/` | Vue3 + Element Plus 管理端 |

## 开发

```bash
# 根目录同时启动 API + Admin
npm install
cd server && npm install && cd ..
cd admin && pnpm install && cd ..
npm run dev
```

- API: http://127.0.0.1:3001/car/docs
- 健康检查: http://127.0.0.1:3001/car/health
- Admin: http://localhost:8848（`admin` / `admin123`）

## 后台功能

- **站点配置**：Logo、Favicon、主图、SEO、关于我们、页脚
- **联系人员**：前台联系页区域联系人
- **产品管理**：含 Excel 导入/导出
- **分类 / Banner / 咨询留言 / 账号**

## 数据库

```bash
cd server
npm run prisma:generate
npm exec prisma db push --accept-data-loss   # 首次或 schema 变更
npm run prisma:seed
```

生产环境可改用 MySQL：见 `docker-compose.yml` 与 `server/.env.example`。

**完整四服务编排**（MySQL + API + Admin + 官网）见项目根目录 [DEPLOY.md](../DEPLOY.md) 与 `docker-compose.prod.yml`。

## Docker

各子目录均有 `Dockerfile`，可按需编排部署。
