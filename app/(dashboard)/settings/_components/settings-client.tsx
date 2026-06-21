'use client'

import { useState } from 'react'
import { Building2, Save, Plus, Pencil } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export interface UserRow {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
}

export interface CompanyRow {
  id: string
  name: string | null
  abn: string | null
  address: string | null
  phone: string | null
  email: string | null
}

const roleLabels: Record<string, { label: string; variant: 'success' | 'info' | 'purple' | 'warning' | 'gray' | 'danger' }> = {
  super_admin: { label: 'Super Admin', variant: 'danger' },
  admin: { label: 'Admin', variant: 'success' },
  internal_manager: { label: 'Internal Manager', variant: 'info' },
  external_manager: { label: 'External Manager', variant: 'purple' },
  referral_agent: { label: 'Referral Agent', variant: 'warning' },
  maintenance_staff: { label: 'Maintenance Staff', variant: 'gray' },
  read_only: { label: 'Read Only', variant: 'gray' },
}

const tabs = ['General', 'Users & Roles', 'Companies', 'Notifications']

export default function SettingsClient({
  users,
  company,
  buildingCount,
  propertyCount,
}: {
  users: UserRow[]
  company: CompanyRow | null
  buildingCount: number
  propertyCount: number
}) {
  const [activeTab, setActiveTab] = useState('General')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-ink-muted text-sm mt-0.5">Manage your platform configuration</p>
      </div>

      <div className="flex gap-1 border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'General' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Organisation Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="org_name">Organisation Name</Label>
                <Input id="org_name" defaultValue={company?.name ?? ''} placeholder="Company name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="org_abn">ABN</Label>
                  <Input id="org_abn" defaultValue={company?.abn ?? ''} placeholder="XX XXX XXX XXX" />
                </div>
                <div>
                  <Label htmlFor="org_phone">Phone</Label>
                  <Input id="org_phone" defaultValue={company?.phone ?? ''} placeholder="03 9000 0000" />
                </div>
              </div>
              <div>
                <Label htmlFor="org_email">Contact Email</Label>
                <Input id="org_email" type="email" defaultValue={company?.email ?? ''} placeholder="admin@company.com.au" />
              </div>
              <div>
                <Label htmlFor="org_address">Address</Label>
                <Input id="org_address" defaultValue={company?.address ?? ''} placeholder="Street address" />
              </div>
              <div className="pt-2">
                <Button><Save className="h-4 w-4" />Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Platform Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Country</Label>
                  <Select defaultValue="Australia">
                    <option>Australia</option>
                  </Select>
                </div>
                <div>
                  <Label>Default State</Label>
                  <Select defaultValue="VIC">
                    <option>VIC</option>
                    <option>NSW</option>
                    <option>QLD</option>
                    <option>SA</option>
                    <option>WA</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Electricity Consent Version</Label>
                <Input defaultValue="v1.0" />
                <p className="text-xs text-ink-faint mt-1">Used to track which version of the consent form applicants agreed to</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg border border-line">
                <input type="checkbox" id="audit_log" defaultChecked className="w-4 h-4 rounded border-line text-primary" />
                <div>
                  <label htmlFor="audit_log" className="text-sm font-medium text-ink cursor-pointer">Enable Audit Logging</label>
                  <p className="text-xs text-ink-muted">Record all create/update/delete actions across the platform</p>
                </div>
              </div>
              <Button><Save className="h-4 w-4" />Save Preferences</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Users & Roles' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Platform Users</CardTitle>
                <Button size="sm"><Plus className="h-4 w-4" />Invite User</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-ink-muted">
                  No users found for this organisation.
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {users.map((user) => {
                    const displayName = user.full_name || user.email
                    const initials = displayName
                      .split(/[\s@]/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                    const role = roleLabels[user.role] ?? { label: user.role, variant: 'gray' as const }
                    return (
                      <div key={user.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center text-sm font-semibold text-primary">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">{displayName}</p>
                            {user.full_name && <p className="text-xs text-ink-muted">{user.email}</p>}
                            {!user.is_active && <span className="text-[10px] text-ink-faint">(inactive)</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={role.variant}>{role.label}</Badge>
                          <button className="p-1.5 text-ink-faint hover:text-ink-muted hover:bg-surface-muted rounded-md">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Role Permissions Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="py-2 px-3 text-left font-semibold text-ink-muted">Permission</th>
                      <th className="py-2 px-3 text-center text-ink-muted">Admin</th>
                      <th className="py-2 px-3 text-center text-ink-muted">Int. Mgr</th>
                      <th className="py-2 px-3 text-center text-ink-muted">Ext. Mgr</th>
                      <th className="py-2 px-3 text-center text-ink-muted">Agent</th>
                      <th className="py-2 px-3 text-center text-ink-muted">Maint.</th>
                      <th className="py-2 px-3 text-center text-ink-muted">Read</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[
                      ['View Properties', '✓', '✓', '✓', '✓', '✓', '✓'],
                      ['Edit Properties', '✓', '✓', '✓ (assigned)', '✕', '✕', '✕'],
                      ['View Tenants', '✓', '✓', '✓ (assigned)', '✕', '✕', '✕'],
                      ['Manage Applications', '✓', '✓', '✓ (assigned)', '✓ (own)', '✕', '✕'],
                      ['View Maintenance', '✓', '✓', '✓', '✕', '✓ (assigned)', '✓'],
                      ['Edit Maintenance', '✓', '✓', '✓', '✕', '✓ (assigned)', '✕'],
                      ['Electricity Module', '✓', '✓', '✓', '✕', '✕', '✓'],
                      ['Reporting', '✓', '✓', '✕', '✕', '✕', '✓'],
                      ['User Management', '✓', '✕', '✕', '✕', '✕', '✕'],
                      ['Integrations', '✓', '✕', '✕', '✕', '✕', '✕'],
                    ].map(([perm, ...perms]) => (
                      <tr key={perm}>
                        <td className="py-2 px-3 text-ink font-medium">{perm}</td>
                        {perms.map((val, i) => (
                          <td key={i} className="py-2 px-3 text-center">
                            <span className={val === '✓' ? 'text-primary font-semibold' : val.startsWith('✓') ? 'text-warn' : 'text-ink-faint'}>
                              {val}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Companies' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Companies</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!company ? (
                <p className="text-sm text-ink-muted text-center py-4">No company data found.</p>
              ) : (
                <div className="divide-y divide-line">
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-ink">{company.name ?? '—'}</p>
                        <p className="text-sm text-ink-muted">
                          {company.abn ? `ABN: ${company.abn} · ` : ''}
                          {buildingCount} building{buildingCount !== 1 ? 's' : ''} · {propertyCount} properties
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Notifications' && (
        <Card>
          <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {[
              { section: 'Maintenance', items: [
                { id: 'notif_new_job', label: 'New maintenance job created', desc: 'Notify when a new job is logged' },
                { id: 'notif_urgent', label: 'Urgent priority jobs', desc: 'Immediate alert for urgent jobs' },
                { id: 'notif_overdue', label: 'Overdue jobs', desc: 'Daily digest of overdue jobs' },
                { id: 'notif_completed', label: 'Job completed', desc: 'Notify when a job is marked complete' },
              ]},
              { section: 'Applications', items: [
                { id: 'notif_new_app', label: 'New application received', desc: 'Notify on new tenant application' },
                { id: 'notif_app_approved', label: 'Application approved', desc: 'Notify when application is approved' },
              ]},
              { section: 'Leases', items: [
                { id: 'notif_lease_expiring', label: 'Lease expiring soon (30 days)', desc: 'Remind when lease is about to end' },
                { id: 'notif_property_vacant', label: 'Property becoming vacant', desc: 'Alert when occupancy ends' },
              ]},
              { section: 'Electricity', items: [
                { id: 'notif_consent_pending', label: 'Consent pending', desc: 'Remind when consent has not been received' },
                { id: 'notif_export_ready', label: 'Ezidebit export ready', desc: 'Notify when a new export file is generated' },
              ]},
            ].map(({ section, items }) => (
              <div key={section}>
                <h3 className="text-sm font-semibold text-ink mb-3">{section}</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-surface-muted border border-line rounded-lg">
                      <input
                        type="checkbox"
                        id={item.id}
                        defaultChecked={['notif_urgent', 'notif_new_app', 'notif_consent_pending'].includes(item.id)}
                        className="mt-0.5 w-4 h-4 rounded border-line text-primary"
                      />
                      <div>
                        <label htmlFor={item.id} className="text-sm font-medium text-ink cursor-pointer">{item.label}</label>
                        <p className="text-xs text-ink-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button><Save className="h-4 w-4" />Save Preferences</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
