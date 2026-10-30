import { beforeEach, describe, expect, it } from "vitest";
import { setAdmin } from "@/lib/actions/admin";
import { getAdminOverview, searchUsers } from "@/lib/queries/admin";
import { testDb, viewer } from "./setup";

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

const admin = (id: string) =>
  testDb.user
    .findUniqueOrThrow({ where: { id }, select: { isAdmin: true } })
    .then((u) => u.isAdmin);

beforeEach(async () => {
  await addUser("user-admin", "chefe", true);
  await addUser("user-other", "outra");
});

describe("admin", () => {
  it("only lets admins change roles and keeps at least one admin", async () => {
    expect((await setAdmin("user-other", true)).ok).toBe(false);
    expect(await admin("user-other")).toBe(false);

    viewer.id = "user-admin";
    expect((await setAdmin("user-admin", false)).ok).toBe(false);
    expect((await setAdmin("user-other", true)).ok).toBe(true);
    expect(await admin("user-other")).toBe(true);
    expect((await setAdmin("user-admin", false)).ok).toBe(true);
    expect(await admin("user-admin")).toBe(false);
  });

  it("searches users and summarizes the product", async () => {
    expect((await searchUsers("@outr", 0)).users.map((u) => u.handle)).toEqual([
      "outra",
    ]);
    expect((await searchUsers("EXAMPLE.COM", 0)).total).toBe(3);
    const overview = await getAdminOverview();
    expect(overview.stats.users).toBe(3);
    expect(overview.recent).toHaveLength(3);
  });
});
