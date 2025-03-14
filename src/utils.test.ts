import { parseCronExpression } from "./utils";

describe("parseCronExpression", () => {
  it.each([
    // DST
    { tz: "UTC", expression: "0 2 30 3 *" },
    { tz: "UTC", expression: "30 2 30 3 *" },
    { tz: "UTC", expression: "0 3 30 3 *" },
    { tz: "UTC", expression: "30 3 30 3 *" },
    { tz: "UTC", expression: "0 1-5 30 3 *" },
    { tz: "Europe/Madrid", expression: "0 2 30 3 *" },
    { tz: "Europe/Madrid", expression: "30 2 30 3 *" },
    { tz: "Europe/Madrid", expression: "30 3 30 3 *" },
    { tz: "Europe/Madrid", expression: "30 3 30 3 *" },
    { tz: "Europe/Madrid", expression: "0 1-5 30 3 *" },
    // Edges
    { tz: "UTC", expression: "0 0 1 * *" },
    { tz: "UTC", expression: "0 23 31 * *" },
    { tz: "UTC", expression: "59 23 31 * *" },
  ])(
    "should parse cron expressions correctly in $tz / $expression",
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
