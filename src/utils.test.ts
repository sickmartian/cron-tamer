import { getOccurrecesRelevantForMonth, validateCronExpression } from "./utils";

describe("getOccurrecesRelevantForMonth", () => {
  it.each([
    // DST
    { case: 'DST', tz: "UTC", expression: "0 2 30 3 *" },
    { case: 'DST', tz: "UTC", expression: "30 2 30 3 *" },
    { case: 'DST', tz: "UTC", expression: "0 3 30 3 *" },
    { case: 'DST', tz: "UTC", expression: "30 3 30 3 *" },
    { case: 'DST', tz: "UTC", expression: "0 1-5 30 3 *" },
    { case: 'DST', tz: "Europe/Madrid", expression: "0 2 30 3 *" },
    { case: 'DST', tz: "Europe/Madrid", expression: "30 2 30 3 *" },
    { case: 'DST', tz: "Europe/Madrid", expression: "30 3 30 3 *" },
    { case: 'DST', tz: "Europe/Madrid", expression: "30 3 30 3 *" },
    { case: 'DST', tz: "Europe/Madrid", expression: "0 1-5 30 3 *" },
    // Edges
    { case: 'Edges', tz: "UTC", expression: "0 0 1 3 *" },
    { case: 'Edges', tz: "UTC", expression: "0 23 31 * *" },
    { case: 'Edges', tz: "UTC", expression: "59 23 31 * *" },
    // Inter month jobs
    { case: 'Inter month', tz: "UTC", expression: "0 0 1 * *" },
  ])(
    "should parse cron expressions correctly for case $case in $tz with $expression",
    ({ tz, expression }) => {
      const occurrences = getOccurrecesRelevantForMonth(
        expression,
        new Date("2025-03-14T04:00:00"),
        tz
      );

      expect(occurrences).toMatchSnapshot();
    }
  );
  it("should throw an error if the cron expression is invalid", () => {
    expect(() => getOccurrecesRelevantForMonth("invalid", new Date("2025-03-14T04:00:00"), "UTC")).toThrow();
  });
});

describe("validateCronExpression", () => {
  it("should return true if the cron expression is valid", () => {
    expect(validateCronExpression("0 0/1 * * *")).toBe(true);
  });
  it("should return false if the cron expression is invalid", () => {
    expect(validateCronExpression("invalid")).toBe(false);
  });
});