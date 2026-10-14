import { describe, expect, it } from "vitest";
import { isWithinSchedule } from "@/lib/decision";
import type { Schedule } from "@/lib/domain";

const weekdaySchedule: Schedule = {
  id: "0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f010",
  weekday: 3,
  startTime: "09:00",
  endTime: "17:00",
  enabled: true,
  timezone: "UTC",
};

describe("scheduled availability", () => {
  it("activates inside the configured weekday window", () => {
    expect(
      isWithinSchedule([weekdaySchedule], new Date("2026-10-14T10:30:00.000Z")),
    ).toBe(true);
  });

  it("does not activate outside the configured window", () => {
    expect(
      isWithinSchedule([weekdaySchedule], new Date("2026-10-14T18:00:00.000Z")),
    ).toBe(false);
  });

  it("handles windows that cross midnight", () => {
    const overnight: Schedule = {
      ...weekdaySchedule,
      weekday: 2,
      startTime: "22:00",
      endTime: "02:00",
    };
    expect(
      isWithinSchedule([overnight], new Date("2026-10-14T01:00:00.000Z")),
    ).toBe(true);
  });
});
