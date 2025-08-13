#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

// Make sure to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample news sources
const newsSources = [
  {
    name: 'Dubai Media Office',
    name_ar: 'مكتب دبي الإعلامي',
    logo: null,
    website: 'https://www.mediaoffice.ae',
    is_active: true,
    credibility_score: 10
  },
  {
    name: 'Gulf News',
    name_ar: 'أخبار الخليج',
    logo: null,
    website: 'https://gulfnews.com',
    is_active: true,
    credibility_score: 9
  },
  {
    name: 'The National',
    name_ar: 'الوطني',
    logo: null,
    website: 'https://www.thenationalnews.com',
    is_active: true,
    credibility_score: 9
  },
  {
    name: 'Emirates Today',
    name_ar: 'الإمارات اليوم',
    logo: null,
    website: 'https://www.emaratalyoum.com',
    is_active: true,
    credibility_score: 8
  },
  {
    name: 'Dubai Tourism',
    name_ar: 'دبي للسياحة',
    logo: null,
    website: 'https://www.visitdubai.com',
    is_active: true,
    credibility_score: 10
  }
]

// Sample news articles
const newsArticles = [
  {
    title: 'Dubai Metro Green Line Extension Opens Three New Stations',
    title_ar: 'امتداد الخط الأخضر لمترو دبي يفتتح ثلاث محطات جديدة',
    summary: 'The Dubai Metro Green Line extension project has successfully opened three new stations, significantly improving connectivity across the emirate and providing residents with better access to key commercial and residential areas.',
    summary_ar: 'افتتح مشروع امتداد الخط الأخضر لمترو دبي بنجاح ثلاث محطات جديدة، مما يحسن بشكل كبير من الاتصال عبر الإمارة ويوفر للمقيمين وصولاً أفضل إلى المناطق التجارية والسكنية الرئيسية.',
    content: `The Dubai Roads and Transport Authority (RTA) has officially opened three new stations on the Green Line extension, marking a significant milestone in the emirate's public transportation infrastructure development.

The new stations - Al Furjan, Discovery Gardens, and Al Furjan West - are now fully operational and serving thousands of commuters daily. This expansion adds 4.5 kilometers to the existing Green Line, bringing the total metro network to over 90 kilometers.

"This expansion represents our commitment to providing world-class public transportation that connects communities and supports Dubai's vision of becoming the world's most connected city," said Mattar Al Tayer, Director-General and Chairman of Dubai's Roads and Transport Authority.

The project, which took three years to complete, includes state-of-the-art facilities with air-conditioned platforms, digital displays, and accessibility features for people with disabilities. Each station is designed to handle up to 15,000 passengers per hour during peak times.

The extension is expected to reduce traffic congestion in the area by 20% and cut travel time between Al Furjan and Dubai Marina by half. Environmental benefits include reducing carbon emissions by approximately 30,000 tons annually.

Future plans include extending the Green Line further to serve emerging communities in Dubai South and Al Maktoum International Airport, as part of Dubai's 2040 Urban Master Plan.`,
    content_ar: `افتتحت هيئة الطرق والمواصلات في دبي رسمياً ثلاث محطات جديدة في امتداد الخط الأخضر، مما يمثل إنجازاً كبيراً في تطوير البنية التحتية لوسائل النقل العام في الإمارة.

المحطات الجديدة - الفرجان، حدائق الاكتشاف، والفرجان الغربية - تعمل الآن بكامل طاقتها وتخدم آلاف المسافرين يومياً. يضيف هذا التوسع 4.5 كيلومتر إلى الخط الأخضر الحالي، مما يرفع إجمالي شبكة المترو إلى أكثر من 90 كيلومتراً.

وقال مطر الطاير، المدير العام ورئيس مجلس إدارة هيئة الطرق والمواصلات في دبي: "يمثل هذا التوسع التزامنا بتوفير وسائل نقل عام عالمية المستوى تربط المجتمعات وتدعم رؤية دبي لتصبح المدينة الأكثر اتصالاً في العالم."

المشروع، الذي استغرق ثلاث سنوات لإكماله، يشمل مرافق حديثة مع منصات مكيفة وشاشات رقمية وميزات إمكانية الوصول للأشخاص ذوي الإعاقة. كل محطة مصممة للتعامل مع ما يصل إلى 15,000 راكب في الساعة خلال أوقات الذروة.`,
    category: 'local',
    author: 'Dubai Media Office',
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/metro-expansion',
    image_url: 'https://picsum.photos/800/600?random=101',
    tags: ['metro', 'transport', 'infrastructure', 'Green Line'],
    is_breaking: false,
    is_featured: true,
    sentiment: 'positive',
    read_time: 4
  },
  {
    title: 'Dubai Shopping Festival 2024 Records Highest Ever Tourist Footfall',
    title_ar: 'مهرجان دبي للتسوق 2024 يسجل أعلى عدد زوار سياحيين على الإطلاق',
    summary: 'The Dubai Shopping Festival 2024 concluded with record-breaking tourist arrivals, generating over AED 8 billion in retail sales and establishing new benchmarks for the emirate\'s tourism sector.',
    summary_ar: 'اختتم مهرجان دبي للتسوق 2024 بوصول سياحي قياسي، محققاً أكثر من 8 مليارات درهم في مبيعات التجزئة ووضع معايير جديدة لقطاع السياحة في الإمارة.',
    content: `The Dubai Shopping Festival 2024 has concluded with unprecedented success, recording the highest tourist footfall in the event's 29-year history. Over 4.2 million visitors from around the world participated in the 32-day festival, generating more than AED 8 billion in retail sales.

Dubai Tourism reported that hotel occupancy rates reached 94% during the festival period, with visitors from India, Saudi Arabia, Russia, and the UK leading international arrivals. The festival attracted families and tourists with over 3,000 brands participating across 1,200 outlets.

"The exceptional success of DSF 2024 reaffirms Dubai's position as the world's leading shopping and entertainment destination," said Issam Kazim, CEO of Dubai Corporation for Tourism and Commerce Marketing.

Key highlights included the Global Village pavilions, Dubai Miracle Garden attractions, and the spectacular New Year's Eve fireworks at Burj Khalifa. The festival featured daily lucky draws with prizes worth AED 50 million, including luxury cars and gold.

Digital integration played a crucial role, with the DSF mobile app recording 2.3 million downloads and social media campaigns reaching over 100 million people globally. E-commerce platforms reported a 40% increase in sales during the festival period.

The success of DSF 2024 positions Dubai strongly for its goal of attracting 25 million visitors annually by 2025, as outlined in the Dubai Tourism Strategy 2025.`,
    content_ar: `اختتم مهرجان دبي للتسوق 2024 بنجاح غير مسبوق، مسجلاً أعلى عدد زوار سياحيين في تاريخ الحدث الذي يمتد لـ 29 عاماً. شارك أكثر من 4.2 مليون زائر من حول العالم في المهرجان الذي استمر 32 يوماً، محققاً أكثر من 8 مليارات درهم في مبيعات التجزئة.

أفادت دبي للسياحة أن معدلات إشغال الفنادق وصلت إلى 94% خلال فترة المهرجان، مع تصدر الزوار من الهند والمملكة العربية السعودية وروسيا والمملكة المتحدة للوافدين الدوليين. جذب المهرجان العائلات والسياح بمشاركة أكثر من 3,000 علامة تجارية عبر 1,200 منفذ.

وقال عصام كاظم، الرئيس التنفيذي لمؤسسة دبي للتسويق السياحي والتجاري: "النجاح الاستثنائي لمهرجان دبي للتسوق 2024 يؤكد مكانة دبي كوجهة التسوق والترفيه الرائدة عالمياً."`,
    category: 'tourism',
    author: 'Dubai Tourism Communications',
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/dsf-success',
    image_url: 'https://picsum.photos/800/600?random=102',
    tags: ['shopping', 'festival', 'tourism', 'retail'],
    is_breaking: false,
    is_featured: true,
    sentiment: 'positive',
    read_time: 5
  },
  {
    title: 'Dubai Launches Revolutionary AI-Powered Smart City Initiative',
    title_ar: 'دبي تطلق مبادرة المدينة الذكية الثورية المدعومة بالذكاء الاصطناعي',
    summary: 'Dubai has unveiled a comprehensive AI-powered smart city initiative that will transform urban services, traffic management, and citizen experiences through cutting-edge technology integration.',
    summary_ar: 'كشفت دبي عن مبادرة مدينة ذكية شاملة مدعومة بالذكاء الاصطناعي ستغير خدمات المدينة وإدارة المرور وتجارب المواطنين من خلال تكامل التقنيات المتطورة.',
    content: `Dubai has launched its most ambitious smart city initiative to date, leveraging artificial intelligence and Internet of Things (IoT) technologies to create a fully integrated urban ecosystem. The Dubai Smart City 2025 program will transform how residents interact with city services and infrastructure.

The initiative, announced by Sheikh Hamdan bin Mohammed bin Rashid Al Maktoum, Crown Prince of Dubai, encompasses smart traffic management, predictive maintenance for utilities, AI-powered emergency response, and personalized citizen services through a unified digital platform.

"We are building the world's most intelligent city, where technology serves humanity and enhances quality of life for everyone who calls Dubai home," said Sheikh Hamdan during the launch ceremony at the Museum of the Future.

Key components include:
- AI traffic lights that adapt to real-time conditions
- Smart waste management systems
- Predictive policing algorithms
- Automated permit and licensing processes
- Energy-efficient building management systems

The first phase will deploy 50,000 IoT sensors across the city, collecting data on air quality, noise levels, traffic patterns, and energy consumption. This data will feed into a central AI hub that optimizes city operations in real-time.

Citizens will access all services through the DubaiNow super app, which will use AI to predict needs and provide proactive service recommendations. The system aims to reduce service delivery times by 80% and improve citizen satisfaction scores to above 95%.

The project represents a AED 2 billion investment over three years and is expected to generate cost savings of AED 1.5 billion annually through improved efficiency and reduced operational costs.`,
    category: 'technology',
    author: 'Smart Dubai Office',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/smart-city-ai',
    image_url: 'https://picsum.photos/800/600?random=103',
    tags: ['AI', 'smart city', 'technology', 'IoT'],
    is_breaking: true,
    is_featured: true,
    sentiment: 'positive',
    read_time: 6
  },
  {
    title: 'New Cultural District Opens in Dubai Creek Harbour',
    title_ar: 'افتتاح منطقة ثقافية جديدة في خور دبي',
    summary: 'Dubai Creek Harbour welcomes a new cultural district featuring art galleries, performance spaces, and heritage museums, enriching the emirate\'s cultural landscape.',
    summary_ar: 'يرحب خور دبي بمنطقة ثقافية جديدة تضم معارض فنية ومساحات أداء ومتاحف تراثية، مما يثري المشهد الثقافي في الإمارة.',
    content: `Dubai Creek Harbour has unveiled its new Cultural District, a vibrant hub that celebrates both traditional Emirati heritage and contemporary international arts. The district spans 15,000 square meters and features state-of-the-art facilities designed to nurture creativity and cultural exchange.

The opening ceremony was attended by Sheikha Latifa bint Mohammed bin Rashid Al Maktoum, Chairperson of the Dubai Culture and Arts Authority, who emphasized the district's role in Dubai's cultural transformation.

"This cultural district represents our commitment to preserving our heritage while embracing innovation in arts and culture," said Sheikha Latifa. "It will serve as a bridge between our rich past and our dynamic future."

The district includes:
- The Emirati Heritage Museum showcasing 4,000 years of local history
- Contemporary Art Gallery featuring rotating international exhibitions
- 500-seat amphitheater for performances and cultural events
- Traditional craft workshops and artisan studios
- Cultural education center with programs for all ages

The Heritage Museum houses rare artifacts, ancient manuscripts, and interactive displays that tell the story of Dubai's evolution from a fishing village to a global metropolis. The Contemporary Art Gallery has already secured partnerships with the Louvre, Guggenheim, and Tate Modern for upcoming exhibitions.

Local artists will benefit from subsidized studio spaces and mentorship programs. The district aims to support 200 creative professionals within its first year of operation.

The Cultural District is part of Dubai's broader vision to become a global cultural capital, complementing existing attractions like the Dubai Opera, Alserkal Avenue, and the upcoming Dubai Museum of the Future.

Public programs include free weekend concerts, family art workshops, and cultural festivals throughout the year. The district expects to welcome over 1 million visitors annually.`,
    category: 'culture',
    author: 'Dubai Culture Authority',
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/cultural-district',
    image_url: 'https://picsum.photos/800/600?random=104',
    tags: ['culture', 'arts', 'heritage', 'museum'],
    is_breaking: false,
    is_featured: false,
    sentiment: 'positive',
    read_time: 4
  },
  {
    title: 'Dubai Marina Introduces Floating Market Experience',
    title_ar: 'دبي مارينا تقدم تجربة السوق العائم',
    summary: 'A unique floating market has opened in Dubai Marina, offering visitors an authentic Arabian marketplace experience on traditional dhow boats with local crafts and cuisine.',
    summary_ar: 'افتتح سوق عائم فريد في دبي مارينا، يقدم للزوار تجربة سوق عربي أصيل على قوارب الداو التقليدية مع الحرف المحلية والمأكولات.',
    content: `Dubai Marina has introduced an innovative floating market experience that combines traditional Arabian commerce with modern luxury. The Dubai Marina Floating Souk operates on a fleet of restored traditional dhow boats, creating a unique shopping and dining destination on the water.

Located in the heart of Dubai Marina, the floating market features 25 traditional dhows converted into boutique shops, restaurants, and experience centers. Visitors can browse authentic Emirati handicrafts, spices, textiles, and jewelry while enjoying panoramic views of the Marina skyline.

"We wanted to create an authentic Arabian market experience that honors our maritime heritage while offering something completely new to residents and tourists," said Ahmed Al Mansoori, Director of Dubai Marina Development.

The floating souk includes:
- Traditional craft workshops where visitors can learn pottery, weaving, and metalwork
- Spice boats selling exotic herbs and traditional medicines
- Pearl diving experiences with expert guides
- Floating restaurants serving authentic Emirati cuisine
- Traditional coffee houses (qahwa) on restored fishing dhows

Each dhow is equipped with modern amenities while maintaining its traditional aesthetic. Solar panels provide eco-friendly power, and water taxis connect the floating market to Marina Walk every 15 minutes.

The experience begins with a traditional welcome ceremony featuring Arabic coffee and dates. Visitors can participate in hands-on activities like henna painting, falconry demonstrations, and traditional dance performances.

Local artisans benefit from direct sales opportunities and cultural exchange with international visitors. The project supports 150 local craftspeople and small business owners.

The floating market operates daily from sunrise to midnight, with special evening programs featuring traditional music and storytelling under the stars. Advance booking is recommended for workshops and dining experiences.

This innovative concept adds to Dubai Marina's attractions, complementing the Marina Walk, JBR Beach, and luxury shopping at Marina Mall.`,
    category: 'tourism',
    author: 'Dubai Marina Media',
    published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/floating-market',
    image_url: 'https://picsum.photos/800/600?random=105',
    tags: ['marina', 'souk', 'heritage', 'tourism'],
    is_breaking: false,
    is_featured: false,
    sentiment: 'positive',
    read_time: 3
  }
]

