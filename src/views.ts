import { DomainRecord, InquiryRecord } from './storage'

// ===== Design tokens (from ui-ux-pro-max design system: Premium black + gold) =====
const STYLE = `
:root{
  --bg:#FAFAF9; --surface:#FFFFFF; --surface-2:#F7F6F3;
  --ink:#1C1917; --ink-2:#44403C; --muted:#78716C;
  --line:#E7E5E4; --line-strong:#D6D3D1;
  --gold:#A16207; --gold-2:#CA8A04; --gold-soft:#FEF6E7; --gold-line:#FDE9C2;
  --ok:#15803D; --ok-soft:#ECFDF3; --warn:#B45309; --bad:#B91C1C; --bad-soft:#FEF2F2;
  --ring:rgba(161,98,7,.32);
  --radius:18px; --radius-sm:12px;
  --shadow:0 18px 50px -20px rgba(28,25,23,.28);
  --serif:'Cormorant Garamond',Georgia,'Songti SC','Noto Serif SC',serif;
  --sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0C0A09; --surface:#1B1714; --surface-2:#221C18;
    --ink:#FAFAF9; --ink-2:#D6D3D1; --muted:#A8A29E;
    --line:#2C2620; --line-strong:#3A322A;
    --gold:#E0B24A; --gold-2:#FACC15; --gold-soft:#2A2113; --gold-line:#4A3A1C;
    --ok:#4ADE80; --ok-soft:#0F2417; --bad:#F87171; --bad-soft:#2A1414;
    --ring:rgba(224,178,74,.35);
    --shadow:0 18px 50px -20px rgba(0,0,0,.6);
  }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:var(--sans);background:
  radial-gradient(1200px 600px at 50% -10%, rgba(161,98,7,.10), transparent 60%),
  var(--bg);
  color:var(--ink);line-height:1.65;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:var(--gold);text-decoration:none}
.card{max-width:780px;margin:48px auto;background:rgba(255,255,255,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:var(--radius);padding:38px;box-shadow:var(--shadow);position:relative;overflow:hidden}
@media (prefers-color-scheme: dark){.card{background:rgba(27,23,20,.8)}}
.card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:linear-gradient(90deg,var(--gold),var(--gold-2))}
.card.admin{max-width:1080px;padding:30px}
.topbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:20px}
.topbar h1{font-size:24px;margin:0;font-weight:700;letter-spacing:-.02em}
h1.domain{font-family:var(--serif);font-size:clamp(38px,7vw,64px);line-height:1.04;margin:6px 0 0;font-weight:600;letter-spacing:-.01em;word-break:break-all}
h1.domain::after{content:"";display:block;width:64px;height:3px;margin-top:14px;background:linear-gradient(90deg,var(--gold),var(--gold-2));border-radius:2px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:28px 0 10px;font-weight:700}
h2:first-of-type{margin-top:6px}
.cat{display:inline-block;margin-top:12px;background:var(--gold-soft);color:var(--gold);border:1px solid var(--gold-line);padding:4px 14px;border-radius:999px;font-size:13px;font-weight:600}
.badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;font-size:13px;font-weight:700}
.badge::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
.badge.for_sale{background:var(--ok-soft);color:var(--ok)}
.badge.reserved{background:var(--gold-soft);color:var(--warn)}
.badge.sold{background:var(--bad-soft);color:var(--bad)}
.price-box{display:flex;flex-wrap:wrap;align-items:center;gap:18px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:20px 22px;margin:16px 0}
.price{font-size:34px;font-weight:800;color:var(--ink);font-family:var(--sans);font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1;letter-spacing:-.01em}
.price .cur{font-size:18px;font-weight:700;margin-right:5px;color:var(--gold)}
.price .min{display:block;font-size:13px;color:var(--muted);font-weight:600;margin-top:2px;font-family:var(--sans)}
.desc{white-space:pre-wrap;color:var(--ink-2);font-size:16px}
.btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--gold),var(--gold-2));color:#fff;border:none;padding:12px 22px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin:4px 8px 4px 0;box-shadow:0 8px 20px -8px rgba(161,98,7,.6);transition:transform .18s ease,box-shadow .18s ease,filter .18s ease}
.btn:hover{transform:translateY(-1px);box-shadow:0 12px 26px -8px rgba(161,98,7,.7);filter:brightness(1.04)}
.btn:active{transform:translateY(0)}
.btn.buy{background:linear-gradient(135deg,#1C1917,#44403C)}
.btn.buy:hover{filter:brightness(1.15)}
.btn.ghost{background:transparent;color:var(--ink-2);border:1px solid var(--line-strong);box-shadow:none}
.btn.ghost:hover{background:var(--surface-2)}
.btn.sm{padding:7px 13px;font-size:13px;margin:0;box-shadow:none}
.btn.copy{background:var(--surface-2);color:var(--ink-2);border:1px solid var(--line-strong);box-shadow:none}
a.btn{text-decoration:none}
:focus-visible{outline:3px solid var(--ring);outline-offset:2px;border-radius:6px}
.form{display:flex;flex-direction:column;gap:14px;margin-top:10px}
.form .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form label{display:flex;flex-direction:column;gap:7px;font-size:14px;font-weight:600;color:var(--ink-2)}
.form input,.form textarea,.form select{width:100%;padding:12px 14px;border:1px solid var(--line-strong);border-radius:12px;font-size:15px;font-family:inherit;background:var(--surface);color:var(--ink);transition:border-color .18s ease,box-shadow .18s ease}
.form input:focus,.form textarea:focus,.form select:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px var(--ring)}
.form textarea{min-height:96px;resize:vertical}
.form .req{color:var(--bad)}
.field-err{color:var(--bad);font-size:13px;font-weight:600;margin-top:2px}
input[aria-invalid="true"],textarea[aria-invalid="true"]{border-color:var(--bad)}
.summary{background:var(--bad-soft);border:1px solid #fecaca;color:var(--bad);padding:12px 16px;border-radius:12px;font-weight:600;margin-bottom:6px}
@media (prefers-color-scheme: dark){.summary{border-color:#7f1d1d}}
.contacts{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.contacts li{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--surface-2);border:1px solid var(--line);border-radius:12px}
.contacts svg{flex:none;color:var(--gold)}
.contacts a{color:var(--ink);font-weight:600}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:16px 0 22px}
.stats div{background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center}
.stats b{display:block;font-size:26px;color:var(--gold);line-height:1.1;font-family:var(--sans);font-variant-numeric:lining-nums}
table{width:100%;border-collapse:separate;border-spacing:0;margin-top:14px;font-size:14px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:middle}
th{background:var(--surface-2);color:var(--ink-2);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover{background:var(--surface-2)}
.row-actions a,.row-actions button{margin-right:6px}
.link{color:var(--gold);font-weight:600}
.hint{color:var(--muted);font-size:13px;line-height:1.55}
.err{color:var(--bad);background:var(--bad-soft);border:1px solid #fecaca;padding:10px 14px;border-radius:10px;display:inline-block;font-weight:600}
#msg{font-size:14px;color:var(--ok);font-weight:600;margin-top:8px;min-height:18px}
.cname-banner{background:var(--gold-soft);border:1px solid var(--gold-line);border-radius:14px;padding:15px 17px;margin-bottom:18px}
.cname-banner b{color:var(--gold)}
.cname-banner code{background:var(--surface);border:1px solid var(--gold-line);border-radius:8px;padding:3px 9px;font-size:13px;word-break:break-all}
.cname-banner.warn{background:#FFF7ED;border-color:#FED7AA}
.cname-banner.warn b{color:#C2410C}
.addr{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.addr .pill{background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:3px 9px;font-size:13px;word-break:break-all}
footer.foot{text-align:center;color:var(--muted);font-size:12px;margin:28px 0 10px}
@media (max-width:640px){.card{padding:22px;margin:18px 12px}.form .grid2{grid-template-columns:1fr}table{font-size:13px}th,td{padding:9px 8px}td.addr{display:block}}
@media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}
`

