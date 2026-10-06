# 域名出售展示系统（DomainForSale）

一套基于 **Hono** 的轻量系统：用同一份代码服务多个待售域名。访问某个域名时，按 `Host` 头自动展示该域名的出售页（含报价、联系方式、询价表单），并提供后台管理（域名 CRUD、批量导入 CSV、询价管理）。

**一套代码，可同时部署到 Cloudflare Pages 与腾讯云 EdgeOne Pages**（均使用 `functions/` 边缘函数 + KV 存储），推送到 GitHub 后在两家平台后台「连接仓库」即可一键部署。

---

## 功能

- 访客端：每个域名独立的出售页（按 Host 路由），含 SEO meta、询价表单。UI 采用 Premium 黑金设计系统（玻璃卡片、衬线展示标题、内联 SVG 图标），并内置可访问询价表单（行内错误 + 错误汇总 + 键盘焦点）、响应式与 `prefers-reduced-motion` / 暗色模式支持。
- **按域名预览地址**：访问 `https://<站点>/d/<域名>` 即可无需配置 DNS 单独预览某个域名的展示页（如 `https://your.pages.dev/d/example.com`）。
- **统一管理后台**：`/admin` 登录、域名列表/新增/编辑/删除、批量导入（CSV）、询价管理；域名列表为每个域名显示「访问地址」与一键复制的 **CNAME 目标**。
- **访问记录**：访客打开任意域名出售页时自动记录时间、IP、来源与入口（访客访问 / 后台预览），后台「访问记录」页可查看每个域名的访问量与明细，并支持从域名列表直接跳转到该域名的访问明细。
- 存储：KV（Cloudflare KV 与 EdgeOne KV 通用，绑定变量名 `DOMAIN_KV`）。30 个域名完全够用。
- 安全：后台密码（环境变量 `ADMIN_PASSWORD`，SHA-256 校验）+ 会话 Cookie 鉴权；询价接口防注入。

## 目录结构

```
domain-for-sale/
├── functions/[[path]].ts   # 边缘适配器（CF / EdgeOne 通用）
├── src/
│   ├── index.ts            # Hono 应用（路由 + 逻辑）
│   ├── storage.ts          # Storage 抽象 + KV 实现 + 本地内存 KV
│   ├── csv.ts              # CSV 解析
│   ├── views.ts            # HTML 模板
│   └── dev.ts             # 本地开发服务器（内存 KV）
├── data/domains.sample.csv # 导入模板示例
├── edgeone.json           # EdgeOne 配置（functions 运行时 = edge）
└── .github/workflows/     # 可选：GitHub Actions 双平台部署
```

## 本地开发

```bash
npm install
npm run dev          # 默认 http://localhost:8788
# 展示页测试（按 Host）：
curl -H "Host: example-sale.com" http://localhost:8788/
# 展示页测试（按域名预览地址，无需 DNS）：
curl http://localhost:8788/d/example-sale.com
# 后台： http://localhost:8788/admin  （默认密码 admin123）
# 设置自定义密码： ADMIN_PASSWORD=你的密码 npm run dev
```

## 部署（GitHub 一键部署）

### 0. 推送到 GitHub
```bash
git init
git remote add origin https://github.com/<你>/<仓库名>.git
git add .
git commit -m "init: 域名出售展示系统"
git branch -M main
git push -u origin main
```

### 1. Cloudflare Pages
1. 控制台 → Workers & Pages → Create → Pages → 连接 Git 仓库。
2. 框架预设选「无 / 其他」；构建命令 `npm install`，输出目录 `.`。
3. 项目设置 → 绑定 → 添加 → KV 命名空间，变量名填 `DOMAIN_KV`（本仓库不附带 wrangler.toml，绑定全部在控制台管理，按钮可直接点击）。
4. 设置环境变量：`ADMIN_PASSWORD`（后台密码）、`SITE_DOMAIN`（你的平台默认域名，如 `domain-for-sale.pages.dev`，作为所有自定义域名的 CNAME 目标）。
5. 保存后点「部署」重新部署一次，绑定才生效；以后 `git push` 即自动部署。

### 2. 腾讯云 EdgeOne Pages
1. 控制台 → EdgeOne Pages → 绑定 Github → 选择仓库。
2. 构建命令 `npm install`，输出目录 `.`（已含 `edgeone.json`）。
3. 项目 → KV 存储 → 绑定命名空间，变量名填 `DOMAIN_KV`。
4. 环境变量设置 `ADMIN_PASSWORD` 与 `SITE_DOMAIN`（平台默认域名，如 `xxx.edgeone.app`）。
5. 以后 `git push` 即自动部署。

