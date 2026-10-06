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
  async addVisit(domain: string, v: Partial<VisitRecord> = {}): Promise<void> {
    const key = 'visit:' + domain.toLowerCase()
    let arr: VisitRecord[] = []
    const raw = await this.kv.get(key)
    if (raw) { try { arr = JSON.parse(raw) as VisitRecord[] } catch {} }
    arr.push({ ts: new Date().toISOString(), ...v } as VisitRecord)
    if (arr.length > 1000) arr = arr.slice(-1000) // 上限保护，避免无限增长
    await this.kv.put(key, JSON.stringify(arr))
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
    const raw = await this.kv.get('visit:' + domain.toLowerCase())
    if (!raw) return 0
    try { return (JSON.parse(raw) as VisitRecord[]).length } catch { return 0 }
  }

  // 各域名访问汇总（用于列表/概览），按最近访问时间倒序
  async visitSummaries(): Promise<{ domain: string; count: number; last?: string }[]> {
    const { keys } = await this.kv.list({ prefix: 'visit:' })
    const out: { domain: string; count: number; last?: string }[] = []
    for (const k of keys) {
      const raw = await this.kv.get(k.name)
      if (!raw) continue
      try {
        const arr = JSON.parse(raw) as VisitRecord[]
        out.push({ domain: k.name.slice('visit:'.length), count: arr.length, last: arr[arr.length - 1]?.ts })
      } catch {}
    }
    out.sort((a, b) => (b.last || '').localeCompare(a.last || ''))
    return out
  }

  // 全站最近访问（扁平），按时间倒序
  async recentVisits(limit = 300): Promise<(VisitRecord & { domain: string })[]> {
    const { keys } = await this.kv.list({ prefix: 'visit:' })
    const all: (VisitRecord & { domain: string })[] = []
    for (const k of keys) {
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
