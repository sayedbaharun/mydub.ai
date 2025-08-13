import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Slider } from '@/shared/components/ui/slider'
import {
  Home,
  Building,
  MapPin,
  Bed,
  Bath,
  Square,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Heart,
  Share2,
  Calculator,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Property {
  id: string
  title: string
  location: string
  price: number
  pricePerSqFt: number
  type: 'apartment' | 'villa' | 'townhouse' | 'penthouse'
  bedrooms: number
  bathrooms: number
  size: number
  image: string
  featured?: boolean
  new?: boolean
  priceChange?: number
}

interface MarketData {
  area: string
  avgPrice: number
  priceChange: number
  inventory: number
  daysOnMarket: number
}

export default function RealEstatePage() {
  const { t } = useTranslation('common')
  const [propertyType, setPropertyType] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 10000000])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState('all')

  // Mock property data
  const properties: Property[] = [
    {
      id: '1',
      title: 'Luxury Marina Apartment',
      location: 'Dubai Marina',
      price: 2500000,
      pricePerSqFt: 1800,
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 3,
      size: 1389,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
      featured: true,
      priceChange: 5.2,
    },
    {
      id: '2',
      title: 'Downtown Penthouse',
      location: 'Downtown Dubai',
      price: 8500000,
      pricePerSqFt: 3200,
      type: 'penthouse',
      bedrooms: 4,
      bathrooms: 5,
      size: 2656,
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
      new: true,
      priceChange: -2.1,
    },
    {
      id: '3',
      title: 'Family Villa',
      location: 'Arabian Ranches',
      price: 4200000,
      pricePerSqFt: 900,
      type: 'villa',
      bedrooms: 5,
      bathrooms: 6,
      size: 4667,
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
      priceChange: 8.5,
    },
  ]

  const marketData: MarketData[] = [
    { area: 'Dubai Marina', avgPrice: 1850, priceChange: 5.2, inventory: 342, daysOnMarket: 45 },
    { area: 'Downtown Dubai', avgPrice: 2400, priceChange: -2.1, inventory: 128, daysOnMarket: 38 },
    { area: 'Business Bay', avgPrice: 1650, priceChange: 12.3, inventory: 256, daysOnMarket: 52 },
    { area: 'JBR', avgPrice: 2100, priceChange: 3.8, inventory: 189, daysOnMarket: 41 },
  ]

  const marketStats = [
    { label: 'Avg. Price/sqft', value: 'AED 1,850', change: '+6.2%', positive: true },
    { label: 'Total Sales', value: '12,450', change: '+18.5%', positive: true },
    { label: 'New Listings', value: '3,280', change: '-5.2%', positive: false },
    { label: 'Days on Market', value: '42', change: '-8 days', positive: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 to-slate-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Building className="h-3 w-3 mr-1" />
              Real Estate
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Dubai Property Market</h1>
            <p className="text-xl text-white/90 mb-8">
              Discover your dream property in Dubai. From luxury apartments to family villas, 
              explore the latest listings and market insights.
            </p>
            
            {/* Market Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {marketStats.map((stat, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold mb-1">{stat.value}</p>
                    <p className="text-sm text-white/80">{stat.label}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.positive ? (
                        <ArrowUpRight className="h-3 w-3 text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`text-xs ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search by location, property type, or keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="marina">Dubai Marina</SelectItem>
                  <SelectItem value="downtown">Downtown Dubai</SelectItem>
                  <SelectItem value="jbr">JBR</SelectItem>
                  <SelectItem value="business-bay">Business Bay</SelectItem>
                  <SelectItem value="palm">Palm Jumeirah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium mb-2 block">
                  Price Range: AED {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={10000000}
                  step={100000}
                  className="mt-2"
                />
              </div>
              
              <Button className="ml-4">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="listings" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="market">Market Insights</TabsTrigger>
            <TabsTrigger value="guides">Buyer's Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {/* Featured Properties */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Featured Properties</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={property.image}
                        alt={property.title}
                        className="w-full h-64 object-cover"
                      />
                      {property.featured && (
                        <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">
                          Featured
                        </Badge>
                      )}
                      {property.new && (
                        <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                          New
                        </Badge>
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/80">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/80">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                      <p className="text-gray-600 flex items-center gap-1 mb-3">
                        <MapPin className="h-4 w-4" />
                        {property.location}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-2xl font-bold">AED {property.price.toLocaleString()}</p>
                        <div className="flex items-center gap-1">
                          {property.priceChange && property.priceChange > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${property.priceChange && property.priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {property.priceChange}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {property.bedrooms} Beds
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {property.bathrooms} Baths
                        </span>
                        <span className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          {property.size} sqft
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        AED {property.pricePerSqFt}/sqft
                      </p>
                      
                      <Button className="w-full">View Details</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* More Properties CTA */}
            <div className="text-center">
              <Button size="lg" variant="outline">
                View All Properties
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="market">
            {/* Market Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Performance by Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {marketData.map((area) => (
                        <div key={area.area} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{area.area}</h4>
                            <div className="flex items-center gap-1">
                              {area.priceChange > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={`text-sm font-semibold ${area.priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {area.priceChange}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Avg Price/sqft</p>
                              <p className="font-semibold">AED {area.avgPrice}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Inventory</p>
                              <p className="font-semibold">{area.inventory} units</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Avg Days</p>
                              <p className="font-semibold">{area.daysOnMarket} days</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Calculator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate ROI
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Q1 2024 Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="guides">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Buying Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="font-semibold text-blue-600">1.</span>
                      <div>
                        <p className="font-medium">Property Search</p>
                        <p className="text-sm text-gray-600">Find your ideal property with our search tools</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-blue-600">2.</span>
                      <div>
                        <p className="font-medium">Make an Offer</p>
                        <p className="text-sm text-gray-600">Submit offer through registered broker</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-blue-600">3.</span>
                      <div>
                        <p className="font-medium">Sign MOU</p>
                        <p className="text-sm text-gray-600">Memorandum of Understanding with 10% deposit</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-blue-600">4.</span>
                      <div>
                        <p className="font-medium">Transfer at DLD</p>
                        <p className="text-sm text-gray-600">Complete transfer at Dubai Land Department</p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Costs & Fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">DLD Transfer Fee</span>
                      <span className="font-semibold">4% + AED 580</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Commission</span>
                      <span className="font-semibold">2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mortgage Registration</span>
                      <span className="font-semibold">0.25% + AED 290</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Valuation</span>
                      <span className="font-semibold">AED 2,500 - 3,500</span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total (estimate)</span>
                        <span className="font-semibold">~7% of property value</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export { RealEstatePage }