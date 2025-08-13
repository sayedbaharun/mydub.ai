# Email Templates for Supabase

## Instructions
Go to Supabase Dashboard > Authentication > Email Templates and update these:

### 1. Confirm Signup Template

**Subject**: Welcome to MyDub.AI - Verify Your Email

**Body**:
```html
<h2>Welcome to MyDub.AI!</h2>
<p>Hi there,</p>
<p>Thanks for signing up for MyDub.AI, your AI-powered Dubai companion.</p>
<p>Please click the button below to verify your email address:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Verify Email Address
  </a>
</p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't create an account with MyDub.AI, you can safely ignore this email.</p>
<p>
  Best regards,<br>
  The MyDub.AI Team
</p>
```

### 2. Reset Password Template

**Subject**: Reset Your MyDub.AI Password

**Body**:
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your MyDub.AI password.</p>
<p>Click the button below to create a new password:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Reset Password
  </a>
</p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
<p>
  Best regards,<br>
  The MyDub.AI Team
</p>
```

### 3. Magic Link Template

**Subject**: Sign in to MyDub.AI

**Body**:
```html
<h2>Sign in to MyDub.AI</h2>
<p>Hi there,</p>
<p>Click the button below to sign in to your MyDub.AI account:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Sign In
  </a>
</p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>
  Best regards,<br>
  The MyDub.AI Team
</p>
```

## Email Settings in Supabase

1. Go to Authentication > Settings
2. Update these settings:
   - **Enable email confirmations**: ON
   - **Secure email change**: ON
   - **Email OTP expiry**: 3600 (1 hour)
   - **Confirmation expiry**: 86400 (24 hours)

## SMTP Configuration (Optional - for custom domain)

If you want to use your own domain for emails:

1. Go to Project Settings > Auth
2. Enable Custom SMTP
3. Add these settings:
   - Host: smtp.sendgrid.net
   - Port: 587
   - User: apikey
   - Pass: [Your SendGrid API Key]
   - Sender email: noreply@mydub.ai
   - Sender name: MyDub.AI