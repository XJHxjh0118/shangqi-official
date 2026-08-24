# 生产部署指南（Docker Compose）

本模板提供 **改配置 → 一条命令启动** 的基础部署能力，适合单机 / 小型 VPS。

包含四个服务：

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| `website` | 3000 | Nuxt SSR 官网 |
| `api` | 3001 | NestJS API + Swagger |
| `admin` | 8080 | Vue 管理后台（nginx 反代 `/car`） |
| `mysql` | 3306（仅容器内） | MySQL 8 |

---

## 前置要求

- 已安装 [Docker](https://docs.docker.com/get-docker/) 与 Docker Compose v2
- 服务器开放端口：`3000`（官网）、`3001`（API）、`8080`（后台）
- 建议内存 ≥ 2GB（首次 build 较耗资源）

---

## 快速部署（IP 访问）

在项目根目录（含 `docker-compose.prod.yml` 的目录）：

### 1. 准备配置

```bash
cp .env.production.example .env.production
```

编辑 `.env.production`，至少修改：

```env
# 改成你的服务器公网 IP 或域名
NUXT_PUBLIC_SITE_URL=http://123.45.67.89:3000
NUXT_PUBLIC_API_BASE=http://123.45.67.89:3001/car
PUBLIC_BASE_URL=http://123.45.67.89:3001
NUXT_IMAGE_DOMAINS=123.45.67.89,localhost,127.0.0.1
CORS_ORIGINS=http://123.45.67.89:3000

MYSQL_ROOT_PASSWORD=你的强密码
MYSQL_PASSWORD=你的强密码
JWT_SECRET=随机长字符串
JWT_REFRESH_SECRET=随机长字符串
RUN_DB_SEED=true
```

> **CORS_ORIGINS** 必须包含官网对外 URL（协议 + 主机 + 端口），否则浏览器无法调用 API。

### 2. 构建并启动

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

首次启动会：

1. 启动 MySQL 并等待健康检查
2. API 容器执行 `prisma db push`（同步表结构）
3. `RUN_DB_SEED=true` 时写入示例数据与默认账号
4. 构建并启动 Admin、Website

查看日志：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f api
```

### 3. 验证

| 检查项 | 地址 |
|--------|------|
| 官网 | http://YOUR_IP:3000 |
| 后台 | http://YOUR_IP:8080 |
| API 健康检查 | http://YOUR_IP:3001/car/health |
| Swagger | http://YOUR_IP:3001/car/docs |

默认账号：`admin` / `admin123`（**登录后立即修改**）。

首次 seed 成功后，建议把 `.env.production` 里的 `RUN_DB_SEED` 改为 `false`，避免容器重建时重复 seed。

---

## 域名 + HTTPS（推荐）

Compose 本身不提供证书，常见做法是在前面加 **Nginx / Caddy** 反代：

```
https://www.example.com   → website:3000
https://admin.example.com → admin:80
https://api.example.com   → api:3001
```

对应 `.env.production` 示例：

```env
NUXT_PUBLIC_SITE_URL=https://www.example.com
NUXT_PUBLIC_API_BASE=https://api.example.com/car
PUBLIC_BASE_URL=https://api.example.com
NUXT_IMAGE_DOMAINS=www.example.com,api.example.com
CORS_ORIGINS=https://www.example.com
```

修改域名/HTTPS 后需 **重新 build 官网镜像**（Nuxt 公共变量在构建时写入）：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build website
```

Admin 通过 nginx 同域反代 `/car`，访问 `https://admin.example.com` 即可管理；API 也可单独暴露给官网前台调用。

### Nginx 配置示例

项目内提供可直接改域名使用的示例：[deploy/nginx.example.conf](./deploy/nginx.example.conf)

**安装步骤（Ubuntu / Debian 示例）：**

```bash
# 1. 安装 Nginx 与 certbot
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# 2. 复制并编辑配置（替换 example.com）
sudo cp deploy/nginx.example.conf /etc/nginx/sites-available/official-site.conf
sudo nano /etc/nginx/sites-available/official-site.conf

# 3. 启用站点
sudo ln -sf /etc/nginx/sites-available/official-site.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. 申请证书（按你的三个域名分别执行，或合并为一条）
sudo certbot --nginx -d www.example.com -d admin.example.com -d api.example.com

# 5. 同步 .env.production 后 rebuild 官网
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build website
```

**安全建议：** 配置好 Nginx 后，在防火墙关闭 `3000/3001/8080` 的公网入站，仅保留 `80/443`，避免绕过 HTTPS 直连容器端口。

---

## 数据持久化

Compose 已挂载两个卷：

| 卷名 | 内容 |
|------|------|
| `mysql_data` | 数据库 |
| `api_uploads` | 后台上传的图片/附件 |

备份建议定期导出 MySQL 与 `api_uploads` 卷。

---

## 常用运维命令

```bash
# 停止
docker compose --env-file .env.production -f docker-compose.prod.yml down

# 停止并删除数据卷（慎用）
docker compose --env-file .env.production -f docker-compose.prod.yml down -v

# 仅重建 API
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build api

# 进入 API 容器
docker compose --env-file .env.production -f docker-compose.prod.yml exec api sh
```

---

## 环境变量说明

| 变量 | 作用 |
|------|------|
| `NUXT_PUBLIC_SITE_URL` | 官网 canonical / SEO 根 URL |
| `NUXT_PUBLIC_API_BASE` | 浏览器访问 API 的地址（含 `/car`） |
| `PUBLIC_BASE_URL` | 上传资源对外 URL 前缀（无 `/car`） |
| `CORS_ORIGINS` | API 允许的跨域来源，逗号分隔 |
| `NUXT_IMAGE_DOMAINS` | Nuxt Image 允许的远程域名 |
| `RUN_DB_SEED` | 首次 `true`，之后改 `false` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | 鉴权密钥，生产必改 |

完整列表见 [.env.production.example](./.env.production.example)。

---

## 与本地开发的差异

| 项目 | 本地开发 | Docker 生产 |
|------|----------|-------------|
| 数据库 | SQLite（`dev.db`） | MySQL 8 |
| 启动 | `start/一键启动.bat` | `docker compose ... up` |
| Admin 端口 | 8848（Vite dev） | 8080（nginx 静态） |
| API CORS | 开发模式允许全部 | 需配置 `CORS_ORIGINS` |

本地开发不需要 Docker；只有上服务器时才用本指南。

---

## 故障排查

### 官网有页面但没有产品 / 一直 loading

- 检查 `NUXT_PUBLIC_API_BASE` 是否是浏览器能访问的地址
- 检查 `CORS_ORIGINS` 是否包含官网 URL
- 打开 `http://YOUR_IP:3001/car/health` 确认 API 正常

### Admin 登录失败

- 确认 API 健康；Admin nginx 反代依赖 `api` 服务名（Compose 内网）
- 清除浏览器 Local Storage 后重试

### API 启动报数据库连接失败

- 等待 MySQL 健康检查通过（首次可能 1～2 分钟）
- 检查 `MYSQL_PASSWORD` 与 `DATABASE_URL` 是否一致

### 修改域名后前台仍指向旧 API

- 官网镜像需重新 build（见上文「域名 + HTTPS」）

---

## 安全清单（上线前）

- [ ] 修改 `JWT_SECRET`、`JWT_REFRESH_SECRET`、MySQL 密码
- [ ] 修改默认账号 `admin` / `admin123`
- [ ] `RUN_DB_SEED=false`（首次部署完成后）
- [ ] 配置 HTTPS（外层反代）
- [ ] 防火墙仅开放必要端口
- [ ] 按需配置 `NOTIFY_WEBHOOK_URL` 或 SMTP 接收咨询通知
