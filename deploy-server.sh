#!/usr/bin/env bash
#
# domain-for-sale —— 独立服务器一键部署脚本
# 适用：Ubuntu / Debian（其他发行版会尝试二进制兜底安装）
# 作用：克隆代码 → 安装 Node / Caddy / pm2 → 配置文件存储 → 启动服务 → 配置 Caddy 按需 TLS
# 特点：一个 Node 进程服务全部域名；每个域名用 A 记录（根域名）或 CNAME（子域名）指向服务器即可，
#       无需在 Caddy 里逐个登记域名（on-demand TLS 按 /api/domain-exists 自动签发证书）。
#
# 用法：
#   bash deploy-server.sh                      # 交互式（提示后台密码）
#   bash deploy-server.sh --non-interactive    # 无人值守，用默认值/环境变量
#   bash deploy-server.sh uninstall            # 一键卸载（停 pm2 + Caddy，释放 80/443）
#   bash deploy-server.sh uninstall --purge    # 卸载并彻底删除应用目录（含 data/data.json）
#
# 可用环境变量覆盖默认值：
#   REPO_URL  APP_DIR  PORT  DATA_FILE  ADMIN_PASSWORD  SITE_DOMAIN  SEED  ACME_EMAIL
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
ACTION="install"
NON_INTERACTIVE=0
for _a in "$@"; do
  case "$_a" in
    --non-interactive) NON_INTERACTIVE=1 ;;
    --purge)          PURGE=1 ;;
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
  err "请使用 root 运行本脚本（需要安装系统软件 / 写 /etc/caddy）。"
  exit 1
fi

# ----------------------------- 卸载模式 -----------------------------
do_uninstall() {
  log "开始卸载 domain-for-sale 部署…"
  # 1) 停止 pm2 进程
  if command -v pm2 >/dev/null 2>&1; then
    pm2 delete domain-for-sale 2>/dev/null || true
    pm2 save 2>/dev/null || true
    log "已停止并移除 pm2 进程 domain-for-sale"
  else
    warn "未检测到 pm2，跳过"
  fi
  # 2) 停止 Caddy（释放 80/443，交还给 nginx / aaPanel）
  if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ] && systemctl list-unit-files caddy.service 2>/dev/null | grep -q caddy; then
    systemctl stop caddy 2>/dev/null && log "已停止 caddy (systemd)" || true
    systemctl disable caddy 2>/dev/null || true
  fi
  if command -v caddy >/dev/null 2>&1; then
    pkill -f 'caddy run' 2>/dev/null && log "已结束 caddy 进程" || true
  fi
  # 3) 移除生成的服务配置（备份 Caddyfile）
  rm -f "$APP_DIR/ecosystem.config.cjs" && log "已删除 $APP_DIR/ecosystem.config.cjs" || true
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
  # 5) 若本机是 nginx（aaPanel），重启让出后的 80/443 生效
  if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ] && systemctl list-unit-files nginx.service 2>/dev/null | grep -q nginx; then
    systemctl restart nginx 2>/dev/null && log "已重启 nginx（80/443 现由 nginx 占用）" || true
  fi
  echo
  echo -e "${C_G}卸载完成。${C_N}"
  echo "  · pm2 进程已停止；Caddy 已停止并让出 80/443 端口。"
  echo "  · 若使用 aaPanel/nginx，现在 80/443 已空闲，可在 aaPanel 重启 nginx。"
  echo "  · 注意：aaPanel 站点的反向代理「目标URL」仍需改为 127.0.0.1:${PORT}（不带 http://）才能正常反代。"
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
  if command -v node >/dev/null 2>&1; then
    local v; v=$(node -v | sed 's/v//; s/\..*//')
    if [ "${v:-0}" -ge 18 ]; then log "Node $(node -v) 已满足要求(>=18)"; return; fi
  fi
  info "安装 Node.js 20 LTS…"
  if has_apt; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    run_apt nodejs
  else
    # 二进制兜底（非 apt 发行版）
    local tmp; tmp=$(mktemp -d)
    curl -fsSL "https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz" -o "$tmp/node.tar.xz"
    tar -xJf "$tmp/node.tar.xz" -C /opt
    ln -sf /opt/node-v20.18.0-linux-x64/bin/node /usr/local/bin/node
    ln -sf /opt/node-v20.18.0-linux-x64/bin/npm  /usr/local/bin/npm
    ln -sf /opt/node-v20.18.0-linux-x64/bin/npx  /usr/local/bin/npx
    rm -rf "$tmp"
  fi
}

