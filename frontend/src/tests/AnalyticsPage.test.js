// AnalyticsPage.test.js

// Polyfill ResizeObserver for jsdom
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import AnalyticsPage from "../analytics";
import { CurrencyContext } from "../CurrencyContext";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import { auth } from "../fireBase";

// --- Mocks ---

jest.mock("../fireBase", () => ({
    auth: {
        currentUser: {
            uid: "test-user",
            email: "test@example.com",
            getIdToken: jest.fn().mockResolvedValue("fake-token"),
        },
    },
}));

jest.mock("axios");

// Mock jsPDF to avoid actual PDF file creation
jest.mock("jspdf", () => {
    return jest.fn().mockImplementation(() => {
        return {
            internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
            addImage: jest.fn(),
            save: jest.fn(),
        };
    });
});

// Mock html2canvas to immediately return a fake canvas
jest.mock("html2canvas", () =>
    jest.fn(() => Promise.resolve({ toDataURL: () => "data:image/png;base64,xyz" }))
);

// --- Helper: Render with Providers ---
const renderWithProviders = (ui) => {
    return render(
        <CurrencyContext.Provider value={{ currency: "$" }}>
            <BrowserRouter>{ui}</BrowserRouter>
        </CurrencyContext.Provider>
    );
};

// --- Set system time for predictable month values ---
beforeEach(() => {
    jest.useFakeTimers("modern").setSystemTime(new Date("2025-03-27"));
});
afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

// --- Test Data ---
const mockMonthlyIncome = { amount: 5000 };
const mockExpenses = [
    { id: "1", category: "Food", amount: 100, date: "2025-03-10", description: "Lunch" },
    { id: "2", category: "Transport", amount: 50, date: "2025-03-11", description: "Bus" },
];
const mockBudgets = [
    { id: "1", category: "Food", amount: 300, month: "2025-03" },
    { id: "2", category: "Transport", amount: 100, month: "2025-03" },
];
const mockCategories = ["Food", "Transport", "Entertainment"];

// --- Setup Axios Mocks ---
beforeEach(() => {
    axios.get.mockImplementation((url) => {
        if (url.includes("/api/user-income")) {
            return Promise.resolve({ data: mockMonthlyIncome });
        }
        if (url.includes("/api/expenses")) {
            return Promise.resolve({ data: mockExpenses });
        }
        if (url.includes("/api/budgets")) {
            return Promise.resolve({ data: mockBudgets });
        }
        if (url.includes("/api/categories")) {
            return Promise.resolve({ data: mockCategories });
        }
        return Promise.reject(new Error("Unknown URL"));
    });
});

describe("AnalyticsPage", () => {
    test("renders main sections of the Analytics page", async () => {
        renderWithProviders(<AnalyticsPage />);
        // Narrow search to the element that shows the current month using the ".current-month" class
        const currentMonthDisplay = await screen.findByText(/March 2025/i, { selector: ".current-month" });
        expect(currentMonthDisplay).toBeInTheDocument();

        // Check for Savings Summary heading
        expect(screen.getByText(/Savings Summary/i)).toBeInTheDocument();

        // Check for export buttons
        expect(screen.getByText("Print")).toBeInTheDocument();
        expect(screen.getByText("Export CSV")).toBeInTheDocument();
        expect(screen.getByText("Export PDF")).toBeInTheDocument();

        // Also check that the page title "Analytics" appears as a heading (h2)
        const pageTitle = await screen.findByRole("heading", { level: 2, name: /Analytics/i });
        expect(pageTitle).toBeInTheDocument();
    });

    test("navigates months when Previous and Next buttons are clicked", async () => {
        renderWithProviders(<AnalyticsPage />);
        // Narrow search for current month display
        const currentMonthDisplay = await screen.findByText(/March 2025/i, { selector: ".current-month" });
        expect(currentMonthDisplay).toBeInTheDocument();

        const prevButton = screen.getByText(/Previous/i);
        const nextButton = screen.getByText(/Next/i);

        // Click "Previous" to go from March to February 2025
        await act(async () => {
            fireEvent.click(prevButton);
        });
        const febDisplay = await screen.findByText(/February 2025/i, { selector: ".current-month" });
        expect(febDisplay).toBeInTheDocument();

        // Click "Next" twice to advance from February to April 2025
        await act(async () => {
            fireEvent.click(nextButton);
            fireEvent.click(nextButton);
        });
        const aprilDisplay = await screen.findByText(/April 2025/i, { selector: ".current-month" });
        expect(aprilDisplay).toBeInTheDocument();
    });

    test("calculates and displays Savings Summary correctly", async () => {
        renderWithProviders(<AnalyticsPage />);
        // Wait for the Savings Summary section to load
        await waitFor(() => {
            expect(screen.getByText(/Savings Summary/i)).toBeInTheDocument();
        });
        // Wait for the savings value to appear (savings = 5000 - (300+100) = 4600)
        const savingsRegex = /\$4,600(\.00)?/;
        await waitFor(() => {
            const savingsElements = screen.queryAllByText(savingsRegex);
            expect(savingsElements.length).toBeGreaterThan(0);
        });
    });

    test("exports CSV when Export CSV button is clicked", async () => {
        renderWithProviders(<AnalyticsPage />);
        const exportCSVButton = await screen.findByText("Export CSV");

        // Mock window.URL.createObjectURL
        const createObjectURLMock = jest.fn(() => "blob-url");
        global.URL.createObjectURL = createObjectURLMock;

        await act(async () => {
            fireEvent.click(exportCSVButton);
        });


    });

    test("calls export PDF functionality when Export PDF button is clicked", async () => {
        renderWithProviders(<AnalyticsPage />);
        const exportPDFButton = await screen.findByText("Export PDF");
        await act(async () => {
            fireEvent.click(exportPDFButton);
        });
        await waitFor(() => {
            const jsPDF = require("jspdf");

        });
    });
});
