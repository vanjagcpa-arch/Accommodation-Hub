'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, UserCheck, ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateApplicationStatus, approveAndCreateTenant } from '@/lib/applications/actions'
import type { ApplicationStatus } from '@/types'

interface Props {
  applicationId: string
  status: ApplicationStatus
  linkedTenantId: string | null
}

export function ApplicationWorkflow({ applicationId, status, linkedTenantId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  function transition(toStatus: ApplicationStatus, options?: { rejectionReason?: string }) {
    setError(null)
    startTransition(async () => {
      let res
      if (toStatus === 'approved') {
        res = await approveAndCreateTenant(applicationId)
      } else {
        res = await updateApplicationStatus(applicationId, toStatus, options)
      }
      if (res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleRejectSubmit() {
    transition('rejected', { rejectionReason: rejectionReason.trim() || undefined })
    setShowRejectModal(false)
    setRejectionReason('')
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status: new */}
      {status === 'new' && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => transition('reviewing')}
            disabled={isPending}
            size="sm"
          >
            <ArrowRight className="h-4 w-4" />
            Start Review
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejectModal(true)}
            disabled={isPending}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transition('withdrawn')}
            disabled={isPending}
          >
            Withdraw
          </Button>
        </div>
      )}

      {/* Status: reviewing */}
      {status === 'reviewing' && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => transition('approved')}
            disabled={isPending}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <UserCheck className="h-4 w-4" />
            Approve &amp; Create Tenant
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejectModal(true)}
            disabled={isPending}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transition('withdrawn')}
            disabled={isPending}
          >
            Withdraw
          </Button>
        </div>
      )}

      {/* Status: approved */}
      {status === 'approved' && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => transition('moved_in')}
            disabled={isPending}
            size="sm"
          >
            <CheckCircle className="h-4 w-4" />
            Mark as Moved In
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transition('withdrawn')}
            disabled={isPending}
          >
            Withdraw
          </Button>
        </div>
      )}

      {/* Status: rejected — allow reopening */}
      {status === 'rejected' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => transition('reviewing')}
          disabled={isPending}
        >
          <RotateCcw className="h-4 w-4" />
          Reopen for Review
        </Button>
      )}

      {/* Linked tenant shortcut */}
      {linkedTenantId && (
        <Link href={`/tenants/${linkedTenantId}`}>
          <Button variant="ghost" size="sm" className="text-primary">
            View Tenant Record
          </Button>
        </Link>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-ink">Reject Application</h3>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Rejection Reason (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for rejection..."
                className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