// Tourism attractions
const tourismAttractions = [
  {
    name: 'Burj Khalifa',
    name_ar: 'برج خليفة',
    description: 'The world\'s tallest building offering breathtaking views of Dubai from its observation decks on the 124th, 125th, and 148th floors.',
    description_ar: 'أطول مبنى في العالم يوفر مناظر خلابة لدبي من طوابق المراقبة في الطوابق 124 و125 و148.',
    category: 'landmark',
    location_lat: 25.197197,
    location_lng: 55.274376,
    address: 'Downtown Dubai, Dubai',
    address_ar: 'وسط مدينة دبي، دبي',
    opening_hours: {
      'monday': { 'open': '08:30', 'close': '23:00' },
      'tuesday': { 'open': '08:30', 'close': '23:00' },
      'wednesday': { 'open': '08:30', 'close': '23:00' },
      'thursday': { 'open': '08:30', 'close': '23:00' },
      'friday': { 'open': '08:30', 'close': '00:00' },
      'saturday': { 'open': '08:30', 'close': '00:00' },
      'sunday': { 'open': '08:30', 'close': '23:00' }
    },
    admission_fee: 149.00,
    contact_phone: '+971 4 888 8888',
    contact_email: 'info@burjkhalifa.ae',
    website: 'https://www.burjkhalifa.ae',
    images: ['https://picsum.photos/800/600?random=201', 'https://picsum.photos/800/600?random=202'],
    rating: 4.6,
    review_count: 89750,
    is_featured: true,
    is_active: true,
    has_parking: true,
    is_wheelchair_accessible: true,
    has_restaurant: true,
    has_gift_shop: true,
    tags: ['landmark', 'observation deck', 'architecture', 'downtown']
  },
  {
    name: 'Dubai Mall',
    name_ar: 'دبي مول',
    description: 'One of the world\'s largest shopping and entertainment destinations with over 1,200 stores, an aquarium, ice rink, and the famous Dubai Fountain.',
    description_ar: 'واحد من أكبر وجهات التسوق والترفيه في العالم مع أكثر من 1,200 متجر وحوض مائي وحلبة تزلج ونافورة دبي الشهيرة.',
    category: 'shopping',
    location_lat: 25.197229,
    location_lng: 55.279643,
    address: 'Downtown Dubai, Dubai',
    address_ar: 'وسط مدينة دبي، دبي',
    opening_hours: {
      'monday': { 'open': '10:00', 'close': '23:00' },
      'tuesday': { 'open': '10:00', 'close': '23:00' },
      'wednesday': { 'open': '10:00', 'close': '23:00' },
      'thursday': { 'open': '10:00', 'close': '24:00' },
      'friday': { 'open': '10:00', 'close': '24:00' },
      'saturday': { 'open': '10:00', 'close': '24:00' },
      'sunday': { 'open': '10:00', 'close': '23:00' }
    },
    admission_fee: 0.00,
    contact_phone: '+971 4 362 7500',
    contact_email: 'info@thedubaimall.com',
    website: 'https://thedubaimall.com',
    images: ['https://picsum.photos/800/600?random=203', 'https://picsum.photos/800/600?random=204'],
    rating: 4.5,
    review_count: 156890,
    is_featured: true,
    is_active: true,
    has_parking: true,
    is_wheelchair_accessible: true,
    has_restaurant: true,
    has_gift_shop: true,
    tags: ['shopping', 'entertainment', 'aquarium', 'fountain']
  },
  {
    name: 'Palm Jumeirah',
    name_ar: 'نخلة جميرا',
    description: 'An artificial archipelago in the shape of a palm tree, featuring luxury resorts, restaurants, and the iconic Atlantis resort.',
    description_ar: 'أرخبيل اصطناعي على شكل نخلة، يضم منتجعات فاخرة ومطاعم ومنتجع أتلانتس الشهير.',
    category: 'landmark',
    location_lat: 25.1124,
    location_lng: 55.1390,
    address: 'Palm Jumeirah, Dubai',
    address_ar: 'نخلة جميرا، دبي',
    opening_hours: {
      'monday': { 'open': '00:00', 'close': '23:59', 'isOpen24Hours': true },
      'tuesday': { 'open': '00:00', 'close': '23:59', 'isOpen24Hours': true },
      'wednesday': { 'open': '00:00', 'close': '23:59', 'isOpen24Hours': true },
      'thursday': { 'open': '00:00', 'close': '23:59', 'isOpen24Hours': true },
      'friday': { 'open': '00:00', 'close': '23:59', 'isOpen24Hours': true },
      'saturday': { 'open': '00:00', 'close': '23:59', 'isOpen24Hours': true },
      'sunday': { 'open': '00:00', 'close': '23:59', 'isOpen24Hours': true }
    },
    admission_fee: 0.00,
    contact_phone: '+971 4 360 0000',
    website: 'https://www.nakheel.com',
    images: ['https://picsum.photos/800/600?random=205', 'https://picsum.photos/800/600?random=206'],
    rating: 4.4,
    review_count: 67234,
    is_featured: true,
    is_active: true,
    has_parking: true,
    is_wheelchair_accessible: true,
    has_restaurant: true,
    has_gift_shop: false,
    tags: ['landmark', 'island', 'resort', 'beach']
  },
  {
    name: 'Dubai Museum',
    name_ar: 'متحف دبي',
    description: 'Located in Al Fahidi Fort, this museum showcases Dubai\'s rich history and cultural heritage from ancient times to the modern era.',
    description_ar: 'يقع في قلعة الفهيدي، يعرض هذا المتحف تاريخ دبي الغني والتراث الثقافي من العصور القديمة إلى العصر الحديث.',
    category: 'culture',
    location_lat: 25.2632,
    location_lng: 55.2972,
    address: 'Al Fahidi Street, Bur Dubai',
    address_ar: 'شارع الفهيدي، بر دبي',
    opening_hours: {
      'monday': { 'open': '08:30', 'close': '20:30' },
      'tuesday': { 'open': '08:30', 'close': '20:30' },
      'wednesday': { 'open': '08:30', 'close': '20:30' },
      'thursday': { 'open': '08:30', 'close': '20:30' },
      'friday': { 'open': '14:30', 'close': '20:30' },
      'saturday': { 'open': '08:30', 'close': '20:30' },
      'sunday': { 'open': '08:30', 'close': '20:30' }
    },
    admission_fee: 3.00,
    contact_phone: '+971 4 353 1862',
    contact_email: 'info@dubaimuseum.ae',
    website: 'https://www.dubaimuseum.ae',
    images: ['https://picsum.photos/800/600?random=207', 'https://picsum.photos/800/600?random=208'],
    rating: 4.1,
    review_count: 23456,
    is_featured: false,
    is_active: true,
    has_parking: true,
    is_wheelchair_accessible: true,
    has_restaurant: false,
    has_gift_shop: true,
    tags: ['museum', 'history', 'culture', 'heritage']
  },
  {
    name: 'Dubai Miracle Garden',
    name_ar: 'حديقة الزهور بدبي',
    description: 'The world\'s largest natural flower garden featuring over 150 million flowers arranged in stunning designs and patterns.',
    description_ar: 'أكبر حديقة زهور طبيعية في العالم تضم أكثر من 150 مليون زهرة مرتبة في تصاميم وأنماط مذهلة.',
    category: 'family',
    location_lat: 25.0591,
    location_lng: 55.2429,
    address: 'Al Barsha South 3, Dubai',
    address_ar: 'البرشاء جنوب 3، دبي',
    opening_hours: {
      'monday': { 'open': '09:00', 'close': '21:00' },
      'tuesday': { 'open': '09:00', 'close': '21:00' },
      'wednesday': { 'open': '09:00', 'close': '21:00' },
      'thursday': { 'open': '09:00', 'close': '21:00' },
      'friday': { 'open': '09:00', 'close': '21:00' },
      'saturday': { 'open': '09:00', 'close': '21:00' },
      'sunday': { 'open': '09:00', 'close': '21:00' }
    },
    admission_fee: 75.00,
    contact_phone: '+971 4 422 8902',
    contact_email: 'info@dubaimiraclegarden.com',
    website: 'https://www.dubaimiraclegarden.com',
    images: ['https://picsum.photos/800/600?random=209', 'https://picsum.photos/800/600?random=210'],
    rating: 4.3,
    review_count: 45123,
    is_featured: true,
    is_active: true,
    has_parking: true,
    is_wheelchair_accessible: true,
    has_restaurant: true,
    has_gift_shop: true,
    tags: ['garden', 'flowers', 'family', 'nature']
  }
]

