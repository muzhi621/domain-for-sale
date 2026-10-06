// ============================================================
// 展示页主题（仅作用于公开的域名出售页，管理后台保持统一风格）
// 采用 shadcn 令牌覆盖方式：每套主题通过覆盖 --primary / --background
// 等设计令牌实现差异化外观，无需改动页面结构。
// 新增主题：在此追加一项即可，后台下拉会自动出现。
// ============================================================

export type ThemeId = 'classic' | 'minimal' | 'tech' | 'elegant' | 'neon'

export interface Theme {
  id: ThemeId
  name: string
  desc: string
  css: string
}

// 经典：沿用 ui.ts 默认中性令牌（shadcn 标准外观）
const classic: Theme = {
  id: 'classic',
  name: '经典',
  desc: 'shadcn 标准中性 · 近黑主色',
  css: '',
}

// 极简：清爽蓝主色，更小圆角、更轻边框
const minimal: Theme = {
  id: 'minimal',
  name: '极简蓝',
  desc: '清爽蓝主色 · 大留白',
  css: `
:root{--primary:221 83% 53%;--primary-foreground:0 0% 100%;--ring:221 83% 53%;--radius:0.5rem;--border:220 13% 88%;--input:220 13% 88%;--display-font:var(--font-sans)}
@media (prefers-color-scheme: dark){:root{--primary:221 83% 62%;--primary-foreground:240 10% 3.9%;--ring:221 83% 62%;--border:220 13% 22%;--input:220 13% 24%}}
`,
}

// 科技：冷调天蓝，浅色带蓝调背景；深色模式自动切换
const tech: Theme = {
  id: 'tech',
  name: '科技蓝',
  desc: '冷调天蓝 · 网格底纹',
  css: `
:root{--background:204 40% 97%;--foreground:215 28% 17%;--card:0 0% 100%;--card-foreground:215 28% 17%;--popover:0 0% 100%;--popover-foreground:215 28% 17%;--primary:199 89% 48%;--primary-foreground:0 0% 100%;--secondary:204 30% 92%;--secondary-foreground:215 28% 17%;--muted:204 30% 92%;--muted-foreground:215 16% 45%;--accent:204 30% 92%;--accent-foreground:215 28% 17%;--border:204 25% 85%;--input:204 25% 85%;--ring:199 89% 48%;--radius:0.625rem;--display-font:var(--font-sans)}
body{background-image:linear-gradient(0deg, hsl(199 89% 48% / .04) 1px, transparent 1px), linear-gradient(90deg, hsl(199 89% 48% / .04) 1px, transparent 1px);background-size:32px 32px, 32px 32px}
@media (prefers-color-scheme: dark){:root{--background:215 30% 10%;--foreground:210 20% 96%;--card:215 28% 13%;--card-foreground:210 20% 96%;--popover:215 28% 13%;--popover-foreground:210 20% 96%;--primary:199 89% 56%;--primary-foreground:215 30% 10%;--secondary:215 20% 20%;--secondary-foreground:210 20% 96%;--muted:215 20% 20%;--muted-foreground:215 16% 66%;--accent:215 20% 22%;--accent-foreground:210 20% 96%;--border:215 20% 22%;--input:215 20% 24%;--ring:199 89% 56%;--background-image:none}}
`,
}

// 雅致：暖橙主色 + 衬线标题
const elegant: Theme = {
  id: 'elegant',
  name: '雅致橙',
  desc: '暖橙主色 · 衬线排版',
  css: `
:root{--background:30 30% 98%;--foreground:25 25% 18%;--card:0 0% 100%;--card-foreground:25 25% 18%;--popover:0 0% 100%;--popover-foreground:25 25% 18%;--primary:24 80% 42%;--primary-foreground:30 40% 98%;--secondary:30 25% 92%;--secondary-foreground:25 25% 18%;--muted:30 20% 92%;--muted-foreground:25 12% 42%;--accent:30 25% 92%;--accent-foreground:25 25% 18%;--border:30 20% 86%;--input:30 20% 86%;--ring:24 80% 42%;--radius:0.75rem}
@media (prefers-color-scheme: dark){:root{--background:25 22% 9%;--foreground:30 20% 95%;--card:25 20% 12%;--card-foreground:30 20% 95%;--popover:25 20% 12%;--popover-foreground:30 20% 95%;--primary:28 85% 58%;--primary-foreground:25 22% 9%;--secondary:25 16% 18%;--secondary-foreground:30 20% 95%;--muted:25 16% 18%;--muted-foreground:30 14% 66%;--accent:25 16% 20%;--accent-foreground:30 20% 95%;--border:25 16% 20%;--input:25 16% 22%;--ring:28 85% 58%}}
`,
}

// 霓虹：紫调主色，始终深色底 + 发光标题
const neon: Theme = {
  id: 'neon',
  name: '暗夜霓虹',
  desc: '紫调主色 · 深色发光',
  css: `
:root{--background:270 25% 8%;--foreground:270 20% 96%;--card:270 22% 11%;--card-foreground:270 20% 96%;--popover:270 22% 11%;--popover-foreground:270 20% 96%;--primary:280 75% 65%;--primary-foreground:270 30% 10%;--secondary:270 18% 18%;--secondary-foreground:270 20% 96%;--muted:270 18% 16%;--muted-foreground:270 14% 70%;--accent:280 30% 22%;--accent-foreground:270 20% 96%;--border:270 18% 20%;--input:270 18% 22%;--ring:280 75% 65%;--radius:0.625rem;--display-font:var(--font-sans)}
.domain-title{text-shadow:0 0 28px hsl(280 75% 65% / .45)}
.pub-hero,.card,.table-wrap{border-color:hsl(280 40% 30% / .5)}
@media (prefers-color-scheme: dark){:root{--background:270 25% 7%;--foreground:270 20% 97%;--card:270 22% 10%;--card-foreground:270 20% 97%;--primary:280 80% 68%;--primary-foreground:270 30% 10%;--secondary:270 18% 17%;--secondary-foreground:270 20% 97%;--muted:270 18% 15%;--muted-foreground:270 14% 72%;--accent:280 30% 20%;--accent-foreground:270 20% 97%;--border:270 18% 19%;--input:270 18% 22%;--ring:280 80% 68%}}
`,
}

export const THEMES: Theme[] = [classic, minimal, tech, elegant, neon]

export function getTheme(id?: string): Theme {
  return THEMES.find((t) => t.id === id) ?? classic
}

export function themeOptions(selected?: string): string {
  const cur = selected || 'classic'
  return THEMES.map(
    (t) => `<option value="${t.id}"${cur === t.id ? ' selected' : ''}>${t.name} — ${t.desc}</option>`,
  ).join('')
}
