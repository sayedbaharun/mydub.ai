import { NewsSource } from '../types'

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'gulf-news',
    name: 'Gulf News',
    nameAr: 'جلف نيوز',
    logo: '/logos/gulf-news.png',
    website: 'https://gulfnews.com',
    credibility: 95
  },
  {
    id: 'khaleej-times',
    name: 'Khaleej Times',
    nameAr: 'خليج تايمز',
    logo: '/logos/khaleej-times.png',
    website: 'https://khaleejtimes.com',
    credibility: 93
  },
  {
    id: 'the-national',
    name: 'The National',
    nameAr: 'ذا ناشيونال',
    logo: '/logos/the-national.png',
    website: 'https://thenationalnews.com',
    credibility: 94
  },
  {
    id: 'arabian-business',
    name: 'Arabian Business',
    nameAr: 'أريبيان بزنس',
    logo: '/logos/arabian-business.png',
    website: 'https://arabianbusiness.com',
    credibility: 90
  },
  {
    id: 'dubai-eye',
    name: 'Dubai Eye 103.8',
    nameAr: 'دبي آي',
    logo: '/logos/dubai-eye.png',
    website: 'https://dubaieye1038.com',
    credibility: 88
  },
  {
    id: 'al-bayan',
    name: 'Al Bayan',
    nameAr: 'البيان',
    logo: '/logos/al-bayan.png',
    website: 'https://albayan.ae',
    credibility: 92
  },
  {
    id: 'emirates-247',
    name: 'Emirates 24|7',
    nameAr: 'الإمارات 24|7',
    logo: '/logos/emirates-247.png',
    website: 'https://emirates247.com',
    credibility: 85
  },
  {
    id: 'time-out-dubai',
    name: 'Time Out Dubai',
    nameAr: 'تايم آوت دبي',
    logo: '/logos/time-out-dubai.png',
    website: 'https://timeoutdubai.com',
    credibility: 87
  }
]

export const getSourceById = (id: string): NewsSource | undefined => {
  return NEWS_SOURCES.find(source => source.id === id)
}

export const getSourcesByIds = (ids: string[]): NewsSource[] => {
  return NEWS_SOURCES.filter(source => ids.includes(source.id))
}

export const getSourcesByCredibility = (minCredibility: number): NewsSource[] => {
  return NEWS_SOURCES.filter(source => source.credibility >= minCredibility)
}