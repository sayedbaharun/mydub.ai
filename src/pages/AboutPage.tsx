import { Heart, Users, Globe, Zap, Shield, Target } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const values = [
  {
    icon: Heart,
    titleKey: 'about.values.userCentric.title',
    descriptionKey: 'about.values.userCentric.description'
  },
  {
    icon: Zap,
    titleKey: 'about.values.innovation.title',
    descriptionKey: 'about.values.innovation.description'
  },
  {
    icon: Shield,
    titleKey: 'about.values.trustPrivacy.title',
    descriptionKey: 'about.values.trustPrivacy.description'
  },
  {
    icon: Globe,
    titleKey: 'about.values.accessibility.title',
    descriptionKey: 'about.values.accessibility.description'
  }
]

const team = [
  {
    nameKey: 'about.team.aiTeam.name',
    roleKey: 'about.team.aiTeam.role',
    descriptionKey: 'about.team.aiTeam.description'
  },
  {
    nameKey: 'about.team.contentTeam.name',
    roleKey: 'about.team.contentTeam.role',
    descriptionKey: 'about.team.contentTeam.description'
  },
  {
    nameKey: 'about.team.designTeam.name',
    roleKey: 'about.team.designTeam.role',
    descriptionKey: 'about.team.designTeam.description'
  }
]

export default function AboutPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">{t('about.title')}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Mission Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
        <div className="text-center space-y-4">
          <Target className="h-12 w-12 mx-auto text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{t('about.missionTitle')}</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            {t('about.missionDescription')}
          </p>
        </div>
      </div>

      {/* What We Do */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">{t('about.whatWeDoTitle')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">{t('about.features.aiAssistant.title')}</h3>
              <p className="text-gray-600">
                {t('about.features.aiAssistant.description')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">{t('about.features.realTimeInfo.title')}</h3>
              <p className="text-gray-600">
                {t('about.features.realTimeInfo.description')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">{t('about.features.multiLanguage.title')}</h3>
              <p className="text-gray-600">
                {t('about.features.multiLanguage.description')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">{t('about.features.government.title')}</h3>
              <p className="text-gray-600">
                {t('about.features.government.description')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Our Values */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">{t('about.valuesTitle')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="border-0 bg-white shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t(value.titleKey)}</h3>
                    <p className="text-gray-600">{t(value.descriptionKey)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Our Team */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">{t('about.teamTitle')}</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          {t('about.teamDescription')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member, index) => (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t(member.nameKey)}</h3>
                <p className="text-sm text-blue-600 font-medium mb-3">{t(member.roleKey)}</p>
                <p className="text-gray-600 text-sm">{t(member.descriptionKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Join Us */}
      <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('about.joinUsTitle')}</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          {t('about.joinUsDescription')}
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="mailto:careers@mydub.ai"
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            {t('about.viewOpportunities')}
          </a>
          <Link
            to="/contact"
            className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors"
          >
            {t('about.getInTouch')}
          </Link>
        </div>
      </div>
    </div>
  )
}