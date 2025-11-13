# PowerShell script to run production migrations
# This script loads the .env.production file and runs migrations

Write-Host "Loading production environment variables..." -ForegroundColor Cyan

# Load environment variables from .env.production
Get-Content .env.production | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "  Set $key" -ForegroundColor Gray
    }
}

Write-Host "`nRunning production migrations..." -ForegroundColor Cyan
Write-Host "Database: $env:DATABASE_URL" -ForegroundColor Yellow

# Run the migration
pnpm db:migrate:prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Migration failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

