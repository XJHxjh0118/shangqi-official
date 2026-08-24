export const LIST_DATETIME_PATTERN = "{y}-{m}-{d} {h}:{i}:{s}";

export function parseTime(
  time: unknown,
  pattern = LIST_DATETIME_PATTERN
): string {
  if (time == null || time === "") return "";

  let date: Date;
  if (time instanceof Date) {
    date = time;
  } else if (typeof time === "number") {
    date = new Date(String(time).length === 10 ? time * 1000 : time);
  } else {
    const raw = String(time)
      .trim()
      .replace(/-/g, "/")
      .replace("T", " ")
      .replace(/\.\d+$/, "");
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return "";

  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds()
  };

  return pattern.replace(/\{(y|m|d|h|i|s)\}/g, (_, key: string) => {
    const value = formatObj[key];
    return value < 10 ? `0${value}` : String(value);
  });
}
