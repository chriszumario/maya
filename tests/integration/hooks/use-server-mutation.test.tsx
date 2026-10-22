// @vitest-environment happy-dom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { useServerMutation } from "@/hooks/use-server-mutation";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("useServerMutation", () => {
  test("discards a late AI response after an edit resets the request", async () => {
    const pending = deferred<string>();
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useServerMutation({ mutationFn: () => pending.promise, onSuccess }),
    );
    let request!: Promise<string>;
    await act(async () => {
      request = result.current.mutateAsync(undefined);
    });
    act(() => result.current.reset());
    await act(async () => {
      pending.resolve("old suggestion");
      await request;
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  test("does not apply a response after leaving the resource", async () => {
    const pending = deferred<string>();
    const onSuccess = vi.fn();
    const { result, unmount } = renderHook(() =>
      useServerMutation({ mutationFn: () => pending.promise, onSuccess }),
    );
    let request!: Promise<string>;
    await act(async () => {
      request = result.current.mutateAsync(undefined);
    });
    unmount();
    pending.resolve("old suggestion");
    await request;
    expect(onSuccess).not.toHaveBeenCalled();
  });
  test("remains pending until every concurrent mutation settles", async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    const { result } = renderHook(() =>
      useServerMutation({
        mutationFn: (value: number) =>
          value === 1 ? first.promise : second.promise,
      }),
    );

    let firstMutation!: Promise<number>;
    let secondMutation!: Promise<number>;
    await act(async () => {
      firstMutation = result.current.mutateAsync(1);
      secondMutation = result.current.mutateAsync(2);
    });
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      first.resolve(1);
      await firstMutation;
    });
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      second.resolve(2);
      await secondMutation;
    });
    expect(result.current.isPending).toBe(false);
  });
});
