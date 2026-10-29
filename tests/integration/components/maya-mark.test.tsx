// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MayaMark } from "@/components/maya-mark";

describe("MayaMark", () => {
  test.each(["size-8", "size-10", "size-11"])(
    "renders the shared brand artwork at %s without duplicating its accessible name",
    (className) => {
      const { container } = render(
        <MayaMark className={className} data-brand="maya" />,
      );
      const mark = container.querySelector('[data-brand="maya"]');
      const symbol = mark?.querySelector('[aria-hidden="true"]');

      expect(mark?.classList.contains(className)).toBe(true);
      expect(mark?.classList.contains("text-primary")).toBe(true);
      expect(symbol?.className).toContain("/maya-mark.svg");
      expect(symbol?.classList.contains("bg-current")).toBe(true);
      expect(symbol?.classList.contains("size-full")).toBe(true);
    },
  );

  test("inherits a contrasting color on dark brand panels", () => {
    const { container } = render(<MayaMark className="text-inherit" />);
    const mark = container.firstElementChild;

    expect(mark?.classList.contains("text-inherit")).toBe(true);
    expect(mark?.classList.contains("text-primary")).toBe(false);
    expect(mark?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