function layout(title: string, body: string, head = ''): string {
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${fonts}${head}<style>${STYLE}</style></head><body>${body}<footer class="foot">域名出售展示系统 · 基于 Hono 驱动 Cloudflare / EdgeOne Pages</footer></body></html>`
}
function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]!))
}
function statusLabel(s?: string): string {
  return { for_sale: '出售中', reserved: '已预订', sold: '已售出' }[s || ''] || (s || '未知')
}
function enc(s: string): string {
  return encodeURIComponent(s)
}
function previewUrl(host: string, domain: string): string {
  return `https://${host || 'localhost'}/d/${enc(domain)}`
}
const ICON = {
  mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>',
  chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  link: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
}
const COPY_JS = `<script>
function copyText(t, btn){
  var done=function(){var o=btn.textContent;btn.textContent='已复制';setTimeout(function(){btn.textContent=o;},1200);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){window.prompt('复制失败，请手动复制：',t);});}
  else{window.prompt('复制以下 CNAME 目标：',t);}
}
</script>`

export function showcase(d: DomainRecord): string {
  const title = d.meta_title || `${d.domain} | 域名出售`
  const desc = d.meta_description || d.description || `${d.domain} 正在出售，欢迎询价`
  const head = `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="https://${esc(d.domain)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="https://${esc(d.domain)}"><meta property="og:type" content="website">`
  const priceHtml = d.price
    ? `<div class="price"><span class="cur">${esc(d.currency || 'CNY')}</span>${Number(d.price).toLocaleString()}${d.min_offer ? `<span class="min">最低可接受 ${Number(d.min_offer).toLocaleString()}</span>` : ''}</div>`
    : `<div class="price">价格面议</div>`
  const contacts: string[] = []
  if (d.contact_email) contacts.push(`<li>${ICON.mail}<span>邮箱：<a href="mailto:${esc(d.contact_email)}">${esc(d.contact_email)}</a></span></li>`)
  if (d.contact_phone) contacts.push(`<li>${ICON.phone}<span>电话：${esc(d.contact_phone)}</span></li>`)
  if (d.contacts) for (const [k, v] of Object.entries(d.contacts)) contacts.push(`<li>${ICON.chat}<span>${esc(k)}：${esc(v)}</span></li>`)
  const contactHtml = contacts.length ? `<ul class="contacts">${contacts.join('')}</ul>` : ''
  const buy = d.buy_now_url ? `<a class="btn buy" href="${esc(d.buy_now_url)}" target="_blank" rel="noopener">立即购买 ${ICON.link}</a>` : ''
  const body = `
  <main class="card showcase">
    <header>
      <div class="badge ${esc(d.status || 'for_sale')}">${statusLabel(d.status)}</div>
      <h1 class="domain">${esc(d.domain)}</h1>
      ${d.category ? `<div class="cat">${esc(d.category)}</div>` : ''}
    </header>
    <section class="price-box">
      ${priceHtml}
      ${buy}
    </section>
    <section><h2>域名简介</h2><p class="desc">${esc(d.description || '暂无介绍')}</p></section>
    <section><h2>联系方式</h2>${contactHtml || '<p class="hint">卖家暂未提供联系方式，请通过下方表单询价。</p>'}</section>
    <section class="inquiry"><h2>询价 / 留言</h2>
      <form id="inq" class="form" novalidate>
        <div id="form-summary" class="summary" role="alert" tabindex="-1" hidden></div>
        <div class="grid2">
          <label for="name">你的称呼 <span class="req">*</span><input id="name" name="name" placeholder="如何称呼你" required aria-describedby="name-err"><span id="name-err" class="field-err" aria-live="polite"></span></label>
          <label for="email">邮箱 <span class="req">*</span><input id="email" name="email" type="email" placeholder="you@example.com" required aria-describedby="email-err"><span id="email-err" class="field-err" aria-live="polite"></span></label>
        </div>
        <label for="phone">电话（选填）<input id="phone" name="phone" placeholder="电话"></label>
        <label for="message">留言（选填）<textarea id="message" name="message" placeholder="想了解的细节"></textarea></label>
        <input type="hidden" name="domain" value="${esc(d.domain)}">
        <button class="btn" type="submit">提交询价 ${ICON.chat}</button>
        <div id="msg"></div>
      </form>
    </section>
    <script>
      document.getElementById('inq').addEventListener('submit', async function(e){
        e.preventDefault();
        var f=e.target, ok=true, errs=[];
        var name=f.name.value.trim(), email=f.email.value.trim();
        var ne=document.getElementById('name-err'), ee=document.getElementById('email-err');
        ne.textContent=''; ee.textContent=''; f.name.removeAttribute('aria-invalid'); f.email.removeAttribute('aria-invalid');
        if(!name){ ok=false; ne.textContent='请填写称呼'; f.name.setAttribute('aria-invalid','true'); errs.push('称呼'); }
        if(!email){ ok=false; ee.textContent='请填写邮箱'; f.email.setAttribute('aria-invalid','true'); errs.push('邮箱'); }
        else if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ ok=false; ee.textContent='邮箱格式不正确'; f.email.setAttribute('aria-invalid','true'); errs.push('邮箱格式'); }
        if(!ok){
          var s=document.getElementById('form-summary');
          s.hidden=false; s.textContent='请修正以下问题：'+errs.join('、'); s.focus();
          return;
        }
        var fd=new FormData(f);
        var r=await fetch('/api/inquiry',{method:'POST',body:fd});
        var j=await r.json();
        document.getElementById('msg').textContent=j.message||j.error||'';
        if(j.ok){ f.reset(); document.getElementById('form-summary').hidden=true; }
      });
    </script>
  </main>`
  return layout(title, body, head)
}

