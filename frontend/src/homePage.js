import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./navbar";
import "./homepage.css";

const HomePage = ({ onIncomeUpdate }) => {
    const [totalBudget, setTotalBudget] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [remainingBudget, setRemainingBudget] = useState(0);
    const [recentActivities, setRecentActivities] = useState([]);
    const [upcomingGoals, setUpcomingGoals] = useState([]);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [storedIncomes, setStoredIncomes] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const currentMonth = new Date().toISOString().slice(0, 7);

    useEffect(() => {
        fetchOverview();
        fetchUpcomingGoals();
        loadStoredIncome();
    }, [selectedMonth]);

    const fetchOverview = async () => {
        try {
            const budgetsResponse = await axios.get("http://localhost:8080/api/budgets");
            const expensesResponse = await axios.get("http://localhost:8080/api/expenses");

            const budgets = budgetsResponse.data.filter(budget =>
                budget.month.startsWith(selectedMonth)
            );
            const expenses = expensesResponse.data.filter(expense =>
                expense.date.startsWith(selectedMonth)
            );

            const totalBudgetAmount = budgets.reduce((acc, budget) => acc + budget.amount, 0);
            const totalExpenseAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);

            setTotalBudget(totalBudgetAmount);
            setTotalExpenses(totalExpenseAmount);
            setRemainingBudget(totalBudgetAmount - totalExpenseAmount);
            setRecentActivities([...expenses.slice(-3)]);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchUpcomingGoals = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/goals");
            setUpcomingGoals(response.data.filter(goal => new Date(goal.deadline) > new Date()));
        } catch (error) {
            console.error("Error fetching goals:", error);
        }
    };

    const loadStoredIncome = () => {
        const incomes = JSON.parse(localStorage.getItem("storedIncomes")) || {};
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthKey = lastMonth.toISOString().slice(0, 7);

        if (!incomes[currentMonth] && incomes[lastMonthKey]) {
            incomes[currentMonth] = incomes[lastMonthKey];
            localStorage.setItem("storedIncomes", JSON.stringify(incomes));
        }

        setStoredIncomes(incomes);
        setMonthlyIncome(incomes[selectedMonth] || 0);
    };

    const addOrUpdateMonthlyIncome = () => {
        if (monthlyIncome <= 0) {
            alert("Income must be greater than zero.");
            return;
        }

        const incomes = { ...storedIncomes, [currentMonth]: Number(monthlyIncome) };
        setStoredIncomes(incomes);
        localStorage.setItem("storedIncomes", JSON.stringify(incomes));
        setEditMode(false);
        setSelectedMonth(currentMonth);
        onIncomeUpdate(Number(monthlyIncome)); // Pass income to parent or other components
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    const formatMonthYear = (isoString) => {
        const date = new Date(isoString + "-01");
        return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
    };

    return (
        <div className="homepage">
            <Navbar/>
            <header className="homepage-header">
                <h1>Welcome to Your Budget Tracker!</h1>
                <p>Track, plan, and optimize your finances effectively!</p>
            </header>

            <section className="overview-section">
                <h2>Quick Overview</h2>
                <div className="overview-controls">
                    <label htmlFor="month-select">Select Month: </label>
                    <input
                        type="month"
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
                <div className="overview-cards">
                    <div className="overview-card">
                        <h3>Total Budget</h3>
                        <p>£{totalBudget}</p>
                    </div>
                    <div className="overview-card">
                        <h3>Total Expenses</h3>
                        <p>£{totalExpenses}</p>
                    </div>
                    <div className="overview-card">
                        <h3>Remaining</h3>
                        <p>£{remainingBudget}</p>
                    </div>
                </div>
            </section>

            <section className="income-section">
                <h2>Set Your Monthly Income</h2>
                {selectedMonth === currentMonth && editMode ? (
                    <div>
                        <input
                            type="number"
                            placeholder="Enter your income"
                            value={monthlyIncome}
                            onChange={(e) => setMonthlyIncome(e.target.value)}
                        />
                        <button onClick={addOrUpdateMonthlyIncome}>Save Income</button>
                        <button onClick={toggleEditMode}>Cancel</button>
                    </div>
                ) : (
                    <div>
                        <p>
                            Income for {formatMonthYear(selectedMonth)}:{" "}
                            <strong>£{storedIncomes[selectedMonth] || 0}</strong>
                        </p>
                        {selectedMonth === currentMonth && (
                            <button onClick={toggleEditMode}>Edit Income</button>
                        )}
                    </div>
                )}
            </section>

            <div className="goals-section">
                <h2>Upcoming Goals</h2>
                {upcomingGoals.length > 0 ? (
                    upcomingGoals.map((goal, index) => (
                        <div className="goal-card" key={index}>
                            <div className="goal-card-icon">🎯</div>
                            <div className="goal-card-details">
                                <p><strong>Goal:</strong> {goal.name}</p>
                                <p><strong>Deadline:</strong> {new Date(goal.deadline).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-data-message">No upcoming goals found.</p>
                )}
            </div>

            <div className="activities-section">
                <h2>Recent Expenses</h2>
                {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                        <div className="activity-card" key={index}>
                            <div className="activity-card-icon">📒</div>
                            <div className="activity-card-details">
                                <p><strong>Category:</strong> {activity.category}</p>
                                <p><strong>Amount:</strong> £{activity.amount}</p>
                                <p><strong>Date:</strong> {new Date(activity.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-data-message">No recent activities recorded.</p>
                )}
            </div>
            <div className="quick-links">
                <h2>Quick Links</h2>
                <div className="quick-links-container">
                    <a href="/expenses">
                        <button className="quick-link-btn">Add New Expense</button>
                    </a>
                    <a href="/budgets">
                        <button className="quick-link-btn">Create New Budget</button>
                    </a>
                    <a href="/goals">
                        <button className="quick-link-btn">Create New Goal</button>
                    </a>
                    <a href="/analytics">
                        <button className="quick-link-btn">View Analytics</button>
                    </a>
                </div>
            </div>

        </div>
    );
};

export default HomePage;
