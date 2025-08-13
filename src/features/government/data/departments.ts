import { Department } from '../types'

export const GOVERNMENT_DEPARTMENTS: Department[] = [
  {
    id: 'rta',
    name: 'Roads and Transport Authority',
    nameAr: 'هيئة الطرق والمواصلات',
    icon: 'Car',
    color: '#E60000'
  },
  {
    id: 'dewa',
    name: 'Dubai Electricity and Water Authority',
    nameAr: 'هيئة كهرباء ومياه دبي',
    icon: 'Zap',
    color: '#0066CC'
  },
  {
    id: 'dha',
    name: 'Dubai Health Authority',
    nameAr: 'هيئة الصحة بدبي',
    icon: 'Heart',
    color: '#00A651'
  },
  {
    id: 'khda',
    name: 'Knowledge and Human Development Authority',
    nameAr: 'هيئة المعرفة والتنمية البشرية',
    icon: 'GraduationCap',
    color: '#FF6B00'
  },
  {
    id: 'dld',
    name: 'Dubai Land Department',
    nameAr: 'دائرة الأراضي والأملاك',
    icon: 'Building',
    color: '#8B4513'
  },
  {
    id: 'gdrfa',
    name: 'General Directorate of Residency and Foreigners Affairs',
    nameAr: 'الإدارة العامة للإقامة وشؤون الأجانب',
    icon: 'Passport',
    color: '#4B0082'
  },
  {
    id: 'dm',
    name: 'Dubai Municipality',
    nameAr: 'بلدية دبي',
    icon: 'Building2',
    color: '#228B22'
  },
  {
    id: 'ded',
    name: 'Department of Economic Development',
    nameAr: 'دائرة التنمية الاقتصادية',
    icon: 'TrendingUp',
    color: '#FF4500'
  },
  {
    id: 'dcca',
    name: 'Dubai Culture and Arts Authority',
    nameAr: 'هيئة دبي للثقافة والفنون',
    icon: 'Palette',
    color: '#9370DB'
  },
  {
    id: 'dsc',
    name: 'Dubai Sports Council',
    nameAr: 'مجلس دبي الرياضي',
    icon: 'Trophy',
    color: '#FFD700'
  }
]

export const getDepartmentById = (id: string): Department | undefined => {
  return GOVERNMENT_DEPARTMENTS.find(dept => dept.id === id)
}

export const getDepartmentsByIds = (ids: string[]): Department[] => {
  return GOVERNMENT_DEPARTMENTS.filter(dept => ids.includes(dept.id))
}