export function notFound(host: string): string {
  return layout(host || '域名', `<main class="card"><header><h1 class="domain">${esc(host || '该域名')}</h1></header><p>该域名暂无出售信息，或页面即将上线。</p><p class="hint">如果你是站长，请在后台 /admin 添加该域名的展示资料。</p></main>`)
}

export function adminLogin(error = ''): string {
  return layout(
    '后台登录',
    `<main class="card admin"><div class="topbar"><h1>域名出售 · 后台</h1></div>${error ? `<p class="err">${esc(error)}</p>` : ''}<form method="post" action="/admin/login" class="form"><label for="pw">管理员密码<input id="pw" type="password" name="password" placeholder="ADMIN_PASSWORD" required></label><button class="btn" type="submit">登录</button></form><p class="hint">密码在部署平台的环境变量 ADMIN_PASSWORD 中设置（本地默认 admin123）。</p></main>`,
  )
}

export function adminOverview(domains: DomainRecord[], inquiries: InquiryRecord[], siteDomain = '', host = ''): string {
  const forSale = domains.filter((d) => d.status === 'for_sale').length
  const sold = domains.filter((d) => d.status === 'sold').length
  const reserved = domains.filter((d) => d.status === 'reserved').length
  const cnameBanner = siteDomain
    ? `<div class="cname-banner"><b>CNAME 目标（所有自定义域名共用）：</b> <code>${esc(siteDomain)}</code> <button class="btn copy sm" onclick="copyText('${esc(siteDomain)}', this)">复制</button><div class="hint" style="margin-top:8px">在 DNS 为「每个域名」添加 CNAME 记录指向该目标，再到平台控制台添加自定义域名（自动签发 SSL）即可独立访问。</div></div>`
    : ''
  const body = `<main class="card admin"><div class="topbar"><h1>概览</h1></div>
   ${cnameBanner}
   <div class="stats"><div><b>${domains.length}</b>域名总数</div><div><b>${forSale}</b>在售</div><div><b>${reserved}</b>已预订</div><div><b>${sold}</b>已售</div><div><b>${inquiries.length}</b>询价</div></div>
   <p><a class="btn" href="/admin/domains">管理域名</a> <a class="btn" href="/admin/import">批量导入</a> <a class="btn" href="/admin/inquiries">查看询价</a> <a class="btn ghost" href="/admin/logout">退出</a></p></main>`
  return layout('概览', body + COPY_JS)
}

