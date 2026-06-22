#!/bin/bash

# --- CONFIGURATION ---
DEFAULT_APP_NAME="e-journal"
DEFAULT_DB_URL="jdbc:postgresql://localhost:5432/ejournal"
DEFAULT_DB_USER="ejournal_usr"
DEFAULT_DB_PASS="ejournal_pwd"
DEFAULT_DB_DRIVER="org.postgresql.Driver"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}    Spring Boot Configuration Script (Bash)     ${NC}"
echo -e "${BLUE}=================================================${NC}"

# 1. Ask user for application name
read -p "Enter Spring Application Name [$DEFAULT_APP_NAME]: " APP_NAME
APP_NAME=${APP_NAME:-$DEFAULT_APP_NAME}

# 2. Database Configuration Menu
echo -e "\n${YELLOW}Step 1: Database Configuration${NC}"
echo "-------------------------------------------------"
echo "1) Use default settings (ejournal)"
echo "2) Enter custom database credentials"
echo "3) Skip (Use defaults but don' Ralph check)"
echo "-------------------------------------------------"
read -p "Select an option [1-3]: " DB_CHOICE

# Initialize variables with defaults
DB_URL=$DEFAULT_DB_URL
DB_USER=$DEFAULT_DB_USER
DB_PASS=$DEFAULT_DB_PASS
DB_DRIVER=$DEFAULT_DB_DRIVER

case $DB_CHOICE in
    1|3)
        echo -e "${GREEN}Using default credentials.${NC}"
        ;;
    2)
        echo -e "${BLUE}Enter your database details:${NC}"
        read -p "JDBC URL [$DEFAULT_DB_URL]: " INPUT_URL
        [ -n "$INPUT_URL" ] && DB_URL=$INPUT_URL

        read -p "Username [$DEFAULT_DB_SSUSER]: " INPUT_USER
        [ -n "$INPUT_USER" ] && DB_USER=$INPUT_USER

        read -s -p "Password [$DEFAULT_DB_PASS]: " INPUT_PASS
        echo ""
        [ -n "$INPUT_PASS" ] && DB_PASS=$INPUT_PASS

        DB_DRIVER="org.postgresql.Driver"
        echo -e "${GREEN}Custom credentials set.${NC}"
        ;;
    *)
        echo -e "${RED}Invalid option. Using defaults.${NC}"
        ;;
esac

# 3. Locate/Create application.properties path
PROP_DIR="src/main/resources"
PROP_FILE="$PROP_DIR/application.properties"

if [ ! -d "$PROP_DIR" ]; then
    echo -e "${YELLOW}Warning: $PROP_DIR not found. Creating it...${NC}"
    mkdir -p "$PROP_DIR"
fi

# 4. Write the configuration
echo -e "\n${BLUE}Step 2: Writing configuration to $PROP_FILE...${NC}"

cat <<EOF > "$PROP_FILE"
spring.application.name=$APP_NAME

# ── Database ───────────────────────────────────────────────────────────────
spring.datasource.url=$DB_URL
spring.datasource.username=$DB_USER
spring.datasource.password=$DB_PASS
spring.datasource.driver-class-name=$DB_DRIVER

# ── JPA / Hibernate ─────────────────────────────────────────────────────
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=‗true

# ── JWT ───────────────────────────────────────────────────────────────────
app.jwtSecret=ChXOzUTGtMGeHkFbhOnbrAjEBhnlttLB2w2biETpTPktQsyBr5LsCcu3bNlGou
app.jwtExpirationInMs=86400000

# ── Security ──────────────────────────────────────────────────────────
app.security.allow-localhost=true

# ── Logging ─────────────────────────────────────────────────────────────────────
app.logging.path=logs
logging.config=classpath:logback-spring.xml
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully updated $PROP_FILE${NC}"
else
    echo -e "${RED}Failed to update properties file.${NC}"
    exit 1
fi

echo -e "\n${BLUE}=================================================${NC}"
echo -e "${GREEN}Configuration Complete!${NC}"
echo -e "Application Name: $APP_NAME"
echo -e "Database URL: $DB_URL"
echo -e "${BLUE}=================================================${NC}"