### 3. 接入你的 30 个域名（每个域名独立访问 + CNAME）
为每个待售域名分配「独立访问地址」只需两步，无需改代码：

1. **后台添加域名资料**：`/admin/import` 粘贴 CSV（表头见 `data/domains.sample.csv`）批量导入，或逐个新增。导入后，域名列表里会直接给出该域名的「访问地址」`https://<站点>/d/<域名>`（无需 DNS 即可预览验证）。
2. **把真实域名解析到平台（CNAME）**：
   - 在你的域名注册商/DNS 处，为 `example.com` 添加一条 **CNAME 记录**，目标 = 你在 `SITE_DOMAIN` 里填的平台默认域名（如 `domain-for-sale.pages.dev`）。
   - 在平台后台「自定义域」中添加 `example.com`，等待自动签发 SSL。
   - 之后访客直接访问 `https://example.com` 即可看到该域名的出售页（按 Host 路由）。

> 后台「域名管理」页顶部会显示共用的 **CNAME 目标**，并支持一键复制；每行也有「复制 CNAME」按钮，方便逐个配置 30 个域名。

> 两个平台可同时接入同一批域名（各加自定义域），但同一域名同一时刻只能指向其中一个平台。建议先在一个平台跑通，再决定主用哪家。

### 4. 部署到自己的独立服务器（推荐：彻底绕开 CNAME / 根域名限制）

如果你有独立服务器，这是最省心的方案：**一个 Node 进程服务全部域名**，每个域名通过 **A 记录**（根域名）或 **CNAME**（子域名）指向服务器即可，不需要 Cloudflare/EdgeOne 的「自定义域名」配置，根域名也能直接用（CNAME 在根域被大多数 DNS 禁止的问题不复存在）。

> **一键部署脚本（1Panel / OpenResty / nginx 适配）**：仓库内 `deploy-server.sh` 已封装「克隆代码 → 安装 Node/pm2 + acme.sh → 配置文件存储 → 启动服务 → 生成 OpenResty 反代配置 → 批量签发 HTTPS 证书」全流程，**不安装 Caddy**，避免与 1Panel/OpenResty 抢 80/443。在服务器上以 root 执行：
> ```bash
> bash deploy-server.sh            # 进入交互菜单（部署/更新/改密码/重启/状态/证书/卸载）
> bash deploy-server.sh install    # 直接部署（交互提示后台密码）
> bash deploy-server.sh update     # 拉取最新代码并热重启（密码不变）
> bash deploy-server.sh passwd     # 修改后台密码
> bash deploy-server.sh restart    # 重启服务
> bash deploy-server.sh status     # 查看进程 / 端口 / 探活
> bash deploy-server.sh cert       # 批量签发 HTTPS 证书
> bash deploy-server.sh uninstall [--purge]   # 卸载
> ```
> 安装完成后脚本会自动创建 `domain-sale` 命令，之后在服务器任意位置执行 `domain-sale` 即可重新打开管理菜单。首次运行会自动生成后台密码并打印；重跑即拉取最新代码并热重启。可用 `REPO_URL`/`APP_DIR`/`PORT`/`ADMIN_PASSWORD`/`SITE_DOMAIN` 等变量覆盖默认值。
>
> 卸载（停 pm2 + 清 Caddy 残留 + 释放 80/443 端口）：
> ```bash
> bash deploy-server.sh uninstall          # 保留代码与数据
> bash deploy-server.sh uninstall --purge  # 连应用目录一起删（含 data/data.json）
> ```
> ⚠️ 1Panel / 宝塔面板「反向代理」的**目标 URL** 填 `127.0.0.1:8788`（host:port，**不带 `http://`**）—— 带 `http://` 会触发 `invalid port in upstream` 报错（你之前遇到的就是它）。

程序内置「文件存储模式」：数据落在本机 JSON 文件（无需 KV）。

**① 服务器运行**

```bash
npm install
# 生产模式：数据持久化到 data/data.json（无 KV 时用）
DATA_FILE=data/data.json ADMIN_PASSWORD=你的后台密码 \
SITE_DOMAIN=你的服务器域名 PORT=8788 \
npm run start
```

- 首次为空时先 `SEED=1` 跑一次写示例，再用后台 `/admin` 导入 30 个域名（导入后数据自动存进 `data/data.json`，重启不丢）。
- 后台 `/admin` 的「CNAME 目标」在自部署场景即等于 **你的服务器对外域名/IP**（访客其实用 A 记录指向它），照常复制使用即可。

**② 域名解析（每个域名独立访问）**

