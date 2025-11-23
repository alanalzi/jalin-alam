export { default } from "next-auth/middleware"

// Tentukan route yang butuh login
export const config = {
  matcher: ["/dashboard/:path*"],
}
