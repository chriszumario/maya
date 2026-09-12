const MAX_CURSOR_HISTORY = 100;
const MAX_CURSOR_LENGTH = 1_024;

export function readCursorHistory(value: string | string[] | undefined) {
  const values = typeof value === "string" ? [value] : (value ?? []);
  return values
    .filter((cursor) => cursor.length > 0 && cursor.length <= MAX_CURSOR_LENGTH)
    .slice(-MAX_CURSOR_HISTORY);
}

export function buildCursorHref(
  pathname: string,
  query: string,
  direction: "next" | "previous",
  nextCursor?: string,
) {
  const search = new URLSearchParams(query);
  const history = readCursorHistory(search.getAll("cursor"));
  const nextHistory =
    direction === "previous"
      ? history.slice(0, -1)
      : nextCursor
        ? [...history, nextCursor]
        : history;

  search.delete("cursor");
  for (const cursor of nextHistory) search.append("cursor", cursor);
  const normalized = search.toString();
  return normalized ? `${pathname}?${normalized}` : pathname;
}
