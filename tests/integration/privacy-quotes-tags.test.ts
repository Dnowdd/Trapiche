import { describe, expect, it } from "vitest";
import { updatePrivacy } from "@/lib/actions/profile";
import { addQuote, deleteQuote, updateQuote } from "@/lib/actions/quotes";
import {
  createTag,
  deleteTag,
  setBookTags,
  updateTag,
} from "@/lib/actions/tags";
import { reportContent, resolveReport } from "@/lib/actions/reports";
import { getProfile } from "@/lib/queries/profile";
import { getBookQuotes, getProfileQuotes } from "@/lib/queries/quotes";
import { getUserTags } from "@/lib/queries/tags";
import { testDb, viewer } from "./setup";

const USER = "user-test";
const OTHER = "user-other";
const BOOK = "book-1";

async function makeOther(admin = false) {
  const now = new Date();
  await testDb.user.create({
    data: {
      id: OTHER,
      name: "Outra Pessoa",
      email: "outra@example.com",
      emailVerified: true,
      handle: "outra",
      isAdmin: admin,
      createdAt: now,
      updatedAt: now,
    },
  });
}

const allOn = {
  searchIndexing: true,
  showShelf: true,
  showDiary: true,
  showActivity: true,
  showLikes: true,
  showGoal: true,
  showCity: true,
};

describe("profile privacy", () => {
  it("hides a private profile from visitors and other members", async () => {
    await updatePrivacy({ profileVisibility: "PRIVATE", ...allOn });
    const visitor = await getProfile("teste", null);
    expect(visitor?.access.canView).toBe(false);
    expect(visitor?.stats).toEqual([]);
    expect(visitor?.counts).toBeNull();
    const member = await getProfile("teste", "someone-else");
    expect(member?.access.blockedBy).toBe("private");
    const owner = await getProfile("teste", USER);
    expect(owner?.access.canView).toBe(true);
    expect(owner?.privacy?.profileVisibility).toBe("PRIVATE");
  });

  it("requires login for members-only profiles", async () => {
    await updatePrivacy({ profileVisibility: "MEMBERS", ...allOn });
    expect((await getProfile("teste", null))?.access.blockedBy).toBe("members");
    expect((await getProfile("teste", "someone-else"))?.access.canView).toBe(
      true,
    );
  });

  it("drops hidden sections from tabs, counts and stats", async () => {
    await updatePrivacy({
      profileVisibility: "PUBLIC",
      ...allOn,
      showShelf: false,
      showLikes: false,
      showCity: false,
    });
    await testDb.user.update({ where: { id: USER }, data: { city: "Recife" } });
    const p = await getProfile("teste", null);
    expect(p?.tabs).not.toContain("estante");
    expect(p?.tabs).not.toContain("curtidas");
    expect(p?.tabs).toContain("diario");
    expect(p?.counts?.estante).toBeNull();
    expect(p?.stats.map((s) => s.label)).toEqual(["resenhas", "listas"]);
    expect(p?.user.city).toBeNull();
    expect((await getProfile("teste", USER))?.user.city).toBe("Recife");
  });

  it("rejects an unknown visibility", async () => {
    const res = await updatePrivacy({
      profileVisibility: "EVERYONE" as "PUBLIC",
      ...allOn,
    });
    expect(res.ok).toBe(false);
  });
});

describe("quotes", () => {
  it("validates, saves, edits and deletes", async () => {
    expect((await addQuote(BOOK, { text: "   " })).ok).toBe(false);
    expect((await addQuote(BOOK, { text: "x", page: "abc" })).ok).toBe(false);
    const res = await addQuote(BOOK, {
      text: "Viver é muito perigoso.",
      page: "7",
      note: "  ",
    });
    expect(res.ok).toBe(true);
    const id = res.ok ? res.data!.id : "";
    const saved = await testDb.quote.findUniqueOrThrow({ where: { id } });
    expect(saved).toMatchObject({ page: 7, note: null, private: false });

    await updateQuote(id, { text: "Viver é perigoso.", private: true });
    expect(
      (await testDb.quote.findUniqueOrThrow({ where: { id } })).private,
    ).toBe(true);

    viewer.id = OTHER;
    await makeOther();
    await deleteQuote(id);
    expect(await testDb.quote.count()).toBe(1);
    viewer.id = USER;
    await deleteQuote(id);
    expect(await testDb.quote.count()).toBe(0);
  });

  it("keeps private quotes out of the book page and visitor profile", async () => {
    await makeOther();
    await addQuote(BOOK, { text: "Pública" });
    await addQuote(BOOK, { text: "Secreta", private: true });
    const forOther = await getBookQuotes(BOOK, OTHER);
    expect(forOther.community.map((q) => q.text)).toEqual(["Pública"]);
    expect(forOther.communityTotal).toBe(1);
    const mine = await getBookQuotes(BOOK, USER);
    expect(mine.mine).toHaveLength(2);
    expect(mine.community).toHaveLength(0);
    expect((await getProfileQuotes(USER, false)).map((q) => q.text)).toEqual([
      "Pública",
    ]);
  });

  it("can be reported and hidden by moderation", async () => {
    await makeOther(true);
    const res = await addQuote(BOOK, { text: "Algo ofensivo" });
    const quoteId = res.ok ? res.data!.id : "";
    viewer.id = OTHER;
    expect((await reportContent({ quoteId, reason: "spam" })).ok).toBe(true);
    const report = await testDb.report.findFirstOrThrow({ where: { quoteId } });
    expect((await resolveReport(report.id, "hide")).ok).toBe(true);
    expect(
      (await testDb.quote.findUniqueOrThrow({ where: { id: quoteId } }))
        .hiddenAt,
    ).not.toBeNull();
    expect((await getBookQuotes(BOOK, null)).community).toHaveLength(0);
  });
});

describe("tags", () => {
  it("creates tags once, case-insensitively", async () => {
    const a = await createTag({ name: "Clube do Livro" });
    const b = await createTag({ name: "  #clube do livro " });
    expect(a.ok && b.ok && a.data!.id === b.data!.id).toBe(true);
    expect((await createTag({ name: "" })).ok).toBe(false);
  });

  it("tags a book and filters private tags for visitors", async () => {
    const pub = await createTag({ name: "emprestados" });
    const priv = await createTag({ name: "segredo", private: true });
    const ids = [pub, priv].map((r) => (r.ok ? r.data!.id : ""));
    await testDb.userBook.create({
      data: { userId: USER, bookId: BOOK, status: "READ" },
    });
    expect((await setBookTags(BOOK, ids)).ok).toBe(true);
    expect(await getUserTags(USER, true)).toHaveLength(2);
    const visible = await getUserTags(USER, false);
    expect(visible.map((t) => [t.name, t.count])).toEqual([["emprestados", 1]]);

    await updateTag(ids[0], {
      name: "Emprestados",
      color: "#b5522e",
      private: false,
    });
    expect(
      (await testDb.tag.findUniqueOrThrow({ where: { id: ids[0] } })).color,
    ).toBe("#b5522e");
    await deleteTag(ids[1]);
    expect(await testDb.userBookTag.count()).toBe(1);
  });

  it("refuses tags owned by someone else", async () => {
    await makeOther();
    viewer.id = OTHER;
    const theirs = await createTag({ name: "deles" });
    viewer.id = USER;
    const res = await setBookTags(BOOK, [theirs.ok ? theirs.data!.id : ""]);
    expect(res).toEqual({ ok: false, error: "Tag inválida." });
  });
});
