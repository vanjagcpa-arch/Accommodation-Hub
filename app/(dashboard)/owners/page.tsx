export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, User2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface Owner {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  is_active: boolean
}

async function getOwners(): Promise<{ owners: Owner[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('owners')
      .select('id, first_name, last_name, email, phone, company_name, is_active')
      .order('last_name')
    if (error) return { owners: [], error: error.message }
    return { owners: (data ?? []) as Owner[], error: null }
  } catch (err) {
    return { owners: [], error: err instanceof Error ? err.message : 'Failed to load owners' }
  }
}

export default async function OwnersPage() {
  const { owners, error } = await getOwners()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Owners</h1>
          <p className="text-ink-muted text-sm mt-0.5">{owners.length} owner{owners.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/owners/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Owner
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error.includes('relation') || error.includes('connect')
            ? 'Database not configured — connect Supabase and run migrations to see owners.'
            : error}
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        {owners.length === 0 ? (
          <div className="p-12 text-center">
            <User2 className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
            <p className="text-sm text-ink-muted">No owners yet. Add your first owner to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-canvas border-b border-line">
              <tr>
                {['Name', 'Company', 'Email', 'Phone', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {owners.map(owner => (
                <tr key={owner.id} className="hover:bg-canvas/50">
                  <td className="px-4 py-3 font-medium text-ink">
                    {owner.first_name} {owner.last_name}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{owner.company_name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{owner.email ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{owner.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      owner.is_active ? 'bg-success/10 text-success' : 'bg-line text-ink-muted'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${owner.is_active ? 'bg-success' : 'bg-ink-subtle'}`} />
                      {owner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/owners/${owner.id}/edit`}
                      className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
