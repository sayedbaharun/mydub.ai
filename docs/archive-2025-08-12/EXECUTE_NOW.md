# 🚨 REMAINING FIXES TO EXECUTE

## ✅ Already Completed:
- RLS Policies are working correctly (using user_profiles table)
- Storage buckets exist (content-images, article-images, user-avatars, content-documents)
- Email verification flow is implemented in code
- Article Management System with RSS/API import

## Step 1: Update Admin Password (CRITICAL SECURITY FIX!)

1. **In your terminal, run:**
```bash
cd /Users/sayedbaharun/Library/Mobile\ Documents/com~apple~CloudDocs/Proffessional/Revolv\ Group/Projects/Current\ Projects/Hikma\ Digital/Projects/MyDub.ai/03_Website_Development

tsx blind-spots/fixes/04-secure-admin-setup.ts
```

2. **Follow the prompts:**
   - Press Enter to keep admin@mydub.ai or enter new email
   - Type 'y' to update password
   - Save the generated password securely

## Step 2: Configure Email Templates in Supabase

1. **Go to Supabase Dashboard > Authentication > Email Templates**

2. **Update "Confirm signup" template:**
   - Subject: `Welcome to MyDub.AI - Verify Your Email`
   - Copy content from: `blind-spots/fixes/03-email-templates.md`

3. **Enable email confirmations:**
   - Go to Authentication > Settings
   - Turn ON "Enable email confirmations"

## Step 3: Fix Storage Bucket MIME Types

1. **Go to Supabase Dashboard > Storage**

2. **For each bucket, update allowed MIME types:**
   - content-images: image/jpeg, image/png, image/gif, image/webp
   - article-images: image/jpeg, image/png, image/gif, image/webp
   - user-avatars: image/jpeg, image/png, image/gif, image/webp
   - content-documents: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain

## Step 4: Test Everything

1. **Test admin login:**
   - Use your new admin password
   - Access http://localhost:8001/dashboard

2. **Test registration flow:**
   - Go to http://localhost:8001/auth/signup
   - Register with a real email
   - Check for verification email

3. **Test storage uploads:**
```bash
node blind-spots/fixes/verify-fixes.js
```

## ✅ Success Criteria

- [ ] Admin password changed from default
- [ ] Email verification required for new users
- [ ] Storage buckets accept appropriate file types
- [ ] All tests pass

## 🚨 If Something Goes Wrong

1. **Admin Password:** Use Supabase Dashboard > Auth > Users to manually reset
2. **Email Not Sending:** Check Supabase email settings and SMTP configuration
3. **Storage Issues:** Check bucket policies in Supabase Dashboard

---
**Time Estimate:** 15-20 minutes
**Priority:** Do Step 1 (Admin password) immediately - it's a security risk!