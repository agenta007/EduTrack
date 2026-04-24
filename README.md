# EduTrack — School E-Journal

A full-stack school management system with a Spring Boot backend and a React/Vite frontend.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, Hibernate |
| Database | PostgreSQL                          |
| Frontend | React 18, Vite, Material UI, i18next |

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| JDK  | 21      | Temurin / OpenJDK |
| Maven | 3.9+ | included via `mvnw` wrapper |
| Node.js | 18+ | |
| npm  | 9+      | bundled with Node |
| PostgreSQL | 14+ | |

---

## 1 — Database Setup

Run the following in `psql` or pgAdmin on all platforms:

```sql
CREATE USER ejournal_usr WITH PASSWORD 'ejournal_pwd';
CREATE DATABASE ejournal OWNER ejournal_usr;
```

Then load demo data (optional):

```bash
psql -U ejournal_usr -d ejournal -f sql/insert-demo-data.sql
```

---

## 2 — Backend

### Configuration

The backend reads `backend/e-journal/src/main/resources/application.properties`.
Key settings:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ejournal
spring.datasource.username=ejournal_usr
spring.datasource.password=ejournal_pwd
app.jwtSecret=<at-least-64-char-secret>
app.security.allow-localhost=true   # set false in production
app.logging.path=logs
```

### macOS / Linux — Development

```bash
cd backend/e-journal
./mvnw spring-boot:run
```

Backend runs on **http://localhost:8080**.

### Windows — Development

```cmd
cd backend\e-journal
mvnw.cmd spring-boot:run
```

### All Platforms — Build a JAR

```bash
cd backend/e-journal
./mvnw clean package -DskipTests
java -jar target/e-journal-*.jar
```

### Debug mode (attach a remote debugger on port 5005)

**macOS / Linux:**
```bash
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
```

**Windows:**
```cmd
mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
```

Then attach with **Run → Remote JVM Debug** in IntelliJ IDEA (host: `localhost`, port: `5005`).

---

## 3 — Frontend

### macOS / Linux / Windows

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**.

The Vite dev server proxies API calls to `http://localhost:8080` as configured in `frontend/.env.development`.

### Production build

```bash
npm run build        # outputs to frontend/dist/
npm run preview      # preview the built output locally
```

---

## 4 — Running as a Service (Production)

### Linux — systemd

Create `/etc/systemd/system/edutrack.service`:

```ini
[Unit]
Description=EduTrack Backend
After=network.target postgresql.service

[Service]
User=edutrack
WorkingDirectory=/opt/edutrack
ExecStart=/usr/bin/java -jar /opt/edutrack/e-journal.jar
EnvironmentFile=/opt/edutrack/env.conf
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now edutrack
```

### macOS — launchd

Create `~/Library/LaunchAgents/com.edutrack.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.edutrack</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/java</string>
    <string>-jar</string>
    <string>/opt/edutrack/e-journal.jar</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>/opt/edutrack/logs/stdout.log</string>
  <key>StandardErrorPath</key><string>/opt/edutrack/logs/stderr.log</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.edutrack.plist
```

### Windows — NSSM

Download [NSSM](https://nssm.cc), then in an admin Command Prompt:

```cmd
nssm install EduTrack "C:\Program Files\Eclipse Adoptium\jdk-21\bin\java.exe"
nssm set EduTrack AppParameters "-jar C:\edutrack\e-journal.jar"
nssm set EduTrack AppDirectory C:\edutrack
nssm set EduTrack AppStdout C:\edutrack\logs\stdout.log
nssm set EduTrack AppStderr C:\edutrack\logs\stderr.log
nssm start EduTrack
```

---

## 5 — Logs

Log files are written to the directory set by `app.logging.path` (default: `logs/` next to the JAR):

| File | Contents |
|------|----------|
| `e-journal.log` | Full application log, rotated daily, 30-day retention |
| `requests.log`  | One line per HTTP request (method, path, status, duration, IP) |

---

## 6 — API Documentation

With the backend running, open:

- Swagger UI: **http://localhost:8080/swagger-ui.html**
- OpenAPI JSON: **http://localhost:8080/v3/api-docs**
