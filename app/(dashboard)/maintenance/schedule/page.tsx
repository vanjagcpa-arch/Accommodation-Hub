import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getScheduleJobs, getTravelMap } from '@/lib/maintenance/queries'
import { ScheduleBoard } from '../_components/schedule-board'

export const dynamic = 'force-dynamic'

function getMondayStr(weekParam?: string): string {
  const base = weekParam ? new Date(weekParam + 'T00:00:00') : new Date()
  if (isNaN(base.getTime())) return getMondayStr()
  const day = base.getDay()
  const diff = day === 0 ? -6 : 1 - day
  base.setDate(base.getDate() + diff)
  return base.toISOString().slice(0, 10)
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[] }>
}) {
  const sp = await searchParams
  const weekParam = Array.isArray(sp.week) ? sp.week[0] : sp.week
  const weekStart = getMondayStr(weekParam)
  const [data, travelMap] = await Promise.all([
    getScheduleJobs(weekStart),
    getTravelMap(),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Schedule</h1>
          <p className="text-sm text-ink-muted mt-0.5">Maintenance jobs by staff and week</p>
        </div>
        <Link href="/maintenance/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Job</Button>
        </Link>
      </div>

      {data.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {data.error.includes('relation') || data.error.includes('connect')
            ? 'Schedule data is unavailable — configure Supabase and run migrations to enable this view.'
            : `Failed to load schedule: ${data.error}`}
        </div>
      ) : (
        <ScheduleBoard
          weekStart={weekStart}
          byStaff={data.byStaff}
          unscheduled={data.unscheduled}
          staff={data.staff}
          travelMap={travelMap}
        />
      )}
    </div>
  )
}
