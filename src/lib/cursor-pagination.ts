export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

const MAX_PAGES = 100;

export async function findCursorItem<T>(
  fetchPage: (cursor?: string) => Promise<CursorPage<T>>,
  predicate: (item: T) => boolean,
) {
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchPage(cursor);
    const item = result.items.find(predicate);
    if (item) return item;

    const nextCursor = result.nextCursor ?? undefined;
    if (!nextCursor) return undefined;
    if (seenCursors.has(nextCursor)) {
      throw new Error("La API devolvió un cursor de paginación repetido.");
    }
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  throw new Error("La respuesta superó el límite seguro de paginación.");
}
