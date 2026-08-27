# 方案 B（Gitee）：提交代码 ≠ 部署，点一下才部署

可以，**只用 Gitee**。  
并且已改成：**不会一 push 就部署**，要你在网页上点「运行」才打包/上线。

---

## 日常怎么用

```text
1. 本机改代码
2. git push origin main          ← 只是提交到 Gitee，不会部署
3. 打开 Gitee 流水线，点「运行」 ← 这时才云端打包并更新服务器
```

---

## 一次性设置

### 1. 把部署脚本提交到 Gitee

本机（项目根目录）：

```bash
git add deploy .gitee .github
git commit -m "chore: Gitee manual deploy pipeline"
git push origin main
```

### 2. 服务器准备 SSH 公钥（给流水线用）

宝塔终端：

```bash
ssh-keygen -t ed25519 -f /root/.ssh/gitee_deploy -N ""
cat /root/.ssh/gitee_deploy.pub >> /root/.ssh/authorized_keys
yum install -y rsync || apt-get install -y rsync
mkdir -p /www/wwwroot/shangqi/{releases,deploy}
cat /root/.ssh/gitee_deploy
```

复制私钥全文（含 `BEGIN`/`END`），下一步贴到 Gitee。

### 3. 在 Gitee 建「手动」流水线

打开仓库：https://gitee.com/taooat/shangqi-official  

1. 顶部 **流水线**（或 **Gitee Go**）→ **新建流水线**  
2. 源：当前仓库，分支 `main`  
3. **触发方式：只勾选「手动触发」**（不要勾 push / MR）  
4. 构建环境选带 Node 的 Linux（如 `ubuntu` / `Node.js 22`，没有就用通用 Linux + 自己装 Node）  
5. 构建命令填：

```bash
# 若镜像没有 Node 22，先装；有则可跳过
# 示例（按流水线文档调整）：
bash deploy/ci-build.sh
```

6. 部署步骤（SSH）：  
   - 主机：`8.134.149.243`  
   - 用户：`root`  
   - 私钥：粘贴刚才的私钥  
   - 上传文件：`dist-release/api.tar.gz`、`admin.tar.gz`、`website.tar.gz` → 服务器目录例如  
     `/www/wwwroot/shangqi/releases/$DATETIME/`  
   - 远程命令：

```bash
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p /www/wwwroot/shangqi/releases/$STAMP /www/wwwroot/shangqi/deploy
# 若流水线已把三个 tar.gz 传到某个目录，先移到 releases/$STAMP
# 下面假设当前目录已有三个包：
cp -f api.tar.gz admin.tar.gz website.tar.gz /www/wwwroot/shangqi/releases/$STAMP/ 2>/dev/null || true
# 把仓库里的脚本放到服务器（首次可先手动 scp 一次）
chmod +x /www/wwwroot/shangqi/deploy/server-update.sh
ln -sfn /www/wwwroot/shangqi/releases/$STAMP /www/wwwroot/shangqi/releases/latest
bash /www/wwwroot/shangqi/deploy/server-update.sh /www/wwwroot/shangqi/releases/latest
```

> 不同套餐的 Gitee 流水线界面略有差异：关键是 **手动触发 + 跑 `ci-build.sh` + SSH 执行 `server-update.sh`**。

### 4. 首次把更新脚本放到服务器

本机用 scp / 宝塔上传仓库里的：

`deploy/server-update.sh` → `/www/wwwroot/shangqi/deploy/server-update.sh`

```bash
chmod +x /www/wwwroot/shangqi/deploy/server-update.sh
```

---

## 以后每次发版

1. `git push origin main`（只存代码）  
2. Gitee → 流水线 → 找到这条流水线 → **运行**  
3. 等跑绿，刷新网站检查  

---

## 如果 Gitee 没有「云端 Node 构建」额度

还可以用「半自动方案 B」（仍然是点一下，但点在本机或服务器）：

### 本机构建 + 一键上传（不自动）

本机 Git Bash / WSL：

```bash
bash deploy/ci-build.sh
# 再 scp 到服务器后执行 server-update.sh
```

或继续用宝塔上传 zip（和以前一样），只是构建脚本已标准化。

---

## 仓库里相关文件

| 文件 | 作用 |
|---|---|
| `deploy/ci-build.sh` | 云端/本机打包 |
| `deploy/server-update.sh` | 服务器解压、迁移、重启 PM2 |
| `.gitee/workflows/manual-deploy.yml` | 仅手动触发（若开通 Gitee Actions） |
| `.github/workflows/build-deploy.yml` | 同样仅手动（备用，可忽略） |

**已取消「push 自动部署」。**

---

## 密钥（Gitee 流水线变量）建议

| 名称 | 值 |
|---|---|
| `DEPLOY_HOST` | `8.134.149.243` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | 服务器私钥 |
| `DEPLOY_PATH` | `/www/wwwroot/shangqi` |

官网地址若变了，构建时加环境变量：

- `NUXT_PUBLIC_SITE_URL=http://你的IP或域名`
- `NUXT_PUBLIC_API_BASE=http://你的IP或域名/car`

---

## 小结

| 问题 | 答案 |
|---|---|
| 能只用 Gitee 吗？ | 能 |
| 一提交就部署吗？ | **不会**，要手动点「运行」 |
| 服务器还 build 吗？ | 不，CI/本机打包，服务器只更新产物 |

你先在 Gitee 建好「仅手动触发」的流水线；若某一步界面和上面不一致，截图发我，我按你看到的菜单改一版对照说明。
