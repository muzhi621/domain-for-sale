#!/usr/bin/env bash
#
# domain-for-sale —— 独立服务器一键部署脚本（1Panel / OpenResty / nginx 适配版）
# 适用：1Panel 主机（OpenResty 反代）、或任意已装 nginx/openresty 的 Linux 服务器
# 作用：克隆代码 → 安装 Node / pm2 → 配置文件存储 → 启动服务 → 生成 OpenResty 反代配置
#        → 用 acme.sh 为全部域名批量签发一张 SAN 证书（自动 HTTPS，无需逐个登记）
#
# 设计要点：
#   · 一个 Node 进程（pm2）服务全部域名，按访问 Host 自动展示对应出售页。
#   · 不安装 Caddy，避免与 1Panel/OpenResty 争抢 80/443 端口（Caddy 仅作可选 --tls caddy）。
#   · 证书：acme.sh 把全部域名放进「同一张 Let's Encrypt SAN 证书」（上限 100 域，30 域无压力）。
#   · 反向代理目标一律写 127.0.0.1:8788（host:port，不带 http://）——这正是 1Panel 反向代理
#     填「目标URL」时的正确写法（带 http:// 会触发 invalid port in upstream 报错）。
#
# 用法：
#   bash deploy-server.sh                      # 交互式安装（提示后台密码）
#   bash deploy-server.sh --non-interactive    # 无人值守（用环境变量 / 默认值）
#   bash deploy-server.sh cert                 # 导入域名后，批量签发 HTTPS 证书并应用
#   bash deploy-server.sh uninstall            # 一键卸载（停 pm2 + 清 Caddy 残留，释放 80/443）
#   bash deploy-server.sh uninstall --purge    # 卸载并彻底删除应用目录（含 data/data.json）
#
# 可用环境变量覆盖默认值：
#   REPO_URL  APP_DIR  PORT  DATA_FILE  ADMIN_PASSWORD  SITE_DOMAIN  SEED  ACME_EMAIL
#   PROXY_MODE(默认 nginx；--tls caddy 等价于 PROXY_MODE=caddy)
#
set -uo pipefail

# ----------------------------- 可配置项（环境变量可覆盖）-----------------------------
REPO_URL="${REPO_URL:-https://github.com/muzhi621/domain-for-sale.git}"
APP_DIR="${APP_DIR:-/opt/domain-for-sale}"
PORT="${PORT:-8788}"
DATA_FILE="${DATA_FILE:-data/data.json}"        # 相对 APP_DIR 的路径
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"            # 留空则自动生成（首次运行）
SITE_DOMAIN="${SITE_DOMAIN:-}"                  # 后台显示的「访问目标」，留空则尝试取公网 IP
SEED="${SEED:-1}"                               # 首跑写入示例域名：1=写, 0=不写
ACME_EMAIL="${ACME_EMAIL:-}"                    # Let's Encrypt 注册邮箱（留空用 admin@<SITE_DOMAIN>）
PURGE="${PURGE:-0}"                             # 卸载时是否连应用目录一起删：1=删, 0=保留
PROXY_MODE="${PROXY_MODE:-nginx}"              # nginx(默认,适配 1Panel) | caddy
UPSTREAM_HOST="${UPSTREAM_HOST:-}"             # 反代目标主机；留空自动探测（1Panel 的 OpenResty 是 Docker 容器时须用宿主机网关 IP，否则 502）
ACTION="install"
NON_INTERACTIVE=0
for _a in "$@"; do
  case "$_a" in
    --non-interactive) NON_INTERACTIVE=1 ;;
    --purge)          PURGE=1 ;;
    --tls)            PROXY_MODE="caddy" ;;          # 旧参数兼容
    --tls=caddy)      PROXY_MODE="caddy" ;;
    --tls=nginx)      PROXY_MODE="nginx" ;;
    cert|issue-certs) ACTION="cert" ;;
    --uninstall|uninstall) ACTION="uninstall" ;;
  esac
done

# ----------------------------- 颜色 / 日志 -----------------------------
if [ -t 1 ]; then
  C_R="\033[31m"; C_G="\033[32m"; C_Y="\033[33m"; C_B="\033[36m"; C_N="\033[0m"
else
  C_R=""; C_G=""; C_Y=""; C_B=""; C_N=""
