'use client'

import Link from 'next/link'
import { Plus, Search, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import type { MaintenancePriority, MaintenanceStatus } from '@/types'
import { useState } from 'react'

const jobs = [
  { id: 'm1', title: 'Water damage - ceiling stain', property: 'Unit 301', building: 'Parkview Apts', priority: 'urgent' as MaintenancePriority, status: 'in_progress' as MaintenanceStatus, assignee: 'Bob Plumber', due: '22 Jun 2026', type: 'Plumbing', created: '19 Jun 2026', overdue: true },
  { id: 'm2', title: 'Air conditioner not cooling', property: 'Unit 101', building: 'Parkview Apts', priority: 'high' as MaintenancePriority, status: 'new' as MaintenanceStatus, assignee: null, due: '25 Jun 2026', type: 'HVAC', created: '18 Jun 2026', overdue: false },
  { id: 'm3', title: 'Broken window lock', property: 'Unit 501', building: 'Monash Towers', priority: 'high' as MaintenancePriority, status: 'scheduled' as MaintenanceStatus, assignee: 'Jake Trades', due: '26 Jun 2026', type: 'Security', created: '17 Jun 2026', overdue: false },
  { id: 'm4', title: 'Leaking tap in bathroom', property: 'Unit 1A', building: 'University Gardens', priority: 'medium' as MaintenancePriority, status: 'assigned' as MaintenanceStatus, assignee: 'Bob Plumber', due: '27 Jun 2026', type: 'Plumbing', created: '16 Jun 2026', overdue: false },
  { id: 'm5', title: 'Dishwasher leaking', property: 'Unit G02', building: 'Brunswick Studios', priority: 'high' as MaintenancePriority, status: 'waiting_parts' as MaintenanceStatus, assignee: 'Jake Trades', due: '28 Jun 2026', type: 'Appliance', created: '15 Jun 2026', overdue: false },
  { id: 'm6', title: 'Oven not heating', property: 'Unit 1202', building: 'Docklands Point', priority: 'medium' as MaintenancePriority, status: 'triage' as MaintenanceStatus, assignee: null, due: '30 Jun 2026', type: 'Appliance', created: '14 Jun 2026', overdue: false },
  { id: 'm7', title: 'Exhaust fan rattling', property: 'Unit A02', building: 'Hawthorn Court', priority: 'medium' as MaintenancePriority, status: 'completed' as MaintenanceStatus, assignee: 'Jake Trades', due: '20 Jun 2026', type: 'Electrical', created: '12 Jun 2026', overdue: false },
  { id: 'm8', title: 'Light globe replacement', property: 'Common Area L1', building: 'Footscray Heights', priority: 'low' as MaintenancePriority, status: 'completed' as MaintenanceStatus, assignee: 'Mike Fix', due: '18 Jun 2026', type: 'Electrical', created: '10 Jun 2026', overdue: false },
]

const tabs = [
  { id: 'all', label: 'All Jobs', count: jobs.filter(j => j.status !== 'completed' && j.status !== 'closed' && j.status !== 'cancelled').length },
  { id: 'my', label: 'My Jobs', count: jobs.filter(j => j.assignee === 'Bob Plumber').length },
  { id: 'today', label: 'Today', count: 2 },
  { id: 'overdue', label: 'Overdue', count: jobs.filter(j => j.overdue).length },
]

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = jobs.filter(j => {
    if (activeTab === 'my') return j.assignee === 'Bob Plumber'
    if (activeTab === 'overdue') return j.overdue
    if (activeTab === 'today') return true // mock: show all for demo
    const matchesSearch = !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.property.toLowerCase().includes(search.toLowerCase()) ||
      j.building.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {jobs.filter(j => !['completed', 'closed', 'cancelled'].includes(j.status)).length} open jobs &middot;{' '}
            {jobs.filter(j => j.priority === 'urgent').length} urgent
          </p>
        </div>
        <Link href="/maintenance/new">
          <Button><Plus className="h-4 w-4" />New Job</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} />
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search job title, property, building..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="triage">Triage</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_parts">Waiting Parts</option>
                <option value="completed">Completed</option>
              </select>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Issue Types</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>HVAC</option>
                <option>Appliance</option>
                <option>Security</option>
                <option>Structural</option>
              </select>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Assignees</option>
                <option>Unassigned</option>
                <option>Bob Plumber</option>
                <option>Jake Trades</option>
                <option>Mike Fix</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="max-w-[200px]">
                    <Link href={`/maintenance/${job.id}`} className="hover:text-green-600">
                      <p className="font-medium text-slate-900 text-sm truncate">{job.title}</p>
                      <p className="text-xs text-slate-400">#{job.id} · {job.created}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-700">{job.property}</p>
                    <p className="text-xs text-slate-400">{job.building}</p>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{job.type}</TableCell>
                  <TableCell><MaintenancePriorityBadge priority={job.priority} /></TableCell>
                  <TableCell><MaintenanceStatusBadge status={job.status} /></TableCell>
                  <TableCell>
                    {job.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                          {job.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-700">{job.assignee}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1.5 text-sm ${job.overdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      {job.due}
                      {job.overdue && <span className="text-xs font-semibold bg-red-100 text-red-600 px-1 py-0.5 rounded">OVERDUE</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/maintenance/${job.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
