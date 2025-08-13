import { useState } from 'react'
import { PerformanceDashboard } from '@/shared/components/PerformanceDashboard'
import { VirtualList } from '@/shared/components/VirtualList'
import { OptimizedImage } from '@/shared/components/OptimizedImage'
import { usePerformance } from '@/shared/hooks/usePerformance'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

// Generate large dataset for virtual list demo
const generateLargeDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `This is item number ${i + 1} in our large dataset`,
    value: Math.floor(Math.random() * 1000)
  }))
}

export function PerformanceDemoPage() {
  const [largeData] = useState(() => generateLargeDataset(10000))
  const { measureFunction } = usePerformance({
    componentName: 'PerformanceDemoPage'
  })

  const handleExpensiveOperation = measureFunction('expensiveOperation', () => {
    // Simulate expensive operation
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i)
    }
    return result
  })

  const handleApiSimulation = measureFunction('apiSimulation', async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  })

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Performance Demo</h1>
        <p className="text-muted-foreground">
          Explore the performance features implemented in MyDub.AI
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="virtual-list">Virtual List</TabsTrigger>
          <TabsTrigger value="images">Optimized Images</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Performance Metrics</CardTitle>
              <CardDescription>
                Monitor application performance in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="virtual-list">
          <Card>
            <CardHeader>
              <CardTitle>Virtual List Demo</CardTitle>
              <CardDescription>
                Efficiently rendering 10,000 items using virtual scrolling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] border rounded-lg">
                <VirtualList
                  items={largeData}
                  itemHeight={80}
                  renderItem={(item) => (
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <span className="text-xs text-muted-foreground">Value: {item.value}</span>
                    </div>
                  )}
                  containerClassName="h-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Optimized Image Loading</CardTitle>
              <CardDescription>
                Images with lazy loading, responsive sizing, and progressive enhancement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Lazy Loaded Image</h3>
                  <OptimizedImage
                    src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800"
                    alt="Dubai skyline"
                    className="rounded-lg"
                    aspectRatio={16/9}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Priority Image</h3>
                  <OptimizedImage
                    src="https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800"
                    alt="Dubai marina"
                    className="rounded-lg"
                    aspectRatio={16/9}
                    priority
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Responsive Image</h3>
                  <OptimizedImage
                    src="https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800"
                    alt="Burj Khalifa"
                    className="rounded-lg"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    aspectRatio={16/9}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Error Handling</h3>
                  <OptimizedImage
                    src="https://invalid-image-url.com/image.jpg"
                    alt="Error demo"
                    className="rounded-lg"
                    aspectRatio={16/9}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Performance Testing</CardTitle>
              <CardDescription>
                Test various operations and see their performance impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">CPU Intensive Operation</h3>
                <Button
                  onClick={() => {
                    const result = handleExpensiveOperation()
                    }}
                >
                  Run Expensive Operation
                </Button>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Simulated API Call</h3>
                <Button
                  onClick={async () => {
                    const result = await handleApiSimulation()
                    }}
                >
                  Simulate API Call
                </Button>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Memory Test</h3>
                <Button
                  onClick={() => {
                    // Create large array to test memory
                    const largeArray = new Array(1000000).fill('test')
                    // Let garbage collector clean it up
                  }}
                  variant="destructive"
                >
                  Allocate Memory
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}