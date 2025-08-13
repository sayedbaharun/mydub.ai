import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Mail, Send, MessageCircle } from 'lucide-react'

export function SubscribeSection() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    setEmail('')
    // Show success message
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        SUBSCRIBE & JOIN THE DAILY DROP
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Email Signup */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-0">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Email Newsletter</h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            Get daily Dubai insights, news, and exclusive recommendations delivered to your inbox.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/80"
              required
            />
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Subscribing...'
              ) : (
                <>
                  Subscribe
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* WhatsApp/Telegram */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-0">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Instant Updates</h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            Join our WhatsApp or Telegram for instant Dubai updates and breaking news.
          </p>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full bg-white/80 hover:bg-green-50 border-green-200"
            >
              Join WhatsApp Channel
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-white/80 hover:bg-blue-50 border-blue-200"
            >
              Join Telegram Channel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 