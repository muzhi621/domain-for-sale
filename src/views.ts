import { DomainRecord, InquiryRecord, VisitRecord } from './storage'
import { esc, enc, ICON, layout, foot, adminShell, badge, stat, alertBox, empty } from './ui'
import { getTheme, themeOptions, THEMES } from './themes'

// ---------- 通用片段 ----------
function previewUrl(_host: string, domain: string): string {
  // 使用相对路径，继承当前访问协议与域名（http 下不强制 https）
  return `/d/${enc(domain)}`
}
function fmtTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return esc(iso)
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
}
function money(v?: number, cur?: string): string {
  return v ? `${esc(cur || 'CNY')} ${Number(v).toLocaleString()}` : '面议'
}
function field(name: string, label: string, value = '', type = 'text', help = ''): string {
  const req = name === 'domain' ? ' <span class="req">*</span>' : ''
  return `<label class="field"><span class="lbl">${label}${req}</span>` +
    `<input class="input" name="${name}" type="${type}" value="${esc(value)}"${name === 'domain' ? ' required' : ''}>` +
    (help ? `<span class="help">${esc(help)}</span>` : '') + `</label>`
}

const THEME_SWATCH: Record<string, string> = {
  classic: '#0f172a', minimal: '#2563eb', tech: '#0ea5e9', elegant: '#c2410c', neon: '#a855f7',
}

const COPY_JS = `<script>
function copyText(t, btn){
  var done=function(){var o=btn.dataset.txt||btn.textContent;btn.textContent='已复制';setTimeout(function(){btn.textContent=o;},1200);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){window.prompt('复制失败，请手动复制：',t);});}
  else{window.prompt('请手动复制：',t);}
}
</script>`

