# Production Database Migrations

This guide explains how to run database migrations against the production Azure PostgreSQL database.

## Files

- `.env.production` - Contains production environment variables (DO NOT COMMIT)
- `run-production-migration.ps1` - PowerShell script to run migrations with production env

## Running Migrations

### Option 1: Using the PowerShell Script (Recommended)

```powershell
cd apps/api
.\run-production-migration.ps1
```

This script will:

1. Load environment variables from `.env.production`
2. Run `pnpm db:migrate:prod` against production database
3. Show the results

### Option 2: Manual Environment Variable Setup

**PowerShell:**

```powershell
cd apps/api

# Load .env.production
Get-Content .env.production | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

# Run migrations
pnpm db:migrate:prod
```

**Bash/Linux/Mac:**

```bash
cd apps/api

# Load and run
export $(grep -v '^#' .env.production | xargs)
pnpm db:migrate:prod
```

### Option 3: Using dotenv-cli

```bash
# Install dotenv-cli if needed
pnpm add -D dotenv-cli

# Run with dotenv-cli
npx dotenv -e .env.production -- pnpm db:migrate:prod
```

## Important Notes

⚠️ **Security Warning:**

- The `.env.production` file contains sensitive credentials
- Never commit this file to version control
- It's already in `.gitignore`
- Keep it secure and don't share it

## Verifying Migrations

After running migrations, you can check the status:

```powershell
# Load .env.production first (see Option 2 above)
npx prisma migrate status
```

## Troubleshooting

### Connection Issues

- Ensure your IP is allowed in Azure PostgreSQL firewall rules
- Verify the DATABASE_URL is correct
- Check that SSL mode is set (`?sslmode=require`)

### Migration Conflicts

- If a migration fails, check the error message
- Use `prisma migrate resolve` to mark migrations as applied if needed
- Never run `prisma migrate dev` against production

### Environment Variables Not Loading

- Make sure `.env.production` exists in `apps/api/` directory
- Verify the file format (no spaces around `=`)
- Check that values are properly quoted if they contain special characters

## Creating .env.production

If you don't have `.env.production` yet, create it with the following content (values from Terraform outputs):

```bash
# Get values from Terraform
cd infrastructure/terraform
terraform output -raw database_url
terraform output -raw jwt_secret
terraform output -raw static_web_app_url
```

Then create `apps/api/.env.production` with the production values.
