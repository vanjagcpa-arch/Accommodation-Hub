import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Health check must be reachable by monitoring tools without a session.
  if (request.nextUrl.pathname === '/api/health') {
    const res = NextResponse.next({ request })
    res.headers.set('x-pathname', request.nextUrl.pathname)
    return res
  }
  const response = await updateSession(request)
  // Forward pathname so server layouts can enforce module-level access control.
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
