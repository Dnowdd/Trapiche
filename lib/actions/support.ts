"use server";

import { db } from "../db";
import { fail, withUser } from "./result";
import { rateLimited } from "../rate-limit";
import { sendSupportReply } from "../emails/send";
import { appUrl } from "../emails/layout";
import {
  markTicketRead,
  messageInclude,
  newMessagesSince,
  toMessage,
} from "../queries/support";
import { imageType } from "../image-type";
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENTS_MAX,
  MESSAGE_MAX,
  OPEN_TICKETS_MAX,
  SUBJECT_MAX,
  TICKET_CATEGORIES,
  type TicketCategoryId,
} from "../support";
import type { NotificationKind } from "../generated/prisma/client";

async function access(ticketId: string, userId: string) {
  const [ticket, viewer] = await Promise.all([
    db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
  ]);
  if (!ticket) fail("Ticket não encontrado.");
  const owner = ticket.userId === userId;
  const admin = viewer?.isAdmin ?? false;
  if (!owner && !admin) fail("Ticket não encontrado.");
  return { ticket, owner, staff: admin && !owner };
}

async function readAttachments(form?: FormData) {
  const files = (form?.getAll("file") ?? []).filter(
    (f): f is File => f instanceof File && f.size > 0,
  );
  if (files.length > ATTACHMENTS_MAX)
    fail(`Dá pra anexar até ${ATTACHMENTS_MAX} imagens por mensagem.`);
  const widths = form?.getAll("width") ?? [];
  const heights = form?.getAll("height") ?? [];
  return Promise.all(
    files.map(async (file, i) => {
      if (file.size > ATTACHMENT_MAX_BYTES)
        fail("Uma das imagens ficou grande demais.");
      const data = new Uint8Array(await file.arrayBuffer());
      const mimeType = imageType(data);
      if (!mimeType) fail("Anexe imagens JPG, PNG ou WebP.");
      const dim = (v: FormDataEntryValue | undefined) =>
        Math.min(4000, Math.max(1, Math.round(Number(v) || 1)));
      return {
        data,
        mimeType,
        size: data.length,
        width: dim(widths[i]),
        height: dim(heights[i]),
      };
    }),
  );
}

function cleanBody(raw: unknown, allowEmpty = false) {
  const body = String(raw ?? "").trim();
  if (!body && !allowEmpty) fail("Escreva uma mensagem.");
  if (body.length > MESSAGE_MAX)
    fail(`A mensagem pode ter no máximo ${MESSAGE_MAX} caracteres.`);
  return body;
}

async function replaceNotice(
  recipients: string[],
  actorId: string,
  ticketId: string,
  kind: NotificationKind,
) {
  const to = recipients.filter((id) => id !== actorId);
  if (!to.length) return;
  await db.$transaction([
    db.notification.deleteMany({
      where: { userId: { in: to }, ticketId, kind, readAt: null },
    }),
    db.notification.createMany({
      data: to.map((userId) => ({ userId, actorId, ticketId, kind })),
    }),
  ]);
}

