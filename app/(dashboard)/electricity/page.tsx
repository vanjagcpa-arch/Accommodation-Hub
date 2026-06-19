'use client'

import Link from 'next/link'
import { Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ElectricityStatusBadge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import type { ElectricityStatus } from '@/types'
import { useState } from 'react'

const accounts = [
  { id: 'e1', tenant: 'Wei Zhang', property: 'Unit 101', building: 'Parkview Apts', status: 'active' as ElectricityStatus, tenantCode: 'EZ-10001', provider: 'Energy Australia', moveIn: '15 Jan 2026', consent: true },
  { id: 'e2', tenant: 'Priya Sharma', property: 'Unit 1A', building: 'University Gardens', status: 'active' as ElectricityStatus, tenantCode: 'EZ-10002', provider: 'Energy Australia', moveIn: '1 Feb 2026', consent: true },
  { id: 'e3', tenant: 'Carlos Rodriguez', property: 'Unit 501', building: 'Monash Towers', status: 'pending_consent' as ElectricityStatus, tenantCode: null, provider: null, moveIn: '1 Mar 2026', consent: false },
  { id: 'e4', tenant: 'Emma Wilson', property: 'Unit A02', building: 'Hawthorn Court', status: 'active' as ElectricityStatus, tenantCode: 'EZ-10003', provider: 'AGL', moveIn: '1 Mar 2026', consent: true },
  { id: 'e5', tenant: 'Nguyen Thi', property: 'Unit 102', building: 'Footscray Heights', status: 'pending_setup' as ElectricityStatus, tenantCode: 'EZ-10004', provider: 'Origin Energy', moveIn: '25 Jun 2026', consent: true },
  { id: 'e6', tenant: 'James Murphy', property: 'Unit 2A', building: 'University Gardens', status: 'active' as ElectricityStatus, tenantCode: 'EZ-10005', provider: 'Energy Australia', moveIn: '1 Apr 2026', consent: true },
  { id: 'e7', tenant: 'Fatima Al-Hassan', property: 'Unit G02', building: 'Brunswick Studios', status: 'pending_consent' as ElectricityStatus, tenantCode: null, provider: null, moveIn: '1 Jul 2026', consent: false },
  { id: 'e8', tenant: 'Liam Chen', property: 'Unit 1201', building: 'Docklands Point', status: 'closed' as ElectricityStatus, tenantCode: 'EZ-10006', provider: 'AGL', moveIn: '1 Jan 2026', consent: true },
  { id: 'e9', tenant: 'Not Assigned', property: 'Unit 802', building: 'Monash Towers', status: 'not_required' as ElectricityStatus, tenantCode: null, provider: null, moveIn: null, consent: false },
]

const tabs = [
  { id: 'all', label: 'All', count: accounts.length },
  { id: 'active', label: 'Active', count: accounts.filter(a => a.status === 'active').length },
  { id: 'pending_consent', label: 'Pending Consent', count: accounts.filter(a => a.status === 'pending_consent').length },
  { id: 'pending_setup', label: 'Pending Setup', count: accounts.filter(a => a.status === 'pending_setup').length },
  { id: 'closed', label: 'Closed', count: accounts.filter(a => a.status === 'closed').length },
]

export default function ElectricityPage() {
  const [activeTab, setActiveTab] = useState('all')

  const filtered = accounts.filter(a => {
    return activeTab === 'all' || a.status === activeTab
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Electricity Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {accounts.filter(a => a.status === 'active').length} active &middot;{' '}
            {accounts.filter(a => a.status === 'pending_consent').length} pending consent
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Export Ezidebit CSV
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-blue-600 text-xs font-bold">i</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">Ezidebit Integration Ready</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Electricity charge data is mapped to Ezidebit tenant codes. Use the Export CSV button to generate a charges file for upload to Ezidebit.
            External ID mapping is configured — connect your Ezidebit credentials in{' '}
            <Link href="/integrations" className="underline">Integrations</Link> to enable automated sync.
          </p>
        </div>
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
                  placeholder="Search tenant, property, building..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Buildings</option>
                <option>Parkview Apartments</option>
                <option>University Gardens</option>
                <option>Monash Towers</option>
                <option>Docklands Point</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenant Code</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Move-in Date</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium text-slate-900 text-sm">{acc.tenant}</TableCell>
                  <TableCell className="text-sm text-slate-700">{acc.property}</TableCell>
                  <TableCell className="text-sm text-slate-600">{acc.building}</TableCell>
                  <TableCell><ElectricityStatusBadge status={acc.status} /></TableCell>
                  <TableCell>
                    {acc.tenantCode ? (
                      <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">{acc.tenantCode}</code>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{acc.provider ?? '—'}</TableCell>
                  <TableCell className="text-sm text-slate-600">{acc.moveIn ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${acc.consent ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {acc.consent ? '✓' : '✕'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
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
