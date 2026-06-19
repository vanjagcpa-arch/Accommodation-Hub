import { Users } from 'lucide-react'
import { getContractors } from '@/lib/maintenance/queries'
import ContractorsClient from './_components/contractors-client'

export const dynamic = 'force-dynamic'

export default async function MaintenanceContractorsPage() {
  const { contractors, error } = await getContractors()

  if (error && (error.includes('connect') || error.includes('relation') || error.includes('supabase'))) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="border-b border-line bg-surface px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink">Contractors</h1>
              <p className="text-sm text-ink-muted">Manage maintenance staff and trade contacts</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Supabase is not configured — connect your database to manage contractors.
          </div>
        </div>
      </div>
    )
  }

  return <ContractorsClient contractors={contractors} error={error} />
}
