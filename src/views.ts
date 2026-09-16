import { DomainRecord, InquiryRecord } from './storage'

const STYLE = `
:root{--bg:#eef1f8;--card:#ffffff;--ink:#1e293b;--muted:#64748b;--line:#e8edf5;--brand:#6d28d9;--brand2:#9333ea;--accent:#e11d48;--ok:#16a34a;--warn:#d97706;--bad:#dc2626}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;background:linear-gradient(180deg,#f3f0ff 0%,var(--bg) 240px);color:var(--ink);line-height:1.65;-webkit-font-smoothing:antialiased}
a{color:var(--brand);text-decoration:none}
.card{max-width:760px;margin:40px auto;background:var(--card);border-radius:18px;padding:34px;box-shadow:0 10px 40px rgba(76,29,149,.08);border:1px solid var(--line)}
.card.admin{max-width:1040px;padding:30px}
.topbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:18px}
.topbar h1{font-size:26px;margin:0;background:linear-gradient(90deg,var(--brand),var(--brand2));-webkit-background-clip:text;background-clip:text;color:transparent}
h1.domain{font-size:40px;margin:0;word-break:break-all;letter-spacing:-.5px}
h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:26px 0 10px}
h2:first-of-type{margin-top:8px}
.cat{display:inline-block;background:#f3e8ff;color:var(--brand2);padding:3px 12px;border-radius:999px;font-size:13px;font-weight:600}
.price-box{display:flex;flex-wrap:wrap;align-items:center;gap:16px;background:#faf5ff;border:1px solid #f0e1ff;border-radius:14px;padding:18px 20px;margin:14px 0}
.price{font-size:30px;font-weight:800;color:var(--accent)}
.price .cur{font-size:18px;font-weight:700;margin-right:4px}
.price .min{display:block;font-size:13px;color:var(--muted);font-weight:600;margin-top:2px}
.desc{white-space:pre-wrap;color:#334155;font-size:16px}
.badge{display:inline-block;padding:4px 13px;border-radius:999px;font-size:13px;font-weight:700;margin-bottom:10px}
.badge.for_sale{background:#dcfce7;color:#15803d}
.badge.reserved{background:#fef9c3;color:#a16207}
.badge.sold{background:#fee2e2;color:#b91c1c}
.btn{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(90deg,var(--brand),var(--brand2));color:#fff;border:none;padding:11px 20px;border-radius:11px;font-size:15px;font-weight:600;cursor:pointer;margin:4px 8px 4px 0;box-shadow:0 4px 14px rgba(109,40,217,.25)}
.btn:hover{filter:brightness(1.05)}
.btn.buy{background:linear-gradient(90deg,#e11d48,#f43f5e)}
.btn.ghost{background:#eef2f7;color:#475569;box-shadow:none}
.btn.sm{padding:6px 12px;font-size:13px;margin:0;box-shadow:none}
.btn.copy{background:#eef2f7;color:#475569;box-shadow:none}
.form{display:flex;flex-direction:column;gap:14px;margin-top:8px}
.form label{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600;color:#475569}
.form input,.form textarea,.form select{width:100%;padding:11px 13px;border:1px solid #d7deea;border-radius:11px;font-size:15px;font-family:inherit;background:#fff;color:var(--ink)}
.form input:focus,.form textarea:focus,.form select:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px rgba(109,40,217,.12)}
.form textarea{min-height:90px;resize:vertical}
.contacts{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.contacts li{padding:10px 14px;background:#f8fafc;border:1px solid var(--line);border-radius:11px}
.contacts a{color:var(--brand)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:16px 0 22px}
.stats div{background:linear-gradient(180deg,#fff,#faf7ff);border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center}
.stats b{display:block;font-size:26px;color:var(--brand);line-height:1.1}
table{width:100%;border-collapse:separate;border-spacing:0;margin-top:14px;font-size:14px;overflow:hidden;border-radius:12px}
th,td{text-align:left;padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:middle}
th{background:#f5f3ff;color:#5b21b6;font-weight:700;font-size:13px}
tbody tr:hover{background:#faf9ff}
.row-actions a,.row-actions button{margin-right:6px}
.link{color:var(--brand);font-weight:600}
.hint{color:#94a3b8;font-size:13px;line-height:1.5}
.err{color:var(--bad);background:#fef2f2;border:1px solid #fecaca;padding:9px 13px;border-radius:10px;display:inline-block;font-weight:600}
#msg{font-size:14px;color:var(--ok);font-weight:600;margin-top:8px;min-height:18px}
.cname-banner{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:14px 16px;margin-bottom:18px}
.cname-banner b{color:#15803d}
.cname-banner code{background:#fff;border:1px solid #bbf7d0;border-radius:8px;padding:3px 8px;font-size:13px;word-break:break-all}
.addr{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.addr .pill{background:#f1f5f9;border:1px solid var(--line);border-radius:8px;padding:3px 8px;font-size:13px}
footer.foot{text-align:center;color:#94a3b8;font-size:12px;margin:26px 0 8px}
@media(max-width:560px){.card{padding:22px;margin:18px 12px}.price-box{flex-direction:column;align-items:flex-start}h1.domain{font-size:30px}table{font-size:13px}th,td{padding:8px}td.addr{display:block}}
`