fi
log()  { echo -e "${C_G}[✔]${C_N} $*"; }
warn() { echo -e "${C_Y}[!]${C_N} $*"; }
err()  { echo -e "${C_R}[✘]${C_N} $*" >&2; }
info() { echo -e "${C_B}[→]${C_N} $*"; }

# ----------------------------- 环境检测 -----------------------------
has_apt()  { command -v apt-get >/dev/null 2>&1; }
has_dnf()  { command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; }
run_apt()  { apt-get update -y && apt-get install -y "$@"; }

if [ "$(id -u)" -ne 0 ]; then
  err "请使用 root 运行本脚本（需要安装系统软件 / 写反代配置）。"
  exit 1
fi

# 1Panel / OpenResty / nginx 探测
detect_1panel() { [ -d /opt/1panel ] || command -v 1panel >/dev/null 2>&1; }
detect_web_server() {
  # 返回 openresty | nginx | none
  if command -v openresty >/dev/null 2>&1 || (systemctl list-unit-files 2>/dev/null | grep -q openresty); then
    echo openresty
  elif command -v nginx >/dev/null 2>&1 || (systemctl list-unit-files 2>/dev/null | grep -q nginx); then
    echo nginx
  else
    echo none
  fi
}
find_conf_d() {
  # 找到第一个可写的 conf.d 目录
  for d in /opt/1panel/apps/openresty/openresty/conf/conf.d /usr/local/openresty/nginx/conf/conf.d /etc/nginx/conf.d; do
    [ -d "$d" ] && { echo "$d"; return; }
  done
  echo ""
}
reload_web() {
  # 重启 / 热加载 web 前端（释放端口或应用新证书）
  if systemctl list-unit-files 2>/dev/null | grep -q openresty; then
    systemctl restart openresty 2>/dev/null && log "已重启 openresty" || true
  elif command -v openresty >/dev/null 2>&1; then
    openresty -s reload 2>/dev/null && log "已 reload openresty" || true
  elif systemctl list-unit-files 2>/dev/null | grep -q nginx; then
    systemctl restart nginx 2>/dev/null && log "已重启 nginx" || true
  elif command -v nginx >/dev/null 2>&1; then
    nginx -s reload 2>/dev/null && log "已 reload nginx" || true
  else
    warn "未检测到 web 服务（openresty/nginx），请手动加载反代配置。"
  fi
}

detect_upstream_host() {
  # 若 1Panel/OpenResty 跑在 Docker 容器里（1Panel 默认），容器内的 127.0.0.1 是容器自身，
  # 反代到 127.0.0.1:<PORT> 会 502；须改用宿主机 docker0 网关 IP（应用需监听 0.0.0.0）。
  [ -n "$UPSTREAM_HOST" ] && return
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -qi openresty; then
    local gw; gw=$(ip -4 addr show docker0 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1 | head -1)
    if [ -n "$gw" ]; then
      UPSTREAM_HOST="$gw"
      warn "检测到 OpenResty 运行在 Docker 容器中（1Panel 默认），反代目标自动改用宿主机网关 ${UPSTREAM_HOST}:${PORT}。"
      warn "容器内 127.0.0.1 不可达宿主机，这正是 1Panel 反代报 502 Bad Gateway 的常见原因。"
      return
    fi
  fi
  UPSTREAM_HOST="127.0.0.1"
}

