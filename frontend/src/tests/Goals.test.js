import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Goals from "../GoalTracker";
import { CurrencyContext } from "../CurrencyContext";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";


jest.mock("../fireBase", () => ({
    auth: {
        currentUser: {
            uid: "test-user",
            email: "test@example.com",
            getIdToken: jest.fn().mockResolvedValue("fake-token")
        },
        onAuthStateChanged: jest.fn((cb) => {
            cb({
                uid: "test-user",
                email: "test@example.com",
                getIdToken: jest.fn().mockResolvedValue("fake-token")
            });
            return () => {};
        })
    }
}));

jest.mock("axios");
jest.mock("sweetalert2", () => ({
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true }))
}));

const renderWithProviders = (ui) => {
    return render(
        <CurrencyContext.Provider value={{ currency: "GBP" }}>
            <BrowserRouter>{ui}</BrowserRouter>
        </CurrencyContext.Provider>
    );
};

const mockGoals = [
    {
        id: "1",
        goal: "Save for vacation",
        targetAmount: 1000,
        allocatedFunds: 500,
        deadline: "2025-12-31"
    }
];

describe("Goals Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        axios.get.mockResolvedValue({ data: mockGoals });
        axios.post.mockResolvedValue({ status: 200 });
        axios.put.mockResolvedValue({ status: 200 });
        axios.delete.mockResolvedValue({ status: 200 });
    });

    test("renders goals and form", async () => {
        await act(async () => {
            renderWithProviders(<Goals />);
        });

        expect(await screen.findByText("Set Your Financial Goals")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e.g., Save for vacation/i)).toBeInTheDocument();

        // 🔍 Flexible matcher for deeply nested text
        expect(screen.getByText((text) => text.includes("Save for vacation"))).toBeInTheDocument();
    });

    test("adds a new goal", async () => {
        await act(async () => {
            renderWithProviders(<Goals />);
        });

        fireEvent.change(screen.getByPlaceholderText(/e.g., Save for vacation/i), {
            target: { value: "New Goal" }
        });

        fireEvent.change(screen.getByLabelText(/Target Amount/i), {
            target: { value: "1000" }
        });

        fireEvent.change(screen.getByLabelText(/Allocated Amount/i), {
            target: { value: "200" }
        });

        fireEvent.change(screen.getByLabelText(/Deadline/i), {
            target: { value: "2025-12-31" }
        });

        await act(async () => {
            fireEvent.click(screen.getByText("Add Goal"));
        });

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
        });
    });

    test("filters goals by search", async () => {
        await act(async () => {
            renderWithProviders(<Goals />);
        });

        const searchInput = screen.getByPlaceholderText(/search by goal name/i);
        fireEvent.change(searchInput, { target: { value: "vacation" } });

        await waitFor(() => {
            expect(screen.getByText((text) => text.includes("Save for vacation"))).toBeInTheDocument();
        });
    });

    test("edits a goal", async () => {
        await act(async () => {
            renderWithProviders(<Goals />);
        });

        fireEvent.click(await screen.findByText("Edit"));

        const input = screen.getByDisplayValue("Save for vacation");
        fireEvent.change(input, { target: { value: "Save for Paris" } });

        await act(async () => {
            fireEvent.click(screen.getByText("Save"));
        });

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled();
        });
    });

    test("deletes a goal", async () => {
        await act(async () => {
            renderWithProviders(<Goals />);
        });

        const deleteButton = await screen.findByText("Delete");

        await act(async () => {
            fireEvent.click(deleteButton);
        });

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith(
                expect.objectContaining({ title: "🗑️ Delete Goal?" })
            );
        });
    });
});
