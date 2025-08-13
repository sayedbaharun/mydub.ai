#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAwOTg1NiwiZXhwIjoyMDY1NTg1ODU2fQ.d7XUUomKbSUpk3oMJLeeG7SmsJJ2FIWebYM5Kif8h_s'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedNewsData() {
  console.log('🗞️ Seeding news data...')

  // Seed news sources
  const newsSources = [
    {
      name: 'Dubai Media Office',
      name_ar: 'مكتب دبي الإعلامي',
      website: 'https://mediaoffice.ae',
      is_active: true,
      credibility_score: 10
    },
    {
      name: 'Gulf News',
      name_ar: 'جلف نيوز',
      website: 'https://gulfnews.com',
      is_active: true,
      credibility_score: 8
    },
    {
      name: 'Khaleej Times',
      name_ar: 'الخليج تايمز',
      website: 'https://khaleejtimes.com',
      is_active: true,
      credibility_score: 8
    },
    {
      name: 'Emirates News Agency (WAM)',
      name_ar: 'وكالة أنباء الإمارات',
      website: 'https://wam.ae',
      is_active: true,
      credibility_score: 10
    }
  ]

  const { data: sourcesData, error: sourcesError } = await supabase
    .from('news_sources')
    .insert(newsSources)
    .select()

  if (sourcesError) {
    console.error('Error seeding news sources:', sourcesError)
  } else {
    console.log(`✅ Seeded ${sourcesData.length} news sources`)
  }

  // Seed news articles
  const newsArticles = [
    {
      title: 'Dubai Announces New Smart City Initiative',
      title_ar: 'دبي تعلن عن مبادرة المدينة الذكية الجديدة',
      summary: 'Dubai Municipality launches comprehensive smart city program with AI-powered services',
      summary_ar: 'بلدية دبي تطلق برنامج مدينة ذكية شامل مع خدمات مدعومة بالذكاء الاصطناعي',
      content: 'Dubai Municipality has announced a groundbreaking smart city initiative that will transform urban services using artificial intelligence and IoT technologies. The program includes smart traffic management, waste collection optimization, and enhanced emergency response systems.',
      content_ar: 'أعلنت بلدية دبي عن مبادرة مدينة ذكية رائدة ستحول الخدمات الحضرية باستخدام الذكاء الاصطناعي وتقنيات إنترنت الأشياء. يشمل البرنامج إدارة المرور الذكية وتحسين جمع النفايات وأنظمة الاستجابة للطوارئ المحسنة.',
      source_id: sourcesData?.[0]?.id,
      category: 'technology',
      author: 'Dubai Media Office',
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: 'https://example.com/smart-city-initiative',
      image_url: 'https://picsum.photos/800/600?random=1',
      tags: ['smart city', 'AI', 'technology', 'municipality'],
      sentiment: 'positive',
      is_featured: true,
      read_time: 4
    },
    {
      title: 'Dubai Metro Blue Line Construction Begins',
      title_ar: 'بداية إنشاء الخط الأزرق لمترو دبي',
      summary: 'RTA commences construction of the new Blue Line connecting key areas of Dubai',
      summary_ar: 'هيئة الطرق والمواصلات تبدأ إنشاء الخط الأزرق الجديد الذي يربط المناطق الرئيسية في دبي',
      content: 'The Roads and Transport Authority (RTA) has officially commenced construction of the Dubai Metro Blue Line, which will connect Dubai International Airport to the Dubai World Central (Al Maktoum International Airport). The 46.6-kilometer line will feature 14 stations and is expected to be completed by 2030.',
      content_ar: 'بدأت هيئة الطرق والمواصلات رسمياً في إنشاء الخط الأزرق لمترو دبي، والذي سيربط مطار دبي الدولي بمركز دبي العالمي (مطار آل مكتوم الدولي). سيضم الخط البالغ طوله 46.6 كيلومتر 14 محطة ومن المتوقع أن يكتمل بحلول عام 2030.',
      source_id: sourcesData?.[0]?.id,
      category: 'transport',
      author: 'RTA Communications',
      published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      url: 'https://example.com/metro-blue-line',
      image_url: 'https://picsum.photos/800/600?random=2',
      tags: ['metro', 'transport', 'infrastructure', 'RTA'],
      sentiment: 'positive',
      is_featured: true,
      read_time: 3
    },
    {
      title: 'Dubai Shopping Festival 2024 Records Highest Visitor Numbers',
      title_ar: 'مهرجان دبي للتسوق 2024 يسجل أعلى أرقام للزوار',
      summary: 'Annual shopping festival attracts record 4.2 million visitors from around the world',
      summary_ar: 'مهرجان التسوق السنوي يجذب رقماً قياسياً من 4.2 مليون زائر من جميع أنحاء العالم',
      content: 'The Dubai Shopping Festival 2024 has concluded with remarkable success, attracting 4.2 million visitors and generating AED 8.2 billion in retail sales. The festival featured special promotions, entertainment shows, and cultural events across the emirate.',
      content_ar: 'اختتم مهرجان دبي للتسوق 2024 بنجاح ملحوظ، حيث جذب 4.2 مليون زائر وحقق 8.2 مليار درهم في مبيعات التجزئة. ضم المهرجان عروض ترويجية خاصة وعروض ترفيهية وفعاليات ثقافية عبر الإمارة.',
      source_id: sourcesData?.[1]?.id,
      category: 'tourism',
      author: 'Dubai Tourism Board',
      published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      url: 'https://example.com/shopping-festival-success',
      image_url: 'https://picsum.photos/800/600?random=3',
      tags: ['shopping', 'festival', 'tourism', 'retail'],
      sentiment: 'positive',
      is_featured: false,
      read_time: 2
    }
  ]

  const { data: articlesData, error: articlesError } = await supabase
    .from('news_articles')
    .insert(newsArticles)
    .select()

  if (articlesError) {
    console.error('Error seeding news articles:', articlesError)
  } else {
    console.log(`✅ Seeded ${articlesData.length} news articles`)
  }
}

