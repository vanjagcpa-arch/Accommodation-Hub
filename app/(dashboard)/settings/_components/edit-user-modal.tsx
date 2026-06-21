'use client'

import { useActionState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { updateUserRole, type ActionState } from '@/lib/users/actions'
import type { UserRow } from './settings-client'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'internal_manager', label: 'Internal Manager' },
  { value: 'external_manager', label: 'External Manager' },
  { value: 'referral_agent', label: 'Referral Agent' },
  { value: 'maintenance_staff', label: 'Maintenance Staff' },
  { value: 'read_only', label: 'Read Only' },
]

interface Props {
  user: UserRow | null
  onClose: () => void
}

export function EditUserModal({ user, onClose }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateUserRole, { error: null })

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 className="text-base font-semibold text-ink">Edit User</h2>
            <p className="text-xs text-ink-muted mt-0.5">{user.full_name ?? user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-ink-faint hover:text-ink rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={formAction} className="p-6 space-y-4">
          <input type="hidden" name="user_id" value={user.id} />
          {state.error && (
            <div className="flex items-start gap-2 rounded-lg border border-neg/30 bg-neg/5 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-neg mt-0.5 shrink-0" />
              <p className="text-[13px] text-ink">{state.error}</p>
            </div>
          )}
          <div>
            <Label htmlFor="edit_role">Role</Label>
            <Select id="edit_role" name="role" defaultValue={user.role}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg border border-line">
            <input
              type="checkbox"
              id="edit_is_active"
              name="is_active"
              defaultChecked={user.is_active}
              className="w-4 h-4 rounded border-line text-primary focus:ring-primary"
            />
            <label htmlFor="edit_is_active" className="text-sm font-medium text-ink cursor-pointer">
              Active account
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-ink-muted hover:text-ink">Cancel</button>
            <Button type="submit" loading={pending}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
