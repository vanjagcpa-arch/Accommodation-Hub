export const dynamic = 'force-dynamic'

import { Tag } from 'lucide-react'
import { getServices } from '@/lib/maintenance/queries'
import { getMaintenanceFormOptions } from '@/lib/maintenance/queries'
import ServicesClient from './_components/services-client'

export default async function ServicesPage() {
  const [{ services, error }, { categories }] = await Promise.all([
    getServices(),
    getMaintenanceFormOptions(),
  ])

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Services &amp; Pricing</h1>
            <p className="text-sm text-ink-muted">
              {services.length} service{services.length !== 1 ? 's' : ''} in your pricing catalog
            </p>
          </div>
        </div>
      </div>

      <ServicesClient services={services} categories={categories} error={error} />
    </div>
  )
}
