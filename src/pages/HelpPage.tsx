import { useState } from 'react'
import { Search, MessageCircle, Book, Mail, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    articles: [
      { title: 'Welcome to MyDub.AI', href: '#' },
      { title: 'Setting up your account', href: '#' },
      { title: 'Navigating the platform', href: '#' },
      { title: 'Understanding AI recommendations', href: '#' },
    ]
  },
  {
    id: 'features',
    title: 'Features & Tools',
    icon: HelpCircle,
    articles: [
      { title: 'How to use AI Assistant', href: '/chat' },
      { title: 'Learning Arabic with daily phrases', href: '/arabic-learning' },
      { title: 'Finding the latest news', href: '/news' },
      { title: 'Exploring tourism options', href: '/tourism' },
      { title: 'Government services guide', href: '/government' },
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: MessageCircle,
    articles: [
      { title: 'Managing your profile', href: '/profile' },
      { title: 'Notification preferences', href: '/settings' },
      { title: 'Language settings', href: '#' },
      { title: 'Privacy controls', href: '#' },
    ]
  }
]

const popularQuestions = [
  {
    question: 'How does the AI Assistant work?',
    answer: 'Our AI Assistant uses advanced language models to provide personalized recommendations for Dubai activities, restaurants, attractions, and services based on your preferences and current trends.'
  },
  {
    question: 'Is MyDub.AI free to use?',
    answer: 'Yes! MyDub.AI is completely free to use. We provide all our core features including news, tourism information, and AI assistance at no cost.'
  },
  {
    question: 'How often is the information updated?',
    answer: 'Our content is updated in real-time. News articles, government updates, and tourism information are continuously refreshed to ensure you have the latest information about Dubai.'
  },
  {
    question: 'Can I use MyDub.AI in Arabic?',
    answer: 'Yes! MyDub.AI supports multiple languages including Arabic, Hindi, and Urdu, with full right-to-left (RTL) text support for Arabic and Urdu.'
  },
  {
    question: 'How does the Arabic learning feature work?',
    answer: 'Our Arabic learning feature displays a new Arabic phrase each day on the homepage. You can explore all 285+ phrases, search by category, and filter by difficulty level at /arabic-learning. Perfect for learning essential Arabic phrases for life in Dubai!'
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">How can we help you?</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions, learn about features, or get in touch with our support team
        </p>
        
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get instant help from our AI Assistant
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/chat'}>
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Mail className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send us a detailed message
            </p>
            <Button variant="outline" size="sm">
              <a href="mailto:hello@mydub.ai">Contact Us</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Popular Questions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Popular Questions</h2>
        <div className="space-y-4">
          {popularQuestions.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <category.icon className="h-5 w-5 text-blue-600" />
                    <span>{category.title}</span>
                    <Badge variant="secondary">{category.articles.length}</Badge>
                  </div>
                  {expandedCategory === category.id ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CardTitle>
              </CardHeader>
              
              {expandedCategory === category.id && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {category.articles.map((article, index) => (
                      <div key={index}>
                        <a
                          href={article.href}
                          className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-blue-600 hover:text-blue-800">
                            {article.title}
                          </span>
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <Card className="bg-blue-50">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex gap-4 justify-center">
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/chat'}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with AI
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}