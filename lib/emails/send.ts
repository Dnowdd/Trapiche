import { Resend } from "resend";
import { renderEmail, renderText, type EmailContent } from "./layout";
import {
  changeEmailConfirmation,
  newEmailVerification,
  passwordChangedEmail,
  passwordResetEmail,
  supportReplyEmail,
  verificationEmail,
} from "./templates";

const resend = new Resend(process.env.RESEND_API_KEY);

function from() {
  return process.env.RESEND_FROM_EMAIL ?? "Trapiche <onboarding@resend.dev>";
}

function send(to: string, content: EmailContent) {
  return resend.emails.send({
    from: from(),
    to,
    subject: content.subject,
    html: renderEmail(content),
    text: renderText(content),
  });
}

type Who = { to: string; name: string };

export const sendVerificationEmail = (
  v: Who & { handle: string; url: string },
) => send(v.to, verificationEmail(v));

export const sendNewEmailVerification = (v: Who & { url: string }) =>
  send(v.to, newEmailVerification({ ...v, email: v.to }));

export const sendChangeEmailConfirmation = (
  v: Who & { newEmail: string; url: string },
) => send(v.to, changeEmailConfirmation(v));

export const sendPasswordReset = (v: Who & { handle: string; url: string }) =>
  send(v.to, passwordResetEmail(v));

export const sendPasswordChanged = (v: Who) =>
  send(v.to, passwordChangedEmail(v));

export const sendSupportReply = (
  v: Who & { number: number; subject: string; excerpt: string; url: string },
) => send(v.to, supportReplyEmail(v));
