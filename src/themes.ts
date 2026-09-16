// ============================================================
// 展示页主题（仅作用于公开的域名出售页，管理后台保持统一风格）
// 每套主题通过覆盖设计变量实现，无需改动页面结构
// 新增主题：在此追加一项即可，后台下拉会自动出现
// ============================================================

export type ThemeId = 'classic' | 'minimal' | 'tech' | 'elegant' | 'neon'

export interface Theme {
  id: ThemeId
  name: string
  desc: string
  css: string
}

const classic: Theme = {
  id: 'classic',
  name: '经典黑金',
  desc: '黑金 Premium · 玻璃质感',
  css: '', // 即 ui.ts 的默认 tokens
}

const minimal: Theme = {
  id: 'minimal',
  name: '极简白',
  desc: '黑白灰 · 大留白 · 无装饰',
  css: `
:root{--bg:#FFFFFF;--bg-glow:transparent;--surface:#FFFFFF;--surface-solid:#FFFFFF;--surface-2:#F6F6F6;
--ink:#111111;--ink-2:#3F3F46;--muted:#71717A;--line:#E4E4E7;--line-strong:#D4D4D8;
--gold:#18181B;--gold-2:#3F3F46;--gold-soft:#F4F4F5;--gold-line:#E4E4E7;
--ok:#15803D;--ok-soft:#F0FDF4;--ok-line:#BBF7D0;--warn:#B45309;--bad:#B91C1C;--bad-soft:#FEF2F2;--bad-line:#FECACA;
--ring:rgba(24,24,27,.28);--r-lg:10px;--r:8px;--r-sm:6px;
--shadow:0 1px 2px rgba(0,0,0,.06);--shadow-sm:none}
.glass{background:#fff;backdrop-filter:none;-webkit-backdrop-filter:none}
.pub-hero::before{background:#111}
.pub-hero{border-radius:10px}
.domain-title{font-family:var(--sans);font-weight:800;letter-spacing:-.035em;font-size:clamp(34px,6.5vw,58px)}
.domain-title::after{width:46px;height:2px;background:#111;border-radius:0}
.price-row{background:#F6F6F6}
.btn{background:#111;box-shadow:none;border-radius:8px}
.btn:hover{background:#27272A;filter:none;transform:none}
.btn.ghost{background:#fff;color:#3F3F46;border-color:#D4D4D8}
.btn.ghost:hover{background:#F6F6F6;color:#111;border-color:#111}
.chip{background:#F4F4F5;color:#3F3F46;border-color:#E4E4E7}
@media (prefers-color-scheme: dark){
  :root{--bg:#09090B;--surface:#18181B;--surface-solid:#18181B;--surface-2:#27272A;
  --ink:#FAFAFA;--ink-2:#D4D4D8;--muted:#A1A1AA;--line:#27272A;--line-strong:#3F3F46;
  --gold:#FAFAFA;--gold-2:#D4D4D8;--gold-soft:#27272A;--gold-line:#3F3F46;--ring:rgba(250,250,250,.3)}
  .glass{background:#18181B}
  .pub-hero::before{background:#FAFAFA}
  .domain-title::after{background:#FAFAFA}
  .btn{background:#FAFAFA;color:#111}
  .btn:hover{background:#E4E4E7}
  .btn.ghost{background:#18181B;color:#D4D4D8;border-color:#3F3F46}
}
`,
}

const tech: Theme = {
  id: 'tech',
  name: '科技蓝',
  desc: '深空蓝 · 网格底纹 · 青蓝高光',
  css: `
:root{--bg:#0B1220;--bg-glow:rgba(56,189,248,.16);--surface:rgba(17,27,46,.78);--surface-solid:#111B2E;--surface-2:#16233C;
--ink:#E6F1FF;--ink-2:#A9C0DE;--muted:#7C93B5;--line:#1E2E4A;--line-strong:#2A3F63;
--gold:#38BDF8;--gold-2:#22D3EE;--gold-soft:#0F2438;--gold-line:#1E3A5F;
--ok:#34D399;--ok-soft:#0C2A22;--ok-line:#1B4332;--warn:#FBBF24;--bad:#F87171;--bad-soft:#2A1414;--bad-line:#5B2020;
--ring:rgba(56,189,248,.42);--shadow:0 20px 50px -24px rgba(0,0,0,.8)}
body{background:
  radial-gradient(900px 460px at 50% -12%, var(--bg-glow), transparent 60%),
  linear-gradient(0deg, rgba(56,189,248,.045) 1px, transparent 1px) 0 0/100% 34px,
  linear-gradient(90deg, rgba(56,189,248,.045) 1px, transparent 1px) 0 0/34px 100%,
  var(--bg)}
.glass{border-color:var(--line-strong)}
.pub-hero::before{background:linear-gradient(90deg,#38BDF8,#22D3EE)}
.domain-title{font-family:var(--sans);font-weight:800;letter-spacing:-.025em;font-size:clamp(34px,7vw,60px)}
.domain-title::after{background:linear-gradient(90deg,#38BDF8,#22D3EE)}
.price{font-variant-numeric:tabular-nums}
.price .cur{color:#38BDF8}
.btn{background:linear-gradient(135deg,#0EA5E9,#22D3EE);box-shadow:0 10px 26px -10px rgba(14,165,233,.8)}
.btn:hover{box-shadow:0 14px 32px -10px rgba(14,165,233,.9)}
.btn.dark{background:linear-gradient(135deg,#1E3A5F,#2A4A73)}
.chip{background:var(--gold-soft);color:#7DD3FC;border-color:var(--gold-line)}
.contacts a,.desc{color:var(--ink)}
@media (prefers-color-scheme: dark){
  :root{--bg:#070C16;--surface:rgba(14,22,38,.82);--surface-solid:#0E1626;--surface-2:#16233C}
}
`,
}

