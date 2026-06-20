export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getInvoice, getInvoiceFormOptions } from '@/lib/maintenance/queries'
import InvoiceDetail from './_components/invoice-detail'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ invoice, error }, formOptions] = await Promise.all([
    getInvoice(id),
    getInvoiceFormOptions(),
  ])

  if (!invoice && !error) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {error}
        </div>
      ) : (
        <InvoiceDetail invoice={invoice!} formOptions={formOptions} />
      )}
    </div>
  )
}
