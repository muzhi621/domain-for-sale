import { DomainRecord, InquiryRecord } from './storage'

const STYLE = `
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;background:#f5f7fa;color:#1a1a1a;line-height:1.6}
.card{max-width:720px;margin:40px auto;background:#fff;border-radius:14px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.card.admin{max-width:980px}
h1{font-size:34px;margin:0 0 8px;word-break:break-all}
h2{font-size:18px;margin:24px 0 8px}
.cat{display:inline-block;background:#eef2ff;color:#4338ca;padding:2px 10px;border-radius:999px;font-size:13px;margin-bottom:8px}
.price{font-size:28px;font-weight:700;color:#e11d48;margin:12px 0}
.price .min{display:block;font-size:14px;color:#64748b;font-weight:400}
.desc{white-space:pre-wrap;color:#374151}
.badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:8px}
.badge.for_sale{background:#dcfce7;color:#15803d}
.badge.reserved{background:#fef9c3;color:#a16207}
.badge.sold{background:#fee2e2;color:#b91c1c}
.btn{display:inline-block;background:#4338ca;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:15px;cursor:pointer;text-decoration:none;margin:4px 6px 4px 0}
.btn.buy{background:#e11d48}
.btn.ghost{background:#e5e7eb;color:#374151}
.form{display:flex;flex-direction:column;gap:10px;margin-top:10px}
.form input,.form textarea{width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:10px;font-size:15px;font-family:inherit}
.form textarea{min-height:80px;resize:vertical}
.contacts{list-style:none;padding:0;margin:6px 0}
.contacts li{padding:4px 0;border-bottom:1px dashed #eee}
.contacts a{color:#4338ca}
.stats{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}
.stats div{flex:1;min-width:120px;background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:14px;text-align:center}
.stats b{display:block;font-size:24px;color:#4338ca}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #eee}
th{background:#f8fafc;color:#475569}
a.link{color:#4338ca;text-decoration:none}
.err{color:#dc2626;background:#fef2f2;padding:8px 12px;border-radius:8px;display:inline-block}
.hint{color:#94a3b8;font-size:13px}
#msg{font-size:14px;color:#15803d;margin-top:8px}
.row-actions a{margin-right:8px}
`

function layout(title: string, body: string, head = ''): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${head}</head><body>${body}</body></html>`
}
function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]!))
}
function statusLabel(s?: string): string {
  return { for_sale: '出售中', reserved: '已预订', sold: '已售出' }[s || ''] || (s || '未知')
}

export function showcase(d: DomainRecord): string {
  const title = d.meta_title || `${d.domain} | 域名出售`
  const desc = d.meta_description || d.description || `${d.domain} 正在出售，欢迎询价`
  const head = `<meta name="description" content="${esc(desc)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">`
  const priceHtml = d.price
    ? `<div class="price">${esc(d.currency || 'CNY')} ${Number(d.price).toLocaleString()}${d.min_offer ? `<span class="min">最低可接受 ${Number(d.min_offer).toLocaleString()}</span>` : ''}</div>`
    : `<div class="price">价格面议</div>`
  const contacts: string[] = []
  if (d.contact_email) contacts.push(`<li>邮箱：<a href="mailto:${esc(d.contact_email)}">${esc(d.contact_email)}</a></li>`)
  if (d.contact_phone) contacts.push(`<li>电话：${esc(d.contact_phone)}</li>`)
  if (d.contacts) for (const [k, v] of Object.entries(d.contacts)) contacts.push(`<li>${esc(k)}：${esc(v)}</li>`)
  const contactHtml = contacts.length ? `<ul class="contacts">${contacts.join('')}</ul>` : ''
  const buy = d.buy_now_url ? `<a class="btn buy" href="${esc(d.buy_now_url)}" target="_blank" rel="noopener">立即购买</a>` : ''
  const body = `
  <main class="card">
    <div class="badge ${esc(d.status || 'for_sale')}">${statusLabel(d.status)}</div>
    <h1>${esc(d.domain)}</h1>
    ${d.category ? `<div class="cat">${esc(d.category)}</div>` : ''}
    ${priceHtml}
    <p class="desc">${esc(d.description || '')}</p>
    ${buy}
    <h2>联系方式</h2>
    ${contactHtml || '<p class="hint">卖家暂未提供联系方式，请通过下方询价。</p>'}
    <h2>询价 / 留言</h2>
    <form id="inq" class="form">
      <input type="hidden" name="domain" value="${esc(d.domain)}">
      <input name="name" placeholder="你的称呼" required>
      <input name="email" type="email" placeholder="邮箱" required>
      <input name="phone" placeholder="电话（选填）">
      <textarea name="message" placeholder="留言（选填）"></textarea>
      <button class="btn" type="submit">提交询价</button>
      <div id="msg"></div>
    </form>
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
  return layout(host || '域名', `<main class="card"><h1>${esc(host || '该域名')}</h1><p>该域名暂无出售信息，或页面即将上线。</p></main>`)
}

