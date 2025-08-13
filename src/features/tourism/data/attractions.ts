import { Attraction } from '../types'

export const DUBAI_ATTRACTIONS: Attraction[] = [
  {
    id: 'burj-khalifa',
    name: 'Burj Khalifa',
    nameAr: 'برج خليفة',
    description: 'The world\'s tallest building offering breathtaking views of Dubai from its observation decks on the 124th, 125th, and 148th floors.',
    descriptionAr: 'أطول مبنى في العالم يوفر مناظر خلابة لدبي من أسطح المراقبة في الطوابق 124 و125 و148.',
    category: 'landmark',
    location: {
      lat: 25.1972,
      lng: 55.2744,
      address: '1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
      addressAr: '1 شارع الشيخ محمد بن راشد، وسط مدينة دبي',
      area: 'Downtown Dubai',
      areaAr: 'وسط مدينة دبي'
    },
    images: ['/images/burj-khalifa-1.jpg', '/images/burj-khalifa-2.jpg'],
    rating: 4.7,
    reviewCount: 125000,
    priceLevel: 4,
    openingHours: {
      monday: { open: '08:30', close: '23:00' },
      tuesday: { open: '08:30', close: '23:00' },
      wednesday: { open: '08:30', close: '23:00' },
      thursday: { open: '08:30', close: '23:00' },
      friday: { open: '08:30', close: '23:00' },
      saturday: { open: '08:30', close: '23:00' },
      sunday: { open: '08:30', close: '23:00' }
    },
    contact: {
      phone: '+971 4 888 8888',
      website: 'https://www.burjkhalifa.ae',
      email: 'info@burjkhalifa.ae'
    },
    features: ['Observation Deck', 'Restaurant', 'Gift Shop', 'Wheelchair Accessible'],
    bookingUrl: 'https://tickets.atthetop.ae',
    nearbyMetro: 'Burj Khalifa/Dubai Mall',
    tags: ['iconic', 'views', 'architecture', 'must-visit']
  },
  {
    id: 'dubai-mall',
    name: 'The Dubai Mall',
    nameAr: 'دبي مول',
    description: 'One of the world\'s largest shopping malls featuring over 1,200 retail outlets, Dubai Aquarium, ice rink, and countless dining options.',
    descriptionAr: 'واحد من أكبر مراكز التسوق في العالم يضم أكثر من 1200 متجر، وحوض دبي المائي، وحلبة تزلج، وخيارات طعام لا تحصى.',
    category: 'shopping',
    location: {
      lat: 25.1972,
      lng: 55.2789,
      address: 'Financial Center Road, Downtown Dubai',
      addressAr: 'طريق المركز المالي، وسط مدينة دبي',
      area: 'Downtown Dubai',
      areaAr: 'وسط مدينة دبي'
    },
    images: ['/images/dubai-mall-1.jpg', '/images/dubai-mall-2.jpg'],
    rating: 4.5,
    reviewCount: 98000,
    priceLevel: 1,
    openingHours: {
      monday: { open: '10:00', close: '23:00' },
      tuesday: { open: '10:00', close: '23:00' },
      wednesday: { open: '10:00', close: '23:00' },
      thursday: { open: '10:00', close: '00:00' },
      friday: { open: '10:00', close: '00:00' },
      saturday: { open: '10:00', close: '00:00' },
      sunday: { open: '10:00', close: '23:00' }
    },
    contact: {
      phone: '+971 800 38224 6255',
      website: 'https://thedubaimall.com'
    },
    features: ['Shopping', 'Dining', 'Entertainment', 'Parking', 'WiFi', 'Prayer Room'],
    nearbyMetro: 'Burj Khalifa/Dubai Mall',
    tags: ['shopping', 'entertainment', 'family-friendly', 'dining']
  },
  {
    id: 'dubai-fountain',
    name: 'Dubai Fountain',
    nameAr: 'نافورة دبي',
    description: 'The world\'s largest choreographed fountain system set on the Burj Khalifa Lake, performing daily shows with music and lights.',
    descriptionAr: 'أكبر نظام نافورة راقصة في العالم على بحيرة برج خليفة، تقدم عروضاً يومية مع الموسيقى والأضواء.',
    category: 'entertainment',
    location: {
      lat: 25.1959,
      lng: 55.2743,
      address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
      addressAr: 'شارع الشيخ محمد بن راشد، وسط مدينة دبي',
      area: 'Downtown Dubai',
      areaAr: 'وسط مدينة دبي'
    },
    images: ['/images/dubai-fountain-1.jpg', '/images/dubai-fountain-2.jpg'],
    rating: 4.8,
    reviewCount: 75000,
    priceLevel: 1,
    openingHours: {
      monday: { open: '18:00', close: '23:00' },
      tuesday: { open: '18:00', close: '23:00' },
      wednesday: { open: '18:00', close: '23:00' },
      thursday: { open: '18:00', close: '23:00' },
      friday: { open: '18:00', close: '23:30' },
      saturday: { open: '18:00', close: '23:30' },
      sunday: { open: '18:00', close: '23:00' }
    },
    features: ['Free Entry', 'Outdoor', 'Photography'],
    nearbyMetro: 'Burj Khalifa/Dubai Mall',
    tags: ['free', 'romantic', 'photography', 'must-see']
  },
  {
    id: 'palm-jumeirah',
    name: 'Palm Jumeirah',
    nameAr: 'نخلة جميرا',
    description: 'An artificial archipelago in the shape of a palm tree, home to luxury hotels, restaurants, and beaches.',
    descriptionAr: 'أرخبيل اصطناعي على شكل نخلة، موطن للفنادق الفاخرة والمطاعم والشواطئ.',
    category: 'landmark',
    location: {
      lat: 25.1124,
      lng: 55.1390,
      address: 'Palm Jumeirah, Dubai',
      addressAr: 'نخلة جميرا، دبي',
      area: 'Palm Jumeirah',
      areaAr: 'نخلة جميرا'
    },
    images: ['/images/palm-jumeirah-1.jpg', '/images/palm-jumeirah-2.jpg'],
    rating: 4.6,
    reviewCount: 45000,
    priceLevel: 3,
    features: ['Beaches', 'Hotels', 'Dining', 'Water Sports'],
    nearbyMetro: 'Nakheel',
    tags: ['beach', 'luxury', 'iconic', 'man-made']
  },
  {
    id: 'dubai-marina',
    name: 'Dubai Marina',
    nameAr: 'مرسى دبي',
    description: 'A stunning waterfront development with a 3km promenade, luxury yachts, restaurants, and vibrant nightlife.',
    descriptionAr: 'تطوير مذهل على الواجهة البحرية مع ممشى بطول 3 كم، واليخوت الفاخرة، والمطاعم، والحياة الليلية النابضة بالحياة.',
    category: 'entertainment',
    location: {
      lat: 25.0805,
      lng: 55.1403,
      address: 'Dubai Marina, Dubai',
      addressAr: 'مرسى دبي، دبي',
      area: 'Dubai Marina',
      areaAr: 'مرسى دبي'
    },
    images: ['/images/dubai-marina-1.jpg', '/images/dubai-marina-2.jpg'],
    rating: 4.5,
    reviewCount: 62000,
    priceLevel: 2,
    features: ['Waterfront', 'Dining', 'Shopping', 'Nightlife', 'Marina Walk'],
    nearbyMetro: 'Dubai Marina',
    tags: ['waterfront', 'dining', 'nightlife', 'walking']
  },
  {
    id: 'dubai-museum',
    name: 'Dubai Museum',
    nameAr: 'متحف دبي',
    description: 'Located in the Al Fahidi Fort, Dubai\'s oldest building, showcasing the emirate\'s history and cultural heritage.',
    descriptionAr: 'يقع في حصن الفهيدي، أقدم مبنى في دبي، يعرض تاريخ الإمارة وتراثها الثقافي.',
    category: 'culture',
    location: {
      lat: 25.2632,
      lng: 55.2972,
      address: 'Al Fahidi Fort, Bur Dubai',
      addressAr: 'حصن الفهيدي، بر دبي',
      area: 'Bur Dubai',
      areaAr: 'بر دبي'
    },
    images: ['/images/dubai-museum-1.jpg', '/images/dubai-museum-2.jpg'],
    rating: 4.2,
    reviewCount: 28000,
    priceLevel: 1,
    openingHours: {
      monday: { open: '08:30', close: '20:30' },
      tuesday: { open: '08:30', close: '20:30' },
      wednesday: { open: '08:30', close: '20:30' },
      thursday: { open: '08:30', close: '20:30' },
      friday: { open: '14:30', close: '20:30' },
      saturday: { open: '08:30', close: '20:30' },
      sunday: { open: '08:30', close: '20:30' }
    },
    contact: {
      phone: '+971 4 353 1862'
    },
    features: ['Historical', 'Educational', 'Air Conditioned', 'Gift Shop'],
    nearbyMetro: 'Al Fahidi',
    tags: ['history', 'culture', 'educational', 'affordable']
  },
  {
    id: 'jumeirah-beach',
    name: 'Jumeirah Beach',
    nameAr: 'شاطئ جميرا',
    description: 'A pristine white sand beach stretching along the Arabian Gulf, perfect for swimming, sunbathing, and water sports.',
    descriptionAr: 'شاطئ رملي أبيض نقي يمتد على طول الخليج العربي، مثالي للسباحة والتشمس والرياضات المائية.',
    category: 'beach',
    location: {
      lat: 25.2048,
      lng: 55.2708,
      address: 'Jumeirah Beach Road, Jumeirah',
      addressAr: 'شارع شاطئ جميرا، جميرا',
      area: 'Jumeirah',
      areaAr: 'جميرا'
    },
    images: ['/images/jumeirah-beach-1.jpg', '/images/jumeirah-beach-2.jpg'],
    rating: 4.4,
    reviewCount: 35000,
    priceLevel: 1,
    features: ['Free Entry', 'Swimming', 'Sunbathing', 'Water Sports', 'Cafes'],
    tags: ['beach', 'free', 'family-friendly', 'swimming']
  },
  {
    id: 'gold-souk',
    name: 'Gold Souk',
    nameAr: 'سوق الذهب',
    description: 'Traditional market in Deira featuring hundreds of retailers trading gold, silver, and precious stones.',
    descriptionAr: 'سوق تقليدي في ديرة يضم مئات تجار التجزئة الذين يتاجرون بالذهب والفضة والأحجار الكريمة.',
    category: 'shopping',
    location: {
      lat: 25.2716,
      lng: 55.2969,
      address: 'Sikkat Al Khail St, Deira',
      addressAr: 'شارع سكة الخيل، ديرة',
      area: 'Deira',
      areaAr: 'ديرة'
    },
    images: ['/images/gold-souk-1.jpg', '/images/gold-souk-2.jpg'],
    rating: 4.3,
    reviewCount: 42000,
    priceLevel: 2,
    openingHours: {
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '16:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '10:00', close: '22:00' }
    },
    features: ['Traditional Market', 'Bargaining', 'Gold Jewelry', 'Tax Free'],
    nearbyMetro: 'Al Ras',
    tags: ['shopping', 'traditional', 'gold', 'souvenirs']
  }
]

export const getAttractionById = (id: string): Attraction | undefined => {
  return DUBAI_ATTRACTIONS.find(attraction => attraction.id === id)
}

export const getAttractionsByCategory = (category: string): Attraction[] => {
  return DUBAI_ATTRACTIONS.filter(attraction => attraction.category === category)
}

export const getAttractionsByArea = (area: string): Attraction[] => {
  return DUBAI_ATTRACTIONS.filter(attraction => attraction.location.area === area)
}

export const getTopRatedAttractions = (limit = 5): Attraction[] => {
  return [...DUBAI_ATTRACTIONS]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
}