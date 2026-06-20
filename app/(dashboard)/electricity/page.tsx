'use client'

import { useState, useRef } from 'react'
import {
  Zap, Upload, FileText, RefreshCw, Check, AlertTriangle,
  Mail, Download, Plus, X, Settings as SettingsIcon,
} from 'lucide-react'
import PageAssistantButton from '@/components/ai/page-assistant-button'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
type ReadStatus = 'ok' | 'anomaly' | 'missing' | 'reviewed'
type SyncStatus = 'pending' | 'synced' | 'error'

interface MeterRead {
  id: string
  propertyId: string
  property: string
  building: string
  tenant: string
  prevRead: number | null
  currRead: number | null
  usage: number | null
  status: ReadStatus
  period: string
}

interface Invoice {
  id: string
  number: string
  propertyId: string
  property: string
  building: string
  tenant: string
  tenantEmail: string
  period: string
  usage: number
  usageCharge: number
  supplyCharge: number
  subtotal: number
  gst: number
  total: number
  status: InvoiceStatus
  dueDate: string
  paidDate?: string
  myobStatus: SyncStatus
  myobRef?: string
}

interface Tariff {
  usageRate: number
  supplyCharge: number
  gstRate: number
  invoicePrefix: string
  paymentTerms: number
}

// ─── Seed data ───────────────────────────────────────────────────────────────
const TARIFF_DEFAULT: Tariff = {
  usageRate: 0.285,
  supplyCharge: 1.15,
  gstRate: 10,
  invoicePrefix: 'ELEC',
  paymentTerms: 14,
}

const electricityBuildings = [
  { id: 'b1', name: 'Parkview Apartments', address: '45 Park Street, Southbank VIC 3006', units: 12, occupied: 9 },
  { id: 'b2', name: 'University Gardens', address: '12 Swanston Street, Carlton VIC 3053', units: 20, occupied: 16 },
  { id: 'b6', name: 'Monash Towers', address: '900 Dandenong Road, Caulfield East VIC 3145', units: 24, occupied: 20 },
]

