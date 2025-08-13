import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Sparkles, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AIPickWidget() {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4">
          <Sparkles className="h-24 w-24" />
        </div>
        <div className="absolute bottom-4 left-4">
          <MessageSquare className="h-16 w-16" />
        </div>
      </div>
      
      <div className="relative p-6 h-full flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              AI Pick
            </span>
          </div>
          <h3 className="text-xl font-bold mb-3">
            Personalized for You
          </h3>
          <p className="text-white/90 text-sm mb-4">
            Get AI-powered recommendations based on your interests and Dubai trends
          </p>
        </div>
        
        <Button 
          asChild 
          variant="secondary" 
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          <Link to="/chat">
            Ask Ayyan X
          </Link>
        </Button>
      </div>
    </Card>
  )
} 