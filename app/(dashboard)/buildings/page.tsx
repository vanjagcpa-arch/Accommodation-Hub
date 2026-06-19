'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Plus, Search, MapPin, Building2, Users, Eye, Pencil, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Building = {
  id: string
  name: string
  address: string
  total: number
  occupied: number
  available: number
  manager: string
  status: string
  manages_electricity: boolean
}

const initialBuildings: Building[] = [
  { id: 'b1', name: 'Parkview Apartments', address: '45 Park Street, Southbank VIC 3006', total: 12, occupied: 9, available: 3, manager: 'Sarah Chen', status: 'active', manages_electricity: true },
  { id: 'b2', name: 'University Gardens', address: '12 Swanston Street, Carlton VIC 3053', total: 20, occupied: 16, available: 4, manager: 'James Mitchell', status: 'active', manages_electricity: true },
  { id: 'b3', name: 'Flinders House', address: '88 Flinders Lane, Melbourne VIC 3000', total: 8, occupied: 6, available: 2, manager: 'Sarah Chen', status: 'active', manages_electricity: false },
  { id: 'b4', name: 'Brunswick Studios', address: '201 Sydney Road, Brunswick VIC 3056', total: 15, occupied: 11, available: 4, manager: 'Tom Walsh', status: 'active', manages_electricity: false },
  { id: 'b5', name: 'Fitzroy Terrace', address: '55 Johnston Street, Fitzroy VIC 3065', total: 10, occupied: 8, available: 2, manager: 'James Mitchell', status: 'active', manages_electricity: false },
  { id: 'b6', name: 'Monash Towers', address: '900 Dandenong Road, Caulfield East VIC 3145', total: 24, occupied: 20, available: 4, manager: 'Priya Nair', status: 'active', manages_electricity: true },
  { id: 'b7', name: 'St Kilda Residences', address: '14 Acland Street, St Kilda VIC 3182', total: 6, occupied: 4, available: 2, manager: 'Priya Nair', status: 'active', manages_electricity: false },
  { id: 'b8', name: 'Hawthorn Court', address: '72 Glenferrie Road, Hawthorn VIC 3122', total: 18, occupied: 15, available: 3, manager: 'Tom Walsh', status: 'active', manages_electricity: false },
  { id: 'b9', name: 'Docklands Point', address: '3 Waterfront Way, Docklands VIC 3008', total: 30, occupied: 24, available: 6, manager: 'Sarah Chen', status: 'active', manages_electricity: false },
  { id: 'b10', name: 'Footscray Heights', address: '120 Nicholson Street, Footscray VIC 3011', total: 16, occupied: 12, available: 4, manager: 'Tom Walsh', status: 'active', manages_electricity: false },
]

function ElectricityToggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        enabled ? 'bg-primary' : 'bg-line-strong'
      )}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
          enabled ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState(initialBuildings)
  const [search, setSearch] = useState('')

  const totalProperties = buildings.reduce((s, b) => s + b.total, 0)
  const totalOccupied = buildings.reduce((s, b) => s + b.occupied, 0)
  const electricityCount = buildings.filter(b => b.manages_electricity).length

  const filtered = buildings.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  )

  function toggleElectricity(id: string, value: boolean) {
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, manages_electricity: value } : b))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Buildings</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            {buildings.length} buildings · {totalProperties} properties · {Math.round((totalOccupied / totalProperties) * 100)}% occupied · {electricityCount} electricity retailing
          </p>
        </div>
        <Link href="/buildings/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Building
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Buildings', value: buildings.length, color: 'text-ink' },
          { label: 'Total Properties', value: totalProperties, color: 'text-ink' },
          { label: 'Occupied', value: totalOccupied, color: 'text-info' },
          { label: 'Electricity Retailing', value: electricityCount, color: 'text-warn' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-line bg-surface shadow-card p-4">
            <p className="text-xs text-ink-subtle font-medium">{card.label}</p>
            <p className={cn('text-2xl font-bold mt-1', card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Electricity retailing notice */}
      <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3">
        <Zap className="h-4 w-4 text-warn mt-0.5 shrink-0" />
        <p className="text-[13px] text-ink-muted">
          Toggle <span className="font-semibold text-ink">Electricity Retailing</span> per building to include its properties in the{' '}
          <Link href="/electricity" className="text-primary hover:underline font-medium">Electricity Billing module</Link>.
          All occupied units will receive monthly meter reads, invoicing and MYOB sync.
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                type="text"
                placeholder="Search buildings..."
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-ring/50 focus:border-primary text-ink placeholder:text-ink-faint"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Electricity Retailing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((building) => {
                const rate = Math.round((building.occupied / building.total) * 100)
                return (
                  <TableRow key={building.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-7 h-7 bg-primary-soft rounded-lg flex items-center justify-center">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="font-medium text-ink text-[13px]">{building.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-ink-faint mt-0.5 shrink-0" />
                        <span className="text-[13px] text-ink-muted">{building.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-ink text-[13px]">{building.total}</span>
                      <span className="text-ink-faint text-xs ml-1">units</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-3">
                          <span className="text-ink-muted">{building.occupied}/{building.total}</span>
                          <span className="font-semibold text-ink">{rate}%</span>
                        </div>
                        <div className="w-16 h-1.5 bg-line rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center text-[11px] font-semibold text-ink-muted">
                          {building.manager.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-[13px] text-ink-muted">{building.manager}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" dot>Active</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ElectricityToggle
                          enabled={building.manages_electricity}
                          onChange={(v) => toggleElectricity(building.id, v)}
                        />
                        {building.manages_electricity && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warn">
                            <Zap className="h-3 w-3" />
                            Retailing
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Link href={`/buildings/${building.id}`}>
                          <button className="p-1.5 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-muted" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <Link href={`/buildings/${building.id}/edit`}>
                          <button className="p-1.5 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-muted" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <Link href={`/properties?building=${building.id}`}>
                          <button className="p-1.5 rounded-md text-ink-faint hover:text-ink-muted hover:bg-surface-muted" title="Properties">
                            <Users className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