# ----------------------------- 卸载模式 -----------------------------
do_uninstall() {
  log "开始卸载 domain-for-sale 部署…"
  # 1) 停止 pm2 进程（pm2 可能不在 PATH，尝试 npm 全局 bin 目录）
  local pm2_bin="pm2"
  if ! command -v pm2 >/dev/null 2>&1; then
    local np_bin; np_bin="$(npm prefix -g 2>/dev/null)/bin"
    [ -x "$np_bin/pm2" ] && pm2_bin="$np_bin/pm2"
  fi
  if command -v "$pm2_bin" >/dev/null 2>&1 || [ -x "$pm2_bin" ]; then
    "$pm2_bin" delete domain-for-sale 2>/dev/null || true
    "$pm2_bin" save 2>/dev/null || true
    log "已停止并移除 pm2 进程 domain-for-sale"
  else
    warn "未检测到 pm2，跳过"
  fi
  # 2) 移除生成的 OpenResty/nginx 反代配置（备份）
  local conf_d; conf_d=$(find_conf_d)
  if [ -n "$conf_d" ] && [ -f "$conf_d/domain-for-sale.conf" ]; then
    cp -f "$conf_d/domain-for-sale.conf" "$conf_d/domain-for-sale.conf.bak.$(date +%s)" 2>/dev/null || true
    rm -f "$conf_d/domain-for-sale.conf" && log "已备份并移除 $conf_d/domain-for-sale.conf" || true
  fi
  rm -f "$APP_DIR/ecosystem.config.cjs" && log "已删除 $APP_DIR/ecosystem.config.cjs" || true
  # 3) 停止 Caddy 残留（释放 80/443，交还给 1Panel/OpenResty/nginx）
  if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ] && systemctl list-unit-files caddy.service 2>/dev/null | grep -q caddy; then
    systemctl stop caddy 2>/dev/null && log "已停止 caddy (systemd)" || true
    systemctl disable caddy 2>/dev/null || true
  fi
  if command -v caddy >/dev/null 2>&1; then
    pkill -f 'caddy run' 2>/dev/null && log "已结束 caddy 进程（释放 80/443 端口）" || true
  fi
  if [ -f /etc/caddy/Caddyfile ]; then
    cp -f /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$(date +%s)" 2>/dev/null || true
    rm -f /etc/caddy/Caddyfile && log "已备份并移除 /etc/caddy/Caddyfile" || true
  fi
  # 4) 是否删除整个应用目录（含数据 data/data.json）
  if [ "$PURGE" = "1" ]; then
    rm -rf "$APP_DIR" && log "已彻底删除应用目录 $APP_DIR（含 data/data.json 数据）" || true
  else
    warn "保留应用目录 $APP_DIR（代码与数据未删）；加 --purge 可彻底删除。"
  fi
  # 5) 让出后的 80/443 端口生效（交还给 1Panel/OpenResty）
  reload_web
  echo
  echo -e "${C_G}卸载完成。${C_N}"
  echo "  · pm2 进程已停止；若曾装过 Caddy，已停止并让出 80/443 端口。"
  echo "  · 反代配置（domain-for-sale.conf）已移除，web 前端已重载。"
  echo "  · 若使用 1Panel 面板自建的反向代理站点，目标仍需是 127.0.0.1:${PORT}（不带 http://）。"
  echo "  · 重新部署：bash deploy-server.sh"
}
if [ "$ACTION" = "uninstall" ]; then
  do_uninstall
  exit 0
fi

# ----------------------------- 安装器 -----------------------------
ensure_git() {
  if command -v git >/dev/null 2>&1; then log "git 已安装"; return; fi
  info "安装 git…"
  has_apt && run_apt git || (has_dnf && (command -v dnf >/dev/null && dnf install -y git || yum install -y git))
}
ensure_curl() {
  command -v curl >/dev/null 2>&1 && return
  info "安装 curl…"
  has_apt && run_apt curl || (has_dnf && (command -v dnf >/dev/null && dnf install -y curl || yum install -y curl))
}
ensure_node() {
  # 注意：必须 node 和 npm 同时可用才算满足（部分系统装了 node 却没有 npm，
  # 会导致后续 `npm i -g pm2`、`npm install` 全部静默失败）
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    local v; v=$(node -v | sed 's/v//; s/\..*//')
    if [ "${v:-0}" -ge 18 ]; then log "Node $(node -v) + npm 已满足要求(>=18)"; return; fi
  fi
  info "安装 Node.js 20 LTS…"
  if has_apt; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    run_apt nodejs
    if ! command -v npm >/dev/null 2>&1; then run_apt npm; fi
  else
    local tmp; tmp=$(mktemp -d)
    curl -fsSL "https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz" -o "$tmp/node.tar.xz"
    tar -xJf "$tmp/node.tar.xz" -C /opt
    ln -sf /opt/node-v20.18.0-linux-x64/bin/node /usr/local/bin/node
    ln -sf /opt/node-v20.18.0-linux-x64/bin/npm  /usr/local/bin/npm
    ln -sf /opt/node-v20.18.0-linux-x64/bin/npx  /usr/local/bin/npx
    rm -rf "$tmp"
  fi
}
ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then log "pm2 已安装"; return; fi
  # npm 全局 bin 目录（Node 二进制兜底安装时为 /opt/node-*/bin，通常不在 PATH 中）
  local npm_bin
  npm_bin="$(npm prefix -g 2>/dev/null)/bin"
  if [ -x "$npm_bin/pm2" ]; then
    ln -sf "$npm_bin/pm2" /usr/local/bin/pm2 && hash -r
    command -v pm2 >/dev/null 2>&1 && { log "pm2 已可用（已链接 $npm_bin/pm2 → /usr/local/bin/pm2）"; return; }
  fi
  info "全局安装 pm2…"
  npm i -g pm2
  hash -r
  if ! command -v pm2 >/dev/null 2>&1 && [ -x "$npm_bin/pm2" ]; then
    ln -sf "$npm_bin/pm2" /usr/local/bin/pm2 && hash -r
  fi
  if ! command -v pm2 >/dev/null 2>&1; then
    err "pm2 安装后仍不可用。请手动执行："
    err "  npm i -g pm2 && ln -sf \"\$(npm prefix -g)/bin/pm2\" /usr/local/bin/pm2"
    exit 1
  fi
  log "pm2 安装完成"
}
ensure_acme() {
  if [ -x "$HOME/.acme.sh/acme.sh" ]; then log "acme.sh 已安装"; return; fi
  info "安装 acme.sh（用于批量签发 HTTPS 证书）…"
  ensure_curl
  curl https://get.acme.sh | sh -s email="$ACME_EMAIL"
}

