import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./fireBase";

// Pages & Components
import LogIn from "./logIn";
import HomePage from "./homePage";
import SignUp from "./signUp";
import ContactUs from "./contactUs";
import ExpenseTracker from "./expenseTracker";
import GoalsTracker from "./GoalTracker";
import BudgetTracker from "./budgetTracker";
import Analytics from "./analytics";
import Settings from "./settings";
import ProtectedRoute from "./ProtectedRoute";
import { CurrencyProvider } from "./CurrencyContext";

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    useEffect(() => {
        const savedFirstName = localStorage.getItem("firstName");
        const savedLastName = localStorage.getItem("lastName");

        if (savedFirstName) setFirstName(savedFirstName);
        if (savedLastName) setLastName(savedLastName);

        // ✅ Auto-login for Cypress test user
        if (window.Cypress) {
            signInWithEmailAndPassword(auth, "testuser@example.com", "testpassword")
                .then((userCred) => {
                    console.log("✅ Cypress test user signed in:", userCred.user.email);
                })
                .catch((error) => {
                    console.error("❌ Cypress auto-login error:", error);
                });
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <CurrencyProvider>
            <Router>
                <nav>
                    {user ? (
                        <>
                            <Link to="/home">Home</Link>
                            <Link to="/settings">Settings</Link>
                            <Link to="/contactus">Contact Us</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/">Login</Link>
                            <Link to="/signup">Sign Up</Link>
                        </>
                    )}
                </nav>

                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LogIn />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Protected Routes */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <HomePage firstName={firstName} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings
                                    firstName={firstName}
                                    setFirstName={setFirstName}
                                    lastName={lastName}
                                    setLastName={setLastName}
                                />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/contactus"
                        element={
                            <ProtectedRoute>
                                <ContactUs />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/expenses"
                        element={
                            <ProtectedRoute>
                                <ExpenseTracker />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/budgets"
                        element={
                            <ProtectedRoute>
                                <BudgetTracker />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/goals"
                        element={
                            <ProtectedRoute>
                                <GoalsTracker />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute>
                                <Analytics />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </CurrencyProvider>
    );
}

export default App;
