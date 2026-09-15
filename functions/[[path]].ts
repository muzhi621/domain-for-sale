// 边缘适配器：同时兼容 Cloudflare Pages Functions 与 EdgeOne Pages Edge Functions。
// 两个平台均使用 functions/ 目录、onRequest(context)，context.request / context.env 形态一致。
// 平台在控制台将 KV 命名空间绑定到变量名 KV，并在环境变量中设置 ADMIN_PASSWORD。
import { app } from '../src/index'

export async function onRequest(context: any) {
  return app.fetch(context.request, context.env)
}