# Caddy 分支（可选，极少用；1Panel 默认用 nginx/openresty 反代）
ensure_caddy_inline() {
  if command -v caddy >/dev/null 2>&1; then log "Caddy 已安装"; else
    info "安装 Caddy（仅在 --tls caddy 时）…"
    if has_apt; then
      apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
      run_apt caddy
    else
      curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/bin/caddy
      chmod +x /usr/bin/caddy
    fi
  fi
  mkdir -p /etc/caddy
  cat > /etc/caddy/Caddyfile <<CADDY
{
    email ${ACME_EMAIL}
    on_demand_tls {
        ask http://127.0.0.1:${PORT}/api/domain-exists
        interval 2m
        burst 5
    }
}
:443 {
    tls { on_demand }
    encode gzip
    reverse_proxy 127.0.0.1:${PORT}
}
CADDY
  if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
    systemctl enable --now caddy >/dev/null 2>&1 || true
    systemctl restart caddy || warn "systemctl restart caddy 失败，请手动检查"
  else
    pkill -f 'caddy run' 2>/dev/null || true
    nohup caddy run --config /etc/caddy/Caddyfile --adapter caddyfile >/var/log/caddy.log 2>&1 &
  fi
  log "Caddy 已配置并启动（on-demand TLS）。"
}

# ----------------------------- 拉取 / 更新代码 -----------------------------
fetch_repo() {
  if [ -d "$APP_DIR/.git" ]; then
    info "更新代码：$APP_DIR"
    git -C "$APP_DIR" pull --ff-only || warn "git pull 失败，继续（可能本地有改动）"
  else
    info "克隆仓库到 $APP_DIR"
    mkdir -p "$(dirname "$APP_DIR")"
    git clone "$REPO_URL" "$APP_DIR"
  fi
}

# ----------------------------- 复用上次配置（保持后台密码不变）-----------------------------
EXPLICIT_ADMIN="$ADMIN_PASSWORD"
if [ -f "$APP_DIR/.deploy-env" ]; then
  log "读取上次部署配置 $APP_DIR/.deploy-env"
  set -a; . "$APP_DIR/.deploy-env"; set +a
fi
[ -n "$EXPLICIT_ADMIN" ] && ADMIN_PASSWORD="$EXPLICIT_ADMIN"

# ----------------------------- 交互 / 生成关键值 -----------------------------
if [ -z "$SITE_DOMAIN" ]; then
  SITE_DOMAIN=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || true)
  [ -z "$SITE_DOMAIN" ] && SITE_DOMAIN=$(hostname -I 2>/dev/null | awk '{print $1}')
  [ -z "$SITE_DOMAIN" ] && SITE_DOMAIN="your-server-ip"
fi
if [ -z "$ACME_EMAIL" ]; then
  ACME_EMAIL="admin@${SITE_DOMAIN}"
fi
if [ -z "$ADMIN_PASSWORD" ]; then
  if [ "$NON_INTERACTIVE" = 1 ]; then
    ADMIN_PASSWORD=$(openssl rand -base64 12 2>/dev/null | tr -dc 'A-Za-z0-9' | head -c 16 || echo "admin$(date +%s)")
  else
    read -r -p "设置后台登录密码（留空自动生成）: " ADMIN_PASSWORD
    [ -z "$ADMIN_PASSWORD" ] && ADMIN_PASSWORD=$(openssl rand -base64 12 2>/dev/null | tr -dc 'A-Za-z0-9' | head -c 16)
  fi
