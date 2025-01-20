import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./navbar";
import "./expenses.css";


const ExpenseTracker = () => {
    // Load categories from localStorage or set default categories
    const [categories, setCategories] = useState(() => {
        const storedCategories = localStorage.getItem("categories");
        return storedCategories
            ? JSON.parse(storedCategories)
            : ["Groceries", "Shopping", "Transportation", "Other"];
    });
    const [budgets, setBudgets] = useState([]);
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");
    const [expenses, setExpenses] = useState([]);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [currentExpense, setCurrentExpense] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [selectedFilterCategory, setSelectedFilterCategory] = useState(""); //
    const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [editCategoriesMode, setEditCategoriesMode] = useState(false);
    const [editedCategory, setEditedCategory] = useState("");
    const [isEditCategoriesCollapsed, setIsEditCategoriesCollapsed] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [warning, setWarning] = useState(null)

    useEffect(() => {
        fetchExpenses();
        fetchBudgets();
    }, [currentMonth]);

    // Save categories to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("categories", JSON.stringify(categories));
    }, [categories]);

    const fetchBudgets = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/budgets");
            setBudgets(response.data); // Set all budgets without filtering
        } catch (error) {
            console.error("Error fetching budgets:", error);
        }
    };
    const fetchExpenses = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/expenses");
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
            setError("Error fetching expenses. Please try again later.");
        }
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

    const filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
            expenseDate.getMonth() === currentMonth.getMonth() &&
            expenseDate.getFullYear() === currentMonth.getFullYear() &&
            (selectedFilterCategory === "" || expense.category === selectedFilterCategory) // Filter by category
        );
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
    };
    const calculateTotalExpensesByCategory = () => {
        const totals = {};
        filteredExpenses.forEach((expense) => {
            if (!totals[expense.category]) totals[expense.category] = 0;
            totals[expense.category] += parseFloat(expense.amount);
        });
        return totals;
    };

    const addExpense = async () => {
        const finalCategory = category === "Other" ? customCategory : category;

        if (!finalCategory || !amount || !date) {
            setError("Please fill in all fields.");
            return;
        }

        const today = new Date();
        const selectedDate = new Date(date);

        if (
            selectedDate < new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()) ||
            selectedDate > new Date(today.getTime() + 24 * 60 * 60 * 1000)
        ) {
            setError("Date must be within the last 5 years and no more than one day ahead.");
            return;
        }

        const totalExpenses = calculateTotalExpensesByCategory();
        const budgetForCategory = budgets.find((b) => b.category === finalCategory);
        const newTotal = (totalExpenses[finalCategory] || 0) + parseFloat(amount);

        if (budgetForCategory) {
            const threshold = budgetForCategory.amount * 0.8;

            if (newTotal > threshold && newTotal <= budgetForCategory.amount) {
                setWarning(
                    `Warning: You have reached 80% of your budget (£${budgetForCategory.amount}) for "${finalCategory}".`
                );

                // Auto-dismiss warning after 7 seconds
                setTimeout(() => setWarning(null), 7000);
            }

            if (newTotal > budgetForCategory.amount) {
                const proceed = window.confirm(
                    `Warning: Adding this expense will exceed the budget (£${budgetForCategory.amount}) for "${finalCategory}". Do you wish to proceed?`
                );

                if (!proceed) {
                    return; // Exit if the user does not confirm
                }
            }
        }

        try {
            await axios.post("http://localhost:8080/api/expenses", {
                category: finalCategory,
                amount: parseFloat(amount),
                date,
            });

            // Add the custom category to the dropdown if it doesn't exist
            if (category === "Other" && !categories.includes(customCategory)) {
                setCategories((prevCategories) => [...prevCategories, customCategory]);
            }

            fetchExpenses(); // Refresh expenses
            resetForm(); // Reset form fields
        } catch (error) {
            console.error("Error adding expense:", error);
            setError("Error adding expense. Please try again.");
        }
    };







    const deleteExpense = async (expenseId) => {
        try {
            const response = await axios.delete(
                `http://localhost:8080/api/expenses/${expenseId}`
            );
            if (response.status === 200) {
                setExpenses(expenses.filter((expense) => expense.id !== expenseId));
            } else {
                setError("Error deleting expense. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            setError("Error deleting expense. Please try again later.");
        }
    };

    const startEditing = (expense) => {
        setEditMode(true);
        setCurrentExpense(expense);
        setCategory(categories.includes(expense.category) ? expense.category : "Other");
        setCustomCategory(
            !categories.includes(expense.category) ? expense.category : ""
        );
        setAmount(expense.amount);
        setDate(expense.date);
    };
    const editExpense = async () => {
        const finalCategory = category === "Other" ? customCategory : category;

        if (!finalCategory || !amount || !date) {
            setError("Please fill in all fields.");
            return;
        }

        const today = new Date();
        const selectedDate = new Date(date);

        if (
            selectedDate < new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()) ||
            selectedDate > new Date(today.getTime() + 24 * 60 * 60 * 1000)
        ) {
            setError("Date must be within the last 5 years and no more than one day ahead.");
            return;
        }

        // Get total expenses for this category in the current month
        const totalExpenses = calculateTotalExpensesByCategory();
        const budgetForCategory = budgets.find((b) => b.category === finalCategory);
        const newTotal =
            (totalExpenses[finalCategory] || 0) - parseFloat(currentExpense.amount) + parseFloat(amount);

        // Check for 80% budget usage
        if (budgetForCategory) {
            const threshold = budgetForCategory.amount * 0.8;

            if (newTotal > threshold && newTotal <= budgetForCategory.amount) {
                setWarning(
                    `Reminder: You have reached 80% of the budget (£${budgetForCategory.amount}) for "${finalCategory}".`
                );
            }

            // Check for exceeding budget
            if (newTotal > budgetForCategory.amount) {
                setWarning(
                    `Warning: Editing this expense will exceed the budget of £${budgetForCategory.amount} for the "${finalCategory}" category.`
                );

                const proceed = window.confirm(
                    `You are about to exceed the budget for "${finalCategory}". Do you want to proceed?`
                );

                if (!proceed) {
                    return; // Exit if the user does not want to exceed the budget
                }
            }
        }

        try {
            await axios.put(`http://localhost:8080/api/expenses/${currentExpense.id}`, {
                id: currentExpense.id,
                category: finalCategory,
                amount,
                date,
            });

            fetchExpenses();
            resetForm();
        } catch (error) {
            console.error("Error editing expense:", error);
            setError("Error editing expense. Please try again.");
        }
    };





    const resetForm = () => {
        setEditMode(false);
        setCurrentExpense(null);
        setCategory("");
        setCustomCategory("");
        setAmount("");
        setDate("");
        setError(null);
        setWarning(null);
    };

    const handleSearch = () => {
        return expenses.filter(
            (expense) =>
                (expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    expense.amount.toString().includes(searchQuery)) &&
                (!dateRange.startDate || new Date(expense.date) >= new Date(dateRange.startDate)) &&
                (!dateRange.endDate || new Date(expense.date) <= new Date(dateRange.endDate))
        );
    };

    const expensesToShow = showAll ? handleSearch() : handleSearch().slice(0, 5);

    const handleEditCategory = (index) => {
        const updatedCategories = [...categories];
        if (editedCategory && !categories.includes(editedCategory)) {
            updatedCategories[index] = editedCategory;
            setCategories(updatedCategories);
            setEditedCategory("");
        } else {
            setError("Category name must be unique and non-empty.");
        }
    };

    const handleDeleteCategory = (index) => {
        const updatedCategories = categories.filter((_, i) => i !== index);
        setCategories(updatedCategories);
    };

    const toggleEditCategoriesCollapse = () => {
        setIsEditCategoriesCollapsed(!isEditCategoriesCollapsed);
    };
    const toggleShowAllCategories = () => {
        setShowAllCategories(!showAllCategories);
    };



    return (
        <div className="budget-tracker-container">
            <Navbar/>
            <h2 className="intro-title">Expense Tracker</h2>
            <p className="intro-text">Track and manage your expenses effectively.</p>

            <div className="expense-form">
                <label className="form-label">
                    Select a Category:
                    <small className="form-description"> Choose the appropriate category for your expense.</small>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-input"
                    >
                        <option value="">Select a category</option>
                        {categories
                            .filter((cat) => cat !== "Other")
                            .map((cat, index) => (
                                <option key={index} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        <option value="Other">Other</option>
                    </select>
                </label>

                {category === "Other" && (
                    <label className="form-label">
                        Custom Category:
                        <small className="form-description"> Define a new category if none of the existing ones
                            apply.</small>
                        <input
                            type="text"
                            placeholder="e.g., Entertainment"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="form-input"
                        />
                    </label>
                )}

                <label className="form-label">
                    Amount:
                    <small className="form-description"> Specify the amount spent for this expense.</small>
                    <input
                        type="number"
                        placeholder="e.g., 50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="form-input"
                    />
                </label>

                <label className="form-label">
                    Date:
                    <small className="form-description"> Enter the date the expense occurred (within the last 5
                        years).</small>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0].replace(/\d{4}/, (year) => year - 5)}
                        max={new Date(new Date().setDate(new Date().getDate() + 1))
                            .toISOString()
                            .split("T")[0]}
                        className="form-input"
                    />
                </label>
                {warning && <p className="warning-text" style={{color: "orange", fontWeight: "bold"}}>{warning}</p>}


                {editMode ? (
                    <>
                        <button onClick={editExpense} className="form-button">
                            Save Changes
                        </button>
                        <button onClick={resetForm} className="form-button cancel">
                            Cancel
                        </button>
                    </>
                ) : (
                    <button onClick={addExpense} className="form-button">
                        Add Expense
                    </button>
                )}
            </div>

            {error && <p className="error-text">{error}</p>}


            <div className="category-filter">
                <label className="form-label">
                    Filter by Category:
                    <select
                        value={selectedFilterCategory}
                        onChange={(e) => setSelectedFilterCategory(e.target.value)}
                        className="form-input"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat, index) => (
                            <option key={index} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="edit-categories">
                <h3 className="edit-categories-title">Edit Categories</h3>
                <div className="edit-categories-container">
                    {categories.length > 0 ? (
                        (showAll
                                ? categories
                                : categories.slice(0, 3)
                        ).map((cat, index) => (
                            <div key={index} className="category-item">
                                <input
                                    type="text"
                                    defaultValue={cat}
                                    onChange={(e) => setEditedCategory(e.target.value)}
                                    className="category-input"
                                />
                                <button
                                    onClick={() => handleEditCategory(index)}
                                    className="save-category-button"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(index)}
                                    className="delete-category-button"
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="no-categories-message">No categories to edit.</p>
                    )}
                </div>
                {categories.length > 3 && (
                    <button
                        className="toggle-show-button"
                        onClick={() => setShowAll((prevShowAll) => !prevShowAll)}
                    >
                        {showAll ? "Show Less" : "Show All"}
                    </button>
                )}
            </div>
            <div className="month-navigation">
                <button onClick={() => handleMonthChange("prev")} className="month-button small">
                    &lt; Prev
                </button>
                <span className="month-display">
        {currentMonth.toLocaleString("default", {month: "long"})} {currentMonth.getFullYear()}
    </span>
                <button onClick={() => handleMonthChange("next")} className="month-button small">
                    Next &gt;
                </button>
            </div>


            {filteredExpenses.length > 0 ? (
                <div className="expenses-list">
                    {filteredExpenses.map((expense) => (
                        <div key={expense.id} className="expense-card">
                            <div className="expense-card-content">
                                <p>
                                    <strong>Category:</strong> {expense.category}
                                </p>
                                <p>
                                    <strong>Amount:</strong> £{expense.amount}
                                </p>
                                <p>
                                    <strong>Date:</strong> {formatDate(expense.date)}
                                </p>
                            </div>
                            <div className="expense-buttons">
                                <button onClick={() => startEditing(expense)} className="edit-button">
                                    Edit
                                </button>
                                <button onClick={() => deleteExpense(expense.id)} className="delete-button">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-expenses-text">
                    No expenses recorded for {currentMonth.toLocaleString("default", {month: "long"})}.
                </p>
            )}
        </div>
    );
};

export default ExpenseTracker;