- 根域名（如 `hbhtcm.cn`）：DNS 添加 **A 记录** `@` → 服务器公网 IP。
- 子域名（如 `shop.example.com`）：DNS 添加 **CNAME** 记录 → 你的服务器域名。
- 30 个域名都指向同一台服务器；程序按访问的 `Host` 自动展示对应域名资料。

**③ HTTPS（1Panel / OpenResty + acme.sh 批量证书）**

两种方式任选其一：

- **方式 A · 脚本自动管证书（推荐）**：在后台导入 30 个域名后，运行 `bash deploy-server.sh cert`。脚本用 acme.sh 为全部域名签发**一张 Let's Encrypt SAN 证书**（单张上限 100 域，30 域无压力），自动写入 OpenResty 的 `conf.d/domain-for-sale.conf` 并 reload，立即启用 443 HTTPS，无需逐个登记；续期由 acme.sh 自动完成。
- **方式 B · 1Panel 面板管证书**：在 1Panel「网站 → 创建网站 → 反向代理」逐个建站点，**目标 URL 填 `127.0.0.1:8788`（不带 `http://`）**，证书用 1Panel 自带的 Let's Encrypt 申请（30 个域名重复 30 次）。

`deploy-server.sh` 已内置生成好的反代配置（无需手敲），核心结构如下：

```nginx
upstream domain_for_sale { server 127.0.0.1:8788; keepalive 32; }
server {
    listen 443 ssl;
    server_name a.com b.cn c.net;          # 全部域名，空格分隔（一张 SAN 证书覆盖）
    ssl_certificate     /root/.acme.sh/a.com/fullchain.cer;
    ssl_certificate_key /root/.acme.sh/a.com/a.com.key;
    location / {
        proxy_pass http://domain_for_sale;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> 反向代理的 `proxy_pass` 必须写成 `http://127.0.0.1:8788`（带协议）；但 1Panel 面板「目标 URL」输入框只接受 `127.0.0.1:8788`（host:port），两者并不矛盾——前者是 nginx 指令语法，后者是面板的简化填写框。

**④ 常驻进程**：用 `pm2` 或 systemd 保持后台运行。

```bash
npm i -g pm2
pm2 start "DATA_FILE=data/data.json ADMIN_PASSWORD=xxx npm run start" --name domain-for-sale
pm2 save && pm2 startup
```

> 自部署与 CF/EdgeOne 部署共用同一份代码与同一套 Host 路由逻辑，只是存储从 KV 换成文件。想切换回边缘平台时，去掉 `DATA_FILE` 环境变量、在平台绑定 `DOMAIN_KV` 即可。

## 界面与展示主题

前端已用 **shadcn-ui 设计系统**全面重构：采用 HSL 设计令牌 + 中性克制的组件原语（Button / Card / Badge / Input / Table / Alert / Stat 等），统一后台与公开端的视觉语言，并自动适配系统深浅色。**不依赖 Tailwind CDN**，避免国内网络下样式加载失败导致整页无样式。

- **统一后台界面**：左侧导航 + 内容区的 App Shell，所有管理页共用同一套组件与配色。
- **每域名可选展示主题**：在「新增 / 编辑域名」表单的「展示主题」中为每个域名挑选 5 套风格之一，仅影响访客看到的出售页，后台界面始终保持统一：
  - 经典（shadcn 标准中性）/ 极简蓝 / 科技蓝（网格底纹）/ 雅致橙（衬线标题）/ 暗夜霓虹（深色发光）。
  - 表单内以卡片选择器呈现，点击主题即在右侧 **iframe 实时预览**访客视角的出售页（`/admin/theme-preview?theme=<id>&domain=<域名>`）。
- **公开端出售页**：访客通过域名（或 `/d/<域名>?theme=<id>` 直接预览）打开，自动按所选主题渲染，并记录访问。
- 主题通过覆盖 `--primary / --background / --card / --border / --radius` 等设计令牌实现差异化，新增主题只需在 `src/themes.ts` 追加一项，后台下拉与卡片自动出现。

## 服务器管理脚本（deploy-server.sh）

`deploy-server.sh` 既是「一键部署脚本」，也是部署后的**常驻管理入口**。安装完成后会在 `/usr/local/bin/domain-sale` 建立软链，之后输入 `domain-sale` 即可重新打开交互菜单（不需要记住脚本路径）。

### 交互菜单

不带任何参数运行脚本（或执行 `domain-sale`），会进入文字菜单：

```
=========== 域名出售系统 · 管理菜单 ===========
   1) 部署 / 安装（首次）
   2) 更新（拉取最新代码 + 重启）
   3) 修改后台密码
   4) 重启服务
   5) 查看状态
   6) 申请 HTTPS 证书
   7) 卸载
   0) 退出
请选择 [1-7]:
```