fi

# ----------------------------- 证书签发（cert 子命令）-----------------------------
do_cert() {
  # 从 data.json 读取全部域名（storage.ts 的 createFileKV 以域名为 key）
  local domains json
  json="$APP_DIR/$DATA_FILE"
  if [ ! -f "$json" ]; then err "未找到数据文件 $json，请先完成安装并导入域名。"; exit 1; fi
  domains=$(node -e "try{const d=require('$json');const ks=Object.keys(d||{});console.log(ks.join(' '));}catch(e){console.error(e.message);process.exit(2);}" 2>/dev/null)
  if [ -z "$domains" ]; then err "数据文件中没有任何域名，请先在后台导入你的 30 个域名（或 SEED=1 写入示例后替换）。"; exit 1; fi

  # 限制单张 SAN 证书域名数（Let's Encrypt 上限 100）
  local count; count=$(echo "$domains" | wc -w)
  if [ "$count" -gt 100 ]; then warn "域名数 $count 超过 100，仅取前 100 个签发（如需更多请分多张证书）。"; domains=$(echo "$domains" | cut -d' ' -f1-100); fi

  info "将为以下域名批量签发一张 SAN 证书："
  echo "    $domains"
  echo "    （请确认这些域名的 A 记录都已指向本机公网 IP，否则 HTTP-01 验证会失败）"

  local main; main=$(echo "$domains" | awk '{print $1}')
  local dargs=""; for d in $domains; do dargs="$dargs -d $d"; done
  local webroot="$APP_DIR/.well-known"
  mkdir -p "$webroot"

  "$HOME/.acme.sh/acme.sh" --issue --webroot "$webroot" $dargs \
    --reloadcmd "$(command -v systemctl >/dev/null && echo 'systemctl restart openresty' || echo 'openresty -s reload')" \
    || { err "acme.sh 签发失败，请检查域名解析与 80 端口可达性。"; exit 1; }

  # 生成/更新 OpenResty 反代配置（含 443 + 真实证书路径）
  gen_nginx_conf "$domains" "$main"

  # 应用到 1Panel/OpenResty 的 conf.d 并热加载
  local conf_d; conf_d=$(find_conf_d)
  if [ -n "$conf_d" ]; then
    cp -f "$APP_DIR/nginx/domain-proxy.conf" "$conf_d/domain-for-sale.conf" && log "已写入 $conf_d/domain-for-sale.conf"
    reload_web
  else
    warn "未找到 conf.d 目录，请手动把 $APP_DIR/nginx/domain-proxy.conf 包含进 OpenResty/nginx，并 reload。"
  fi
  echo
  echo -e "${C_G}HTTPS 证书已签发并应用 🎉 现在可访问 https://<你的域名> 查看出售页。${C_N}"
  echo -e "${C_Y}注意：若你同时在 1Panel 面板为同一域名建了反向代理站点，请二选一（脚本证书 或 面板证书），避免同名 server 冲突。${C_N}"
}

