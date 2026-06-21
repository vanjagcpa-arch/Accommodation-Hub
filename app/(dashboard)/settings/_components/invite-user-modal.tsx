'use client'

import { useActionState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { inviteUser, type ActionState } from '@/lib/users/actions'
import { ROLES } from '@/lib/users/roles'

interface Props {
  open: boolean
  onClose: () => void
}

export function InviteUserModal({ open, onClose }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(inviteUser, { error: null })

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">Invite User</h2>
          <button type="button" onClick={onClose} className="p-1 text-ink-faint hover:text-ink rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={formAction} className="p-6 space-y-4">
          {state.error && (
            <div className="flex items-start gap-2 rounded-lg border border-neg/30 bg-neg/5 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-neg mt-0.5 shrink-0" />
              <p className="text-[13px] text-ink">{state.error}</p>
            </div>
          )}
          <div>
            <Label htmlFor="invite_email" required>Email</Label>
            <Input id="invite_email" name="email" type="email" required placeholder="user@example.com" autoFocus />
          </div>
          <div>
            <Label htmlFor="invite_full_name">Full Name</Label>
            <Input id="invite_full_name" name="full_name" placeholder="Jane Smith" />
          </div>
          <div>
            <Label htmlFor="invite_role">Role</Label>
            <Select id="invite_role" name="role" defaultValue="internal_manager">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-ink-muted hover:text-ink">Cancel</button>
            <Button type="submit" loading={pending}>Send Invite</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
