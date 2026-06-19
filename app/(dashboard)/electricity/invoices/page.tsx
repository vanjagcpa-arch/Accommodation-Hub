import { FileText } from 'lucide-react'

export default function ElectricityInvoicesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Electricity Invoices</h1>
            <p className="text-sm text-ink-muted">Generate, send and track electricity invoices</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted">
            <FileText className="h-8 w-8 text-ink-subtle" />
          </div>
          <h2 className="mb-1 text-base font-medium text-ink">Coming soon</h2>
          <p className="text-sm text-ink-muted">
            Invoice generation, email delivery and MYOB sync will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
