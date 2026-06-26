// Public, unauthenticated route group (tenant-facing). Deliberately does NOT
// use the dashboard layout — no sidebar, no auth gate.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100">
      {children}
    </div>
  )
}
