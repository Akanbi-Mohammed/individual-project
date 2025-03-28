import React, { useState, useEffect, useContext } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "./navbar";
import "./budgets.css";
import Swal from "sweetalert2";
import SmartAICoach from "./SmartAICoach";
import { CurrencyContext } from "./CurrencyContext";
import { getCurrencySymbol } from "./settings";
import { auth } from "./fireBase";
import stringSimilarity from "string-similarity";
import Joyride, { STATUS } from "react-joyride";
import { FaQuestionCircle } from "react-icons/fa";


// Helper to convert a Date to "YYYY-MM"
function formatToYearMonth(date) {
    return date.toISOString().slice(0, 7);
}

// Updated function with defensive checks
function findSimilarCategory(newCat, existingCategories) {
    if (typeof newCat !== "string") {
        console.warn("findSimilarCategory: newCat is not a string:", newCat);
        return null;
    }
    if (!Array.isArray(existingCategories)) {
        console.warn("findSimilarCategory: existingCategories is not an array:", existingCategories);
        return null;
    }
    const validCategories = existingCategories.filter((cat) => typeof cat === "string");
    if (validCategories.length === 0) return null;
    const lowerNewCat = newCat.toLowerCase();
    const lowerCategories = validCategories.map((c) => c.toLowerCase());
    const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(lowerNewCat, lowerCategories);
    return bestMatch.rating >= 0.8 ? validCategories[bestMatchIndex] : null;
}