function layout(title: string, body: string, head = ''): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${head}</head><body>${body}<footer class="foot">域名出售展示系统 · 基于 Hono 驱动 Cloudflare / EdgeOne Pages</footer></body></html>`
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
  if (d.contact_email) contacts.push(`<li>邮箱：<a href="mailto:${esc(d.contact_email)}">${esc(d.contact_email)}</a></li>`)
  if (d.contact_phone) contacts.push(`<li>电话：${esc(d.contact_phone)}</li>`)
  if (d.contacts) for (const [k, v] of Object.entries(d.contacts)) contacts.push(`<li>${esc(k)}：${esc(v)}</li>`)
  const contactHtml = contacts.length ? `<ul class="contacts">${contacts.join('')}</ul>` : ''
  const buy = d.buy_now_url ? `<a class="btn buy" href="${esc(d.buy_now_url)}" target="_blank" rel="noopener">立即购买 ↗</a>` : ''
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
    <section><h2>联系方式</h2>${contactHtml || '<p class="hint">卖家暂未提供联系方式，请通过下方询价。</p>'}</section>
    <section class="inquiry"><h2>询价 / 留言</h2>
      <form id="inq" class="form">
        <input type="hidden" name="domain" value="${esc(d.domain)}">
        <label>你的称呼<input name="name" placeholder="如何称呼你" required></label>
        <label>邮箱<input name="email" type="email" placeholder="邮箱" required></label>
        <label>电话<input name="phone" placeholder="电话（选填）"></label>
        <label>留言<textarea name="message" placeholder="想了解的细节（选填）"></textarea></label>
        <button class="btn" type="submit">提交询价</button>
        <div id="msg"></div>
      </form>
    </section>
    <script>
      document.getElementById('inq').addEventListener('submit', async function(e){
        e.preventDefault();
        var f=new FormData(e.target);
        var r=await fetch('/api/inquiry',{method:'POST',body:f});
        var j=await r.json();
        document.getElementById('msg').textContent=j.message||j.error||'';
        if(j.ok) e.target.reset();
      });
    </script>
  </main>`
  return layout(title, body, head)
}

export function notFound(host: string): string {
  return layout(host || '域名', `<main class="card"><h1 class="domain">${esc(host || '该域名')}</h1><p>该域名暂无出售信息，或页面即将上线。</p><p class="hint">如果你是站长，请在后台 /admin 添加该域名的展示资料。</p></main>`)
}

export function adminLogin(error = ''): string {
  return layout(
    '后台登录',
    `<main class="card admin"><div class="topbar"><h1>域名出售 · 后台</h1></div>${error ? `<p class="err">${esc(error)}</p>` : ''}<form method="post" action="/admin/login" class="form"><label>管理员密码<input type="password" name="password" placeholder="ADMIN_PASSWORD" required></label><button class="btn" type="submit">登录</button></form><p class="hint">密码在部署平台的环境变量 ADMIN_PASSWORD 中设置（本地默认 admin123）。</p></main>`,
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
    ? `<div class="cname-banner"><b>CNAME 目标（所有域名共用）：</b> <code>${esc(siteDomain)}</code> <button class="btn copy sm" onclick="copyText('${esc(siteDomain)}', this)">复制</button><div class="hint" style="margin-top:8px">为「每个域名」在 DNS 添加 CNAME → 上述目标；再在平台控制台添加自定义域名（自动 SSL）。下表「访问地址」无需 DNS 即可预览。</div></div>`
    : `<div class="cname-banner" style="background:#fff7ed;border-color:#fed7aa"><b style="color:#c2410c">未设置 SITE_DOMAIN</b><div class="hint" style="margin-top:6px">请在部署平台添加环境变量 <code>SITE_DOMAIN</code>，值为你的平台默认域名（如 <code>domain-for-sale.pages.dev</code> 或 <code>xxx.edgeone.app</code>），保存后重新部署，这里会显示每个域名的 CNAME 目标。</div></div>`
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
        <td class="row-actions"><a class="link" href="/admin/domains/${enc(d.domain)}">编辑</a> ${cnameBtn}<form method="post" action="/admin/domains/${enc(d.domain)}/delete" style="display:inline" onsubmit="return confirm('确认删除 ${esc(d.domain)}？')"><button class="link" style="border:0;background:none;cursor:pointer;color:#dc2626;padding:0;font:inherit">删除</button></form></td>
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
     ${field('domain', '域名 *', v('domain'))}
     ${field('slug', '短标识', v('slug'))}
     ${field('price', '一口价', v('price'), 'number')}
     ${field('currency', '货币', v('currency') || 'CNY')}
     ${field('min_offer', '最低接受价', v('min_offer'), 'number')}
     ${field('status', '状态 (for_sale / reserved / sold)', v('status') || 'for_sale')}
     ${field('category', '分类', v('category'))}
     ${field('registrar', '注册商', v('registrar'))}
     ${field('expires_at', '到期日', v('expires_at'))}
     ${field('buy_now_url', '购买链接', v('buy_now_url'))}
     ${field('contact_email', '联系邮箱', v('contact_email'))}
     ${field('contact_phone', '联系电话', v('contact_phone'))}
     ${field('tags', '标签(逗号分隔)', (d?.tags || []).join(','))}
     ${field('contacts', '其他联系方式 (JSON)', contactsJson)}
     ${field('meta_title', 'SEO 标题', v('meta_title'))}
     ${field('meta_description', 'SEO 描述', v('meta_description'))}
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
