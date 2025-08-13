import { useState } from 'react'
import { ChevronDown, ChevronRight, Search, HelpCircle, MessageCircle } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useStructuredData } from '@/hooks/useStructuredData'

const faqCategories = [
  {
    title: 'Getting Started',
    questions: [
      {
        question: 'What is MyDub.AI?',
        answer: 'MyDub.AI is an AI-powered platform that helps residents and visitors discover the best of Dubai. We provide personalized recommendations, real-time information, and intelligent assistance for dining, tourism, government services, and more.'
      },
      {
        question: 'How do I create an account?',
        answer: 'Click "Sign Up" in the top right corner, enter your email and create a password. You can also sign up using your Google account for faster registration.'
      },
      {
        question: 'Is MyDub.AI free to use?',
        answer: 'Yes! MyDub.AI is completely free to use. All our core features including news, AI recommendations, tourism information, and government services are available at no cost.'
      },
      {
        question: 'What languages does MyDub.AI support?',
        answer: 'We support English, Arabic, Hindi, and Urdu. The platform automatically detects your language preference and includes full right-to-left (RTL) support for Arabic and Urdu.'
      }
    ]
  },
  {
    title: 'AI Assistant',
    questions: [
      {
        question: 'How does the AI Assistant work?',
        answer: 'Our AI Assistant uses advanced language models trained on Dubai-specific information to provide personalized recommendations. Simply ask questions in natural language and get intelligent, contextual responses.'
      },
      {
        question: 'What can I ask the AI Assistant?',
        answer: 'You can ask about restaurants, attractions, events, weather, transportation, government services, local customs, shopping, entertainment, and virtually anything related to Dubai life.'
      },
      {
        question: 'Is the AI Assistant available 24/7?',
        answer: 'Yes! Our AI Assistant is available 24 hours a day, 7 days a week to help you with any questions about Dubai.'
      },
      {
        question: 'How accurate are the AI recommendations?',
        answer: 'Our AI is trained on current, verified data and continuously updated. However, we recommend confirming important details like opening hours and prices directly with establishments.'
      }
    ]
  },
  {
    title: 'Features & Content',
    questions: [
      {
        question: 'How often is content updated?',
        answer: 'Our content is updated in real-time. News articles are refreshed continuously, government updates are synced regularly, and tourism information is updated as new data becomes available.'
      },
      {
        question: 'Can I save my favorite places?',
        answer: 'Yes! When signed in, you can bookmark articles, save recommendations, and build your personal collection of favorite Dubai spots and information.'
      },
      {
        question: 'How do I search for specific information?',
        answer: 'Use the search bar in the header to find specific content, or ask our AI Assistant for more conversational search. You can also browse by categories like news, tourism, government, etc.'
      },
      {
        question: 'Can I suggest new features or content?',
        answer: 'Absolutely! We welcome feedback and suggestions. Use our contact form or email us at hello@mydub.ai with your ideas.'
      }
    ]
  },
  {
    title: 'Account & Privacy',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'On the sign-in page, click "Forgot Password" and enter your email. We\'ll send you a secure link to reset your password.'
      },
      {
        question: 'What data do you collect?',
        answer: 'We only collect essential information needed to provide our services: your email, basic profile information, and usage analytics to improve the platform. See our Privacy Policy for full details.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. This will permanently remove all your data from our system. Note that this action cannot be undone.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes. We use industry-standard encryption and security measures to protect your data. We never share personal information with third parties without your consent.'
      }
    ]
  },
  {
    title: 'Technical Support',
    questions: [
      {
        question: 'The website is loading slowly. What can I do?',
        answer: 'Try refreshing the page, clearing your browser cache, or switching to a different browser. If issues persist, contact our support team.'
      },
      {
        question: 'I found incorrect information. How do I report it?',
        answer: 'Please contact us immediately at hello@mydub.ai with details about the incorrect information. We take data accuracy seriously and will investigate promptly.'
      },
      {
        question: 'The AI Assistant isn\'t responding. What should I do?',
        answer: 'Try refreshing the page or clearing your browser cache. If the issue continues, you can reach our support team via email or use the contact form.'
      },
      {
        question: 'Can I use MyDub.AI on my mobile device?',
        answer: 'Yes! MyDub.AI is fully responsive and optimized for mobile devices. You can also install it as a Progressive Web App (PWA) for an app-like experience.'
      }
    ]
  }
]

export default function FAQPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  
  // Flatten all FAQs for structured data
  const allFaqs = faqCategories.flatMap(category => 
    category.questions.map(q => ({
      question: q.question,
      answer: q.answer
    }))
  )
  
  // Add structured data for SEO
  useStructuredData('faq', { faqs: allFaqs })

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedItems(newExpanded)
  }

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">{t('faq.title')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('faq.subtitle')}
        </p>
        
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder={t('faq.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
      </div>

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-2">{t('faq.stillHaveQuestions')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('faq.ayyanCanHelp')}
            </p>
            <Link to="/chat">
              <Button size="sm">
                {t('faq.askAyyanX')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold mb-2">{t('faq.needMoreHelp')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('faq.contactSupport')}
            </p>
            <Link to="/contact">
              <Button variant="outline" size="sm">
                {t('faq.contactSupportButton')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
            
            <div className="space-y-3">
              {category.questions.map((faq, questionIndex) => {
                const questionId = `${categoryIndex}-${questionIndex}`
                const isExpanded = expandedItems.has(questionId)
                
                return (
                  <Card key={questionIndex} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleExpanded(questionId)}
                        className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-6 pb-6">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {searchQuery && filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('faq.noResultsFound')}</h3>
          <p className="text-gray-600 mb-4">
            {t('faq.noResultsMessage', { query: searchQuery })}
          </p>
          <div className="space-x-4">
            <Button onClick={() => setSearchQuery('')}>
              {t('faq.clearSearch')}
            </Button>
            <Link to="/contact">
              <Button variant="outline">
                {t('faq.contactSupportButton')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <Card className="bg-gray-900 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">{t('faq.didntFindAnswer')}</h3>
          <p className="text-gray-300 mb-6">
            {t('faq.supportTeamHelp')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/contact">
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                {t('faq.contactSupportButton')}
              </Button>
            </Link>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
              {t('faq.emailUs')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}