# --- CONFIGURATION ---
$DefaultAppName = "e-journal"
$DefaultDbUrl = "jdbc:postgresql://localhost:5432/ejournal"
$DefaultDbUser = "ejournal_usr"
$DefaultDbPass = "ejournal_pwd"
$DefaultDbDriver = "org.postgresql.Driver"

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "    Spring Boot Configuration Script (PowerShell)    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Ask user for application name
$AppName = Read-Host "Enter Spring Application Name [$DefaultAppName]"
if ([string]::IsNullOrWhiteSpace($AppName)) { $AppName = $DefaultAppName }

# 2. Database Configuration Menu
Write-Host "`nStep 1: Database Configuration" -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Yellow
Write-Host "1) Use default settings (ejournal)" -ForegroundColor Yellow
Write-Host "2) Enter custom database credentials" -ForegroundColor Yellow
Write-Host "3) Skip (Use defaults but don't check)" -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Yellow

$DbChoice = Read-Host "Select an option [1-3]"

# Initialize variables with defaults
$DbUrl = $DefaultDbUrl
$DbUser = $DefaultDbUser
$DbPass = $DefaultDbPass
$DbDriver = $DefaultDbArray = $DefaultDbDriver

switch ($DbChoice) {
    "1" {
        Write-Host "Using default credentials." -ForegroundColor Green
    }
    "2" {
        Write-Host "`nEnter your database details:" -ForegroundColor Cyan

        $inputUrl = Read-Host "JDBC URL [$DefaultDbUrl]"
        if (-not [string]::IsNullOrWhiteSpace($inputUrl)) { $DbUrl = $inputUrl }

        $inputUser = Read-Host "Username [$DefaultDbUser]"
        if (-not [string]::IsNullOrWhiteSpace($inputUser)) { $DbUser = $inputUser }

        $inputPass = Read-Host "Password [$DefaultDbPass]"
        if (-not [string]::IsNullOrWhiteSpace($inputPass)) { $DbPass = $inputPass }

        $DbDriver = "org.postgresql.Driver"
        Write-Host "Custom credentials set." -ForegroundColor Green
    }
    "3" {
        Write-Host "Using defaults." -ForegroundColor Green
    }
    Default {
        Write-Host "Invalid option. Using defaults." -ForegroundColor Red
    }
}

# 3. Locate/Create application.properties path
$PropDir = "src/main://main/resources"
# Note: Since we aren't cloning, we check the current directory's structure
$PropDir = "src/main/resources"
$PropFile = Join-Path $PropDir "application.properties"

if (-not (Test-Path $PropDir)) {
    Write-Host "`nWarning: $PropDir not found in current folder. Creating it..." -ForegroundColor Yellow
    New-Item -Path $PropDir -ItemType Directory -Force | Out-Null
}

# 4. Write the configuration using a Here-String
Write-Host "`nStep 2: Writing configuration to $PropFile..." -ForegroundColor Cyan

$ConfigContent = @"
spring.application.name=$AppName

# ── Database ───────────────────────────────────────────────────────
spring.datasource.url=$DbUrl
spring.datasource.username=$DbUser
spring.datasource.password=$DbPass
spring.datasource.driver-class-name=$DbDriver

# ── JPA / Hibernate ────────────────────────────────────────────────
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=true

# ── JWT ────────────────────────────────────────────────────────────
app.jwtSecret=ChXOzUTGtMGeHkFbhOnbrAjEBhnlttLB2w2biETpTPktQsyBr5LsCcu3bNlGou
app.jwtExpirationInMs=86400000

# ── Security ───────────────────────────────────────────────────────
app.security.allow-localhost=true

# ── Logging ────────────────────────────────────────────────────────
app.logging.path=logs
logging.config=classpath:logback-spring.xml
"@

try {
    # Use UTF8 encoding without BOM to ensure Spring Boot reads it correctly
    $ConfigContent | Set-Content -Path $PropFile -Encoding UTF8
    Write-Host "Successfully updated $PropFile" -ForegroundColor Green
}
catch {
    Write-Host "Error: Failed to write file. $_" -ForegroundColor Red
}

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "Application Name: $AppName" -ForegroundColor White
Write-Host "Database URL: $DbUrl" -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor Cyan