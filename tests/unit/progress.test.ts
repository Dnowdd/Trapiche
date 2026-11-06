import { describe, expect, it } from "vitest";
import { fmtDuration, parseDuration, progressOf } from "@/lib/progress";

const base = {
  currentPage: 0,
  progressPercent: null,
  audioPosition: null,
  audioLength: null,
};

describe("durations", () => {
  it.each([
    ["2h15", 135],
    ["2:15", 135],
    ["135", 135],
    ["45min", 45],
    ["3h", 180],
  ])("parses %s", (raw, minutes) => {
    expect(parseDuration(raw)).toBe(minutes);
  });

  it("rejects garbage and formats back", () => {
    expect(parseDuration("duas horas")).toBeNaN();
    expect(parseDuration("")).toBeNull();
    expect(fmtDuration(135)).toBe("2h15");
    expect(fmtDuration(45)).toBe("45min");
    expect(fmtDuration(120)).toBe("2h");
  });
});

describe("progressOf", () => {
  it("handles print books with and without page counts", () => {
    expect(
      progressOf({ ...base, format: "PRINT", currentPage: 50 }, 200),
    ).toMatchObject({
      percent: 25,
      short: "50/200",
      big: "25%",
    });
    expect(
      progressOf({ ...base, format: "PRINT", currentPage: 50 }, null),
    ).toMatchObject({
      percent: null,
      big: "p. 50",
    });
  });

  it("uses the e-book percentage", () => {
    expect(
      progressOf({ ...base, format: "EBOOK", progressPercent: 42.4 }, null),
    ).toMatchObject({ percent: 42, label: "42% do e-book" });
  });

  it("uses audio position over length", () => {
    expect(
      progressOf(
        { ...base, format: "AUDIO", audioPosition: 90, audioLength: 360 },
        null,
      ),
    ).toMatchObject({ percent: 25, label: "1h30 de 6h ouvidos" });
    expect(
      progressOf({ ...base, format: "AUDIO", audioPosition: 90 }, null),
    ).toMatchObject({ percent: null, big: "1h30" });
  });
});
