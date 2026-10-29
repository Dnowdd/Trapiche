import { describe, expect, it } from "vitest";
import {
  fmtPartial,
  parsePartialISO,
  partialToISO,
  periodEnd,
  spanDays,
} from "@/lib/dates";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("parsePartialISO", () => {
  it("reads year, month and day precision", () => {
    expect(parsePartialISO("2021")).toEqual({
      date: d("2021-01-01"),
      precision: "YEAR",
    });
    expect(parsePartialISO("2021-03")).toEqual({
      date: d("2021-03-01"),
      precision: "MONTH",
    });
    expect(parsePartialISO("2021-03-12")).toEqual({
      date: d("2021-03-12"),
      precision: "DAY",
    });
  });

  it("rejects impossible or malformed dates", () => {
    expect(parsePartialISO("2023-02-29")).toBeNull();
    expect(parsePartialISO("2021-13")).toBeNull();
    expect(parsePartialISO("21")).toBeNull();
    expect(parsePartialISO("12/03/2021")).toBeNull();
  });
});

describe("periodEnd", () => {
  it("returns the last day of the period", () => {
    expect(periodEnd({ date: d("2021-01-01"), precision: "YEAR" })).toEqual(
      d("2021-12-31"),
    );
    expect(periodEnd({ date: d("2024-02-01"), precision: "MONTH" })).toEqual(
      d("2024-02-29"),
    );
    expect(periodEnd({ date: d("2021-03-12"), precision: "DAY" })).toEqual(
      d("2021-03-12"),
    );
  });
});

describe("partialToISO and fmtPartial", () => {
  it("round-trips through the stored precision", () => {
    expect(partialToISO(d("2021-03-01"), "MONTH")).toBe("2021-03");
    expect(partialToISO(null, "DAY")).toBe("");
    expect(fmtPartial(d("2021-01-01"), "YEAR")).toBe("2021");
    expect(fmtPartial(null, "DAY")).toBeNull();
  });
});

describe("spanDays", () => {
  const base = { startPrecision: "DAY", endPrecision: "DAY" } as const;

  it("counts inclusive days when both dates are exact", () => {
    expect(
      spanDays({
        ...base,
        startedAt: d("2021-03-01"),
        endedAt: d("2021-03-10"),
      }),
    ).toBe(10);
    expect(
      spanDays({
        ...base,
        startedAt: d("2021-03-01"),
        endedAt: d("2021-03-01"),
      }),
    ).toBe(1);
  });

  it("returns null when a date is missing or partial", () => {
    expect(
      spanDays({ ...base, startedAt: null, endedAt: d("2021-03-10") }),
    ).toBeNull();
    expect(
      spanDays({
        ...base,
        startPrecision: "MONTH",
        startedAt: d("2021-03-01"),
        endedAt: d("2021-03-10"),
      }),
    ).toBeNull();
  });
});
