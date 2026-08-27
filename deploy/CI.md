# 手动部署（GitHub Actions）：提交 ≠ 上线，点一下才部署

用 [GitHub 仓库](https://github.com/XJHxjh0118/shangqi-official) 的 **Actions** 云端打包，再 SSH 更新阿里云。  
**不会 push 就部署**；要在 Actions 里点 **Run workflow**。

Gitee 可继续当备份仓库；流水线改用 GitHub（免费额度一般够个人项目）。

---

## 日常怎么用

```text
1. 本机改代码
2. git push github main     ← 只同步代码，不上线
3. GitHub → Actions → Manual build and deploy → Run workflow
4. deploy 选 yes → 等跑绿 → 刷新网站
```

若还要同步 Gitee：`git push origin main`

---

## 一次性设置（按顺序做）

### 1. 把代码推到 GitHub

本机项目根目录（已配置好 `github` 远程后）：

```bash
git push -u github main
```

仓库地址：https://github.com/XJHxjh0118/shangqi-official

### 2. 服务器准备部署密钥

宝塔终端执行：

```bash
ssh-keygen -t ed25519 -f /root/.ssh/github_deploy -N ""
cat /root/.ssh/github_deploy.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
yum install -y rsync || apt-get install -y rsync
mkdir -p /www/wwwroot/shangqi/{releases,deploy}
cat /root/.ssh/github_deploy
```

复制私钥全文（含 `BEGIN OPENSSH PRIVATE KEY` / `END`）。

### 3. 在 GitHub 填 Secrets

打开：仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Name | Value |
|---|---|
| `DEPLOY_HOST` | `8.134.149.243` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_PATH` | `/www/wwwroot/shangqi` |
| `DEPLOY_SSH_KEY` | 上一步**私钥**全文（不是 `.pub`） |

`DEPLOY_SSH_KEY` 粘贴要求（很重要，错了会报 `error in libcrypto`）：

1. 宝塔执行：`cat /root/.ssh/github_deploy`（或你生成的那个**无私钥后缀的文件**）
2. 内容必须以 `-----BEGIN OPENSSH PRIVATE KEY-----` 开头，以 `-----END OPENSSH PRIVATE KEY-----` 结尾
3. 整段原样粘贴进 Secret，**不要加引号**，不要只贴 `.pub` 公钥
4. 若没有密钥，重新生成：

```bash
ssh-keygen -t ed25519 -f /root/.ssh/github_deploy -N ""
cat /root/.ssh/github_deploy.pub >> /root/.ssh/authorized_keys
cat /root/.ssh/github_deploy
```

然后在 GitHub 里 **Update** `DEPLOY_SSH_KEY` 为新私钥。

可选（Variables，不是 Secrets）：若以后换域名再设

| Variable | 示例 |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | `http://8.134.149.243` |
| `NUXT_PUBLIC_API_BASE` | `http://8.134.149.243/car` |
| `NUXT_IMAGE_DOMAINS` | `8.134.149.243` |

不设也行，构建脚本里已有默认 IP。

### 4. 服务器安全组 / 防火墙

确保 GitHub Actions 出口能 SSH 到 `22` 端口（阿里云安全组放行 22；若只允许固定 IP，需改用跳板或放宽）。

### 5. 第一次手动跑起来

1. 打开 https://github.com/XJHxjh0118/shangqi-official/actions  
2. 左侧选 **Manual build and deploy**  
3. **Run workflow** → 分支 `main` → `deploy: yes` → Run  
4. 等全部绿勾；失败点进日志看是构建还是 SSH

---

## 仓库相关文件

| 文件 | 作用 |
|---|---|
| `.github/workflows/build-deploy.yml` | 仅手动触发的构建+部署 |
| `deploy/ci-build.sh` | 云端打包三个 tar.gz |
| `deploy/server-update.sh` | 服务器解压、迁移、重启 PM2 |

---

## 小结

| 问题 | 答案 |
|---|---|
| 用 GitHub 可以吗？ | 可以，推荐 |
| 一提交就部署吗？ | **不会**，要点 Run workflow |
| Gitee 还要吗？ | 可选备份；CI 用 GitHub |

首次配置好 Secrets 后，发版只要：**push 到 GitHub → Actions 点运行**。
