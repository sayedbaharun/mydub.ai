#!/usr/bin/env node
import { SecureApiKeyStorage } from '../src/lib/security/vault';
import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as readline from 'readline';

// Load environment variables
config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

/**
 * API keys that need to be migrated
 */
const API_KEYS_TO_MIGRATE = [
  { envKey: 'VITE_SUPABASE_URL', vaultKey: 'supabase-url' },
  { envKey: 'VITE_SUPABASE_ANON_KEY', vaultKey: 'supabase-anon-key' },
  { envKey: 'VITE_OPENAI_API_KEY', vaultKey: 'openai-api-key' },
  { envKey: 'VITE_ANTHROPIC_API_KEY', vaultKey: 'anthropic-api-key' },
  { envKey: 'VITE_GOOGLE_GEMINI_API_KEY', vaultKey: 'google-gemini-api-key' },
  { envKey: 'VITE_SENTRY_DSN', vaultKey: 'sentry-dsn' },
  { envKey: 'VITE_GA_MEASUREMENT_ID', vaultKey: 'ga-measurement-id' },
  { envKey: 'VITE_RAPIDAPI_KEY', vaultKey: 'rapidapi-key' },
  { envKey: 'VITE_NEWS_API_KEY', vaultKey: 'news-api-key' },
  { envKey: 'VITE_WEATHER_API_KEY', vaultKey: 'weather-api-key' },
  { envKey: 'VITE_TRANSLATION_API_KEY', vaultKey: 'translation-api-key' },
  { envKey: 'VITE_CLOUDINARY_CLOUD_NAME', vaultKey: 'cloudinary-cloud-name' },
  { envKey: 'VITE_CLOUDINARY_API_KEY', vaultKey: 'cloudinary-api-key' },
  { envKey: 'VITE_CLOUDINARY_API_SECRET', vaultKey: 'cloudinary-api-secret' },
];

async function migrateKeys() {
  console.log('🔐 API Key Migration Tool');
  console.log('========================\n');

  // Get master password
  const masterPassword = await question('Enter master password for encryption: ');
  const confirmPassword = await question('Confirm master password: ');

  if (masterPassword !== confirmPassword) {
    console.error('❌ Passwords do not match!');
    process.exit(1);
  }

  const storage = new SecureApiKeyStorage();
  const migrated: string[] = [];
  const failed: string[] = [];

  console.log('\n📦 Starting migration...\n');

  for (const { envKey, vaultKey } of API_KEYS_TO_MIGRATE) {
    const value = process.env[envKey];
    
    if (!value || value.includes('your-') || value.includes('xxx')) {
      console.log(`⏭️  Skipping ${envKey} (placeholder or empty)`);
      continue;
    }

    try {
      await storage.storeApiKey(vaultKey, value, masterPassword);
      migrated.push(envKey);
      console.log(`✅ Migrated ${envKey} → ${vaultKey}`);
    } catch (error) {
      failed.push(envKey);
      console.error(`❌ Failed to migrate ${envKey}:`, error);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${migrated.length} keys`);
  console.log(`❌ Failed: ${failed.length} keys`);

  if (migrated.length > 0) {
    console.log('\n📝 Creating secure .env template...');
    createSecureEnvTemplate(migrated);
  }

  console.log('\n⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Remove sensitive keys from .env files');
  console.log('2. Update application to use the vault service');
  console.log('3. Store master password securely (e.g., AWS Secrets Manager)');
  console.log('4. Never commit the encrypted keys to version control');

  rl.close();
}

function createSecureEnvTemplate(migratedKeys: string[]) {
  const envPath = resolve(process.cwd(), '.env');
  const templatePath = resolve(process.cwd(), '.env.secure.template');
  
  let envContent = '';
  
  try {
    envContent = readFileSync(envPath, 'utf-8');
  } catch (error) {
    console.error('Could not read .env file');
    return;
  }

  // Replace migrated keys with placeholders
  let templateContent = envContent;
  for (const key of migratedKeys) {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    templateContent = templateContent.replace(regex, `${key}=<MIGRATED_TO_VAULT>`);
  }

  writeFileSync(templatePath, templateContent);
  console.log(`Created ${templatePath}`);
}

// Run migration
migrateKeys().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});