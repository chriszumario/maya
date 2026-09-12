import { describe, expect, test, vi } from "vitest";

import { collectCursorPages, findCursorItem } from "@/lib/cursor-pagination";

describe("cursor pagination", () => {
  test("collects pages until the API ends the sequence", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [1, 2], nextCursor: "next" })
      .mockResolvedValueOnce({ items: [3], nextCursor: null });

    await expect(collectCursorPages(fetchPage)).resolves.toEqual([1, 2, 3]);
    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined);
    expect(fetchPage).toHaveBeenNthCalledWith(2, "next");
  });

  test("rejects a cursor cycle instead of looping forever", async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      items: [],
      nextCursor: "repeated",
    });

    await expect(collectCursorPages(fetchPage)).rejects.toThrow(
      "cursor de paginación repetido",
    );
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  test("stops reading pages as soon as an item is found", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [{ id: 1 }], nextCursor: "next" })
      .mockResolvedValueOnce({ items: [{ id: 2 }], nextCursor: "unused" });

    await expect(
      findCursorItem<{ id: number }>(fetchPage, (item) => item.id === 2),
    ).resolves.toEqual({ id: 2 });
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
