import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BudgetTracker from "../BudgetTracker";
import { CurrencyContext } from "../CurrencyContext";
import axios from "axios";
import Swal from "sweetalert2";

// --- Mocks ---

// Mock Firebase auth module
jest.mock("../fireBase", () => ({
    auth: {
        currentUser: {
            uid: "test-user",
            email: "test@example.com",
            getIdToken: jest.fn().mockResolvedValue("fake-token"),
        },
    },
}));

// Mock axios for API calls
jest.mock("axios");

// Mock SweetAlert2 so that popups do not actually show during tests
jest.mock("sweetalert2", () => ({
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true, isDenied: false })),
}));

// --- Helper: Render with Providers ---

const renderWithProviders = (ui) => {
    return render(
        <CurrencyContext.Provider value={{ currency: "GBP" }}>
            <BrowserRouter>{ui}</BrowserRouter>
        </CurrencyContext.Provider>
    );
};

// --- Set up fake timers & system time for consistency (March 27, 2025) ---
beforeAll(() => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2025-03-27"));
});
afterAll(() => {
    jest.useRealTimers();
});

// --- Mock Data ---

const mockBudgets = [
    { id: "1", category: "Food", amount: 100, month: "2025-03" },
];
const mockCategories = ["Food", "Transport", "Entertainment"];
const mockExpenses = [{ id: "1", category: "Food", amount: 50, date: "2025-03-15" }];
const mockMonthlyIncome = { amount: 1000 };

// --- Setup Axios Mocks ---

beforeEach(() => {
    jest.clearAllMocks();

    axios.get.mockImplementation((url) => {
        if (url.includes("/api/categories")) {
            return Promise.resolve({ status: 200, data: mockCategories });
        }
        if (url.includes("/api/budgets") && !url.includes("delete-all")) {
            return Promise.resolve({ status: 200, data: mockBudgets });
        }
        if (url.includes("/api/expenses")) {
            return Promise.resolve({ status: 200, data: mockExpenses });
        }
        if (url.includes("/api/user-income")) {
            return Promise.resolve({ status: 200, data: mockMonthlyIncome });
        }
        return Promise.reject(new Error("Unknown URL"));
    });

    axios.post.mockResolvedValue({ status: 200 });
    axios.put.mockResolvedValue({ status: 200 });
    axios.delete.mockResolvedValue({ status: 200 });
});

// --- Tests ---

test("renders Budget Tracker UI with expected elements", async () => {
    renderWithProviders(<BudgetTracker />);

    // Instead of generic text search, query for the h2 heading
    const mainHeading = await screen.findByRole("heading", {
        level: 2,
        name: /Budget Tracker/i,
    });
    expect(mainHeading).toBeInTheDocument();

    // Check that the category dropdown renders (by its label)
    expect(screen.getByLabelText(/Select a Category/i)).toBeInTheDocument();

    // Verify that the Month input is present (by its label)
    expect(screen.getByLabelText(/Month/i)).toBeInTheDocument();
});

test("adds a new budget when valid data is provided", async () => {
    renderWithProviders(<BudgetTracker />);

    // Wait for the category dropdown to appear
    const categorySelect = await screen.findByLabelText(/Select a Category/i);

    // Wait until the options are rendered and verify one of them contains "Entertainment"
    await waitFor(() => {
        const options = screen.getAllByRole("option");
        const hasEntertainment = options.some((opt) =>
            opt.textContent.includes("Entertainment")
        );
        expect(hasEntertainment).toBe(true);
    });

    // Change the category to "Entertainment"
    await act(async () => {
        fireEvent.change(categorySelect, { target: { value: "Entertainment" } });
    });

    // Enter a valid budget amount
    const amountInput = screen.getByPlaceholderText("e.g., 5,000");
    await act(async () => {
        fireEvent.change(amountInput, { target: { value: "200" } });
    });

    // Click the "Add Budget" button
    const addButton = screen.getByText("Add Budget");
    await act(async () => {
        fireEvent.click(addButton);
    });

    // Wait until axios.post is called (indicating the new budget is being added)
    await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
    });
});


test("shows warning when required fields are missing", async () => {
    renderWithProviders(<BudgetTracker />);

    // Click "Add Budget" without providing a category or amount
    const addButton = screen.getByText("Add Budget");
    await act(async () => {
        fireEvent.click(addButton);
    });

    // Wait for SweetAlert2 to be called with a missing information warning
    await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "⚠️ Missing Information!",
            })
        );
    });
});
