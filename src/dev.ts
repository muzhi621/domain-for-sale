// 本地开发入口：用内存 KV 启动 Hono，便于无需 Cloudflare/EdgeOne 账号即可自测。
import { serve } from '@hono/node-server'
import { app } from './index'
import { createDevKV, Storage, DomainRecord } from './storage'

const devKV = createDevKV()
const env = { DOMAIN_KV: devKV, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123' }

async function seed() {
  const s = new Storage(devKV)
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
      console.log(`\n本地服务已启动: http://localhost:${info.port}`)
      console.log(`  展示页测试:  curl -H "Host: example-sale.com" http://localhost:${info.port}/`)
      console.log(`  后台登录:    http://localhost:${info.port}/admin   (密码默认 admin123)\n`)
    },
  )
})
