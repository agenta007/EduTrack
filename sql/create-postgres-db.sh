#!/usr/bin/env bash
# =============================================================
# EduTrack — PostgreSQL database setup script
# Creates the database, user, and loads demo data.
#
# Usage:
#   chmod +x create-postgres-db.sh
#   ./create-postgres-db.sh
#
# Requires: psql accessible and a superuser account (default: postgres)
# =============================================================

set -euo pipefail

DB_NAME="ejournal"
DB_USER="ejournal_usr"
DB_PASS="ejournal_pwd"
DEMO_DATA_SQL="$(dirname "$0")/insert-demo-data.sql"
SPRING_DIR="$(dirname "$0")/../backend/e-journal"

# Superuser to create the DB and role (change if needed)
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"

echo "==> [1/4] Creating user '${DB_USER}' (if not exists)..."
psql -U "$PG_SUPERUSER" -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" \
    | grep -q 1 \
    || psql -U "$PG_SUPERUSER" -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

echo "==> [2/4] Dropping and recreating database '${DB_NAME}'..."
psql -U "$PG_SUPERUSER" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
psql -U "$PG_SUPERUSER" -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
psql -U "$PG_SUPERUSER" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

echo "==> [3/4] Starting Spring Boot to let Hibernate create tables..."
echo "    (waiting for app to start, then shutting it down)"

cd "$SPRING_DIR"
./mvnw spring-boot:run -DskipTests &
SPRING_PID=$!

# Wait until the app is listening on port 8080
for i in $(seq 1 60); do
    if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1 \
       || curl -sf http://localhost:8080/auth/login -X POST > /dev/null 2>&1; then
        break
    fi
    sleep 2
    echo "    waiting... ($((i*2))s)"
done

echo "    Spring started — stopping it now"
kill "$SPRING_PID" 2>/dev/null || true
wait "$SPRING_PID" 2>/dev/null || true
sleep 2

echo "==> [4/4] Loading demo data..."
psql -U "$DB_USER" -d "$DB_NAME" -f "$DEMO_DATA_SQL"

echo ""
echo "Done. You can now start the app normally:"
echo "  cd ${SPRING_DIR} && ./mvnw spring-boot:run -DskipTests"