// Tourism events
const tourismEvents = [
  {
    title: 'Dubai Food Festival 2024',
    title_ar: 'مهرجان دبي للطعام 2024',
    description: 'A month-long celebration of culinary excellence featuring the best restaurants, food trucks, and international cuisines from around the world.',
    description_ar: 'احتفال يستمر لشهر كامل بالتميز الطهي يضم أفضل المطاعم وعربات الطعام والمأكولات العالمية من جميع أنحاء العالم.',
    category: 'festival',
    start_date: '2024-02-15T00:00:00Z',
    end_date: '2024-03-15T23:59:59Z',
    location: 'Various locations across Dubai',
    location_ar: 'مواقع مختلفة في جميع أنحاء دبي',
    venue: 'Multiple venues including Dubai Mall, JBR, and City Walk',
    venue_ar: 'أماكن متعددة تشمل دبي مول وجي بي آر وسيتي ووك',
    organizer: 'Dubai Tourism',
    organizer_ar: 'دبي للسياحة',
    ticket_price: 0.00,
    ticket_url: 'https://www.dubaifoodfestival.com',
    image_url: 'https://picsum.photos/800/600?random=301',
    is_featured: true,
    is_active: true,
    tags: ['food', 'festival', 'cuisine', 'dining']
  },
  {
    title: 'Dubai International Film Festival',
    title_ar: 'مهرجان دبي السينمائي الدولي',
    description: 'Celebrating cinema from around the world with screenings, workshops, and red carpet events featuring international stars.',
    description_ar: 'احتفال بالسينما من جميع أنحاء العالم مع عروض وورش عمل وفعاليات السجادة الحمراء بمشاركة نجوم عالميين.',
    category: 'cultural',
    start_date: '2024-03-01T00:00:00Z',
    end_date: '2024-03-10T23:59:59Z',
    location: 'Dubai Opera and Madinat Jumeirah',
    location_ar: 'دار الأوبرا دبي ومدينة جميرا',
    venue: 'Dubai Opera Theatre',
    venue_ar: 'مسرح دار الأوبرا دبي',
    organizer: 'Dubai International Film Festival',
    organizer_ar: 'مهرجان دبي السينمائي الدولي',
    ticket_price: 150.00,
    ticket_url: 'https://www.diff.ae',
    image_url: 'https://picsum.photos/800/600?random=302',
    is_featured: true,
    is_active: true,
    tags: ['film', 'cinema', 'culture', 'arts']
  },
  {
    title: 'Dubai Fitness Challenge',
    title_ar: 'تحدي دبي للياقة البدنية',
    description: '30 days of free fitness activities across the city encouraging residents and visitors to commit to 30 minutes of exercise daily.',
    description_ar: '30 يوماً من أنشطة اللياقة البدنية المجانية في جميع أنحاء المدينة تشجع المقيمين والزوار على الالتزام بـ 30 دقيقة من التمارين يومياً.',
    category: 'sports',
    start_date: '2024-10-26T00:00:00Z',
    end_date: '2024-11-24T23:59:59Z',
    location: 'Citywide parks, beaches, and public spaces',
    location_ar: 'حدائق وشواطئ ومساحات عامة في جميع أنحاء المدينة',
    venue: 'Multiple locations across Dubai',
    venue_ar: 'مواقع متعددة في جميع أنحاء دبي',
    organizer: 'Dubai Sports Council',
    organizer_ar: 'مجلس دبي الرياضي',
    ticket_price: 0.00,
    ticket_url: 'https://www.dubaifitnesschallenge.com',
    image_url: 'https://picsum.photos/800/600?random=303',
    is_featured: true,
    is_active: true,
    tags: ['fitness', 'sports', 'health', 'wellness']
  }
]

