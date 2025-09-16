import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Navbar from "../components/Navbar";

describe("Navbar", () => {
  it("renders primary navigation links", () => {
    render(<Navbar />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const simulationsLink = screen.getByRole("link", { name: /simulações/i });
    const dataLink = screen.getByRole("link", { name: /dados/i });

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(simulationsLink).toHaveAttribute("href", "/simulations");
    expect(dataLink).toHaveAttribute("href", "/data");
  });
});
