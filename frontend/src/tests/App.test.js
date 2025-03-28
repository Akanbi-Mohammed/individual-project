import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { auth } from "../fireBase";

// Mock the Firebase auth module to control authentication state
jest.mock("../fireBase", () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: {
      uid: "test-user",
      getIdToken: jest.fn().mockResolvedValue("fake-token"),
    },
  },
}));

describe("App Component", () => {
  test("renders loading initially and then navigation for logged in user", async () => {
    const mockUnsub = jest.fn();
    // Simulate a logged in user asynchronously so "Loading..." shows initially
    auth.onAuthStateChanged.mockImplementation((callback) => {
      setTimeout(() => {
        callback({ uid: "test-user" });
      }, 100);
      return mockUnsub;
    });

    render(<App />);

    // Initially, the Loading text should be displayed
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    // After auth state updates, expect the navigation links for a logged in user
    await waitFor(() => expect(screen.getByText("Home")).toBeInTheDocument());
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
  });

  test("renders login and sign up links when not logged in", async () => {
    const mockUnsub = jest.fn();
    // Simulate logged out state asynchronously
    auth.onAuthStateChanged.mockImplementation((callback) => {
      setTimeout(() => {
        callback(null);
      }, 100);
      return mockUnsub;
    });

    render(<App />);

    // Wait for auth state update then check for login links
    await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());
    // Use getAllByText for "Sign Up" because multiple elements might render it
    const signUpLinks = screen.getAllByText("Sign Up");
    expect(signUpLinks.length).toBeGreaterThan(0);
  });
});