export function adminDomains(domains: DomainRecord[], siteDomain = '', host = ''): string {
  const cnameBanner = siteDomain
    ? `<div class="cname-banner"><b>CNAME 目标（所有域名共用）：</b> <code>${esc(siteDomain)}</code> <button class="btn copy sm" onclick="copyText('${esc(siteDomain)}', this)">复制</button><div class="hint" style="margin-top:8px">为「每个域名」在 DNS 添加 CNAME → 上述目标；再在平台控制台添加自定义域名（自动 SSL）。下表「访问地址」无需 DNS 即可预览。<br>⚠️ 注意：① CNAME 记录值只填<b>纯域名</b>（如 <code>xxx.pages.dev</code>），不要带 <code>https://</code> 或末尾斜杠；② <b>根域名</b>（如 <code>hbhtcm.cn</code>）多数 DNS 服务商不允许直接 CNAME，可改用「显性 URL 转发」到 <code>/d/域名</code> 预览地址，或把 DNS 迁到 Cloudflare 用 CNAME 扁平化。</div></div>`
    : `<div class="cname-banner warn"><b>未设置 SITE_DOMAIN</b><div class="hint" style="margin-top:6px">请在部署平台添加环境变量 <code>SITE_DOMAIN</code>，值为你的平台默认域名（如 <code>domain-for-sale.pages.dev</code> 或 <code>xxx.edgeone.app</code>），保存后重新部署，这里会显示每个域名的 CNAME 目标。</div></div>`
  const rows = domains
    .map((d) => {
      const pu = previewUrl(host, d.domain)
      const cnameBtn = siteDomain ? `<button class="btn copy sm" onclick="copyText('${esc(siteDomain)}', this)">复制CNAME</button>` : ''
      return `<tr>
        <td><b>${esc(d.domain)}</b></td>
        <td>${esc(d.category || '—')}</td>
        <td>${d.price ? esc(d.currency || 'CNY') + ' ' + Number(d.price).toLocaleString() : '面议'}</td>
        <td><span class="badge ${esc(d.status || 'for_sale')}">${statusLabel(d.status)}</span></td>
        <td class="addr"><a class="link" href="${pu}" target="_blank">预览 ↗</a><span class="pill">${esc(pu)}</span></td>
        <td class="row-actions"><a class="link" href="/admin/domains/${enc(d.domain)}">编辑</a> ${cnameBtn}<form method="post" action="/admin/domains/${enc(d.domain)}/delete" style="display:inline" onsubmit="return confirm('确认删除 ${esc(d.domain)}？')"><button class="link" style="border:0;background:none;cursor:pointer;color:#b91c1c;padding:0;font:inherit">删除</button></form></td>
      </tr>`
    })
    .join('')
  const body = `<main class="card admin"><div class="topbar"><h1>域名管理</h1><div><a class="btn" href="/admin/domains/new">+ 新增域名</a> <a class="btn" href="/admin/import">批量导入</a> <a class="btn ghost" href="/admin">概览</a></div></div>
   ${cnameBanner}
   <table><thead><tr><th>域名</th><th>分类</th><th>价格</th><th>状态</th><th>访问地址（无需 DNS 预览）</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="6">暂无域名，去批量导入或新增。</td></tr>'}</tbody></table></main>`
  return layout('域名管理', body + COPY_JS)
}