async function seedGovernmentData() {
  console.log('🏛️ Seeding government data...')

  // Seed government departments
  const departments = [
    {
      name: 'Dubai Municipality',
      name_ar: 'بلدية دبي',
      description: 'Responsible for municipal services, urban planning, and environmental management',
      description_ar: 'مسؤولة عن الخدمات البلدية والتخطيط العمراني وإدارة البيئة',
      website: 'https://www.dm.gov.ae',
      email: 'info@dm.gov.ae',
      phone: '+971 4 221 5555',
      address: 'Dubai Municipality Building, Al Khaleej Road, Dubai',
      address_ar: 'مبنى بلدية دبي، شارع الخليج، دبي',
      is_active: true
    },
    {
      name: 'Roads and Transport Authority (RTA)',
      name_ar: 'هيئة الطرق والمواصلات',
      description: 'Managing transportation infrastructure and public transport services',
      description_ar: 'إدارة البنية التحتية للنقل وخدمات النقل العام',
      website: 'https://www.rta.ae',
      email: 'info@rta.ae',
      phone: '+971 600 900 090',
      address: 'RTA Head Office, Al Karama, Dubai',
      address_ar: 'المكتب الرئيسي لهيئة الطرق والمواصلات، الكرامة، دبي',
      is_active: true
    },
    {
      name: 'Dubai Health Authority (DHA)',
      name_ar: 'هيئة الصحة في دبي',
      description: 'Regulating and providing healthcare services in Dubai',
      description_ar: 'تنظيم وتقديم الخدمات الصحية في دبي',
      website: 'https://www.dha.gov.ae',
      email: 'info@dha.gov.ae',
      phone: '+971 4 363 0001',
      address: 'Dubai Health Authority Building, Oud Metha, Dubai',
      address_ar: 'مبنى هيئة الصحة في دبي، عود ميثاء، دبي',
      is_active: true
    }
  ]

  const { data: departmentsData, error: departmentsError } = await supabase
    .from('government_departments')
    .insert(departments)
    .select()

  if (departmentsError) {
    console.error('Error seeding government departments:', departmentsError)
  } else {
    console.log(`✅ Seeded ${departmentsData.length} government departments`)
  }

  // Seed government services
  const services = [
    {
      department_id: departmentsData?.[0]?.id,
      title: 'Building Permit Application',
      title_ar: 'طلب رخصة البناء',
      description: 'Apply for building permits for residential and commercial construction',
      description_ar: 'التقدم بطلب للحصول على رخص البناء للمباني السكنية والتجارية',
      category: 'permits',
      url: 'https://www.dm.gov.ae/services/building-permit',
      requirements: ['Architectural drawings', 'Land ownership document', 'NOC from relevant authorities'],
      requirements_ar: ['الرسومات المعمارية', 'وثيقة ملكية الأرض', 'موافقة من السلطات المختصة'],
      documents: ['Emirates ID', 'Trade License', 'Site Plan'],
      documents_ar: ['الهوية الإماراتية', 'الرخصة التجارية', 'مخطط الموقع'],
      fees: 500.00,
      processing_time: '7-14 business days',
      processing_time_ar: '7-14 يوم عمل',
      is_online: true,
      is_active: true
    },
    {
      department_id: departmentsData?.[1]?.id,
      title: 'Driving License Renewal',
      title_ar: 'تجديد رخصة القيادة',
      description: 'Renew your UAE driving license online or at RTA centers',
      description_ar: 'جدد رخصة القيادة الإماراتية عبر الإنترنت أو في مراكز هيئة الطرق والمواصلات',
      category: 'licenses',
      url: 'https://www.rta.ae/services/driving-license-renewal',
      requirements: ['Valid Emirates ID', 'Eye test certificate', 'No objection certificate'],
      requirements_ar: ['هوية إماراتية سارية', 'شهادة فحص النظر', 'شهادة عدم ممانعة'],
      documents: ['Emirates ID', 'Current driving license', 'Eye test'],
      documents_ar: ['الهوية الإماراتية', 'رخصة القيادة الحالية', 'فحص النظر'],
      fees: 300.00,
      processing_time: 'Same day',
      processing_time_ar: 'نفس اليوم',
      is_online: true,
      is_active: true
    },
    {
      department_id: departmentsData?.[2]?.id,
      title: 'Health Card Registration',
      title_ar: 'تسجيل البطاقة الصحية',
      description: 'Register for Dubai Health Authority health card for medical services',
      description_ar: 'التسجيل للحصول على البطاقة الصحية لهيئة الصحة في دبي للخدمات الطبية',
      category: 'health',
      url: 'https://www.dha.gov.ae/services/health-card',
      requirements: ['Valid visa', 'Emirates ID', 'Passport copy'],
      requirements_ar: ['تأشيرة سارية', 'الهوية الإماراتية', 'نسخة من جواز السفر'],
      documents: ['Emirates ID', 'Passport', 'Visa page', 'Passport photos'],
      documents_ar: ['الهوية الإماراتية', 'جواز السفر', 'صفحة التأشيرة', 'صور شخصية'],
      fees: 320.00,
      processing_time: '3-5 business days',
      processing_time_ar: '3-5 أيام عمل',
      is_online: true,
      is_active: true
    }
  ]

  const { data: servicesData, error: servicesError } = await supabase
    .from('government_services')
    .insert(services)
    .select()

  if (servicesError) {
    console.error('Error seeding government services:', servicesError)
  } else {
    console.log(`✅ Seeded ${servicesData.length} government services`)
  }
}

