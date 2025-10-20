import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { QualityDashboard } from '@/shared/components/quality-control/QualityDashboard'
import { RandomReviewPanel } from './RandomReviewPanel'
import { QualityIssuesTab } from './QualityIssuesTab'

const QualityControlDashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quality Control Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and review content quality across the platform
        </p>
      </div>

      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review">Random Review</TabsTrigger>
          <TabsTrigger value="issues">Quality Issues</TabsTrigger>
          <TabsTrigger value="dashboard">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="review" className="space-y-6">
          <RandomReviewPanel />
        </TabsContent>
        
        <TabsContent value="issues" className="space-y-6">
          <QualityIssuesTab />
        </TabsContent>
        
        <TabsContent value="dashboard" className="space-y-6">
          <QualityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default QualityControlDashboardPage
