import { describe, expect, it } from "vitest";
import { renderEmail, renderText } from "@/lib/emails/layout";
import * as templates from "@/lib/emails/templates";

const samples = [
  templates.verificationEmail({
    name: "Ana Souza",
    handle: "ana",
    url: "https://x.test/v?t=1&b=2",
  }),
  templates.newEmailVerification({
    name: "Ana",
    email: "nova@x.test",
    url: "https://x.test/n",
  }),
  templates.changeEmailConfirmation({
    name: "Ana",
    newEmail: "nova@x.test",
    url: "https://x.test/c",
  }),
  templates.passwordResetEmail({
    name: "Ana",
    handle: "ana",
    url: "https://x.test/r",
  }),
  templates.passwordChangedEmail({ name: "Ana" }),
  templates.supportReplyEmail({
    name: "Ana",
    number: 7,
    subject: "Capa <errada>",
    excerpt: "Oi <b>Ana</b>",
    url: "https://x.test/s",
  }),
];

describe("emails", () => {
  it("renders every template with a subject, the link and no leftover placeholders", () => {
    for (const s of samples) {
      const html = renderEmail(s);
      expect(html).toContain(
        `<title>${s.subject.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</title>`,
      );
      expect(html).not.toMatch(/\{\{|undefined|null/);
      const button = s.blocks.find((b) => b.kind === "button");
      if (button && button.kind === "button")
        expect(html).toContain(button.url.replaceAll("&", "&amp;"));
      expect(renderText(s)).not.toMatch(/<(p|a|strong|br|div|table)\b/i);
    }
  });

  it("escapes user content", () => {
    const html = renderEmail(samples[5]);
    expect(html).toContain("Capa &lt;errada&gt;");
    expect(html).toContain("Oi &lt;b&gt;Ana&lt;/b&gt;");
    expect(html).not.toContain("<b>Ana</b>");
  });

  it("greets by first name", () => {
    expect(renderEmail(samples[0])).toContain("Olá, Ana —");
  });
});
