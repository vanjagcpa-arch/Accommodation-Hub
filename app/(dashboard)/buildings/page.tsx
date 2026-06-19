import Link from 'next/link'
import { Plus, Search, MapPin, Building2, Users, Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const buildings = [
  { id: 'b1', name: 'Parkview Apartments', address: '45 Park Street, Southbank VIC 3006', total: 12, occupied: 9, available: 3, manager: 'Sarah Chen', status: 'active' },
  { id: 'b2', name: 'University Gardens', address: '12 Swanston Street, Carlton VIC 3053', total: 20, occupied: 16, available: 4, manager: 'James Mitchell', status: 'active' },
  { id: 'b3', name: 'Flinders House', address: '88 Flinders Lane, Melbourne VIC 3000', total: 8, occupied: 6, available: 2, manager: 'Sarah Chen', status: 'active' },
  { id: 'b4', name: 'Brunswick Studios', address: '201 Sydney Road, Brunswick VIC 3056', total: 15, occupied: 11, available: 4, manager: 'Tom Walsh', status: 'active' },
  { id: 'b5', name: 'Fitzroy Terrace', address: '55 Johnston Street, Fitzroy VIC 3065', total: 10, occupied: 8, available: 2, manager: 'James Mitchell', status: 'active' },
  { id: 'b6', name: 'Monash Towers', address: '900 Dandenong Road, Caulfield East VIC 3145', total: 24, occupied: 20, available: 4, manager: 'Priya Nair', status: 'active' },
  { id: 'b7', name: 'St Kilda Residences', address: '14 Acland Street, St Kilda VIC 3182', total: 6, occupied: 4, available: 2, manager: 'Priya Nair', status: 'active' },
  { id: 'b8', name: 'Hawthorn Court', address: '72 Glenferrie Road, Hawthorn VIC 3122', total: 18, occupied: 15, available: 3, manager: 'Tom Walsh', status: 'active' },
  { id: 'b9', name: 'Docklands Point', address: '3 Waterfront Way, Docklands VIC 3008', total: 30, occupied: 24, available: 6, manager: 'Sarah Chen', status: 'active' },
  { id: 'b10', name: 'Footscray Heights', address: '120 Nicholson Street, Footscray VIC 3011', total: 16, occupied: 12, available: 4, manager: 'Tom Walsh', status: 'active' },
]

export default function BuildingsPage() {
  const totalProperties = buildings.reduce((s, b) => s + b.total, 0)
  const totalOccupied = buildings.reduce((s, b) => s + b.occupied, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buildings</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {buildings.length} buildings · {totalProperties} properties · {Math.round((totalOccupied / totalProperties) * 100)}% occupied
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 font-medium">Total Buildings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{buildings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 font-medium">Total Properties</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalProperties}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 font-medium">Occupied</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalOccupied}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 font-medium">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalProperties - totalOccupied}</p>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search buildings by name or address..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Managers</option>
              <option>Sarah Chen</option>
              <option>James Mitchell</option>
              <option>Tom Walsh</option>
              <option>Priya Nair</option>
            </select>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All States</option>
              <option>VIC</option>
              <option>NSW</option>
              <option>QLD</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings.map((building) => {
                const rate = Math.round((building.occupied / building.total) * 100)
                return (
                  <TableRow key={building.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{building.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">{building.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{building.total}</span>
                        <span className="text-slate-400 text-xs">total</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{building.occupied}/{building.total}</span>
                          <span className="font-semibold text-slate-700">{rate}%</span>
                        </div>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                          {building.manager.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-700">{building.manager}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/buildings/${building.id}`}>
                          <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link href={`/buildings/${building.id}/edit`}>
                          <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link href={`/properties?building=${building.id}`}>
                          <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="View Properties">
                            <Users className="h-4 w-4" />
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
