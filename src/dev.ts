// 服务入口（本地开发 + 独立服务器部署共用）
// - 默认（无 DATA_FILE）：内存 KV，自动写入示例域名，用于本地自测
// - 设置 DATA_FILE=data/data.json：文件持久化 KV，用于独立服务器生产部署（无 Cloudflare/EdgeOne KV）
import { serve } from '@hono/node-server'
import { app } from './index'
import { createDevKV, createFileKV, Storage, DomainRecord } from './storage'

const DATA_FILE = process.env.DATA_FILE || ''
const useFileKV = !!DATA_FILE

const kv = useFileKV ? createFileKV(DATA_FILE) : createDevKV()
const env = { DOMAIN_KV: kv, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123', SITE_DOMAIN: process.env.SITE_DOMAIN || 'localhost' }

async function seed() {
  if (useFileKV) {
    // 生产模式：仅在数据文件为空且 SEED=1 时写入示例
    const s = new Storage(kv)
    const existing = await s.listDomains()
    if (existing.length === 0 && process.env.SEED === '1') {
      await seedSamples(s)
    } else {
      console.log(`[file-kv] 已从 ${DATA_FILE} 加载 ${existing.length} 个域名记录`)
    }
    return
  }
  // 本地开发：总是写入示例
  await seedSamples(new Storage(kv))
}

async function seedSamples(s: Storage) {
  const samples: DomainRecord[] = [
    {
      domain: 'example-sale.com',
      price: 8888,
      currency: 'CNY',
      min_offer: 6000,
      status: 'for_sale',
      category: '品牌',
      description: '优质短域名，适合品牌建站。',
      tags: ['品牌', '短域名'],
      contact_email: 'seller@example.com',
      contact_phone: '13800000000',
      contacts: { wechat: 'seller_wx' },
      buy_now_url: 'https://escrow.example.com/buy/example-sale.com',
    },
    {
      domain: 'ai-tools.cn',
      price: 12800,
      currency: 'CNY',
      status: 'for_sale',
      category: 'AI',
      description: 'AI 相关优质域名，适合工具类产品。',
      tags: ['AI', '工具'],
      contact_email: 'seller@example.com',
    },
  ]
  for (const d of samples) await s.upsertDomain(d)
  console.log('已写入示例域名：example-sale.com / ai-tools.cn')
}

seed().then(() => {
  const port = Number(process.env.PORT || 8788)
  serve(
    {
      fetch: (req) => app.fetch(req, env),
      port,
    },
    (info) => {
      console.log(`\n服务已启动: http://localhost:${info.port}  (存储模式: ${useFileKV ? `文件 ${DATA_FILE}` : '内存(本地开发)'})`)
      console.log(`  展示页测试:  curl -H "Host: example-sale.com" http://localhost:${info.port}/`)
      console.log(`  预览地址:    http://localhost:${info.port}/d/example-sale.com`)
      console.log(`  后台登录:    http://localhost:${info.port}/admin   (密码: ADMIN_PASSWORD 环境变量，默认 admin123)\n`)
    },
  )
})
