// ============================================================
// 设计系统（Design System）—— 基于 shadcn-ui 设计语言重构
// 设计令牌采用 shadcn 的 HSL 变量体系（--background / --foreground /
// --card / --primary / --muted / --border / --ring / --radius …），
// 组件原语（Button / Card / Badge / Input / Table / Alert …）复刻
// shadcn 的中性、克制、可访问的视觉风格。
//
// 适配说明：本项目为无构建步骤的 Hono 服务端渲染，故以手写 CSS 忠实
// 复刻 shadcn 设计系统，避免引入 Tailwind 运行时对外部 CDN 的依赖。
// 约束：纯服务端渲染（模板字符串），无前端框架。
// ============================================================

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]!))
}
export function enc(s: string): string {
  return encodeURIComponent(s)
}

// ---------- 图标（SVG，禁止 emoji） ----------
export const ICON = {
  mail: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>',
  chat: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  link: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  grid: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  globe: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/></svg>',
  plus: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  upload: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>',
  inbox: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"/></svg>',
  logout: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>',
  copy: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  edit: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  check: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>',
  shield: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  eye: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  chevron: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  tag: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
}

// ---------- 设计 tokens（shadcn HSL 变量体系） + 全局样式 ----------
const STYLE = `
:root{
  /* shadcn 设计令牌（默认值 = 经典中性外观） */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 72.2% 50.6%;
  --destructive-foreground: 0 0% 98%;
  --success: 142 71% 45%;
  --success-foreground: 0 0% 98%;
  --warning: 32 95% 44%;
  --warning-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.625rem;

  /* 排版 */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
  --font-display: 'Fraunces', 'Songti SC', 'Noto Serif SC', Georgia, serif;
  --display-font: var(--font-display);
  --shell-max: 1180px;
}
@media (prefers-color-scheme: dark){
  :root{
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 5.5%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 5.5%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 50.6%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 69% 42%;
    --success-foreground: 0 0% 98%;
    --warning: 32 95% 50%;
    --warning-foreground: 0 0% 98%;
    --border: 240 3.7% 16%;
    --input: 240 3.7% 18%;
    --ring: 240 4.9% 83.9%;
  }
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;min-height:100vh;font-family:var(--font-sans);font-size:15px;line-height:1.6;
  color:hsl(var(--foreground));background:hsl(var(--background));
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:hsl(var(--primary));text-decoration:none}
a:hover{text-decoration:underline}
button,input,textarea,select,summary,label{cursor:pointer;font-family:inherit}
:focus-visible{outline:2px solid hsl(var(--ring));outline-offset:2px;border-radius:6px}

/* ---------- 布局工具 ---------- */
.container{max-width:var(--shell-max);margin:0 auto;padding:24px 20px 40px;width:100%}
.stack{display:flex;flex-direction:column;gap:16px}
.row{display:flex;align-items:center;gap:12px}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.wrap{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.grid{display:grid;gap:16px}
.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.span-2{grid-column:span 2}
.muted{color:hsl(var(--muted-foreground))}
.text-sm{font-size:13.5px;line-height:1.5}
.text-xs{font-size:12px}
.font-medium{font-weight:500}
.font-semibold{font-weight:600}
.tracking-tight{letter-spacing:-.02em}
.text-center{text-align:center}
.w-full{width:100%}
.hidden{display:none}

/* ---------- 卡片（Card） ---------- */
.card{background:hsl(var(--card));color:hsl(var(--card-foreground));
  border:1px solid hsl(var(--border));border-radius:calc(var(--radius) + 4px);
  box-shadow:0 1px 2px 0 hsl(240 10% 3.9% / .04), 0 1px 3px 0 hsl(240 10% 3.9% / .06)}
.card-pad{padding:22px}
.card-header{display:flex;flex-direction:column;gap:6px;padding:20px 22px 0}
.card-title{margin:0;font-size:16px;font-weight:600;letter-spacing:-.01em}
.card-desc{margin:0;font-size:13.5px;color:hsl(var(--muted-foreground))}
.card-content{padding:18px 22px 22px}

/* ---------- 按钮（Button） ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  height:40px;padding:0 16px;border-radius:var(--radius);border:1px solid transparent;
  font-size:14px;font-weight:600;line-height:1;white-space:nowrap;text-decoration:none;
  transition:background-color .15s ease, color .15s ease, border-color .15s ease, opacity .15s ease, box-shadow .15s ease}
.btn:hover{text-decoration:none}
.btn:disabled,.btn[aria-disabled=true]{opacity:.5;pointer-events:none}
.btn-primary{background:hsl(var(--primary));color:hsl(var(--primary-foreground));box-shadow:0 1px 2px 0 hsl(240 10% 3.9% / .05)}
.btn-primary:hover{background:hsl(var(--primary) / .9)}
.btn-secondary{background:hsl(var(--secondary));color:hsl(var(--secondary-foreground))}
.btn-secondary:hover{background:hsl(var(--secondary) / .8)}
.btn-outline{background:hsl(var(--background));border-color:hsl(var(--input));color:hsl(var(--foreground))}
.btn-outline:hover{background:hsl(var(--accent));color:hsl(var(--accent-foreground))}
.btn-ghost{background:transparent;color:hsl(var(--foreground))}
.btn-ghost:hover{background:hsl(var(--accent));color:hsl(var(--accent-foreground))}
.btn-destructive{background:hsl(var(--destructive));color:hsl(var(--destructive-foreground))}
.btn-destructive:hover{background:hsl(var(--destructive) / .9)}
.btn-sm{height:34px;padding:0 12px;font-size:13px;border-radius:calc(var(--radius) - 2px)}
.btn-lg{height:44px;padding:0 22px;font-size:15px}
.btn-block{width:100%}

/* ---------- 徽章（Badge） ---------- */
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;
  font-size:12px;font-weight:600;line-height:1.5;border:1px solid transparent;white-space:nowrap}
.badge-default{background:hsl(var(--primary));color:hsl(var(--primary-foreground))}
.badge-secondary{background:hsl(var(--secondary));color:hsl(var(--secondary-foreground))}
.badge-outline{background:transparent;border-color:hsl(var(--input));color:hsl(var(--foreground))}
.badge-success{background:hsl(var(--success) / .12);color:hsl(var(--success));border-color:hsl(var(--success) / .25)}
.badge-warning{background:hsl(var(--warning) / .12);color:hsl(var(--warning));border-color:hsl(var(--warning) / .25)}
.badge-destructive{background:hsl(var(--destructive) / .12);color:hsl(var(--destructive));border-color:hsl(var(--destructive) / .25)}
.badge-dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}

/* ---------- 表单（Input / Label / Field） ---------- */
.field{display:flex;flex-direction:column;gap:7px;font-size:14px;font-weight:500;color:hsl(var(--foreground))}
.field > span.lbl{font-weight:600}
.field .req{color:hsl(var(--destructive))}
.input,textarea.input,select.input{width:100%;min-height:40px;padding:9px 12px;
  border:1px solid hsl(var(--input));border-radius:var(--radius);font-size:14px;font-weight:400;
  background:hsl(var(--background));color:hsl(var(--foreground));
  transition:border-color .15s ease, box-shadow .15s ease}
.input:focus,textarea.input:focus,select.input:focus{outline:none;border-color:hsl(var(--ring));box-shadow:0 0 0 3px hsl(var(--ring) / .25)}
textarea.input{min-height:92px;resize:vertical;line-height:1.6}
select.input{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:34px}
.field .help{font-size:12.5px;font-weight:400;color:hsl(var(--muted-foreground));line-height:1.5}
.field-err{font-size:13px;font-weight:600;color:hsl(var(--destructive));min-height:0}

/* ---------- 提示条（Alert） ---------- */
.alert{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:var(--radius);
  font-size:14px;line-height:1.55;border:1px solid;margin:0 0 20px}
.alert > .alert-ico{flex:none;margin-top:1px;color:hsl(var(--muted-foreground))}
.alert.info{background:hsl(var(--secondary));border-color:hsl(var(--border));color:hsl(var(--foreground))}
.alert.info .alert-ico{color:hsl(var(--primary))}
.alert.warn{background:hsl(var(--warning) / .1);border-color:hsl(var(--warning) / .3);color:hsl(var(--warning))}
.alert.error{background:hsl(var(--destructive) / .08);border-color:hsl(var(--destructive) / .3);color:hsl(var(--destructive));font-weight:600}
.alert code{background:hsl(var(--muted) / .5);border:1px solid hsl(var(--border));border-radius:6px;padding:2px 7px;font-size:13px;word-break:break-all}
.alert .btn{margin-left:auto}

/* ---------- 表格（Table） ---------- */
.table-wrap{overflow-x:auto;border:1px solid hsl(var(--border));border-radius:calc(var(--radius) + 4px);background:hsl(var(--card))}
.table-wrap table{width:100%;border-collapse:collapse;font-size:14px}
.table-wrap th,.table-wrap td{padding:12px 16px;text-align:left;border-bottom:1px solid hsl(var(--border));vertical-align:middle}
.table-wrap th{background:hsl(var(--muted) / .4);color:hsl(var(--muted-foreground));font-size:12px;font-weight:600;
  text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
.table-wrap tbody tr:last-child td{border-bottom:none}
.table-wrap tbody tr:hover{background:hsl(var(--muted) / .35)}
td.num{font-variant-numeric:tabular-nums}
.ua{word-break:break-all;max-width:340px;color:hsl(var(--muted-foreground));font-size:13px;line-height:1.5}
.row-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 10px;
  border-radius:var(--radius);border:1px solid hsl(var(--input));background:hsl(var(--card));
  color:hsl(var(--foreground));font-size:13px;font-weight:600;transition:background-color .15s,color .15s,border-color .15s}
.icon-btn:hover{background:hsl(var(--accent));border-color:hsl(var(--border))}
.icon-btn.danger:hover{background:hsl(var(--destructive) / .1);color:hsl(var(--destructive));border-color:hsl(var(--destructive) / .3)}
@media (max-width:780px){
  .table-wrap{border:none;background:transparent;overflow:visible}
  .table-wrap table,.table-wrap thead,.table-wrap tbody,.table-wrap tr,.table-wrap td{display:block;width:100%}
  .table-wrap thead{display:none}
  .table-wrap tbody tr{margin-bottom:12px;padding:6px 14px;border:1px solid hsl(var(--border));border-radius:calc(var(--radius) + 4px);background:hsl(var(--card))}
  .table-wrap tbody tr:hover{background:hsl(var(--card))}
  .table-wrap td{border:none;padding:8px 0;display:flex;justify-content:space-between;gap:16px;text-align:right}
  .table-wrap td::before{content:attr(data-label);font-size:12px;font-weight:600;color:hsl(var(--muted-foreground));text-align:left;flex:none}
  .table-wrap td.row-actions{justify-content:flex-end;flex-wrap:wrap}
}

/* ---------- 统计卡（Stat） ---------- */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:0 0 22px}
.stat{padding:18px 20px;border-radius:calc(var(--radius) + 4px);background:hsl(var(--card));border:1px solid hsl(var(--border));box-shadow:0 1px 2px 0 hsl(240 10% 3.9% / .04)}
.stat b{display:block;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.stat span{font-size:13px;color:hsl(var(--muted-foreground));font-weight:500}

/* ---------- 管理端 Shell ---------- */
.app{display:grid;grid-template-columns:248px 1fr;gap:24px;max-width:var(--shell-max);margin:0 auto;padding:24px 20px 40px}
.sidebar{display:flex;flex-direction:column;gap:6px;padding:14px;background:hsl(var(--card));
  border:1px solid hsl(var(--border));border-radius:calc(var(--radius) + 4px);box-shadow:0 1px 2px 0 hsl(240 10% 3.9% / .04);
  align-self:start;position:sticky;top:20px}
.brand{display:flex;align-items:center;gap:11px;padding:6px 8px 14px}
.brand .mark{width:38px;height:38px;flex:none;border-radius:10px;display:grid;place-items:center;color:hsl(var(--primary-foreground));background:hsl(var(--primary))}
.brand b{display:block;font-size:15px;font-weight:600;letter-spacing:-.01em;line-height:1.2}
.brand small{display:block;font-size:12px;color:hsl(var(--muted-foreground))}
.nav{display:flex;flex-direction:column;gap:2px}
.nav a{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:var(--radius);
  color:hsl(var(--muted-foreground));font-size:14px;font-weight:500;transition:background-color .15s,color .15s}
.nav a:hover{background:hsl(var(--accent));color:hsl(var(--accent-foreground));text-decoration:none}
.nav a[aria-current=page]{background:hsl(var(--secondary));color:hsl(var(--foreground));font-weight:600}
.nav .sep{height:1px;background:hsl(var(--border));margin:6px 4px}
.nav .foot{font-size:12px;color:hsl(var(--muted-foreground));padding:10px 12px 2px;line-height:1.5}
.main{min-width:0}
.page-head{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;margin-bottom:20px}
.page-head h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.02em}
.page-head .sub{margin:4px 0 0;font-size:14px;color:hsl(var(--muted-foreground))}
.section-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-foreground));margin:0 0 14px}
.empty{text-align:center;padding:48px 24px;color:hsl(var(--muted-foreground))}
.empty svg{color:hsl(var(--border));margin-bottom:10px}
.empty p{margin:0 0 4px;font-weight:600;color:hsl(var(--foreground))}
.empty small{font-size:13px}
@media (max-width:880px){
  .app{grid-template-columns:1fr;gap:16px;padding:16px 14px 32px}
  .sidebar{position:static;flex-direction:row;overflow-x:auto;padding:8px}
  .brand{display:none}
  .nav{flex-direction:row}
  .nav a{white-space:nowrap;flex:none}
  .nav .sep,.nav .foot{display:none}
}

/* ---------- 主题选择器（Theme picker） ---------- */
.theme-picker{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
.theme-card{position:relative;display:flex;flex-direction:column;gap:6px;padding:14px;text-align:left;cursor:pointer;
  border:1px solid hsl(var(--input));border-radius:var(--radius);background:hsl(var(--card));transition:border-color .15s,box-shadow .15s,background-color .15s}
.theme-card:hover{border-color:hsl(var(--border));background:hsl(var(--accent))}
.theme-card.active{border-color:hsl(var(--primary));box-shadow:0 0 0 2px hsl(var(--ring) / .35);background:hsl(var(--secondary))}
.theme-card .swatch{width:100%;height:8px;border-radius:999px;background:hsl(var(--primary))}
.theme-card .tname{font-size:14px;font-weight:600}
.theme-card .tdesc{font-size:12px;color:hsl(var(--muted-foreground));line-height:1.4}
.theme-card.active .tname{color:hsl(var(--primary))}
.theme-preview{margin-top:10px;border:1px solid hsl(var(--border));border-radius:var(--radius);overflow:hidden;background:hsl(var(--muted) / .3)}
.theme-preview iframe{display:block;width:100%;height:540px;border:0;background:hsl(var(--background))}
@media (max-width:640px){.theme-preview iframe{height:420px}}

/* ---------- 登录页 ---------- */
.login-wrap{min-height:100vh;display:grid;place-items:center;padding:24px;background:hsl(var(--muted) / .35)}
.login-card{width:100%;max-width:400px;padding:32px 28px}
.login-brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.login-brand .mark{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:hsl(var(--primary-foreground));background:hsl(var(--primary))}
.login-brand b{font-size:17px;display:block;font-weight:600}
.login-brand small{font-size:12.5px;color:hsl(var(--muted-foreground))}

/* ---------- 公开端：域名出售展示页 ---------- */
.public{max-width:760px;margin:0 auto;padding:48px 20px 32px}
.pub-hero{padding:40px 36px;position:relative;overflow:hidden;margin-bottom:20px}
.pub-hero .badges{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.domain-title{font-family:var(--display-font);font-size:clamp(38px,7vw,60px);line-height:1.04;
  margin:0;font-weight:600;letter-spacing:-.01em;word-break:break-all}
.price-row{display:flex;flex-wrap:wrap;align-items:center;gap:20px;justify-content:space-between;
  padding:20px 22px;margin-top:24px;border-radius:var(--radius);background:hsl(var(--muted) / .5);border:1px solid hsl(var(--border))}
.price{font-size:32px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.price .cur{font-size:16px;font-weight:600;color:hsl(var(--muted-foreground));margin-right:5px}
.price .min{display:block;font-size:13px;font-weight:500;color:hsl(var(--muted-foreground));margin-top:3px}
.contacts{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.contacts li{display:flex;align-items:center;gap:11px;padding:12px 15px;border-radius:var(--radius);background:hsl(var(--muted) / .5);border:1px solid hsl(var(--border))}
.contacts svg{flex:none;color:hsl(var(--primary))}
.contacts a{color:hsl(var(--foreground));font-weight:600;word-break:break-all}
.desc{white-space:pre-wrap;color:hsl(var(--foreground));font-size:16px;line-height:1.7;margin:0}
.meta-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:18px 0 0}
.meta-list div{padding:12px 14px;border-radius:var(--radius);background:hsl(var(--muted) / .5);border:1px solid hsl(var(--border))}
.meta-list dt{font-size:12px;color:hsl(var(--muted-foreground));font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px}
.meta-list dd{margin:0;font-size:14px;font-weight:500}
.foot{text-align:center;color:hsl(var(--muted-foreground));font-size:13px;padding:32px 20px 40px}
.foot a{color:hsl(var(--muted-foreground))}
@media (max-width:640px){
  .public{padding:28px 14px}
  .pub-hero{padding:28px 20px}
  .grid-2{grid-template-columns:1fr}
}

@media (prefers-reduced-motion: reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
`.trim()

