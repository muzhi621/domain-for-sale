// ============================================================
// 设计系统（Design System）
// 风格：Premium Black + Gold × Liquid Glass
// 层级：tokens → 基础元素 → 组件 → 布局 Shell
// 约束：纯服务端渲染（Hono 模板字符串），无前端框架
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
}

// ---------- 设计 tokens + 全局样式 ----------
const STYLE = `
:root{
  /* 色彩：Premium Black + Gold */
  --bg:#FAFAF9; --bg-glow:rgba(161,98,7,.10);
  --surface:rgba(255,255,255,.72); --surface-solid:#FFFFFF; --surface-2:#F5F4F1;
  --ink:#1C1917; --ink-2:#44403C; --muted:#78716C;
  --line:#E7E5E4; --line-strong:#D6D3D1;
  --gold:#A16207; --gold-2:#CA8A04; --gold-soft:#FEF6E7; --gold-line:#FDE9C2;
  --ok:#15803D; --ok-soft:#ECFDF3; --ok-line:#BBF7D0;
  --warn:#B45309; --warn-soft:#FFF7ED; --warn-line:#FED7AA;
  --bad:#DC2626; --bad-soft:#FEF2F2; --bad-line:#FECACA;
  --ring:rgba(161,98,7,.34);
  /* 圆角 / 阴影 / 间距 */
  --r-lg:20px; --r:14px; --r-sm:10px; --r-pill:999px;
  --shadow:0 18px 50px -22px rgba(28,25,23,.30);
  --shadow-sm:0 4px 14px -8px rgba(28,25,23,.24);
  --sp-1:6px; --sp-2:10px; --sp-3:14px; --sp-4:20px; --sp-5:28px; --sp-6:40px;
  /* 字体 */
  --serif:'Cormorant Garamond',Georgia,'Songti SC','Noto Serif SC',serif;
  --sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
  --shell-max:1240px;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0C0A09; --bg-glow:rgba(224,178,74,.12);
    --surface:rgba(28,23,20,.78); --surface-solid:#1B1714; --surface-2:#221C18;
    --ink:#FAFAF9; --ink-2:#D6D3D1; --muted:#A8A29E;
    --line:#2C2620; --line-strong:#3A322A;
    --gold:#E0B24A; --gold-2:#FACC15; --gold-soft:#2A2113; --gold-line:#4A3A1C;
    --ok:#4ADE80; --ok-soft:#0F2417; --ok-line:#1B4332;
    --warn:#FBBF24; --warn-soft:#2A1E0B; --warn-line:#5A3F14;
    --bad:#F87171; --bad-soft:#2A1414; --bad-line:#5B2020;
    --ring:rgba(224,178,74,.38);
    --shadow:0 18px 50px -22px rgba(0,0,0,.66);
    --shadow-sm:0 4px 14px -8px rgba(0,0,0,.5);
  }
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;font-family:var(--sans);font-size:16px;line-height:1.6;
  color:var(--ink);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
  background:radial-gradient(1100px 520px at 50% -12%, var(--bg-glow), transparent 62%), var(--bg);}
a{color:var(--gold);text-decoration:none}
button,a,summary,input[type=file],label{cursor:pointer}
input,textarea,select,button{font-family:inherit}
:focus-visible{outline:3px solid var(--ring);outline-offset:2px;border-radius:8px}

/* ---------- 玻璃卡（Liquid Glass） ---------- */
.glass{background:var(--surface);backdrop-filter:blur(16px) saturate(140%);-webkit-backdrop-filter:blur(16px) saturate(140%);
  border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow)}

/* ---------- 按钮 ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  min-height:44px;padding:0 18px;border-radius:var(--r);border:1px solid transparent;
  font-size:15px;font-weight:600;line-height:1;text-decoration:none;
  background:linear-gradient(135deg,var(--gold),var(--gold-2));color:#fff;
  box-shadow:0 8px 20px -10px rgba(161,98,7,.7);
  transition:transform .18s ease, box-shadow .18s ease, filter .18s ease, background .18s ease}
.btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 12px 26px -10px rgba(161,98,7,.75)}
.btn:active{transform:translateY(0)}
.btn.ghost{background:var(--surface);color:var(--ink-2);border-color:var(--line-strong);box-shadow:none}
.btn.ghost:hover{background:var(--surface-2);border-color:var(--gold);color:var(--gold)}
.btn.dark{background:linear-gradient(135deg,#1C1917,#44403C);box-shadow:0 8px 20px -10px rgba(28,25,23,.7)}
.btn.dark:hover{filter:brightness(1.18)}
.btn.danger{background:var(--bad-soft);color:var(--bad);border-color:var(--bad-line);box-shadow:none}
.btn.danger:hover{background:var(--bad);color:#fff;border-color:var(--bad)}
.btn.sm{min-height:34px;padding:0 12px;font-size:13px;border-radius:var(--r-sm)}
.btn.block{width:100%}
@media (max-width:640px){.btn{width:100%}.btn.sm{width:auto}.btn-row{display:flex;flex-wrap:wrap;gap:8px}.btn-row .btn{width:auto;flex:1 1 auto}}

/* ---------- 徽章 / 标签 ---------- */
.badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:var(--r-pill);
  font-size:13px;font-weight:700;line-height:1.4;border:1px solid transparent;white-space:nowrap}
.badge::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}
.badge.for_sale{background:var(--ok-soft);color:var(--ok);border-color:var(--ok-line)}
.badge.reserved{background:var(--warn-soft);color:var(--warn);border-color:var(--warn-line)}
.badge.sold{background:var(--bad-soft);color:var(--bad);border-color:var(--bad-line)}
.chip{display:inline-block;padding:4px 12px;border-radius:var(--r-pill);font-size:13px;font-weight:600;
  background:var(--gold-soft);color:var(--gold);border:1px solid var(--gold-line)}

/* ---------- 提示条 ---------- */
.alert{display:flex;gap:10px;align-items:flex-start;padding:14px 16px;border-radius:var(--r);
  font-size:14px;line-height:1.55;border:1px solid;margin:0 0 var(--sp-4)}
.alert.info{background:var(--gold-soft);border-color:var(--gold-line);color:var(--gold)}
.alert.warn{background:var(--warn-soft);border-color:var(--warn-line);color:var(--warn)}
.alert.error{background:var(--bad-soft);border-color:var(--bad-line);color:var(--bad);font-weight:600}
.alert code{background:var(--surface-solid);border:1px solid var(--line);border-radius:8px;padding:2px 8px;font-size:13px;word-break:break-all}
.alert .btn{margin-left:auto}

/* ---------- 表单 ---------- */
.form{display:flex;flex-direction:column;gap:var(--sp-4)}
.form .grid2{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)}
.field{display:flex;flex-direction:column;gap:7px;font-size:14px;font-weight:600;color:var(--ink-2)}
.field .req{color:var(--bad)}
.field input,.field textarea,.field select{width:100%;min-height:46px;padding:11px 14px;
  border:1px solid var(--line-strong);border-radius:var(--r);font-size:15px;font-weight:400;
  background:var(--surface-solid);color:var(--ink);transition:border-color .18s ease, box-shadow .18s ease}
.field textarea{min-height:100px;resize:vertical;line-height:1.6}
.field input:focus,.field textarea:focus,.field select:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px var(--ring)}
.field .help{font-size:12.5px;font-weight:400;color:var(--muted);line-height:1.5}
.field-err{font-size:13px;font-weight:600;color:var(--bad);min-height:0}
input[aria-invalid=true],textarea[aria-invalid=true]{border-color:var(--bad)}

/* ---------- 表格（移动端自动转卡片） ---------- */
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:var(--surface-solid)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:13px 16px;text-align:left;border-bottom:1px solid var(--line);vertical-align:middle}
th{background:var(--surface-2);color:var(--ink-2);font-size:12px;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover{background:var(--surface-2)}
td.num{font-variant-numeric:tabular-nums}
.row-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 10px;
  border-radius:var(--r-sm);border:1px solid var(--line-strong);background:var(--surface-solid);
  color:var(--ink-2);font-size:13px;font-weight:600;transition:all .18s ease}
.icon-btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-soft)}
.icon-btn.danger:hover{border-color:var(--bad);color:var(--bad);background:var(--bad-soft)}
@media (max-width:820px){
  .table-wrap{border:none;background:transparent;overflow:visible}
  table,thead,tbody,tr,td{display:block;width:100%}
  thead{display:none}
  tbody tr{margin-bottom:12px;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}
  tbody tr:hover{background:var(--surface)}
  td{border:none;padding:6px 0;display:flex;justify-content:space-between;gap:16px;text-align:right}
  td::before{content:attr(data-label);font-size:12px;font-weight:700;color:var(--muted);
    text-transform:uppercase;letter-spacing:.05em;flex:none;text-align:left}
  td.row-actions{justify-content:flex-end;flex-wrap:wrap}
}

/* ---------- 统计卡 ---------- */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--sp-3);margin:0 0 var(--sp-5)}
.stat{padding:18px 20px;border-radius:var(--r);background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-sm)}
.stat b{display:block;font-size:28px;line-height:1.15;color:var(--gold);font-family:var(--sans);
  font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1}
.stat span{font-size:13px;color:var(--muted);font-weight:600}

/* ---------- 管理端 Shell ---------- */
.app{display:grid;grid-template-columns:250px 1fr;gap:var(--sp-5);max-width:var(--shell-max);
  margin:0 auto;padding:var(--sp-5) var(--sp-4) var(--sp-6)}
.brand{display:flex;align-items:center;gap:11px;padding:0 4px var(--sp-4)}
.brand .mark{width:40px;height:40px;flex:none;border-radius:12px;display:grid;place-items:center;color:#fff;
  background:linear-gradient(135deg,var(--gold),var(--gold-2));box-shadow:0 8px 18px -8px rgba(161,98,7,.7)}
.brand b{display:block;font-size:15px;letter-spacing:-.01em}
.brand small{display:block;font-size:12px;color:var(--muted);font-weight:500}
.nav{display:flex;flex-direction:column;gap:4px;padding:var(--sp-3);
  background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);
  box-shadow:var(--shadow-sm);align-self:start;position:sticky;top:var(--sp-4)}
.nav a{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:var(--r);
  color:var(--ink-2);font-size:14.5px;font-weight:600;transition:background .18s ease,color .18s ease}
.nav a:hover{background:var(--surface-2);color:var(--ink)}
.nav a[aria-current=page]{background:var(--gold-soft);color:var(--gold);border:1px solid var(--gold-line)}
.nav .sep{height:1px;background:var(--line);margin:6px 4px}
.nav .foot{font-size:12px;color:var(--muted);padding:8px 14px 2px;line-height:1.5}
.main{min-width:0}
.page-head{display:flex;flex-wrap:wrap;gap:var(--sp-3);align-items:center;justify-content:space-between;margin-bottom:var(--sp-4)}
.page-head h1{margin:0;font-size:26px;font-weight:700;letter-spacing:-.02em}
.page-head .sub{margin:4px 0 0;font-size:14px;color:var(--muted)}
.panel{padding:var(--sp-5);background:var(--surface);border:1px solid var(--line);
  border-radius:var(--r-lg);box-shadow:var(--shadow);margin-bottom:var(--sp-4)}
.panel-tight{padding:var(--sp-4)}
.section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
  color:var(--muted);margin:0 0 var(--sp-3)}
.empty{text-align:center;padding:var(--sp-6) var(--sp-4);color:var(--muted)}
.empty svg{color:var(--line-strong);margin-bottom:10px}
.empty p{margin:0 0 4px;font-weight:600;color:var(--ink-2)}
.empty small{font-size:13px}
@media (max-width:900px){
  .app{grid-template-columns:1fr;gap:var(--sp-4);padding:var(--sp-4) var(--sp-3) var(--sp-5)}
  .nav{position:static;flex-direction:row;overflow-x:auto;padding:8px;-webkit-overflow-scrolling:touch}
  .nav a{white-space:nowrap;flex:none}
  .nav .sep,.nav .foot{display:none}
  .panel{padding:var(--sp-4)}
}

/* ---------- 公开端（域名出售页） ---------- */
.public{max-width:820px;margin:0 auto;padding:var(--sp-6) var(--sp-4) var(--sp-4)}
.pub-hero{padding:var(--sp-6) var(--sp-5) var(--sp-5);position:relative;overflow:hidden}
.pub-hero::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;
  background:linear-gradient(90deg,var(--gold),var(--gold-2))}
.domain-title{font-family:var(--serif);font-size:clamp(40px,8vw,68px);line-height:1.05;
  margin:12px 0 0;font-weight:600;letter-spacing:-.01em;word-break:break-all}
.domain-title::after{content:"";display:block;width:66px;height:3px;margin-top:16px;border-radius:2px;
  background:linear-gradient(90deg,var(--gold),var(--gold-2))}
.price-row{display:flex;flex-wrap:wrap;align-items:center;gap:var(--sp-4);justify-content:space-between;
  padding:var(--sp-4);margin-top:var(--sp-5);border-radius:var(--r);
  background:var(--surface-2);border:1px solid var(--line)}
.price{font-size:34px;font-weight:800;line-height:1.15;font-family:var(--sans);
  font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1;letter-spacing:-.01em}
.price .cur{font-size:17px;font-weight:700;color:var(--gold);margin-right:6px}
.price .min{display:block;font-size:13px;font-weight:600;color:var(--muted);margin-top:3px}
.contacts{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.contacts li{display:flex;align-items:center;gap:11px;padding:13px 16px;border-radius:var(--r);
  background:var(--surface-2);border:1px solid var(--line)}
.contacts svg{flex:none;color:var(--gold)}
.contacts a{color:var(--ink);font-weight:600;word-break:break-all}
.desc{white-space:pre-wrap;color:var(--ink-2);font-size:16.5px;margin:0}
.meta-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--sp-3);margin:0}
.meta-list div{padding:13px 15px;border-radius:var(--r);background:var(--surface-2);border:1px solid var(--line)}
.meta-list dt{font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin:0 0 3px}
.meta-list dd{margin:0;font-size:15px;font-weight:600}
.foot{text-align:center;color:var(--muted);font-size:12.5px;padding:var(--sp-5) var(--sp-4) var(--sp-6)}
.foot a{color:var(--muted)}
@media (max-width:640px){
  .public{padding:var(--sp-4) 12px}
  .pub-hero{padding:var(--sp-5) 18px}
  .form .grid2{grid-template-columns:1fr}
}

/* ---------- 登录页 ---------- */
.login-wrap{min-height:100vh;display:grid;place-items:center;padding:var(--sp-4)}
.login-card{width:100%;max-width:420px;padding:var(--sp-6) var(--sp-5)}
.login-brand{display:flex;align-items:center;gap:12px;margin-bottom:var(--sp-5)}
.login-brand .mark{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;color:#fff;
  background:linear-gradient(135deg,var(--gold),var(--gold-2));box-shadow:0 10px 24px -10px rgba(161,98,7,.8)}
.login-brand b{font-size:17px;display:block}
.login-brand small{font-size:12.5px;color:var(--muted)}

@media (prefers-reduced-motion: reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
`.trim()

