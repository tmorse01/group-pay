# Application Insights Troubleshooting

## Issue: Logs Not Appearing in Application Insights

If you're not seeing logs in Application Insights even though it's configured, try these steps:

### 1. Verify Application Insights is Configured

Check that the environment variables are set:

```bash
az webapp config appsettings list \
  --name grouppay-api \
  --resource-group grouppay-rg \
  --query "[?contains(name, 'APPINSIGHTS') || contains(name, 'APPLICATIONINSIGHTS')]"
```

You should see:

- `APPINSIGHTS_ENABLED=true`
- `APPINSIGHTS_INSTRUMENTATIONKEY` (with a GUID value)
- `APPLICATIONINSIGHTS_CONNECTION_STRING` (with connection string)

### 2. Restart the App Service

After configuring Application Insights, restart the app:

```bash
az webapp restart --name grouppay-api --resource-group grouppay-rg
```

### 3. Check Application Insights Portal

1. Go to Azure Portal → Application Insights (`grouppay-insights`)
2. Check **Live Metrics Stream** - this shows real-time data
3. Check **Logs** - run queries like:
   ```kql
   traces
   | order by timestamp desc
   | take 50
   ```

### 4. Verify Logs Are Being Written

Make some requests to your API:

```bash
curl https://grouppay-api.azurewebsites.net/api/health
```

Then check Application Insights again (wait 2-5 minutes for logs to appear).

### 5. Check Log Stream for Application Logs

Azure App Service should automatically capture stdout/stderr when Application Insights is configured:

```bash
az webapp log tail --name grouppay-api --resource-group grouppay-rg --provider application
```

### 6. Common Issues

**Issue**: Logs show in log stream but not Application Insights

- **Solution**: This has been fixed! The application now uses a custom Pino stream that sends logs directly to Application Insights. If you're still seeing this issue:
  1. Make sure you've deployed the latest code with the Pino-Application Insights integration
  2. Restart the App Service after deployment
  3. Wait 2-5 minutes for logs to appear

**Issue**: No logs at all

- **Solution**: Verify `LOG_LEVEL` is set appropriately:
  ```bash
  az webapp config appsettings set \
    --name grouppay-api \
    --resource-group grouppay-rg \
    --settings LOG_LEVEL=info
  ```

**Issue**: Environment variables show as null

- **Solution**: This might be a CLI display issue. Check in Azure Portal → App Service → Configuration → Application settings

### 7. Verify Terraform Configuration

Check that Application Insights was created:

```bash
cd infrastructure/terraform
terraform output application_insights_id
terraform output application_insights_connection_string
```

### 8. Manual Verification

Test if Application Insights is working by checking Live Metrics:

1. Azure Portal → Application Insights → **Live Metrics Stream**
2. Make requests to your API
3. You should see requests appearing in real-time

If Live Metrics shows data but Logs don't, there might be a delay (logs can take 2-5 minutes to appear).

### 9. Alternative: Check Log Files Directly

If Application Insights isn't working, check log files:

1. Azure Portal → App Service → **Development Tools** → **Advanced Tools (Kudu)** → **Go**
2. Navigate to **Debug console** → **CMD**
3. Go to `LogFiles` → `Application`
4. Download and check log files

### 10. Next Steps

If logs still don't appear after trying all above steps:

1. Verify Application Insights resource exists and is active
2. Check Application Insights → **Overview** → **Usage and estimated costs** to see if data is being ingested
3. Verify the Pino-Application Insights integration is working:
   - Check that `apps/api/src/lib/pino-appinsights.ts` exists
   - Verify Application Insights client is being passed to `createApp()` in `apps/api/src/index.ts`
   - Check application startup logs for `[APPLICATIONINSIGHTS] Initialized successfully`

### 11. How It Works

The application now uses a custom Pino stream (`pino-appinsights.ts`) that:

- Writes logs to stdout (for Azure App Service log capture)
- Simultaneously sends logs to Application Insights as traces
- Maps Pino log levels to Application Insights severity levels
- Preserves all custom properties from Pino logs as customDimensions in Application Insights

This ensures all Pino logs (including `app.log.info()`, `app.log.error()`, etc.) are captured as traces in Application Insights.