// ============================================================
// 公开端：域名出售展示页
// ============================================================
export function showcase(d: DomainRecord, theme?: string): string {
  const title = d.meta_title || `${d.domain} | 域名出售`
  const desc = d.meta_description || d.description || `${d.domain} 正在出售，欢迎询价`
  const head = `<meta name="description" content="${esc(desc)}">` +
    `<link rel="canonical" href="https://${esc(d.domain)}">` +
    `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">` +
    `<meta property="og:url" content="https://${esc(d.domain)}"><meta property="og:type" content="website">`

  const priceHtml = d.price
    ? `<div class="price"><span class="cur">${esc(d.currency || 'CNY')}</span>${Number(d.price).toLocaleString()}` +
      (d.min_offer ? `<span class="min">最低可接受 ${Number(d.min_offer).toLocaleString()}</span>` : '') + `</div>`
    : `<div class="price">价格面议</div>`
  const buy = d.buy_now_url
    ? `<a class="btn btn-primary" href="${esc(d.buy_now_url)}" target="_blank" rel="noopener">立即购买 ${ICON.link}</a>`
    : ''

  const contacts: string[] = []
  if (d.contact_email) contacts.push(`<li>${ICON.mail}<span>邮箱：<a href="mailto:${esc(d.contact_email)}">${esc(d.contact_email)}</a></span></li>`)
  if (d.contact_phone) contacts.push(`<li>${ICON.phone}<span>电话：<a href="tel:${esc(d.contact_phone)}">${esc(d.contact_phone)}</a></span></li>`)
  if (d.contacts) for (const [k, v] of Object.entries(d.contacts)) contacts.push(`<li>${ICON.chat}<span>${esc(k)}：${esc(v)}</span></li>`)

  const metas: string[] = []
  if (d.registrar) metas.push(`<div><dt>注册商</dt><dd>${esc(d.registrar)}</dd></div>`)
  if (d.expires_at) metas.push(`<div><dt>到期时间</dt><dd>${esc(d.expires_at)}</dd></div>`)
  if (d.category) metas.push(`<div><dt>分类</dt><dd>${esc(d.category)}</dd></div>`)
  if (d.tags?.length) metas.push(`<div><dt>标签</dt><dd>${d.tags.map((t) => `<span class="badge badge-outline">${esc(t)}</span>`).join(' ')}</dd></div>`)

  const body = `
  <div class="public">
    <section class="card pub-hero">
      <div class="badges">${badge(d.status)}${d.category ? ` <span class="badge badge-outline">${esc(d.category)}</span>` : ''}</div>
      <h1 class="domain-title">${esc(d.domain)}</h1>
      <div class="price-row">
        ${priceHtml}
        <div class="wrap">${buy}<a class="btn btn-outline" href="#inquiry">询价 ${ICON.chat}</a></div>
      </div>
    </section>

    <section class="card card-pad" style="margin-top:20px">
      <h2 class="section-title">域名简介</h2>
      <p class="desc">${esc(d.description || '暂无介绍')}</p>
      ${metas.length ? `<dl class="meta-list">${metas.join('')}</dl>` : ''}
    </section>

    <section class="card card-pad" style="margin-top:20px">
      <h2 class="section-title">联系方式</h2>
      ${contacts.length ? `<ul class="contacts">${contacts.join('')}</ul>` : '<p class="muted">卖家暂未提供联系方式，请通过下方表单询价。</p>'}
    </section>

    <section class="card card-pad" id="inquiry">
      <h2 class="section-title">询价 / 留言</h2>
      <form id="inq" class="stack" novalidate>
        <div id="form-summary" class="alert error" role="alert" tabindex="-1" hidden style="margin-bottom:0"></div>
        <div class="grid grid-2">
          <label class="field"><span class="lbl">你的称呼 <span class="req">*</span></span>
            <input class="input" id="name" name="name" placeholder="如何称呼你" required aria-describedby="name-err">
            <span id="name-err" class="field-err" aria-live="polite"></span></label>
          <label class="field"><span class="lbl">邮箱 <span class="req">*</span></span>
            <input class="input" id="email" name="email" type="email" placeholder="you@example.com" required aria-describedby="email-err">
            <span id="email-err" class="field-err" aria-live="polite"></span></label>
        </div>
        <label class="field"><span class="lbl">电话（选填）</span><input class="input" id="phone" name="phone" placeholder="联系电话"></label>
        <label class="field"><span class="lbl">留言（选填）</span><textarea class="input" id="message" name="message" placeholder="想了解的细节"></textarea></label>
        <input type="hidden" name="domain" value="${esc(d.domain)}">
        <div class="row"><button class="btn btn-primary" type="submit">提交询价 ${ICON.chat}</button></div>
        <div id="msg" aria-live="polite"></div>
      </form>
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
          var s=document.getElementById('form-summary'), m=document.getElementById('msg');
          if(!ok){ s.hidden=false; s.textContent='请修正以下问题：'+errs.join('、'); s.focus(); return; }
          s.hidden=true; m.textContent='提交中…';
          try{
            var r=await fetch('/api/inquiry',{method:'POST',body:new FormData(f)});
            var j=await r.json();
            if(j.ok){ m.textContent=j.message||'提交成功'; f.reset(); }
            else { m.textContent=''; s.hidden=false; s.textContent=j.error||'提交失败，请稍后重试'; }
          }catch(err){ m.textContent=''; s.hidden=false; s.textContent='网络异常，请稍后重试'; }
        });
      </script>
    </section>
  </div>
  ${foot()}`
  const t = theme || d.theme || 'classic'
  return layout(title, body, head, getTheme(t).css)
}

export function notFound(host: string): string {
  const body = `<div class="public"><section class="card pub-hero text-center">
      <h1 class="domain-title" style="font-size:clamp(28px,6vw,44px)">${esc(host || '该域名')}</h1>
      <p class="desc" style="margin-top:18px">该域名暂无出售信息，或页面即将上线。</p>
      <p class="muted" style="font-size:14px">如果你是站长，请在后台「域名管理」中添加该域名的展示资料。</p>
    </section></div>${foot()}`
  return layout(host || '域名', body)
}

