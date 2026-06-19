'use client'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ApplicationStatusBadge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import type { ApplicationStatus } from '@/types'
import { useState } from 'react'

const applications = [
  { id: 'a1', applicant: 'Mei Lin Chen', email: 'meilin.chen@student.unimelb.edu.au', phone: '0411 222 333', property: 'Unit 102', building: 'Parkview Apartments', moveIn: '1 Jul 2026', status: 'reviewing' as ApplicationStatus, agent: 'CBD Referrals', university: 'University of Melbourne', created: '16 Jun 2026' },
  { id: 'a2', applicant: 'Arjun Patel', email: 'arjun.p@student.rmit.edu.au', phone: '0422 333 444', property: 'Unit 1B', building: 'University Gardens', moveIn: '1 Jul 2026', status: 'new' as ApplicationStatus, agent: 'Direct', university: 'RMIT University', created: '17 Jun 2026' },
  { id: 'a3', applicant: 'Sophie Thompson', email: 'sophie.t@student.monash.edu', phone: '0433 444 555', property: 'Unit B01', building: 'Hawthorn Court', moveIn: '1 Aug 2026', status: 'approved' as ApplicationStatus, agent: 'Suburban Lets', university: 'Monash University', created: '15 Jun 2026' },
  { id: 'a4', applicant: 'Hamid Rashidi', email: 'h.rashidi@student.vu.edu.au', phone: '0444 555 666', property: 'Unit 101', building: 'Footscray Heights', moveIn: '25 Jun 2026', status: 'new' as ApplicationStatus, agent: 'Direct', university: 'Victoria University', created: '18 Jun 2026' },
  { id: 'a5', applicant: 'Yuki Tanaka', email: 'yuki.t@student.unimelb.edu.au', phone: '0455 666 777', property: 'Unit 502', building: 'Monash Towers', moveIn: '1 Jul 2026', status: 'reviewing' as ApplicationStatus, agent: 'StudyLink Realty', university: 'Monash University', created: '14 Jun 2026' },
  { id: 'a6', applicant: 'Daniel Kim', email: 'd.kim@student.swin.edu.au', phone: '0466 777 888', property: 'Unit A01', building: 'Hawthorn Court', moveIn: '10 Jul 2026', status: 'rejected' as ApplicationStatus, agent: 'Direct', university: 'Swinburne University', created: '12 Jun 2026' },
  { id: 'a7', applicant: 'Aisha Mohammed', email: 'a.mohammed@student.rmit.edu.au', phone: '0477 888 999', property: 'Unit G01', building: 'Brunswick Studios', moveIn: '1 Jul 2026', status: 'approved' as ApplicationStatus, agent: 'CBD Referrals', university: 'RMIT University', created: '11 Jun 2026' },
  { id: 'a8', applicant: 'Lucas Ferreira', email: 'l.ferreira@student.monash.edu', phone: '0488 999 000', property: 'Unit 1201', building: 'Docklands Point', moveIn: '1 Jul 2026', status: 'moved_in' as ApplicationStatus, agent: 'Marine Lets', university: 'Monash University', created: '5 Jun 2026' },
]

const tabs = [
  { id: 'all', label: 'All', count: applications.length },
  { id: 'new', label: 'New', count: applications.filter(a => a.status === 'new').length },
  { id: 'reviewing', label: 'Reviewing', count: applications.filter(a => a.status === 'reviewing').length },
  { id: 'approved', label: 'Approved', count: applications.filter(a => a.status === 'approved').length },
  { id: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length },
]

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = applications.filter(a => {
    const matchesTab = activeTab === 'all' || a.status === activeTab
    const matchesSearch = !search ||
      a.applicant.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.property.toLowerCase().includes(search.toLowerCase()) ||
      a.building.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{applications.length} total applications</p>
        </div>
        <Link href="/applications/new">
          <Button><Plus className="h-4 w-4" />New Application</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} />
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applicant, email, property..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Buildings</option>
                <option>Parkview Apartments</option>
                <option>University Gardens</option>
                <option>Hawthorn Court</option>
                <option>Footscray Heights</option>
              </select>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Agents</option>
                <option>Direct</option>
                <option>CBD Referrals</option>
                <option>Suburban Lets</option>
                <option>StudyLink Realty</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Move-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link href={`/applications/${app.id}`} className="block hover:text-green-600">
                      <p className="font-medium text-slate-900 text-sm">{app.applicant}</p>
                      <p className="text-xs text-slate-400">{app.email}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-700 font-medium">{app.property}</p>
                    <p className="text-xs text-slate-400">{app.building}</p>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-[140px] truncate">{app.university}</TableCell>
                  <TableCell className="text-sm text-slate-600">{app.moveIn}</TableCell>
                  <TableCell><ApplicationStatusBadge status={app.status} /></TableCell>
                  <TableCell className="text-sm text-slate-600">{app.agent}</TableCell>
                  <TableCell className="text-xs text-slate-400">{app.created}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
