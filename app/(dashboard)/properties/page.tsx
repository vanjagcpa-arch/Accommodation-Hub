import Link from 'next/link'
import { Plus, Search, Bed, Bath } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PropertyStatusBadge } from '@/components/ui/badge'
import type { PropertyStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'

const properties = [
  { id: 'p1', unit: '101', building: 'Parkview Apartments', type: 'Studio', beds: 0, baths: 1, rent: 1650, status: 'occupied' as PropertyStatus, available: null, manager: 'Sarah Chen', agentVisible: true },
  { id: 'p2', unit: '102', building: 'Parkview Apartments', type: 'Studio', beds: 0, baths: 1, rent: 1650, status: 'available' as PropertyStatus, available: '1 Jul 2026', manager: 'Sarah Chen', agentVisible: true },
  { id: 'p3', unit: '201', building: 'Parkview Apartments', type: '1 Bedroom', beds: 1, baths: 1, rent: 2100, status: 'occupied' as PropertyStatus, available: null, manager: 'Sarah Chen', agentVisible: true },
  { id: 'p4', unit: '202', building: 'Parkview Apartments', type: '1 Bedroom', beds: 1, baths: 1, rent: 2100, status: 'available' as PropertyStatus, available: '15 Jul 2026', manager: 'Sarah Chen', agentVisible: true },
  { id: 'p5', unit: '301', building: 'Parkview Apartments', type: '2 Bedroom', beds: 2, baths: 1, rent: 2800, status: 'maintenance_hold' as PropertyStatus, available: null, manager: 'Sarah Chen', agentVisible: false },
  { id: 'p6', unit: '1A', building: 'University Gardens', type: 'Studio', beds: 0, baths: 1, rent: 1450, status: 'occupied' as PropertyStatus, available: null, manager: 'James Mitchell', agentVisible: true },
  { id: 'p7', unit: '1B', building: 'University Gardens', type: 'Studio', beds: 0, baths: 1, rent: 1450, status: 'available' as PropertyStatus, available: '1 Jul 2026', manager: 'James Mitchell', agentVisible: true },
  { id: 'p8', unit: '2A', building: 'University Gardens', type: '1 Bedroom', beds: 1, baths: 1, rent: 1950, status: 'occupied' as PropertyStatus, available: null, manager: 'James Mitchell', agentVisible: true },
  { id: 'p9', unit: '2B', building: 'University Gardens', type: '1 Bedroom', beds: 1, baths: 1, rent: 1950, status: 'coming_soon' as PropertyStatus, available: '1 Aug 2026', manager: 'James Mitchell', agentVisible: true },
  { id: 'p10', unit: '501', building: 'Monash Towers', type: 'Studio', beds: 0, baths: 1, rent: 1550, status: 'occupied' as PropertyStatus, available: null, manager: 'Priya Nair', agentVisible: true },
  { id: 'p11', unit: '502', building: 'Monash Towers', type: 'Studio', beds: 0, baths: 1, rent: 1550, status: 'available' as PropertyStatus, available: '1 Jul 2026', manager: 'Priya Nair', agentVisible: true },
  { id: 'p12', unit: '1201', building: 'Docklands Point', type: '1 Bedroom', beds: 1, baths: 1, rent: 2450, status: 'available' as PropertyStatus, available: '1 Jul 2026', manager: 'Sarah Chen', agentVisible: true },
  { id: 'p13', unit: 'G01', building: 'Brunswick Studios', type: 'Studio', beds: 0, baths: 1, rent: 1200, status: 'available' as PropertyStatus, available: '25 Jun 2026', manager: 'Tom Walsh', agentVisible: true },
  { id: 'p14', unit: 'A01', building: 'Hawthorn Court', type: '1 Bedroom', beds: 1, baths: 1, rent: 2200, status: 'available' as PropertyStatus, available: '10 Jul 2026', manager: 'Tom Walsh', agentVisible: true },
  { id: 'p15', unit: '101', building: 'Footscray Heights', type: 'Studio', beds: 0, baths: 1, rent: 1100, status: 'available' as PropertyStatus, available: '1 Jul 2026', manager: 'Tom Walsh', agentVisible: true },
]

export default function PropertiesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {properties.length} properties across 10 buildings
          </p>
        </div>
        <Link href="/properties/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search unit number..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Buildings</option>
              <option>Parkview Apartments</option>
              <option>University Gardens</option>
              <option>Monash Towers</option>
              <option>Docklands Point</option>
              <option>Brunswick Studios</option>
              <option>Hawthorn Court</option>
              <option>Footscray Heights</option>
            </select>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="on_hold">On Hold</option>
              <option value="maintenance_hold">Maintenance Hold</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Types</option>
              <option>Studio</option>
              <option>1 Bedroom</option>
              <option>2 Bedroom</option>
              <option>3 Bedroom</option>
            </select>
            <div className="flex items-center gap-2">
              <input type="date" className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Available from" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Beds/Bath</TableHead>
                <TableHead>Rent/wk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Visible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/properties/${p.id}`} className="font-semibold text-slate-900 hover:text-green-600">
                      {p.unit}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm max-w-[180px] truncate">{p.building}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{p.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-0.5">
                        <Bed className="h-3 w-3" />{p.beds === 0 ? 'Studio' : p.beds}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Bath className="h-3 w-3" />{p.baths}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{formatCurrency(p.rent)}</TableCell>
                  <TableCell><PropertyStatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-slate-500 text-sm">{p.available ?? '—'}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{p.manager}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${p.agentVisible ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {p.agentVisible ? '✓' : '✕'}
                    </span>
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
