'use client'

import { AIAgentsHeader } from './presentation/components/ai-agents-header'
import { AIAgentsDashboard } from './presentation/components/ai-agents-dashboard'

export default function AIAgentsDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <AIAgentsHeader />
        <AIAgentsDashboard />
      </div>
    </div>
  )
}
