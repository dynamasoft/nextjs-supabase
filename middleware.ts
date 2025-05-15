import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Update the session
  const response = await updateSession(request)

  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Public routes - no authentication needed
  const publicRoutes = ["/", "/login", "/signup", "/login/direct", "/auth/callback"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Get the session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set() {
          // We don't need to set cookies in middleware
        },
        remove() {
          // We don't need to remove cookies in middleware
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  // If the user is not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const redirectUrl = new URL("/login/direct", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is authenticated and trying to access login/signup, redirect to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

// Only run middleware on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

import { createServerClient } from "@supabase/ssr"
