// __tests__/authForms.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// 🔐 Mock firebase/auth BEFORE importing components
jest.mock("firebase/auth", () => ({
    getAuth: () => ({}), // mock getAuth so fireBase.js doesn't break
    signInWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    updateProfile: jest.fn(),
}));

// ✅ Import mocked methods AFTER the mock
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";

// ✅ Import components AFTER mocking firebase
import LogIn from "../logIn";
import SignUp from "../signUp";

const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("LogIn Component", () => {
    beforeEach(() => jest.clearAllMocks());

    test("logs in with valid credentials", async () => {
        signInWithEmailAndPassword.mockResolvedValue({ user: {} });

        renderWithRouter(<LogIn />);

        fireEvent.change(screen.getByPlaceholderText(/Email/i), {
            target: { value: "test@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), {
            target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

        await waitFor(() => {
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
                expect.anything(),
                "test@example.com",
                "password123"
            );
        });
    });

    test("shows error on reset password without email", async () => {
        renderWithRouter(<LogIn />);

        fireEvent.click(screen.getByText(/Forgot Password/i));

        expect(
            await screen.findByText(/Please enter your email address/i)
        ).toBeInTheDocument();
    });
});

describe("SignUp Component", () => {
    beforeEach(() => jest.clearAllMocks());

    test("registers a new user", async () => {
        createUserWithEmailAndPassword.mockResolvedValue({ user: {} });
        updateProfile.mockResolvedValue();

        renderWithRouter(<SignUp />);

        fireEvent.change(screen.getByPlaceholderText(/First Name/i), {
            target: { value: "Alice" },
        });
        fireEvent.change(screen.getByPlaceholderText(/Last Name/i), {
            target: { value: "Tester" },
        });
        fireEvent.change(screen.getByPlaceholderText(/Email Address/i), {
            target: { value: "alice@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), {
            target: { value: "pass1234" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

        await waitFor(() => {
            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
                expect.anything(),
                "alice@example.com",
                "pass1234"
            );
        });

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalled();
        });
    });
});