async function emailReply(ticketId: string, body: string, sentAt: Date) {
  const t = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      number: true,
      subject: true,
      userReadAt: true,
      user: { select: { email: true, name: true } },
      messages: {
        where: { staff: true, createdAt: { lt: sentAt } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  if (!t) return;
  const previous = t.messages[0]?.createdAt;
  if (previous && (!t.userReadAt || t.userReadAt < previous)) return;
  await sendSupportReply({
    to: t.user.email,
    name: t.user.name,
    number: t.number,
    subject: t.subject,
    excerpt: body,
    url: appUrl(`/suporte/${ticketId}`),
  });
}

async function adminIds() {
  const admins = await db.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

export async function openTicket(
  input: {
    subject: string;
    category: TicketCategoryId;
    body: string;
  },
  files?: FormData,
) {
  return withUser(async (userId) => {
    const subject = String(input.subject ?? "").trim();
    if (subject.length < 4) fail("Dê um assunto pro seu ticket.");
    if (subject.length > SUBJECT_MAX)
      fail(`O assunto pode ter no máximo ${SUBJECT_MAX} caracteres.`);
    if (!(input.category in TICKET_CATEGORIES)) fail("Escolha uma categoria.");
    const body = cleanBody(input.body);
    const attachments = await readAttachments(files);
    if (rateLimited(`ticket:${userId}`, 5, 60 * 60_000))
      fail("Muitos tickets em pouco tempo. Tente de novo mais tarde.");
    const open = await db.supportTicket.count({
      where: { userId, status: { not: "CLOSED" } },
    });
    if (open >= OPEN_TICKETS_MAX)
      fail(
        `Você já tem ${open} tickets em aberto. Feche algum ou continue a conversa por lá.`,
      );

    const now = new Date();
    const ticket = await db.supportTicket.create({
      data: {
        userId,
        subject,
        category: input.category,
        lastMessageAt: now,
        userReadAt: now,
        messages: {
          create: {
            authorId: userId,
            body,
            createdAt: now,
            attachments: { create: attachments },
          },
        },
      },
      select: { id: true },
    });
    await replaceNotice(await adminIds(), userId, ticket.id, "SUPPORT_MESSAGE");
    return { id: ticket.id };
  });
}

export async function sendSupportMessage(
  ticketId: string,
  rawBody: string,
  files?: FormData,
) {
  return withUser(async (userId) => {
    const { ticket, staff } = await access(ticketId, userId);
    const attachments = await readAttachments(files);
    const body = cleanBody(rawBody, attachments.length > 0);
    if (rateLimited(`ticket-msg:${userId}`, 20, 60_000))
      fail("Calma! Muitas mensagens seguidas. Espere um pouquinho.");

    const now = new Date();
    const [message] = await db.$transaction([
      db.supportMessage.create({
        data: {
          ticketId,
          authorId: userId,
          body,
          staff,
          createdAt: now,
          attachments: { create: attachments },
        },
        include: messageInclude,
      }),
      db.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: staff ? "ANSWERED" : "OPEN",
          closedAt: null,
          lastMessageAt: now,
          ...(staff ? { staffReadAt: now } : { userReadAt: now }),
        },
      }),
    ]);

    if (staff) {
      await replaceNotice([ticket.userId], userId, ticketId, "SUPPORT_REPLIED");
      await emailReply(
        ticketId,
        body || "Enviamos uma imagem na conversa.",
        now,
      ).catch(() => null);
    } else
      await replaceNotice(
        await adminIds(),
        userId,
        ticketId,
        "SUPPORT_MESSAGE",
      );

    return { message: toMessage(message), status: staff ? "ANSWERED" : "OPEN" };
  });
}

export async function pollTicket(ticketId: string, afterIso: string) {
  return withUser(async (userId) => {
    const { staff } = await access(ticketId, userId);
    const after = new Date(afterIso);
    if (Number.isNaN(after.getTime())) fail("Data inválida.");
    const result = await newMessagesSince(ticketId, after);
    if (result.messages.length) await markTicketRead(ticketId, userId, staff);
    return result;
  });
}

export async function setTicketClosed(ticketId: string, closed: boolean) {
  return withUser(async (userId) => {
    const { ticket, staff } = await access(ticketId, userId);
    if (!closed && !staff) fail("Pra reabrir, é só mandar uma nova mensagem.");
    if (closed === (ticket.status === "CLOSED")) return;
    const last = closed
      ? null
      : await db.supportMessage.findFirst({
          where: { ticketId },
          orderBy: { createdAt: "desc" },
          select: { staff: true },
        });
    await db.supportTicket.update({
      where: { id: ticketId },
      data: closed
        ? { status: "CLOSED", closedAt: new Date() }
        : { status: last?.staff ? "ANSWERED" : "OPEN", closedAt: null },
    });
  });
}
