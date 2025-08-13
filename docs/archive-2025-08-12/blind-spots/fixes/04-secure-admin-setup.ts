#!/usr/bin/env tsx
/**
 * Secure Admin Setup Script
 * This script helps you securely set up admin credentials
 * Run with: tsx blind-spots/fixes/04-secure-admin-setup.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as readline from 'readline/promises';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate secure password
function generateSecurePassword(length = 20): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  const randomValues = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  // Ensure password has at least one of each type
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  
  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    return generateSecurePassword(length); // Regenerate if requirements not met
  }
  
  return password;
}

async function updateAdminCredentials() {
  console.log('🔐 Secure Admin Setup for MyDub.AI\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Get admin email
    const adminEmail = await rl.question('Enter admin email (press Enter for admin@mydub.ai): ');
    const email = adminEmail.trim() || 'admin@mydub.ai';

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingAdmin = users.find(u => u.email === email);

    if (existingAdmin) {
      console.log(`\n⚠️  Admin user already exists: ${email}`);
      
      // Ask if they want to update password
      const updatePassword = await rl.question('Do you want to update the password? (y/n): ');
      
      if (updatePassword.toLowerCase() === 'y') {
        // Generate new password
        const newPassword = generateSecurePassword();
        
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingAdmin.id,
          { password: newPassword }
        );
        
        if (updateError) throw updateError;
        
        console.log('\n✅ Admin password updated successfully!');
        console.log('\n🔑 New Admin Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log('\n⚠️  IMPORTANT: Save these credentials securely and remove them from this console!');
        
        // Update profile to ensure admin role
        await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', existingAdmin.id);
      }
    } else {
      // Create new admin
      console.log('\n📝 Creating new admin user...');
      
      const password = generateSecurePassword();
      
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: 'MyDub Admin',
          role: 'admin'
        }
      });
      
      if (createError) throw createError;
      
      // Update profile
      if (authData.user) {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: email,
            full_name: 'MyDub Admin',
            role: 'admin',
            status: 'active'
          });
      }
      
      console.log('\n✅ Admin user created successfully!');
      console.log('\n🔑 Admin Credentials:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    }

    // Update environment file template
    console.log('\n📄 Update your .env file:');
    console.log('Remove or update these lines:');
    console.log('- ADMIN_EMAIL=admin@mydub.ai');
    console.log('- ADMIN_PASSWORD=MyDub@Admin2025!');
    
    console.log('\n🔒 Security Recommendations:');
    console.log('1. Use a password manager to store credentials');
    console.log('2. Enable 2FA for admin accounts');
    console.log('3. Rotate passwords every 90 days');
    console.log('4. Never commit credentials to git');
    console.log('5. Use environment variables for sensitive data');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
updateAdminCredentials().catch(console.error);