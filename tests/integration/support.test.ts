import { beforeEach, describe, expect, it } from "vitest";
import {
  openTicket,
  pollTicket,
  sendSupportMessage,
  setTicketClosed,
} from "@/lib/actions/support";
import {
  canSeeTicket,
  getMyTickets,
  getStaffTickets,
  getTicket,
} from "@/lib/queries/support";
import { sentEmails, testDb, viewer } from "./setup";

async function addUser(id: string, handle: string, isAdmin = false) {
  const now = new Date();
  await testDb.user.create({
    data: {
      id,
      name: handle,
      email: `${handle}@example.com`,
      emailVerified: true,
      handle,
      isAdmin,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function open() {
  const res = await openTicket({
    subject: "Não consigo marcar como lido",
    category: "BUG",
    body: "O botão não responde.",
  });
  expect(res.ok).toBe(true);
  return res.ok ? res.data!.id : "";
}

beforeEach(async () => {
  await addUser("user-other", "outro");
  await addUser("user-admin", "admin", true);
});

describe("support tickets", () => {
  it("runs a full conversation between user and staff", async () => {
    const id = await open();
    expect(
      await testDb.notification.count({
        where: { userId: "user-admin", ticketId: id, kind: "SUPPORT_MESSAGE" },
      }),
    ).toBe(1);
    expect((await getStaffTickets("OPEN"))[0]).toMatchObject({
      id,
      unread: true,
    });

    viewer.id = "user-admin";
    const reply = await sendSupportMessage(id, "Já estamos olhando!");
    expect(reply.ok && reply.data?.message.staff).toBe(true);
    const ticket = await testDb.supportTicket.findUniqueOrThrow({
      where: { id },
    });
    expect(ticket.status).toBe("ANSWERED");
    expect(sentEmails).toEqual([
      { kind: "support-reply", to: "teste@example.com" },
    ]);
    await sendSupportMessage(id, "Mais um detalhe.");
    expect(sentEmails).toHaveLength(1);
    expect(
      await testDb.notification.count({
        where: { userId: "user-test", ticketId: id, kind: "SUPPORT_REPLIED" },
      }),
    ).toBe(1);

    viewer.id = "user-test";
    expect((await getMyTickets("user-test"))[0].unread).toBe(true);
    const polled = await pollTicket(id, ticket.createdAt.toISOString());
    expect(polled.ok && polled.data?.messages.map((m) => m.body)).toEqual([
      "Já estamos olhando!",
      "Mais um detalhe.",
    ]);
    expect((await getMyTickets("user-test"))[0].unread).toBe(false);

    expect((await setTicketClosed(id, true)).ok).toBe(true);
    expect((await setTicketClosed(id, false)).ok).toBe(false);
    await sendSupportMessage(id, "Voltou a acontecer");
    expect(
      (await testDb.supportTicket.findUniqueOrThrow({ where: { id } })).status,
    ).toBe("OPEN");
  });

  it("keeps tickets private to the owner and staff", async () => {
    const id = await open();
    viewer.id = "user-other";
    expect((await sendSupportMessage(id, "oi")).ok).toBe(false);
    expect((await pollTicket(id, new Date(0).toISOString())).ok).toBe(false);
    expect((await setTicketClosed(id, true)).ok).toBe(false);
  });

  it("validates input", async () => {
    const short = await openTicket({
      subject: "oi",
      category: "BUG",
      body: "x",
    });
    expect(short.ok).toBe(false);
    const empty = await openTicket({
      subject: "Assunto válido",
      category: "BUG",
      body: "   ",
    });
    expect(empty.ok).toBe(false);
  });

  it("stores image attachments and rejects anything else", async () => {
    const id = await open();
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2,
    ]);
    const form = (files: Blob[]) => {
      const f = new FormData();
      for (const b of files) {
        f.append("file", b, "x");
        f.append("width", "800");
        f.append("height", "600");
      }
      return f;
    };

    const ok = await sendSupportMessage(id, "", form([new Blob([png])]));
    expect(ok.ok).toBe(true);
    const ticket = await getTicket(id);
    const last = ticket!.messages.at(-1)!;
    expect(last.body).toBe("");
    expect(last.attachments).toHaveLength(1);
    expect(last.attachments[0]).toMatchObject({ width: 800, height: 600 });

    const fake = await sendSupportMessage(
      id,
      "olha",
      form([new Blob(["<script>alert(1)</script>"])]),
    );
    expect(fake.ok).toBe(false);
    const many = await sendSupportMessage(
      id,
      "olha",
      form([1, 2, 3, 4].map(() => new Blob([png]))),
    );
    expect(many.ok).toBe(false);
    expect((await sendSupportMessage(id, "  ")).ok).toBe(false);

    expect(await canSeeTicket("user-test", "user-test")).toBe(true);
    expect(await canSeeTicket("user-test", "user-admin")).toBe(true);
    expect(await canSeeTicket("user-test", "user-other")).toBe(false);
  });
});
