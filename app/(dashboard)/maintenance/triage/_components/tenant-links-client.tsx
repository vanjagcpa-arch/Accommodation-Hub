'use client'

import { useState, useTransition } from 'react'
import { Link2, Copy, Check, QrCode, ExternalLink, RefreshCw, Plus } from 'lucide-react'
import { generateTriageToken } from '../actions'

export interface PropertyRow {
  id: string
  unitNumber: string
  buildingName: string | null
  token: string | null
}

interface Props {
  rows: PropertyRow[]
  canManage: boolean
}

export default function TenantLinksClient({ rows, canManage }: Props) {
  const [tokens, setTokens] = useState<Record<string, string | null>>(
    Object.fromEntries(rows.map((r) => [r.id, r.token]))
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qr, setQr] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const linkFor = (token: string) => `${origin}/r/${token}`

  function copy(id: string, token: string) {
    navigator.clipboard?.writeText(linkFor(token))
    setCopiedId(id)
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500)
  }

  async function showQr(id: string, token: string) {
    if (qr[id]) {
      setQr((q) => { const n = { ...q }; delete n[id]; return n })
      return
    }
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(linkFor(token), { width: 220, margin: 1 })
      setQr((q) => ({ ...q, [id]: dataUrl }))
    } catch {
      setError('Could not generate QR code.')
    }
  }

  function generate(id: string) {
    setError(null)
    setBusyId(id)
    startTransition(async () => {
      const res = await generateTriageToken(id)
      setBusyId(null)
      if (res.error) { setError(res.error); return }
      if (res.token) {
        setTokens((t) => ({ ...t, [id]: res.token! }))
        setQr((q) => { const n = { ...q }; delete n[id]; return n })
      }
    })
  }

  if (rows.length === 0) {
    return <p className="text-[13px] text-ink-muted">No active properties found.</p>
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-[13px] text-neg">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Property</th>
              <th className="px-4 py-2.5 text-left font-medium">Tenant link</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const token = tokens[r.id]
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.unitNumber}</div>
                    {r.buildingName && <div className="text-[12px] text-ink-muted">{r.buildingName}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {token ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-3.5 w-3.5 text-ink-faint shrink-0" />
                          <code className="truncate rounded bg-surface-muted px-2 py-1 text-[12px] text-ink max-w-[280px]">
                            {origin}/r/{token}
                          </code>
                        </div>
                        {qr[r.id] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={qr[r.id]} alt="QR code" width={160} height={160} className="rounded border border-line bg-white p-2" />
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-faint">No link yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {token && (
                        <>
                          <button onClick={() => copy(r.id, token)} className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink hover:bg-surface-muted">
                            {copiedId === r.id ? <Check className="h-3.5 w-3.5 text-pos" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedId === r.id ? 'Copied' : 'Copy'}
                          </button>
                          <button onClick={() => showQr(r.id, token)} className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink hover:bg-surface-muted">
                            <QrCode className="h-3.5 w-3.5" />{qr[r.id] ? 'Hide QR' : 'QR'}
                          </button>
                          <a href={linkFor(token)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink hover:bg-surface-muted">
                            <ExternalLink className="h-3.5 w-3.5" />Preview
                          </a>
                        </>
                      )}
                      {canManage && (
                        <button
                          onClick={() => generate(r.id)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink hover:bg-surface-muted disabled:opacity-50"
                        >
                          {token ? <RefreshCw className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          {busyId === r.id ? '…' : token ? 'Regenerate' : 'Generate link'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!canManage && (
        <p className="text-[12px] text-ink-faint">
          You can view and preview links. Generating or rotating links requires a manager/admin role.
        </p>
      )}
    </div>
  )
}
