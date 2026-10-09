// 存储抽象层：同时兼容 Cloudflare KV 与 EdgeOne KV（API 一致），并可在本地用内存 KV 测试。

export interface DomainRecord {
  domain: string
  slug?: string
  price?: number
  currency?: string
  min_offer?: number
  status?: 'for_sale' | 'reserved' | 'sold' | string
  category?: string
  description?: string
  tags?: string[]
  registrar?: string
  expires_at?: string
  buy_now_url?: string
  contact_email?: string
  contact_phone?: string
  contacts?: Record<string, string>
  meta_title?: string
  meta_description?: string
  theme?: string // 展示页主题 id，见 themes.ts（classic/minimal/tech/elegant/neon）
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface InquiryRecord {
  id: string
  domain: string
  name: string
  email: string
  phone?: string
  message?: string
  status?: string
  created_at?: string
}

export interface VisitRecord {
  ts: string // ISO 时间
  ip?: string
  ua?: string
  ref?: string
  via?: 'host' | 'preview' // host=访客通过域名访问；preview=后台 /d/ 预览
}

// Cloudflare / EdgeOne KV 的通用接口形态（get/put/delete/list）
export interface KVLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  list(opts?: { prefix?: string }): Promise<{ keys: { name: string }[] }>
}

export class Storage {
  constructor(private kv: KVLike) {}

  async getDomain(domain: string): Promise<DomainRecord | null> {
    const v = await this.kv.get('domain:' + domain.toLowerCase())
    return v ? (JSON.parse(v) as DomainRecord) : null
  }

  async listDomains(): Promise<DomainRecord[]> {
    const { keys } = await this.kv.list({ prefix: 'domain:' })
    const out: DomainRecord[] = []
    for (const k of keys) {
      const v = await this.kv.get(k.name)
      if (v) out.push(JSON.parse(v) as DomainRecord)
    }
    out.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return out
  }

  async upsertDomain(d: DomainRecord): Promise<void> {
    d.domain = d.domain.toLowerCase()
    d.updated_at = new Date().toISOString()
    if (!d.created_at) d.created_at = d.updated_at
    if (!d.status) d.status = 'for_sale'
    if (!d.currency) d.currency = 'CNY'
    await this.kv.put('domain:' + d.domain, JSON.stringify(d))
  }

  async deleteDomain(domain: string): Promise<void> {
    await this.kv.delete('domain:' + domain.toLowerCase())
  }

  async listInquiries(): Promise<InquiryRecord[]> {
    const { keys } = await this.kv.list({ prefix: 'inquiry:' })
    const out: InquiryRecord[] = []
    for (const k of keys) {
      const v = await this.kv.get(k.name)
      if (v) out.push(JSON.parse(v) as InquiryRecord)
    }
    out.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return out
  }

  async addInquiry(i: InquiryRecord): Promise<void> {
    i.id = i.id || Math.random().toString(36).slice(2)
    i.created_at = i.created_at || new Date().toISOString()
    i.status = i.status || 'new'
    await this.kv.put('inquiry:' + i.id, JSON.stringify(i))
  }

  async getInquiry(id: string): Promise<InquiryRecord | null> {
    const v = await this.kv.get('inquiry:' + id)
    return v ? (JSON.parse(v) as InquiryRecord) : null
  }

  async setInquiryStatus(id: string, status: string): Promise<void> {
    const v = await this.kv.get('inquiry:' + id)
    if (!v) return
    const o = JSON.parse(v) as InquiryRecord
    o.status = status
    await this.kv.put('inquiry:' + id, JSON.stringify(o))
  }

  // ---------- 访问记录 ----------
  // 设计：
  //   visit:<domain>    —— 明细数组，仅保留最近 1000 条（滚动窗口，用于后台「最近访问」列表展示）
  //   visit_count:<domain> —— 累计访问量（独立计数，不受明细上限影响，会一直累加）
  async addVisit(domain: string, v: Partial<VisitRecord> = {}): Promise<void> {
    domain = domain.toLowerCase()
    const key = 'visit:' + domain
    let arr: VisitRecord[] = []
    const raw = await this.kv.get(key)
    if (raw) { try { arr = JSON.parse(raw) as VisitRecord[] } catch {} }
    arr.push({ ts: new Date().toISOString(), ...v } as VisitRecord)
    if (arr.length > 1000) arr = arr.slice(-1000) // 明细仅保留最近 1000 条，避免无限增长
    await this.kv.put(key, JSON.stringify(arr))
    // 累计计数：已有独立计数则 +1；首次访问以明细长度初始化（arr 已含本次，不再 +1）
    const ck = 'visit_count:' + domain
    const cur = await this.kv.get(ck)
    if (cur != null) {
      await this.kv.put(ck, String((Number(cur) || 0) + 1))
    } else {
      await this.kv.put(ck, String(arr.length))
    }
  }

  async listVisits(domain: string, limit = 200): Promise<VisitRecord[]> {
    const raw = await this.kv.get('visit:' + domain.toLowerCase())
    if (!raw) return []
    try {
      const arr = JSON.parse(raw) as VisitRecord[]
      return arr.slice(-limit).reverse() // 最新在前
    } catch { return [] }
  }

