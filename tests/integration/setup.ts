import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { TEST_DATABASE_URL, assertLocal } from "./env";

assertLocal(TEST_DATABASE_URL);

export const testDb = new PrismaClient({
  adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
});

export const viewer = { id: "user-test" as string | null };

vi.mock("@/lib/db", () => ({ db: testDb }));
vi.mock("@/lib/session", () => ({
  getViewerId: async () => viewer.id,
  getSession: async () => (viewer.id ? { user: { id: viewer.id } } : null),
}));
export const sentEmails: { kind: string; to: string }[] = [];

vi.mock("@/lib/emails/send", () => {
  const record =
    (kind: string) =>
    async ({ to }: { to: string }) => {
      sentEmails.push({ kind, to });
    };
  return {
    sendVerificationEmail: record("verification"),
    sendNewEmailVerification: record("new-email"),
    sendChangeEmailConfirmation: record("change-email"),
    sendPasswordReset: record("reset"),
    sendPasswordChanged: record("password-changed"),
    sendSupportReply: record("support-reply"),
  };
});
vi.mock("next/cache", () => ({
  refresh: () => {},
  revalidatePath: () => {},
}));
vi.mock("@/lib/books", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/books")>()),
  ensureBook: (id: string) => testDb.book.findUniqueOrThrow({ where: { id } }),
}));

beforeEach(async () => {
  sentEmails.length = 0;
  await testDb.$executeRawUnsafe(
    `TRUNCATE "Activity", "ReadingSession", "Reading", "Review", "UserBook", "Book", "Work", "User" CASCADE`,
  );
  const now = new Date();
  await testDb.user.create({
    data: {
      id: "user-test",
      name: "Leitora Teste",
      email: "teste@example.com",
      emailVerified: true,
      handle: "teste",
      createdAt: now,
      updatedAt: now,
    },
  });
  await testDb.book.create({
    data: {
      id: "book-1",
      title: "Tudo é rio",
      authors: ["Carla Madeira"],
      pageCount: 210,
    },
  });
  viewer.id = "user-test";
});

afterAll(async () => {
  await testDb.$disconnect();
});
