/**
 * Essential Government Services for MyDub.ai
 * Phase 1 - Core services for residents and visitors
 */

export interface EssentialService {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  icon: string
  category: 'documents' | 'visa' | 'housing' | 'transport' | 'utilities' | 'emergency'
  department: string
  departmentAr: string
  officialUrl: string
  requirements?: string[]
  requirementsAr?: string[]
  fees?: string
  processingTime?: string
  processingTimeAr?: string
  tips?: string[]
  tipsAr?: string[]
}

export const ESSENTIAL_SERVICES: EssentialService[] = [
  {
    id: 'emirates-id',
    title: 'Emirates ID',
    titleAr: 'الهوية الإماراتية',
    description: 'Apply for or renew your Emirates ID card - mandatory for all UAE residents and citizens',
    descriptionAr: 'تقديم طلب أو تجديد بطاقة الهوية الإماراتية - إلزامية لجميع المواطنين والمقيمين',
    icon: 'CreditCard',
    category: 'documents',
    department: 'Federal Authority for Identity, Citizenship, Customs & Port Security',
    departmentAr: 'الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ',
    officialUrl: 'https://www.icp.gov.ae',
    requirements: [
      'Valid passport copy',
      'Valid residence visa',
      'Passport-size photo with white background',
      'Previous Emirates ID (for renewal)'
    ],
    requirementsAr: [
      'نسخة من جواز السفر صالح',
      'تأشيرة إقامة صالحة',
      'صورة شخصية بخلفية بيضاء',
      'الهوية الإماراتية السابقة (للتجديد)'
    ],
    fees: 'AED 100-170 depending on validity period',
    processingTime: '7-10 working days',
    processingTimeAr: '7-10 أيام عمل',
    tips: [
      'Book appointment through ICP app',
      'Arrive 15 minutes before appointment',
      'Bring original documents'
    ],
    tipsAr: [
      'احجز موعدك عبر تطبيق ICP',
      'احضر قبل 15 دقيقة من موعدك',
      'أحضر المستندات الأصلية'
    ]
  },
  {
    id: 'visa-services',
    title: 'Visa Services',
    titleAr: 'خدمات التأشيرة',
    description: 'Visit visa extension, residence visa application, visa status check and overstay fine payment',
    descriptionAr: 'تمديد تأشيرة الزيارة، طلب تأشيرة الإقامة، التحقق من حالة التأشيرة ودفع غرامات التأخير',
    icon: 'UserCheck',
    category: 'visa',
    department: 'General Directorate of Residency and Foreigners Affairs',
    departmentAr: 'الإدارة العامة للإقامة وشؤون الأجانب',
    officialUrl: 'https://gdrfad.gov.ae',
    requirements: [
      'Valid passport (minimum 6 months validity)',
      'Entry permit or current visa',
      'Medical fitness certificate (for residence visa)',
      'Emirates ID application'
    ],
    requirementsAr: [
      'جواز سفر صالح (6 أشهر على الأقل)',
      'تصريح دخول أو تأشيرة حالية',
      'شهادة اللياقة الطبية (لتأشيرة الإقامة)',
      'طلب الهوية الإماراتية'
    ],
    fees: 'Varies by visa type - Visit extension: AED 620+',
    processingTime: '2-5 working days',
    processingTimeAr: '2-5 أيام عمل',
    tips: [
      'Apply before visa expiry to avoid fines',
      'Overstay fine: AED 50/day',
      'Use GDRFA app for quick services'
    ],
    tipsAr: [
      'قدم الطلب قبل انتهاء التأشيرة لتجنب الغرامات',
      'غرامة التأخير: 50 درهم يومياً',
      'استخدم تطبيق GDRFA للخدمات السريعة'
    ]
  },
  {
    id: 'driving-license',
    title: 'Driving License',
    titleAr: 'رخصة القيادة',
    description: 'Apply for new driving license, convert international license, or renew existing Dubai license',
    descriptionAr: 'التقدم للحصول على رخصة قيادة جديدة، تحويل رخصة دولية، أو تجديد رخصة دبي',
    icon: 'Car',
    category: 'transport',
    department: 'Roads and Transport Authority',
    departmentAr: 'هيئة الطرق والمواصلات',
    officialUrl: 'https://www.rta.ae',
    requirements: [
      'Emirates ID',
      'Eye test certificate',
      'No Objection Certificate from sponsor (if applicable)',
      'Original driving license (for conversion)'
    ],
    requirementsAr: [
      'الهوية الإماراتية',
      'شهادة فحص النظر',
      'شهادة عدم ممانعة من الكفيل (إن وجد)',
      'رخصة القيادة الأصلية (للتحويل)'
    ],
    fees: 'New license: AED 200-900 | Renewal: AED 110-310',
    processingTime: 'Same day for renewal | 5-7 days for new',
    processingTimeAr: 'نفس اليوم للتجديد | 5-7 أيام للجديد',
    tips: [
      'Book test appointments online',
      'Some nationalities can convert directly',
      'Golden visa holders get 10-year license'
    ],
    tipsAr: [
      'احجز مواعيد الاختبار عبر الإنترنت',
      'بعض الجنسيات يمكنها التحويل مباشرة',
      'حاملو الإقامة الذهبية يحصلون على رخصة 10 سنوات'
    ]
  },
  {
    id: 'dewa-utilities',
    title: 'DEWA (Electricity & Water)',
    titleAr: 'هيئة كهرباء ومياه دبي',
    description: 'New connection, bill payment, move-in/move-out services for electricity and water',
    descriptionAr: 'توصيل جديد، دفع الفواتير، خدمات الانتقال للكهرباء والمياه',
    icon: 'Zap',
    category: 'utilities',
    department: 'Dubai Electricity and Water Authority',
    departmentAr: 'هيئة كهرباء ومياه دبي',
    officialUrl: 'https://www.dewa.gov.ae',
    requirements: [
      'Ejari or tenancy contract',
      'Emirates ID',
      'Security deposit (AED 2000 for villa, AED 1000 for apartment)',
      'NOC from landlord (if tenant)'
    ],
    requirementsAr: [
      'إيجاري أو عقد الإيجار',
      'الهوية الإماراتية',
      'تأمين (2000 درهم للفيلا، 1000 درهم للشقة)',
      'عدم ممانعة من المالك (للمستأجر)'
    ],
    fees: 'Connection: AED 110 | Deposit: AED 1000-2000',
    processingTime: '24 hours for activation',
    processingTimeAr: '24 ساعة للتفعيل',
    tips: [
      'Use DEWA app for all services',
      'Register for green bill (paperless)',
      'Set up auto-pay to avoid disconnection'
    ],
    tipsAr: [
      'استخدم تطبيق ديوا لجميع الخدمات',
      'سجل للفاتورة الخضراء (بدون ورق)',
      'فعّل الدفع التلقائي لتجنب القطع'
    ]
  },
  {
    id: 'ejari-registration',
    title: 'Ejari (Tenancy Registration)',
    titleAr: 'إيجاري (تسجيل عقد الإيجار)',
    description: 'Register your tenancy contract with Dubai Land Department - required for all rental agreements',
    descriptionAr: 'تسجيل عقد الإيجار لدى دائرة الأراضي والأملاك - مطلوب لجميع عقود الإيجار',
    icon: 'Home',
    category: 'housing',
    department: 'Dubai Land Department',
    departmentAr: 'دائرة الأراضي والأملاك',
    officialUrl: 'https://dubailand.gov.ae',
    requirements: [
      'Signed tenancy contract',
      'Title deed copy',
      'Emirates ID of tenant and landlord',
      'DEWA bill or connection'
    ],
    requirementsAr: [
      'عقد الإيجار الموقع',
      'نسخة من سند الملكية',
      'الهوية الإماراتية للمستأجر والمالك',
      'فاتورة أو توصيل ديوا'
    ],
    fees: 'AED 220 (includes AED 120 registration + AED 100 fees)',
    processingTime: 'Immediate through app',
    processingTimeAr: 'فوري عبر التطبيق',
    tips: [
      'Use Dubai REST app for quick registration',
      'Required for visa processing',
      'Must renew annually with lease'
    ],
    tipsAr: [
      'استخدم تطبيق Dubai REST للتسجيل السريع',
      'مطلوب لمعاملات التأشيرة',
      'يجب التجديد سنوياً مع العقد'
    ]
  },
  {
    id: 'emergency-contacts',
    title: 'Emergency Contacts',
    titleAr: 'أرقام الطوارئ',
    description: 'Essential emergency numbers for police, ambulance, fire, and other critical services in Dubai',
    descriptionAr: 'أرقام الطوارئ الأساسية للشرطة والإسعاف والإطفاء والخدمات الحرجة الأخرى في دبي',
    icon: 'Phone',
    category: 'emergency',
    department: 'Various Emergency Services',
    departmentAr: 'خدمات الطوارئ المختلفة',
    officialUrl: 'https://www.dubaipolice.gov.ae',
    requirements: [],
    requirementsAr: [],
    fees: 'Free',
    processingTime: 'Immediate response',
    processingTimeAr: 'استجابة فورية',
    tips: [
      'Police: 999 | Ambulance: 998 | Fire: 997',
      'DEWA Emergency: 991',
      'Directory Enquiries: 181',
      'Dubai Police (non-emergency): 901',
      'Coast Guard: 996'
    ],
    tipsAr: [
      'الشرطة: 999 | الإسعاف: 998 | الإطفاء: 997',
      'طوارئ ديوا: 991',
      'دليل الهاتف: 181',
      'شرطة دبي (غير طارئ): 901',
      'خفر السواحل: 996'
    ]
  }
]

export const getServiceById = (id: string): EssentialService | undefined => {
  return ESSENTIAL_SERVICES.find(service => service.id === id)
}

export const getServicesByCategory = (category: string): EssentialService[] => {
  return ESSENTIAL_SERVICES.filter(service => service.category === category)
}

export const searchServices = (query: string): EssentialService[] => {
  const lowercaseQuery = query.toLowerCase()
  return ESSENTIAL_SERVICES.filter(service => 
    service.title.toLowerCase().includes(lowercaseQuery) ||
    service.description.toLowerCase().includes(lowercaseQuery) ||
    service.department.toLowerCase().includes(lowercaseQuery)
  )
}