  async countVisits(domain: string): Promise<number> {
    const ck = 'visit_count:' + domain.toLowerCase()
    const cur = await this.kv.get(ck)
    if (cur != null) {
      const n = Number(cur)
      if (!Number.isNaN(n)) return n
    }
    // 兼容旧数据：尚无独立计数时，以明细长度兜底并初始化
    const raw = await this.kv.get('visit:' + domain.toLowerCase())
    if (!raw) return 0
    try {
      const n = (JSON.parse(raw) as VisitRecord[]).length
      await this.kv.put(ck, String(n))
      return n
    } catch { return 0 }
  }

  // 各域名访问汇总（用于列表/概览），按最近访问时间倒序
  async visitSummaries(): Promise<{ domain: string; count: number; last?: string }[]> {
    const { keys } = await this.kv.list({ prefix: 'visit:' })
    const out: { domain: string; count: number; last?: string }[] = []
    for (const k of keys) {
      if (k.name.startsWith('visit_count:')) continue // 跳过累计计数键，避免污染列表
      const domain = k.name.slice('visit:'.length)
      const raw = await this.kv.get(k.name)
      if (!raw) continue
      let arr: VisitRecord[] = []
      try { arr = JSON.parse(raw) as VisitRecord[] } catch {}
      const last = arr[arr.length - 1]?.ts
      // 优先用独立累计计数；缺失则兜底为明细长度（兼容旧数据）
      const cc = await this.kv.get('visit_count:' + domain)
      let count: number
      if (cc != null) { const n = Number(cc); count = Number.isNaN(n) ? arr.length : n }
      else count = arr.length
      out.push({ domain, count, last })
    }
    out.sort((a, b) => (b.last || '').localeCompare(a.last || ''))
    return out
  }

  // 全站最近访问（扁平），按时间倒序
  async recentVisits(limit = 300): Promise<(VisitRecord & { domain: string })[]> {
    const { keys } = await this.kv.list({ prefix: 'visit:' })
    const filtered = keys.filter((k) => !k.name.startsWith('visit_count:'))
    const all: (VisitRecord & { domain: string })[] = []
    for (const k of filtered) {
      const raw = await this.kv.get(k.name)
      if (!raw) continue
      try {
        const arr = JSON.parse(raw) as VisitRecord[]
        const domain = k.name.slice('visit:'.length)
        for (const v of arr) all.push({ domain, ...v })
      } catch {}
    }
    all.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''))
    return all.slice(0, limit)
  }

  async setSession(token: string, username: string, ttlSeconds = 86400): Promise<void> {
    await this.kv.put('session:' + token, JSON.stringify({ username, exp: Date.now() + ttlSeconds * 1000 }))
  }

  async getSession(token: string): Promise<string | null> {
    const v = await this.kv.get('session:' + token)
    if (!v) return null
    const o = JSON.parse(v) as { username: string; exp: number }
    if (o.exp < Date.now()) {
      await this.kv.delete('session:' + token)
      return null
    }
    return o.username
  }

  async deleteSession(token: string): Promise<void> {
    await this.kv.delete('session:' + token)
  }
}

// 本地开发用内存 KV（模拟 Cloudflare/EdgeOne KV 的 API 形态）
export function createDevKV(): KVLike {
  const m = new Map<string, string>()
  return {
    async get(k) {
      return m.has(k) ? m.get(k)! : null
    },
    async put(k, v) {
      m.set(k, v)
    },
    async delete(k) {
      m.delete(k)
    },
    async list(opts) {
      const prefix = opts?.prefix || ''
      return { keys: [...m.keys()].filter((x) => x.startsWith(prefix)).map((name) => ({ name })) }
    },
  }
}

// 独立服务器部署用：文件持久化 KV（无 Cloudflare/EdgeOne 时数据落到本地 JSON）
import * as fs from 'node:fs'
import * as path from 'node:path'

export function createFileKV(filePath: string): KVLike {
  const file = path.resolve(filePath)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const m = new Map<string, string>()
  try {
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>
      for (const [k, v] of Object.entries(raw)) m.set(k, String(v))
    }
  } catch (e) {
    console.error('[file-kv] 读取数据文件失败，将以空数据启动:', e)
  }
  const save = () => {
    try {
      fs.writeFileSync(file + '.tmp', JSON.stringify(Object.fromEntries(m), null, 2))
      fs.renameSync(file + '.tmp', file)
    } catch (e) {
      console.error('[file-kv] 写入数据文件失败:', e)
    }
  }
  return {
    async get(k) {
      return m.has(k) ? m.get(k)! : null
    },
    async put(k, v) {
      m.set(k, v)
      save()
    },
    async delete(k) {
      m.delete(k)
      save()
    },
    async list(opts) {
      const prefix = opts?.prefix || ''
      return { keys: [...m.keys()].filter((x) => x.startsWith(prefix)).map((name) => ({ name })) }
    },
  }
}
