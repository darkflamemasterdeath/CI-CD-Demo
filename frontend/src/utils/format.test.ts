import { describe, expect, it } from "vitest";
import { formatDateTime } from "./format";

describe("formatDateTime", () => {
  it("formats a valid ISO string into a readable date", () => {
    const result = formatDateTime("2026-01-01T00:00:00Z");
    expect(result).toContain("2026");
  });

  it("returns the raw value for invalid input", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });
});
