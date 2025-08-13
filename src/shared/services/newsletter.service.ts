import { supabase } from '@/shared/lib/supabase'
import { EmailService } from './email.service'

export interface NewsletterSubscription {
  id?: string
  email: string
  name: string
  status: 'active' | 'unsubscribed' | 'pending'
  language: string
  preferences?: {
    news?: boolean
    events?: boolean
    dining?: boolean
    tourism?: boolean
    government?: boolean
  }
  createdAt?: string
  confirmedAt?: string
  unsubscribedAt?: string
}

export class NewsletterService {
  // Subscribe to newsletter
  static async subscribe(data: {
    email: string
    name: string
    language?: string
    preferences?: NewsletterSubscription['preferences']
  }): Promise<{ success: boolean; message: string; subscription?: NewsletterSubscription }> {
    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('email', data.email)
        .single()

      if (existing) {
        if (existing.status === 'active') {
          return {
            success: false,
            message: 'This email is already subscribed to our newsletter'
          }
        } else if (existing.status === 'unsubscribed') {
          // Reactivate subscription
          const { data: updated, error } = await supabase
            .from('newsletter_subscriptions')
            .update({
              status: 'active',
              name: data.name,
              language: data.language || 'en',
              preferences: data.preferences || existing.preferences,
              unsubscribed_at: null
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) throw error

          // Send reactivation email
          await this.sendWelcomeEmail(updated)

          return {
            success: true,
            message: 'Welcome back! Your subscription has been reactivated.',
            subscription: updated
          }
        }
      }

      // Create new subscription
      const { data: subscription, error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: data.email,
          name: data.name,
          status: 'pending',
          language: data.language || 'en',
          preferences: data.preferences || {
            news: true,
            events: true,
            dining: true,
            tourism: true,
            government: true
          }
        })
        .select()
        .single()

      if (error) throw error

      // Send confirmation email
      await this.sendConfirmationEmail(subscription)

      return {
        success: true,
        message: 'Please check your email to confirm your subscription',
        subscription
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      return {
        success: false,
        message: 'Failed to subscribe. Please try again later.'
      }
    }
  }

  // Confirm subscription
  static async confirmSubscription(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Decode token (in production, use proper JWT)
      const email = atob(token)

      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .update({
          status: 'active',
          confirmed_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('status', 'pending')
        .select()
        .single()

      if (error || !data) {
        return {
          success: false,
          message: 'Invalid or expired confirmation link'
        }
      }

      // Send welcome email
      await this.sendWelcomeEmail(data)

      return {
        success: true,
        message: 'Your subscription has been confirmed!'
      }
    } catch (error) {
      console.error('Confirmation error:', error)
      return {
        success: false,
        message: 'Failed to confirm subscription'
      }
    }
  }

  // Unsubscribe
  static async unsubscribe(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const email = atob(token)

      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('status', 'active')

      if (error) throw error

      return {
        success: true,
        message: 'You have been successfully unsubscribed'
      }
    } catch (error) {
      console.error('Unsubscribe error:', error)
      return {
        success: false,
        message: 'Failed to unsubscribe'
      }
    }
  }