function field(name: string, label: string, value = '', type = 'text'): string {
  return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}"></label>`
}

export function domainForm(d: DomainRecord | null, error = ''): string {
  const action = d ? `/admin/domains/${enc(d.domain)}` : '/admin/domains'
  const v = (k: string) => (d ? (d as any)[k] ?? '' : '')
  const contactsJson = d?.contacts ? JSON.stringify(d.contacts) : ''
  const body = `<main class="card admin"><div class="topbar"><h1>${d ? '编辑域名' : '新增域名'}</h1><a class="btn ghost" href="/admin/domains">返回列表</a></div>${error ? `<p class="err">${esc(error)}</p>` : ''}
   <form method="post" action="${action}" class="form">
     <div class="grid2">${field('domain', '域名 *', v('domain'))}${field('slug', '短标识', v('slug'))}</div>
     <div class="grid2">${field('price', '一口价', v('price'), 'number')}${field('currency', '货币', v('currency') || 'CNY')}</div>
     <div class="grid2">${field('min_offer', '最低接受价', v('min_offer'), 'number')}${field('status', '状态 (for_sale / reserved / sold)', v('status') || 'for_sale')}</div>
     <div class="grid2">${field('category', '分类', v('category'))}${field('registrar', '注册商', v('registrar'))}</div>
     <div class="grid2">${field('expires_at', '到期日', v('expires_at'))}${field('buy_now_url', '购买链接', v('buy_now_url'))}</div>
     <div class="grid2">${field('contact_email', '联系邮箱', v('contact_email'))}${field('contact_phone', '联系电话', v('contact_phone'))}</div>
     ${field('tags', '标签(逗号分隔)', (d?.tags || []).join(','))}
     ${field('contacts', '其他联系方式 (JSON)', contactsJson)}
     <div class="grid2">${field('meta_title', 'SEO 标题', v('meta_title'))}${field('meta_description', 'SEO 描述', v('meta_description'))}</div>
     <label>描述<textarea name="description">${esc(v('description'))}</textarea></label>
     <div><button class="btn" type="submit">保存</button> <a class="btn ghost" href="/admin/domains">取消</a></div>
   </form></main>`
  return layout(d ? '编辑域名' : '新增域名', body)
}

