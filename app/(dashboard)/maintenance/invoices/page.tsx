export const dynamic = 'force-dynamic'

import { Receipt } from 'lucide-react'
import { getInvoices, getInvoiceFormOptions } from '@/lib/maintenance/queries'
import InvoicesClient from './_components/invoices-client'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const status = sp.status ?? 'all'

  const [{ invoices, error }, formOptions] = await Promise.all([
    getInvoices(status),
    getInvoiceFormOptions(),
  ])

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Invoices</h1>
            <p className="text-sm text-ink-muted">Owner invoicing and MYOB reconciliation</p>
          </div>
        </div>
      </div>

      <InvoicesClient
        invoices={invoices}
        error={error}
        currentStatus={status}
        formOptions={formOptions}
      />
    </div>
  )
}
