import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuthToken } from './lib/jwt'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth routes (should not be accessible when logged in)
  const authRoutes = ['/login', '/signup', '/forgot-password', '/verify-otp']
  const isAuthRoute = authRoutes.includes(pathname)

  if (isProtectedRoute) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      verifyAuthToken(authToken)
    } catch {
      // Token is invalid, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      response.cookies.delete('refresh-token')
      return response
    }
  }

  if (isAuthRoute && authToken) {
    try {
      verifyAuthToken(authToken)
      // User is already authenticated, redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    } catch {
      // Token is invalid, allow access to auth routes
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}