// ---------- 页面骨架 ----------
export function layout(title: string, body: string, head = '', extraCss = ''): string {
  const fonts =
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light dark">` +
    `<title>${esc(title)}</title>${fonts}${head}<style>${STYLE}</style>${extraCss ? `<style>${extraCss}</style>` : ''}</head><body>${body}</body></html>`
}

export function foot(): string {
  return `<footer class="foot">域名出售展示系统 · 基于 Hono 构建 · Cloudflare / EdgeOne Pages 就绪</footer>`
}

// ---------- 管理端 Shell ----------
export type NavKey = 'overview' | 'domains' | 'new' | 'import' | 'inquiries' | 'visits'

export function adminShell(active: NavKey, inner: string, opts: { title: string; sub?: string; actions?: string }): string {
  const item = (key: NavKey, href: string, label: string, icon: string) =>
    `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`
  const nav = `<nav class="nav" aria-label="后台导航">
    ${item('overview', '/admin', '概览', ICON.grid)}
    ${item('domains', '/admin/domains', '域名管理', ICON.globe)}
    ${item('new', '/admin/domains/new', '新增域名', ICON.plus)}
    ${item('import', '/admin/import', '批量导入', ICON.upload)}
    ${item('inquiries', '/admin/inquiries', '询价管理', ICON.inbox)}
    ${item('visits', '/admin/visits', '访问记录', ICON.eye)}
    <div class="sep"></div>
    <a href="/admin/logout">${ICON.logout}<span>退出登录</span></a>
    <div class="foot">${ICON.shield} 登录状态保持 24 小时</div>
  </nav>`
  const head = `<div class="page-head">
      <div><h1>${esc(opts.title)}</h1>${opts.sub ? `<p class="sub">${esc(opts.sub)}</p>` : ''}</div>
      ${opts.actions ? `<div class="wrap">${opts.actions}</div>` : ''}
    </div>`
  const body = `<div class="app">
    <aside class="sidebar">
      <div class="brand"><span class="mark">${ICON.globe}</span><div><b>域名出售系统</b><small>Domain For Sale</small></div></div>
      ${nav}
    </aside>
    <main class="main">${head}${inner}</main>
  </div>`
  return layout(opts.title, body)
}

// ---------- 组件 ----------
export function statusLabel(s?: string): string {
  return { for_sale: '出售中', reserved: '已预订', sold: '已售出' }[s || ''] || s || '未知'
}
export function badge(status?: string): string {
  const map: Record<string, string> = { for_sale: 'badge-success', reserved: 'badge-warning', sold: 'badge-destructive' }
  const cls = map[status || 'for_sale'] || 'badge-secondary'
  const label = statusLabel(status)
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`
}
export function stat(value: string | number, label: string): string {
  return `<div class="stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`
}
export function alertBox(kind: 'info' | 'warn' | 'error', html: string): string {
  const ico = kind === 'error' ? ICON.shield : ICON.tag
  return `<div class="alert ${kind}"${kind === 'error' ? ' role="alert"' : ''}><span class="alert-ico">${ico}</span><div>${html}</div></div>`
}
export function empty(icon: string, title: string, hint?: string): string {
  return `<div class="empty">${icon}<p>${esc(title)}</p>${hint ? `<small>${esc(hint)}</small>` : ''}</div>`
}
