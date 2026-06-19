import { TrendingUp, Users, Wrench, Building2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const buildingOccupancy = [
  { name: 'Parkview Apts', total: 12, occupied: 9 },
  { name: 'University Gardens', total: 20, occupied: 16 },
  { name: 'Flinders House', total: 8, occupied: 6 },
  { name: 'Brunswick Studios', total: 15, occupied: 11 },
  { name: 'Fitzroy Terrace', total: 10, occupied: 8 },
  { name: 'Monash Towers', total: 24, occupied: 20 },
  { name: 'St Kilda Res.', total: 6, occupied: 4 },
  { name: 'Hawthorn Court', total: 18, occupied: 15 },
  { name: 'Docklands Point', total: 30, occupied: 24 },
  { name: 'Footscray Heights', total: 16, occupied: 12 },
]

const maintenanceByStatus = [
  { label: 'New', count: 2, color: 'bg-blue-400' },
  { label: 'Triage', count: 1, color: 'bg-purple-400' },
  { label: 'Assigned', count: 1, color: 'bg-slate-400' },
  { label: 'In Progress', count: 1, color: 'bg-amber-400' },
  { label: 'Waiting Parts', count: 1, color: 'bg-orange-400' },
  { label: 'Completed', count: 2, color: 'bg-green-400' },
]

const applicationsThisMonth = [
  { week: 'Week 1', count: 4 },
  { week: 'Week 2', count: 6 },
  { week: 'Week 3', count: 3 },
  { week: 'Week 4 (partial)', count: 2 },
]

const totalApplications = applicationsThisMonth.reduce((s, w) => s + w.count, 0)
const maxApps = Math.max(...applicationsThisMonth.map(w => w.count))

const totalProperties = buildingOccupancy.reduce((s, b) => s + b.total, 0)
const totalOccupied = buildingOccupancy.reduce((s, b) => s + b.occupied, 0)
const overallRate = Math.round((totalOccupied / totalProperties) * 100)

export default function ReportingPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reporting</h1>
        <p className="text-slate-500 text-sm mt-0.5">Portfolio overview — June 2026</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Occupancy Rate</p>
              <p className="text-2xl font-bold text-slate-900">{overallRate}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active Tenants</p>
              <p className="text-2xl font-bold text-slate-900">{totalOccupied}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-lg">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Open Jobs</p>
              <p className="text-2xl font-bold text-slate-900">6</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Apps This Month</p>
              <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy by Building</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {buildingOccupancy.map((b) => {
              const rate = Math.round((b.occupied / b.total) * 100)
              return (
                <div key={b.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium truncate max-w-[180px]">{b.name}</span>
                    <div className="flex items-center gap-2 text-slate-500 shrink-0">
                      <span className="text-xs">{b.occupied}/{b.total}</span>
                      <span className="font-semibold text-slate-900 w-10 text-right">{rate}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-blue-500' : 'bg-amber-400'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceByStatus.map((item) => {
                const total = maintenanceByStatus.reduce((s, i) => s + i.count, 0)
                const pct = Math.round((item.count / total) * 100)
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="font-semibold text-slate-900">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">Total Open Jobs</p>
              <p className="text-3xl font-bold text-slate-900">
                {maintenanceByStatus.filter(s => !['Completed', 'Closed', 'Cancelled'].includes(s.label)).reduce((s, i) => s + i.count, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Applications — June 2026</CardTitle>
            <p className="text-sm text-slate-500">{totalApplications} total this month</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-6 h-40 border-b border-slate-200">
            {applicationsThisMonth.map((week) => {
              const height = maxApps > 0 ? Math.round((week.count / maxApps) * 100) : 0
              return (
                <div key={week.week} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-sm font-semibold text-slate-700">{week.count}</span>
                  <div
                    className="w-full bg-green-500 rounded-t-md hover:bg-green-400 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 8)}%` }}
                    title={`${week.week}: ${week.count} applications`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-6 mt-2">
            {applicationsThisMonth.map((week) => (
              <div key={week.week} className="flex-1 text-center">
                <span className="text-xs text-slate-400">{week.week}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">4</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-slate-500">Pending Review</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">1</p>
              <p className="text-xs text-slate-500">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Electricity Accounts Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Active', value: 5, color: 'text-green-600 bg-green-50' },
              { label: 'Pending Consent', value: 2, color: 'text-amber-600 bg-amber-50' },
              { label: 'Pending Setup', value: 1, color: 'text-purple-600 bg-purple-50' },
              { label: 'Closed', value: 1, color: 'text-slate-500 bg-slate-50' },
              { label: 'Not Required', value: 1, color: 'text-slate-400 bg-slate-50' },
            ].map(item => (
              <div key={item.label} className={`p-4 rounded-xl border border-slate-200 text-center ${item.color}`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-medium mt-1 text-current opacity-80">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
