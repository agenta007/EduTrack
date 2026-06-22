#!/usr/bin/env bash
# ============================================================
#  EduTrack — Debian Trixie (13) Setup Script
#  Run as root or with sudo privileges.
#  Usage:  sudo bash configure-debian.sh
# ============================================================
set -euo pipefail

# ── Colour helpers ───────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }

# ── Defaults ─────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROP_FILE="$SCRIPT_DIR/backend/e-journal/src/main/resources/application.properties"
SQL_FILE="$SCRIPT_DIR/sql/insert-demo-data.sql"

DEFAULT_APP_NAME="e-journal"
DEFAULT_DB_NAME="ejournal"
DEFAULT_DB_USER="ejournal_usr"
DEFAULT_DB_PASS="ejournal_pwd"
DEFAULT_JWT_SECRET="ChXOzUTGtMGeRxHkFbhOnbrAjEBhnlttLB2w2biETpTPktQsyBr5LsCcu3bNlGou"
DEFAULT_LOG_PATH="/var/log/edutrack"
DEFAULT_INSTALL_DIR="/opt/edutrack"

# ── Banner ───────────────────────────────────────────────────
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║       EduTrack — Debian Trixie Setup         ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

[[ $EUID -ne 0 ]] && error "Please run as root: sudo bash configure-debian.sh"

# ════════════════════════════════════════════════════════════
step "Step 1: Collect configuration"
# ════════════════════════════════════════════════════════════

prompt() {
    local var_name="$1" prompt_text="$2" default="$3"
    read -rp "$(echo -e "${YELLOW}${prompt_text}${RESET} [${default}]: ")" input
    printf -v "$var_name" '%s' "${input:-$default}"
}

prompt APP_NAME    "Application name"     "$DEFAULT_APP_NAME"
prompt DB_NAME     "Database name"        "$DEFAULT_DB_NAME"
prompt DB_USER     "Database username"    "$DEFAULT_DB_USER"
prompt DB_PASS     "Database password"    "$DEFAULT_DB_PASS"
prompt JWT_SECRET  "JWT secret (≥64 chars)" "$DEFAULT_JWT_SECRET"
prompt LOG_PATH    "Log directory"        "$DEFAULT_LOG_PATH"
prompt INSTALL_DIR "Install directory"    "$DEFAULT_INSTALL_DIR"

read -rp "$(echo -e "${YELLOW}Load demo data from sql/insert-demo-data.sql? (y/N): ${RESET}")" LOAD_DEMO
read -rp "$(echo -e "${YELLOW}Install as systemd service? (y/N): ${RESET}")" INSTALL_SERVICE
read -rp "$(echo -e "${YELLOW}Allow localhost admin bypass (dev only)? (y/N): ${RESET}")" ALLOW_LOCALHOST
ALLOW_LOCALHOST_VAL="false"
[[ "${ALLOW_LOCALHOST,,}" == "y" ]] && ALLOW_LOCALHOST_VAL="true"

echo ""
info "Configuration summary:"
echo "  App name     : $APP_NAME"
echo "  Database     : $DB_NAME (user: $DB_USER)"
echo "  Log path     : $LOG_PATH"
echo "  Install dir  : $INSTALL_DIR"
echo "  Demo data    : ${LOAD_DEMO:-N}"
echo "  Systemd svc  : ${INSTALL_SERVICE:-N}"
echo "  Localhost bypass: $ALLOW_LOCALHOST_VAL"
echo ""
read -rp "$(echo -e "${YELLOW}Proceed? (Y/n): ${RESET}")" CONFIRM
[[ "${CONFIRM,,}" == "n" ]] && echo "Aborted." && exit 0

# ════════════════════════════════════════════════════════════
step "Step 2: Update apt and install prerequisites"
# ════════════════════════════════════════════════════════════

apt-get update -qq
apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release \
    git maven postgresql

# ── Java 21 (temurin via Adoptium repo) ─────────────────────
JAVA_VER=$(java -version 2>&1 | grep -oP '(?<=")\d+' | head -1 || echo "0")
if [[ "$JAVA_VER" -lt "21" ]]; then
    info "Installing Eclipse Temurin JDK 21 (Spring Boot 3.x requires Java 21)..."
    curl -fsSL https://packages.adoptium.net/artifactory/api/gpg/key/public \
        | gpg --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg
    echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" \
        > /etc/apt/sources.list.d/adoptium.list
    apt-get update -qq
    apt-get install -y temurin-21-jdk
    update-java-alternatives -s temurin-21-amd64 2>/dev/null || true
    success "JDK 21 installed and set as default."
else
    success "JDK $JAVA_VER already present (≥ 21)."
fi

# ── Pin JAVA_HOME to JDK 21 so Maven uses the right JVM ──────
JDK21_HOME=$(update-java-alternatives -l 2>/dev/null | awk '/temurin-21|java-21/{print $3; exit}')
if [[ -z "$JDK21_HOME" ]]; then
    JDK21_HOME=$(find /usr/lib/jvm -maxdepth 1 -name "*21*" -type d | head -1)
fi
if [[ -n "$JDK21_HOME" ]]; then
    export JAVA_HOME="$JDK21_HOME"
    info "JAVA_HOME set to $JAVA_HOME"
