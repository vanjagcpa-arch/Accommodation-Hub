export const dynamic = 'force-dynamic'

import { Link2, CheckCircle2, XCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'

type IntegrationStatus = 'connected' | 'not_configured' | 'partial' | 'error'

interface IntegrationDef {
  id: string
  name: string
  description: string
  status: IntegrationStatus
  count: number
  logo: string
  color: string
  iconBg: string
  fields: { id: string; label: string; placeholder: string; type: string }[]
  docsUrl: string
  note?: string
}

async function getExternalIdCounts(): Promise<{
  reapit: number
  listonce: number
  myob: number
  ezidebit: number
}> {
  try {
    const supabase = await createClient()
    const [
      buildingsReapit,
      propertiesReapit,
      buildingsListonce,
      propertiesListonce,
      companiesMyob,
      propertiesEzidebit,
    ] = await Promise.all([
      supabase.from('buildings').select('id', { count: 'exact', head: true }).not('reapit_external_id', 'is', null),
      supabase.from('properties').select('id', { count: 'exact', head: true }).not('reapit_external_id', 'is', null),
      supabase.from('buildings').select('id', { count: 'exact', head: true }).not('listonce_external_id', 'is', null),
      supabase.from('properties').select('id', { count: 'exact', head: true }).not('listonce_external_id', 'is', null),
      supabase.from('companies').select('id', { count: 'exact', head: true }).not('myob_external_id', 'is', null),
      supabase.from('properties').select('id', { count: 'exact', head: true }).not('ezidebit_code', 'is', null),
    ])
    return {
      reapit: (buildingsReapit.count ?? 0) + (propertiesReapit.count ?? 0),
      listonce: (buildingsListonce.count ?? 0) + (propertiesListonce.count ?? 0),
      myob: companiesMyob.count ?? 0,
      ezidebit: propertiesEzidebit.count ?? 0,
    }
  } catch {
    return { reapit: 0, listonce: 0, myob: 0, ezidebit: 0 }
  }
}

function deriveStatus(envKey: boolean, count: number): IntegrationStatus {
  if (envKey) return 'connected'
  if (count > 0) return 'partial'
  return 'not_configured'
}

const statusConfig: Record<IntegrationStatus, { label: string; variant: 'success' | 'gray' | 'warning' | 'danger' }> = {
  connected:      { label: 'Connected',                  variant: 'success' },
  not_configured: { label: 'Not Configured',             variant: 'gray' },
  partial:        { label: 'IDs Mapped — Not Connected', variant: 'warning' },
  error:          { label: 'Connection Error',           variant: 'danger' },
}

export default async function IntegrationsPage() {
  const counts = await getExternalIdCounts()

  const integrations: IntegrationDef[] = [
    {
      id: 'reapit',
      name: 'Reapit',
      description: 'Property management platform. Sync properties, tenancies, and applications with Reapit CRM.',
      status: deriveStatus(!!process.env.REAPIT_CLIENT_ID, counts.reapit),
      count: counts.reapit,
      logo: '🏠',
      color: 'bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100',
      fields: [
        { id: 'reapit_client_id', label: 'Client ID', placeholder: 'Reapit API Client ID', type: 'text' },
        { id: 'reapit_client_secret', label: 'Client Secret', placeholder: '••••••••', type: 'password' },
        { id: 'reapit_base_url', label: 'Base URL', placeholder: 'https://platform.reapit.cloud', type: 'url' },
      ],
      docsUrl: 'https://developers.reapit.cloud',
    },
    {
      id: 'listonce',
      name: 'ListOnce',
      description: 'Property listing platform. Publish available properties to the ListOnce portal for agents.',
      status: deriveStatus(!!process.env.LISTONCE_API_KEY, counts.listonce),
      count: counts.listonce,
      logo: '📋',
      color: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100',
      fields: [
        { id: 'listonce_api_key', label: 'API Key', placeholder: 'ListOnce API key', type: 'text' },
        { id: 'listonce_account_id', label: 'Account ID', placeholder: 'Your ListOnce account ID', type: 'text' },
      ],
      docsUrl: 'https://listonce.com.au',
    },
    {
      id: 'myob',
      name: 'MYOB',
      description: 'Accounting software integration. Sync invoices, payments, and financial data with MYOB AccountRight.',
      status: deriveStatus(!!process.env.MYOB_API_KEY, counts.myob),
      count: counts.myob,
      logo: '📊',
      color: 'bg-green-50 border-green-200',
      iconBg: 'bg-green-100',
      fields: [
        { id: 'myob_company_file', label: 'Company File ID', placeholder: 'MYOB company file GUID', type: 'text' },
        { id: 'myob_api_key', label: 'API Key', placeholder: 'MYOB developer API key', type: 'text' },
        { id: 'myob_username', label: 'Username', placeholder: 'MYOB login username', type: 'text' },
      ],
      docsUrl: 'https://developer.myob.com',
    },
    {
      id: 'ezidebit',
      name: 'Ezidebit',
      description: 'Direct debit payment processing. Export electricity charge files for Ezidebit bulk upload.',
      status: deriveStatus(!!process.env.EZIDEBIT_PUBLIC_KEY, counts.ezidebit),
      count: counts.ezidebit,
      logo: '💳',
      color: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100',
      fields: [
        { id: 'ezidebit_public_key', label: 'Public Key', placeholder: 'Ezidebit public key', type: 'text' },
        { id: 'ezidebit_digital_key', label: 'Digital Key', placeholder: '••••••••', type: 'password' },
        { id: 'ezidebit_client_code', label: 'Client Code', placeholder: 'Your Ezidebit client code', type: 'text' },
      ],
      docsUrl: 'https://docs.ezidebit.com.au',
      note: counts.ezidebit > 0
        ? `${counts.ezidebit} property codes mapped. Connect credentials to enable charge uploads.`
        : undefined,
    },
  ]

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const partialCount = integrations.filter(i => i.status === 'partial').length
  const notConfiguredCount = integrations.filter(i => i.status === 'not_configured').length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink">Integrations</h1>
        <p className="text-ink-muted text-sm mt-0.5">
          Connect AccomHub with your existing property management tools
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-line shadow-card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{connectedCount}</div>
          <p className="text-xs text-ink-muted mt-1">Connected</p>
        </div>
        <div className="bg-surface rounded-xl border border-line shadow-card p-4 text-center">
          <div className="text-2xl font-bold text-warn">{partialCount}</div>
          <p className="text-xs text-ink-muted mt-1">Partial Setup</p>
        </div>
        <div className="bg-surface rounded-xl border border-line shadow-card p-4 text-center">
          <div className="text-2xl font-bold text-ink-faint">{notConfiguredCount}</div>
          <p className="text-xs text-ink-muted mt-1">Not Configured</p>
        </div>
        <div className="bg-surface rounded-xl border border-line shadow-card p-4 text-center">
          <div className="text-2xl font-bold text-ink">{integrations.length}</div>
          <p className="text-xs text-ink-muted mt-1">Total</p>
        </div>
      </div>

      <div className="space-y-6">
        {integrations.map((integration) => {
          const statusConf = statusConfig[integration.status]
          return (
            <Card key={integration.id} className={`border ${integration.color}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${integration.iconBg} flex items-center justify-center text-2xl shrink-0`}>
                      {integration.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                      </div>
                      <p className="text-sm text-ink-muted mt-1">{integration.description}</p>
                      {integration.note && (
                        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-700">{integration.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ink-faint hover:text-ink-muted shrink-0"
                  >
                    Docs <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {integration.fields.map((field) => (
                    <div key={field.id}>
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    {integration.status === 'connected' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-ink-faint" />
                        Not connected
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {integration.status === 'connected' && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                        Sync Now
                      </Button>
                    )}
                    <Button size="sm" variant={integration.status === 'connected' ? 'secondary' : 'primary'}>
                      <Link2 className="h-4 w-4" />
                      {integration.status === 'connected' ? 'Disconnect' : 'Save & Connect'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>External ID Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted mb-4">
            AccomHub stores external system IDs on every entity to enable seamless integration once credentials are configured.
            These IDs are used for bi-directional sync — no data will be sent or received until you connect the integration above.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { system: 'Reapit',    entities: 'Properties, Buildings',  count: counts.reapit },
              { system: 'ListOnce',  entities: 'Properties, Buildings',  count: counts.listonce },
              { system: 'MYOB',      entities: 'Companies',              count: counts.myob },
              { system: 'Ezidebit', entities: 'Properties',              count: counts.ezidebit },
            ].map(item => (
              <div key={item.system} className="p-3 bg-surface-muted border border-line rounded-lg">
                <p className="text-sm font-semibold text-ink">{item.system}</p>
                <p className="text-xs text-ink-muted mt-0.5">{item.entities}</p>
                <p className={`text-xs font-medium mt-1 ${item.count > 0 ? 'text-primary' : 'text-ink-faint'}`}>
                  {item.count > 0 ? `${item.count} mapped` : 'None mapped'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
