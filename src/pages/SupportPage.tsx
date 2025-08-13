import { useState } from 'react'
import { Mail, MessageCircle, Phone, Clock, MapPin, Send, User, MessageSquare } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

const supportMethods = [
  {
    icon: MessageCircle,
    title: 'AI Chat Support',
    description: 'Get instant help from our AI assistant',
    action: 'Start Chat',
    href: '/chat',
    available: '24/7',
    response: 'Instant',
    color: 'blue'
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message and we\'ll get back to you',
    action: 'Send Email',
    href: 'mailto:hello@mydub.ai',
    available: 'Mon-Fri 9AM-6PM GST',
    response: 'Within 24 hours',
    color: 'green'
  },
  {
    icon: MessageSquare,
    title: 'Contact Form',
    description: 'Fill out our form for detailed support requests',
    action: 'Open Form',
    href: '#contact-form',
    available: '24/7',
    response: 'Within 24 hours',
    color: 'purple'
  }
]

const supportCategories = [
  'General Question',
  'Account & Login',
  'Arabic Learning',
  'News & Information',
  'Tourism & Activities',
  'Technical Issue',
  'Feature Request',
  'Report a Problem',
  'Business Inquiry'
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
        // You would typically send this to your backend
    alert('Thank you for your message! We\'ll get back to you within 24 hours.')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Support Center</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Need help? We're here for you. Choose the best way to get support for your MyDub.AI experience.
        </p>
      </div>

      {/* Support Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportMethods.map((method, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-${method.color}-100`}>
                <method.icon className={`h-8 w-8 text-${method.color}-600`} />
              </div>
              <CardTitle className="text-xl">{method.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{method.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{method.available}</span>
                </div>
                <div className="text-gray-500">Response: {method.response}</div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => {
                  if (method.href.startsWith('#')) {
                    document.querySelector(method.href)?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    window.location.href = method.href
                  }
                }}
              >
                {method.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Form */}
      <Card id="contact-form">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Send className="h-6 w-6" />
            Contact Form
          </CardTitle>
          <p className="text-gray-600">
            Send us a detailed message and we'll get back to you as soon as possible.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Support Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {supportCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                required
                placeholder="Brief description of your issue or question"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                required
                placeholder="Please provide as much detail as possible about your question or issue..."
                rows={6}
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Help</CardTitle>
          <p className="text-gray-600">
            Looking for answers to common questions? Check out these resources.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Getting Started Guide</div>
                <div className="text-sm text-gray-500">Learn the basics</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Arabic Learning Help</div>
                <div className="text-sm text-gray-500">How to use our features</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">FAQ</div>
                <div className="text-sm text-gray-500">Common questions</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Account Issues</div>
                <div className="text-sm text-gray-500">Login & profile help</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Technical Problems</div>
                <div className="text-sm text-gray-500">Troubleshooting guide</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Feature Requests</div>
                <div className="text-sm text-gray-500">Suggest improvements</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Email Support</div>
                <div className="text-gray-600">hello@mydub.ai</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Location</div>
                <div className="text-gray-600">Dubai, United Arab Emirates</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Support Hours</div>
                <div className="text-gray-600">Monday - Friday, 9AM - 6PM GST</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What to Include</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <strong>Device & Browser:</strong> Tell us what device and browser you're using
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <strong>Steps to Reproduce:</strong> Describe what you were doing when the issue occurred
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <strong>Screenshots:</strong> If applicable, attach screenshots or screen recordings
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <strong>Error Messages:</strong> Include any error messages you've seen
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}