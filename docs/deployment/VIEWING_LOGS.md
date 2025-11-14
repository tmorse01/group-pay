# Viewing Logs in Azure App Service

## Quick Access Methods

### 1. **Log Stream (Real-time) - Easiest Method**

**Via Azure Portal:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Resource Group → App Service (`grouppay-api`)
3. In the left menu, go to **Monitoring** → **Log stream**
4. You'll see real-time logs from your application

**Via Azure CLI:**

```bash
az webapp log tail --name grouppay-api --resource-group grouppay-rg
```

**Note**: With Application Insights enabled, application logs (Fastify/Pino) will primarily appear in Application Insights, not in the log stream. The log stream shows container/infrastructure logs.

### 2. **Application Insights (Recommended for Application Logs)**

Since Application Insights is enabled, your Fastify application logs will appear here:

**Via Azure Portal:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Resource Group → Application Insights (`grouppay-insights`)
3. Go to **Logs** (in the left menu)
4. Use KQL queries to search logs

**Example KQL Queries:**

```kql
// View all traces (application logs)
traces
| order by timestamp desc
| take 100

// View authentication-related logs
traces
| where message contains "Authentication check" or message contains "Setting authentication cookies"
| order by timestamp desc

// View logs with cookie information
traces
| where customDimensions has "hasAccessTokenCookie" or customDimensions has "cookieKeys"
| order by timestamp desc

// View errors
exceptions
| order by timestamp desc
| take 50

// View requests
requests
| order by timestamp desc
| take 100
```

**Via Azure CLI:**

```bash
# Get Application Insights connection string
az monitor app-insights component show \
  --app grouppay-insights \
  --resource-group grouppay-rg \
  --query connectionString -o tsv
```

### 3. **App Service Logs (File-based)**

**Enable Logging:**

1. Azure Portal → App Service → **Monitoring** → **App Service logs**
2. Enable:
   - **Application Logging (Filesystem)**: **ON**
   - **Level**: **Verbose** (or at least Information)
   - **Web server logging**: **ON** (optional)
3. Click **Save**

**View Log Files:**

1. Azure Portal → App Service → **Development Tools** → **Advanced Tools (Kudu)** → **Go**
2. Navigate to **Debug console** → **CMD**
3. Go to `LogFiles` → `Application`
4. Download or view log files (they're named with timestamps)

**Or download via Portal:**

- Azure Portal → App Service → **Monitoring** → **Log stream** → **Download logs**

### 4. **Azure CLI - View Logs**

```bash
# Stream logs in real-time (container/infrastructure logs)
az webapp log tail --name grouppay-api --resource-group grouppay-rg

# Download logs
az webapp log download --name grouppay-api --resource-group grouppay-rg --log-file logs.zip
```

## Log Levels

Your application uses the `LOG_LEVEL` environment variable. To see more detailed logs (including debug logs), set:

```bash
# Via Azure Portal:
# App Service → Configuration → Application settings → Add:
LOG_LEVEL=debug

# Or via Azure CLI:
az webapp config appsettings set \
  --name grouppay-api \
  --resource-group grouppay-rg \
  --settings LOG_LEVEL=debug

# Then restart the app
az webapp restart --name grouppay-api --resource-group grouppay-rg
```

**Log Levels:**

- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, and errors (default)
- `debug` - All logs including debug messages

## What You'll See

### In Application Insights (Structured JSON Logs):

```json
{
  "message": "Authentication check",
  "severityLevel": 1,
  "customDimensions": {
    "path": "/api/groups",
    "method": "GET",
    "origin": "https://your-frontend.azurestaticapps.net",
    "hasCookies": true,
    "cookieKeys": ["accessToken", "refreshToken"],
    "hasAccessTokenCookie": true
  }
}
```

### In Log Stream (Container/Infrastructure Logs):

You'll see Docker container logs, startup messages, but typically NOT your Fastify application logs when Application Insights is enabled.

## Troubleshooting Cookie Issues

When debugging the cookie issue, check **Application Insights** (not log stream) for:

1. **Login Success:**

   ```kql
   traces
   | where message contains "Setting authentication cookies"
   | order by timestamp desc
   ```

2. **Subsequent Requests:**

   ```kql
   traces
   | where message contains "Authentication check"
   | order by timestamp desc
   ```

3. **401 Errors:**
   ```kql
   traces
   | where message contains "No authentication token found"
   | order by timestamp desc
   ```

## Why Application Insights Instead of Log Stream?

When Application Insights is enabled:

- **Application logs** (Fastify/Pino) → Application Insights
- **Container logs** (Docker/infrastructure) → Log Stream
- **Web server logs** (HTTP requests) → Log Stream or Application Insights

This separation allows for:

- Better querying and filtering (KQL)
- Historical analysis
- Performance metrics
- Error tracking
- Custom dashboards

## Quick Debugging Steps

1. **Set LOG_LEVEL to debug:**

   ```bash
   az webapp config appsettings set \
     --name grouppay-api \
     --resource-group grouppay-rg \
     --settings LOG_LEVEL=debug
   ```

2. **Restart the app:**

   ```bash
   az webapp restart --name grouppay-api --resource-group grouppay-rg
   ```

3. **Check Application Insights (not log stream):**
   - Azure Portal → Application Insights → Logs
   - Run KQL queries to find your logs

4. **Have your friend try to login and make a request**

5. **Query Application Insights for:**
   - Cookie setting during login
   - Cookie presence in subsequent requests
   - Origin/referer headers
   - Cookie options (sameSite, secure)