# 生成 OpenResty/nginx 反代配置（含 80 跳转 + 443 + acme 验证 location）
gen_nginx_conf() {
  local domains="$1" main="$2"
  mkdir -p "$APP_DIR/nginx"
  cat > "$APP_DIR/nginx/domain-proxy.conf" <<NGINX
# 由 deploy-server.sh 生成 —— domain-for-sale 反向代理（1Panel / OpenResty / nginx）
# 接入方式任选其一：
#   A) 本文件放到 OpenResty/nginx 的 conf.d（cert 已自动放置），证书由 acme.sh 管理。
#   B) 直接在 1Panel 面板「网站 → 创建网站 → 反向代理」逐个建站点，
#      目标 URL 填 127.0.0.1:${PORT}（host:port，不带 http://），证书用 1Panel 申请。

upstream domain_for_sale {
    server ${UPSTREAM_HOST}:${PORT};
    keepalive 32;
}

server {
    listen 80;
    server_name ${domains};
    # ACME HTTP-01 验证目录（acme.sh 使用）
    location /.well-known/acme-challenge/ {
        root ${APP_DIR}/.well-known;
    }
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name ${domains};

    ssl_certificate     /root/.acme.sh/${main}/fullchain.cer;
    ssl_certificate_key /root/.acme.sh/${main}/${main}.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://domain_for_sale;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
  log "已生成 $APP_DIR/nginx/domain-proxy.conf"
}

# ----------------------------- 开始执行（install / cert）-----------------------------
if [ "$ACTION" = "cert" ]; then
  ensure_curl
  ensure_acme
  detect_upstream_host
  do_cert
  exit 0
fi

info "部署参数："
echo "    REPO_URL     = $REPO_URL"
echo "    APP_DIR      = $APP_DIR"
echo "    PORT         = $PORT"
echo "    DATA_FILE    = $DATA_FILE  (绝对: $APP_DIR/$DATA_FILE)"
echo "    SITE_DOMAIN  = $SITE_DOMAIN"
echo "    SEED         = $SEED"
echo "    PROXY_MODE   = $PROXY_MODE"
echo "    ACME_EMAIL   = $ACME_EMAIL"
echo "    ADMIN_PASS    = ${ADMIN_PASSWORD:0:2}******(已生成/已设置)"
if detect_1panel; then
  log "检测到 1Panel 环境，将使用 OpenResty 反代模式（不安装 Caddy）。"
else
  info "未检测到 1Panel；若本机已装 nginx/openresty 将自动复用。"
fi

ensure_curl
ensure_git
ensure_node
[ "$PROXY_MODE" = "caddy" ] && ensure_caddy 2>/dev/null   # caddy 分支（可选）
ensure_pm2

fetch_repo

info "安装依赖（含 tsx 运行时）…"
( cd "$APP_DIR" && npm install )

# 数据目录
mkdir -p "$(dirname "$APP_DIR/$DATA_FILE")"

# ----------------------------- 生成 pm2 配置（带环境变量，重启不丢）-----------------------------
log "生成 pm2 配置：$APP_DIR/ecosystem.config.cjs"
cat > "$APP_DIR/ecosystem.config.cjs" <<'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'domain-for-sale',
    cwd: '__APP_DIR__',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: __PORT__,
      DATA_FILE: '__DATA_FILE__',
      ADMIN_PASSWORD: '__ADMIN_PASSWORD__',
      SITE_DOMAIN: '__SITE_DOMAIN__',
      SEED: '__SEED__'
    }
  }]
}
ECOSYSTEM
sed -i "s|__APP_DIR__|$APP_DIR|g; s|__PORT__|$PORT|g; s|__DATA_FILE__|$DATA_FILE|g; s|__ADMIN_PASSWORD__|$ADMIN_PASSWORD|g; s|__SITE_DOMAIN__|$SITE_DOMAIN|g; s|__SEED__|$SEED|g" "$APP_DIR/ecosystem.config.cjs"

# ----------------------------- 启动应用（pm2）-----------------------------
# 端口占用预警：若 ${PORT} 被非 Node 进程占用（如 1Panel/OpenResty 站点误用该端口），提前告知
if command -v ss >/dev/null 2>&1; then
  port_owner="$(ss -tlnp 2>/dev/null | grep ":${PORT} " || true)"
  if [ -n "$port_owner" ] && ! echo "$port_owner" | grep -qi "node"; then
    warn "端口 ${PORT} 已被非 Node 进程占用："
    warn "$port_owner"
    warn "若这是 1Panel/OpenResty 某站点的监听端口，请删除/改该站点端口；"
    warn "或用其他端口重新部署：PORT=8790 bash deploy-server.sh --non-interactive"
  fi
fi
log "启动 / 重启应用（pm2）…"
( cd "$APP_DIR" && pm2 delete domain-for-sale 2>/dev/null || true )
( cd "$APP_DIR" && pm2 start ecosystem.config.cjs --update-env )
( cd "$APP_DIR" && pm2 save )
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
fi

# ----------------------------- 生成反代配置（nginx / OpenResty 模式）-----------------------------
detect_upstream_host
if [ "$PROXY_MODE" = "nginx" ]; then
  # 先生成「仅含 80 反代 + acme 验证」的占位配置，证书由 cert 子命令补全 443 块
  mkdir -p "$APP_DIR/nginx"
  cat > "$APP_DIR/nginx/domain-proxy.conf" <<NGINX