const elegant: Theme = {
  id: 'elegant',
  name: '雅致米棕',
  desc: '米白纸感 · 衬线排版 · 杂志风',
  css: `
:root{--bg:#FBF8F3;--bg-glow:rgba(124,74,33,.09);--surface:rgba(255,253,250,.88);--surface-solid:#FFFDFA;--surface-2:#F5EFE6;
--ink:#2E2419;--ink-2:#5A4A38;--muted:#8A7863;--line:#E8DFD2;--line-strong:#DACDBA;
--gold:#7C4A21;--gold-2:#A9702F;--gold-soft:#F6EDE0;--gold-line:#E5D6C0;
--ok:#3F6B45;--ok-soft:#EDF5EE;--ok-line:#CBE3CF;--warn:#8A5A1A;--bad:#8C3B2E;--bad-soft:#FBEFED;--bad-line:#E8CFCA;
--ring:rgba(124,74,33,.3);--r-lg:14px;--shadow:0 16px 40px -26px rgba(62,45,26,.5)}
body{background:radial-gradient(900px 460px at 50% -10%, var(--bg-glow), transparent 62%), var(--bg)}
.glass{background:var(--surface);border-color:var(--gold-line)}
.pub-hero{border-radius:14px}
.pub-hero::before{background:linear-gradient(90deg,#7C4A21,#A9702F)}
.domain-title{font-family:var(--serif);font-weight:600;font-size:clamp(38px,7.5vw,66px);letter-spacing:0}
.domain-title::after{width:72px;height:2px;background:linear-gradient(90deg,#7C4A21,#A9702F)}
.price-row{background:var(--surface-2);border-color:var(--gold-line)}
.btn{background:linear-gradient(135deg,#7C4A21,#A9702F);box-shadow:0 10px 24px -12px rgba(124,74,33,.8);border-radius:10px}
.btn.dark{background:linear-gradient(135deg,#3F3226,#5A4A38)}
.section-title{color:#8A7863;letter-spacing:.14em}
.desc{font-size:17px;line-height:1.75}
@media (prefers-color-scheme: dark){
  :root{--bg:#1A140E;--bg-glow:rgba(169,112,47,.14);--surface:rgba(38,29,21,.88);--surface-solid:#261D15;--surface-2:#31251A;
  --ink:#F5EEE4;--ink-2:#D9CBB8;--muted:#A89680;--line:#3A2C1F;--line-strong:#4A3927;
  --gold:#D9A05B;--gold-2:#E8B978;--gold-soft:#31251A;--gold-line:#4A3927;--ring:rgba(217,160,91,.36)}
  .glass{background:var(--surface)}
}
`,
}

const neon: Theme = {
  id: 'neon',
  name: '暗夜霓虹',
  desc: '暗底 · 紫粉渐变 · 发光感',
  css: `
:root{--bg:#0A0A0F;--bg-glow:rgba(168,85,247,.2);--surface:rgba(20,16,32,.82);--surface-solid:#141020;--surface-2:#1C1730;
--ink:#F2EEFF;--ink-2:#C7B9E8;--muted:#9C8FC0;--line:#2A2340;--line-strong:#3A3157;
--gold:#A855F7;--gold-2:#EC4899;--gold-soft:#1E1630;--gold-line:#3A2A55;
--ok:#4ADE80;--ok-soft:#0F2417;--ok-line:#1B4332;--warn:#FBBF24;--bad:#F87171;--bad-soft:#2A1414;--bad-line:#5B2020;
--ring:rgba(168,85,247,.48);--shadow:0 22px 56px -26px rgba(0,0,0,.9)}
body{background:
  radial-gradient(760px 420px at 15% -8%, rgba(168,85,247,.22), transparent 60%),
  radial-gradient(760px 420px at 85% 4%, rgba(236,72,153,.16), transparent 62%),
  var(--bg)}
.glass{border-color:var(--line);box-shadow:0 0 0 1px rgba(168,85,247,.06), var(--shadow)}
.pub-hero::before{background:linear-gradient(90deg,#A855F7,#EC4899)}
.domain-title{font-family:var(--sans);font-weight:800;letter-spacing:-.03em;font-size:clamp(34px,7vw,60px);
  text-shadow:0 0 30px rgba(168,85,247,.45)}
.domain-title::after{background:linear-gradient(90deg,#A855F7,#EC4899);box-shadow:0 0 16px rgba(168,85,247,.6)}
.btn{background:linear-gradient(135deg,#A855F7,#EC4899);box-shadow:0 10px 28px -10px rgba(168,85,247,.85)}
.btn:hover{box-shadow:0 14px 36px -10px rgba(236,72,153,.9)}
.btn.dark{background:linear-gradient(135deg,#2A2340,#3A3157)}
.price{color:#fff}
.price .cur{color:#E879F9}
.chip{background:var(--gold-soft);color:#E9D5FF;border-color:var(--gold-line)}
.contacts li,.price-row{background:var(--surface-2);border-color:var(--line)}
@media (prefers-color-scheme: dark){
  :root{--bg:#07070B;--surface:rgba(16,13,26,.86);--surface-solid:#100D1A;--surface-2:#1C1730}
}
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
