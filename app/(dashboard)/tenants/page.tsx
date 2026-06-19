import Link from 'next/link'
import { Plus, Search, Mail, Phone, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const tenants = [
  { id: 't1', name: 'Wei Zhang', email: 'wei.zhang@student.unimelb.edu.au', phone: '0412 345 678', university: 'University of Melbourne', course: 'Master of Engineering', property: 'Unit 101', building: 'Parkview Apts', leaseEnd: '31 Jan 2027', nationality: 'Chinese', status: 'active' },
  { id: 't2', name: 'Priya Sharma', email: 'priya.sharma@student.rmit.edu.au', phone: '0423 456 789', university: 'RMIT University', course: 'Bachelor of IT', property: 'Unit 1A', building: 'University Gardens', leaseEnd: '31 Jul 2026', nationality: 'Indian', status: 'active' },
  { id: 't3', name: 'Carlos Rodriguez', email: 'carlos.r@student.monash.edu', phone: '0434 567 890', university: 'Monash University', course: 'PhD Computer Science', property: 'Unit 501', building: 'Monash Towers', leaseEnd: '31 Dec 2027', nationality: 'Brazilian', status: 'active' },
  { id: 't4', name: 'Emma Wilson', email: 'emma.wilson@student.swin.edu.au', phone: '0445 678 901', university: 'Swinburne University', course: 'Bachelor of Design', property: 'Unit A02', building: 'Hawthorn Court', leaseEnd: '30 Jun 2026', nationality: 'Australian', status: 'active' },
  { id: 't5', name: 'Nguyen Thi', email: 'nguyen.thi@student.vu.edu.au', phone: '0456 789 012', university: 'Victoria University', course: 'Bachelor of Business', property: 'Unit 102', building: 'Footscray Heights', leaseEnd: '31 Dec 2026', nationality: 'Vietnamese', status: 'active' },
  { id: 't6', name: 'James Murphy', email: 'james.murphy@student.unimelb.edu.au', phone: '0467 890 123', university: 'University of Melbourne', course: 'Bachelor of Commerce', property: 'Unit 2A', building: 'University Gardens', leaseEnd: '31 Jul 2026', nationality: 'Irish', status: 'active' },
  { id: 't7', name: 'Fatima Al-Hassan', email: 'fatima.alhassan@student.rmit.edu.au', phone: '0478 901 234', university: 'RMIT University', course: 'Master of Architecture', property: 'Unit G02', building: 'Brunswick Studios', leaseEnd: '31 Oct 2026', nationality: 'Emirati', status: 'active' },
  { id: 't8', name: 'Liam Chen', email: 'liam.chen@student.monash.edu', phone: '0489 012 345', university: 'Monash University', course: 'Bachelor of Medicine', property: '—', building: '—', leaseEnd: '—', nationality: 'Singaporean', status: 'inactive' },
]

export default function TenantsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tenants.filter(t => t.status === 'active').length} active tenants
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenants by name, email, university..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Universities</option>
              <option>University of Melbourne</option>
              <option>RMIT University</option>
              <option>Monash University</option>
              <option>Swinburne University</option>
              <option>Victoria University</option>
            </select>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Buildings</option>
              <option>Parkview Apts</option>
              <option>University Gardens</option>
              <option>Monash Towers</option>
              <option>Hawthorn Court</option>
            </select>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive / Past</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Current Property</TableHead>
                <TableHead>Lease Ends</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700">
                        {tenant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <Link href={`/tenants/${tenant.id}`} className="font-medium text-slate-900 text-sm hover:text-green-600">
                        {tenant.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <a href={`mailto:${tenant.email}`} className="hover:text-green-600 truncate max-w-[160px]">{tenant.email}</a>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {tenant.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-xs text-slate-700">
                        <GraduationCap className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{tenant.university}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">{tenant.course}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.property !== '—' ? (
                      <>
                        <p className="text-sm font-medium text-slate-700">{tenant.property}</p>
                        <p className="text-xs text-slate-400">{tenant.building}</p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">No active tenancy</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{tenant.leaseEnd}</TableCell>
                  <TableCell className="text-sm text-slate-600">{tenant.nationality}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === 'active' ? 'success' : 'gray'}>
                      {tenant.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/tenants/${tenant.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
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