const initialMeterReads: MeterRead[] = [
  // Parkview Apartments
  { id: 'r1',  propertyId: 'p101', property: 'Unit 101', building: 'Parkview Apartments', tenant: 'Wei Zhang',       prevRead: 4210, currRead: 4398, usage: 188,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r2',  propertyId: 'p102', property: 'Unit 102', building: 'Parkview Apartments', tenant: 'Aisha Okonkwo',   prevRead: 3870, currRead: 4095, usage: 225,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r3',  propertyId: 'p103', property: 'Unit 103', building: 'Parkview Apartments', tenant: 'David Park',      prevRead: 2900, currRead: 3550, usage: 650,  status: 'anomaly', period: 'Jun 2026' },
  { id: 'r4',  propertyId: 'p201', property: 'Unit 201', building: 'Parkview Apartments', tenant: 'Sunita Rao',      prevRead: 5100, currRead: 5312, usage: 212,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r5',  propertyId: 'p202', property: 'Unit 202', building: 'Parkview Apartments', tenant: 'Oliver Nguyen',   prevRead: 1200, currRead: null, usage: null, status: 'missing', period: 'Jun 2026' },
  { id: 'r6',  propertyId: 'p301', property: 'Unit 301', building: 'Parkview Apartments', tenant: 'Isabelle Lam',    prevRead: 6780, currRead: 6995, usage: 215,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r7',  propertyId: 'p302', property: 'Unit 302', building: 'Parkview Apartments', tenant: 'Mohamed Ali',     prevRead: 3400, currRead: 3618, usage: 218,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r8',  propertyId: 'p401', property: 'Unit 401', building: 'Parkview Apartments', tenant: 'Trang Ho',        prevRead: 4500, currRead: 4710, usage: 210,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r9',  propertyId: 'p402', property: 'Unit 402', building: 'Parkview Apartments', tenant: 'Carlos Mendes',   prevRead: 2100, currRead: 2320, usage: 220,  status: 'ok',      period: 'Jun 2026' },
  // University Gardens
  { id: 'r10', propertyId: 'ug1a',  property: 'Unit 1A',  building: 'University Gardens', tenant: 'Priya Sharma',     prevRead: 8100, currRead: 8291, usage: 191,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r11', propertyId: 'ug2a',  property: 'Unit 2A',  building: 'University Gardens', tenant: 'James Murphy',     prevRead: 6230, currRead: 6418, usage: 188,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r12', propertyId: 'ug3a',  property: 'Unit 3A',  building: 'University Gardens', tenant: 'Lily Chen',        prevRead: 4400, currRead: 4592, usage: 192,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r13', propertyId: 'ug4a',  property: 'Unit 4A',  building: 'University Gardens', tenant: 'Ahmed Hassan',     prevRead: 3300, currRead: 3498, usage: 198,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r14', propertyId: 'ug5a',  property: 'Unit 5A',  building: 'University Gardens', tenant: 'Sophie Turner',    prevRead: 2900, currRead: 3085, usage: 185,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r15', propertyId: 'ug6b',  property: 'Unit 6B',  building: 'University Gardens', tenant: 'Ravi Patel',       prevRead: 5600, currRead: 5801, usage: 201,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r16', propertyId: 'ug7b',  property: 'Unit 7B',  building: 'University Gardens', tenant: 'Natalia Kowalski', prevRead: 4100, currRead: null, usage: null, status: 'missing', period: 'Jun 2026' },
  { id: 'r17', propertyId: 'ug8b',  property: 'Unit 8B',  building: 'University Gardens', tenant: 'Tom Williams',     prevRead: 6800, currRead: 7500, usage: 700,  status: 'anomaly', period: 'Jun 2026' },
  { id: 'r18', propertyId: 'ug9c',  property: 'Unit 9C',  building: 'University Gardens', tenant: 'Yuki Tanaka',      prevRead: 3200, currRead: 3390, usage: 190,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r19', propertyId: 'ug10c', property: 'Unit 10C', building: 'University Gardens', tenant: 'Emma Johnson',     prevRead: 4800, currRead: 4994, usage: 194,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r20', propertyId: 'ug11c', property: 'Unit 11C', building: 'University Gardens', tenant: 'Michael Brown',    prevRead: 2500, currRead: 2695, usage: 195,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r21', propertyId: 'ug12d', property: 'Unit 12D', building: 'University Gardens', tenant: 'Fatima Al-Hassan', prevRead: 5100, currRead: 5293, usage: 193,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r22', propertyId: 'ug13d', property: 'Unit 13D', building: 'University Gardens', tenant: 'Lucas Oliveira',   prevRead: 3700, currRead: 3888, usage: 188,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r23', propertyId: 'ug14d', property: 'Unit 14D', building: 'University Gardens', tenant: 'Hannah Schmidt',   prevRead: 2200, currRead: 2398, usage: 198,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r24', propertyId: 'ug15e', property: 'Unit 15E', building: 'University Gardens', tenant: 'Ivan Petrov',      prevRead: 6300, currRead: 6497, usage: 197,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r25', propertyId: 'ug16e', property: 'Unit 16E', building: 'University Gardens', tenant: 'Chen Wei',         prevRead: 4900, currRead: 5092, usage: 192,  status: 'ok',      period: 'Jun 2026' },
  // Monash Towers
  { id: 'r26', propertyId: 'mt101',  property: 'Unit 101',  building: 'Monash Towers', tenant: 'Sandra Kim',           prevRead: 7800, currRead: 7994, usage: 194,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r27', propertyId: 'mt102',  property: 'Unit 102',  building: 'Monash Towers', tenant: "Patrick O'Brien",      prevRead: 5400, currRead: 5599, usage: 199,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r28', propertyId: 'mt201',  property: 'Unit 201',  building: 'Monash Towers', tenant: 'Mei Lin',              prevRead: 3200, currRead: 3394, usage: 194,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r29', propertyId: 'mt202',  property: 'Unit 202',  building: 'Monash Towers', tenant: 'George Papadopoulos', prevRead: 8900, currRead: 9097, usage: 197,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r30', propertyId: 'mt301',  property: 'Unit 301',  building: 'Monash Towers', tenant: 'Amara Diallo',         prevRead: 4600, currRead: 5300, usage: 700,  status: 'anomaly', period: 'Jun 2026' },
  { id: 'r31', propertyId: 'mt302',  property: 'Unit 302',  building: 'Monash Towers', tenant: 'William Foster',       prevRead: 2900, currRead: 3098, usage: 198,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r32', propertyId: 'mt401',  property: 'Unit 401',  building: 'Monash Towers', tenant: 'Nadia Rousseau',       prevRead: 6100, currRead: 6295, usage: 195,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r33', propertyId: 'mt402',  property: 'Unit 402',  building: 'Monash Towers', tenant: 'Benjamin Lee',         prevRead: 3400, currRead: 3592, usage: 192,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r34', propertyId: 'mt501',  property: 'Unit 501',  building: 'Monash Towers', tenant: 'Carlos Rodriguez',     prevRead: 5700, currRead: 5893, usage: 193,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r35', propertyId: 'mt502',  property: 'Unit 502',  building: 'Monash Towers', tenant: 'Hana Watanabe',        prevRead: 4200, currRead: null, usage: null, status: 'missing', period: 'Jun 2026' },
  { id: 'r36', propertyId: 'mt601',  property: 'Unit 601',  building: 'Monash Towers', tenant: 'Reza Ahmadi',          prevRead: 7200, currRead: 7395, usage: 195,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r37', propertyId: 'mt602',  property: 'Unit 602',  building: 'Monash Towers', tenant: 'Laura Martinez',       prevRead: 3800, currRead: 3994, usage: 194,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r38', propertyId: 'mt701',  property: 'Unit 701',  building: 'Monash Towers', tenant: 'Kwame Mensah',         prevRead: 5500, currRead: 5695, usage: 195,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r39', propertyId: 'mt702',  property: 'Unit 702',  building: 'Monash Towers', tenant: 'Chloe Dupont',         prevRead: 4000, currRead: 4192, usage: 192,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r40', propertyId: 'mt801',  property: 'Unit 801',  building: 'Monash Towers', tenant: 'Arjun Singh',          prevRead: 6400, currRead: 6593, usage: 193,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r41', propertyId: 'mt802',  property: 'Unit 802',  building: 'Monash Towers', tenant: 'Valentina Cruz',       prevRead: 2700, currRead: 2897, usage: 197,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r42', propertyId: 'mt901',  property: 'Unit 901',  building: 'Monash Towers', tenant: 'Sam Yong',             prevRead: 8100, currRead: 8295, usage: 195,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r43', propertyId: 'mt902',  property: 'Unit 902',  building: 'Monash Towers', tenant: 'Anna Kowalczyk',       prevRead: 5300, currRead: 5493, usage: 193,  status: 'ok',      period: 'Jun 2026' },
  { id: 'r44', propertyId: 'mt1001', property: 'Unit 1001', building: 'Monash Towers', tenant: 'Jacob Müller',         prevRead: 3900, currRead: 4096, usage: 196,  status: 'ok',      period: 'Jun 2026' },
]

const pastInvoices: Invoice[] = [
  { id: 'inv-m1', number: 'ELEC-2026-05-001', propertyId: 'p101',  property: 'Unit 101', building: 'Parkview Apartments', tenant: 'Wei Zhang',      tenantEmail: 'wei.zhang@example.com',      period: 'May 2026', usage: 195, usageCharge: 55.58, supplyCharge: 34.50, subtotal: 90.08,  gst: 9.01, total: 99.09,  status: 'paid',    dueDate: '14 Jun 2026', paidDate: '10 Jun 2026', myobStatus: 'synced', myobRef: 'MYOB-88211' },
  { id: 'inv-m2', number: 'ELEC-2026-05-002', propertyId: 'p102',  property: 'Unit 102', building: 'Parkview Apartments', tenant: 'Aisha Okonkwo',  tenantEmail: 'aisha.okonkwo@example.com',  period: 'May 2026', usage: 230, usageCharge: 65.55, supplyCharge: 34.50, subtotal: 100.05, gst: 10.01, total: 110.06, status: 'paid',    dueDate: '14 Jun 2026', paidDate: '12 Jun 2026', myobStatus: 'synced', myobRef: 'MYOB-88212' },
  { id: 'inv-m3', number: 'ELEC-2026-05-003', propertyId: 'ug1a',  property: 'Unit 1A',  building: 'University Gardens',  tenant: 'Priya Sharma',   tenantEmail: 'priya.sharma@example.com',   period: 'May 2026', usage: 188, usageCharge: 53.58, supplyCharge: 34.50, subtotal: 88.08,  gst: 8.81, total: 96.89,  status: 'overdue', dueDate: '14 Jun 2026',                          myobStatus: 'synced', myobRef: 'MYOB-88213' },
  { id: 'inv-m4', number: 'ELEC-2026-05-004', propertyId: 'mt101', property: 'Unit 101', building: 'Monash Towers',        tenant: 'Sandra Kim',     tenantEmail: 'sandra.kim@example.com',     period: 'May 2026', usage: 201, usageCharge: 57.29, supplyCharge: 34.50, subtotal: 91.79,  gst: 9.18, total: 100.97, status: 'sent',    dueDate: '14 Jun 2026',                          myobStatus: 'pending' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function computeInvoice(r: MeterRead, tariff: Tariff, num: number): Invoice {
  const usage = r.usage ?? 0
  const usageCharge = usage * tariff.usageRate
  const supplyCharge = 30 * tariff.supplyCharge
  const subtotal = usageCharge + supplyCharge
  const gst = subtotal * (tariff.gstRate / 100)
  const total = subtotal + gst
  return {
    id: `inv-${r.propertyId}`,
    number: `${tariff.invoicePrefix}-2026-06-${String(num).padStart(3, '0')}`,
    propertyId: r.propertyId,
    property: r.property,
    building: r.building,
    tenant: r.tenant,
    tenantEmail: `${r.tenant.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.')}@example.com`,
    period: r.period,
    usage,
    usageCharge,
    supplyCharge,
    subtotal,
    gst,
    total,
    status: 'draft',
    dueDate: '14 Jul 2026',
    myobStatus: 'pending',
  }
}

// ─── Badge components ────────────────────────────────────────────────────────
function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'gray' | 'info' }> = {
    draft:   { label: 'Draft',   variant: 'gray' },
    sent:    { label: 'Sent',    variant: 'info' },
    paid:    { label: 'Paid',    variant: 'success' },
    overdue: { label: 'Overdue', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

function ReadStatusBadge({ status }: { status: ReadStatus }) {
  const map: Record<ReadStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'gray' | 'info' }> = {
    ok:       { label: 'OK',       variant: 'success' },
    anomaly:  { label: 'Anomaly',  variant: 'danger' },
    missing:  { label: 'Missing',  variant: 'warning' },
    reviewed: { label: 'Reviewed', variant: 'gray' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'gray' | 'info' }> = {
    pending: { label: 'Pending', variant: 'warning' },
    synced:  { label: 'Synced',  variant: 'success' },
    error:   { label: 'Error',   variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

// ─── Page ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'reads' | 'invoices' | 'myob' | 'settings'

export default function ElectricityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [meterReads, setMeterReads] = useState<MeterRead[]>(initialMeterReads)
  const [invoices, setInvoices] = useState<Invoice[]>(pastInvoices)
  const [tariff, setTariff] = useState<Tariff>(TARIFF_DEFAULT)
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [syncLog, setSyncLog] = useState<{ ref: string; invoice: string; amount: number; ts: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentReads = meterReads.filter(r => r.period === 'Jun 2026')
  const anomalies = currentReads.filter(r => r.status === 'anomaly')
  const missingReads = currentReads.filter(r => r.status === 'missing')
  const currentInvoices = invoices.filter(i => i.period === 'Jun 2026')
  const draftInvoices = currentInvoices.filter(i => i.status === 'draft')
  const sentInvoices = invoices.filter(i => i.status === 'sent')
  const overdueInvoices = invoices.filter(i => i.status === 'overdue')
  const pendingSync = invoices.filter(i => i.myobStatus === 'pending' && i.status !== 'draft')
  const totalOutstanding = [...sentInvoices, ...overdueInvoices].reduce((s, i) => s + i.total, 0)

  function handleGenerateInvoices() {
    const readable = currentReads.filter(r => r.usage !== null && r.status !== 'missing')
    const existing = new Set(currentInvoices.map(i => i.propertyId))
    const toCreate = readable.filter(r => !existing.has(r.propertyId))
    if (toCreate.length === 0) return
    const startNum = currentInvoices.length + 1
    const newInvoices = toCreate.map((r, idx) => computeInvoice(r, tariff, startNum + idx))
    setInvoices(prev => [...prev, ...newInvoices])
  }

  function handleSendInvoice(id: string) {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'sent' as const } : i))
  }

  function handleSendAll() {
    setInvoices(prev => prev.map(i => i.status === 'draft' ? { ...i, status: 'sent' as const } : i))
  }

  function handleMarkPaid(id: string) {
    const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' as const, paidDate: today } : i))
  }

  function handleReviewAnomaly(id: string) {
    setMeterReads(prev => prev.map(r => r.id === id ? { ...r, status: 'reviewed' as const } : r))
  }

  function handleMYOBSync() {
    setSyncing(true)
    const toSync = [...pendingSync]
    setTimeout(() => {
      const newLog = toSync.map(i => ({
        ref: `MYOB-${Math.floor(88300 + Math.random() * 700)}`,
        invoice: i.number,
        amount: i.total,
        ts: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }))
      const refMap = Object.fromEntries(toSync.map((i, idx) => [i.id, newLog[idx].ref]))
      setInvoices(prev => prev.map(i =>
        refMap[i.id] ? { ...i, myobStatus: 'synced' as const, myobRef: refMap[i.id] } : i
      ))
      setSyncLog(prev => [...newLog, ...prev])
      setSyncing(false)
    }, 1800)
  }

  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    setImportDone(true)
    if (e.target) e.target.value = ''
  }

  const filteredReads = currentReads.filter(r => {
    if (buildingFilter !== 'all' && r.building !== buildingFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  const filteredInvoices = invoices.filter(i =>
    buildingFilter === 'all' || i.building === buildingFilter
  )

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reads',    label: 'Meter Reads', badge: anomalies.length + missingReads.length },
    { id: 'invoices', label: 'Invoices',    badge: draftInvoices.length },
    { id: 'myob',     label: 'MYOB Sync',   badge: pendingSync.length },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Electricity Billing</h1>
          <p className="text-[13px] text-ink-muted mt-0.5">
            {electricityBuildings.length} buildings retailing · {currentReads.filter(r => r.usage !== null).length} reads this month · {anomalies.length} anomalies detected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageAssistantButton
            context={{ page: 'Electricity Billing' }}
            suggestedPrompts={['Which electricity accounts are overdue?', 'Explain billing status', 'Draft an SMS reminder for an overdue account', 'Which accounts have failed DDR?', 'Summarise electricity billing this month']}
          />
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            Import Reads
          </Button>
          <Button size="sm" onClick={handleGenerateInvoices}>
            <FileText className="h-3.5 w-3.5" />
            Generate Invoices
          </Button>
        </div>
      </div>

      {/* Anomaly alert */}
      {anomalies.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-neg/20 bg-neg/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-neg mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-ink">
              {anomalies.length} anomalous meter read{anomalies.length !== 1 ? 's' : ''} detected
            </p>
            <p className="text-[12px] text-ink-muted mt-0.5">
              Usage is significantly above the building average. Review before generating invoices.{' '}
              <button onClick={() => setActiveTab('reads')} className="text-primary hover:underline font-medium">
                Review now →
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Import success */}
      {importDone && (
        <div className="flex items-center gap-3 rounded-xl border border-pos/20 bg-pos/5 px-4 py-3">
          <Check className="h-4 w-4 text-pos shrink-0" />
          <p className="text-[13px] text-ink flex-1">CSV imported successfully. Meter reads have been updated.</p>
          <button onClick={() => setImportDone(false)} className="text-ink-faint hover:text-ink-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="flex -mb-px">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-line-strong'
              )}
            >
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={cn(
                  'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                  activeTab === t.id ? 'bg-primary text-white' : 'bg-surface-muted text-ink-muted'
                )}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Reads',    value: currentReads.filter(r => r.usage !== null).length, color: 'text-ink',  sub: `${missingReads.length} missing` },
              { label: 'Anomalies',       value: anomalies.length, color: anomalies.length > 0 ? 'text-neg' : 'text-pos', sub: 'Jun 2026' },
              { label: 'Outstanding',     value: `$${totalOutstanding.toFixed(0)}`, color: overdueInvoices.length > 0 ? 'text-warn' : 'text-ink', sub: `${sentInvoices.length} sent · ${overdueInvoices.length} overdue` },
              { label: 'MYOB Pending',    value: pendingSync.length, color: pendingSync.length > 0 ? 'text-warn' : 'text-pos', sub: 'invoices to sync' },
            ].map(card => (
              <div key={card.label} className="rounded-xl border border-line bg-surface shadow-card p-4">
                <p className="text-xs text-ink-subtle font-medium">{card.label}</p>
                <p className={cn('text-2xl font-bold mt-1', card.color)}>{card.value}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink">Electricity Retailing Buildings</p>
                <a href="/buildings" className="text-[12px] text-primary hover:underline">Manage buildings →</a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Occupied</TableHead>
                    <TableHead>Reads This Month</TableHead>
                    <TableHead>Anomalies</TableHead>
                    <TableHead>Jun Invoices</TableHead>
                    <TableHead>Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {electricityBuildings.map(b => {
                    const bReads = currentReads.filter(r => r.building === b.name)
                    const bAnom = bReads.filter(r => r.status === 'anomaly')
                    const bInvs = invoices.filter(i => i.building === b.name && i.period === 'Jun 2026')
                    const bOwed = bInvs.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total, 0)
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex-shrink-0 w-7 h-7 bg-warn/10 rounded-lg flex items-center justify-center">
                              <Zap className="h-3.5 w-3.5 text-warn" />
                            </div>
                            <div>
                              <p className="font-medium text-ink text-[13px]">{b.name}</p>
                              <p className="text-[11px] text-ink-faint">{b.address}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><span className="text-[13px] text-ink-muted">{b.occupied} / {b.units}</span></TableCell>
                        <TableCell>
                          <span className="text-[13px] font-medium text-ink">{bReads.filter(r => r.usage !== null).length}</span>
                          <span className="text-[11px] text-ink-faint ml-1">/ {bReads.length}</span>
                        </TableCell>
                        <TableCell>
                          {bAnom.length > 0
                            ? <Badge variant="danger" dot>{bAnom.length}</Badge>
                            : <Badge variant="success" dot>None</Badge>}
                        </TableCell>
                        <TableCell><span className="text-[13px] text-ink-muted">{bInvs.length} generated</span></TableCell>
                        <TableCell>
                          <span className={cn('text-[13px] font-medium', bOwed > 0 ? 'text-warn' : 'text-ink-faint')}>
                            {bOwed > 0 ? `$${bOwed.toFixed(2)}` : '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Upload,    label: 'Import Meter Reads', desc: `Upload CSV for June 2026 (${currentReads.length} properties)`, color: 'bg-info/10 text-info',       action: () => fileInputRef.current?.click() },
              { icon: FileText,  label: 'Generate Invoices',  desc: `Create invoices for all readable properties`,                  color: 'bg-primary-soft text-primary', action: handleGenerateInvoices },
              { icon: RefreshCw, label: 'Sync to MYOB',       desc: `${pendingSync.length} invoices pending sync`,                  color: 'bg-warn/10 text-warn',         action: () => setActiveTab('myob') },
            ].map(a => (
              <button
                key={a.label}
                onClick={a.action}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface shadow-card p-4 text-left hover:bg-surface-muted transition-colors"
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', a.color)}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{a.label}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── METER READS ──────────────────────────────────────────────────── */}
      {activeTab === 'reads' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              <select
                value={buildingFilter}
                onChange={e => setBuildingFilter(e.target.value)}
                className="text-[13px] border border-line rounded-lg px-3 py-1.5 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-ring/50"
              >
                <option value="all">All Buildings</option>
                {electricityBuildings.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-[13px] border border-line rounded-lg px-3 py-1.5 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-ring/50"
              >
                <option value="all">All Statuses</option>
                <option value="ok">OK</option>
                <option value="anomaly">Anomaly</option>
                <option value="missing">Missing</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-faint">Period: Jun 2026</span>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                Import CSV
              </Button>
            </div>
          </div>

          {anomalies.length > 0 && (
            <div className="rounded-xl border border-neg/20 bg-neg/5 px-4 py-3 text-[12px] text-ink-muted">
              <span className="font-semibold text-ink">Anomaly detection: </span>
              Reads flagged where usage is &gt;180% of the building average for the period. Review and mark as verified before invoicing.
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Prev Read</TableHead>
                    <TableHead>Curr Read</TableHead>
                    <TableHead>Usage (kWh)</TableHead>
                    <TableHead>Est. Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReads.map(r => {
                    const est = r.usage !== null
                      ? (r.usage * tariff.usageRate + 30 * tariff.supplyCharge) * (1 + tariff.gstRate / 100)
                      : null
                    return (
                      <TableRow key={r.id} className={r.status === 'anomaly' ? 'bg-neg/5' : ''}>
                        <TableCell><span className="text-[13px] font-medium text-ink">{r.property}</span></TableCell>
                        <TableCell><span className="text-[13px] text-ink-muted">{r.tenant}</span></TableCell>
                        <TableCell><span className="text-[12px] text-ink-faint">{r.building}</span></TableCell>
                        <TableCell>
                          <span className="text-[13px] font-mono text-ink-muted">
                            {r.prevRead?.toLocaleString() ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-[13px] font-mono', r.currRead === null ? 'text-ink-faint italic' : 'text-ink-muted')}>
                            {r.currRead?.toLocaleString() ?? 'Missing'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {r.status === 'anomaly' && <AlertTriangle className="h-3.5 w-3.5 text-neg shrink-0" />}
                            <span className={cn(
                              'text-[13px] font-semibold',
                              r.status === 'anomaly' ? 'text-neg' : r.usage === null ? 'text-ink-faint' : 'text-ink'
                            )}>
                              {r.usage?.toLocaleString() ?? '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-[13px]', est !== null ? 'font-medium text-ink' : 'text-ink-faint')}>
                            {est !== null ? `$${est.toFixed(2)}` : '—'}
                          </span>
                        </TableCell>
                        <TableCell><ReadStatusBadge status={r.status} /></TableCell>
                        <TableCell>
                          {r.status === 'anomaly' && (
                            <button
                              onClick={() => handleReviewAnomaly(r.id)}
                              className="text-[12px] text-primary hover:underline font-medium whitespace-nowrap"
                            >
                              Mark reviewed
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INVOICES ─────────────────────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Draft',   value: invoices.filter(i => i.status === 'draft').length,   color: 'text-ink-muted' },
              { label: 'Sent',    value: sentInvoices.length,                                   color: 'text-info' },
              { label: 'Paid',    value: invoices.filter(i => i.status === 'paid').length,    color: 'text-pos' },
              { label: 'Overdue', value: overdueInvoices.length,                               color: overdueInvoices.length > 0 ? 'text-neg' : 'text-ink-muted' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-line bg-surface p-3 shadow-card">
                <p className="text-[11px] text-ink-subtle font-medium">{s.label}</p>
                <p className={cn('text-xl font-bold mt-0.5', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <select
              value={buildingFilter}
              onChange={e => setBuildingFilter(e.target.value)}
              className="text-[13px] border border-line rounded-lg px-3 py-1.5 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-ring/50"
            >
              <option value="all">All Buildings</option>
              {electricityBuildings.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <div className="flex gap-2">
              {draftInvoices.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSendAll}>
                  <Mail className="h-3.5 w-3.5" />
                  Email All ({draftInvoices.length})
                </Button>
              )}
              <Button size="sm" onClick={handleGenerateInvoices}>
                <Plus className="h-3.5 w-3.5" />
                Generate
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Total (inc GST)</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MYOB</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <div className="py-10 text-center text-ink-faint text-[13px]">
                          No invoices yet. Generate invoices from the meter reads tab.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <code className="text-[11px] font-mono text-ink-muted bg-surface-muted px-1.5 py-0.5 rounded">
                          {inv.number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-medium text-ink">{inv.property}</p>
                          <p className="text-[11px] text-ink-faint">{inv.building}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-[13px] text-ink-muted">{inv.tenant}</p>
                          <p className="text-[11px] text-ink-faint">{inv.tenantEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-[12px] text-ink-muted">{inv.period}</span></TableCell>
                      <TableCell><span className="text-[13px] text-ink-muted">{inv.usage.toLocaleString()} kWh</span></TableCell>
                      <TableCell><span className="text-[13px] font-semibold text-ink">${inv.total.toFixed(2)}</span></TableCell>
                      <TableCell>
                        <span className={cn('text-[12px]', inv.status === 'overdue' ? 'text-neg font-medium' : 'text-ink-muted')}>
                          {inv.dueDate}
                          {inv.paidDate && <span className="block text-[11px] text-pos">Paid {inv.paidDate}</span>}
                        </span>
                      </TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                      <TableCell><SyncStatusBadge status={inv.myobStatus} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {inv.status === 'draft' && (
                            <button
                              onClick={() => handleSendInvoice(inv.id)}
                              title="Email to tenant"
                              className="p-1.5 rounded-md text-ink-faint hover:text-info hover:bg-info/10 transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {(inv.status === 'sent' || inv.status === 'overdue') && (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              title="Mark as paid"
                              className="p-1.5 rounded-md text-ink-faint hover:text-pos hover:bg-pos/10 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MYOB SYNC ────────────────────────────────────────────────────── */}
      {activeTab === 'myob' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-info/15 mt-0.5">
              <span className="text-info text-[10px] font-bold">i</span>
            </div>
            <p className="text-[13px] text-ink-muted">
              <span className="font-semibold text-ink">Manual sync only. </span>
              Invoices are never pushed to MYOB automatically. Review the list below, then click{' '}
              <strong>Push to MYOB</strong> to create customer invoices in your MYOB account.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-surface shadow-card p-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">
                {pendingSync.length > 0
                  ? `${pendingSync.length} invoice${pendingSync.length !== 1 ? 's' : ''} ready to sync`
                  : 'All invoices synced to MYOB'}
              </p>
              <p className="text-[12px] text-ink-faint mt-0.5">
                Total: ${pendingSync.reduce((s, i) => s + i.total, 0).toFixed(2)} inc GST
              </p>
            </div>
            <Button
              onClick={handleMYOBSync}
              disabled={pendingSync.length === 0 || syncing}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
              {syncing ? 'Syncing...' : 'Push to MYOB'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <p className="text-[13px] font-semibold text-ink">All Sent Invoices</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice Status</TableHead>
                    <TableHead>MYOB Status</TableHead>
                    <TableHead>MYOB Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.filter(i => i.status !== 'draft').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="py-10 text-center text-ink-faint text-[13px]">
                          No sent invoices yet. Send invoices to tenants from the Invoices tab first.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : invoices.filter(i => i.status !== 'draft').map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <code className="text-[11px] font-mono text-ink-muted bg-surface-muted px-1.5 py-0.5 rounded">
                          {inv.number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-medium text-ink">{inv.property}</p>
                          <p className="text-[11px] text-ink-faint">{inv.building}</p>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-[13px] text-ink-muted">{inv.tenant}</span></TableCell>
                      <TableCell><span className="text-[13px] font-semibold text-ink">${inv.total.toFixed(2)}</span></TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                      <TableCell><SyncStatusBadge status={inv.myobStatus} /></TableCell>
                      <TableCell>
                        {inv.myobRef
                          ? <code className="text-[11px] font-mono text-pos bg-pos/5 px-1.5 py-0.5 rounded">{inv.myobRef}</code>
                          : <span className="text-[12px] text-ink-faint">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {syncLog.length > 0 && (
            <Card>
              <CardHeader>
                <p className="text-[13px] font-semibold text-ink">Sync Log</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {syncLog.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 text-[12px]">
                      <Check className="h-3.5 w-3.5 text-pos shrink-0" />
                      <code className="text-ink font-mono">{entry.ref}</code>
                      <span className="text-ink-muted truncate">{entry.invoice}</span>
                      <span className="text-ink-muted">${entry.amount.toFixed(2)}</span>
                      <span className="text-ink-faint ml-auto shrink-0">{entry.ts}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── SETTINGS ─────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="max-w-xl space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warn" />
                <p className="text-[13px] font-semibold text-ink">Tariff & Billing Settings</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Usage Rate ($/kWh)', key: 'usageRate' as const, step: '0.001', type: 'number' },
                  { label: 'Supply Charge ($/day)', key: 'supplyCharge' as const, step: '0.01', type: 'number' },
                  { label: 'GST Rate (%)', key: 'gstRate' as const, step: '1', type: 'number' },
                  { label: 'Payment Terms (days)', key: 'paymentTerms' as const, step: '1', type: 'number' },
                  { label: 'Invoice Prefix', key: 'invoicePrefix' as const, step: undefined, type: 'text' },
                ].map(field => (
                  <div key={field.key} className={field.key === 'invoicePrefix' ? 'col-span-2' : ''}>
                    <label className="block text-[12px] font-medium text-ink-muted mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      step={field.step}
                      value={tariff[field.key]}
                      onChange={e => {
                        const val = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        setTariff(t => ({ ...t, [field.key]: val }))
                      }}
                      className="w-full px-3 py-2 text-[13px] bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-ring/50 text-ink"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-line bg-surface-muted p-3.5">
                <p className="text-[12px] font-medium text-ink-muted mb-2">Invoice preview (200 kWh · 30-day period)</p>
                {(() => {
                  const usage = 200 * tariff.usageRate
                  const supply = 30 * tariff.supplyCharge
                  const subtotal = usage + supply
                  const gst = subtotal * (tariff.gstRate / 100)
                  return (
                    <div className="space-y-1 text-[12px]">
                      {[
                        { label: 'Usage charge', value: usage },
                        { label: 'Supply charge', value: supply },
                        { label: `GST (${tariff.gstRate}%)`, value: gst },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between text-ink-muted">
                          <span>{row.label}</span>
                          <span>${row.value.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-line mt-2 pt-2 flex justify-between font-semibold text-ink text-[13px]">
                        <span>Total inc GST</span>
                        <span>${(subtotal + gst).toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <Button>
                <SettingsIcon className="h-3.5 w-3.5" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