选 `1` 走首次部署流程（会提示设置后台密码）；其余选项分别执行对应子命令。

### 子命令一览（也可直接命令行调用）

| 命令 | 作用 |
| --- | --- |
| `bash deploy-server.sh install` | 首次部署：克隆代码、装 Node/pm2、写文件存储、生成 pm2 配置、启动、生成反代配置，并打印后台密码 |
| `bash deploy-server.sh update` | 更新：拉取最新代码（`git pull`）+ 重新安装依赖 + 重启服务，**保持 `.deploy-env` 中的密码 / 配置不变** |
| `bash deploy-server.sh passwd` | 修改后台密码：交互输入新密码 → 写回 `.deploy-env` 与 pm2 配置 → 重启生效 |
| `bash deploy-server.sh restart` | 仅重启服务（重新加载 ecossystem 配置） |
| `bash deploy-server.sh status` | 查看 pm2 进程、端口监听、本地探活（根路径 / 后台 的 HTTP 状态码） |
| `bash deploy-server.sh cert` | 批量签发 HTTPS 证书（acme.sh 一张 SAN 证书覆盖全部域名） |
| `bash deploy-server.sh uninstall` | 卸载：停 pm2、移除反代配置、释放 80/443（保留代码与数据） |
| `bash deploy-server.sh uninstall --purge` | 彻底卸载：连应用目录一起删除（含 `data/data.json`） |

> 无人值守可用 `bash deploy-server.sh install --non-interactive`；所有可配置项（`REPO_URL`/`APP_DIR`/`PORT`/`DATA_FILE`/`ADMIN_PASSWORD`/`SITE_DOMAIN`/`SEED`/`ACME_EMAIL`/`PROXY_MODE`/`UPSTREAM_HOST`）均可用环境变量覆盖。

### 改密码的两种方式

1. **菜单 / 子命令（推荐）**：`domain-sale` → 选 `3`，或 `bash deploy-server.sh passwd`，输入新密码即生效（已自动写回配置并重启）。
2. **手动**：编辑 `/opt/domain-for-sale/.deploy-env` 的 `ADMIN_PASSWORD`，再 `bash deploy-server.sh restart`。
   ⚠️ 不要用 `pm2 restart --update-env` 单独重启——固化在进程里的环境变量不会刷新；务必用 `restart` 子命令（内部会 `pm2 delete` + `pm2 start`）。

### 访问记录（访客统计）

访客通过任意域名打开出售页（按 `Host` 路由）时，系统自动记录一条访问：时间、IP、来源（Referer）、入口（访客访问 / 后台预览）。后台「访问记录」页（`/admin/visits`）展示：

- 总访问量、有访问的域名数、最近一次访问时间；
- 各域名访问量汇总表（点击进入单域名明细）；
- 最近 100 条访问流水（域名 / 时间 / IP / 来源 / 入口）。

数据随域名记录一起落在 `data/data.json`，重启不丢；单域名访问记录上限 1000 条（滚动保留最新）。

### 常见排错

- **站点打不开 / 502**：应用进程是否在跑？`bash deploy-server.sh status` 看端口；若进程没了，跑 `restart`。
- **重跑脚本后访问不了**：旧版脚本用 `npm start` 拉起，但本机 `npm` 可能不在 PATH；现版已改为用自包含 runtime 的 `node` 绝对路径直接运行 tsx，并注入 `runtime/bin` 到 PATH，重跑不再翻车。
- **1Panel/宝塔「反向代理」目标 URL**：填 `127.0.0.1:8788`（host:port，**不带 `http://`**），带 `http://` 会触发 `invalid port in upstream`。
- **OpenResty 在 Docker 容器内（1Panel 默认）**：容器内 `127.0.0.1` 不可达宿主机，反代会 502；脚本已自动探测 docker0 网关作为反代目标（`UPSTREAM_HOST`）。

## 数据字段（CSV 表头）

`domain,price,currency,min_offer,status,category,description,tags,registrar,expires_at,buy_now_url,contact_email,contact_phone,contacts,meta_title,meta_description`

- `status`：`for_sale` / `reserved` / `sold`
- `tags`：逗号分隔
- `contacts`：JSON 字符串，如 `{"wechat":"xxx","telegram":"yyy"}`

## 说明 / 取舍

- 为「一套代码双平台」选用 KV 存储（而非 Cloudflare D1），对 30 个域名完全够用；如需更强查询/统计，可后续在 Cloudflare 侧切换为 D1（扩展 Storage 适配层即可）。
- 交易闭环未内置，展示页「立即购买」链接到外部担保交易地址即可。
