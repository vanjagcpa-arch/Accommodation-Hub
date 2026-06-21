export const dynamic = 'force-dynamic'

import { Plus, Mail, Phone, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface AgentRow {
  id: string
  first_name: string | null
  last_name: string | null
  agency_name: string | null
  agent_type: string
  email: string | null
  phone: string | null
  commission_rate: number | null
  is_active: boolean
  building_names: string[]
  application_count: number
}

async function getAgents(): Promise<{ agents: AgentRow[]; error: string | null }> {
  try {
    const supabase = await createClient()

    const [agentsRes, permsRes, appsRes] = await Promise.all([
      supabase
        .from('agents')
        .select('id, first_name, last_name, agency_name, agent_type, email, phone, commission_rate, is_active')
        .order('last_name'),
      supabase
        .from('agent_building_permissions')
        .select('agent_id, building:buildings(name)'),
      supabase
        .from('applications')
        .select('agent_id')
        .not('agent_id', 'is', null),
    ])

    if (agentsRes.error) return { agents: [], error: agentsRes.error.message }

    const buildingMap: Record<string, string[]> = {}
    for (const perm of permsRes.data ?? []) {
      const aid = perm.agent_id as string
      const name = (perm.building as unknown as { name: string } | null)?.name
      if (name) {
        if (!buildingMap[aid]) buildingMap[aid] = []
        buildingMap[aid].push(name)
      }
    }

    const appCountMap: Record<string, number> = {}
    for (const app of appsRes.data ?? []) {
      const aid = app.agent_id as string
      appCountMap[aid] = (appCountMap[aid] ?? 0) + 1
    }

    const agents: AgentRow[] = (agentsRes.data ?? []).map((a) => ({
      id: a.id,
      first_name: a.first_name,
      last_name: a.last_name,
      agency_name: a.agency_name,
      agent_type: a.agent_type,
      email: a.email,
      phone: a.phone,
      commission_rate: a.commission_rate,
      is_active: a.is_active,
      building_names: buildingMap[a.id] ?? [],
      application_count: appCountMap[a.id] ?? 0,
    }))

    return { agents, error: null }
  } catch (err) {
    return { agents: [], error: err instanceof Error ? err.message : 'Failed to load agents' }
  }
}

const TYPE_VARIANT: Record<string, 'success' | 'info' | 'purple' | 'gray'> = {
  internal: 'success',
  external: 'info',
  referral: 'purple',
}

const TYPE_LABEL: Record<string, string> = {
  internal: 'Internal',
  external: 'External',
  referral: 'Referral',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const filterType = first(sp.type) ?? ''
  const filterStatus = first(sp.status) ?? ''

  const { agents: allAgents, error } = await getAgents()

  const agents = allAgents.filter((a) => {
    if (filterType && a.agent_type !== filterType) return false
    if (filterStatus === 'active' && !a.is_active) return false
    if (filterStatus === 'inactive' && a.is_active) return false
    return true
  })

  const activeCount = allAgents.filter((a) => a.is_active).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Agents</h1>
          <p className="text-ink-muted text-sm mt-0.5">{activeCount} active agents</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Agent
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      )}

      <Card>
        <CardHeader>
          <form method="get" className="flex flex-wrap gap-3">
            <select
              name="type"
              defaultValue={filterType}
              className="text-sm border border-line-strong rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="referral">Referral</option>
            </select>
            <select
              name="status"
              defaultValue={filterStatus}
              className="text-sm border border-line-strong rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="text-sm px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Filter
            </button>
            {(filterType || filterStatus) && (
              <Link
                href="/agents"
                className="text-sm px-4 py-2 rounded-lg border border-line text-ink-muted hover:text-ink transition-colors"
              >
                Clear
              </Link>
            )}
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {agents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ink-muted">No agents found.</p>
            </div>
          ) : (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => {
                  const fullName = [agent.first_name, agent.last_name].filter(Boolean).join(' ') || 'Unknown'
                  const initials = [agent.first_name?.[0], agent.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'
                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {initials}
                          </div>
                          <span className="font-medium text-ink text-sm">{fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {agent.agency_name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TYPE_VARIANT[agent.agent_type] ?? 'gray'}>
                          {TYPE_LABEL[agent.agent_type] ?? agent.agent_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {agent.email && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                              <Mail className="h-3 w-3 text-ink-faint" />
                              <a href={`mailto:${agent.email}`} className="hover:text-primary truncate max-w-[160px]">
                                {agent.email}
                              </a>
                            </div>
                          )}
                          {agent.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
                              <Phone className="h-3 w-3 text-ink-faint" />
                              {agent.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.building_names.length === 0 ? (
                          <span className="text-xs text-ink-faint">None</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {agent.building_names.slice(0, 2).map((b) => (
                              <div key={b} className="flex items-center gap-1 text-xs text-ink-muted">
                                <Building2 className="h-3 w-3 text-ink-faint" />
                                {b}
                              </div>
                            ))}
                            {agent.building_names.length > 2 && (
                              <span className="text-xs text-ink-faint">
                                +{agent.building_names.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-ink">{agent.application_count}</span>
                      </TableCell>
                      <TableCell>
                        {agent.commission_rate != null && agent.commission_rate > 0 ? (
                          <span className="text-sm text-ink-muted">{agent.commission_rate}%</span>
                        ) : (
                          <span className="text-xs text-ink-faint">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.is_active ? 'success' : 'gray'}>
                          {agent.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
