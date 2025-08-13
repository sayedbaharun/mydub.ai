import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  Home,
  Building,
  Car,
  GraduationCap,
  Heart,
  Users,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  CreditCard,
  Shield,
  ArrowRight,
  CheckCircle,
  Info,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface GuideSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  items: {
    title: string
    description: string
    link?: string
  }[]
}

export default function LivingPage() {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('essentials')

  const guideSections: GuideSection[] = [
    {
      id: 'housing',
      title: 'Housing & Accommodation',
      description: 'Find your perfect home in Dubai',
      icon: Home,
      color: 'bg-blue-500',
      items: [
        { title: 'Renting Process', description: 'EJARI registration, deposits, and contracts' },
        { title: 'Popular Areas', description: 'Marina, Downtown, JBR, Business Bay guides' },
        { title: 'Utilities Setup', description: 'DEWA, internet, and district cooling' },
        { title: 'Real Estate Laws', description: 'Tenant rights and landlord obligations' },
      ]
    },
    {
      id: 'visa',
      title: 'Visa & Residency',
      description: 'Navigate UAE visa requirements',
      icon: Shield,
      color: 'bg-green-500',
      items: [
        { title: 'Visa Types', description: 'Employment, investor, family visas explained' },
        { title: 'Emirates ID', description: 'Application process and requirements' },
        { title: 'Medical Tests', description: 'Required health checks and centers' },
        { title: 'Visa Renewal', description: 'Timeline and documentation needed' },
      ]
    },
    {
      id: 'transport',
      title: 'Transportation',
      description: 'Getting around Dubai efficiently',
      icon: Car,
      color: 'bg-purple-500',
      items: [
        { title: 'Driving License', description: 'RTA license conversion and new applications' },
        { title: 'Car Registration', description: 'Buying, registering, and insurance' },
        { title: 'Public Transport', description: 'Metro, bus, and taxi systems' },
        { title: 'Parking', description: 'Zones, apps, and seasonal cards' },
      ]
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Schools and learning in Dubai',
      icon: GraduationCap,
      color: 'bg-yellow-500',
      items: [
        { title: 'School Systems', description: 'British, American, IB curricula compared' },
        { title: 'Admission Process', description: 'KHDA regulations and requirements' },
        { title: 'Universities', description: 'Higher education options in UAE' },
        { title: 'Costs & Fees', description: 'Tuition ranges and payment plans' },
      ]
    },
    {
      id: 'healthcare',
      title: 'Healthcare',
      description: 'Medical services and insurance',
      icon: Heart,
      color: 'bg-red-500',
      items: [
        { title: 'Health Insurance', description: 'Mandatory coverage and providers' },
        { title: 'Hospitals', description: 'Public vs private healthcare facilities' },
        { title: 'Pharmacies', description: '24/7 locations and prescription rules' },
        { title: 'Emergency Services', description: 'Ambulance, emergency numbers' },
      ]
    },
    {
      id: 'banking',
      title: 'Banking & Finance',
      description: 'Managing money in the UAE',
      icon: CreditCard,
      color: 'bg-indigo-500',
      items: [
        { title: 'Opening Accounts', description: 'Required documents and bank options' },
        { title: 'Credit Cards', description: 'Eligibility and salary requirements' },
        { title: 'Money Transfers', description: 'Sending money internationally' },
        { title: 'Investments', description: 'Savings and investment options' },
      ]
    },
  ]

  const quickLinks = [
    { title: 'DEWA', url: 'https://www.dewa.gov.ae', description: 'Electricity & Water' },
    { title: 'RTA', url: 'https://www.rta.ae', description: 'Transport Authority' },
    { title: 'DHA', url: 'https://www.dha.gov.ae', description: 'Health Authority' },
    { title: 'GDRFA', url: 'https://gdrfad.gov.ae', description: 'Residency & Foreign Affairs' },
    { title: 'Dubai Courts', url: 'https://www.dc.gov.ae', description: 'Legal Services' },
    { title: 'KHDA', url: 'https://www.khda.gov.ae', description: 'Education Authority' },
  ]

  const expatStats = [
    { label: 'Expat Population', value: '85%', trend: '+2%' },
    { label: 'Average Rent', value: 'AED 120k/yr', trend: '+5%' },
    { label: 'Quality of Life', value: '#1 in ME', trend: 'Stable' },
    { label: 'Safety Index', value: '84.5/100', trend: '+1.2' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Home className="h-3 w-3 mr-1" />
              Expat Guide
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Living in Dubai</h1>
            <p className="text-xl text-white/90 mb-8">
              Your comprehensive guide to making Dubai your home. From visas to schools, 
              we've got everything covered for residents and newcomers.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold mb-1">{stat.value}</p>
                    <p className="text-sm text-white/80">{stat.label}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">{stat.trend}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Government Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-sm">{link.title}</p>
                <p className="text-xs text-gray-500">{link.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="essentials">Essentials</TabsTrigger>
            <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="essentials" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guideSections.map((section) => (
                <Card key={section.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center mb-4`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-gray-600">{item.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      Learn More <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lifestyle" className="mt-8">
            {/* Neighborhoods Guide */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Popular Neighborhoods</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">Dubai Marina</h3>
                    <p className="text-gray-600 mb-4">
                      Waterfront living with restaurants, beaches, and nightlife
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Rent (1BR)</span>
                        <span className="font-semibold">AED 90-120k</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Lifestyle</span>
                        <span className="font-semibold">Beach & Urban</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Best For</span>
                        <span className="font-semibold">Young Professionals</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">Downtown Dubai</h3>
                    <p className="text-gray-600 mb-4">
                      City center with Burj Khalifa, Dubai Mall, and business hub
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Rent (1BR)</span>
                        <span className="font-semibold">AED 100-150k</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Lifestyle</span>
                        <span className="font-semibold">Urban Luxury</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Best For</span>
                        <span className="font-semibold">Families & Executives</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cost of Living */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Monthly Cost Breakdown</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-blue-600" />
                        <span>Rent (1BR Apartment)</span>
                      </div>
                      <span className="font-semibold">AED 5,000 - 10,000</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <span>Utilities (DEWA)</span>
                      </div>
                      <span className="font-semibold">AED 200 - 500</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-green-600" />
                        <span>Transportation</span>
                      </div>
                      <span className="font-semibold">AED 300 - 1,500</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span>Groceries</span>
                      </div>
                      <span className="font-semibold">AED 1,000 - 2,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="community" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Expat Communities */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Expat Communities</h2>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">British Expats Dubai</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Largest Western expat community with schools, pubs, and events
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">50k+ Members</Badge>
                        <Badge variant="secondary">Very Active</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Indian Community Dubai</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Vibrant community with cultural events, temples, and businesses
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">500k+ Members</Badge>
                        <Badge variant="secondary">Cultural Events</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Emergency Contacts</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-semibold">Emergency</p>
                            <p className="text-sm text-gray-600">Police, Fire, Ambulance</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-red-600">999</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-semibold">Police (Non-Emergency)</p>
                            <p className="text-sm text-gray-600">Dubai Police</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">901</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-semibold">Ambulance</p>
                            <p className="text-sm text-gray-600">Medical Emergency</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-green-600">998</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export { LivingPage }