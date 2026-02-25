import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  FileText, 
  CaretDown, 
  CaretUp,
  Download,
  Clipboard,
  CheckCircle
} from '@phosphor-icons/react'
import type { EnhancedLogEntry } from '@/components/HistoricalLogViewer'
import type { OpsFeedEntry } from '@/components/OperationsFeed'
import type { AssetLocation } from '@/components/GlobalAssetMap'

interface AfterActionReportProps {
  missionName: string
  missionObjective: string
  startTime: number
  endTime?: number
  logEntries: EnhancedLogEntry[]
  opsFeedEntries: OpsFeedEntry[]
  assets: AssetLocation[]
  agentCallsign: string
}

export function AfterActionReport({ 
  missionName,
  missionObjective,
  startTime,
  endTime,
  logEntries,
  opsFeedEntries,
  assets,
  agentCallsign
}: AfterActionReportProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [savedReports] = useKV<string[]>('saved-aar-reports', [])

  const generateReport = () => {
    const duration = endTime ? endTime - startTime : Date.now() - startTime
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))

    const criticalEvents = logEntries.filter(e => e.type === 'critical').length
    const warningEvents = logEntries.filter(e => e.type === 'warning').length
    const transmissions = opsFeedEntries.filter(e => e.type === 'transmission').length
    const alerts = opsFeedEntries.filter(e => e.type === 'alert').length

    const report = `
═══════════════════════════════════════════════
        AFTER ACTION REPORT (AAR)
        CLASSIFIED - EYES ONLY
═══════════════════════════════════════════════

MISSION: ${missionName}
OBJECTIVE: ${missionObjective}
PRIMARY AGENT: ${agentCallsign}
CLASSIFICATION: LEVEL 4

═══════════════════════════════════════════════
TEMPORAL DATA
═══════════════════════════════════════════════

Mission Start: ${new Date(startTime).toLocaleString()}
Mission End: ${endTime ? new Date(endTime).toLocaleString() : 'ONGOING'}
Duration: ${hours}h ${minutes}m
Status: ${endTime ? 'COMPLETED' : 'IN PROGRESS'}

═══════════════════════════════════════════════
ASSET DEPLOYMENT
═══════════════════════════════════════════════

Total Assets: ${assets.length}
${assets.map(a => `  - ${a.callsign}: ${a.status.toUpperCase()} (Grid ${String.fromCharCode(65 + a.gridX)}${a.gridY + 1})`).join('\n')}

═══════════════════════════════════════════════
OPERATIONAL SUMMARY
═══════════════════════════════════════════════

Total Log Events: ${logEntries.length}
  - Critical Events: ${criticalEvents}
  - Warning Events: ${warningEvents}
  - Success Events: ${logEntries.filter(e => e.type === 'success').length}
  - Mission Events: ${logEntries.filter(e => e.type === 'mission').length}

Communications Activity: ${opsFeedEntries.length}
  - Transmissions: ${transmissions}
  - Alert Broadcasts: ${alerts}
  - Check-ins: ${opsFeedEntries.filter(e => e.type === 'check-in').length}

═══════════════════════════════════════════════
CRITICAL INCIDENTS
═══════════════════════════════════════════════

${logEntries.filter(e => e.type === 'critical').length > 0 
  ? logEntries.filter(e => e.type === 'critical').map(e => 
      `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.title}\n  Details: ${e.details || 'N/A'}`
    ).join('\n\n')
  : 'No critical incidents reported.'}

═══════════════════════════════════════════════
KEY COMMUNICATIONS
═══════════════════════════════════════════════

${opsFeedEntries.filter(e => e.priority === 'critical' || e.priority === 'high').slice(0, 10).map(e => 
  `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.agentCallsign}\n  ${e.message}\n  Priority: ${e.priority?.toUpperCase() || 'NORMAL'}`
).join('\n\n')}

═══════════════════════════════════════════════
MISSION TIMELINE (Last 20 Events)
═══════════════════════════════════════════════

${logEntries.slice(-20).map(e => 
  `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.type.toUpperCase()}] ${e.title}`
).join('\n')}

═══════════════════════════════════════════════
ASSESSMENT & RECOMMENDATIONS
═══════════════════════════════════════════════

Threat Level Assessment: ${criticalEvents > 5 ? 'HIGH' : warningEvents > 10 ? 'MODERATE' : 'LOW'}
Mission Tempo: ${opsFeedEntries.length > 100 ? 'HIGH ACTIVITY' : opsFeedEntries.length > 50 ? 'MODERATE' : 'LOW ACTIVITY'}
Communications Status: ${transmissions > 50 ? 'ROBUST' : 'NOMINAL'}

${criticalEvents > 0 ? '⚠ ATTENTION: Critical events logged - recommend immediate debrief\n' : ''}
${warningEvents > 10 ? '⚠ Multiple warnings recorded - review operational procedures\n' : ''}
${alerts > 5 ? '⚠ High alert activity - assess threat response protocols\n' : ''}

═══════════════════════════════════════════════
REPORT METADATA
═══════════════════════════════════════════════

Generated: ${new Date().toLocaleString()}
Generated By: ${agentCallsign}
Report Classification: LEVEL 4 - EYES ONLY
Distribution: AUTHORIZED PERSONNEL ONLY

═══════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════
`

    return report.trim()
  }

  const handleCopyReport = () => {
    const report = generateReport()
    navigator.clipboard.writeText(report).then(() => {
      toast.success('Report copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy report')
    })
  }

  const handleDownloadReport = () => {
    const report = generateReport()
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AAR_${missionName.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Report downloaded')
  }

  const duration = endTime ? endTime - startTime : Date.now() - startTime
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <Card className="border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText weight="bold" className="text-primary" size={16} />
          <span className="text-xs tracking-[0.08em] uppercase">After Action Report</span>
          {savedReports && savedReports.length > 0 && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {savedReports.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </Button>
      </div>

      {isExpanded && (
        <>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Mission Duration</div>
                <div className="text-sm font-bold">{hours}h {minutes}m</div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Events</div>
                <div className="text-sm font-bold tabular-nums">{logEntries.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Critical</div>
                <div className="text-sm font-bold tabular-nums text-destructive">
                  {logEntries.filter(e => e.type === 'critical').length}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Communications</div>
                <div className="text-sm font-bold tabular-nums">{opsFeedEntries.length}</div>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Report Preview
            </div>
            <ScrollArea className="h-48 rounded border border-border bg-secondary/30 p-3">
              <pre className="text-[9px] font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                {generateReport().split('\n').slice(0, 30).join('\n')}
                {generateReport().split('\n').length > 30 && '\n\n... (truncated, download for full report)'}
              </pre>
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyReport}
              className="flex-1 text-xs"
              variant="outline"
            >
              <Clipboard weight="bold" size={14} className="mr-2" />
              Copy Report
            </Button>
            <Button
              onClick={handleDownloadReport}
              className="flex-1 text-xs"
            >
              <Download weight="bold" size={14} className="mr-2" />
              Download
            </Button>
          </div>

          <div className="border border-primary/30 bg-primary/5 rounded p-2">
            <div className="flex items-start gap-2">
              <CheckCircle weight="bold" size={14} className="text-primary mt-0.5" />
              <div className="text-[10px] text-muted-foreground">
                Report includes mission timeline, communications log, critical incidents, and operational metrics for post-mission analysis.
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
