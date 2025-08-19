import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Crown, 
  Car, 
  Home, 
  Plane, 
  ShoppingBag,
  Gem,
  Wine,
  Ship,
  Building2,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

interface LuxuryItem {
  id: string;
  title: string;
  category: string;
  price?: string;
  location: string;
  image: string;
  description: string;
  featured?: boolean;
  exclusive?: boolean;
}

const luxuryCategories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'realestate', label: 'Real Estate', icon: Building2 },
  { id: 'cars', label: 'Supercars', icon: Car },
  { id: 'yachts', label: 'Yachts', icon: Ship },
  { id: 'fashion', label: 'Fashion', icon: ShoppingBag },
  { id: 'jewelry', label: 'Jewelry', icon: Gem },
  { id: 'dining', label: 'Fine Dining', icon: Wine },
  { id: 'travel', label: 'Private Jets', icon: Plane }
];

const luxuryItems: LuxuryItem[] = [
  {
    id: '1',
    title: 'Penthouse at Burj Khalifa Residences',
    category: 'realestate',
    price: 'AED 85,000,000',
    location: 'Downtown Dubai',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
    description: 'Ultra-luxury penthouse with panoramic views of Dubai skyline',
    featured: true,
    exclusive: true
  },
  {
    id: '2',
    title: 'Bugatti Chiron Super Sport',
    category: 'cars',
    price: 'AED 15,000,000',
    location: 'Dubai Marina',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b',
    description: 'Limited edition hypercar, one of only 30 worldwide',
    featured: true
  },
  {
    id: '3',
    title: '120ft Luxury Yacht - Pearl of Dubai',
    category: 'yachts',
    price: 'AED 45,000,000',
    location: 'Dubai Harbour',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a',
    description: 'Custom-built superyacht with 5 suites and helipad',
    exclusive: true
  },
  {
    id: '4',
    title: 'Private Island Villa - The World Islands',
    category: 'realestate',
    price: 'AED 120,000,000',
    location: 'The World Islands',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6',
    description: 'Exclusive private island with luxury villa and beach club',
    featured: true,
    exclusive: true
  },
  {
    id: '5',
    title: 'Haute Couture Collection - Fashion Week',
    category: 'fashion',
    price: 'Starting from AED 50,000',
    location: 'Dubai Mall Fashion Avenue',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e',
    description: 'Exclusive designer collection from Paris Fashion Week'
  },
  {
    id: '6',
    title: 'Pink Diamond Collection',
    category: 'jewelry',
    price: 'AED 25,000,000',
    location: 'Gold Souk Extension',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    description: 'Rare pink diamond necklace with 150 carats',
    exclusive: true
  },
  {
    id: '7',
    title: 'Michelin Star Dining Experience',
    category: 'dining',
    price: 'AED 5,000 per person',
    location: 'Burj Al Arab',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
    description: 'Exclusive 12-course tasting menu by celebrity chef'
  },
  {
    id: '8',
    title: 'Gulfstream G650ER Private Jet',
    category: 'travel',
    price: 'AED 250,000,000',
    location: 'Al Maktoum International',
    image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    description: 'Ultra-long-range business jet with custom interior',
    featured: true
  }
];

export default function LuxuryLifePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredItems, setFilteredItems] = useState<LuxuryItem[]>(luxuryItems);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredItems(luxuryItems);
    } else {
      setFilteredItems(luxuryItems.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory]);

  const featuredItems = luxuryItems.filter(item => item.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c')] bg-cover bg-center opacity-40"></div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-gold-500 text-black">
              <Sparkles className="w-3 h-3 mr-1" />
              Exclusive Collection
            </Badge>
            <h1 className="text-5xl md:text-7xl font-light mb-6">
              Luxury Life
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Experience the pinnacle of luxury in Dubai - from exclusive properties to supercars, 
              private jets, and haute couture.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-gold-500 text-black hover:bg-gold-600">
                <Crown className="w-5 h-5 mr-2" />
                VIP Access
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                Private Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-light">Featured Exclusives</h2>
          <Badge variant="outline">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending Now
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-64">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {item.exclusive && (
                  <Badge className="absolute top-4 right-4 bg-black text-gold-500">
                    EXCLUSIVE
                  </Badge>
                )}
              </div>
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-2">
                  {luxuryCategories.find(c => c.id === item.category)?.label}
                </Badge>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-light text-gold-600">{item.price}</p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {item.location}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-light mb-8">Browse by Category</h2>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full mb-8">
            {luxuryCategories.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex flex-col items-center gap-1 py-3"
              >
                <category.icon className="w-4 h-4" />
                <span className="text-xs">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.exclusive && (
                      <Badge className="absolute top-2 right-2 bg-black text-gold-500 text-xs">
                        EXCLUSIVE
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-light text-gold-600">{item.price}</p>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Luxury Services */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light mb-12 text-center">Exclusive Services</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-gold-600" />
                </div>
                <CardTitle>VIP Concierge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  24/7 luxury concierge service for exclusive experiences and reservations
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-gold-600" />
                </div>
                <CardTitle>Private Aviation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access to private jets and helicopters for seamless travel
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-gold-600" />
                </div>
                <CardTitle>Property Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Expert guidance for luxury real estate investments in prime locations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            Join the Elite Circle
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get exclusive access to Dubai's most luxurious experiences, private events, and investment opportunities.
          </p>
          <Button size="lg" className="bg-gold-500 text-black hover:bg-gold-600">
            Request Membership
          </Button>
        </div>
      </section>
    </div>
  );
}