import { db } from "../db";
import { fmtAgo } from "../dates";
import { fmtMessageTime, type TicketStatusId } from "../support";
import { initialsOf } from "./book";

const messageInclude = {
  author: { select: { name: true, handle: true, image: true } },
} as const;

type MessageRow = Awaited<
  ReturnType<
    typeof db.supportMessage.findMany<{ include: typeof messageInclude }>
  >
>[number];

export function toMessage(m: MessageRow) {
  return {
    id: m.id,
    body: m.body,
    staff: m.staff,
    authorId: m.authorId,
    author: m.author.name,
    image: m.author.image,
    initials: initialsOf(m.author.name),
    at: m.createdAt.toISOString(),
    time: fmtMessageTime(m.createdAt),
  };
}

export type TicketMessage = ReturnType<typeof toMessage>;

function toSummary(
  t: {
    id: string;
    number: number;
    subject: string;
    category: string;
    status: TicketStatusId;
    lastMessageAt: Date;
    createdAt: Date;
    _count: { messages: number };
  },
  unread: boolean,
) {
  return {
    id: t.id,
    number: t.number,
    subject: t.subject,
    category: t.category,
    status: t.status,
    updated: fmtAgo(t.lastMessageAt),
    opened: fmtAgo(t.createdAt),
    messages: t._count.messages,
    unread,
  };
}

export async function getMyTickets(userId: string) {
  const rows = await db.supportTicket.findMany({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: {
        where: { staff: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  return rows.map((t) =>
    toSummary(
      t,
      t.messages[0] != null &&
        (t.userReadAt == null || t.messages[0].createdAt > t.userReadAt),
    ),
  );
}

export type TicketSummary = Awaited<ReturnType<typeof getMyTickets>>[number];

export async function getStaffTickets(status: TicketStatusId) {
  const rows = await db.supportTicket.findMany({
    where: { status },
    orderBy: { lastMessageAt: status === "OPEN" ? "asc" : "desc" },
    take: 200,
    include: {
      user: { select: { name: true, handle: true, image: true } },
      _count: { select: { messages: true } },
      messages: {
        where: { staff: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, body: true },
      },
    },
  });
  return rows.map((t) => ({
    ...toSummary(
      t,
      t.messages[0] != null &&
        (t.staffReadAt == null || t.messages[0].createdAt > t.staffReadAt),
    ),
    user: t.user,
    preview: t.messages[0]?.body.slice(0, 160) ?? "",
  }));
}

export type StaffTicketSummary = Awaited<
  ReturnType<typeof getStaffTickets>
>[number];

export async function getStaffCounts() {
  const groups = await db.supportTicket.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const count = (s: TicketStatusId) =>
    groups.find((g) => g.status === s)?._count.status ?? 0;
  return {
    OPEN: count("OPEN"),
    ANSWERED: count("ANSWERED"),
    CLOSED: count("CLOSED"),
  };
}

export async function getTicket(id: string) {
  const t = await db.supportTicket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          handle: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
      messages: { orderBy: { createdAt: "asc" }, include: messageInclude },
    },
  });
  if (!t) return null;
  return {
    id: t.id,
    number: t.number,
    subject: t.subject,
    category: t.category,
    status: t.status,
    opened: fmtMessageTime(t.createdAt),
    user: t.user,
    messages: t.messages.map(toMessage),
  };
}

export type TicketDetail = NonNullable<Awaited<ReturnType<typeof getTicket>>>;

export async function newMessagesSince(ticketId: string, after: Date) {
  const [rows, ticket] = await Promise.all([
    db.supportMessage.findMany({
      where: { ticketId, createdAt: { gt: after } },
      orderBy: { createdAt: "asc" },
      include: messageInclude,
    }),
    db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { status: true },
    }),
  ]);
  return { messages: rows.map(toMessage), status: ticket?.status ?? null };
}

export async function markTicketRead(
  ticketId: string,
  userId: string,
  staff: boolean,
) {
  const now = new Date();
  await Promise.all([
    db.supportTicket.update({
      where: { id: ticketId },
      data: staff ? { staffReadAt: now } : { userReadAt: now },
    }),
    db.notification.updateMany({
      where: { userId, ticketId, readAt: null },
      data: { readAt: now },
    }),
  ]);
}
