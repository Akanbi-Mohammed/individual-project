import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ExpenseTracker from "../ExpenseTracker";
import { CurrencyContext } from "../CurrencyContext";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

// --- Mocks ---

jest.mock("../fireBase", () => ({
    auth: {
        currentUser: {
            uid: "test-user",
            email: "test@example.com",
            getIdToken: jest.fn().mockResolvedValue("fake-token"),
        },
        onAuthStateChanged: jest.fn((cb) => {
            cb({
                uid: "test-user",
                email: "test@example.com",
                getIdToken: jest.fn().mockResolvedValue("fake-token"),
            });
            return () => {}; // dummy unsubscribe
        }),
    },
}));
jest.mock("axios");
jest.mock("sweetalert2", () => ({
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
}));
// Our RecurringExpenseManager is mocked to render a div with specific text
jest.mock("../RecurringExpenseManager", () => () => <div>Recurring Expense Mock</div>);

// --- Helper for rendering ---
const renderWithProviders = (ui) =>
    render(
        <CurrencyContext.Provider value={{ currency: "GBP" }}>
            <BrowserRouter>{ui}</BrowserRouter>
        </CurrencyContext.Provider>
    );

// --- Test Data ---
const mockExpenses = [
    {
        id: "1",
        category: "Food",
        amount: 50,
        date: "2025-03-25",
        description: "Lunch",
    },
];
const mockBudgets = [
    {
        id: "1",
        category: "Food",
        amount: 200,
        month: "2025-03",
    },
];
const mockCategories = ["Food", "Transport", "Entertainment"];

// --- Setup ---
beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2025-03-27"));

    axios.get.mockImplementation((url) => {
        if (url.includes("/budgets")) return Promise.resolve({ data: mockBudgets });
        if (url.includes("/categories")) return Promise.resolve({ data: mockCategories });
        if (url.includes("/expenses")) return Promise.resolve({ data: mockExpenses });
        return Promise.reject(new Error("Unknown URL"));
    });

    axios.post.mockResolvedValue({ status: 200 });
    axios.delete.mockResolvedValue({ status: 200 });
    axios.put.mockResolvedValue({ status: 200 });
});

afterAll(() => {
    jest.useRealTimers();
});

// --- Tests ---
describe("ExpenseTracker", () => {
    test("renders and displays expenses", async () => {
        renderWithProviders(<ExpenseTracker />);
        // Check that the main title is rendered
        expect(await screen.findByText("Expense Tracker")).toBeInTheDocument();

        // Use a flexible matcher to find "Food" anywhere in the text content
        expect(
            await screen.findByText((content) => content.includes("Food"))
        ).toBeInTheDocument();

        // Similarly, check for the expense description "Lunch"
        expect(screen.getByText((content) => content.includes("Lunch"))).toBeInTheDocument();

        // Use a regex to allow for possible formatting, e.g., "£50" or "£50.00"
        expect(screen.getByText(/£50/)).toBeInTheDocument();
    });

    test("shows warning when trying to add empty expense", async () => {
        renderWithProviders(<ExpenseTracker />);
        await act(async () => {
            fireEvent.click(screen.getByText("Add Expense"));
        });

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "⚠️ Missing Fields!",
                })
            );
        });
    });

    test("deletes an expense", async () => {
        renderWithProviders(<ExpenseTracker />);
        // Wait until an element containing "Food" is in the document
        await screen.findByText((content) => content.includes("Food"));

        fireEvent.click(screen.getByText("Delete"));

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "⚠️ Delete Expense?",
                })
            );
        });
    });

    test("renders RecurringExpenseManager", async () => {
        renderWithProviders(<ExpenseTracker />);
        // Since our mock renders "Recurring Expense Mock", we expect that text
        expect(await screen.findByText("Recurring Expense Mock")).toBeInTheDocument();
    });
});