export function importPage(): string {
  const body = `<main class="card admin"><div class="topbar"><h1>批量导入</h1><a class="btn ghost" href="/admin/domains">返回列表</a></div>
   <p class="hint">CSV 首行表头：domain,price,currency,min_offer,status,category,description,tags,registrar,expires_at,buy_now_url,contact_email,contact_phone,contacts,meta_title,meta_description</p>
   <form id="imp" class="form">
     <label>粘贴 CSV 内容<textarea name="csv" placeholder="example-sale.com,8888,CNY,6000,for_sale,品牌,优质短域名..."></textarea></label>
     <label>或选择文件<input type="file" name="file" accept=".csv"></label>
     <button class="btn" type="submit">导入</button>
     <div id="msg"></div>
   </form></main>`
  return layout('批量导入', body + `<script>
     document.getElementById('imp').addEventListener('submit', async function(e){
       e.preventDefault();
       var f=new FormData(e.target);
       var r=await fetch('/api/import',{method:'POST',body:f});
       var j=await r.json();
       document.getElementById('msg').textContent = j.ok ? ('成功导入 '+j.imported+' 条，跳过 '+j.skipped+' 条') : (j.error||'导入失败');
     });
   </script>`)
}

export function adminInquiries(inquiries: InquiryRecord[], domainMap: Map<string, DomainRecord>): string {
  const rows = inquiries
    .map((q) => {
      const d = domainMap.get(q.domain)
      const st = q.status || 'new'
      return `<tr><td><b>${esc(q.domain)}</b></td><td>${esc(q.name)}</td><td>${esc(q.email)}</td><td>${esc(q.phone || '—')}</td><td>${esc(q.message || '—')}</td><td><form method="post" action="/admin/inquiries/${enc(q.id)}/status" style="display:flex;gap:6px"><select name="status"><option value="new" ${st === 'new' ? 'selected' : ''}>未处理</option><option value="replied" ${st === 'replied' ? 'selected' : ''}>已回复</option><option value="closed" ${st === 'closed' ? 'selected' : ''}>已关闭</option></select><button class="btn sm" type="submit">更新</button></form></td></tr>`
    })
    .join('')
  const body = `<main class="card admin"><div class="topbar"><h1>询价管理</h1><a class="btn ghost" href="/admin">概览</a></div>
   <table><thead><tr><th>域名</th><th>姓名</th><th>邮箱</th><th>电话</th><th>留言</th><th>状态</th></tr></thead><tbody>${rows || '<tr><td colspan="6">暂无询价。</td></tr>'}</tbody></table></main>`
  return layout('询价管理', body)
}
