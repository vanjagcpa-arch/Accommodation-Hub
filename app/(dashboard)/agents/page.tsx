import { Plus, Search, Mail, Phone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const agents = [
  { id: 'ag1', name: 'Emma Davis', agency: 'CBD Referrals', type: 'external', email: 'emma.davis@cbdreferrals.com.au', phone: '03 9001 2345', buildings: ['Parkview Apts', 'University Gardens', 'Docklands Point'], status: 'active', applications: 12, commission: 8.5 },
  { id: 'ag2', name: 'Michael Brown', agency: 'Suburban Lets', type: 'referral', email: 'm.brown@suburbanlets.com.au', phone: '03 9002 3456', buildings: ['Hawthorn Court', 'Brunswick Studios'], status: 'active', applications: 7, commission: 7.0 },
  { id: 'ag3', name: 'Rachel Wong', agency: 'StudyLink Realty', type: 'external', email: 'rachel.wong@studylink.com.au', phone: '03 9003 4567', buildings: ['University Gardens', 'Monash Towers', 'Footscray Heights'], status: 'active', applications: 19, commission: 8.0 },
  { id: 'ag4', name: 'David Park', agency: 'Marine Lets', type: 'referral', email: 'd.park@marinlets.com.au', phone: '03 9004 5678', buildings: ['Docklands Point', 'St Kilda Residences'], status: 'active', applications: 5, commission: 6.5 },
  { id: 'ag5', name: 'Sarah Chen', agency: 'Metro Student Housing', type: 'internal', email: 'sarah.chen@metrostudenthousing.com.au', phone: '03 9000 1234', buildings: ['Parkview Apts', 'Flinders House', 'Docklands Point'], status: 'active', applications: 28, commission: 0 },
  { id: 'ag6', name: 'James Mitchell', agency: 'Metro Student Housing', type: 'internal', email: 'j.mitchell@metrostudenthousing.com.au', phone: '03 9000 2345', buildings: ['University Gardens', 'Fitzroy Terrace'], status: 'active', applications: 15, commission: 0 },
  { id: 'ag7', name: 'Lisa Nguyen', agency: 'Pacific Connect', type: 'referral', email: 'lisa@pacificconnect.com.au', phone: '03 9005 6789', buildings: ['Monash Towers'], status: 'inactive', applications: 3, commission: 7.5 },
]

const typeConfig = {
  internal: { label: 'Internal', variant: 'success' as const },
  external: { label: 'External', variant: 'info' as const },
  referral: { label: 'Referral', variant: 'purple' as const },
}

export default function AgentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {agents.filter(a => a.status === 'active').length} active agents
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search agents..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="referral">Referral</option>
            </select>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Permitted Buildings</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const typeConf = typeConfig[agent.type as keyof typeof typeConfig]
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{agent.agency}</TableCell>
                    <TableCell>
                      <Badge variant={typeConf.variant}>{typeConf.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <a href={`mailto:${agent.email}`} className="hover:text-green-600 truncate max-w-[160px]">{agent.email}</a>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {agent.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {agent.buildings.slice(0, 2).map(b => (
                          <div key={b} className="flex items-center gap-1 text-xs text-slate-600">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {b}
                          </div>
                        ))}
                        {agent.buildings.length > 2 && (
                          <span className="text-xs text-slate-400">+{agent.buildings.length - 2} more</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-900">{agent.applications}</span>
                    </TableCell>
                    <TableCell>
                      {agent.commission > 0 ? (
                        <span className="text-sm text-slate-700">{agent.commission}%</span>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.status === 'active' ? 'success' : 'gray'}>
                        {agent.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Permissions</Button>
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