// ============================================================
// 管理端
// ============================================================
export function adminLogin(error = ''): string {
  const body = `<div class="login-wrap"><main class="card login-card">
      <div class="login-brand"><span class="mark">${ICON.shield}</span><div><b>域名出售系统</b><small>Domain For Sale · 后台登录</small></div></div>
      ${error ? alertBox('error', esc(error)) : ''}
      <form method="post" action="/admin/login" class="stack">
        <label class="field"><span class="lbl">管理员密码</span>
          <input class="input" id="pw" type="password" name="password" placeholder="请输入管理员密码" required autofocus></label>
        <button class="btn btn-primary btn-block" type="submit">登录 ${ICON.logout}</button>
      </form>
      <p class="muted" style="font-size:12.5px;margin:16px 0 0;text-align:center">
        密码由环境变量 ADMIN_PASSWORD 设置；未配置时默认 admin123
      </p>
    </main></div>`
  return layout('后台登录', body)
}

export function adminOverview(domains: DomainRecord[], inquiries: InquiryRecord[], siteDomain = '', host = ''): string {
  const count = (s: string) => domains.filter((d) => (d.status || 'for_sale') === s).length
  const fresh = inquiries.filter((q) => (q.status || 'new') === 'new').length
  const inner = `
    ${siteDomain
      ? alertBox('info', `<div><b>DNS 解析目标：</b> <code>${esc(siteDomain)}</code> —— 为每个域名添加 A 记录（或 CNAME）指向该地址即可独立访问。<br><span class="muted">提示：根域名请用 A 记录；未配置 HTTPS 证书前，请通过 http 访问。</span></div>`)
      : alertBox('warn', '<div><b>未设置 SITE_DOMAIN</b><br>请添加环境变量 SITE_DOMAIN（服务器 IP 或域名），此处将显示解析目标。</div>')}
    <div class="stats">
      ${stat(domains.length, '域名总数')}
      ${stat(count('for_sale'), '出售中')}
      ${stat(count('reserved'), '已预订')}
      ${stat(count('sold'), '已售出')}
      ${stat(inquiries.length, '询价总数')}
      ${stat(fresh, '待处理询价')}
    </div>
    <section class="card card-pad">
      <h2 class="section-title">快捷操作</h2>
      <div class="wrap">
        <a class="btn btn-primary" href="/admin/domains">${ICON.globe} 管理域名</a>
        <a class="btn btn-outline" href="/admin/domains/new">${ICON.plus} 新增域名</a>
        <a class="btn btn-outline" href="/admin/import">${ICON.upload} 批量导入</a>
        <a class="btn btn-outline" href="/admin/inquiries">${ICON.inbox} 询价（${inquiries.length}）</a>
        <a class="btn btn-outline" href="/admin/visits">${ICON.eye} 访问记录</a>
      </div>
    </section>
    <section class="card card-pad" style="margin-top:20px">
      <h2 class="section-title">最近询价</h2>
      ${inquiries.length
        ? `<div class="table-wrap"><table><thead><tr><th>域名</th><th>姓名</th><th>时间</th><th>状态</th></tr></thead><tbody>` +
          inquiries.slice(0, 5).map((q) => `<tr>
              <td data-label="域名"><b>${esc(q.domain)}</b></td>
              <td data-label="姓名">${esc(q.name)}</td>
              <td data-label="时间">${fmtTime(q.created_at)}</td>
              <td data-label="状态">${badge(q.status === 'replied' ? 'reserved' : q.status === 'closed' ? 'sold' : 'for_sale')}</td>
            </tr>`).join('') + `</tbody></table></div>`
        : empty(ICON.inbox, '暂无询价', '访客在域名页面提交询价后会显示在这里')}
    </section>`
  return adminShell('overview', inner, { title: '概览', sub: '域名资产与询价总览' })
}

