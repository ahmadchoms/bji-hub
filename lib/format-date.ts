const TIME_ZONE = "Asia/Jakarta";

const FORMATS = {
  short: { day: "numeric", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  dayMonth: { day: "numeric", month: "long" },
  padded: { day: "2-digit", month: "short", year: "numeric" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

const dateFormatters = Object.fromEntries(
  Object.entries(FORMATS).map(([key, options]) => [
    key,
    new Intl.DateTimeFormat("id-ID", { ...options, timeZone: TIME_ZONE }),
  ]),
) as Record<keyof typeof FORMATS, Intl.DateTimeFormat>;

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

export type DateStyle = keyof typeof FORMATS | "dateTime";

/** Always renders in Asia/Jakarta, so server and browser output match (no hydration mismatch). */
export function formatWib(
  value: string | number | Date,
  style: DateStyle = "short",
): string {
  const date = new Date(value);
  if (style === "dateTime")
    return `${dateFormatters.short.format(date)}, ${timeFormatter.format(date)}`;
  return dateFormatters[style].format(date);
}