ensure_caddy() {
  if command -v caddy >/dev/null 2>&1; then log "Caddy $(caddy version 2>/dev/null | awk '{print $1}') 已安装"; return; fi
  if command -v nginx >/dev/null 2>&1; then
    warn "检测到本机已安装/运行 nginx（如 aaPanel），Caddy 会与 nginx 争抢 80/443 端口。"
    warn "aaPanel 环境下建议改用 nginx 反代到 127.0.0.1:${PORT}，不要安装 Caddy（或先停掉 nginx）。"
  fi
  info "安装 Caddy…"
  if has_apt; then
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
    run_apt caddy
  else
    curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/bin/caddy
    chmod +x /usr/bin/caddy
    warn "Caddy 以二进制方式安装，未配置 systemd，将以后台进程方式运行。"
  fi
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then log "pm2 已安装"; return; fi
  info "全局安装 pm2…"
  npm i -g pm2
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

# ----------------------------- 开始执行 -----------------------------
info "部署参数："
echo "    REPO_URL     = $REPO_URL"
echo "    APP_DIR      = $APP_DIR"
echo "    PORT         = $PORT"
echo "    DATA_FILE    = $DATA_FILE  (绝对: $APP_DIR/$DATA_FILE)"
echo "    SITE_DOMAIN  = $SITE_DOMAIN"
echo "    SEED         = $SEED"
echo "    ACME_EMAIL   = $ACME_EMAIL"
echo "    ADMIN_PASS    = ${ADMIN_PASSWORD:0:2}******(已生成/已设置)"

ensure_curl
ensure_git
ensure_node
ensure_caddy
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

# ----------------------------- 生成 Caddy 配置（on-demand TLS）-----------------------------
log "生成 Caddy 配置：/etc/caddy/Caddyfile"
mkdir -p /etc/caddy
cat > /etc/caddy/Caddyfile <<'CADDY'
{
    email __ACME_EMAIL__
    on_demand_tls {
        ask http://127.0.0.1:__PORT__/api/domain-exists
        interval 2m
        burst 5
    }
}

:443 {
    tls {
        on_demand
    }
    encode gzip
    reverse_proxy 127.0.0.1:__PORT__
}
CADDY
sed -i "s|__ACME_EMAIL__|$ACME_EMAIL|g; s|__PORT__|$PORT|g" /etc/caddy/Caddyfile

# ----------------------------- 启动应用（pm2）-----------------------------
log "启动 / 重启应用（pm2）…"
( cd "$APP_DIR" && pm2 delete domain-for-sale 2>/dev/null || true )
( cd "$APP_DIR" && pm2 start ecosystem.config.cjs --update-env )
( cd "$APP_DIR" && pm2 save )
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
fi

# ----------------------------- 启动 Caddy -----------------------------
log "校验并启动 Caddy…"
if command -v caddy >/dev/null 2>&1 && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  log "Caddyfile 语法 OK"
else
  warn "Caddy 校验跳过（caddy 命令不可用或未通过）"
fi
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  systemctl enable --now caddy >/dev/null 2>&1 || true
  systemctl restart caddy || warn "systemctl restart caddy 失败，请手动检查"
else
  # 二进制兜底：后台运行
  pkill -f 'caddy run' 2>/dev/null || true
  nohup caddy run --config /etc/caddy/Caddyfile --adapter caddyfile >/var/log/caddy.log 2>&1 &
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
EOF

# ----------------------------- 完成 -----------------------------
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "$SITE_DOMAIN")
echo
echo -e "${C_G}============================================================${C_N}"
echo -e "${C_G} 部署完成 🎉${C_N}"
echo -e "${C_G}============================================================${C_N}"
echo " 服务地址      : http://127.0.0.1:${PORT}/  (pm2 进程: domain-for-sale)"
echo " 后台管理      : https://${SITE_DOMAIN}/admin   (密码: ${ADMIN_PASSWORD})"
echo " 域名预览地址  : https://${SITE_DOMAIN}/d/example.com  （免 DNS 验证单个域名）"
echo " 数据文件      : ${APP_DIR}/${DATA_FILE}"
echo
echo -e "${C_Y}下一步：把你的 30 个域名 A 记录指向服务器公网 IP：${C_N}"
echo "   ${PUBLIC_IP}"
echo "   - 根域名(如 hbhtcm.cn):  A 记录  @  →  ${PUBLIC_IP}"
echo "   - 子域名(如 a.example.com): CNAME → ${SITE_DOMAIN}"
echo "   指向后访客直接访问 https://你的域名 即按 Host 展示对应出售页；"
echo "   证书由 Caddy 按 /api/domain-exists 自动签发，无需逐个登记。"
echo
echo -e "${C_Y}导入域名：登录后台 → 批量导入 CSV（模板见 ${APP_DIR}/data/domains.sample.csv）。${C_N}"
echo -e "${C_Y}重新部署：再次运行  bash deploy-server.sh  即可拉取最新代码并热重启。${C_N}"
echo
