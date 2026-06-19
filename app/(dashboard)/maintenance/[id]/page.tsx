'use client'

import Link from 'next/link'
import { ChevronLeft, MapPin, Calendar, User, Paperclip, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { useState } from 'react'
import type { MaintenancePriority, MaintenanceStatus } from '@/types'

const job = {
  id: 'm1',
  title: 'Water damage — ceiling stain spreading',
  description: 'Tenant Wei Zhang reported a water stain on the bedroom ceiling that appeared 2 days ago and is growing. Suspect a leak from the bathroom in Unit 302 above. The ceiling appears wet and discoloured in a 30cm radius. This unit is currently in maintenance hold as a result.',
  issue_type: 'Plumbing',
  priority: 'urgent' as MaintenancePriority,
  status: 'in_progress' as MaintenanceStatus,
  property: 'Unit 301',
  building: 'Parkview Apartments',
  tenant: 'Wei Zhang',
  tenant_email: 'wei.zhang@student.unimelb.edu.au',
  assignee: 'Bob Plumber',
  due: '22 Jun 2026',
  scheduled: '20 Jun 2026 at 9:00 AM',
  created: '19 Jun 2026 at 7:34 AM',
  created_by: 'Sarah Chen',
  access_notes: 'Key in lockbox at building reception. Tenant available from 8am–6pm. Unit is vacant (on maintenance hold).',
  internal_notes: 'Contractor Bob Plumber dispatched. May need to involve the building above (strata). Check if strata insurance is applicable. Estimated repair cost $800–$2,400 depending on scope.',
}

const comments = [
  { id: 'c1', author: 'Sarah Chen', avatar: 'SC', text: 'Created job and assigned to Bob. Have notified strata manager of possible source leak from unit above.', time: '19 Jun 2026 at 7:36 AM', internal: true },
  { id: 'c2', author: 'Bob Plumber', avatar: 'BP', text: 'Attended at 9:15am. Confirmed leak from unit 302 bathroom (cracked grout in shower). Need to access unit 302 to repair source. Patched temporary waterproof barrier on ceiling of 301 to prevent further damage.', time: '20 Jun 2026 at 10:42 AM', internal: false },
  { id: 'c3', author: 'Sarah Chen', avatar: 'SC', text: 'Thanks Bob. Have contacted occupant of unit 302 to arrange access tomorrow morning. Will update once confirmed.', time: '20 Jun 2026 at 11:05 AM', internal: true },
]

const history = [
  { action: 'Job created', by: 'Sarah Chen', time: '19 Jun 2026 at 7:34 AM', detail: 'Status: New · Priority: Urgent' },
  { action: 'Assigned to Bob Plumber', by: 'Sarah Chen', time: '19 Jun 2026 at 7:36 AM', detail: 'Status: New → Assigned' },
  { action: 'Job scheduled', by: 'Sarah Chen', time: '19 Jun 2026 at 8:00 AM', detail: 'Scheduled: 20 Jun 2026 at 9:00 AM' },
  { action: 'Status updated', by: 'Bob Plumber', time: '20 Jun 2026 at 9:15 AM', detail: 'Status: Assigned → In Progress' },
]

const tabs = [
  { id: 'details', label: 'Details' },
  { id: 'comments', label: 'Comments', count: comments.length },
  { id: 'photos', label: 'Photos', count: 2 },
  { id: 'history', label: 'History', count: history.length },
]

export default function MaintenanceJobDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('details')
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(true)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/maintenance" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Maintenance
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">#{params.id}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <MaintenancePriorityBadge priority={job.priority} />
              <MaintenanceStatusBadge status={job.status} />
              <span className="text-xs text-slate-400">#{job.id}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                {job.property} · {job.building}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Tenant: {job.tenant}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Due: <strong className="text-red-600">{job.due}</strong>
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm">Edit</Button>
            <Button size="sm">Update Status</Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <Tabs tabs={tabs} defaultTab="details" onChange={setActiveTab} />
        </CardHeader>
        <CardContent className="pt-4">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{job.description}</p>
                </div>
                {job.access_notes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="text-xs font-semibold text-amber-800 mb-1">Access Notes</h3>
                    <p className="text-sm text-amber-700">{job.access_notes}</p>
                  </div>
                )}
                {job.internal_notes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <h3 className="text-xs font-semibold text-slate-600 mb-1">Internal Notes</h3>
                    <p className="text-sm text-slate-600">{job.internal_notes}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">Assigned To</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">BP</div>
                      <span className="text-sm font-medium text-slate-700">{job.assignee}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">Issue Type</p>
                    <p className="text-sm font-medium text-slate-700">{job.issue_type}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">Scheduled</p>
                    <p className="text-sm text-slate-700">{job.scheduled}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">Created By</p>
                    <p className="text-sm text-slate-700">{job.created_by}</p>
                    <p className="text-xs text-slate-400">{job.created}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">Tenant Contact</p>
                    <p className="text-sm font-medium text-slate-700">{job.tenant}</p>
                    <p className="text-xs text-slate-400">{job.tenant_email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                    {comment.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{comment.author}</span>
                      {comment.internal && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">Internal</span>
                      )}
                      <span className="text-xs text-slate-400">{comment.time}</span>
                    </div>
                    <div className={`text-sm text-slate-700 p-3 rounded-lg ${comment.internal ? 'bg-slate-50 border border-slate-200' : 'bg-green-50 border border-green-200'}`}>
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-green-600"
                    />
                    <span className="text-sm text-slate-600">Internal note (not visible to tenant)</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment or update..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                  <Button className="self-end" size="sm">
                    <Send className="h-4 w-4" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">before_photo.jpg</p>
                    <p className="text-xs text-slate-300">Before</p>
                  </div>
                </div>
                <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">during_work.jpg</p>
                    <p className="text-xs text-slate-300">During</p>
                  </div>
                </div>
                <div className="aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                  <div className="text-center">
                    <Paperclip className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Upload photo</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {history.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                      <span className="text-xs text-slate-400 shrink-0">{entry.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{entry.detail} · by {entry.by}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