# 由 deploy-server.sh 生成（install 阶段，证书待 cert 子命令补全）
# 接入方式任选其一：
#   A) 把本文件放到 OpenResty/nginx 的 conf.d，再运行  bash deploy-server.sh cert  补全 443 + 证书。
#   B) 在 1Panel 面板「网站 → 创建网站 → 反向代理」逐个建站点，
#      目标 URL 填 127.0.0.1:${PORT}（host:port，不带 http://），证书用 1Panel 申请。

upstream domain_for_sale {
    server ${UPSTREAM_HOST}:${PORT};
    keepalive 32;
}

server {
    listen 80;
    server_name _;
    location /.well-known/acme-challenge/ {
        root ${APP_DIR}/.well-known;
    }
    location / {
        proxy_pass http://domain_for_sale;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
  log "已生成 $APP_DIR/nginx/domain-proxy.conf（HTTP 反代占位，证书待 cert）"
  info "本脚本默认不自动修改 1Panel/OpenResty 站点配置，以免破坏你现有的面板站点。"
  info "HTTPS 启用方式见下方「HTTPS 接入」说明：方案A 用 cert 子命令（会自动写入 conf.d 并 reload），方案B 在 1Panel 面板建反向代理。"
else
  # Caddy 分支（可选，极少用）
  ensure_caddy_inline
fi

# ----------------------------- 防火墙 -----------------------------
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -qw active; then
  info "放行 80/443/22（ufw）"
  ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 22/tcp
fi

# ----------------------------- 持久化本次配置（下次重跑保持密码）-----------------------------
cat > "$APP_DIR/.deploy-env" <<EOF
ADMIN_PASSWORD='$ADMIN_PASSWORD'
SITE_DOMAIN='$SITE_DOMAIN'
PORT='$PORT'
DATA_FILE='$DATA_FILE'
REPO_URL='$REPO_URL'
SEED='$SEED'
ACME_EMAIL='$ACME_EMAIL'
PROXY_MODE='$PROXY_MODE'
EOF

# ----------------------------- 完成 -----------------------------
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "$SITE_DOMAIN")
echo
echo -e "${C_G}============================================================${C_N}"
echo -e "${C_G} 部署完成 🎉（1Panel / OpenResty 适配模式）${C_N}"
echo -e "${C_G}============================================================${C_N}"
echo " 服务地址      : http://127.0.0.1:${PORT}/  (pm2 进程: domain-for-sale)"
echo " 后台管理      : http://${SITE_DOMAIN}:${PORT}/admin   (密码: ${ADMIN_PASSWORD})"
echo "                （HTTPS 启用后即为 https://你的域名/admin）"
echo " 域名预览地址  : http://${SITE_DOMAIN}:${PORT}/d/example.com  （免 DNS 验证单个域名）"
echo " 数据文件      : ${APP_DIR}/${DATA_FILE}"
echo
echo -e "${C_Y}下一步：把你的 30 个域名 A 记录指向服务器公网 IP：${C_N}"
echo "   ${PUBLIC_IP}"
echo "   - 根域名(如 hbhtcm.cn):  A 记录  @  →  ${PUBLIC_IP}"
echo "   - 子域名(如 a.example.com): CNAME → ${SITE_DOMAIN}"
echo
echo -e "${C_Y}HTTPS 接入（二选一）：${C_N}"
echo "   A) 脚本自动管证书：登录后台导入 30 个域名 → 运行  bash deploy-server.sh cert"
echo "      （一次性为全部域名签发一张 SAN 证书，自动写入 OpenResty 并启用 443）"
echo "   B) 1Panel 面板管证书：在「网站 → 创建网站 → 反向代理」逐个建站点，"
echo "      目标 URL 填  ${C_B}${UPSTREAM_HOST}:${PORT}${C_N}（host:port，不带 http://），证书用 1Panel 申请。"
echo "      ⚠️ OpenResty 在 Docker 容器内时（1Panel 默认）127.0.0.1 不可达宿主机 → 502，必须填 ${UPSTREAM_HOST}。"
echo "      ⚠️ 上次报错 invalid port in upstream 正是因为目标 URL 填了 http://127.0.0.1:${PORT}。"
echo
echo -e "${C_Y}导入域名：登录后台 → 批量导入 CSV（模板见 ${APP_DIR}/data/domains.sample.csv）。${C_N}"
echo -e "${C_Y}重新部署：再次运行  bash deploy-server.sh  即可拉取最新代码并热重启。${C_N}"
echo
