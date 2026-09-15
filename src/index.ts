import { Hono } from 'hono'
import { Storage, DomainRecord, InquiryRecord, KVLike } from './storage'
import { parseCSV } from './csv'
import * as views from './views'

type Bindings = { KV: KVLike; ADMIN_PASSWORD?: string }
const app = new Hono<{ Bindings: Bindings }>()

const storage = (c: any): Storage => new Storage(c.env.KV)
const adminPassword = (c: any): string => c.env.ADMIN_PASSWORD || 'admin123'

function newToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, '0')).join('')
}
async function hashPassword(p: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
function safeJson(s: string): Record<string, string> {
  try {
    const o = JSON.parse(s)
    if (o && typeof o === 'object') return o
  } catch {}
  return {}
}

// ---------- Cookie 助手（不依赖 @hono/cookie，兼容边缘运行时） ----------
function serializeCookie(name: string, value: string, opts: { maxAge?: number; httpOnly?: boolean; path?: string; secure?: boolean; sameSite?: string } = {}): string {
  let s = `${name}=${encodeURIComponent(value)}`
  if (opts.maxAge != null) s += `; Max-Age=${opts.maxAge}`
  s += `; Path=${opts.path || '/'}`
  if (opts.httpOnly) s += '; HttpOnly'
  if (opts.secure) s += '; Secure'
  if (opts.sameSite) s += `; SameSite=${opts.sameSite}`
  return s
}
function parseCookies(header?: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}
function getCookie(c: any, name: string): string | undefined {
  return parseCookies(c.req.header('cookie'))[name]
}

// ---------- 后台鉴权中间件 ----------
app.use('/admin/*', async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (path === '/admin/login' || path === '/admin/logout') return next()
  const token = getCookie(c, 'admin_session')
  if (!token) return c.redirect('/admin/login')
  const user = await storage(c).getSession(token)
  if (!user) return c.redirect('/admin/login')
  await next()
})

// ---------- 公开：提交询价 ----------
app.post('/api/inquiry', async (c) => {
  const b: any = await c.req.parseBody()
  const domain = String(b.domain || '').toLowerCase().trim()
  const name = String(b.name || '').trim()
  const email = String(b.email || '').trim()
  const phone = String(b.phone || '').trim()
  const message = String(b.message || '').trim()
  if (!domain || !name || !email) return c.json({ ok: false, error: '请填写域名、姓名和邮箱' }, 400)
  const rec = await storage(c).getDomain(domain)
  if (!rec) return c.json({ ok: false, error: '该域名未登记' }, 404)
  await storage(c).addInquiry({ id: '', domain, name, email, phone, message })
  return c.json({ ok: true, message: '提交成功，卖家会尽快与你联系' })
})

// ---------- 登录/登出 ----------
app.get('/admin/login', (c) => c.html(views.adminLogin()))
app.post('/admin/login', async (c) => {
  const b: any = await c.req.parseBody()
  const password = String(b.password || '')
  if ((await hashPassword(password)) !== (await hashPassword(adminPassword(c)))) {
    return c.html(views.adminLogin('密码错误'))
  }
  const token = newToken()
  await storage(c).setSession(token, 'admin')
  const res = c.redirect('/admin')
  res.headers.append('Set-Cookie', serializeCookie('admin_session', token, { maxAge: 86400, httpOnly: true, path: '/', sameSite: 'Lax', secure: true }))
  return res
})
app.get('/admin/logout', async (c) => {
  const token = getCookie(c, 'admin_session')
  if (token) await storage(c).deleteSession(token)
  const res = c.redirect('/admin/login')
  res.headers.append('Set-Cookie', serializeCookie('admin_session', '', { maxAge: 0, path: '/' }))
  return res
})

// ---------- 概览 ----------
app.get('/admin', async (c) => {
  const s = storage(c)
  const [domains, inquiries] = await Promise.all([s.listDomains(), s.listInquiries()])
  return c.html(views.adminOverview(domains, inquiries))
})

// ---------- 域名列表 ----------
app.get('/admin/domains', async (c) => {
  const domains = await storage(c).listDomains()
  return c.html(views.adminDomains(domains))
})

// ---------- 新增 / 编辑表单 ----------
app.get('/admin/domains/new', (c) => c.html(views.domainForm(null)))
app.get('/admin/domains/:domain', async (c) => {
  const domain = decodeURIComponent(c.req.param('domain'))
  const rec = await storage(c).getDomain(domain)
  if (!rec) return c.redirect('/admin/domains')
  return c.html(views.domainForm(rec))
})

