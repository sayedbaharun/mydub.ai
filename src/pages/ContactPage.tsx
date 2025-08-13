import { useState } from 'react'
import { Mail, MapPin, MessageSquare, Send, Clock } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from 'sonner'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message and we\'ll get back to you within 24 hours.',
    contact: 'hello@mydub.ai',
    action: 'Send Email'
  },
  {
    icon: MessageSquare,
    title: 'AI Assistant',
    description: 'Get instant help from our AI Assistant for quick questions.',
    contact: 'Available 24/7',
    action: 'Start Chat'
  },
  {
    icon: MapPin,
    title: 'Location',
    description: 'Based in Dubai, UAE, serving the local community.',
    contact: 'Dubai, United Arab Emirates',
    action: 'View Map'
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Message sent successfully! We\'ll get back to you soon.')
    setFormData({
      name: '',
      email: '',
      subject: '',
      category: '',
      message: ''
    })
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Get in Touch</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Have a question, suggestion, or need help? We'd love to hear from you. 
          Choose the best way to reach us below.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactMethods.map((method, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <method.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{method.description}</p>
              <p className="text-blue-600 font-medium mb-4">{method.contact}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (method.title === 'AI Assistant') {
                    window.location.href = '/chat'
                  } else if (method.title === 'Email Support') {
                    window.location.href = 'mailto:hello@mydub.ai'
                  }
                }}
              >
                {method.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send us a Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="business">Business Partnership</SelectItem>
                    <SelectItem value="press">Press & Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <Input
                  required
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Brief description of your message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <Textarea
                  required
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Tell us more about your inquiry..."
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Response Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">AI Assistant</span>
                <span className="text-green-600 font-medium">Instant</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email Support</span>
                <span className="text-blue-600 font-medium">Within 24 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Technical Issues</span>
                <span className="text-orange-600 font-medium">Within 48 hours</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">How do I reset my password?</h4>
                <p className="text-sm text-gray-600">Visit the sign-in page and click "Forgot Password" to reset it.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Is MyDub.AI free to use?</h4>
                <p className="text-sm text-gray-600">Yes! All core features are completely free.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">How often is content updated?</h4>
                <p className="text-sm text-gray-600">Our content is updated in real-time throughout the day.</p>
              </div>
              <div className="pt-2">
                <a href="/faq" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all FAQs →
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Business Partnerships</h3>
              <p className="text-gray-600 text-sm mb-4">
                Interested in partnering with us or integrating your services with MyDub.AI?
              </p>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                partnerships@mydub.ai
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}