import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { NumberStepper } from "./NumberStepper";

describe("NumberStepper", () => {
  it("increments and decrements whole-number quantities", async () => {
    const user = userEvent.setup();

    function Example() {
      const [value, setValue] = useState(1);
      return <NumberStepper value={value} min={0.01} step={1} ariaLabel="Quantity" onChange={setValue} />;
    }

    render(<Example />);
    const input = screen.getByRole("spinbutton", { name: "Quantity" });

    await user.click(screen.getByRole("button", { name: "Increase Quantity" }));
    expect(input).toHaveValue(2);

    await user.click(screen.getByRole("button", { name: "Decrease Quantity" }));
    expect(input).toHaveValue(1);
  });

  it("allows the field to be cleared and rounds typed decimals", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Example() {
      const [value, setValue] = useState(1);
      return <NumberStepper value={value} min={0.01} step={1} ariaLabel="Quantity" onChange={(next) => {
        onChange(next);
        setValue(next);
      }} />;
    }

    render(<Example />);
    const input = screen.getByRole("spinbutton", { name: "Quantity" });

    await user.clear(input);
    expect(input).toHaveValue(null);
    expect(onChange).not.toHaveBeenCalled();

    await user.type(input, "2.5");
    expect(input).toHaveValue(3);
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("supports keyboard increments", async () => {
    const user = userEvent.setup();

    function Example() {
      const [value, setValue] = useState(1);
      return <NumberStepper value={value} min={0.01} step={1} ariaLabel="Quantity" onChange={setValue} />;
    }

    render(<Example />);
    const input = screen.getByRole("spinbutton", { name: "Quantity" });

    await user.click(input);
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue(2);
  });
});