  // Update preferences
  static async updatePreferences(
    email: string,
    preferences: NewsletterSubscription['preferences']
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ preferences })
        .eq('email', email)
        .eq('status', 'active')

      if (error) throw error

      return {
        success: true,
        message: 'Your preferences have been updated'
      }
    } catch (error) {
      console.error('Update preferences error:', error)
      return {
        success: false,
        message: 'Failed to update preferences'
      }
    }
  }

  // Get subscription by email
  static async getSubscription(email: string): Promise<NewsletterSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('email', email)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.error('Get subscription error:', error)
      return null
    }
  }

  // Send confirmation email
  private static async sendConfirmationEmail(subscription: NewsletterSubscription) {
    const confirmToken = btoa(subscription.email) // In production, use proper JWT
    const confirmUrl = `${window.location.origin}/newsletter/confirm?token=${confirmToken}`

    const emailContent = {
      to: subscription.email,
      subject: 'Confirm your MyDub.AI newsletter subscription',
      html: `
        <h2>Welcome to MyDub.AI Newsletter!</h2>
        <p>Hi ${subscription.name},</p>
        <p>Thank you for subscribing to the MyDub.AI newsletter. Please confirm your subscription by clicking the link below:</p>
        <p><a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0EA5E9; color: white; text-decoration: none; border-radius: 6px;">Confirm Subscription</a></p>
        <p>If you didn't subscribe, you can safely ignore this email.</p>
        <p>Best regards,<br>The MyDub.AI Team</p>
      `,
      text: `Welcome to MyDub.AI Newsletter!
      
Hi ${subscription.name},

Thank you for subscribing to the MyDub.AI newsletter. Please confirm your subscription by clicking the link below:

${confirmUrl}

If you didn't subscribe, you can safely ignore this email.

Best regards,
The MyDub.AI Team`
    }

    await EmailService.sendEmail(emailContent)
  }

  // Send welcome email
  private static async sendWelcomeEmail(subscription: NewsletterSubscription) {
    const unsubscribeToken = btoa(subscription.email)
    const unsubscribeUrl = `${window.location.origin}/newsletter/unsubscribe?token=${unsubscribeToken}`
    const preferencesUrl = `${window.location.origin}/newsletter/preferences?email=${subscription.email}`

    const emailContent = {
      to: subscription.email,
      subject: 'Welcome to MyDub.AI Newsletter!',
      html: `
        <h2>Welcome aboard, ${subscription.name}!</h2>
        <p>You're now subscribed to the MyDub.AI newsletter. Get ready for:</p>
        <ul>
          <li>✨ Latest Dubai news and updates</li>
          <li>🎉 Exclusive event announcements</li>
          <li>🍽️ Restaurant recommendations</li>
          <li>🏖️ Tourism tips and hidden gems</li>
          <li>📱 Government service updates</li>
        </ul>
        <p>You'll receive our newsletter weekly with the best of what Dubai has to offer.</p>
        <p>
          <a href="${preferencesUrl}" style="color: #0EA5E9;">Update your preferences</a> | 
          <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
        </p>
        <p>Best regards,<br>The MyDub.AI Team</p>
      `,
      text: `Welcome aboard, ${subscription.name}!
      
You're now subscribed to the MyDub.AI newsletter. Get ready for:

- Latest Dubai news and updates
- Exclusive event announcements  
- Restaurant recommendations
- Tourism tips and hidden gems
- Government service updates

You'll receive our newsletter weekly with the best of what Dubai has to offer.

Update your preferences: ${preferencesUrl}
Unsubscribe: ${unsubscribeUrl}

Best regards,
The MyDub.AI Team`
    }

    await EmailService.sendEmail(emailContent)
  }

  // Send newsletter to all active subscribers
  static async sendNewsletter(content: {
    subject: string
    html: string
    text: string
    category?: keyof NewsletterSubscription['preferences']
  }): Promise<{ success: boolean; sent: number; failed: number }> {
    try {
      // Get active subscribers
      let query = supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('status', 'active')

      // Filter by category preference if specified
      if (content.category) {
        query = query.eq(`preferences->${content.category}`, true)
      }

      const { data: subscribers, error } = await query

      if (error) throw error

      let sent = 0
      let failed = 0

      // Send to each subscriber
      for (const subscriber of subscribers || []) {
        try {
          const unsubscribeToken = btoa(subscriber.email)
          const unsubscribeUrl = `${window.location.origin}/newsletter/unsubscribe?token=${unsubscribeToken}`

          await EmailService.sendEmail({
            to: subscriber.email,
            subject: content.subject,
            html: content.html.replace('{{unsubscribe_url}}', unsubscribeUrl),
            text: content.text.replace('{{unsubscribe_url}}', unsubscribeUrl)
          })
          sent++
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error)
          failed++
        }
      }

      return { success: true, sent, failed }
    } catch (error) {
      console.error('Send newsletter error:', error)
      return { success: false, sent: 0, failed: 0 }
    }
  }
}