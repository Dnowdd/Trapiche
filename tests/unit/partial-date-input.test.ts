import { describe, expect, it } from "vitest";
import {
  digitsFromValue,
  maskDigits,
  valueFromDigits,
} from "@/components/reading/partial-date-input";

describe("date mask", () => {
  it("formats progressively as dd/mm/aaaa", () => {
    expect(maskDigits("12")).toBe("12");
    expect(maskDigits("120")).toBe("12/0");
    expect(maskDigits("12032")).toBe("12/03/2");
    expect(maskDigits("12032021")).toBe("12/03/2021");
  });

  it("keeps a plausible year and month/year unmasked", () => {
    expect(maskDigits("2021")).toBe("2021");
    expect(maskDigits("032021")).toBe("03/2021");
  });

  it("produces partial ISO values only when complete and valid", () => {
    expect(valueFromDigits("")).toBe("");
    expect(valueFromDigits("2021")).toBe("2021");
    expect(valueFromDigits("032021")).toBe("2021-03");
    expect(valueFromDigits("12032021")).toBe("2021-03-12");
    expect(valueFromDigits("1203")).toBeNull();
    expect(valueFromDigits("29022023")).toBeNull();
    expect(valueFromDigits("29022024")).toBe("2024-02-29");
  });

  it("restores digits from a stored value", () => {
    expect(digitsFromValue("2021-03-12")).toBe("12032021");
    expect(maskDigits(digitsFromValue("2021-03"))).toBe("03/2021");
  });
});