export function adminLogin(error = ''): string {
  return layout(
    '后台登录',
    `<main class="card admin"><h1>后台登录</h1>${error ? `<p class="err">${esc(error)}</p>` : ''}<form method="post" action="/admin/login" class="form"><input type="password" name="password" placeholder="管理员密码" required><button class="btn" type="submit">登录</button></form><p class="hint">密码在部署平台的环境变量 ADMIN_PASSWORD 中设置（本地默认 admin123）。</p></main>`,
  )
}

export function adminOverview(domains: DomainRecord[], inquiries: InquiryRecord[]): string {
  const forSale = domains.filter((d) => d.status === 'for_sale').length
  const sold = domains.filter((d) => d.status === 'sold').length
  const reserved = domains.filter((d) => d.status === 'reserved').length
  const body = `<main class="card admin"><h1>概览</h1>
   <div class="stats"><div><b>${domains.length}</b>域名总数</div><div><b>${forSale}</b>在售</div><div><b>${reserved}</b>已预订</div><div><b>${sold}</b>已售</div><div><b>${inquiries.length}</b>询价</div></div>
   <p><a class="btn" href="/admin/domains">管理域名</a> <a class="btn" href="/admin/import">批量导入</a> <a class="btn" href="/admin/inquiries">查看询价</a> <a class="btn ghost" href="/admin/logout">退出</a></p></main>`
  return layout('概览', body)
}

export function adminDomains(domains: DomainRecord[]): string {
  const rows = domains
    .map(
      (d) => `<tr><td>${esc(d.domain)}</td><td>${esc(d.category || '')}</td><td>${d.price ? esc(d.currency || 'CNY') + ' ' + Number(d.price).toLocaleString() : '面议'}</td><td><span class="badge ${esc(d.status || 'for_sale')}">${statusLabel(d.status)}</span></td><td class="row-actions"><a class="link" href="/admin/domains/${enc(d.domain)}">编辑</a><form method="post" action="/admin/domains/${enc(d.domain)}/delete" style="display:inline" onsubmit="return confirm('确认删除？')"><button class="link" style="border:0;background:none;cursor:pointer;color:#dc2626">删除</button></form></td></tr>`,
    )
    .join('')
  const body = `<main class="card admin"><h1>域名管理</h1>
   <p><a class="btn" href="/admin/domains/new">+ 新增域名</a> <a class="btn" href="/admin/import">批量导入</a> <a class="btn ghost" href="/admin">返回概览</a></p>
   <table><thead><tr><th>域名</th><th>分类</th><th>价格</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="5">暂无域名，去批量导入或新增。</td></tr>'}</tbody></table></main>`
  return layout('域名管理', body)
}

function field(name: string, label: string, value = '', type = 'text'): string {
  return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}"></label>`
}

