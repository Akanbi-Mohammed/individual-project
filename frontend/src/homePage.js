/**
 * HomePage Component
 *
 * This component serves as the main landing page (dashboard) for the Budget Tracker application.
 * It provides:
 *  - A quick overview of the user's budget, expenses, and remaining funds.
 *  - A tutorial (react-joyride) that guides users through key features.
 *  - The ability to set/edit monthly income without automatic prompts.
 *  - Quick Links for creating budgets, goals, and more.
 *
 * Adheres to software engineering principles:
 *  - Single Responsibility: Focuses on displaying an overview and guiding the user.
 *  - Modularity: Data fetching is in separate functions. The tutorial steps are defined in an array.
 *  - Maintainability: Thorough comments and straightforward variable naming.
 *  - Extensibility: Additional steps or features can be easily added to the tutorial or UI.
 */

import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./navbar";
import "./homepage.css";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { CurrencyContext } from "./CurrencyContext";
import { getCurrencySymbol } from "./settings";
import { auth } from "./fireBase";
import Joyride, { STATUS } from "react-joyride";

const HomePage = ({ firstName: propFirstName }) => {
    // ---------------------------
    // State Variables
    // ---------------------------

    // Budget & Expense Overview
    const [totalBudget, setTotalBudget] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [remainingBudget, setRemainingBudget] = useState(0);

    // Activity & Goals
    const [recentActivities, setRecentActivities] = useState([]);
    const [upcomingGoals, setUpcomingGoals] = useState([]);
    const [dueSoonGoals, setDueSoonGoals] = useState(0);

    // Monthly Income Management
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [incomeInput, setIncomeInput] = useState("");

    // User & Month Selection
    const [firstName, setFirstName] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    // Tutorial (react-joyride)
    const [runGuide, setRunGuide] = useState(false);

    // Access currency settings
    const { currency } = useContext(CurrencyContext);
    const currentMonth = new Date().toISOString().slice(0, 7);

    // ---------------------------
    // Interactive Tutorial Steps
    // ---------------------------
    const guideSteps = [
        {
            target: ".header-container",
            content: (
                <div data-testid="joyride-welcome">
                    Welcome to your home page! Here you can see a summary of your finances.
                </div>
            ),
        },
        {
            target: ".navbar",
            content:
                "Use the top navigation bar to move between Home, Budgets, Expenses, Goals, and more.",
        },
        {
            target: ".income-section",
            content:
                "Here you can set or update your monthly income whenever needed.",
        },
        {
            target: ".overview-section",
            content:
                "This section shows your total budget, total expenses, and remaining funds for the month.",
        },
        {
            target: ".quick-links",
            content:
                "Use Quick Links to add expenses, create budgets, set goals, or view analytics.",
        },
        {
            // Follow-on step: Points to the budgets link in the navbar.
            target: ".navbar .navbar-budgets",
            content:
                "Now, click here to view and manage your budgets and continue the tutorial.",
        },
        {
            // Optional: Additional step if you want to guide them further on the budgets page.
            target: ".budget-tracker-title",
            content:
                "This is your Budget Tracker page where you can create and manage budgets for different categories.",
        },
    ];


    // ---------------------------
    // Lifecycle Hooks
    // ---------------------------
    useEffect(() => {
        fetchOverview();
        fetchUpcomingGoals();
        fetchIncomeFromBackend();
    }, [selectedMonth]);

    useEffect(() => {
        // If user has a displayName in Firebase, use it; otherwise, use propFirstName
        if (auth.currentUser && auth.currentUser.displayName) {
            const names = auth.currentUser.displayName.split(" ");
            setFirstName(names[0] || "");
        } else {
            setFirstName(propFirstName || "Friend");
        }
    }, [propFirstName]);

    // ---------------------------
    // Data Fetching Functions
    // ---------------------------

    /**
     * Fetch budgets and expenses for the selected month to display an overview.
     */
    const fetchOverview = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("User is not authenticated. Unable to fetch overview.");
                return;
            }
            const token = await user.getIdToken();

            const budgetsUrl = "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets";
            const expensesUrl = "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses";

            // Fetch budgets and expenses in parallel
            const [budgetsResponse, expensesResponse] = await Promise.all([
                axios.get(budgetsUrl, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(expensesUrl, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            // Filter by selected month
            const budgetsForMonth = budgetsResponse.data.filter((budget) =>
                budget.month.startsWith(selectedMonth)
            );
            const expensesForMonth = expensesResponse.data.filter((expense) =>
                expense.date.startsWith(selectedMonth)
            );

            // Calculate totals
            const totalBudgetAmount = budgetsForMonth.reduce((acc, budget) => acc + budget.amount, 0);
            const totalExpenseAmount = expensesForMonth.reduce((acc, expense) => acc + expense.amount, 0);

            // Update state
            setTotalBudget(totalBudgetAmount);
            setTotalExpenses(totalExpenseAmount);
            setRemainingBudget(totalBudgetAmount - totalExpenseAmount);
            setRecentActivities(expensesForMonth.slice(-3));
        } catch (error) {
            console.error("Error fetching overview data:", error);
        }
    };

    /**
     * Fetch upcoming goals to display in the "Upcoming Goals" section.
     */
    const fetchUpcomingGoals = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("User is not authenticated. Unable to fetch goals.");
                return;
            }
            const token = await user.getIdToken();
            const goalsUrl = "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals";
            const response = await axios.get(goalsUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const allGoals = response.data;
            const now = new Date();
            const sevenDaysLater = new Date();
            sevenDaysLater.setDate(now.getDate() + 7);

            // Filter goals due within the next 7 days
            const soonDueGoals = allGoals.filter((goal) => {
                const deadlineDate = new Date(goal.deadline);
                return deadlineDate >= now && deadlineDate <= sevenDaysLater;
            });

            setUpcomingGoals(allGoals);
            setDueSoonGoals(soonDueGoals.length);
        } catch (error) {
            console.error("Error fetching upcoming goals:", error);
        }
    };

    /**
     * Fetch the user's monthly income for the selected month.
     */
    const fetchIncomeFromBackend = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("User is not authenticated.");
                return;
            }
            const token = await user.getIdToken();
            const response = await axios.get(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/user-income?month=${selectedMonth}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update monthly income if found, otherwise set to 0
            if (response.data && response.data.amount !== undefined) {
                setMonthlyIncome(response.data.amount);
                setIncomeInput(String(response.data.amount));
            } else {
                setMonthlyIncome(0);
                setIncomeInput("");
            }
        } catch (error) {
            console.error("Error fetching income:", error);
        }
    };

    // ---------------------------
    // Monthly Income Editing
    // ---------------------------

    /**
     * Validate and update the monthly income in the backend.
     */
    const addOrUpdateMonthlyIncome = async () => {
        const numericIncome = Number(incomeInput.replace(/,/g, ""));
        if (numericIncome <= 0) {
            Swal.fire({
                title: "⚠️ Invalid Income!",
                text: "Income must be greater than zero.",
                icon: "warning",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
            return;
        }
        if (numericIncome < totalBudget) {
            Swal.fire({
                title: "⚠️ Budget Exceeds Income!",
                html: `
          <div style="text-align: center;">
            <p style="font-size: 18px; font-weight: bold; color: #ff4d4d;">
              Your total allocated budgets (${getCurrencySymbol(currency)}${totalBudget.toFixed(
                    2
                )}) exceed your new income (${getCurrencySymbol(currency)}${numericIncome.toFixed(2)}).
            </p>
            <p style="font-size: 16px;">Please reduce your budgets before updating your income.</p>
          </div>
        `,
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("User is not authenticated.");
                return;
            }
            const token = await user.getIdToken();

            // Build the payload for the income update
            const incomeData = {
                month: selectedMonth,
                amount: numericIncome,
                userId: user.uid,
            };

            // Send to backend
            await axios.post(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/user-income`,
                incomeData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh state
            await fetchIncomeFromBackend();
            setEditMode(false);

            // Success feedback
            Swal.fire({
                title: "✅ Income Updated!",
                html: `
          <div style="text-align: center;">
            <span style="font-size: 20px;">🎉</span>
            <p style="font-size: 18px; font-weight: bold; color: #28a745;">
              Your monthly income has been updated to:
            </p>
            <p style="font-size: 22px; font-weight: bold; color: #007acc;">
              ${getCurrencySymbol(currency)}${new Intl.NumberFormat().format(numericIncome)}
            </p>
          </div>
        `,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });
        } catch (error) {
            console.error("Error updating income:", error);
            Swal.fire({
                title: "❌ Error!",
                text: "There was an error updating your income. Please try again.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };

    /**
     * Toggle edit mode for monthly income input.
     */
    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    // ---------------------------
    // Utility Functions
    // ---------------------------

    /**
     * Format the month string (YYYY-MM) into a more readable format (e.g., "March 2025").
     */
    const formatMonthYear = (isoString) => {
        const date = new Date(isoString + "-01");
        return new Intl.DateTimeFormat("en-GB", {
            month: "long",
            year: "numeric",
        }).format(date);
    };

    /**
     * Return a tree emoji representing how much of the budget is left.
     *  - 🌳: Over 75% budget remaining
     *  - 🌲: Over 50% budget remaining
     *  - 🌱: Over 25% budget remaining
     *  - 🌵: Otherwise
     */
    const getSavingsTreeEmoji = () => {
        if (totalBudget === 0) return "🌵";
        const savingsRatio = remainingBudget / totalBudget;
        if (savingsRatio >= 0.75) return "🌳";
        else if (savingsRatio >= 0.5) return "🌲";
        else if (savingsRatio >= 0.25) return "🌱";
        return "🌵";
    };

    // ---------------------------
    // Tutorial Logic
    // ---------------------------

    /**
     * Start the interactive tutorial when user clicks "Start Tutorial" button.
     */
    const handleStartTutorial = () => {
        setRunGuide(true);
    };

    /**
     * React Joyride callback to handle when the tutorial finishes or is skipped.
     */
    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRunGuide(false);
            // Potentially show final confetti or another message here
        }
    };

    // ---------------------------
    // Calculated Values
    // ---------------------------
    const totalUsagePercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    // ---------------------------
    // Render
    // ---------------------------
    return (
        <div className="expense-tracker">
            <Navbar />

            {/* Interactive Guide using react-joyride */}
            <Joyride
                steps={guideSteps}
                run={runGuide}
                continuous={true}
                showSkipButton={true}
                disableBeacon={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        zIndex: 10000, // Make sure tooltips appear on top
                    },
                }}
            />

            {/* HEADER SECTION */}
            <header className="header-container">
                <div className="header-content">
                    <h1>
                        Welcome to Your Personal Budget Planner, {firstName ? firstName : "Friend"}!
                    </h1>
                    <p>Track, plan, and optimize your finances effectively!</p>

                    {/*
            Start Tutorial button:
            Begins the interactive Joyride steps for new or returning users.
          */}
                    <button className="start-tutorial-btn" onClick={handleStartTutorial}>
                        Start Tutorial
                    </button>
                </div>
                <div className="month-select-container">
                    <label htmlFor="month-select" className="month-select-label">
                        Select Month:
                    </label>
                    <input
                        type="month"
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </header>

            {/* QUICK OVERVIEW SECTION */}
            <section className="overview-section">
                <h2>Quick Overview</h2>

                {/* Alert if user is close to or has exceeded their budget */}
                {totalBudget > 0 && remainingBudget < totalBudget * 0.4 && (
                    <div
                        className={`alert-warning ${
                            remainingBudget < totalBudget * 0.2 ? "critical" : "moderate"
                        }`}
                    >
                        {remainingBudget < totalBudget * 0.2 ? "🚨" : "⚠️"}
                        <strong> Budget Alert: </strong>
                        You have used <strong>{((totalExpenses / totalBudget) * 100).toFixed(1)}%</strong> of your budget!
                        <br />
                        {remainingBudget > 0
                            ? `Only ${getCurrencySymbol(currency)}${remainingBudget.toFixed(2)} remains for the month.`
                            : `You have exceeded your budget by ${getCurrencySymbol(currency)}${Math.abs(remainingBudget).toFixed(2)}!`}
                        <br />
                        {remainingBudget < 0
                            ? "Consider reducing expenses or adjusting your budget!"
                            : "Plan your expenses wisely for the rest of the month."}
                    </div>
                )}

                <div className="overview-cards">
                    <div className="overview-card">
                        <h3>Total Budget</h3>
                        <p>
                            {getCurrencySymbol(currency)}
                            {totalBudget.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                    <div className="overview-card">
                        <h3>Total Expenses</h3>
                        <p>
                            {getCurrencySymbol(currency)}
                            {totalExpenses.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                    <div className="overview-card">
                        <h3>Remaining</h3>
                        <p>
                            {getCurrencySymbol(currency)}
                            {remainingBudget.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>

                {/* Circular progress bar for budget usage */}
                <div className="budget-usage-container">
                    <h4 className="budget-progress-title">Budget Usage</h4>
                    <div className="budget-progress">
                        <CircularProgressbar
                            value={totalUsagePercentage}
                            text={`${Math.round(totalUsagePercentage)}%`}
                            styles={buildStyles({
                                textColor: "#333",
                                pathColor: "#4a90e2",
                                trailColor: "#d6d6d6",
                            })}
                        />
                    </div>
                    <p className="budget-progress-desc">
                        Percentage of your total budget spent
                    </p>
                </div>
            </section>

            {/* MONTHLY INCOME SECTION */}
            <section className="income-section" id="income-section">
                <h2>Set Your Monthly Income</h2>
                {selectedMonth === currentMonth && editMode ? (
                    <div>
                        <input
                            type="text"
                            placeholder="Enter your income"
                            value={
                                incomeInput === ""
                                    ? ""
                                    : new Intl.NumberFormat().format(Number(incomeInput))
                            }
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/,/g, "");
                                if (rawValue === "" || /^[0-9]+$/.test(rawValue)) {
                                    setIncomeInput(rawValue);
                                }
                            }}
                            className="income-input"
                        />
                        <div className="income-buttons">
                            <button onClick={addOrUpdateMonthlyIncome}>Save Income</button>
                            <button onClick={toggleEditMode} className="cancel-button">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p>
                            Income for {formatMonthYear(selectedMonth)}:{" "}
                            <strong>
                                {getCurrencySymbol(currency)}
                                {monthlyIncome || 0}
                            </strong>
                        </p>
                        {selectedMonth === currentMonth && (
                            <button className="edit-income-button" onClick={toggleEditMode}>
                                Edit Income
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* SAVINGS TREE SECTION */}
            <section className="savings-tree-container">
                <h4>Your Savings Tree</h4>
                <div className="savings-tree-emoji">{getSavingsTreeEmoji()}</div>
                <p className="savings-tree-desc">
                    Your Savings Tree shows your current savings status. A lush tree (🌳)
                    means you're saving excellently; a healthy evergreen (🌲) indicates good
                    savings; a seedling (🌱) represents low savings; and a cactus (🌵)
                    signifies very low savings.
                </p>
            </section>

            {/* GOALS SECTION */}
            <div className="goals-section">
                <h2>Upcoming Goals</h2>
                {dueSoonGoals > 0 && (
                    <div className="goal-alert">
                        ⚠️ {dueSoonGoals} goal(s) are due within the next 7 days!
                    </div>
                )}
                {upcomingGoals.length > 0 ? (
                    upcomingGoals.map((goal, index) => (
                        <div className="goal-cardd" key={index}>
                            <div className="goal-card-icon">🎯</div>
                            <div className="goal-card-details">
                                <Link
                                    to={`/goals?goalName=${encodeURIComponent(goal.goal)}`}
                                    className="goal-card-link"
                                >
                                    <p>
                                        <strong>Goal:</strong> {goal.goal}
                                    </p>
                                    <p>
                                        <strong>Deadline:</strong>{" "}
                                        {new Date(goal.deadline).toLocaleDateString()}
                                    </p>
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-data-message">No upcoming goals found.</p>
                )}
            </div>

            {/* RECENT ACTIVITIES SECTION */}
            <div className="activities-section">
                <h2>Recent Expenses</h2>
                {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                        <Link to="/expenses" className="activity-card-link" key={index}>
                            <div className="activity-card">
                                <div className="activity-card-icon">📒</div>
                                <div className="activity-card-details">
                                    <p>
                                        <strong>Category:</strong> {activity.category}
                                    </p>
                                    <p>
                                        <strong>Amount:</strong> {getCurrencySymbol(currency)}
                                        {activity.amount}
                                    </p>
                                    <p>
                                        <strong>Date:</strong>{" "}
                                        {new Date(activity.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="no-data-message">No recent activities recorded.</p>
                )}
            </div>

            {/* QUICK LINKS SECTION */}
            <div className="quick-links">
                <h2>Quick Links</h2>
                <div className="quick-links-container">
                    <Link to="/expenses">
                        <button className="quick-link-btn">Add New Expense</button>
                    </Link>
                    <Link to="/budgets">
                        <button className="quick-link-btn">Create New Budget</button>
                    </Link>
                    <Link to="/goals">
                        <button className="quick-link-btn">Create New Goal</button>
                    </Link>
                    <Link to="/analytics">
                        <button className="quick-link-btn">View Analytics</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
