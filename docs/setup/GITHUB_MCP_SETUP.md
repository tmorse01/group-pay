# GitHub MCP Setup Guide

This guide will help you set up GitHub MCP (Model Context Protocol) in Cursor so that the AI assistant can access GitHub Actions workflows and help fix errors.

## Prerequisites

1. A GitHub account with access to your repository
2. A GitHub Personal Access Token (PAT) with appropriate permissions
3. Cursor IDE installed

## Step 1: Create a GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens

2. Click "Generate new token (classic)"

3. Give it a descriptive name (e.g., "Cursor MCP GitHub Access")

4. Select the following scopes/permissions:
   - `repo` - Full control of private repositories
     - `repo:status` - Access commit status
     - `repo_deployment` - Access deployment status
     - `public_repo` - Access public repositories
   - `workflow` - Update GitHub Action workflows
   - `read:org` - Read org and team membership (if using organizations)
   - `read:user` - Read user profile data

5. Click "Generate token"

6. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

## Step 2: Configure GitHub MCP in Cursor

### Option A: Using Cursor Settings UI

1. Open Cursor Settings:
   - Windows/Linux: `Ctrl + ,` or `File → Preferences → Settings`
   - macOS: `Cmd + ,` or `Cursor → Preferences → Settings`

2. Search for "MCP" or "Model Context Protocol" in settings

3. Look for "MCP Servers" or "GitHub MCP" configuration

4. Add a new MCP server configuration with:
   - **Server Name**: `github`
   - **Server Type**: `github` or `mcp-server-github`
   - **GitHub Token**: Paste your Personal Access Token from Step 1
   - **Repository**: Your repository in format `owner/repo` (e.g., `yourusername/group-pay`)

### Option B: Using Cursor Configuration File

If Cursor supports configuration files, you may need to create or edit:

**Location**: `~/.cursor/mcp.json` or `.cursor/mcp.json` in your project root

**Configuration**:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Option C: Environment Variables

You can also set the GitHub token as an environment variable:

**Windows (PowerShell)**:

```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "your_token_here"
```

**Windows (Command Prompt)**:

```cmd
set GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
```

**macOS/Linux**:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
```

## Step 3: Verify Setup

After configuration, you can test if GitHub MCP is working by asking the AI assistant:

- "Can you check the GitHub Actions workflows?"
- "What are the recent workflow runs?"
- "Show me errors from the latest CI run"

## Step 4: Repository Information

To help the AI assistant access your workflows, provide:

- **Repository Owner**: Your GitHub username or organization name
- **Repository Name**: `group-pay` (or your actual repo name)

Example: If your repository URL is `https://github.com/yourusername/group-pay`, then:

- Owner: `yourusername`
- Repository: `group-pay`

## Troubleshooting

### MCP Server Not Found

If you see "MCP server 'github' is not available":

1. Ensure the GitHub MCP server package is installed:

   ```bash
   npm install -g @modelcontextprotocol/server-github
   ```

2. Check Cursor's MCP server logs for errors

3. Verify your token has the correct permissions

4. Restart Cursor after configuration changes

### Authentication Errors

If you see authentication errors:

1. Verify your GitHub token is valid and not expired
2. Check that the token has the required scopes
3. Ensure the token hasn't been revoked in GitHub settings

### Permission Errors

If you see permission errors:

1. Ensure your token has `repo` and `workflow` scopes
2. Verify you have access to the repository
3. For private repos, ensure the token has access

## Security Best Practices

1. **Never commit your GitHub token to version control**
   - Add `.cursor/mcp.json` to `.gitignore` if it contains tokens
   - Use environment variables when possible

2. **Use fine-grained tokens** (if available) with minimal required permissions

3. **Rotate tokens regularly** - Set a reminder to regenerate tokens periodically

4. **Revoke unused tokens** - Remove tokens you're no longer using

## Next Steps

Once GitHub MCP is configured, you can:

1. Ask the AI to check GitHub Actions workflow runs
2. Get details about failed workflow steps
3. View workflow logs and error messages
4. Get help fixing CI/CD errors
5. Review pull request status and checks

## Example Queries

After setup, try these queries:

- "Check the latest GitHub Actions run for errors"
- "What failed in the CI workflow?"
- "Show me the error logs from the deploy-api workflow"
- "Fix the errors in GitHub Actions"
- "What's the status of the test workflow?"

## Additional Resources

- [GitHub MCP Server Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)
