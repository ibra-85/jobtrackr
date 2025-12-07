import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as schema from "@/db/drizzle-schema"
import { sendVerificationEmail, sendResetPasswordEmail } from "@/lib/email/templates"

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set in environment variables")
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Tu peux activer cela plus tard
    sendResetPassword: async ({ user, url, token }, request) => {
      // Ne pas await pour éviter les timing attacks, mais gérer les erreurs
      sendResetPasswordEmail({
        to: user.email,
        url,
        userName: user.name,
      }).catch((error) => {
        // En mode test Resend, on ne peut envoyer qu'à sa propre adresse
        if (error?.statusCode === 403) {
          console.warn(
            `[Resend Test Mode] Impossible d'envoyer l'email de réinitialisation à ${user.email}. ` +
            `En mode test, Resend n'autorise que l'envoi à votre adresse email vérifiée. ` +
            `Pour envoyer à d'autres adresses, vérifiez un domaine sur resend.com/domains`
          )
        } else {
          console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error)
        }
      })
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Password for user ${user.email} has been reset.`)
    },
    resetPasswordTokenExpiresIn: 3600, // 1 heure
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // En mode développement, ne pas envoyer d'email de vérification
      if (process.env.NODE_ENV === "development") {
        console.log(`[Dev Mode] Email de vérification ignoré pour ${user.email} (mode développement)`)
        return
      }

      // Ne pas await pour éviter les timing attacks, mais gérer les erreurs
      sendVerificationEmail({
        to: user.email,
        url,
        userName: user.name,
      }).catch((error) => {
        // En mode test Resend, on ne peut envoyer qu'à sa propre adresse
        if (error?.statusCode === 403) {
          console.warn(
            `[Resend Test Mode] Impossible d'envoyer l'email de vérification à ${user.email}. ` +
            `En mode test, Resend n'autorise que l'envoi à votre adresse email vérifiée. ` +
            `Pour envoyer à d'autres adresses, vérifiez un domaine sur resend.com/domains`
          )
        } else {
          console.error("Erreur lors de l'envoi de l'email de vérification:", error)
        }
      })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
})

export type Session = typeof auth.$Infer.Session

