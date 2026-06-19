import { RefreshCw } from 'lucide-react'
import { getRecurringRules, getMaintenanceFormOptions } from '@/lib/maintenance/queries'
import RecurringClient from './_components/recurring-client'

export const dynamic = 'force-dynamic'

export default async function RecurringMaintenancePage() {
  const [rulesResult, options] = await Promise.all([
    getRecurringRules(),
    getMaintenanceFormOptions(),
  ])

  if (rulesResult.error && (rulesResult.error.includes('connect') || rulesResult.error.includes('relation') || rulesResult.error.includes('supabase'))) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="border-b border-line bg-surface px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink">Recurring Maintenance</h1>
              <p className="text-sm text-ink-muted">Scheduled recurring maintenance rules</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Supabase is not configured — connect your database to manage recurring rules.
          </div>
        </div>
      </div>
    )
  }

  return (
    <RecurringClient
      rules={rulesResult.rules}
      buildings={options.buildings}
      properties={options.properties}
      staff={options.staff}
      error={rulesResult.error}
    />
  )
}
