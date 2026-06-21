export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NewOwnerForm } from './_components/new-owner-form'

export default function NewOwnerPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/owners" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Owners
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">New Owner</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Add Owner</h1>
        <p className="text-ink-muted text-sm mt-0.5">Add a property owner to your portfolio</p>
      </div>

      <NewOwnerForm />
    </div>
  )
}