export function domainForm(d: DomainRecord | null, error = ''): string {
  const action = d ? `/admin/domains/${enc(d.domain)}` : '/admin/domains'
  const v = (k: string) => (d ? (d as any)[k] ?? '' : '')
  const contactsJson = d?.contacts ? JSON.stringify(d.contacts) : ''
  const body = `<main class="card admin"><h1>${d ? '编辑域名' : '新增域名'}</h1>${error ? `<p class="err">${esc(error)}</p>` : ''}
   <form method="post" action="${action}" class="form">
     ${field('domain', '域名*', v('domain'))}
     ${field('slug', '短标识', v('slug'))}
     ${field('price', '一口价', v('price'), 'number')}
     ${field('currency', '货币', v('currency') || 'CNY')}
     ${field('min_offer', '最低接受价', v('min_offer'), 'number')}
     ${field('status', '状态(for_sale/reserved/sold)', v('status') || 'for_sale')}
     ${field('category', '分类', v('category'))}
     ${field('registrar', '注册商', v('registrar'))}
     ${field('expires_at', '到期日', v('expires_at'))}
     ${field('buy_now_url', '购买链接', v('buy_now_url'))}
     ${field('contact_email', '联系邮箱', v('contact_email'))}
     ${field('contact_phone', '联系电话', v('contact_phone'))}
     ${field('tags', '标签(逗号分隔)', (d?.tags || []).join(','))}
     ${field('contacts', '其他联系方式(JSON)', contactsJson)}
     ${field('meta_title', 'SEO 标题', v('meta_title'))}
     ${field('meta_description', 'SEO 描述', v('meta_description'))}
     <label>描述<textarea name="description">${esc(v('description'))}</textarea></label>
     <button class="btn" type="submit">保存</button> <a class="btn ghost" href="/admin/domains">取消</a>
   </form></main>`
  return layout(d ? '编辑域名' : '新增域名', body)
}

export function importPage(): string {
  const body = `<main class="card admin"><h1>批量导入</h1>
   <p class="hint">CSV 首行表头：domain,price,currency,min_offer,status,category,description,tags,registrar,expires_at,buy_now_url,contact_email,contact_phone,contacts,meta_title,meta_description</p>
   <form id="imp" class="form">
     <textarea name="csv" placeholder="粘贴 CSV 内容，或下方选择文件"></textarea>
     <input type="file" name="file" accept=".csv">
     <button class="btn" type="submit">导入</button>
     <div id="msg"></div>
   </form>
   <p><a class="link" href="/admin/domains">返回列表</a></p>
   <script>
     document.getElementById('imp').addEventListener('submit', async function(e){
       e.preventDefault();
       var f=new FormData(e.target);
       var r=await fetch('/api/import',{method:'POST',body:f});
       var j=await r.json();
       document.getElementById('msg').textContent = j.ok ? ('成功导入 '+j.imported+' 条，跳过 '+j.skipped+' 条') : (j.error||'导入失败');
     });
   </script></main>`
  return layout('批量导入', body)
}

export function adminInquiries(inquiries: InquiryRecord[], domainMap: Map<string, DomainRecord>): string {
  const rows = inquiries
    .map((q) => {
      const d = domainMap.get(q.domain)
      const st = q.status || 'new'
      return `<tr><td>${esc(q.domain)}</td><td>${esc(q.name)}</td><td>${esc(q.email)}</td><td>${esc(q.phone || '')}</td><td>${esc(q.message || '')}</td><td><form method="post" action="/admin/inquiries/${enc(q.id)}/status" style="display:flex;gap:6px"><select name="status"><option value="new" ${st === 'new' ? 'selected' : ''}>未处理</option><option value="replied" ${st === 'replied' ? 'selected' : ''}>已回复</option><option value="closed" ${st === 'closed' ? 'selected' : ''}>已关闭</option></select><button class="btn" style="margin:0;padding:6px 10px">更新</button></form></td></tr>`
    })
    .join('')
  const body = `<main class="card admin"><h1>询价管理</h1>
   <p><a class="btn ghost" href="/admin">返回概览</a></p>
   <table><thead><tr><th>域名</th><th>姓名</th><th>邮箱</th><th>电话</th><th>留言</th><th>状态</th></tr></thead><tbody>${rows || '<tr><td colspan="6">暂无询价。</td></tr>'}</tbody></table></main>`
  return layout('询价管理', body)
}

function enc(s: string): string {
  return encodeURIComponent(s)
}