// ---------- 页面骨架 ----------
export function layout(title: string, body: string, head = '', extraCss = ''): string {
  const fonts =
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">'
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light dark">` +
    `<title>${esc(title)}</title>${fonts}${head}<style>${STYLE}${extraCss}</style></head><body>${body}</body></html>`
}

export function foot(): string {
  return `<footer class="foot">域名出售展示系统 · Hono 驱动 · Cloudflare / EdgeOne Pages 就绪</footer>`
}

// ---------- 管理端 Shell ----------
export type NavKey = 'overview' | 'domains' | 'new' | 'import' | 'inquiries'

export function adminShell(active: NavKey, inner: string, opts: { title: string; sub?: string; actions?: string }): string {
  const item = (key: NavKey, href: string, label: string, icon: string) =>
    `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`
  const nav = `<nav class="nav" aria-label="后台导航">
    ${item('overview', '/admin', '概览', ICON.grid)}
    ${item('domains', '/admin/domains', '域名管理', ICON.globe)}
    ${item('new', '/admin/domains/new', '新增域名', ICON.plus)}
    ${item('import', '/admin/import', '批量导入', ICON.upload)}
    ${item('inquiries', '/admin/inquiries', '询价管理', ICON.inbox)}
    <div class="sep"></div>
    <a href="/admin/logout">${ICON.logout}<span>退出登录</span></a>
    <div class="foot">${ICON.shield} 登录状态保持 24 小时</div>
  </nav>`
  const head = `<div class="page-head">
      <div><h1>${esc(opts.title)}</h1>${opts.sub ? `<p class="sub">${esc(opts.sub)}</p>` : ''}</div>
      ${opts.actions ? `<div class="btn-row">${opts.actions}</div>` : ''}
    </div>`
  const body = `<div class="app">
    <div>
      <div class="brand"><span class="mark">${ICON.globe}</span><div><b>域名出售系统</b><small>Domain For Sale</small></div></div>
      ${nav}
    </div>
    <main class="main">${head}${inner}</main>
  </div>`
  return layout(opts.title, body)
}

// ---------- 组件 ----------
export function statusLabel(s?: string): string {
  return { for_sale: '出售中', reserved: '已预订', sold: '已售出' }[s || ''] || s || '未知'
}
export function badge(status?: string): string {
  return `<span class="badge ${esc(status || 'for_sale')}">${statusLabel(status)}</span>`
}
export function stat(value: string | number, label: string): string {
  return `<div class="stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`
}
export function alertBox(kind: 'info' | 'warn' | 'error', html: string): string {
  return `<div class="alert ${kind}"${kind === 'error' ? ' role="alert"' : ''}>${html}</div>`
}
export function empty(icon: string, title: string, hint?: string): string {
  return `<div class="empty">${icon}<p>${esc(title)}</p>${hint ? `<small>${esc(hint)}</small>` : ''}</div>`
}
