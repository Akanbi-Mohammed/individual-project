import React, {useState, useEffect, useContext} from "react";
import axios from "axios";
import Navbar from "./navbar";
import "./expenses.css";
import Swal from "sweetalert2";

import { CurrencyContext } from "./CurrencyContext";
import { getCurrencySymbol } from "./settings";
import { auth } from "./fireBase"
import RecurringExpenseManager from "./RecurringExpenseManager"
import Joyride, { STATUS } from "react-joyride";
import { FaQuestionCircle } from "react-icons/fa";



const ExpenseTracker = () => {
    const [categories, setCategories] = useState([]);
    const [runGuide, setRunGuide] = useState(false);
    const { currency } = useContext(CurrencyContext);
    const [editAmount, setEditAmount] = useState("");
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
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [categorySpending, setCategorySpending] = useState({});
    const [showRecurringForm, setShowRecurringForm] = useState(false);
    const [description, setDescription] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        fetchCategories();
    }, []);
    useEffect(() => {
        fetchExpenses();
        fetchBudgets();
    }, [currentMonth]);



    const expensesGuideSteps = [
        {
            target: ".intro-title",
            content:
                "Welcome to your Expenses page! Here you can view and manage your expenses.",
        },
        {
            target: ".expense-form",
            content:
                "This form lets you add a new expense. Fill in the category, description, amount, and date.",
        },
        {
            target: ".expenses-list",
            content:
                "Here is the list of your recorded expenses. You can edit or delete any expense from this list.",
        },
        {
            target: ".category-filter",
            content:
                "Use this filter to narrow down the expenses by category.",
        },
        {
            target: ".month-navigation",
            content:
                "Use these buttons to navigate through months and review your expenses over time.",
        },
        {
            target: ".recurring-expense-manager",
            content:
                "Manage your recurring expenses here for automated tracking of regular expenses.",
        },
        {
            target: ".navbar-goals",
            content:
                "Click here to proceed to your Goals page and continue the tutorial.",
        },
    ];
    const fetchBudgets = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return; // Ensure user is authenticated

            const token = await user.getIdToken();
            const response = await axios.get("https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBudgets(response.data); // Set all budgets without filtering
        } catch (error) {
            console.error("Error fetching budgets:", error);
        }
    };
    const fetchCategories = async () => {
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
            console.error("Error fetching categories from backend:", error);
        }
    };

    const fetchExpenses = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("❌ No user is logged in.");
                return;
            }

            const token = await user.getIdToken();
            console.log("🔥 Firebase Token:", token); // ✅ Print token to console for debugging

            const response = await axios.get(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

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



    const deleteExpense = async (expenseId) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire({
                    title: "⚠️ Authentication Required!",
                    text: "You must be logged in to delete an expense.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const confirmDelete = await Swal.fire({
                title: "⚠️ Delete Expense?",
                text: "Are you sure you want to delete this expense? This action cannot be undone.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, Delete",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#ff4d4d",
            });

            if (!confirmDelete.isConfirmed) return;

            const token = await user.getIdToken();
            const response = await axios.delete(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses/${expenseId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseId));

                Swal.fire({
                    title: "✅ Expense Deleted!",
                    html: `<p style="font-size: 18px; color: #ff4d4d;">The expense has been successfully deleted.</p>`,
                    icon: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
            } else {
                throw new Error("Failed to delete expense.");
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            Swal.fire({
                title: "❌ Deletion Error!",
                text: "Error deleting expense. Please try again later.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };



    const startEditing = (expense) => {
        setEditingExpenseId(expense.id);
        setCurrentExpense(expense);

        // Just always show the actual category from the expense
        setCategory(expense.category);
        setCustomCategory("");
        setEditAmount(expense.amount);// Clear any leftover custom category

        setAmount(expense.amount);
        setDate(expense.date);
        setDescription(expense.description || "");
    };
    const addExpense = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire({
                    title: "⚠️ Authentication Required!",
                    text: "You must be logged in to add an expense.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const finalCategory = category === "Other" ? customCategory : category;

            if (!finalCategory || !amount || !date) {
                Swal.fire({
                    title: "⚠️ Missing Fields!",
                    text: "Please fill in all fields.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const today = new Date();
            const selectedDate = new Date(date);
            const selectedMonth = date.slice(0, 7); // Format: YYYY-MM

            if (
                selectedDate < new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()) ||
                selectedDate > new Date(today.getTime() + 24 * 60 * 60 * 1000)
            ) {
                Swal.fire({
                    title: "⚠️ Invalid Date!",
                    text: "Date must be within the last 5 years and no more than one day ahead.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }



            // 💰 Check if Spending Cap is Exceeded
            const categorySpendingTotal = categorySpending[finalCategory] || 0;
            const newSpendingTotal = categorySpendingTotal + parseFloat(amount);


            // 🔍 Check if a budget exists for the category and month
            const budgetForCategory = budgets.find((b) => b.category === finalCategory && b.month === selectedMonth);

            if (!budgetForCategory) {
                Swal.fire({
                    title: "⚠️ No Budget Set!",
                    html: `<p>No budget has been set for "<strong>${finalCategory}</strong>" in ${new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })}.</p>`,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: "Set Budget",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#007acc",
                }).then((result) => {
                    if (result.isConfirmed) window.location.href = "/budgets";
                });
                return;
            }

            const totalExpenses = calculateTotalExpensesByCategory();
            const newTotal = (totalExpenses[finalCategory] || 0) + parseFloat(amount);
            const threshold = budgetForCategory.amount * 0.8;

            if (newTotal > threshold && newTotal <= budgetForCategory.amount) {
                Swal.fire({
                    title: "⚠️ Budget Warning!",
                    text: `You have reached 80% of your budget (${getCurrencySymbol(currency)}${budgetForCategory.amount}) for "${finalCategory}".`,
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
            }

            if (newTotal > budgetForCategory.amount) {
                const proceed = await Swal.fire({
                    title: "⚠️ Budget Exceeded!",
                    text: `Adding this expense will exceed the budget (${getCurrencySymbol(currency)}${budgetForCategory.amount}) for "${finalCategory}". Do you wish to proceed?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Proceed",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#007acc",
                    cancelButtonColor: "#ff4d4d",
                });

                if (!proceed.isConfirmed) return;
            }

            // 🔥 Get Firebase Token for Authenticated Request
            const token = await user.getIdToken();

            // ✅ Fix API Request Structure
            const response = await axios.post(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses",
                {
                    category: finalCategory,
                    amount: parseFloat(amount),
                    date,
                    description,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // ✅ Add the custom category to the dropdown if it doesn't exist
            if (category === "Other" && !categories.includes(customCategory)) {
                setCategories((prevCategories) => [...prevCategories, customCategory]);
            }

            // 🛠 Update spending in state
            setCategorySpending((prev) => ({
                ...prev,
                [finalCategory]: (prev[finalCategory] || 0) + parseFloat(amount),
            }));

            fetchExpenses(); // Refresh expenses
            resetForm(); // Reset form fields

            Swal.fire({
                title: "✅ Expense Added!",
                html: `<p>Your expense in <strong>${finalCategory}</strong> has been added successfully.</p>`,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });

        } catch (error) {
            console.error("Error adding expense:", error);
            Swal.fire({
                title: "❌ Add Failed!",
                text: "Error adding expense. Please try again.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };



    const editExpense = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire({
                    title: "⚠️ Authentication Required!",
                    text: "You must be logged in to edit an expense.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const finalCategory = category === "Other" ? customCategory : category;
            if (!finalCategory || !amount || !date) {
                Swal.fire({
                    title: "⚠️ Missing Fields!",
                    text: "Please fill in all fields before updating.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const today = new Date();
            const selectedDate = new Date(date);
            const selectedMonth = date.slice(0, 7); // Format: YYYY-MM

            if (
                selectedDate < new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()) ||
                selectedDate > new Date(today.getTime() + 24 * 60 * 60 * 1000)
            ) {
                Swal.fire({
                    title: "⚠️ Invalid Date!",
                    text: "Date must be within the last 5 years and no more than one day ahead.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            // 🛠 Check if the budget exists for this category & month
            const budgetForCategory = budgets.find((b) => b.category === finalCategory && b.month === selectedMonth);
            const totalExpenses = calculateTotalExpensesByCategory();
            const previousExpense = expenses.find((exp) => exp.id === editingExpenseId);
            const previousAmount = previousExpense ? previousExpense.amount : 0;
            const newTotal = (totalExpenses[finalCategory] || 0) - previousAmount + parseFloat(amount);

            if (budgetForCategory) {
                const threshold = budgetForCategory.amount * 0.8;

                if (newTotal > threshold && newTotal <= budgetForCategory.amount) {
                    Swal.fire({
                        title: "⚠️ Budget Warning!",
                        text: `You have reached 80% of your budget (£${budgetForCategory.amount}) for "${finalCategory}".`,
                        icon: "warning",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#ff4d4d",
                    });
                }

                if (newTotal > budgetForCategory.amount) {
                    const proceed = await Swal.fire({
                        title: "⚠️ Budget Exceeded!",
                        text: `Editing this expense will exceed the budget (£${budgetForCategory.amount}) for "${finalCategory}". Do you wish to proceed?`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Proceed",
                        cancelButtonText: "Cancel",
                        confirmButtonColor: "#007acc",
                        cancelButtonColor: "#ff4d4d",
                    });

                    if (!proceed.isConfirmed) return;
                }
            } else {
                Swal.fire({
                    title: "⚠️ No Budget Set!",
                    html: `<p>No budget has been set for "<strong>${finalCategory}</strong>" in ${new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })}.</p>`,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: "Set Budget",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#007acc",
                }).then((result) => {
                    if (result.isConfirmed) window.location.href = "/budgets";
                });
                return;
            }

            // 🛠 Get Firebase Token for Authentication
            const token = await user.getIdToken();

            await axios.put(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses/${editingExpenseId}`,
                {
                    id: editingExpenseId,
                    category: finalCategory,
                    amount: parseFloat(amount),
                    date,
                    description,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            fetchExpenses(); // Refresh expenses
            resetForm(); // Reset input fields
            setEditingExpenseId(null);

            Swal.fire({
                title: "✅ Expense Updated!",
                html: `<p style="font-size: 18px; color: #28a745;">Your expense in <strong>${finalCategory}</strong> has been updated successfully.</p>`,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });

        } catch (error) {
            console.error("Error editing expense:", error);
            Swal.fire({
                title: "❌ Update Failed!",
                text: "Error updating expense. Please try again.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };

    const saveExpenseChanges = async () => {
        const finalCategory = category === "Other" ? customCategory : category;

        if (!finalCategory || !amount || !date) {
            Swal.fire({
                title: "⚠️ Missing Fields!",
                text: "Please fill in all fields before saving.",
                icon: "warning",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
            return;
        }

        const today = new Date();
        const selectedMonth = date.slice(0, 7); // Extract YYYY-MM



        // 💰 Check if Spending Cap is Exceeded
        const categorySpendingTotal = categorySpending[finalCategory] || 0;

        const previousExpense = expenses.find((exp) => exp.id === editingExpenseId);
        const previousAmount = previousExpense ? previousExpense.amount : 0;
        const newSpendingTotal = categorySpendingTotal - previousAmount + parseFloat(amount);


        // 🔍 Check if a budget exists for this category in the selected month
        const budgetForCategory = budgets.find((b) => b.category === finalCategory && b.month === selectedMonth);

        if (!budgetForCategory) {
            Swal.fire({
                title: "⚠️ No Budget Found!",
                html: `
                <p style="font-size: 18px; color: #ff4d4d;">
                    No budget is set for "<strong>${finalCategory}</strong>" in 
                    ${new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })}.
                </p>
                <p>Would you like to create a budget for this category now?</p>`,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Set Budget",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#007acc",
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/budgets"; // Redirect to budgets page
                }
            });
            return;
        }

        // ✅ Ensure correct total expenses calculation (subtract previous amount first)
        const totalExpensesForMonth = expenses
            .filter((exp) => exp.category === finalCategory && exp.date.startsWith(selectedMonth))
            .reduce((acc, exp) => acc + exp.amount, 0);

        const newTotal = totalExpensesForMonth - previousAmount + parseFloat(amount);
        const budgetLimit = budgetForCategory.amount;
        const threshold = budgetLimit * 0.8;

        // ⚠️ Warn if exceeding 80% of the budget
        if (previousAmount <= threshold && newTotal > threshold && newTotal <= budgetLimit) {
            Swal.fire({
                title: "⚠️ Budget Warning!",
                text: `You're reaching 80% of the budget (${getCurrencySymbol(currency)}${budgetLimit}) for "${finalCategory}".`,
                icon: "warning",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }

        // 🚨 Ask user if they want to proceed when exceeding budget
        if (newTotal > budgetLimit) {
            const proceed = await Swal.fire({
                title: "⚠️ Budget Exceeded!",
                text: `This expense will exceed the budget (${getCurrencySymbol(currency)}${budgetLimit}) for "${finalCategory}". Do you wish to proceed?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Proceed Anyway",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#007acc",
                cancelButtonColor: "#ff4d4d",
            });

            if (!proceed.isConfirmed) {
                return; // 🚫 Exit if user cancels
            }
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("User is not authenticated.");
                return;
            }

            const token = await user.getIdToken();
            console.log("Firebase Token:", token);

            // ❌ Remove the invalid setDescription(...) call from the request body
            // ✅ Instead, pass a "description" property with the updated description
            await axios.put(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses/${editingExpenseId}`,
                {
                    id: editingExpenseId,
                    category: finalCategory,
                    amount: parseFloat(amount),
                    date,
                    // If you have a local "description" state, pass it here:
                    description,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // 🛠 Update spending in state
            setCategorySpending((prev) => ({
                ...prev,
                [finalCategory]: (prev[finalCategory] || 0) - previousAmount + parseFloat(amount),
            }));

            fetchExpenses(); // Refresh expenses
            resetForm(); // Reset input fields
            setEditingExpenseId(null);

            Swal.fire({
                title: "✅ Expense Updated!",
                html: `<p style="font-size: 18px; color: #28a745;">
                Your expense in <strong>${finalCategory}</strong> has been updated successfully.
            </p>`,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });
        } catch (error) {
            console.error("Error saving expense changes:", error);
            Swal.fire({
                title: "❌ Update Failed!",
                text: "Error saving changes. Please try again.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };









    const resetForm = () => {
        setEditMode(false);
        setEditingExpenseId(null);
        setCurrentExpense(null);
        setCategory("");
        setDescription("");
        setCustomCategory("");
        setEditAmount("");
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
    const deleteAllExpenses = async () => {
        const confirmDelete = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete all your expenses.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete all",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d9534f",
            cancelButtonColor: "#6c757d"
        });

        if (!confirmDelete.isConfirmed) return;

        try {
            const token = await auth.currentUser.getIdToken();
            await axios.delete("https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses/delete-all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchExpenses();

            Swal.fire("Deleted!", "All your expenses have been removed successfully.", "success");
        } catch (error) {
            console.error("Error deleting expenses:", error);
            Swal.fire("Error", "Failed to delete expenses. Please try again.", "error");
        }
    };




    const handleEditCategory = (index) => {
        const updatedCategories = [...categories];

        if (editedCategory && !categories.includes(editedCategory)) {
            updatedCategories[index] = editedCategory;
            setCategories(updatedCategories);
            setEditedCategory("");

            // ✅ Show success notification
            Swal.fire({
                title: "✅ Category Updated!",
                text: `The category has been successfully renamed to "${editedCategory}".`,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });

        } else {
            // ❌ Show error notification
            Swal.fire({
                title: "⚠️ Invalid Category!",
                text: "Category name must be unique and non-empty.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };


    const handleDeleteCategory = (index) => {
        Swal.fire({
            title: "🗑️ Delete Category?",
            text: "Are you sure you want to delete this category? This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedCategories = categories.filter((_, i) => i !== index);
                setCategories(updatedCategories);

                // ✅ Show success notification
                Swal.fire({
                    title: "✅ Deleted!",
                    text: "The category has been successfully deleted.",
                    icon: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#28a745",
                });
            }
        });
    };

    const toggleEditCategoriesCollapse = () => {
        setIsEditCategoriesCollapsed(!isEditCategoriesCollapsed);
    };
    const toggleShowAllCategories = () => {
        setShowAllCategories(!showAllCategories);
    };
    const syncRecurringExpenses = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire({
                    title: "⚠️ Authentication Required!",
                    text: "You must be logged in to sync recurring expenses.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }
            const token = await user.getIdToken();
            await axios.post(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/recurring-expenses/sync",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Swal.fire({
                title: "✅ Sync Successful!",
                text: "Recurring expenses have been synced successfully.",
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });
            fetchExpenses(); // Refresh expenses after syncing
        } catch (error) {
            console.error("Error syncing recurring expenses:", error);
            Swal.fire({
                title: "❌ Sync Failed!",
                text: "Failed to sync recurring expenses. Please try again later.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };
    const handleJoyrideCallback = (data) => {
        const { status, type } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRunGuide(false);
            return;
        }

        // 🔁 Advance to next step
        if (type === "step:after" || type === "target:notFound") {
            setStepIndex((prev) => prev + 1);
        }
    };


    return (
        <div className="expense-tracker">
            <Navbar/>
            <Joyride
                steps={expensesGuideSteps}
                run={runGuide}
                stepIndex={stepIndex}
                continuous
                showSkipButton
                disableBeacon
                callback={handleJoyrideCallback}
                styles={{ options: { zIndex: 10000 } }}
            />

            <h2 className="intro-title">Expense Tracker</h2>
            <p className="intro-text">Track and manage your expenses effectively.</p>
            <div className="floating-help-button" onClick={() => {
                setStepIndex(0);
                setRunGuide(true);
            }}>
                <FaQuestionCircle className="help-icon"/>
            </div>
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

                    </select>
                </label>
                <label className="form-label">
                    Description:
                    <small className="form-description">
                        Provide a brief description of the expense (optional).
                    </small>
                    <textarea
                        placeholder="e.g., Grocery shopping, monthly Netflix subscription, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="form-input"
                    />
                </label>

                <label className="form-label">
                    Amount:
                    <small className="form-description">Specify the amount spent for this expense.</small>
                    <input
                        type="text" // Use text input to allow formatted numbers
                        placeholder="e.g., 50"
                        value={amount.toLocaleString()} // Show formatted value with commas
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, ""); // Remove commas before updating state
                            if (!isNaN(rawValue) && rawValue !== "") {
                                setAmount(Number(rawValue)); // Store as a number
                            } else {
                                setAmount(""); // Prevent invalid input
                            }
                        }}
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
                <button onClick={addExpense} className="form-button">
                    Add Expense
                </button>
                {/* Delete All Expenses Button placed right after the expense form */}
                {expenses.length > 0 && (
                    <button onClick={deleteAllExpenses} className="budget-tracker-delete-button">
                        Delete All Expenses
                    </button>
                )}


            </div>
            <RecurringExpenseManager/>


            <div className="category-filter">
                <label className="form-label">
                    Filter by Category:
                    <div className={`select-wrapper ${isDropdownOpen ? "open" : ""}`}>
                        <select
                            value={selectedFilterCategory}
                            onChange={(e) => {
                                setSelectedFilterCategory(e.target.value);
                                setIsDropdownOpen(false); // Ensure arrow flips down on selection
                            }}
                            onMouseDown={() => setIsDropdownOpen(true)}  // arrow flips up
                            onBlur={() => setIsDropdownOpen(false)}      // arrow flips down if blur fires
                            className="form-input"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat, index) => (
                                <option key={index} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </label>
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
                            {editingExpenseId === expense.id ? (
                                <div className="edit-form-fields">
                                    <input
                                        type="text"
                                        value={category} // Use category state
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="budget-edit-input"
                                        placeholder="Edit category"
                                    />
                                    <input
                                        type="text"
                                        value={description} // Use amount state
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="budget-edit-input"
                                        placeholder="Edit description"
                                    />
                                    <input
                                        type="text" // Change to text input for formatting
                                        value={editAmount.toLocaleString()} // Display with commas
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/,/g, ""); // Remove commas before updating state
                                            if (!isNaN(rawValue) && rawValue !== "") {
                                                setEditAmount(Number(rawValue)); // Store as a number
                                            } else {
                                                setEditAmount(""); // Prevent invalid input
                                            }
                                        }}
                                        className="budget-edit-input"
                                        placeholder="Edit amount"
                                    />

                                    <input
                                        type="date"
                                        value={date} // Use date state
                                        onChange={(e) => setDate(e.target.value)}
                                        className="budget-edit-input"
                                    />
                                    <div className="expense-edit-actions">
                                        <button onClick={saveExpenseChanges} className="save-button">
                                            Save
                                        </button>
                                        <button onClick={resetForm} className="cancel-button">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="expense-card-content-wrapper">
                                    <div className="expense-card-content">
                                        <p>
                                            <strong>Category:</strong> {expense.category}
                                        </p>
                                        <p>
                                            <strong>Description:</strong> {expense.description}
                                        </p>
                                        <p>
                                            <strong>Amount:</strong> {getCurrencySymbol(currency)}{expense.amount}
                                        </p>
                                        <p>
                                            <strong>Date:</strong> {formatDate(expense.date)}
                                        </p>
                                    </div>
                                    <div className="expense-buttons">
                                        <button
                                            onClick={() => startEditing(expense)}
                                            className="edit-button"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteExpense(expense.id)}
                                            className="delete-button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
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