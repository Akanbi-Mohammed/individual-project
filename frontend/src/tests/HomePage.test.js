// HomePage.test.js

// Increase timeout for the file
jest.setTimeout(10000);

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "../homePage";
import { CurrencyContext } from "../CurrencyContext";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// Mock axios to simulate API calls
jest.mock("axios");

// Mock Firebase auth so that we don't hit real endpoints
jest.mock("../fireBase", () => ({
    auth: {
        currentUser: {
            uid: "test-uid",
            displayName: "Alice Tester",
            getIdToken: jest.fn().mockResolvedValue("test-token"),
        },
    },
}));

// Optional: Suppress specific act warnings
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation((msg) => {
        if (typeof msg === "string" && msg.includes("act(...)")) return;
        console.error(msg);
    });
});

// Helper function to render with providers (CurrencyContext and Router)
const renderWithProviders = (ui, { providerProps, ...renderOptions } = {}) => {
    return render(
        <CurrencyContext.Provider value={providerProps}>
            <BrowserRouter>{ui}</BrowserRouter>
        </CurrencyContext.Provider>,
        renderOptions
    );
};

describe("HomePage Component", () => {
    // Default CurrencyContext
    const providerProps = { currency: "$" };

    beforeEach(() => {
        // Reset axios mocks to default: empty arrays for endpoints
        axios.get.mockReset();
        axios.get.mockImplementation((url) => {
            if (url.includes("/api/budgets")) {
                return Promise.resolve({ data: [] });
            }
            if (url.includes("/api/expenses")) {
                return Promise.resolve({ data: [] });
            }
            if (url.includes("/api/user-income")) {
                return Promise.resolve({ data: { amount: 0 } });
            }
            if (url.includes("/api/goals")) {
                return Promise.resolve({ data: [] });
            }
            return Promise.resolve({ data: {} });
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("renders header with welcome message and Start Tutorial button", async () => {
        renderWithProviders(<HomePage firstName="Alice" />, { providerProps });
        expect(screen.getByText(/Welcome to Your Personal Budget Planner/i)).toBeInTheDocument();
        expect(screen.getByText(/Alice/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Start Tutorial/i })).toBeInTheDocument();
    });

    test("starts tutorial when 'Start Tutorial' button is clicked", async () => {
        renderWithProviders(<HomePage firstName="Alice" />, { providerProps });
        const tutorialButton = screen.getByRole("button", { name: /Start Tutorial/i });
        fireEvent.click(tutorialButton);
        await waitFor(() => {
            expect(screen.getByTestId("joyride-welcome")).toBeInTheDocument();
        });
    });

    test("renders quick links with correct buttons", () => {
        renderWithProviders(<HomePage firstName="Alice" />, { providerProps });
        const quickLinkContainer = screen.getByText("Quick Links").parentElement;
        expect(quickLinkContainer).toBeInTheDocument();
        const buttons = quickLinkContainer.querySelectorAll("button");
        expect(buttons).toHaveLength(4);
        expect(buttons[0]).toHaveTextContent("Add New Expense");
        expect(buttons[1]).toHaveTextContent("Create New Budget");
        expect(buttons[2]).toHaveTextContent("Create New Goal");
        expect(buttons[3]).toHaveTextContent("View Analytics");
    });

    test("renders income section and toggles edit mode", async () => {
        renderWithProviders(<HomePage firstName="Alice" />, { providerProps });
        await waitFor(() => {
            expect(screen.getByText(/Income for/i)).toBeInTheDocument();
        });
        const editButton = screen.getByRole("button", { name: /Edit Income/i });
        expect(editButton).toBeInTheDocument();
        fireEvent.click(editButton);
        expect(screen.getByPlaceholderText(/Enter your income/i)).toBeInTheDocument();
    });

    test("displays correct overview data when budgets and expenses exist", async () => {
        // Override axios responses for non-empty data before rendering
        axios.get.mockReset();
        axios.get.mockImplementation((url) => {
            if (url.includes("/api/budgets")) {
                return Promise.resolve({
                    data: [
                        { id: 1, month: "2025-03", amount: 1000 },
                        { id: 2, month: "2025-03", amount: 500 },
                    ],
                });
            }
            if (url.includes("/api/expenses")) {
                return Promise.resolve({
                    data: [
                        { id: 1, date: "2025-03-05", amount: 300, category: "Food" },
                        { id: 2, date: "2025-03-06", amount: 200, category: "Transport" },
                    ],
                });
            }
            if (url.includes("/api/user-income")) {
                return Promise.resolve({ data: { amount: 2000 } });
            }
            if (url.includes("/api/goals")) {
                return Promise.resolve({ data: [] });
            }
            return Promise.resolve({ data: {} });
        });

        renderWithProviders(<HomePage firstName="Alice" />, { providerProps });

        // Wait for the "Total Budget" header to appear (using extended timeout)
        const budgetHeader = await screen.findByText(/Total Budget/i, {}, { timeout: 10000 });
        expect(budgetHeader).toBeInTheDocument();

        // Get the overview card containing "Total Budget"
        const overviewCard = budgetHeader.closest(".overview-card");
        expect(overviewCard).toBeInTheDocument();

        // Helper to extract text from the first <p> element in that card
        const getCardText = (card) => card.querySelector("p")?.textContent || "";
        const budgetText = getCardText(overviewCard);
        expect(budgetText).toContain("$1,500.00");

        // Now check for Total Expenses
        const expensesHeader = await screen.findByText(/Total Expenses/i, {}, { timeout: 10000 });
        const expensesCard = expensesHeader.closest(".overview-card");
        expect(expensesCard).toBeInTheDocument();
        const expensesText = getCardText(expensesCard);
        expect(expensesText).toContain("$500.00");

        // Check for Remaining (should be 1500 - 500 = 1000)
        const remainingHeader = await screen.findByText(/Remaining/i, {}, { timeout: 10000 });
        const remainingCard = remainingHeader.closest(".overview-card");
        expect(remainingCard).toBeInTheDocument();
        const remainingText = getCardText(remainingCard);
        expect(remainingText).toContain("$1,000.00");

        // Verify that no budget alert is displayed if not needed
        expect(screen.queryByText(/Budget Alert/i)).not.toBeInTheDocument();
    });

    test("handles API error responses gracefully", async () => {
        axios.get.mockReset();
        axios.get.mockImplementation((url) => {
            if (url.includes("/api/budgets")) {
                return Promise.reject(new Error("Server Error"));
            }
            if (url.includes("/api/expenses")) {
                return Promise.resolve({ data: [] });
            }
            if (url.includes("/api/user-income")) {
                return Promise.resolve({ data: { amount: 0 } });
            }
            if (url.includes("/api/goals")) {
                return Promise.resolve({ data: [] });
            }
            return Promise.resolve({ data: {} });
        });

        renderWithProviders(<HomePage firstName="Alice" />, { providerProps });
        await waitFor(() => {
            expect(screen.getByText(/Quick Overview/i)).toBeInTheDocument();
        });
    });

    test("has accessible navigation elements", () => {
        renderWithProviders(<HomePage firstName="Alice" />, { providerProps });
        const nav = screen.getByRole("navigation");
        expect(nav).toBeInTheDocument();
    });
});