export function adminDomains(domains: DomainRecord[], siteDomain = '', host = '', visits?: Map<string, { domain: string; count: number; last?: string }>): string {
  const rows = domains.map((d) => {
    const pu = previewUrl(host, d.domain)
    const v = visits?.get(d.domain)
    return `<tr>
      <td data-label="域名"><b>${esc(d.domain)}</b></td>
      <td data-label="分类">${esc(d.category || '—')}</td>
      <td data-label="价格" class="num">${money(d.price, d.currency)}</td>
      <td data-label="状态">${badge(d.status)}</td>
      <td data-label="访问量">${v && v.count ? `<a class="badge badge-outline" href="/admin/visits/${enc(d.domain)}">${v.count} 次</a>` : '0'}</td>
      <td data-label="访问地址"><a class="badge badge-outline" href="${pu}" target="_blank" rel="noopener">预览 ${ICON.link}</a></td>
      <td data-label="操作" class="row-actions">
        <a class="icon-btn" href="/admin/domains/${enc(d.domain)}">${ICON.edit} 编辑</a>
        ${siteDomain ? `<button class="icon-btn" data-txt="复制" onclick="copyText('${esc(siteDomain)}', this)">${ICON.copy} CNAME</button>` : ''}
        <form method="post" action="/admin/domains/${enc(d.domain)}/delete" style="display:inline" onsubmit="return confirm('确认删除 ${esc(d.domain)}？该操作不可恢复。')">
          <button class="icon-btn danger" type="submit">${ICON.trash} 删除</button>
        </form>
      </td>
    </tr>`
  }).join('')

  const inner = `
    ${siteDomain
      ? alertBox('info', `<div><b>DNS 解析目标（所有域名共用）：</b> <code>${esc(siteDomain)}</code>
          <button class="btn btn-sm btn-outline" data-txt="复制" onclick="copyText('${esc(siteDomain)}', this)">${ICON.copy} 复制</button>
          <br><span class="muted">为每个域名添加 A 记录（根域名）或 CNAME 指向该地址；未配置 HTTPS 证书前请用 http 访问。</span></div>`)
      : alertBox('warn', '<div><b>未设置 SITE_DOMAIN</b> —— 请添加环境变量后重新部署，这里会显示解析目标。</div>')}
    <section class="card card-pad">
      ${domains.length
        ? `<div class="table-wrap"><table><thead><tr><th>域名</th><th>分类</th><th>价格</th><th>状态</th><th>访问量</th><th>访问地址</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : empty(ICON.globe, '暂无域名', '点击「新增域名」或「批量导入」开始')}
    </section>${COPY_JS}`
  return adminShell('domains', inner, {
    title: '域名管理',
    sub: `共 ${domains.length} 个域名`,
    actions: `<a class="btn btn-primary" href="/admin/domains/new">${ICON.plus} 新增域名</a><a class="btn btn-outline" href="/admin/import">${ICON.upload} 批量导入</a>`,
  })
}

export function domainForm(d: DomainRecord | null, error = ''): string {
  const action = d ? `/admin/domains/${enc(d.domain)}` : '/admin/domains'
  const v = (k: string) => (d ? String((d as any)[k] ?? '') : '')
  const contactsJson = d?.contacts ? JSON.stringify(d.contacts) : ''
  const section = (title: string, bodyHtml: string) =>
    `<section class="card card-pad"><h2 class="section-title">${title}</h2>${bodyHtml}</section>`
  const inner = `
    ${error ? alertBox('error', esc(error)) : ''}
    <form method="post" action="${action}" class="stack">
      ${section('基础信息', `
        <div class="grid grid-2">${field('domain', '域名 *', v('domain'), 'text', '如 example.com，保存后自动转小写')}${field('slug', '短标识（可选）', v('slug'))}</div>
        <div class="grid grid-2">${field('category', '分类', v('category'))}${field('tags', '标签（逗号分隔）', (d?.tags || []).join(','))}</div>
        <label class="field"><span class="lbl">描述</span><textarea class="input" name="description">${esc(v('description'))}</textarea></label>
      `)}
      ${section('价格与状态', `
        <div class="grid grid-2">${field('price', '一口价', v('price'), 'number')}${field('currency', '货币', v('currency') || 'CNY')}</div>
        <div class="grid grid-2">${field('min_offer', '最低接受价', v('min_offer'), 'number')}${field('status', '状态', v('status') || 'for_sale', 'text', 'for_sale / reserved / sold')}</div>
        <div class="grid grid-2">${field('registrar', '注册商', v('registrar'))}${field('expires_at', '到期日', v('expires_at'), 'text', '如 2027-01-01')}</div>
        ${field('buy_now_url', '立即购买链接（可选）', v('buy_now_url'), 'text', '填写后展示页出现「立即购买」按钮')}
      `)}
      ${section('联系方式', `
        <div class="grid grid-2">${field('contact_email', '联系邮箱', v('contact_email'))}${field('contact_phone', '联系电话', v('contact_phone'))}</div>
        ${field('contacts', '其他联系方式（JSON）', contactsJson, 'text', '如 {"微信":"wxid"}')}
      `)}
      ${section('展示主题', `
        <div class="theme-picker">
          ${THEMES.map((t) => `
            <button type="button" class="theme-card" data-theme="${t.id}" onclick="selectTheme('${t.id}')">
              <span class="swatch" style="background:${THEME_SWATCH[t.id] || '#0f172a'}"></span>
              <span class="tname">${esc(t.name)}</span>
              <span class="tdesc">${esc(t.desc)}</span>
            </button>`).join('')}
        </div>
        <input type="hidden" name="theme" id="theme-input" value="${esc(d?.theme || 'classic')}">
        <span class="help">仅影响访客看到的出售页；后台界面始终保持统一风格。点击主题可实时预览。</span>
        <div class="theme-preview">
          <iframe id="theme-frame" title="主题预览" loading="lazy" src="/admin/theme-preview?theme=${enc(d?.theme || 'classic')}&amp;domain=${enc(d?.domain || '')}"></iframe>
        </div>
        <script>
          function selectTheme(id){
            var inp=document.getElementById('theme-input'); if(inp) inp.value=id;
            var f=document.getElementById('theme-frame');
            if(f) f.src='/admin/theme-preview?theme='+encodeURIComponent(id)+'&amp;domain='+encodeURIComponent('${enc(d?.domain || '')}');
            document.querySelectorAll('.theme-card').forEach(function(c){ c.classList.toggle('active', c.getAttribute('data-theme')===id); });
          }
          selectTheme('${esc(d?.theme || 'classic')}');
        </script>
      `)}
      ${section('SEO（可选）', `
        <div class="grid grid-2">${field('meta_title', 'SEO 标题', v('meta_title'))}${field('meta_description', 'SEO 描述', v('meta_description'))}</div>
      `)}
      <div class="row"><button class="btn btn-primary" type="submit">${ICON.check} 保存</button><a class="btn btn-ghost" href="/admin/domains">取消</a></div>
    </form>`
  return adminShell(d ? 'new' : 'new', inner, {
    title: d ? '编辑域名' : '新增域名',
    sub: d ? esc(d.domain) : '填写域名出售信息',
    actions: `<a class="btn btn-ghost" href="/admin/domains">返回列表</a>`,
  })
}

export function importPage(): string {
  const inner = `
    <section class="card card-pad">
      ${alertBox('info', `<div><b>CSV 表头（首行）示例：</b><br><code>domain,price,currency,min_offer,status,category,description,tags,registrar,expires_at,buy_now_url,contact_email,contact_phone,meta_title,meta_description</code><br><span class="muted">只有 <b>domain</b> 是必填，其余可留空；已存在的域名会被覆盖更新。</span></div>`)}
      <form id="imp" class="stack">
        <label class="field"><span class="lbl">粘贴 CSV 内容</span><textarea class="input" name="csv" placeholder="hbhtcm.cn,8888,CNY,6000,for_sale,医疗,优质域名…"></textarea></label>
        <label class="field"><span class="lbl">或选择 CSV 文件</span><input class="input" type="file" name="file" accept=".csv"></label>
        <div class="row"><button class="btn btn-primary" type="submit">${ICON.upload} 开始导入</button></div>
        <div id="msg" aria-live="polite"></div>
      </form>
    </section>
    <script>
      document.getElementById('imp').addEventListener('submit', async function(e){
        e.preventDefault();
        var m=document.getElementById('msg'); m.textContent='导入中…';
        try{
          var r=await fetch('/api/import',{method:'POST',body:new FormData(e.target)});
          var j=await r.json();
          m.textContent = j.ok ? ('成功导入 '+j.imported+' 条，跳过 '+j.skipped+' 条') : (j.error||'导入失败');
        }catch(err){ m.textContent='导入失败：'+err.message; }
      });
    </script>`
  return adminShell('import', inner, {
    title: '批量导入',
    sub: '从 CSV 批量导入域名',
    actions: `<a class="btn btn-ghost" href="/admin/domains">返回列表</a>`,
  })
}

const INQ_LABEL: Record<string, string> = { new: '未处理', replied: '已回复', closed: '已关闭' }
const INQ_BADGE: Record<string, string> = { new: 'for_sale', replied: 'reserved', closed: 'sold' }

export function adminInquiries(inquiries: InquiryRecord[], domainMap: Map<string, DomainRecord>): string {
  const rows = inquiries.map((q) => {
    const st = q.status || 'new'
    const d = domainMap.get(q.domain)
    return `<tr>
      <td data-label="域名"><b>${esc(q.domain)}</b>${d ? ` <a class="badge badge-outline" href="/admin/domains/${enc(q.domain)}">管理</a>` : ''}</td>
      <td data-label="姓名">${esc(q.name)}</td>
      <td data-label="邮箱"><a href="mailto:${esc(q.email)}">${esc(q.email)}</a></td>
      <td data-label="电话">${q.phone ? `<a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>` : '—'}</td>
      <td data-label="留言">${esc(q.message || '—')}</td>
      <td data-label="时间">${fmtTime(q.created_at)}</td>
      <td data-label="状态">
        <form method="post" action="/admin/inquiries/${enc(q.id)}/status" class="row" style="margin:0">
          <select class="input" name="status" aria-label="更新 ${esc(q.domain)} 询价状态" style="min-height:36px;width:auto;padding:6px 10px">
            ${['new', 'replied', 'closed'].map((s) => `<option value="${s}"${st === s ? ' selected' : ''}>${INQ_LABEL[s]}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-primary" type="submit">更新</button>
        </form>
      </td>
    </tr>`
  }).join('')

  const inner = `
    <section class="card card-pad">
      ${inquiries.length
        ? `<div class="table-wrap"><table><thead><tr><th>域名</th><th>姓名</th><th>邮箱</th><th>电话</th><th>留言</th><th>提交时间</th><th>状态</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : empty(ICON.inbox, '暂无询价', '访客在域名出售页提交询价后，会实时出现在这里')}
    </section>`
  return adminShell('inquiries', inner, {
    title: '询价管理',
    sub: `共 ${inquiries.length} 条询价记录`,
  })
}

// ============================================================
// 访问记录
// ============================================================
export function adminVisits(summaries: { domain: string; count: number; last?: string }[], recent: (VisitRecord & { domain: string })[], siteDomain = ''): string {
  const total = summaries.reduce((a, b) => a + b.count, 0)
  const viaBadge = (v?: string) => v === 'preview'
    ? '<span class="badge badge-outline">后台预览</span>'
    : '<span class="badge badge-secondary">访客访问</span>'
  const domainRows = summaries.map((s) => `<tr>
      <td data-label="域名"><b>${esc(s.domain)}</b></td>
      <td data-label="访问量" class="num">${s.count}</td>
      <td data-label="最近访问">${fmtTime(s.last)}</td>
      <td data-label="操作" class="row-actions"><a class="icon-btn" href="/admin/visits/${enc(s.domain)}">${ICON.eye} 详情</a></td>
    </tr>`).join('')
  const recentRows = recent.slice(0, 100).map((v) => `<tr>
      <td data-label="域名"><b>${esc(v.domain)}</b></td>
      <td data-label="时间">${fmtTime(v.ts)}</td>
      <td data-label="IP">${esc(v.ip || '—')}</td>
      <td data-label="来源" class="ua">${esc(v.ref || '—')}</td>
      <td data-label="入口">${viaBadge(v.via)}</td>
    </tr>`).join('')

  const inner = `
    <div class="stats">
      ${stat(total, '总访问量')}
      ${stat(summaries.length, '有访问的域名')}
      ${stat(recent.length ? fmtTime(recent[0].ts) : '—', '最近一次访问')}
    </div>
    <section class="card card-pad" style="margin-bottom:20px">
      <h2 class="section-title">各域名访问量</h2>
      ${summaries.length
        ? `<div class="table-wrap"><table><thead><tr><th>域名</th><th>访问量</th><th>最近访问</th><th>操作</th></tr></thead><tbody>${domainRows}</tbody></table></div>`
        : empty(ICON.eye, '暂无访问记录', '访客打开域名出售页后会自动记录')}
    </section>
    <section class="card card-pad">
      <h2 class="section-title">最近访问（最新 100 条）</h2>
      ${recent.length
        ? `<div class="table-wrap"><table><thead><tr><th>域名</th><th>时间</th><th>IP</th><th>来源</th><th>入口</th></tr></thead><tbody>${recentRows}</tbody></table></div>`
        : empty(ICON.eye, '暂无访问', '有人访问域名出售页后这里会出现记录')}
    </section>`
  return adminShell('visits', inner, {
    title: '访问记录',
    sub: `共 ${total} 次访问`,
    actions: `<a class="btn btn-ghost" href="/admin/domains">返回域名</a>`,
  })
}

export function adminVisitsDomain(domain: string, visits: VisitRecord[], total: number, siteDomain = ''): string {
  const rows = visits.map((v) => `<tr>
      <td data-label="时间">${fmtTime(v.ts)}</td>
      <td data-label="IP">${esc(v.ip || '—')}</td>
      <td data-label="User-Agent" class="ua">${esc(v.ua || '—')}</td>
      <td data-label="来源" class="ua">${esc(v.ref || '—')}</td>
      <td data-label="入口">${v.via === 'preview' ? '<span class="badge badge-outline">后台预览</span>' : '<span class="badge badge-secondary">访客访问</span>'}</td>
    </tr>`).join('')
  const inner = `
    <div class="stats">
      ${stat(total, '累计访问')}
      ${stat(visits.length, '已展示（最新）')}
    </div>
    <section class="card card-pad">
      <h2 class="section-title">${esc(domain)} 的访问明细</h2>
      ${visits.length
        ? `<div class="table-wrap"><table><thead><tr><th>时间</th><th>IP</th><th>User-Agent</th><th>来源</th><th>入口</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : empty(ICON.eye, '该域名暂无访问', '有人通过此域名打开出售页后会自动记录')}
    </section>`
  return adminShell('visits', inner, {
    title: `${domain} 访问记录`,
    sub: `累计 ${total} 次`,
    actions: `<a class="btn btn-ghost" href="/admin/visits">返回列表</a>`,
  })
}
