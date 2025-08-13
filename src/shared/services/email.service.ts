import { supabase } from '@/shared/lib/supabase'

const SENDGRID_API_KEY = import.meta.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = import.meta.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@mydub.ai'

interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  // Send email using SendGrid
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      // For client-side, we'll use a Supabase Edge Function
      // For server-side, we can use SendGrid directly
      
      if (typeof window !== 'undefined') {
        // Client-side: Use Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: template.to,
            subject: template.subject,
            html: template.html,
            text: template.text
          }
        })

        if (error) throw error
        return data?.success || false
      } else {
        // Server-side: Direct SendGrid API call
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: template.to }]
            }],
            from: { email: SENDGRID_FROM_EMAIL },
            subject: template.subject,
            content: [
              {
                type: 'text/plain',
                value: template.text || template.html.replace(/<[^>]*>/g, '')
              },
              {
                type: 'text/html',
                value: template.html
              }
            ]
          })
        })

        return response.ok
      }
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  // Send welcome email
  static async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Welcome to MyDub.AI - Your Dubai Guide',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MyDub.AI!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for joining MyDub.AI, your intelligent guide to everything Dubai!</p>
              <p>With MyDub.AI, you can:</p>
              <ul>
                <li>Access government services and information</li>
                <li>Stay updated with local news and events</li>
                <li>Discover tourist attractions and activities</li>
                <li>Get practical information for daily life</li>
                <li>Chat with our AI assistant for instant help</li>
              </ul>
              <p>Get started by exploring our features:</p>
              <a href="${import.meta.env.VITE_APP_URL || 'https://mydub.ai'}" class="button">Explore MyDub.AI</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The MyDub.AI Team</p>
            </div>
            <div class="footer">
              <p>© 2024 MyDub.AI. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to MyDub.AI!
        
        Hello ${name},
        
        Thank you for joining MyDub.AI, your intelligent guide to everything Dubai!
        
        With MyDub.AI, you can:
        - Access government services and information
        - Stay updated with local news and events
        - Discover tourist attractions and activities
        - Get practical information for daily life
        - Chat with our AI assistant for instant help
        
        Get started by exploring our features at ${import.meta.env.VITE_APP_URL || 'https://mydub.ai'}
        
        If you have any questions, feel free to reach out to our support team.
        
        Best regards,
        The MyDub.AI Team
      `
    }

    return this.sendEmail(template)
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Reset Your MyDub.AI Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your MyDub.AI password. Click the button below to create a new password:</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
              <p>Best regards,<br>The MyDub.AI Team</p>
            </div>
            <div class="footer">
              <p>© 2024 MyDub.AI. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello,
        
        We received a request to reset your MyDub.AI password. Visit the following link to create a new password:
        
        ${resetLink}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, you can safely ignore this email.
        
        Best regards,
        The MyDub.AI Team
      `
    }

    return this.sendEmail(template)
  }

  // Send notification email
  static async sendNotificationEmail(
    email: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: title,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
              ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText || 'View Details'}</a>` : ''}
            </div>
            <div class="footer">
              <p>© 2024 MyDub.AI. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${title}
        
        ${message}
        
        ${actionUrl ? `${actionText || 'View Details'}: ${actionUrl}` : ''}
        
        © 2024 MyDub.AI. All rights reserved.
      `
    }

    return this.sendEmail(template)
  }

  // Send daily digest email
  static async sendDailyDigest(
    email: string,
    news: any[],
    events: any[],
    updates: any[]
  ): Promise<boolean> {
    const newsHtml = news.map(item => `
      <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px;">
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <a href="${item.url}" style="color: #0ea5e9;">Read more →</a>
      </div>
    `).join('')

    const eventsHtml = events.map(item => `
      <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px;">
        <h3>${item.title}</h3>
        <p>${item.date} - ${item.location}</p>
        <a href="${item.url}" style="color: #0ea5e9;">Learn more →</a>
      </div>
    `).join('')

    const template: EmailTemplate = {
      to: email,
      subject: `MyDub.AI Daily Digest - ${new Date().toLocaleDateString()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .section { margin-bottom: 30px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Daily Dubai Digest</h1>
              <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="content">
              ${news.length > 0 ? `
                <div class="section">
                  <h2>📰 Top News</h2>
                  ${newsHtml}
                </div>
              ` : ''}
              
              ${events.length > 0 ? `
                <div class="section">
                  <h2>📅 Upcoming Events</h2>
                  ${eventsHtml}
                </div>
              ` : ''}
              
              ${updates.length > 0 ? `
                <div class="section">
                  <h2>🔔 Government Updates</h2>
                  ${updates.map(item => `<p>• ${item}</p>`).join('')}
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>© 2024 MyDub.AI. All rights reserved.</p>
              <p>You're receiving this because you're subscribed to daily digests.</p>
              <p><a href="${import.meta.env.VITE_APP_URL}/settings/notifications" style="color: #666;">Manage preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    return this.sendEmail(template)
  }
}