import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";

const resend = new Resend(process.env.RESEND_API_KEY);

function from() {
  return process.env.RESEND_FROM_EMAIL ?? "Trapiche <onboarding@resend.dev>";
}

function loadTemplate(filename: string): string {
  return fs.readFileSync(
    path.join(process.cwd(), "app/emails", filename),
    "utf-8",
  );
}

function render(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template,
  );
}

export async function sendPasswordReset({
  to,
  name,
  handle,
  url,
}: {
  to: string;
  name: string;
  handle: string;
  url: string;
}) {
  const html = render(loadTemplate("password_recovery.html"), {
    user_name: name,
    user_handle: handle,
    reset_url: url,
  });

  return resend.emails.send({
    from: from(),
    to,
    subject: "Redefina sua senha no Trapiche",
    html,
  });
}

export async function sendVerificationEmail({
  to,
  name,
  handle,
  url,
}: {
  to: string;
  name: string;
  handle: string;
  url: string;
}) {
  const html = render(loadTemplate("email_verification.html"), {
    user_name: name,
    user_handle: handle,
    verify_url: url,
  });

  return resend.emails.send({
    from: from(),
    to,
    subject: "Confirme seu e-mail no Trapiche",
    html,
  });
}
