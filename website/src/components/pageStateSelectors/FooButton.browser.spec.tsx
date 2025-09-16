import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import FooBarButton from "./FooButton";

describe("FooBarButton", () => {
    it("changes text from foo to bar when clicked", () => {
        render(<FooBarButton />);
        const button = screen.getByRole("button", { name: "foo" });
        fireEvent.click(button);
        expect(screen.getByRole("button", { name: "bar" })).toBeInTheDocument();
    });
});
