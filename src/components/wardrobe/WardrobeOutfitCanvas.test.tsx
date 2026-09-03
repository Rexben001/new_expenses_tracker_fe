import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { WardrobeItem } from "../../types/wardrobe";
import { WardrobeOutfitCanvas } from "./WardrobeOutfitCanvas";

const shirt: WardrobeItem = {
  id: "shirt-1",
  name: "Blue shirt",
  category: "shirt",
  colorFamily: "blue",
  colorHex: "#224488",
  colorTone: "dark",
  imageKey: "wardrobe/shirt.png",
  imageUrl: "https://example.test/shirt.png",
  favorite: false,
  createdAt: "2026-09-03T20:00:00.000Z",
  updatedAt: "2026-09-03T20:00:00.000Z",
};

describe("WardrobeOutfitCanvas", () => {
  test("opens fit controls and reports a placement change", async () => {
    const onTransformChange = vi.fn();
    render(
      <WardrobeOutfitCanvas
        editing
        items={[shirt]}
        onTransformChange={onTransformChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Adjust fit for Blue shirt" }),
    );
    fireEvent.change(screen.getByRole("slider", { name: /Left\/right/ }), {
      target: { value: "12" },
    });

    expect(onTransformChange).toHaveBeenCalledWith(shirt, {
      x: 12,
      y: 0,
      scale: 1,
      rotation: 0,
    });
  });

  test("offers jacket action when supplied", () => {
    const onAddJacket = vi.fn();
    render(
      <WardrobeOutfitCanvas
        editing
        items={[shirt]}
        onAddJacket={onAddJacket}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Add jacket or blazer" }),
    ).toBeEnabled();
  });
});
