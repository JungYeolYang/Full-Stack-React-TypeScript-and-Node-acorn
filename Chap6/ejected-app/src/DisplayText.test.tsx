import React from "react";
import { render, fireEvent } from "@testing-library/react";
import DisplayText from "./DisplayText";
import "@testing-library/jest-dom/extend-expect";
describe("Test DisplayText", () => {
  it("renders without crashing", () => {
    const { baseElement } = render(<DisplayText />);
    console.log(baseElement.innerHTML);
    expect(baseElement).toBeInTheDocument();
  });
  it("receive input text", () => {
    const username = "testuser";
    const { getByTestId } = render(<DisplayText />);
    const input = getByTestId("user-input");
    fireEvent.change(input, { target: { value: username } });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(username);
  });

  it("shows welcome message", () => {
    const testuser = "testuser";
    const msg = `Welcome to React testing, ${testuser}`;
    const { getByTestId } = render(<DisplayText />);
    const input = getByTestId("user-input");
    const label = getByTestId("final-msg");
    fireEvent.change(input, { target: { value: testuser } });
    const btn = getByTestId("input-submit");
    fireEvent.click(btn);
    expect(label).toBeInTheDocument();
    expect(label.innerHTML).toBe(msg);
  });
});
