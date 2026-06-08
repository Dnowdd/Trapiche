import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { sendPasswordReset, sendVerificationEmail } from "./emails/send";

const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !skipEmailVerification,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordReset({
        to: user.email,
        name: user.name,
        handle: (user as { handle?: string }).handle ?? user.email,
        url,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: !skipEmailVerification,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        handle: (user as { handle?: string }).handle ?? user.email,
        url,
      });
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
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
