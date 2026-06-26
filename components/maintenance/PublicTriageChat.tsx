'use client'

import { useState } from 'react'
import TriageChat from './TriageChat'

interface Props {
  token: string
  contactEmail?: string | null
  contactPhone?: string | null
}

// Client wrapper so the public (server-rendered) page can wire TriageChat's
// callbacks. Points the chat at the token-based public endpoint.
export default function PublicTriageChat({ token, contactEmail, contactPhone }: Props) {
  const [showContact, setShowContact] = useState(false)

  return (
    <div className="space-y-4">
      <TriageChat
        token={token}
        endpoint="/api/public/triage"
        source="qr"
        onHandoff={() => setShowContact(true)}
      />

      {showContact && (
        <div className="rounded-xl border border-line bg-surface-muted px-4 py-3 text-[13px] text-ink">
          <p className="font-semibold">Prefer to talk to a person?</p>
          <p className="text-ink-muted mt-1">Contact your property manager:</p>
          <ul className="mt-1 space-y-0.5">
            {contactEmail && (
              <li>Email: <a className="text-primary underline" href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
            )}
            {contactPhone && (
              <li>Phone: <a className="text-primary underline" href={`tel:${contactPhone}`}>{contactPhone}</a></li>
            )}
            {!contactEmail && !contactPhone && (
              <li className="text-ink-muted">Please use the contact details provided in your tenancy pack.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
