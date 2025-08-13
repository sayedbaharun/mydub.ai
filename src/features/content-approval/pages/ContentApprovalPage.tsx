import { useTranslation } from 'react-i18next'
import { ApprovalQueue } from '../components/ApprovalQueue'
import { FileCheck } from 'lucide-react'
import { DashboardPageHeader } from '@/features/dashboard/components/DashboardPageHeader'

export function ContentApprovalPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPageHeader
        title="Content Approval"
        description="Review and approve AI-generated content before publication"
        icon={FileCheck}
        showBackToDashboard={true}
        showBackToHome={true}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ApprovalQueue />
      </div>
    </div>
  )
}

export default ContentApprovalPage
