import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware: password gate for all routes except /login and /api/auth.
 * Checks for a valid lc_auth cookie.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow login page, auth API, and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const cookie = req.cookies.get('lc_auth')?.value
  const appPassword = process.env.APP_PASSWORD

  // Fail closed: if no password is configured, deny access rather than
  // silently opening the gate. Set APP_PASSWORD before deploying.
  if (!appPassword) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('error', 'app-not-configured')
    return NextResponse.redirect(loginUrl)
  }

  // Simple token: btoa of the password (works in Edge Runtime)
  const expected = btoa(`lc:${appPassword}`)

  if (cookie === expected) {
    return NextResponse.next()
  }

  // Not authenticated — redirect to login
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
