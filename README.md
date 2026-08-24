# Official Site Template（脚手架生成项目）



由 `create-official-site` 生成的 **Nuxt SSR 官网 + NestJS API + Vue Admin** 通用模板。



| 模块 | 目录 | 地址 |

|------|------|------|

| 官网门户 | `official-website/` | http://localhost:3000 |

| 管理后台 | `backstage-management/admin` | http://localhost:8848 |

| API / Swagger | `backstage-management/server` | http://127.0.0.1:3001/car/docs |



## 快速启动



1. 安装 [Node.js LTS](https://nodejs.org)（`^20.19` 或 `>=22.13`）

2. 首次执行：`corepack enable`（启用 pnpm）

3. 启动：
   - Windows：双击 `start/一键启动.bat`
   - macOS / Linux：`chmod +x start/start.sh && ./start/start.sh`

4. 停止：
   - Windows：`start/一键停止.bat`
   - macOS / Linux：`chmod +x start/stop.sh && ./start/stop.sh`

5. 默认账号：`admin` / `admin123`



## 定制清单



1. **后台 → 站点配置**：Logo、Favicon、主图、SEO、关于我们、页脚

2. **后台 → 联系人员**：前台联系页展示

3. **后台 → 产品管理**：替换示例内容，支持 Excel 导入/导出

4. 可选：改 `official-website/.env` 中的 `NUXT_PUBLIC_*`



## 前台结构



- 页面均在 `official-website/app/pages/`

- 首页含电梯滚动导航与区块动画

- 站点配置通过 API `/public/site-settings` 动态读取

- 404 页：`app/error.vue`



## 生产部署（Docker Compose）

单机/VPS 可改配置后一键启动，详见项目根目录 **[DEPLOY.md](./DEPLOY.md)**。

```bash
cp .env.production.example .env.production
# 编辑 IP/域名、JWT、MySQL 密码、CORS_ORIGINS
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

默认映射：官网 `:3000`、API `:3001`、后台 `:8080`。

## 已有项目同步模板



```bash

npx create-official-site upgrade ./my-site --dry-run

npx create-official-site upgrade ./my-site --yes

```



## 技术栈



- 前台：Nuxt 4 SSR、i18n、SEO

- 后台：NestJS 11 + Prisma（SQLite）+ Vue3 Element Plus



更多说明见各子目录 README。

