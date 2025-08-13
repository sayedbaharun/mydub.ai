import { EmergencyContact } from '../types'

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'police',
    name: 'Police Emergency',
    nameAr: 'شرطة الطوارئ',
    number: '999',
    category: 'police',
    description: 'For immediate police assistance and emergencies',
    descriptionAr: 'للحصول على مساعدة فورية من الشرطة وحالات الطوارئ',
    available24Hours: true,
    languages: ['English', 'Arabic', 'Hindi', 'Urdu']
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    nameAr: 'الإسعاف',
    number: '998',
    category: 'medical',
    description: 'Medical emergencies and ambulance services',
    descriptionAr: 'حالات الطوارئ الطبية وخدمات الإسعاف',
    available24Hours: true,
    languages: ['English', 'Arabic', 'Hindi', 'Urdu']
  },
  {
    id: 'fire',
    name: 'Fire Department',
    nameAr: 'الدفاع المدني',
    number: '997',
    category: 'fire',
    description: 'Fire emergencies and rescue services',
    descriptionAr: 'حالات طوارئ الحرائق وخدمات الإنقاذ',
    available24Hours: true,
    languages: ['English', 'Arabic']
  },
  {
    id: 'police-non-emergency',
    name: 'Police Non-Emergency',
    nameAr: 'الشرطة غير الطارئة',
    number: '901',
    category: 'police',
    description: 'Non-emergency police assistance',
    descriptionAr: 'مساعدة الشرطة غير الطارئة',
    available24Hours: true,
    languages: ['English', 'Arabic']
  },
  {
    id: 'dewa-emergency',
    name: 'DEWA Emergency',
    nameAr: 'طوارئ هيئة كهرباء ومياه دبي',
    number: '991',
    category: 'utility',
    description: 'Electricity and water emergencies',
    descriptionAr: 'حالات طوارئ الكهرباء والمياه',
    available24Hours: true,
    languages: ['English', 'Arabic']
  },
  {
    id: 'gas-emergency',
    name: 'Gas Emergency',
    nameAr: 'طوارئ الغاز',
    number: '04 209 6666',
    category: 'utility',
    description: 'Gas leaks and emergencies',
    descriptionAr: 'تسرب الغاز وحالات الطوارئ',
    available24Hours: true,
    languages: ['English', 'Arabic']
  },
  {
    id: 'coast-guard',
    name: 'Coast Guard',
    nameAr: 'خفر السواحل',
    number: '996',
    category: 'police',
    description: 'Maritime emergencies and rescue',
    descriptionAr: 'حالات الطوارئ البحرية والإنقاذ',
    available24Hours: true,
    languages: ['English', 'Arabic']
  },
  {
    id: 'tourist-police',
    name: 'Tourist Police',
    nameAr: 'شرطة السياحة',
    number: '04 609 6999',
    category: 'police',
    description: 'Assistance for tourists and visitors',
    descriptionAr: 'المساعدة للسياح والزوار',
    available24Hours: true,
    languages: ['English', 'Arabic', 'Hindi', 'Chinese', 'Russian']
  },
  {
    id: 'mental-health',
    name: 'Mental Health Support',
    nameAr: 'دعم الصحة النفسية',
    number: '04 519 2519',
    category: 'helpline',
    description: 'Mental health crisis support and counseling',
    descriptionAr: 'دعم أزمات الصحة النفسية والاستشارة',
    available24Hours: true,
    languages: ['English', 'Arabic']
  },
  {
    id: 'child-protection',
    name: 'Child Protection Hotline',
    nameAr: 'خط حماية الطفل',
    number: '800 988',
    category: 'helpline',
    description: 'Report child abuse or seek help',
    descriptionAr: 'الإبلاغ عن إساءة معاملة الأطفال أو طلب المساعدة',
    available24Hours: true,
    languages: ['English', 'Arabic']
  },
  {
    id: 'women-helpline',
    name: 'Women\'s Helpline',
    nameAr: 'خط مساعدة المرأة',
    number: '800 7283',
    category: 'helpline',
    description: 'Support for women in distress',
    descriptionAr: 'دعم النساء في محنة',
    available24Hours: true,
    languages: ['English', 'Arabic', 'Hindi', 'Urdu']
  },
  {
    id: 'us-consulate',
    name: 'US Consulate',
    nameAr: 'القنصلية الأمريكية',
    number: '+971 4 309 4000',
    category: 'embassy',
    description: 'US citizen services and emergencies',
    descriptionAr: 'خدمات المواطنين الأمريكيين وحالات الطوارئ',
    available24Hours: false,
    languages: ['English']
  },
  {
    id: 'uk-embassy',
    name: 'UK Embassy',
    nameAr: 'السفارة البريطانية',
    number: '+971 4 309 4444',
    category: 'embassy',
    description: 'UK citizen services and emergencies',
    descriptionAr: 'خدمات المواطنين البريطانيين وحالات الطوارئ',
    available24Hours: false,
    languages: ['English']
  },
  {
    id: 'indian-consulate',
    name: 'Indian Consulate',
    nameAr: 'القنصلية الهندية',
    number: '+971 4 397 1222',
    category: 'embassy',
    description: 'Indian citizen services and emergencies',
    descriptionAr: 'خدمات المواطنين الهنود وحالات الطوارئ',
    available24Hours: false,
    languages: ['English', 'Hindi']
  }
]

export const getContactsByCategory = (category: string): EmergencyContact[] => {
  return EMERGENCY_CONTACTS.filter(contact => contact.category === category)
}

export const getEmergencyNumbers = (): EmergencyContact[] => {
  return EMERGENCY_CONTACTS.filter(contact => 
    ['police', 'medical', 'fire'].includes(contact.category) && 
    contact.number.length <= 3
  )
}