const BudgetTracker = () => {
    // =========================
    //  STATE FOR BUDGET LOGIC
    // =========================
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);

    const [selectedFilterCategory, setSelectedFilterCategory] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [budgetAmount, setBudgetAmount] = useState("");
    const location = useLocation();

    // Single month state for everything
    const [selectedMonth, setSelectedMonth] = useState(() => new Date());

    // Editing a budget
    const [editingBudgetId, setEditingBudgetId] = useState(null);
    const [editCategory, setEditCategory] = useState("");
    const [editAmount, setEditAmount] = useState("");

    // For monthly income
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [totalAllocatedBudget, setTotalAllocatedBudget] = useState(0);
    const [remainingIncome, setRemainingIncome] = useState(0);

    // Editing categories
    const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
    const [editCategoryValue, setEditCategoryValue] = useState("");
    const [showAll, setShowAll] = useState(false);

    const {currency} = useContext(CurrencyContext);

    // Current user
    const [currentUser, setCurrentUser] = useState(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));
    const [runGuide, setRunGuide] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const budgetGuideSteps = [
        {
            target: ".budget-tracker-title",
            content:
                "Welcome to the Budget Tracker! Here you can view, add, and manage your monthly budgets.",
        },
        {
            target: ".budget-tracker-form",
            content:
                "This form allows you to select a category, enter a budget amount, and add a new budget. If you choose 'Other', you can define a custom category.",
        },
        {
            target: ".budget-tracker-button",
            content:
                "Click here to add your budget. If a budget for the selected category and month already exists, you'll be prompted to edit it.",
        },
        {
            target: ".budget-tracker-navigation",
            content:
                "Use these navigation buttons to move between different months and view your budgets accordingly.",
        },
        {
            target: ".budget-tracker-list",
            content:
                "All budgets for the current month are listed here. You can edit or delete any budget from this list.",
        },
        {
            target: ".edit-categories",
            content:
                "In this section, you can manage your budget categories—edit existing ones or delete them if needed.",
        },
        {
            target: ".navbar-expenses",
            content: "Click here to continue the tutorial on Expenses!",
        },
    ];




    useEffect(() => {
            if (currentUser) {
                console.log("User is now:", currentUser.uid);
            } else {
                console.log("No user logged in");
            }
        }, [currentUser]);

        // =========================
        //  USEEFFECTS
        // =========================

        useEffect(() => {
            fetchCategories();
            fetchBudgets();
            fetchMonthlyIncomeFromBackend();
        }, [selectedMonth]);

        useEffect(() => {
            fetchExpenses();

        }, []);

        useEffect(() => {
            const params = new URLSearchParams(location.search);
            const cat = params.get("category");
            if (cat) {
                setSelectedCategory(decodeURIComponent(cat));
            }
        }, [location]);

        useEffect(() => {
            const monthString = formatToYearMonth(selectedMonth);
            const allocated = budgets
                .filter((b) => b.month === monthString)
                .reduce((sum, b) => sum + b.amount, 0);
            setTotalAllocatedBudget(allocated);
            setRemainingIncome(monthlyIncome - allocated);
        }, [budgets, monthlyIncome, selectedMonth]);

        // =========================
        //  FETCH LOGIC
        // =========================

        const fetchMonthlyIncomeFromBackend = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const monthString = formatToYearMonth(selectedMonth);
                const response = await axios.get(
                    `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/user-income?month=${monthString}`,
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                if (response.status === 200 && response.data && typeof response.data.amount === "number") {
                    setMonthlyIncome(response.data.amount);
                } else {
                    setMonthlyIncome(0);
                }
            } catch (error) {
                console.error("Error fetching monthly income from backend:", error);
                setMonthlyIncome(0);
            }
        };

        // Fetch categories from your Spring Boot backend
        const fetchCategories = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const response = await axios.get(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories",
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                if (response.status === 200 && response.data) {
                    setCategories(response.data); // Expecting an array of strings
                }
            } catch (error) {
                console.error("Error fetching categories from backend:", error);
            }
        };

        const fetchExpenses = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const response = await axios.get(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses",
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                setExpenses(response.data);
            } catch (error) {
                console.error("Error fetching expenses:", error);
            }
        };

        const fetchBudgets = async () => {
            try {
                const token = await auth.currentUser.getIdToken();
                const response = await axios.get(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets",
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                setBudgets(response.data);
            } catch (error) {
                console.error("Error fetching budgets:", error);
            }
        };

        // =========================
        //  MONTH NAVIGATION
        // =========================

        const handleMonthChange = (direction) => {
            const newMonth = new Date(selectedMonth);
            newMonth.setMonth(newMonth.getMonth() + (direction === "prev" ? -1 : 1));
            setSelectedMonth(newMonth);
        };

        // =========================
        //  ADDING A BUDGET
        // =========================

        const addBudget = async () => {
            const today = new Date();
            const monthString = formatToYearMonth(selectedMonth);
            const selectedDate = new Date(
                selectedMonth.getFullYear(),
                selectedMonth.getMonth(),
                1
            );
            const categoryToUse =
                selectedCategory === "Other" ? customCategory : selectedCategory;

            const firstOfCurrentMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );
            if (selectedDate < firstOfCurrentMonth) {
                Swal.fire({
                    title: "⚠️ Invalid Date!",
                    text: "You cannot set budgets for past months.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            if (!categoryToUse || !budgetAmount) {
                Swal.fire({
                    title: "⚠️ Missing Information!",
                    text: "Please fill in all fields before adding a budget.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const budgetValue = parseFloat(budgetAmount);
            if (isNaN(budgetValue) || budgetValue <= 0) {
                Swal.fire({
                    title: "⚠️ Invalid Budget Amount!",
                    text: "Budget must be a number greater than zero.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            // Check if user’s existing expenses for this category already exceed the new budget
            const totalExpensesForCategory = expenses
                .filter(
                    (exp) =>
                        exp.category === categoryToUse &&
                        exp.date.startsWith(monthString)
                )
                .reduce((sum, exp) => sum + exp.amount, 0);

            if (budgetValue < totalExpensesForCategory) {
                Swal.fire({
                    title: "⚠️ Budget Too Low!",
                    html: `
        <p style="font-size: 18px; font-weight: bold; color: #ff4d4d;">
          Your total expenses for <strong>${categoryToUse}</strong> this month 
          are already <strong>${getCurrencySymbol(currency)}${totalExpensesForCategory.toFixed(
                        2
                    )}</strong>.
        </p>
        <p>Please set a budget that is at least this amount.</p>
      `,
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            // If budget for category + month already exists, prompt to edit
            const existingBudget = budgets.find(
                (b) => b.category === categoryToUse && b.month === monthString
            );
            if (existingBudget) {
                Swal.fire({
                    title: "📢 Budget Already Exists!",
                    html: `
        <p style="font-size: 16px;">
          A budget for "<strong>${categoryToUse}</strong>" already exists for 
          <strong>${selectedMonth.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                    })}</strong>.
        </p>
        <p style="font-size: 14px; color: #007acc;">
          Would you like to <strong>edit the budget</strong> instead?
        </p>
      `,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: "Edit Budget",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#007acc",
                    cancelButtonColor: "#ff4d4d",
                }).then((result) => {
                    if (result.isConfirmed) {
                        startEditingBudget(existingBudget);
                    }
                });
                return;
            }

            // Check if new budget will exceed monthly income
            const newTotalAllocatedBudget = totalAllocatedBudget + budgetValue;
            const newRemainingIncome = monthlyIncome - newTotalAllocatedBudget;
            if (newRemainingIncome < 0) {
                Swal.fire({
                    title: "🚨 Budget Limit Exceeded!",
                    html: `
        <p style="font-size: 18px; font-weight: bold; color: #ff4d4d;">
          You are exceeding your monthly income by:
        </p>
        <p style="font-size: 22px; font-weight: bold; color: #007acc;">
          £${Math.abs(newRemainingIncome).toFixed(2)}
        </p>
        <p style="margin-top: 1rem; font-size: 16px;">
          You might want to update your monthly income or lower this budget.
        </p>
      `,
                    icon: "error",
                    // Show a second "Update Income" button
                    showDenyButton: true,
                    denyButtonText: "Update Income",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                    denyButtonColor: "#007acc",
                }).then((result) => {
                    if (result.isDenied) {
                        // Navigate to the monthly income container on your homepage
                        window.location.href = "/home#income-section";
                    }
                });
                return;
            }

            // If "Other" + customCategory, check for near-duplicate category
            if (selectedCategory === "Other" && customCategory) {
                const similarCat = findSimilarCategory(customCategory, categories);
                if (similarCat) {
                    const {isConfirmed} = await Swal.fire({
                        title: "Category Already Exists?",
                        html: `
          <p style="font-size: 16px;">
            The category you entered, <strong>${customCategory}</strong>, 
            is very similar to <strong>${similarCat}</strong>.
          </p>
          <p>Would you like to edit the existing budget instead?</p>
        `,
                        icon: "info",
                        showCancelButton: true,
                        confirmButtonText: "Yes, Edit Existing",
                        cancelButtonText: "No, Create New",
                        confirmButtonColor: "#007acc",
                        cancelButtonColor: "#ff4d4d",
                    });
                    if (isConfirmed) {
                        const existingBudgetForMonth = budgets.find(
                            (b) =>
                                b.category.toLowerCase() === similarCat.toLowerCase() &&
                                b.month === monthString
                        );
                        if (existingBudgetForMonth) {
                            startEditingBudget(existingBudgetForMonth);
                        } else {
                            Swal.fire({
                                title: "No Existing Budget Found",
                                text: `There's no budget for "${similarCat}" in this month yet.`,
                                icon: "info",
                                confirmButtonText: "OK",
                            });
                        }
                        return;
                    }
                }
            }

            // If user typed "Other" + brand-new category, update categories in backend
            if (selectedCategory === "Other" && !categories.includes(customCategory)) {
                const updatedCategories = [...categories, customCategory];
                setCategories(updatedCategories);
                updateCategoriesBackend(updatedCategories);
            }

            try {
                const token = await auth.currentUser.getIdToken();
                const newBudget = {
                    category: categoryToUse,
                    amount: budgetValue,
                    month: monthString,
                };
                const response = await axios.post(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets",
                    newBudget,
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                if (response.status === 200) {
                    // Add to local state
                    setBudgets((prev) => [...prev, newBudget]);
                    setTotalAllocatedBudget(newTotalAllocatedBudget);
                    setRemainingIncome(newRemainingIncome);
                    Swal.fire({
                        title: "🎉 Budget Added!",
                        html: `
          <p style="font-size: 18px; font-weight: bold; color: #28a745;">
            The budget for <strong>${categoryToUse}</strong> has been added successfully!
          </p>
        `,
                        icon: "success",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#28a745",
                    });
                    resetForm();
                }
            } catch (error) {
                console.error("Error adding budget:", error);
                Swal.fire({
                    title: "❌ Error!",
                    text: "Failed to add budget. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
            }
        };


        // =========================
        //  BUDGET EDIT / DELETE
        // =========================
        const startEditingBudget = (budget) => {
            setEditingBudgetId(budget.id);
            setEditCategory(budget.category);
            setEditAmount(budget.amount);
            const [year, month] = budget.month.split("-");
            const newDate = new Date();
            newDate.setFullYear(parseInt(year, 10), parseInt(month, 10) - 1, 1);
            setSelectedMonth(newDate);
            setTimeout(() => {
                const editBudgetElement = document.getElementById(`budget-${budget.id}`);
                if (editBudgetElement) {
                    editBudgetElement.scrollIntoView({behavior: "smooth", block: "center"});
                }
            }, 300);
        };

        const saveEditedBudget = async () => {
            if (!selectedMonth) {
                Swal.fire({
                    title: "⚠️ Invalid Month!",
                    text: "Please select a valid month.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#007acc",
                });
                return;
            }

            const currentBudget = budgets.find((b) => b.id === editingBudgetId);
            if (!currentBudget) {
                Swal.fire({
                    title: "⚠️ Budget Not Found!",
                    text: "The budget you are trying to edit does not exist.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const oldCategory = currentBudget.category;
            const previousBudgetAmount = currentBudget.amount;
            const newBudgetValue = parseFloat(editAmount);

            if (isNaN(newBudgetValue) || newBudgetValue <= 0) {
                Swal.fire({
                    title: "⚠️ Invalid Budget Amount!",
                    text: "Please enter a valid budget amount greater than zero.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            // Ensure expenses are fetched before validating budget
            if (!expenses || expenses.length === 0) {
                await fetchExpenses(); // Fetch expenses if empty
            }

            if (!expenses || expenses.length === 0) {
                Swal.fire({
                    title: "⚠️ No Expense Data!",
                    text: "Cannot validate budget without expense data. Please try again later.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const monthString = formatToYearMonth(selectedMonth);
            const totalExpensesForCategory = expenses
                .filter(
                    (exp) =>
                        exp.category.trim().toLowerCase() === editCategory.trim().toLowerCase() &&
                        exp.date.startsWith(monthString)
                )
                .reduce((sum, exp) => sum + exp.amount, 0);

            if (newBudgetValue < totalExpensesForCategory) {
                Swal.fire({
                    title: "⚠️ Budget Too Low!",
                    html: `
                <p style="font-size: 18px; font-weight: bold; color: #ff4d4d;">
                    Your total expenses for <strong>${editCategory}</strong> this month is already 
                    <strong>${getCurrencySymbol(currency)}${totalExpensesForCategory.toLocaleString()}</strong>.
                </p>
                <p>Please set a budget that is at least this amount.</p>
            `,
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const updatedAllocatedBudget = totalAllocatedBudget - previousBudgetAmount + newBudgetValue;
            const updatedRemainingIncome = monthlyIncome - updatedAllocatedBudget;

            if (updatedRemainingIncome < 0) {
                Swal.fire({
                    title: "🚨 Budget Limit Exceeded!",
                    html: `
                <div style="text-align: center;">
                    <p style="font-size: 18px; font-weight: bold; color: #ff4d4d;">
                        You are exceeding your monthly income by:
                    </p>
                    <p style="font-size: 24px; font-weight: bold; color: #ff0000;">
                        £${Math.abs(updatedRemainingIncome).toLocaleString()}
                    </p>
                </div>
            `,
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const duplicateBudget = budgets.find(
                (b) =>
                    b.category.trim().toLowerCase() === editCategory.trim().toLowerCase() &&
                    b.month === monthString &&
                    b.id !== editingBudgetId
            );

            if (duplicateBudget) {
                Swal.fire({
                    title: "⚠️ Duplicate Budget!",
                    text: `A budget for "${editCategory}" already exists for ${selectedMonth.toLocaleString(
                        "default",
                        {month: "long", year: "numeric"}
                    )}.`,
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#007acc",
                });
                return;
            }

            try {
                const token = await auth.currentUser.getIdToken();
                const updatedBudget = {category: editCategory, amount: newBudgetValue, month: monthString};

                // 1) Update the single budget in backend
                const response = await axios.put(
                    `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets/${editingBudgetId}`,
                    updatedBudget,
                    {headers: {Authorization: `Bearer ${token}`}}
                );

                if (response.status === 200) {
                    // 2) If category changed, update all occurrences in budgets & expenses
                    if (oldCategory.trim().toLowerCase() !== editCategory.trim().toLowerCase()) {
                        await axios.put(
                            "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories/updateCategory",
                            {oldCategory, newCategory: editCategory},
                            {headers: {Authorization: `Bearer ${token}`}}
                        );

                        // 3) Update local category list if applicable
                        if (categories.includes(oldCategory)) {
                            const updatedCategories = categories.map((cat) =>
                                cat === oldCategory ? editCategory : cat
                            );
                            setCategories(updatedCategories);

                            // 4) Save updated categories to Firestore
                            await axios.put(
                                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories",
                                {userId: auth.currentUser.uid, categories: updatedCategories},
                                {headers: {Authorization: `Bearer ${token}`}}
                            );
                        }
                    }

                    // 5) Update state with new budget values
                    setTotalAllocatedBudget(updatedAllocatedBudget);
                    setRemainingIncome(updatedRemainingIncome);

                    Swal.fire({
                        title: "✅ Budget Updated!",
                        html: `
                    <div style="text-align: center;">
                        <span style="font-size: 20px;">🎉</span>
                        <p style="font-size: 18px; font-weight: bold; color: #28a745;">
                            The budget for <strong>${editCategory}</strong> has been updated successfully!
                        </p>
                    </div>
                `,
                        icon: "success",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#28a745",
                    });

                    // Re-fetch data so UI updates immediately
                    fetchBudgets();
                    fetchExpenses();
                    cancelEditing();
                }
            } catch (error) {
                console.error("Error saving edited budget:", error);
                Swal.fire({
                    title: "❌ Update Failed!",
                    text: "There was an error updating the budget. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
            }
        };

        const deleteBudget = async (budgetId) => {
            const budget = budgets.find((b) => b.id === budgetId);
            if (!budget) return;

            // Filter expenses that match this budget’s category (case-insensitive)
            const associatedExpenses = expenses.filter(
                (exp) => exp.category.trim().toLowerCase() === budget.category.trim().toLowerCase()
            );

            let swalOptions;
            if (associatedExpenses.length > 0) {
                // Provide both options
                swalOptions = {
                    title: "🗑️ Confirm Deletion",
                    text: "Do you want to delete only this budget card or also delete all expenses associated with it?",
                    icon: "warning",
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: "Delete Budget Only",
                    denyButtonText: "Delete Budget & Expenses",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#ff4d4d",
                    denyButtonColor: "#007acc",
                    cancelButtonColor: "#999",
                };
            } else {
                // Only the budget
                swalOptions = {
                    title: "🗑️ Confirm Deletion",
                    text: "Do you want to delete this budget card?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Delete Budget",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#ff4d4d",
                    cancelButtonColor: "#007acc",
                };
            }

            Swal.fire(swalOptions).then(async (result) => {
                try {
                    const token = await auth.currentUser.getIdToken();
                    if (result.isConfirmed) {
                        // Delete ONLY the budget
                        await axios.delete(
                            `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets/${budgetId}`,
                            {headers: {Authorization: `Bearer ${token}`}}
                        );
                        Swal.fire("✅ Budget Deleted!", "The budget was removed.", "success");
                        fetchBudgets();
                    } else if (result.isDenied) {
                        // Delete budget AND associated expenses
                        await axios.delete(
                            `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets/deleteWithExpenses/${budgetId}`,
                            {headers: {Authorization: `Bearer ${token}`}}
                        );
                        Swal.fire("✅ Budget & Expenses Deleted!", "Both were removed.", "success");
                        fetchBudgets();
                        fetchExpenses();
                    }
                } catch (error) {
                    console.error("Error deleting budget/expenses:", error);
                    Swal.fire("❌ Error", "An error occurred while deleting. Please try again.", "error");
                }
            });
        };

        const cancelEditing = () => {
            setEditingBudgetId(null);
            setEditCategory("");
            setEditAmount("");
        };

        // =========================
        //  CATEGORY EDIT/DELETE
        // =========================
        const startEditingCategory = (index, currentName) => {
            setEditingCategoryIndex(index);
            setEditCategoryValue(currentName);
        };

        const handleSaveCategory = async (index) => {
            const newName = editCategoryValue.trim();
            if (!newName) {
                Swal.fire({
                    title: "⚠️ Invalid Category!",
                    text: "Category name must be non-empty.",
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const oldName = categories[index];
            if (newName !== oldName && categories.includes(newName)) {
                Swal.fire({
                    title: "⚠️ Duplicate Category!",
                    text: `"${newName}" already exists. Category name must be unique.`,
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            try {
                const token = await auth.currentUser.getIdToken();
                // 1. Update categories in Firestore
                const updatedCategories = [...categories];
                updatedCategories[index] = newName;

                await axios.put(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories",
                    {categories: updatedCategories},
                    {headers: {Authorization: `Bearer ${token}`}}
                );

                // 2. Update budget and expenses where category was used
                await axios.put(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets/updateCategory",
                    {oldCategory: oldName, newCategory: newName},
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                await axios.put(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses/updateCategory",
                    {oldCategory: oldName, newCategory: newName},
                    {headers: {Authorization: `Bearer ${token}`}}
                );

                // 3. Update the frontend state after successful backend update
                setCategories(updatedCategories);
                fetchBudgets();
                fetchExpenses();

                Swal.fire({
                    title: "✅ Category Updated!",
                    text: `Renamed "${oldName}" to "${newName}" in all budgets and expenses.`,
                    icon: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#28a745",
                });

                setEditingCategoryIndex(null);
                setEditCategoryValue("");
            } catch (error) {
                console.error("Error updating category:", error);
                Swal.fire({
                    title: "❌ Error!",
                    text: "An error occurred while updating the category. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
            }
        };

        const updateCategoriesBackend = async (updatedCategories) => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                await axios.put(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories",
                    {categories: updatedCategories},
                    {headers: {Authorization: `Bearer ${token}`}}
                );
            } catch (error) {
                console.error("Error updating categories in backend:", error);
            }
        };

        const handleCancelEditCategory = () => {
            setEditingCategoryIndex(null);
            setEditCategoryValue("");
        };

        const handleDeleteCategory = async (index) => {
            const categoryToDelete = categories[index].trim().toLowerCase();
            const associatedBudgets = budgets.filter(
                (b) => b.category.trim().toLowerCase() === categoryToDelete
            );
            const associatedExpenses = expenses.filter(
                (exp) => exp.category.trim().toLowerCase() === categoryToDelete
            );

            let swalOptions;
            if (associatedBudgets.length > 0 || associatedExpenses.length > 0) {
                swalOptions = {
                    title: "🗑️ Delete Category?",
                    html: `
            <p style="font-size: 16px;">
                Do you want to delete the "<strong>${categoryToDelete}</strong>" category only,
                or delete it along with all associated budgets and expenses?
            </p>`,
                    icon: "warning",
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: "Delete Category Only",
                    denyButtonText: "Delete Category & Data",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#ff4d4f",
                    denyButtonColor: "#007acc",
                    cancelButtonColor: "#007acc",
                };
            } else {
                swalOptions = {
                    title: "🗑️ Delete Category?",
                    text: `Do you want to delete the "${categoryToDelete}" category?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Delete Category",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#ff4d4f",
                    cancelButtonColor: "#007acc",
                };
            }

            Swal.fire(swalOptions).then(async (result) => {
                if (!result.isConfirmed && !result.isDenied) return;
                try {
                    const token = await auth.currentUser.getIdToken();
                    // If user chooses to delete budgets & expenses as well
                    if (result.isDenied) {
                        try {
                            await axios.delete(
                                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets/byCategory/${encodeURIComponent(categoryToDelete)}`,
                                {headers: {Authorization: `Bearer ${token}`}}
                            );
                            await axios.delete(
                                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/expenses/byCategory/${encodeURIComponent(categoryToDelete)}`,
                                {headers: {Authorization: `Bearer ${token}`}}
                            );
                        } catch (err) {
                            console.error("Error deleting budgets/expenses:", err);
                            Swal.fire("❌ Error", "Failed to delete budgets/expenses. Try again.", "error");
                            return;
                        }
                    }

                    // Delete the category in Firestore
                    const updatedCategories = categories.filter((_, i) => i !== index);
                    await axios.put(
                        "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories",
                        {categories: updatedCategories},
                        {headers: {Authorization: `Bearer ${token}`}}
                    );

                    // Update UI
                    setCategories(updatedCategories);
                    fetchBudgets();
                    fetchExpenses();
                    setEditingCategoryIndex(null);
                    setEditCategoryValue("");

                    Swal.fire({
                        title: "✅ Category Deleted!",
                        html: `<p style="font-size: 16px; color: #28a745;">
                    The category "<strong>${categoryToDelete}</strong>" and all related data have been deleted.
                </p>`,
                        icon: "success",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#28a745",
                    });
                } catch (error) {
                    console.error("Error deleting category:", error);
                    Swal.fire({
                        title: "❌ Error!",
                        text: "An error occurred while deleting the category. Please try again.",
                        icon: "error",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#ff4d4f",
                    });
                }
            });
        };
    // ---------------------------
    // Joyride Callback for Auto-Advancing
    // ---------------------------
    const handleJoyrideCallback = (data) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
            setRunGuide(false);
        }
    };

        // =========================
        //  DELETE ALL BUDGETS & CATEGORIES
        // =========================
        const deleteAllBudgets = async () => {
            const confirmDelete = await Swal.fire({
                title: "Are you sure?",
                text: "This will permanently delete all your budgets.",
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
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/budgets/delete-all",
                    {
                        headers: {Authorization: `Bearer ${token}`},
                    }
                );

                Swal.fire("Deleted!", "All your budgets have been removed successfully.", "success");
                setExpenses([])
                fetchBudgets();

            } catch (error) {
                console.error("Error deleting budgets:", error);
                Swal.fire("Error", "Failed to delete budgets. Please try again.", "error");
            }
        };

        const deleteAllCategories = async () => {
            const confirmDelete = await Swal.fire({
                title: "Are you sure?",
                text: "This will permanently delete all your categories.",
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
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/categories/delete-all",
                    {
                        headers: {Authorization: `Bearer ${token}`},
                    }
                );

                Swal.fire("Deleted!", "All your categories have been removed successfully.", "success");
                setCategories([])
                fetchCategories();
            } catch (error) {
                console.error("Error deleting categories:", error);
                Swal.fire("Error", "Failed to delete categories. Please try again.", "error");
            }
        };

        // =========================
        //  MISC
        // =========================
        const resetForm = () => {
            setSelectedCategory("");
            setCustomCategory("");
            setBudgetAmount("");
        };

        const monthString = formatToYearMonth(selectedMonth);
        const filteredBudgets = budgets.filter(
            (b) => b.month === monthString && (selectedFilterCategory === "" || b.category === selectedFilterCategory)
        );

        return (
            <div className="expense-tracker">
                <Navbar/>
                {/* Interactive Guide using react-joyride */}
                <Joyride
                    steps={budgetGuideSteps}
                    run={runGuide}
                    stepIndex={stepIndex}
                    continuous
                    showSkipButton
                    disableBeacon
                    callback={handleJoyrideCallback}
                    styles={{ options: { zIndex: 10000 } }}
                />

                <h2 className="budget-tracker-title">Budget Tracker</h2>
                <p className="budget-tracker-description">
                    Plan and manage your budgets effectively for each category.
                </p>
                <div className="floating-help-button" onClick={() => {
                    setStepIndex(0);
                    setRunGuide(true);
                }}>
                    <FaQuestionCircle className="help-icon"/>
                </div>


                {/* Budget Form */}
                <div className="budget-tracker-form">
                    {/* Category Selection */}
                    <label className="form-label">
                        Select a Category:
                        <small className="form-description">
                            Choose a category to set a budget.
                        </small>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="budget-tracker-input"
                        >
                            <option value="">Select a category</option>
                            {sortedCategories.map((cat, i) => (
                                <option key={i} value={cat}>
                                    {cat}
                                </option>
                            ))}
                            <option value="Other">Other</option>
                        </select>
                    </label>

                    {/* Custom Category Field (Only if "Other" is selected) */}
                    {selectedCategory === "Other" && (
                        <label className="form-label">
                            Custom Category:
                            <small className="form-description">
                                Define a new category if none of the existing ones apply.
                            </small>
                            <input
                                type="text"
                                placeholder="e.g., Entertainment"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="budget-tracker-input"
                            />
                        </label>
                    )}

                    {/* Budget Amount Input with Comma Formatting */}
                    <label className="form-label">
                        Budget Amount {getCurrencySymbol(currency)}:
                        <small className="form-description">Enter the budget amount for this category.</small>
                        <input
                            type="text"
                            placeholder="e.g., 5,000"
                            value={budgetAmount.toLocaleString()} // Format with commas
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/,/g, ""); // Remove commas for internal storage
                                if (!isNaN(rawValue) && rawValue !== "") {
                                    setBudgetAmount(Number(rawValue)); // Convert back to a number
                                } else {
                                    setBudgetAmount(""); // Clear if invalid
                                }
                            }}
                            className="budget-tracker-input"
                        />
                    </label>

                    {/* Month Selection (Read-Only) */}
                    <label className="form-label">
                        Month:
                        <small className="form-description">Select which month you want to set a budget for.</small>
                        <input
                            type="month"
                            value={formatToYearMonth(selectedMonth)}
                            readOnly
                            className="budget-tracker-input"
                        />
                    </label>

                    {/* Add Budget Button */}
                    <button onClick={addBudget} className="budget-tracker-button">
                        Add Budget
                    </button>

                    {/* Show "Delete All Budgets" button only if there's at least one budget */}
                    {budgets.length > 0 && (
                        <button onClick={deleteAllBudgets} className="budget-tracker-delete-button">
                            Delete All Budgets
                        </button>
                    )}
                </div>

                {/* Edit Categories */}
                <div className="edit-categories">
                    <h3 className="edit-categories-title">Edit Categories</h3>
                    <div className="edit-categories-container">
                        {sortedCategories.length === 0 ? (
                            <p className="no-categories-message">No categories to show</p>
                        ) : (
                            (showAll ? sortedCategories : sortedCategories.slice(0, 3))
                                .filter((cat) => cat !== "Other")
                                .map((cat, index) => {
                                    const isEditing = editingCategoryIndex === index;
                                    return (
                                        <div className="category-item" key={index}>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        className="category-edit-input"
                                                        value={editCategoryValue}
                                                        onChange={(e) => setEditCategoryValue(e.target.value)}
                                                    />
                                                    <div className="category-buttons">
                                                        <button
                                                            className="save-category-button"
                                                            onClick={() => handleSaveCategory(index)}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="delete-category-button"
                                                            onClick={() => handleDeleteCategory(index)}
                                                        >
                                                            Delete
                                                        </button>
                                                        <button className="cancel-edit-button"
                                                                onClick={handleCancelEditCategory}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="item-container">
                                                    <span className="category-name">{cat}</span>
                                                    <button
                                                        className="edit-categories-button"
                                                        onClick={() => startEditingCategory(index, cat)}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>

                    {/* Show "Show All" & "Delete All Categories" together for consistency */}
                    {categories.length > 3 && (
                        <div className="show-all-delete-all-container">
                            <button className="toggle-show-button" onClick={() => setShowAll((prev) => !prev)}>
                                {showAll ? "Show Less" : "Show All"}
                            </button>
                            {categories.length > 0 && (
                                <button onClick={deleteAllCategories} className="delete-categories-button">
                                    Delete All Categories
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Category Filter */}
                <div className="category-filter">
                    <label className="form-label">
                        Filter by Category:
                        <div className={`select-wrapper ${isDropdownOpen ? "open" : ""}`}>
                            <select
                                value={selectedFilterCategory}
                                onChange={(e) => {
                                    setSelectedFilterCategory(e.target.value);
                                    setIsDropdownOpen(false); // force arrow down on selection
                                }}
                                onMouseDown={() => setIsDropdownOpen(true)}  // arrow flips up
                                onBlur={() => setIsDropdownOpen(false)}      // arrow flips down if blur triggers
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat, i) => (
                                    <option key={i} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </label>
                </div>

                {/* AI Coach */}
                <SmartAICoach budgets={budgets} expenses={expenses}/>

                {/* Month Navigation */}
                <div className="budget-tracker-navigation">
                    <button onClick={() => handleMonthChange("prev")} className="budget-tracker-nav-button">
                        &lt; Prev
                    </button>
                    <span className="budget-tracker-current-month">
          {selectedMonth.toLocaleString("default", {month: "long", year: "numeric"})}
        </span>
                    <button onClick={() => handleMonthChange("next")} className="budget-tracker-nav-button">
                        Next &gt;
                    </button>
                </div>

                {/* Budget List */}
                <div className="budget-tracker-list">
                    {filteredBudgets.map((budget) => (
                        <div key={budget.id} className="budget-tracker-card">
                            {editingBudgetId === budget.id ? (
                                <div className="budget-tracker-edit-card">
                                    <div className="budget-edit-form-fields">
                                        <input
                                            type="text"
                                            value={editCategory}
                                            onChange={(e) => setEditCategory(e.target.value)}
                                            className="budget-edit-input"
                                            placeholder="Edit category"
                                        />
                                        <input
                                            type="text"
                                            value={editAmount.toLocaleString()} // Show formatted number with commas
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/,/g, ""); // Remove commas
                                                if (!isNaN(rawValue) && rawValue !== "") {
                                                    setEditAmount(Number(rawValue)); // Store as number
                                                } else {
                                                    setEditAmount("");
                                                }
                                            }}
                                            className="budget-edit-input"
                                            placeholder="Edit amount"
                                        />
                                        <div id={`budget-${budget.id}`} className="budget-edit-actions">
                                            <button onClick={saveEditedBudget} className="budget-save-button">
                                                Save
                                            </button>
                                            <button onClick={cancelEditing} className="budget-cancel-button">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="budget-details">
                                        <p>
                                            <strong>Category:</strong> {budget.category}
                                        </p>
                                        <p>
                                            <strong>Budget:</strong> {getCurrencySymbol(currency)}
                                            {budget.amount.toLocaleString()}
                                        </p>
                                        <p>
                                            <strong>Month:</strong>{" "}
                                            {new Date(budget.month).toLocaleString("default", {
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="expense-buttons">
                                        <button
                                            onClick={() => startEditingBudget(budget)}
                                            className="edit-button"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteBudget(budget.id)}
                                            className="delete-button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {filteredBudgets.length === 0 && (
                        <p className="no-budgets-message">No budgets set for this month.</p>
                    )}
                </div>
            </div>
        );
};

export default BudgetTracker;
