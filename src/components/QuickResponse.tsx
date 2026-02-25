import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatCircleDots, PaperPlaneTilt, CaretDown } from '@phosphor-icons/react'

interface QuickResponseProps {
  onSendResponse: (response: string, category: string) => void
  agentCallsign: string
}

export function QuickResponse({ onSendResponse, agentCallsign }: QuickResponseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const responseCategories = {
    status: {
      label: 'Status',
      responses: [
        'Roger that',
        'Copy all',
        'Wilco',
        'Affirmative',
        'Negative',
        'Standby'
      ]
    },
    commands: {
      label: 'Commands',
      responses: [
        'Hold position',
        'Proceed to waypoint',
        'Fall back',
        'Maintain radio silence',
        'Report in 5 mikes',
        'RTB when able'
      ]
    },
    intel: {
      label: 'Intel',
      responses: [
        'Package located',
        'Area clear',
        'Contact verified',
        'Threat neutralized',
        'Need backup',
        'Mission compromised'
      ]
    },
    tactical: {
      label: 'Tactical',
      responses: [
        'Go weapons hot',
        'Weapons hold',
        'Exfil requested',
        'Change to channel 2',
        'Switch to secure comms',
        'Mission abort'
      ]
    }
  }

  const handleSendResponse = (response: string, category: string) => {
    onSendResponse(response, category)
    setSelectedCategory(null)
  }

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <ChatCircleDots weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">Quick Response</span>
          <CaretDown 
            weight="bold" 
            size={12} 
            className={`text-primary transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          />
        </div>
        <Badge variant="outline" className="text-[9px] px-2 py-0 border-primary text-primary">
          TO M
        </Badge>
      </div>

      {!isCollapsed && (
        <>
          {!selectedCategory ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(responseCategories).map(([key, category]) => (
                <Button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  variant="outline"
                  className="text-[10px] tracking-wider border-primary/50 hover:bg-primary/20 hover:border-primary"
                  size="sm"
                >
                  {category.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                  {responseCategories[selectedCategory as keyof typeof responseCategories].label}
                </span>
                <Button
                  onClick={() => setSelectedCategory(null)}
                  variant="ghost"
                  className="text-[9px] h-5 px-2 text-muted-foreground hover:text-foreground"
                  size="sm"
                >
                  BACK
                </Button>
              </div>
              <div className="grid gap-1.5">
                {responseCategories[selectedCategory as keyof typeof responseCategories].responses.map((response) => (
                  <Button
                    key={response}
                    onClick={() => handleSendResponse(response, selectedCategory)}
                    variant="outline"
                    className="text-[10px] justify-start border-primary/30 hover:bg-primary/20 hover:border-primary h-auto py-2"
                    size="sm"
                  >
                    <PaperPlaneTilt weight="bold" size={12} className="mr-2 shrink-0" />
                    <span className="truncate">{response}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
