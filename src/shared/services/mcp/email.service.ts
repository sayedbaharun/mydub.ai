/**
 * Email Service
 * Provides email functionality using SendGrid MCP server or local fallback
 */

import { mcpConfig } from './index';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export class EmailService {
  private static instance: EmailService;
  private enabled: boolean;
  private isDevelopment: boolean;

  private constructor() {
    this.enabled = mcpConfig.sendgrid.enabled;
    this.isDevelopment = import.meta.env.DEV;
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<boolean> {
    try {
      if (this.isDevelopment && !this.enabled) {
        // In development without SendGrid, log to console
        console.log('📧 Development Email:', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100) || options.html?.substring(0, 100),
        });
        
        // Also save to localStorage for testing
        const emails = JSON.parse(localStorage.getItem('dev:emails') || '[]');
        emails.push({
          ...options,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('dev:emails', JSON.stringify(emails));
        
        return true;
      }

      if (!this.enabled) {
        console.warn('Email service not configured');
        return false;
      }

      // In production, this would use the SendGrid MCP server
      // For now, we'll simulate the API call
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          from: options.from || 'noreply@mydubai.ae',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulk(
    recipients: string[],
    template: Omit<EmailOptions, 'to'>
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // Process in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(to => this.send({ ...template, to }))
      );

      sent += results.filter(r => r).length;
      failed += results.filter(r => !r).length;
    }

    return { sent, failed };
  }

  /**
   * Send newsletter
   */
  async sendNewsletter(options: {
    subject: string;
    content: string;
    subscribers: string[];
  }): Promise<{ sent: number; failed: number }> {
    const template = {
      subject: options.subject,
      html: this.wrapInTemplate(options.content),
      text: this.htmlToText(options.content),
    };

    return this.sendBulk(options.subscribers, template);
  }

  /**
   * Send verification email
   */
  async sendVerification(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${window.location.origin}/verify-email?token=${token}`;
    
    return this.send({
      to: email,
      subject: 'Verify your MyDubai account',
      html: `
        <h2>Welcome to MyDubai!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a>
        <p>Or copy this link: ${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Welcome to MyDubai! Please verify your email by visiting: ${verifyUrl}`,
    });
  }

  /**
   * Get development emails (for testing)
   */
  getDevEmails(): any[] {
    if (!this.isDevelopment) return [];
    return JSON.parse(localStorage.getItem('dev:emails') || '[]');
  }

  /**
   * Clear development emails
   */
  clearDevEmails(): void {
    if (this.isDevelopment) {
      localStorage.removeItem('dev:emails');
    }
  }

  // Helper methods
  private wrapInTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MyDubai</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <header style="text-align: center; margin-bottom: 30px;">
            <img src="${window.location.origin}/mydub-logo.png" alt="MyDubai" style="height: 50px;">
          </header>
          <main>
            ${content}
          </main>
          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} MyDubai. All rights reserved.</p>
            <p>
              <a href="${window.location.origin}/unsubscribe" style="color: #666;">Unsubscribe</a> |
              <a href="${window.location.origin}/privacy" style="color: #666;">Privacy Policy</a>
            </p>
          </footer>
        </body>
      </html>
    `;
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();