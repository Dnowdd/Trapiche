import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

const { parseSeries, seriesSlug } = await import("@/lib/series");
const { profileAccess, isIndexable } = await import("@/lib/privacy");
const { handleBase } = await import("@/lib/handles");
const { previousMonth } = await import("@/lib/reminders");

describe("parseSeries", () => {
  it.each([
    ["Harry Potter ; 1", "Harry Potter", 1],
    ["Harry Potter, #2", "Harry Potter", 2],
    ["(As Crônicas de Gelo e Fogo ; v. 3)", "As Crônicas de Gelo e Fogo", 3],
    ["Fundação - Livro 2", "Fundação", 2],
    ["Discworld 12.5", "Discworld", 12.5],
  ])("parses %s", (raw, name, position) => {
    expect(parseSeries(raw)).toEqual({ name, position });
  });

  it("ignores series without a position", () => {
    expect(parseSeries("Coleção Clássicos")).toBeNull();
    expect(parseSeries("")).toBeNull();
  });

  it("builds stable slugs", () => {
    expect(seriesSlug("As Crônicas de Nárnia")).toBe("as-cronicas-de-narnia");
    expect(seriesSlug("Tintim & Milu")).toBe("tintim-e-milu");
  });
});

const base = {
  profileVisibility: "PUBLIC" as const,
  searchIndexing: true,
  showShelf: true,
  showDiary: true,
  showActivity: true,
  showLikes: true,
  showGoal: true,
  showCity: true,
};

describe("profileAccess", () => {
  it("shows everything on a public profile", () => {
    const a = profileAccess(base, false, false);
    expect(a.canView).toBe(true);
    expect(Object.values(a.sections).every(Boolean)).toBe(true);
    expect(a.indexable).toBe(true);
  });

  it("hides private profiles from everyone but the owner", () => {
    const s = { ...base, profileVisibility: "PRIVATE" as const };
    expect(profileAccess(s, false, true)).toMatchObject({
      canView: false,
      blockedBy: "private",
      showCity: false,
    });
    expect(profileAccess(s, true, true).canView).toBe(true);
    expect(isIndexable(s)).toBe(false);
  });

  it("asks visitors to log in for members-only profiles", () => {
    const s = { ...base, profileVisibility: "MEMBERS" as const };
    expect(profileAccess(s, false, false).blockedBy).toBe("members");
    expect(profileAccess(s, false, true).canView).toBe(true);
    expect(isIndexable(s)).toBe(false);
  });

  it("respects section switches only for others", () => {
    const s = { ...base, showDiary: false, showCity: false };
    expect(profileAccess(s, false, true).sections.diary).toBe(false);
    expect(profileAccess(s, false, true).showCity).toBe(false);
    expect(profileAccess(s, true, true).sections.diary).toBe(true);
  });

  it("respects the search engine switch", () => {
    expect(
      profileAccess({ ...base, searchIndexing: false }, false, false).indexable,
    ).toBe(false);
  });
});

describe("handleBase", () => {
  it("derives a valid handle from an email or name", () => {
    expect(handleBase("Maria.Clara+livros@gmail.com")).toBe(
      "maria.clara.livros",
    );
    expect(handleBase("João Ávila")).toBe("joao.avila");
    expect(handleBase("ab@x.com")).toBe("leitorab");
  });
});

describe("previousMonth", () => {
  it("wraps around January", () => {
    expect(previousMonth(new Date(Date.UTC(2027, 0, 3)))).toEqual({
      year: 2026,
      month: 12,
      key: "2026-12",
    });
    expect(previousMonth(new Date(Date.UTC(2026, 10, 1))).key).toBe("2026-10");
  });
});
