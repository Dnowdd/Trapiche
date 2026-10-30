import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import {
  sendChangeEmailConfirmation,
  sendNewEmailVerification,
  sendPasswordChanged,
  sendPasswordReset,
  sendVerificationEmail,
} from "./emails/send";

const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";

const handleOf = (user: object) => (user as { handle?: string }).handle ?? "";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !skipEmailVerification,
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordReset({
        to: user.email,
        name: user.name,
        handle: handleOf(user) || user.email,
        url,
      });
    },
    onPasswordReset: async ({ user }) => {
      await sendPasswordChanged({ to: user.email, name: user.name }).catch(
        () => null,
      );
    },
  },

  emailVerification: {
    sendOnSignUp: !skipEmailVerification,
    autoSignInAfterVerification: true,
    expiresIn: 24 * 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      const current = await db.user.findUnique({
        where: { id: user.id },
        select: { email: true },
      });
      if (current && current.email !== user.email) {
        await sendNewEmailVerification({
          to: user.email,
          name: user.name,
          url,
        });
        return;
      }
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        handle: handleOf(user) || user.email,
        url,
      });
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-password") return;
      const user = ctx.context.newSession?.user ?? ctx.context.session?.user;
      if (!user || ctx.context.returned instanceof Error) return;
      await sendPasswordChanged({ to: user.email, name: user.name }).catch(
        () => null,
      );
    }),
  },

  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendChangeEmailConfirmation({
          to: user.email,
          name: user.name,
          newEmail,
          url,
        });
      },
    },
    additionalFields: {
      handle: {
        type: "string",
        required: true,
        unique: true,
        input: true,
      },
      isAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
