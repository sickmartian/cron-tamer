import { parseCronExpression } from "./utils";

describe("parseCronExpression", () => {
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
      const occurrences = parseCronExpression(
        expression,
        new Date("2025-03-14T04:00:00"),
        tz
      );

      expect(occurrences).toMatchSnapshot();
    }
  );
  it("should throw an error if the cron expression is invalid", () => {
    expect(() => parseCronExpression("invalid", new Date("2025-03-14T04:00:00"), "UTC")).toThrow();
  });
});