else
    warn "Could not locate JDK 21 path — Maven will use system default"
fi

# ── Node.js 22 (via NodeSource) ──────────────────────────────
if ! node --version 2>/dev/null | grep -qE "^v(18|20|22|24)"; then
    info "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    success "Node.js $(node --version) installed."
else
    success "Node.js $(node --version) already present."
fi

# ════════════════════════════════════════════════════════════
step "Step 3: Configure PostgreSQL"
# ════════════════════════════════════════════════════════════

systemctl enable --now postgresql

# Create user and database if they don't exist
su -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'\" | grep -q 1 || \
    psql -c \"CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}'\"" postgres

su -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\" | grep -q 1 || \
    psql -c \"CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}\"" postgres

success "Database '$DB_NAME' ready (owner: $DB_USER)."

if [[ "${LOAD_DEMO,,}" == "y" && -f "$SQL_FILE" ]]; then
    info "Loading demo data..."
    su -c "psql -U ${DB_USER} -d ${DB_NAME} -f ${SQL_FILE}" postgres
    success "Demo data loaded."
elif [[ "${LOAD_DEMO,,}" == "y" ]]; then
    warn "Demo data file not found at $SQL_FILE — skipping."
fi

# ════════════════════════════════════════════════════════════
step "Step 4: Write application.properties"
# ════════════════════════════════════════════════════════════

mkdir -p "$(dirname "$PROP_FILE")"

cat > "$PROP_FILE" <<EOF
spring.application.name=${APP_NAME}

# ── Database ──────────────────────────────────────────────────────────────────
spring.datasource.url=jdbc:postgresql://localhost:5432/${DB_NAME}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASS}
spring.datasource.driver-class-name=org.postgresql.Driver

# ── JPA / Hibernate ───────────────────────────────────────────────────────────
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=true

# ── JWT ───────────────────────────────────────────────────────────────────────
app.jwtSecret=${JWT_SECRET}
app.jwtExpirationInMs=86400000

# ── Security ──────────────────────────────────────────────────────────────────
app.security.allow-localhost=${ALLOW_LOCALHOST_VAL}

# ── Logging ───────────────────────────────────────────────────────────────────
app.logging.path=${LOG_PATH}
logging.config=classpath:logback-spring.xml
EOF

success "application.properties written."

# ════════════════════════════════════════════════════════════
step "Step 5: Build backend"
# ════════════════════════════════════════════════════════════

cd "$SCRIPT_DIR/backend/e-journal"
chmod +x mvnw
./mvnw clean package -DskipTests -q
JAR_PATH="$(ls "$SCRIPT_DIR/backend/e-journal/target/"e-journal-*.jar | head -1)"
success "Backend built: $JAR_PATH"

# ════════════════════════════════════════════════════════════
step "Step 6: Build frontend"
# ════════════════════════════════════════════════════════════

cd "$SCRIPT_DIR/frontend"
npm install --silent
npm run build
success "Frontend built: $SCRIPT_DIR/frontend/dist/"

# ════════════════════════════════════════════════════════════
step "Step 7: Install to $INSTALL_DIR"
# ════════════════════════════════════════════════════════════

mkdir -p "$INSTALL_DIR"/{logs,frontend}
cp "$JAR_PATH" "$INSTALL_DIR/e-journal.jar"
cp -r "$SCRIPT_DIR/frontend/dist/." "$INSTALL_DIR/frontend/"
mkdir -p "$LOG_PATH"

success "Files installed to $INSTALL_DIR."

# ════════════════════════════════════════════════════════════
step "Step 8: Systemd service"
# ════════════════════════════════════════════════════════════

if [[ "${INSTALL_SERVICE,,}" == "y" ]]; then

    # Create dedicated system user if absent
    id edutrack &>/dev/null || useradd --system --no-create-home --shell /bin/false edutrack
    chown -R edutrack:edutrack "$INSTALL_DIR" "$LOG_PATH"

    cat > /etc/systemd/system/edutrack.service <<EOF
[Unit]
Description=EduTrack School E-Journal
Documentation=https://github.com/your-org/edutrack
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=edutrack
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/java \
    -Xms256m -Xmx512m \
    -Dapp.logging.path=${LOG_PATH} \
    -jar ${INSTALL_DIR}/e-journal.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=edutrack

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable edutrack
    systemctl restart edutrack

    success "systemd service installed and started."
    info  "Manage with:  systemctl {start|stop|restart|status} edutrack"
    info  "Logs:         journalctl -u edutrack -f"
    info  "Log files:    $LOG_PATH/"
else
    info "Skipping systemd service installation."
    echo ""
    info "To run manually:"
    echo "  java -jar $INSTALL_DIR/e-journal.jar"
fi

# ════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗"
echo           "║           Setup Complete!                    ║"
echo -e        "╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Backend API : ${CYAN}http://localhost:8080${RESET}"
echo -e "  Swagger UI  : ${CYAN}http://localhost:8080/swagger-ui.html${RESET}"
echo -e "  Frontend    : ${CYAN}$INSTALL_DIR/frontend/${RESET}  (serve with nginx)"
echo -e "  Logs        : ${CYAN}$LOG_PATH/${RESET}"
echo ""
