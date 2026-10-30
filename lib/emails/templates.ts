import { appUrl, escapeHtml as e, type EmailContent } from "./layout";

const hello = (name: string) => `Olá, ${e(name.split(" ")[0] || name)}`;

export function verificationEmail(v: {
  name: string;
  handle: string;
  url: string;
}): EmailContent {
  return {
    subject: "Confirme seu e-mail no Trapiche",
    preheader:
      "Confirme seu e-mail para ativar sua conta no Trapiche. O link expira em 24 horas.",
    eyebrow: "Confirmação<br />de e-mail",
    title: "Falta só um passo pra atracar.",
    blocks: [
      {
        kind: "text",
        html: `${hello(v.name)} — que bom ter você por aqui. Confirme seu e-mail pra ativar a conta <strong style="color:#433e12">@${e(v.handle)}</strong> e começar a montar suas estantes.`,
      },
      { kind: "button", label: "Confirmar meu e-mail", url: v.url },
      {
        kind: "note",
        title: "Este link expira em 24 horas.",
        body: "Se ele expirar, é só entrar de novo que mandamos outro.",
      },
      { kind: "divider" },
      {
        kind: "small",
        html: "Não criou uma conta no Trapiche? Pode ignorar este e-mail — nada acontece sem a confirmação.",
      },
    ],
  };
}

export function newEmailVerification(v: {
  name: string;
  email: string;
  url: string;
}): EmailContent {
  return {
    subject: "Confirme seu novo e-mail no Trapiche",
    preheader: "Confirme o novo endereço para concluir a troca de e-mail.",
    eyebrow: "Troca<br />de e-mail",
    title: "Confirme seu novo endereço.",
    blocks: [
      {
        kind: "text",
        html: `${hello(v.name)} — este é o novo e-mail da sua conta no Trapiche: <strong style="color:#433e12">${e(v.email)}</strong>. Confirme pra concluir a troca.`,
      },
      { kind: "button", label: "Confirmar novo e-mail", url: v.url },
      {
        kind: "note",
        title: "Este link expira em 24 horas.",
        body: "Até você confirmar, a conta continua usando o e-mail antigo.",
      },
      { kind: "divider" },
      {
        kind: "small",
        html: "Não pediu essa troca? Ignore este e-mail e, por segurança, troque sua senha.",
      },
    ],
  };
}

export function changeEmailConfirmation(v: {
  name: string;
  newEmail: string;
  url: string;
}): EmailContent {
  return {
    subject: "Você pediu para trocar seu e-mail no Trapiche",
    preheader: `Confirme a troca do e-mail da sua conta para ${v.newEmail}.`,
    eyebrow: "Troca<br />de e-mail",
    title: "Vamos trocar seu e-mail?",
    blocks: [
      {
        kind: "text",
        html: `${hello(v.name)} — recebemos um pedido pra trocar o e-mail da sua conta para <strong style="color:#433e12">${e(v.newEmail)}</strong>. Se foi você, aprove abaixo e depois confirme o novo endereço.`,
      },
      { kind: "button", label: "Aprovar a troca", url: v.url },
      {
        kind: "note",
        title: "Não foi você?",
        body: "Não toque no botão. Seu e-mail continua o mesmo — e vale trocar sua senha.",
      },
    ],
  };
}

export function passwordResetEmail(v: {
  name: string;
  handle: string;
  url: string;
}): EmailContent {
  return {
    subject: "Redefina sua senha no Trapiche",
    preheader:
      "Use o link para criar uma senha nova. Ele expira em 30 minutos.",
    eyebrow: "Recuperação<br />de acesso",
    title: "Vamos criar uma senha nova.",
    blocks: [
      {
        kind: "text",
        html: `${hello(v.name)} — recebemos um pedido para redefinir a senha da sua conta no Trapiche <strong style="color:#433e12">(@${e(v.handle)})</strong>. É só tocar no botão abaixo e escolher uma nova. Suas estantes continuam exatamente onde você parou.`,
      },
      { kind: "button", label: "Redefinir minha senha", url: v.url },
      {
        kind: "note",
        title: "Este link expira em 30 minutos.",
        body: "Por segurança, ele só pode ser usado uma vez.",
      },
      { kind: "divider" },
      {
        kind: "small",
        html: "Não foi você que pediu isso? Pode ignorar este e-mail com tranquilidade — sua senha atual continua valendo e nada muda.",
      },
    ],
  };
}

export function passwordChangedEmail(v: { name: string }): EmailContent {
  return {
    subject: "Sua senha do Trapiche foi alterada",
    preheader: "A senha da sua conta acabou de ser alterada.",
    eyebrow: "Segurança<br />da conta",
    title: "Sua senha foi alterada.",
    blocks: [
      {
        kind: "text",
        html: `${hello(v.name)} — só avisando que a senha da sua conta no Trapiche acabou de ser alterada.`,
      },
      {
        kind: "note",
        title: "Foi você? Então está tudo certo.",
        body: "Não precisa fazer mais nada.",
      },
      { kind: "divider" },
      {
        kind: "small",
        html: `Não reconhece essa mudança? <a href="${appUrl("/auth?mode=forgot")}" style="color:#433e12;font-weight:600">Redefina sua senha</a> agora e fale com a gente pelo <a href="${appUrl("/suporte")}" style="color:#433e12;font-weight:600">suporte</a>.`,
      },
    ],
    quote: false,
  };
}

export function supportReplyEmail(v: {
  name: string;
  number: number;
  subject: string;
  excerpt: string;
  url: string;
}): EmailContent {
  const excerpt =
    v.excerpt.length > 600
      ? `${v.excerpt.slice(0, 600).trimEnd()}…`
      : v.excerpt;
  return {
    subject: `Respondemos seu ticket #${v.number}`,
    preheader: excerpt.slice(0, 120),
    eyebrow: `Suporte<br />ticket #${v.number}`,
    title: "Chegou resposta no seu ticket.",
    blocks: [
      {
        kind: "text",
        html: `${hello(v.name)} — a equipe do Trapiche respondeu o seu ticket <strong style="color:#433e12">“${e(v.subject)}”</strong>:`,
      },
      { kind: "quote", text: e(excerpt), by: "Suporte do Trapiche" },
      {
        kind: "button",
        label: "Ver a conversa",
        url: v.url,
        fallback: false,
      },
      { kind: "divider" },
      {
        kind: "small",
        html: "Responda pelo site, na página do ticket — respostas a este e-mail não chegam até a equipe.",
      },
    ],
    quote: false,
  };
}
