import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./navbar";
import "./budgets.css";

const BudgetTracker = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [budgetAmount, setBudgetAmount] = useState("");
    const [budgetMonth, setBudgetMonth] = useState(() =>
        new Date().toISOString().slice(0, 7)
    ); // Initialize to the current month
    const [budgets, setBudgets] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [error, setError] = useState("");
    const [editingBudgetId, setEditingBudgetId] = useState(null);
    const [editCategory, setEditCategory] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [monthlyIncome, setMonthlyIncome] = useState(0); // User's monthly income
    const [totalAllocatedBudget, setTotalAllocatedBudget] = useState(0);


    useEffect(() => {
        fetchCategories();
        fetchBudgets();
        fetchMonthlyIncome();
    }, [currentMonth]);
    const fetchMonthlyIncome = () => {
        const incomes = JSON.parse(localStorage.getItem("storedIncomes")) || {};
        const monthKey = currentMonth.toISOString().slice(0, 7);
        setMonthlyIncome(incomes[monthKey] || 0);
    };
    const fetchCategories = async () => {
        try {
            const storedCategories = localStorage.getItem("categories");
            if (storedCategories) {
                setCategories(JSON.parse(storedCategories));
            } else {
                setCategories(["Groceries", "Utilities", "Entertainment", "Other"]);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchBudgets = async () => {
        try {

            const monthString = currentMonth.toISOString().slice(0, 7); // Format: YYYY-MM
            const response = await axios.get(
                `http://localhost:8080/api/budgets?month=${monthString}`
            );
            const currentBudgets = response.data;
            setBudgets(currentBudgets);

            // Calculate total allocated budget
            const total = currentBudgets.reduce((acc, budget) => acc + budget.amount, 0);
            setTotalAllocatedBudget(total);
        } catch (error) {
            console.error("Error fetching budgets:", error);
        }
    };

    const addBudget = async () => {
        const today = new Date();
        const selectedDate = new Date(`${budgetMonth}-01`);

        if (selectedDate < new Date(today.getFullYear(), today.getMonth(), 1)) {
            setError("You cannot set budgets for past months.");
            return;
        }

        if (!selectedCategory || !budgetAmount || !budgetMonth) {
            setError("Please fill in all fields.");
            return;
        }

        // Check if a budget already exists for the selected category and month
        const existingBudget = budgets.find(
            (b) => b.category === selectedCategory && b.month === budgetMonth
        );
        if (existingBudget) {
            setError(
                `A budget for the "${selectedCategory}" category already exists for ${new Date(
                    budgetMonth
                ).toLocaleString("default", { month: "long", year: "numeric" })}.`
            );
            return;
        }

        const remainingIncome = monthlyIncome - totalAllocatedBudget;
        if (parseFloat(budgetAmount) > remainingIncome) {
            setError(
                `You cannot allocate more than the remaining income of £${remainingIncome.toFixed(
                    2
                )}.`
            );
            return;
        }

        try {
            const newBudget = {
                category: selectedCategory,
                amount: parseFloat(budgetAmount),
                month: budgetMonth,
            };

            const response = await axios.post("http://localhost:8080/api/budgets", newBudget);
            if (response.status === 200) {
                fetchBudgets(); // Fetch updated budgets
                resetForm();
            }
        } catch (error) {
            console.error("Error adding budget:", error);
        }
    };

    const saveEditedBudget = async () => {
        if (!budgetMonth) {
            setError("The month cannot be null. Please select a valid month.");
            return;
        }

        const currentBudget = budgets.find((b) => b.id === editingBudgetId);
        const remainingIncome =
            monthlyIncome - totalAllocatedBudget + (currentBudget ? currentBudget.amount : 0);

        if (parseFloat(editAmount) > remainingIncome) {
            setError(
                `You cannot allocate more than the remaining income of £${remainingIncome.toFixed(
                    2
                )}.`
            );
            return;
        }

        // Check if the updated category already has a budget for the same month (exclude the current budget being edited)
        const duplicateBudget = budgets.find(
            (b) =>
                b.category === editCategory &&
                b.month === budgetMonth &&
                b.id !== editingBudgetId
        );
        if (duplicateBudget) {
            setError(
                `A budget for the "${editCategory}" category already exists for ${new Date(
                    budgetMonth
                ).toLocaleString("default", { month: "long", year: "numeric" })}.`
            );
            return;
        }

        try {
            const updatedBudget = {
                category: editCategory,
                amount: parseFloat(editAmount),
                month: budgetMonth,
            };

            const response = await axios.put(
                `http://localhost:8080/api/budgets/${editingBudgetId}`,
                updatedBudget
            );

            if (response.status === 200) {
                fetchBudgets();
                cancelEditing();
            }
        } catch (error) {
            console.error("Error saving edited budget:", error);
        }
    };



    const startEditingBudget = (budget) => {
        setEditingBudgetId(budget.id);
        setEditCategory(budget.category);
        setEditAmount(budget.amount);
        setBudgetMonth(budget.month || new Date().toISOString().slice(0, 7));
    };



    const cancelEditing = () => {
        setEditingBudgetId(null);
        setEditCategory("");
        setEditAmount("");
        setBudgetMonth(currentMonth.toISOString().slice(0, 7));
    };



    const deleteBudget = async (id) => {
        try {
            const response = await axios.delete(`http://localhost:8080/api/budgets/${id}`);
            if (response.status === 200) {
                fetchBudgets(); // Fetch the updated list of budgets
            } else {
                console.error("Failed to delete the budget.");
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
        }
    };

    const resetForm = () => {
        setSelectedCategory("");
        setBudgetAmount("");
        setBudgetMonth(currentMonth.toISOString().slice(0, 7));
        setError("");
    };

    const handleMonthChange = (direction) => {
        const newMonth = new Date(currentMonth);

        if (direction === "prev") {
            newMonth.setMonth(currentMonth.getMonth() - 1);
        } else if (direction === "next") {
            newMonth.setMonth(currentMonth.getMonth() + 1);
        }

        setCurrentMonth(newMonth);
    };

    return (
        <div className="budget-tracker-container">
            <Navbar/>
            <h2 className="budget-tracker-title">Budget Tracker</h2>
            <p className="budget-tracker-description">Plan and manage your budgets effectively for each category.</p>

            {/* Budget Form */}
            <div className="budget-tracker-form">
                <label>
                    Select a Category:
                    <small className="budget-tracker-form-description"> Choose a category to set a budget.</small>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="budget-tracker-input"
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat, index) => (
                            <option key={index} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Budget Amount (£):
                    <small className="budget-tracker-form-description"> Enter the budget amount for this
                        category.</small>
                    <input
                        type="number"
                        placeholder="e.g., 500"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        className="budget-tracker-input"
                    />
                </label>

                <label>
                    Month:
                    <small className="budget-tracker-form-description"> Specify the month for this budget.</small>
                    <input
                        type="month"
                        value={budgetMonth}
                        onChange={(e) => setBudgetMonth(e.target.value)}
                        className="budget-tracker-input"
                        min={new Date().toISOString().slice(0, 7)}
                    />
                </label>

                <button onClick={addBudget} className="budget-tracker-button">
                    Add Budget
                </button>
                {error && <p className="budget-tracker-error">{error}</p>}
            </div>

            {/* Month Navigation */}
            <div className="budget-tracker-navigation">
                <button onClick={() => handleMonthChange("prev")} className="budget-tracker-nav-button">
                    &lt; Prev
                </button>
                <span className="budget-tracker-current-month">
            {currentMonth.toLocaleString("default", {month: "long", year: "numeric"})}
        </span>
                <button onClick={() => handleMonthChange("next")} className="budget-tracker-nav-button">
                    Next &gt;
                </button>
            </div>

            {/* Budget List */}
            <div className="budget-tracker-list">
                {budgets
                    .filter(
                        (budget) =>
                            new Date(budget.month).getMonth() === currentMonth.getMonth() &&
                            new Date(budget.month).getFullYear() === currentMonth.getFullYear()
                    )
                    .map((budget) => (
                        <div key={budget.id} className="budget-tracker-card">
                            {editingBudgetId === budget.id ? (
                                <div className="budget-tracker-edit-form">
                                    <input
                                        type="text"
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                        className="budget-tracker-input"
                                        placeholder="Edit category"
                                    />
                                    <input
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className="budget-tracker-input"
                                        placeholder="Edit amount"
                                    />
                                    <button onClick={saveEditedBudget} className="budget-tracker-save-button">
                                        Save
                                    </button>
                                    <button onClick={cancelEditing} className="budget-tracker-cancel-button">
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p><strong>Category:</strong> {budget.category}</p>
                                    <p><strong>Budget:</strong> £{budget.amount}</p>
                                    <p><strong>Month:</strong> {new Date(budget.month).toLocaleString("default", {
                                        month: "long",
                                        year: "numeric",
                                    })}</p>
                                    <div className="budget-tracker-card-buttons">
                                        <button onClick={() => startEditingBudget(budget)}
                                                className="budget-tracker-edit-button">
                                            Edit
                                        </button>
                                        <button onClick={() => deleteBudget(budget.id)}
                                                className="budget-tracker-delete-button">
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                {budgets.filter(
                    (budget) =>
                        new Date(budget.month).getMonth() === currentMonth.getMonth() &&
                        new Date(budget.month).getFullYear() === currentMonth.getFullYear()
                ).length === 0 && <p>No budgets set for this month.</p>}
            </div>
        </div>
    );
};

export default BudgetTracker;
