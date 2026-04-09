import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { loginSchema } from "@/lib/validations/auth.schema"
import type { Role } from "@prisma/client"

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  // Adapter kullanılmıyor: JWT strategy + custom MagicLinkToken ile adapter gerekmez.
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
        magicToken: { label: "Magic Token", type: "text" },
      },
      async authorize(credentials) {
        // ── Magic link akışı ──────────────────────────────
        // MagicLinkHandler, token doğrulandıktan sonra
        // { email, magicToken } ile signIn çağırır.
        // validate endpoint token'ı zaten usedAt ile işaretlemiş olduğundan
        // burada sadece kullanıcıyı DB'den çekip döndürüyoruz.
        const creds = credentials as Record<string, unknown>
        if (creds?.magicToken) {
          const user = await prisma.user.findUnique({
            where: { email: creds.email as string },
          })
          if (!user) return null
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            onboardingCompleted: user.onboardingCompleted,
          }
        }

        // ── Normal credentials akışı ──────────────────────
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // İlk sign-in: user objesi dolu gelir
      if (user) {
        token.id = user.id
        token.role = (user as { role: Role }).role
        token.onboardingCompleted = (user as { onboardingCompleted: boolean }).onboardingCompleted
      }
      // Session update: useSession().update() veya unstable_update() çağrısında
      // onboardingCompleted token'a yansıtılır (onboarding tamamlama için)
      if (trigger === "update" && session?.onboardingCompleted !== undefined) {
        token.onboardingCompleted = session.onboardingCompleted as boolean
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
      }
      return session
    },
  },
})
