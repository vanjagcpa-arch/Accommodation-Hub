import { Gauge } from 'lucide-react'

export default function ElectricityMeteringPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Metering</h1>
            <p className="text-sm text-ink-muted">Import meter reads and detect anomalies</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted">
            <Gauge className="h-8 w-8 text-ink-subtle" />
          </div>
          <h2 className="mb-1 text-base font-medium text-ink">Coming soon</h2>
          <p className="text-sm text-ink-muted">
            Monthly meter read imports, anomaly detection and read history will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
