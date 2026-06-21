export const dynamic = 'force-dynamic'

import { Link2, CheckCircle2, XCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'

const INTEGRATION_DEFS = [
  {
    id: 'reapit',
    name: 'Reapit',
    description: 'Property management platform. Sync properties, tenancies, and applications with Reapit CRM.',
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
    description: 'Direct debit payment processing. Collect electricity charges and rent from tenants via Ezidebit.',
    logo: '💳',
    color: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
    fields: [
      { id: 'ezidebit_public_key', label: 'Public Key', placeholder: 'Ezidebit public key', type: 'text' },
      { id: 'ezidebit_digital_key', label: 'Digital Key', placeholder: '••••••••', type: 'password' },
      { id: 'ezidebit_client_code', label: 'Client Code', placeholder: 'Your Ezidebit client code', type: 'text' },
    ],
    docsUrl: 'https://docs.ezidebit.com.au',
  },
] as const

type IntegrationStatus = 'connected' | 'partial' | 'not_configured' | 'error'

const statusConfig: Record<IntegrationStatus, { label: string; variant: 'success' | 'warning' | 'gray' | 'danger' }> = {
  connected:      { label: 'Connected',                  variant: 'success' },
  not_configured: { label: 'Not Configured',             variant: 'gray' },
  partial:        { label: 'IDs Mapped — Not Connected', variant: 'warning' },
  error:          { label: 'Connection Error',           variant: 'danger' },
}

async function getExternalIdCounts() {
  try {
    const supabase = await createClient()
    const [bRp, pRp, tRp, bLo, pLo, cMyob, pEzi] = await Promise.all([
      supabase.from('buildings').select('id', { count: 'exact', head: true }).not('reapit_external_id', 'is', null),
      supabase.from('properties').select('id', { count: 'exact', head: true }).not('reapit_external_id', 'is', null),
      supabase.from('tenants').select('id', { count: 'exact', head: true }).not('reapit_external_id', 'is', null),
      supabase.from('buildings').select('id', { count: 'exact', head: true }).not('listonce_external_id', 'is', null),
      supabase.from('properties').select('id', { count: 'exact', head: true }).not('listonce_external_id', 'is', null),
      supabase.from('companies').select('id', { count: 'exact', head: true }).not('myob_external_id', 'is', null),
      supabase.from('properties').select('id', { count: 'exact', head: true }).not('ezidebit_code', 'is', null),
    ])
    return {
      reapit: (bRp.count ?? 0) + (pRp.count ?? 0) + (tRp.count ?? 0),
      listonce: (bLo.count ?? 0) + (pLo.count ?? 0),
      myob: cMyob.count ?? 0,
      ezidebit: pEzi.count ?? 0,
    }
  } catch {
    return { reapit: 0, listonce: 0, myob: 0, ezidebit: 0 }
  }
}

export default async function IntegrationsPage() {
  const counts = await getExternalIdCounts()

  const statuses: Record<string, IntegrationStatus> = {
    reapit:   process.env.REAPIT_CLIENT_ID   ? 'connected' : counts.reapit   > 0 ? 'partial' : 'not_configured',
    listonce: process.env.LISTONCE_API_KEY   ? 'connected' : counts.listonce > 0 ? 'partial' : 'not_configured',
    myob:     process.env.MYOB_API_KEY       ? 'connected' : counts.myob     > 0 ? 'partial' : 'not_configured',
    ezidebit: process.env.EZIDEBIT_PUBLIC_KEY ? 'connected' : counts.ezidebit > 0 ? 'partial' : 'not_configured',
  }

  const connectedCount      = Object.values(statuses).filter(s => s === 'connected').length
  const partialCount        = Object.values(statuses).filter(s => s === 'partial').length
  const notConfiguredCount  = Object.values(statuses).filter(s => s === 'not_configured').length

  const idMappingItems = [
    { system: 'Reapit',    entities: 'Properties, Buildings, Tenants', count: counts.reapit },
    { system: 'ListOnce',  entities: 'Properties, Buildings',          count: counts.listonce },
    { system: 'MYOB',      entities: 'Companies',                      count: counts.myob },
    { system: 'Ezidebit',  entities: 'Properties',                     count: counts.ezidebit },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Connect AccomHub with your existing property management tools
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
          <p className="text-xs text-slate-500 mt-1">Connected</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">{partialCount}</div>
          <p className="text-xs text-slate-500 mt-1">Partial Setup</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-slate-400">{notConfiguredCount}</div>
          <p className="text-xs text-slate-500 mt-1">Not Configured</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{INTEGRATION_DEFS.length}</div>
          <p className="text-xs text-slate-500 mt-1">Total</p>
        </div>
      </div>

      <div className="space-y-6">
        {INTEGRATION_DEFS.map((integration) => {
          const status = statuses[integration.id] ?? 'not_configured'
          const statusConf = statusConfig[status]
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
                      <p className="text-sm text-slate-500 mt-1">{integration.description}</p>
                      {status === 'partial' && (
                        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-700">
                            External ID mapping is configured — connect your credentials to enable sync.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 shrink-0"
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
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {status === 'connected' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Last synced: Never
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-slate-300" />
                        Not connected
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {status === 'connected' && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                        Sync Now
                      </Button>
                    )}
                    <Button size="sm" variant={status === 'connected' ? 'secondary' : 'primary'}>
                      <Link2 className="h-4 w-4" />
                      {status === 'connected' ? 'Disconnect' : 'Save & Connect'}
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
          <p className="text-sm text-slate-600 mb-4">
            AccomHub stores external system IDs on every entity to enable seamless integration once credentials are configured.
            These IDs are used for bi-directional sync — no data will be sent or received until you connect the integration above.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {idMappingItems.map(item => (
              <div key={item.system} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm font-semibold text-slate-800">{item.system}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.entities}</p>
                <p className={`text-xs font-medium mt-1 ${item.count > 0 ? 'text-green-600' : 'text-slate-400'}`}>
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
