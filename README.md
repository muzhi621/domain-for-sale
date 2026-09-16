# 域名出售展示系统（DomainForSale）

一套基于 **Hono** 的轻量系统：用同一份代码服务多个待售域名。访问某个域名时，按 `Host` 头自动展示该域名的出售页（含报价、联系方式、询价表单），并提供后台管理（域名 CRUD、批量导入 CSV、询价管理）。

**一套代码，可同时部署到 Cloudflare Pages 与腾讯云 EdgeOne Pages**（均使用 `functions/` 边缘函数 + KV 存储），推送到 GitHub 后在两家平台后台「连接仓库」即可一键部署。

---

## 功能

- 访客端：每个域名独立的出售页（按 Host 路由），含 SEO meta、询价表单。UI 采用 Premium 黑金设计系统（玻璃卡片、衬线展示标题、内联 SVG 图标），并内置可访问询价表单（行内错误 + 错误汇总 + 键盘焦点）、响应式与 `prefers-reduced-motion` / 暗色模式支持。
- **按域名预览地址**：访问 `https://<站点>/d/<域名>` 即可无需配置 DNS 单独预览某个域名的展示页（如 `https://your.pages.dev/d/example.com`）。
- **统一管理后台**：`/admin` 登录、域名列表/新增/编辑/删除、批量导入（CSV）、询价管理；域名列表为每个域名显示「访问地址」与一键复制的 **CNAME 目标**。
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

## 数据字段（CSV 表头）

`domain,price,currency,min_offer,status,category,description,tags,registrar,expires_at,buy_now_url,contact_email,contact_phone,contacts,meta_title,meta_description`

- `status`：`for_sale` / `reserved` / `sold`
- `tags`：逗号分隔
- `contacts`：JSON 字符串，如 `{"wechat":"xxx","telegram":"yyy"}`

## 说明 / 取舍

- 为「一套代码双平台」选用 KV 存储（而非 Cloudflare D1），对 30 个域名完全够用；如需更强查询/统计，可后续在 Cloudflare 侧切换为 D1（扩展 Storage 适配层即可）。
- 交易闭环未内置，展示页「立即购买」链接到外部担保交易地址即可。
