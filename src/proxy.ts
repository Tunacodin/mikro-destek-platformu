import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Her rol için giriş sonrası yönlendirme hedefi
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  APPLICANT: "/dashboard",
  JURY: "/jury/dashboard",
}

// Kimlik doğrulama gerektirmeyen public path'ler
const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/magic-link"]

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 1. Public path'leri doğrudan geçir
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // 2. Statik dosya isteklerini geçir (matcher bunu yakalamadan önce)
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // 3. Oturum açılmamış → login'e yönlendir
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { role, onboardingCompleted } = req.auth.user

  // 4. Onboarding tamamlanmamış → onboarding sayfasına yönlendir
  //    (onboarding ve API istekleri hariç)
  if (
    !onboardingCompleted &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin))
  }

  // 5. Rol bazlı erişim kontrolü
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role] ?? "/login", req.nextUrl.origin)
    )
  }

  if (pathname.startsWith("/jury") && role !== "JURY") {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role] ?? "/login", req.nextUrl.origin)
    )
  }

  return NextResponse.next()
})

export const config = {
  // _next/static, _next/image, favicon.ico ve yaygın dosya uzantılarını atla
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
}
