# MyDub.AI Scripts

This directory contains utility scripts for the MyDub.AI project.

## setup-github-secrets.sh

A comprehensive script to set up all required GitHub repository secrets for the MyDub.AI deployment pipeline.

### Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Repository owner/admin permissions
- Access to all required service credentials (Vercel, Supabase, etc.)

### Usage

```bash
# Basic usage - interactive setup
./scripts/setup-github-secrets.sh

# Validate existing secrets only
./scripts/setup-github-secrets.sh --validate-only

# Dry run - see what would be done
./scripts/setup-github-secrets.sh --dry-run

# Specify a different repository
./scripts/setup-github-secrets.sh --repo owner/repo

# Show help
./scripts/setup-github-secrets.sh --help
```

### Required Secrets

The following secrets are REQUIRED for the deployment pipeline to work:

1. **VERCEL_TOKEN** - Your Vercel authentication token
2. **VERCEL_ORG_ID** - Your Vercel organization ID
3. **VERCEL_PROJECT_ID** - Your Vercel project ID
4. **VITE_SUPABASE_URL** - Your Supabase project URL
5. **VITE_SUPABASE_ANON_KEY** - Your Supabase anonymous key
6. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key (for backups)
7. **VITE_APP_URL** - Your production app URL (e.g., https://mydub.ai)

### Optional Secrets

These secrets enhance functionality but are not required:

1. **CODECOV_TOKEN** - For code coverage reporting
2. **LHCI_GITHUB_APP_TOKEN** - For Lighthouse CI performance checks
3. **VITE_SENTRY_DSN** - For error tracking with Sentry
4. **VITE_GA_MEASUREMENT_ID** - For Google Analytics
5. **VITE_WEBHOOK_URL** - For deployment notifications
6. **VITE_MONITORING_EMAIL** - For monitoring alerts

### Features

- **Interactive Setup**: Guides you through setting up each secret with instructions
- **Validation**: Checks which secrets exist and which are missing
- **Dry Run Mode**: Preview changes without making them
- **Update Existing**: Option to update secrets that already exist
- **Detailed Instructions**: Shows how to obtain each secret value

### Security Notes

- Never commit secret values to the repository
- The script handles input securely (hidden input for secret values)
- Use GitHub's secret scanning to detect accidentally exposed secrets
- Rotate secrets regularly, especially if they may have been exposed

### Example Workflow

1. First, validate what secrets are missing:
   ```bash
   ./scripts/setup-github-secrets.sh --validate-only
   ```

2. Gather all required secret values from their respective services

3. Run the setup script:
   ```bash
   ./scripts/setup-github-secrets.sh
   ```

4. Follow the interactive prompts to set each secret

5. Verify all secrets are set:
   ```bash
   ./scripts/setup-github-secrets.sh --validate-only
   ```

### Troubleshooting

- **"GitHub CLI is not authenticated"**: Run `gh auth login` first
- **"Could not detect repository"**: Use `--repo owner/repo` flag
- **"Failed to set secret"**: Check you have admin permissions on the repository
- **Empty secret values**: The script will skip empty inputs for safety

## Other Scripts

### backup-database.ts

Referenced in the deployment workflow for post-deployment database backups. This script should handle Supabase database backups after successful production deployments.