async function seedDatabase() {
  try {
    // Seed news sources
    const { data: sources, error: sourcesError } = await supabase
      .from('news_sources')
      .upsert(newsSources, { onConflict: 'name' })
      .select()

    if (sourcesError) {
      console.error('Error seeding news sources:', sourcesError)
    } else {
          }

    // Get source IDs for articles
    const { data: sourcesList } = await supabase
      .from('news_sources')
      .select('id, name')

    const sourceMap = sourcesList?.reduce((acc: any, source: any) => {
      acc[source.name] = source.id
      return acc
    }, {}) || {}

    // Add source_id to articles
    const articlesWithSourceId = newsArticles.map(article => ({
      ...article,
      source_id: sourceMap[article.author] || sourceMap['Dubai Media Office']
    }))

    // Seed news articles
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .upsert(articlesWithSourceId, { onConflict: 'title' })
      .select()

    if (articlesError) {
      console.error('Error seeding news articles:', articlesError)
    } else {
          }

    // Seed tourism attractions
    const { data: attractions, error: attractionsError } = await supabase
      .from('tourism_attractions')
      .upsert(tourismAttractions, { onConflict: 'name' })
      .select()

    if (attractionsError) {
      console.error('Error seeding tourism attractions:', attractionsError)
    } else {
          }

    // Seed tourism events
    const { data: events, error: eventsError } = await supabase
      .from('tourism_events')
      .upsert(tourismEvents, { onConflict: 'title' })
      .select()

    if (eventsError) {
      console.error('Error seeding tourism events:', eventsError)
    } else {
          }

    } catch (error) {
    console.error('❌ Error during database seeding:', error)
    process.exit(1)
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding script failed:', error)
      process.exit(1)
    })
}

export { seedDatabase, newsSources, newsArticles, tourismAttractions, tourismEvents }