async function seedTourismData() {
  console.log('🏖️ Seeding tourism data...')

  // Seed tourism attractions
  const attractions = [
    {
      name: 'Burj Khalifa',
      name_ar: 'برج خليفة',
      description: 'The world\'s tallest building offering stunning views of Dubai',
      description_ar: 'أطول مبنى في العالم يوفر إطلالات خلابة على دبي',
      category: 'landmark',
      location_lat: 25.1972,
      location_lng: 55.2744,
      address: 'Downtown Dubai, Dubai',
      address_ar: 'وسط مدينة دبي، دبي',
      opening_hours: {
        'Monday': '10:00 AM - 10:00 PM',
        'Tuesday': '10:00 AM - 10:00 PM',
        'Wednesday': '10:00 AM - 10:00 PM',
        'Thursday': '10:00 AM - 10:00 PM',
        'Friday': '10:00 AM - 10:00 PM',
        'Saturday': '10:00 AM - 10:00 PM',
        'Sunday': '10:00 AM - 10:00 PM'
      },
      admission_fee: 149.00,
      contact_phone: '+971 4 888 8888',
      website: 'https://www.burjkhalifa.ae',
      images: ['https://picsum.photos/800/600?random=10', 'https://picsum.photos/800/600?random=11'],
      rating: 4.8,
      review_count: 15420,
      is_featured: true,
      is_active: true
    },
    {
      name: 'Dubai Mall',
      name_ar: 'دبي مول',
      description: 'One of the world\'s largest shopping and entertainment destinations',
      description_ar: 'واحد من أكبر وجهات التسوق والترفيه في العالم',
      category: 'shopping',
      location_lat: 25.1975,
      location_lng: 55.2796,
      address: 'Downtown Dubai, Dubai',
      address_ar: 'وسط مدينة دبي، دبي',
      opening_hours: {
        'Monday': '10:00 AM - 12:00 AM',
        'Tuesday': '10:00 AM - 12:00 AM',
        'Wednesday': '10:00 AM - 12:00 AM',
        'Thursday': '10:00 AM - 1:00 AM',
        'Friday': '10:00 AM - 1:00 AM',
        'Saturday': '10:00 AM - 1:00 AM',
        'Sunday': '10:00 AM - 12:00 AM'
      },
      admission_fee: 0.00,
      contact_phone: '+971 4 362 7500',
      website: 'https://thedubaimall.com',
      images: ['https://picsum.photos/800/600?random=12', 'https://picsum.photos/800/600?random=13'],
      rating: 4.6,
      review_count: 28750,
      is_featured: true,
      is_active: true
    },
    {
      name: 'Palm Jumeirah',
      name_ar: 'نخلة جميرا',
      description: 'Iconic man-made island shaped like a palm tree',
      description_ar: 'جزيرة صناعية مميزة على شكل شجرة النخيل',
      category: 'attraction',
      location_lat: 25.1124,
      location_lng: 55.1390,
      address: 'Palm Jumeirah, Dubai',
      address_ar: 'نخلة جميرا، دبي',
      opening_hours: {
        'Monday': '24 hours',
        'Tuesday': '24 hours',
        'Wednesday': '24 hours',
        'Thursday': '24 hours',
        'Friday': '24 hours',
        'Saturday': '24 hours',
        'Sunday': '24 hours'
      },
      admission_fee: 0.00,
      contact_phone: '+971 4 390 0000',
      website: 'https://www.thepalm.ae',
      images: ['https://picsum.photos/800/600?random=14', 'https://picsum.photos/800/600?random=15'],
      rating: 4.7,
      review_count: 12480,
      is_featured: true,
      is_active: true
    }
  ]

  const { data: attractionsData, error: attractionsError } = await supabase
    .from('tourism_attractions')
    .insert(attractions)
    .select()

  if (attractionsError) {
    console.error('Error seeding tourism attractions:', attractionsError)
  } else {
    console.log(`✅ Seeded ${attractionsData.length} tourism attractions`)
  }

  // Seed tourism events
  const events = [
    {
      title: 'Dubai Food Festival 2024',
      title_ar: 'مهرجان دبي للطعام 2024',
      description: 'A month-long celebration of culinary excellence featuring restaurants across Dubai',
      description_ar: 'احتفال يستمر شهراً بالتميز الطهي يضم مطاعم في جميع أنحاء دبي',
      category: 'festival',
      start_date: new Date('2024-02-01').toISOString(),
      end_date: new Date('2024-02-29').toISOString(),
      location: 'Various locations across Dubai',
      location_ar: 'مواقع مختلفة في جميع أنحاء دبي',
      venue: 'Multiple venues',
      venue_ar: 'أماكن متعددة',
      organizer: 'Dubai Tourism',
      organizer_ar: 'دبي للسياحة',
      ticket_price: 0.00,
      ticket_url: 'https://www.dubaifoodfestival.com',
      image_url: 'https://picsum.photos/800/600?random=20',
      is_featured: true,
      is_active: true
    },
    {
      title: 'Dubai Shopping Festival',
      title_ar: 'مهرجان دبي للتسوق',
      description: 'Annual shopping extravaganza with discounts, entertainment, and prizes',
      description_ar: 'مهرجان تسوق سنوي مع خصومات وترفيه وجوائز',
      category: 'shopping',
      start_date: new Date('2024-12-01').toISOString(),
      end_date: new Date('2025-01-31').toISOString(),
      location: 'Malls and venues across Dubai',
      location_ar: 'مراكز تجارية وأماكن في جميع أنحاء دبي',
      venue: 'City-wide',
      venue_ar: 'على مستوى المدينة',
      organizer: 'Dubai Festivals and Retail Establishment',
      organizer_ar: 'مؤسسة دبي للمهرجانات والتجزئة',
      ticket_price: 0.00,
      ticket_url: 'https://www.mydsf.ae',
      image_url: 'https://picsum.photos/800/600?random=21',
      is_featured: true,
      is_active: true
    }
  ]

  const { data: eventsData, error: eventsError } = await supabase
    .from('tourism_events')
    .insert(events)
    .select()

  if (eventsError) {
    console.error('Error seeding tourism events:', eventsError)
  } else {
    console.log(`✅ Seeded ${eventsData.length} tourism events`)
  }
}

async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    await seedNewsData()
    await seedGovernmentData()
    await seedTourismData()
    
    console.log('✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
main()

export { main as seedDatabase }