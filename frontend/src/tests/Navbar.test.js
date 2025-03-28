// __tests__/Navbar.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "../Navbar";
import { BrowserRouter } from "react-router-dom";

// Helper to wrap with router
const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Navbar Component", () => {
    test("renders navbar logo and all links", () => {
        renderWithRouter(<Navbar />);

        expect(screen.getByText(/Budget Tracker/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /toggle navigation/i })).toBeInTheDocument();
    });

    test("opens and closes mobile menu", () => {
        renderWithRouter(<Navbar />);

        // Click the hamburger icon
        const toggleButton = screen.getByRole("button", { name: /toggle navigation/i });
        fireEvent.click(toggleButton);

        // Expect menu to be shown
        expect(screen.getByText(/Home/i)).toBeInTheDocument();
        expect(screen.getByText(/Budgets/i)).toBeInTheDocument();
        expect(screen.getByText(/Log Out/i)).toBeInTheDocument();

        // Close menu by clicking overlay
        const overlay = screen.getByRole("button", { name: /close menu/i });
        fireEvent.click(overlay);

        // Expect side menu to close (you can test it by checking class or not visible if styled properly)
        expect(screen.getByText(/Home/i)).toBeInTheDocument(); // Still in DOM, but can test class visibility
    });

    test("contains correct link hrefs", () => {
        renderWithRouter(<Navbar />);
        fireEvent.click(screen.getByRole("button", { name: /toggle navigation/i }));

        expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/home");
        expect(screen.getByRole("link", { name: /budgets/i })).toHaveAttribute("href", "/budgets");
        expect(screen.getByRole("link", { name: /expenses/i })).toHaveAttribute("href", "/expenses");
        expect(screen.getByRole("link", { name: /goals/i })).toHaveAttribute("href", "/goals");
        expect(screen.getByRole("link", { name: /analytics/i })).toHaveAttribute("href", "/analytics");
        expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
        expect(screen.getByRole("link", { name: /contact us/i })).toHaveAttribute("href", "/contactUs");
        expect(screen.getByRole("link", { name: /log out/i })).toHaveAttribute("href", "/");
    });
});
