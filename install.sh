#!/bin/bash

# --- CONFIGURATION ---
REPO_URL="https://github.com/kiwifruit47/EduTrack.git"
DEFAULT_APP_NAME="e-journal"

# Default Database Values
DEFAULT_DB_URL="jdbc:postgresql://localhost:5432/ejournal"
DEFAULT_DB_USER="ejournal_usr"
DEFAULT_DB_PASS="ejournal_pwd"
DEFAULT_DB_DRIVER="org.postgresql.Driver"

# Colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   Spring Boot & React Project Setup Script   ${NC}"
echo -e "${BLUE}===============================================${NC}"

# 1. Check if git is installed
if ! command -v git &> /dev/none; then
    echo -e "${RED}Error: git is not installed. Please install git and try again.${NC}"
    exit 1
fi

# 2. Ask user for application name
read -p "Enter Spring Application Name [$DEFAULT_PRESET_APP_NAME]: " APP_NAME
APP_NAME=${APP_NAME:-$DEFAULT_APP_NAME}

# 3. Clone the repository
echo -e "\n${BLUE}Step 1: Cloning repository...${NC}"
if git clone "$REPO_URL" project_temp; then
    echo -e "${GREEN}Clone successful!${NC}"
else
    echo -e "${RED}Failed to clone repository. Check your URL and connection.${NC}"
    exit 1
fi

cd project_temp || exit

# 4. Database Configuration Menu
echo -e "\n${YELLOW}Step 2: Database Configuration${NC}"
echo "------------------------------------------------"
echo "1) Use default settings (ejournal)"
echo "2) Enter custom database credentials"
echo "3) Attempt to install PostgreSQL (Requires sudo/Ubuntu)"
echo "4) Skip (Use defaults but don't check)"
echo "------------------------------------------------"
read -p "Select an option [1-4]: " DB_CHOICE

case $DB_CHOPS in
    1|4)
        DB_URL=$DEFAULT_DB_URL
        DB_USER=$DEFAULT_DB_USER
        DB_PASS=$DEFAULT_DB_PASS
        DB_DRIVER=$DEFAULT_DB_DRIVER
        echo -e "${GREEN}Using default credentials.${NC}"
        ;;
    2)
        echo -e "${BLUE}Enter your database details:${NC}"
        read -p "JDBC URL [jdbc:postgresql://localhost:5432/ejournal]: " DB_URL
        DB_URL=${DB_URL:-$DEFAULT_DB_URL}

        read -p "Username [ejournal_usr]: " DB_USER
        DB_USER=${DB_USER:-$DEFAULT_DB_USER}

        read -s -p "Password [ejournal_pwd]: " DB_PASS
        echo ""
        DB_PASS=${DB_PASS:-$DEFAULT_DB_PASS}

        DB_DRIVER="org.postgresql.Driver"
        echo -e "${GREEN}Custom credentials set.${NC}"
        ;;
    3)
        echo -e "${YELLOW}Attempting to install PostgreSQL...${NC}"
        if command -v apt &> /dev/none; then
            sudo apt update && sudo apt install -y postgresql postgresql-contrib
            DB_URL=$DEFAULT_DB_URL
            DB_USER=$DEFAULT_DB_USER
            DB_PASS=$DEFAULT_DB_PASS
            DB_DRIVER=$DEFAULT_DB_DRIVER
            echo -e "${GREEN}PostgreSQL installation attempt finished.${NC}"
        else
            echo -e "${RED}Package manager 'apt' not found. Cannot auto-install.${NC}"
            echo -e "${YELLOW}Please fallback to option 1 or 2.${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}Invalid option. Using defaults.${NC}"
        DB_URL=$DEFAULT_DB_URL
        DB_USER=$DEFAULT_DB_USER
        DB_PASS=$DEFAULT_DB_PASS
        DB_DRIVER=$DEFAULT_DB_DRIVER
        ;;
esac

# 5. Locate application.properties
PROP_FILE="src/main/resources/application.properties"
if [ ! -d "src/main/resources" ]; then
    echo -e "${YELLOW}Warning: src/main/resources not found. Creating it...${NC}"
    mkdir -p src/main/resources
fi

echo -e "\n${BLUE}Step 3: Writing configuration to $PROP_FILE...${NC}"

# 6. Write the configuration using a Heredoc
cat <<EOF > "$PROP_FILE"
spring.application.name=$APP_NAME

# ── Database ───────────────────────────────────────────────────────────────
spring.datasource.url=$DB_URL
spring.datasource.username=$DB_USER
spring.datasource.password=$DB_PASS
spring.datasource.driver-class-name=$DB_DRIVER

# ── JPA / Hibernate ───────────────────────────────────────────────────────────
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=true

# ── JWT ───────────────────────────────────────────────────────────────────────
app.jwtSecret=ChXOzUTGtMGeHkFbhOnbrAjEBhnlttLB2w2biETpTPktQsyBr5LsCcu3bNlGou
app.jwtExpirationInMs=86400000

# ── Security ──────────────────────────────────────────────────────────────
app.security.allow-localhost=true

# ── Logging ───────────────────────────────────────────────────────────────────
app.logging.path=logs
logging.config=classpath:logback-spring.xml
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully updated $PROP_FILE${NC}"
else
    echo -e "${RED}Failed to update properties file.${NC}"
    exit 1
fi

echo -e "\n${BLUE}===============================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "Project is ready in: $(pwd)"
echo -e "Application Name: $APP_NAME"
echo -e "Database URL: $DB_URL"
echo -e "${BLUE}===============================================${NC}"