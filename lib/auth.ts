import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { db } from "./db"
import { sendPasswordReset } from "./emails/send"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordReset({
        to: user.email,
        name: user.name,
        handle: (user as { handle?: string }).handle ?? user.email,
        url,
      })
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: create a verification email template similar to password_recovery.html
      // For now, using a minimal inline email
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: "Trapiche <noreply@trapiche.com.br>",
        to: user.email,
        subject: "Confirme seu e-mail no Trapiche",
        html: `
          <p>Olá, ${user.name}!</p>
          <p>Clique no link abaixo para verificar seu e-mail e ativar sua conta no Trapiche:</p>
          <p><a href="${url}">Verificar e-mail</a></p>
          <p>O link expira em 24 horas.</p>
        `,
      })
    },
  },

  user: {
    additionalFields: {
      handle: {
        type: "string",
        required: true,
        unique: true,
        input: true,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
