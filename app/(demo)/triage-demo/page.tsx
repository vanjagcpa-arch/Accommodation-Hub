import { notFound } from 'next/navigation'
import TriageChat from '@/components/maintenance/TriageChat'

export const dynamic = 'force-dynamic'

export default function TriageDemoPage() {
  if (!process.env.TRIAGE_AGENT_ENABLED) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Triage Agent — Demo</h1>
          <p className="text-[13px] text-ink-muted mt-1">
            Dev-only harness. Set <code className="bg-surface-muted px-1 rounded text-[12px]">TRIAGE_AGENT_ENABLED=1</code> to access.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface shadow-card p-6 h-[640px] flex flex-col">
          <TriageChat
            source="web"
            onJobCreated={(jobId) => console.log('[demo] job created:', jobId)}
            onHandoff={() => alert('Handing off to a person — in production this would open the PM contact flow.')}
          />
        </div>
      </div>
    </div>
  )
}