// ---------- 保存（新增 / 编辑） ----------
function bodyToDomain(b: any): DomainRecord {
  const d: DomainRecord = {
    domain: String(b.domain || '').toLowerCase().trim(),
    slug: b.slug || '',
    price: b.price ? Number(b.price) : undefined,
    currency: b.currency || 'CNY',
    min_offer: b.min_offer ? Number(b.min_offer) : undefined,
    status: b.status || 'for_sale',
    category: b.category || '',
    description: b.description || '',
    tags: b.tags ? String(b.tags).split(/[,;]/).map((t: string) => t.trim()).filter(Boolean) : [],
    registrar: b.registrar || '',
    expires_at: b.expires_at || '',
    buy_now_url: b.buy_now_url || '',
    contact_email: b.contact_email || '',
    contact_phone: b.contact_phone || '',
    contacts: b.contacts ? safeJson(b.contacts) : {},
    meta_title: b.meta_title || '',
    meta_description: b.meta_description || '',
    sort_order: b.sort_order ? Number(b.sort_order) : 0,
  }
  return d
}

app.post('/admin/domains', async (c) => {
  const b: any = await c.req.parseBody()
  const d = bodyToDomain(b)
  if (!d.domain) return c.html(views.domainForm(null, '域名不能为空'))
  await storage(c).upsertDomain(d)
  return c.redirect('/admin/domains')
})
app.post('/admin/domains/:domain', async (c) => {
  const b: any = await c.req.parseBody()
  const d = bodyToDomain(b)
  if (!d.domain) return c.redirect('/admin/domains')
  const old = decodeURIComponent(c.req.param('domain'))
  if (old !== d.domain) await storage(c).deleteDomain(old) // 允许改名
  await storage(c).upsertDomain(d)
  return c.redirect('/admin/domains')
})
app.post('/admin/domains/:domain/delete', async (c) => {
  const domain = decodeURIComponent(c.req.param('domain'))
  await storage(c).deleteDomain(domain)
  return c.redirect('/admin/domains')
})

// ---------- 批量导入 ----------
app.get('/admin/import', (c) => c.html(views.importPage()))
app.post('/api/import', async (c) => {
  const b: any = await c.req.parseBody({ all: true })
  let text = ''
  if (typeof b.csv === 'string') text = b.csv
  else if (b.file && typeof b.file === 'object' && 'text' in b.file) text = await (b.file as any).text()
  if (!text.trim()) return c.json({ ok: false, error: '未收到 CSV 内容' }, 400)
  const rows = parseCSV(text)
  if (!rows.length) return c.json({ ok: false, error: 'CSV 无数据' }, 400)
  const s = storage(c)
  let ok = 0
  let skip = 0
  for (const row of rows) {
    const d = rowToDomain(row)
    if (!d.domain) {
      skip++
      continue
    }
    await s.upsertDomain(d)
    ok++
  }
  return c.json({ ok: true, imported: ok, skipped: skip })
})
function rowToDomain(row: Record<string, string>): DomainRecord {
  const num = (v?: string) => (v && v !== '' ? Number(v) : undefined)
  return {
    domain: (row.domain || '').toLowerCase().trim(),
    slug: row.slug || '',
    price: num(row.price),
    currency: row.currency || 'CNY',
    min_offer: num(row.min_offer),
    status: row.status || 'for_sale',
    category: row.category || '',
    description: row.description || '',
    tags: (row.tags || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean),
    registrar: row.registrar || '',
    expires_at: row.expires_at || '',
    buy_now_url: row.buy_now_url || '',
    contact_email: row.contact_email || '',
    contact_phone: row.contact_phone || '',
    contacts: row.contacts ? safeJson(row.contacts) : {},
    meta_title: row.meta_title || '',
    meta_description: row.meta_description || '',
    sort_order: num(row.sort_order) || 0,
  }
}

// ---------- 询价管理 ----------
app.get('/admin/inquiries', async (c) => {
  const s = storage(c)
  const [inquiries, domains] = await Promise.all([s.listInquiries(), s.listDomains()])
  const map = new Map(domains.map((d) => [d.domain, d]))
  return c.html(views.adminInquiries(inquiries, map))
})
app.post('/admin/inquiries/:id/status', async (c) => {
  const id = c.req.param('id')
  const b: any = await c.req.parseBody()
  const status = String(b.status || 'new')
  await storage(c).setInquiryStatus(id, status)
  return c.redirect('/admin/inquiries')
})

// ---------- 访客展示页（按 Host 路由，兜底全捕获） ----------
app.get('*', async (c) => {
  const host = (c.req.header('host') || '').split(':')[0].toLowerCase()
  const rec = await storage(c).getDomain(host)
  if (!rec) return c.html(views.notFound(host), 404)
  return c.html(views.showcase(rec))
})

export { app }
export default app
