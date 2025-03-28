import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { auth } from "./fireBase"; // or your Firebase config
import "./RecurringExpenseManager.css"; // The updated CSS

function RecurringExpenseManager() {
    // --------------------
    //  State: Form fields
    // --------------------
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("monthly");
    const [billingDay, setBillingDay] = useState(15);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [active, setActive] = useState(true);

    // --------------------
    //   State: Data
    // --------------------
    const [categories, setCategories] = useState([]);
    const [recurringExpenses, setRecurringExpenses] = useState([]);

    // Loading states
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

    // Show only 5 expenses by default
    const [showAll, setShowAll] = useState(false);

    // Editing states
    const [editingId, setEditingId] = useState(null);
    const [editFields, setEditFields] = useState({
        description: "",
        category: "",
        customCategory: "",
        amount: "",
        frequency: "monthly",
        billingDay: 15,
        startDate: "",
        endDate: "",
        active: true,
    });

    useEffect(() => {
        fetchCategories();
        fetchRecurringExpenses();
    }, []);

    // ----------------------
    //    Fetch Categories
    // ----------------------
    const fetchCategories = async () => {
        setIsLoadingCategories(true);
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const response = await axios.get(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200 && Array.isArray(response.data)) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            Swal.fire("Error", "Failed to fetch categories.", "error");
        } finally {
            setIsLoadingCategories(false);
        }
    };

    // ----------------------
    //  Fetch Expenses
    // ----------------------
    const fetchRecurringExpenses = async () => {
        setIsLoadingExpenses(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire("Error", "No user is logged in.", "error");
                setIsLoadingExpenses(false);
                return;
            }
            const token = await user.getIdToken();
            const response = await axios.get(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/recurring-expenses",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                setRecurringExpenses(response.data);
            } else {
                Swal.fire("Error", "Failed to fetch recurring expenses.", "error");
            }
        } catch (error) {
            console.error("Error fetching recurring expenses:", error);
            Swal.fire("Error", "Failed to fetch recurring expenses.", "error");
        } finally {
            setIsLoadingExpenses(false);
        }
    };

    // ----------------------
    //  Delete All
    // ----------------------
    const deleteAllRecurringExpenses = async () => {
        const confirmDelete = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete all your recurring expenses.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete all",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d9534f",
            cancelButtonColor: "#6c757d",
        });

        if (!confirmDelete.isConfirmed) return;

        try {
            const token = await auth.currentUser.getIdToken();
            await axios.delete(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/recurring-expenses/delete-all",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Swal.fire("Deleted!", "All your recurring expenses have been removed.", "success");
            fetchRecurringExpenses();
        } catch (error) {
            console.error("Error deleting recurring expenses:", error);
            Swal.fire("Error", "Failed to delete recurring expenses. Please try again.", "error");
        }
    };

    // ----------------------
    //  Add New (Submit)
    // ----------------------
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        // Basic validation
        if (!description.trim()) {
            Swal.fire("Validation Error", "Please enter a description.", "error");
            return;
        }
        if (!category.trim()) {
            Swal.fire("Validation Error", "Please select or enter a category.", "error");
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            Swal.fire("Validation Error", "Amount must be greater than 0.", "error");
            return;
        }
        if (!frequency.trim()) {
            Swal.fire("Validation Error", "Please select a frequency.", "error");
            return;
        }
        if (billingDay < 1 || billingDay > 31) {
            Swal.fire("Validation Error", "Billing day must be between 1 and 31.", "error");
            return;
        }
        if (!startDate) {
            Swal.fire("Validation Error", "Please select a start date.", "error");
            return;
        }
        if (endDate && new Date(endDate) < new Date(startDate)) {
            Swal.fire("Validation Error", "End date cannot be before start date.", "error");
            return;
        }

        let finalCategory = category;
        if (category === "Other" && customCategory.trim()) {
            finalCategory = customCategory.trim();
        }

        const newRecurringExpense = {
            description: description.trim(),
            category: finalCategory,
            amount: parseFloat(amount),
            frequency,
            billingDay: parseInt(billingDay),
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            active,
        };

        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire("Error", "No user is logged in.", "error");
                return;
            }
            const token = await user.getIdToken();
            const response = await axios.post(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/recurring-expenses",
                newRecurringExpense,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                Swal.fire("Success", "Recurring expense added successfully!", "success");
                // Reset form
                setDescription("");
                setCategory("");
                setCustomCategory("");
                setAmount("");
                setFrequency("monthly");
                setBillingDay(15);
                setStartDate("");
                setEndDate("");
                setActive(true);

                // Refresh list
                fetchRecurringExpenses();
            }
        } catch (error) {
            console.error("Error adding recurring expense:", error);
            Swal.fire("Error", "Failed to add recurring expense.", "error");
        }
    };

    // ----------------------
    //  Toggle Active
    // ----------------------
    const handleToggleActive = async (expense) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire("Error", "No user is logged in.", "error");
                return;
            }
            const token = await user.getIdToken();
            const updatedExpense = { ...expense, active: !expense.active };
            const response = await axios.put(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/recurring-expenses/${expense.id}`,
                updatedExpense,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                Swal.fire("Success", "Recurring expense updated.", "success");
                fetchRecurringExpenses();
            }
        } catch (error) {
            console.error("Error updating recurring expense:", error);
            Swal.fire("Error", "Failed to update recurring expense.", "error");
        }
    };

    // ----------------------
    //   Delete One
    // ----------------------
    const handleDelete = async (expenseId) => {
        try {
            const confirmResult = await Swal.fire({
                title: "Are you sure?",
                text: "This will permanently delete the recurring expense.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
            });
            if (!confirmResult.isConfirmed) return;

            const user = auth.currentUser;
            if (!user) {
                Swal.fire("Error", "No user is logged in.", "error");
                return;
            }
            const token = await user.getIdToken();
            const response = await axios.delete(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/recurring-expenses/${expenseId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                Swal.fire("Success", "Recurring expense deleted.", "success");
                fetchRecurringExpenses();
            }
        } catch (error) {
            console.error("Error deleting recurring expense:", error);
            Swal.fire("Error", "Failed to delete recurring expense.", "error");
        }
    };

    // ----------------------
    //     Edit Mode
    // ----------------------
    const startEditing = (expense) => {
        setEditingId(expense.id);
        setEditFields({
            description: expense.description,
            category: expense.category,
            customCategory: "",
            amount: expense.amount,
            frequency: expense.frequency,
            billingDay: expense.billingDay,
            startDate: expense.startDate ? new Date(expense.startDate).toISOString().slice(0,10) : "",
            endDate: expense.endDate ? new Date(expense.endDate).toISOString().slice(0,10) : "",
            active: expense.active,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFields({
            description: "",
            category: "",
            customCategory: "",
            amount: "",
            frequency: "monthly",
            billingDay: 15,
            startDate: "",
            endDate: "",
            active: true,
        });
    };

    const handleSaveEdit = async (expenseId) => {
        // Basic validation
        if (!editFields.description.trim()) {
            Swal.fire("Validation Error", "Please enter a description.", "error");
            return;
        }
        if (!editFields.category.trim()) {
            Swal.fire("Validation Error", "Please select or enter a category.", "error");
            return;
        }
        if (!editFields.amount || parseFloat(editFields.amount) <= 0) {
            Swal.fire("Validation Error", "Amount must be greater than 0.", "error");
            return;
        }
        if (!editFields.frequency.trim()) {
            Swal.fire("Validation Error", "Please select a frequency.", "error");
            return;
        }
        if (editFields.billingDay < 1 || editFields.billingDay > 31) {
            Swal.fire("Validation Error", "Billing day must be between 1 and 31.", "error");
            return;
        }
        if (!editFields.startDate) {
            Swal.fire("Validation Error", "Please select a start date.", "error");
            return;
        }
        if (editFields.endDate && new Date(editFields.endDate) < new Date(editFields.startDate)) {
            Swal.fire("Validation Error", "End date cannot be before start date.", "error");
            return;
        }

        let finalCategory = editFields.category;
        if (editFields.category === "Other" && editFields.customCategory.trim()) {
            finalCategory = editFields.customCategory.trim();
        }

        const updatedExpense = {
            id: expenseId,
            description: editFields.description.trim(),
            category: finalCategory,
            amount: parseFloat(editFields.amount),
            frequency: editFields.frequency,
            billingDay: parseInt(editFields.billingDay),
            startDate: editFields.startDate ? new Date(editFields.startDate) : null,
            endDate: editFields.endDate ? new Date(editFields.endDate) : null,
            active: editFields.active,
        };

        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire("Error", "No user is logged in.", "error");
                return;
            }
            const token = await user.getIdToken();
            const response = await axios.put(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/recurring-expenses/${expenseId}`,
                updatedExpense,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                Swal.fire("Success", "Recurring expense updated!", "success");
                setEditingId(null);
                setEditFields({
                    description: "",
                    category: "",
                    customCategory: "",
                    amount: "",
                    frequency: "monthly",
                    billingDay: 15,
                    startDate: "",
                    endDate: "",
                    active: true,
                });
                fetchRecurringExpenses();
            }
        } catch (error) {
            console.error("Error saving edited expense:", error);
            Swal.fire("Error", "Failed to update recurring expense.", "error");
        }
    };

    // Only show first 5 by default
    const displayedExpenses = showAll
        ? recurringExpenses
        : recurringExpenses.slice(0, 5);

    return (
        <div className="recurring-manager-container">

            {/* ========== Form Section ========== */}
            <div className="recurring-form-container">
                <h2 className="recurring-form-title">Add Recurring Expense</h2>
                <p className="recurring-form-subtitle">
                    Create a recurring expense that automatically generates charges each cycle.
                </p>

                <form className="recurring-form" onSubmit={handleFormSubmit}>
                    {/* Description */}
                    <div className="recurring-form-group">
                        <label className="recurring-form-label">Description:</label>
                        <small className="recurring-form-description">
                            e.g., Netflix subscription
                        </small>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="recurring-form-input"
                            placeholder="e.g., Netflix subscription"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="recurring-form-group">
                        <label className="recurring-form-label">Category:</label>
                        <small className="recurring-form-description">
                            Choose a category (e.g., Entertainment).
                        </small>
                        {isLoadingCategories ? (
                            <p>Loading categories...</p>
                        ) : (
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="recurring-form-input"
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        )}
                    </div>

                    {/* If "Other", show custom category field */}
                    {category === "Other" && (
                        <div className="recurring-form-group">
                            <label className="recurring-form-label">Custom Category:</label>
                            <small className="recurring-form-description">
                                If none of the existing categories apply, create a new one here.
                            </small>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="recurring-form-input"
                                placeholder="e.g., Streaming"
                                required
                            />
                        </div>
                    )}

                    {/* Amount */}
                    <div className="recurring-form-group">
                        <label className="recurring-form-label">Amount:</label>
                        <small className="recurring-form-description">
                            The recurring cost (e.g., 15.99).
                        </small>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="recurring-form-input"
                            placeholder="e.g., 15.99"
                            required
                        />
                    </div>

                    {/* Frequency */}
                    <div className="recurring-form-group">
                        <label className="recurring-form-label">Frequency:</label>
                        <small className="recurring-form-description">
                            How often does it recur? (monthly, weekly, yearly)
                        </small>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="recurring-form-input"
                            required
                        >
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>

                    {/* Billing Day */}
                    <div className="recurring-form-group">
                        <label className="recurring-form-label">Billing Day:</label>
                        <small className="recurring-form-description">
                            The day of the month you’re billed (1–31).
                        </small>
                        <input
                            type="number"
                            value={billingDay}
                            onChange={(e) => setBillingDay(e.target.value)}
                            className="recurring-form-input"
                            placeholder="e.g., 15"
                            required
                        />
                    </div>

                    {/* Start Date */}
                    <div className="recurring-form-group">
                        <label className="recurring-form-label">Start Date:</label>
                        <small className="recurring-form-description">
                            The date this recurring expense first takes effect.
                        </small>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="recurring-form-input"
                            required
                        />
                    </div>

                    {/* End Date */}
                    <div className="recurring-form-group">
                        <label className="recurring-form-label">End Date (optional):</label>
                        <small className="recurring-form-description">
                            If it has a known end date, set it here. Otherwise, leave blank.
                        </small>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="recurring-form-input"
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="recurring-form-group switch-group">
                        <label className="recurring-form-label">Is Active?</label>
                        <small className="recurring-form-description">
                            Toggle to pause or resume future charges.
                        </small>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* Full-width Add Button */}
                    <button
                        type="submit"
                        className="recurring-form-button"
                        style={{ marginTop: "1rem", width: "100%" }}
                    >
                        Add Recurring Expense
                    </button>
                </form>

                {/* Full-width Delete All Button */}
                {recurringExpenses.length > 0 && (
                    <button
                        className="recurring-form-button delete-all-button"
                        onClick={deleteAllRecurringExpenses}
                        style={{ marginTop: "1rem", width: "100%" }}
                    >
                        Delete All Recurring Expenses
                    </button>
                )}
            </div>

            {/* ========== Card Grid Section ========== */}
            <div className="recurring-grid-container">
                <h2 className="recurring-list-title">Manage Recurring Expenses</h2>

                {isLoadingExpenses ? (
                    <p style={{ textAlign: "center" }}>Loading recurring expenses...</p>
                ) : recurringExpenses.length === 0 ? (
                    <p style={{ textAlign: "center" }}>No recurring expenses found.</p>
                ) : (
                    <div className="recurring-expense-grid">
                        {displayedExpenses.map((exp) => {
                            if (editingId === exp.id) {
                                // Edit Mode
                                return (
                                    <div className="recurring-expense-card editing" key={exp.id}>
                                        <div className="edit-card-header">
                                            <h3>Edit Recurring Expense</h3>
                                        </div>

                                        <div className="edit-form-grid">
                                            {/* Description */}
                                            <div className="edit-field">
                                                <label>Description</label>
                                                <input
                                                    type="text"
                                                    className="recurring-form-input"
                                                    value={editFields.description}
                                                    onChange={(e) =>
                                                        setEditFields({ ...editFields, description: e.target.value })
                                                    }
                                                />
                                            </div>

                                            {/* Category */}
                                            <div className="edit-field">
                                                <label>Category</label>
                                                <select
                                                    className="recurring-form-input"
                                                    value={editFields.category}
                                                    onChange={(e) =>
                                                        setEditFields({ ...editFields, category: e.target.value })
                                                    }
                                                >
                                                    <option value="">Select a category</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat} value={cat}>
                                                            {cat}
                                                        </option>
                                                    ))}
                                                    <option value="Other">Other</option>
                                                </select>
                                                {editFields.category === "Other" && (
                                                    <input
                                                        type="text"
                                                        className="recurring-form-input"
                                                        placeholder="Custom Category"
                                                        value={editFields.customCategory}
                                                        onChange={(e) =>
                                                            setEditFields({ ...editFields, customCategory: e.target.value })
                                                        }
                                                    />
                                                )}
                                            </div>

                                            {/* Amount */}
                                            <div className="edit-field">
                                                <label>Amount</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="recurring-form-input"
                                                    value={editFields.amount}
                                                    onChange={(e) =>
                                                        setEditFields({ ...editFields, amount: e.target.value })
                                                    }
                                                />
                                            </div>

                                            {/* Frequency */}
                                            <div className="edit-field">
                                                <label>Frequency</label>
                                                <select
                                                    className="recurring-form-input"
                                                    value={editFields.frequency}
                                                    onChange={(e) =>
                                                        setEditFields({ ...editFields, frequency: e.target.value })
                                                    }
                                                >
                                                    <option value="monthly">Monthly</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>

                                            {/* Billing Day */}
                                            <div className="edit-field">
                                                <label>Billing Day</label>
                                                <input
                                                    type="number"
                                                    className="recurring-form-input"
                                                    value={editFields.billingDay}
                                                    onChange={(e) =>
                                                        setEditFields({ ...editFields, billingDay: e.target.value })
                                                    }
                                                />
                                            </div>

                                            {/* Start Date */}
                                            <div className="edit-field">
                                                <label>Start Date</label>
                                                <input
                                                    type="date"
                                                    className="recurring-form-input"
                                                    value={editFields.startDate}
                                                    onChange={(e) =>
                                                        setEditFields({ ...editFields, startDate: e.target.value })
                                                    }
                                                />
                                            </div>

                                            {/* End Date */}
                                            <div className="edit-field">
                                                <label>End Date</label>
                                                <input
                                                    type="date"
                                                    className="recurring-form-input"
                                                    value={editFields.endDate}
                                                    onChange={(e) =>
                                                        setEditFields({ ...editFields, endDate: e.target.value })
                                                    }
                                                />
                                            </div>

                                            {/* Active */}
                                            <div className="edit-field switch-field">
                                                <label>Active</label>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={editFields.active}
                                                        onChange={(e) =>
                                                            setEditFields({ ...editFields, active: e.target.checked })
                                                        }
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Save / Cancel */}
                                        <div className="edit-actions">
                                            <button className="edit-btn" onClick={() => handleSaveEdit(exp.id)}>
                                                Save
                                            </button>
                                            <button className="delete-btn" onClick={handleCancelEdit}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                );
                            } else {
                                // Normal Card
                                return (
                                    <div className="recurring-expense-card" key={exp.id}>
                                        <div className="recurring-expense-header">
                                            <h3>{exp.description}</h3>
                                            <span className="category-label">{exp.category}</span>
                                        </div>

                                        <div className="recurring-expense-body">
                                            <div className="detail-grid">
                                                <div className="detail-row">
                                                    <span className="detail-label">Amount:</span>
                                                    <span className="detail-value">
                                                        £{exp.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Frequency:</span>
                                                    <span className="detail-value">
                                                        {exp.frequency}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Billing Day:</span>
                                                    <span className="detail-value">{exp.billingDay}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Start Date:</span>
                                                    <span className="detail-value">
                                                        {new Date(exp.startDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">End Date:</span>
                                                    <span className="detail-value">
                                                        {exp.endDate
                                                            ? new Date(exp.endDate).toLocaleDateString()
                                                            : "Ongoing"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="recurring-expense-footer">
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={exp.active}
                                                    onChange={() => handleToggleActive(exp)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                            <div className="expense-actions">
                                                <button className="edit-btn" onClick={() => startEditing(exp)}>
                                                    Edit
                                                </button>
                                                <button className="delete-btn" onClick={() => handleDelete(exp.id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}

                {recurringExpenses.length > 5 && (
                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                        <button
                            onClick={() => setShowAll((prev) => !prev)}
                            className="recurring-form-button"
                            style={{ width: "100%" }}
                        >
                            {showAll ? "Show Less" : "Show All"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecurringExpenseManager;
