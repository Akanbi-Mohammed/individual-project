import React, { useContext, useEffect, useState, useRef } from "react";
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
    ResponsiveContainer,
} from "recharts";
import axios from "axios";
import "./analytics.css";
import Navbar from "./navbar";
import { auth } from "./fireBase";
import Calendar from "react-calendar";
import { CurrencyContext } from "./CurrencyContext";
import { getCurrencySymbol } from "./settings";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { parseISO, format } from "date-fns";
import Joyride, { STATUS } from "react-joyride";
import { FaQuestionCircle } from "react-icons/fa";


/**
 * Utility: Formats a Date to "March 2025".
 */
function formatMonthYear(date) {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
}

/**
 * Utility: Returns a short day-of-week, e.g. "Mon".
 */
function getDayOfWeek(dateObj) {
    return dateObj.toLocaleString("default", { weekday: "short" });
}

const AnalyticsPage = () => {
    // -------------------------------------------------------
    // State
    // -------------------------------------------------------
    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [monthlyIncome, setMonthlyIncome] = useState();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [alerts, setAlerts] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [filteredBudgets, setFilteredBudgets] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");

    // For comparing two months
    const [month1, setMonth1] = useState(new Date().toISOString().slice(0, 7));
    const [month2, setMonth2] = useState("");
    const [comparisonData, setComparisonData] = useState([]);
    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");

    // Extended analysis
    const [dailySpendingData, setDailySpendingData] = useState([]);
    const [monthlyHistoryData, setMonthlyHistoryData] = useState([]);
    const [projectedMonthlySpend, setProjectedMonthlySpend] = useState(0);
    const [biggestCategory, setBiggestCategory] = useState(null);
    const [overBudgetCategories, setOverBudgetCategories] = useState([]);
    const [underBudgetCategories, setUnderBudgetCategories] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [incomeExpenseHistory, setIncomeExpenseHistory] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categoryTrendData, setCategoryTrendData] = useState([]);
    const parsed = parseISO(`${selectedMonth}-01`);
    const displayMonth = format(currentMonth, "MMMM yyyy");

    // For PDF export
    const analyticsRef = useRef(null);

    // Currency context
    const { currency } = useContext(CurrencyContext);
    // Weekly monthly daily
    const [activeTab, setActiveTab] = useState("daily");
    // Interactive guide
    const [runGuide, setRunGuide] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    // Define the steps for the Analytics page tutorial
    const analyticsGuideSteps = [
        {
            target: ".page-title",
            content: "Welcome to the Analytics page! Here you can view an overview of your expenses and budgets.",
        },
        {
            target: ".export-bar",
            content: "Use these buttons to print your analytics or export the data as CSV or PDF.",
        },
        {
            target: ".month-nav-bar",
            content: "Navigate between different months using these buttons to review your spending trends.",
        },
        {
            target: ".savings-summary",
            content: "This section gives you a quick snapshot of your monthly income, total expenses, and savings.",
        },
        {
            target: ".chart:nth-of-type(1)",
            content: "Here is the Budgets section where you see your allocated budgets and how much you've spent.",
        },
        {
            target: ".chart:nth-of-type(2)",
            content: "This chart projects your spending for the rest of the month based on current trends.",
        },
        {
            target: ".chart:nth-of-type(3)",
            content: "In Key Insights, you’ll find important highlights like your largest expense category and any over-budget alerts.",
        },
        {
            target: ".tabs-container",
            content: "Switch between Daily, Weekly, Monthly, and Yearly expense breakdowns using these tabs.",
        },
        {
            target: ".chart:nth-of-type(4)",
            content: "Review your Daily Spending Trend here to see your daily expense pattern.",
        },
        {
            target: ".comparison",
            content: "Finally, compare your expenses between two selected months using this comparison tool.",
        },
    ];


    // -------------------------------------------------------
    // useEffects
    // -------------------------------------------------------
    useEffect(() => {
        fetchExpenses();
        fetchBudgets();
        fetchMonthlyIncome();
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchMonthlyIncome();
    }, [currentMonth]);

    useEffect(() => {
        updateFilteredData();
    }, [currentMonth, expenses, budgets]);

    useEffect(() => {
        computeDailySpendingData();
        computeProjection();
        computeInsights();
    }, [filteredExpenses, filteredBudgets]);

    useEffect(() => {
        computeAnomalies();

        computeCategoryTrend();
    }, [expenses, monthlyIncome]);

    useEffect(() => {
        computeMonthlyHistoryData();
    }, [expenses, selectedMonth]);




    // -------------------------------------------------------
    // Fetch Data
    // -------------------------------------------------------
    async function fetchMonthlyIncome() {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const monthKey = currentMonth.toISOString().slice(0, 7);

            const response = await axios.get(
                `https://individual-project-lxa2.onrender.com/t2.run.app/api/user-income?month=${monthKey}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMonthlyIncome(response.data.amount || 0);
        } catch (error) {
            console.error("Error fetching monthly income:", error);
        }
    }

    async function fetchExpenses() {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const response = await axios.get(
                "https://individual-project-lxa2.onrender.com/t2.run.app/api/expenses",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    }

    async function fetchBudgets() {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const response = await axios.get(
                "https://individual-project-lxa2.onrender.com/t2.run.app/api/budgets",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBudgets(response.data);
        } catch (error) {
            console.error("Error fetching budgets:", error);
        }
    }

    async function fetchCategories() {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const response = await axios.get(
                "https://individual-project-lxa2.onrender.com/t2.run.app/api/categories",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200 && response.data) {
                setAllCategories(response.data);
                setSelectedCategory(response.data[0] || "");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }

    // -------------------------------------------------------
    // Filter Data for Current Month & Alerts
    // -------------------------------------------------------
    function updateFilteredData() {
        const monthKey = currentMonth.toISOString().slice(0, 7);
        const monthExpenses = expenses.filter(
            (expense) => expense.date.slice(0, 7) === monthKey
        );
        const monthBudgets = budgets.filter((budget) => budget.month === monthKey);

        setFilteredExpenses(monthExpenses);
        setFilteredBudgets(monthBudgets);
        generateAlerts(monthBudgets, monthExpenses);
    }

    function generateAlerts(monthBudgets, monthExpenses) {
        const alertsData = monthBudgets.map((budget) => {
            const categoryExpenses = monthExpenses
                .filter((expense) => expense.category === budget.category)
                .reduce((sum, expense) => sum + expense.amount, 0);

            if (categoryExpenses > budget.amount) {
                return `Warning: ${budget.category} exceeded its budget by ${(
                    categoryExpenses - budget.amount
                ).toFixed(2)}.`;
            } else if (categoryExpenses > budget.amount * 0.8) {
                return `Alert: ${budget.category} is nearing its budget limit.`;
            }
            return null;
        });

        setAlerts(alertsData.filter(Boolean));
    }

    // -------------------------------------------------------
    // Summaries & Computations
    // -------------------------------------------------------
    // (A) Summaries for current month
    const pieChartData = filteredExpenses.reduce((acc, expense) => {
        const existingCategory = acc.find((item) => item.name === expense.category);
        if (existingCategory) {
            existingCategory.amountSpent += expense.amount;
        } else {
            acc.push({ name: expense.category, amountSpent: expense.amount });
        }
        return acc;
    }, []);

    const totalExpenses = pieChartData.reduce((acc, item) => acc + item.amountSpent, 0);
    const totalBudgets = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);
    const savings = monthlyIncome - totalBudgets;

    const topCategories = [...pieChartData]
        .sort((a, b) => b.amountSpent - a.amountSpent)
        .slice(0, 3);

    // Overall budget utilization
    const spendingCapacity = totalBudgets ? Math.max(((totalBudgets - totalExpenses) / totalBudgets) * 100, 0) : 0;


    // (B) Daily Spending Trend
    function computeDailySpendingData() {
        const dayMap = {};
        filteredExpenses.forEach((exp) => {
            const dateStr = exp.date; // "YYYY-MM-DD"
            if (!dayMap[dateStr]) {
                dayMap[dateStr] = 0;
            }
            dayMap[dateStr] += exp.amount;
        });
        const sortedDates = Object.keys(dayMap).sort();
        const dailyData = sortedDates.map((dateStr) => ({
            date: dateStr,
            amount: dayMap[dateStr],
        }));
        setDailySpendingData(dailyData);
    }


    function computeMonthlyHistoryData() {
        const monthMap = {};

        // 1) Build map of "YYYY-MM" -> total expense
        expenses.forEach((exp) => {
            const mKey = exp.date.slice(0, 7); // "YYYY-MM"
            if (!monthMap[mKey]) {
                monthMap[mKey] = 0;
            }
            monthMap[mKey] += exp.amount;
        });

        // 2) Convert to sorted array of objects
        const sortedMonths = Object.keys(monthMap).sort();
        let monthlyData = sortedMonths.map((m) => ({
            month: m,
            totalExpenses: monthMap[m],
        }));

        // 3) Filter by range if both start and end months are chosen
        if (startMonth && endMonth) {
            monthlyData = monthlyData.filter(
                (item) => item.month >= startMonth && item.month <= endMonth
            );
        }

        setMonthlyHistoryData(monthlyData);
    }
    const handlePrevMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };


    // (D) Projected Monthly Spend
    function computeProjection() {
        const daysSoFar = new Date().getDate();
        if (daysSoFar === 0) {
            setProjectedMonthlySpend(0);
            return;
        }
        const averageDaily = totalExpenses / daysSoFar;
        const totalDaysInMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
        ).getDate();
        const projection = averageDaily * totalDaysInMonth;
        setProjectedMonthlySpend(projection);
    }

    // (E) Key Insights
    function computeInsights() {
        if (pieChartData.length === 0) {
            setBiggestCategory(null);
        } else {
            const sorted = [...pieChartData].sort((a, b) => b.amountSpent - a.amountSpent);
            setBiggestCategory(sorted[0]);
        }

        const overs = [];
        const unders = [];
        filteredBudgets.forEach((budget) => {
            const spent = filteredExpenses
                .filter((exp) => exp.category === budget.category)
                .reduce((sum, exp) => sum + exp.amount, 0);

            if (spent > budget.amount) {
                overs.push(budget.category);
            } else {
                unders.push(budget.category);
            }
        });
        setOverBudgetCategories(overs);
        setUnderBudgetCategories(unders);
    }

    // (F) Anomalies / Outliers
    function computeAnomalies() {
        const monthMap = {};
        expenses.forEach((exp) => {
            const mKey = exp.date.slice(0, 7);
            if (!monthMap[mKey]) {
                monthMap[mKey] = 0;
            }
            monthMap[mKey] += exp.amount;
        });

        const allMonths = Object.keys(monthMap);
        if (allMonths.length === 0) {
            setAnomalies([]);
            return;
        }
        const total = Object.values(monthMap).reduce((acc, val) => acc + val, 0);
        const avg = total / allMonths.length;

        // Mark anomaly if > 20% above average
        const threshold = avg * 1.2;
        const flagged = allMonths
            .filter((m) => monthMap[m] > threshold)
            .map((m) => ({
                month: m,
                totalSpent: monthMap[m],
            }));
        setAnomalies(flagged);
    }


    // (H) Category Trend Over Multiple Months
    function computeCategoryTrend() {
        if (!selectedCategory) {
            setCategoryTrendData([]);
            return;
        }
        const catMap = {};
        expenses
            .filter((exp) => exp.category === selectedCategory)
            .forEach((exp) => {
                const mKey = exp.date.slice(0, 7);
                if (!catMap[mKey]) {
                    catMap[mKey] = 0;
                }
                catMap[mKey] += exp.amount;
            });

        const sortedMonths = Object.keys(catMap).sort();
        const trend = sortedMonths.map((m) => ({
            month: m,
            amountSpent: catMap[m],
        }));
        setCategoryTrendData(trend);
    }

    // -------------------------------------------------------
    // Day/Week/Month/Year Breakdowns for the Tabs
    // -------------------------------------------------------

    // 1) Daily: Just "today"
    function getDailyBreakdown() {
        const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
        return expenses.filter((exp) => exp.date === todayStr);
    }

    // 2) Weekly: group by date for the current week
    function getWeeklyBreakdown() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sunday, 1=Mon, ...
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        const startTime = startOfWeek.getTime();
        const endTime = now.getTime();

        // Filter for this week's range
        const weekly = expenses.filter((exp) => {
            const expTime = new Date(exp.date).getTime();
            return expTime >= startTime && expTime <= endTime;
        });

        // Group by date
        const grouped = {};
        weekly.forEach((exp) => {
            const key = exp.date; // "YYYY-MM-DD"
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(exp);
        });
        return grouped; // e.g. { "2025-03-12": [exp1, exp2], ... }
    }

    // 3) Monthly: group by date for the current month
    function getMonthlyBreakdown() {
        const now = new Date();
        const currentMonthStr = now.toISOString().slice(0, 7);
        const monthly = expenses.filter((exp) => exp.date.slice(0, 7) === currentMonthStr);

        const grouped = {};
        monthly.forEach((exp) => {
            const key = exp.date; // "YYYY-MM-DD"
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(exp);
        });
        return grouped;
    }

    // 4) Yearly: group by month for the current year
    function getYearlyBreakdown() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const yearly = expenses.filter(
            (exp) => new Date(exp.date).getFullYear() === currentYear
        );

        const grouped = {};
        yearly.forEach((exp) => {
            const monthKey = exp.date.slice(0, 7); // "YYYY-MM"
            if (!grouped[monthKey]) grouped[monthKey] = [];
            grouped[monthKey].push(exp);
        });
        return grouped;
    }

    // -------------------------------------------------------
    // Compare Two Months
    // -------------------------------------------------------
    function handleCompareMonths() {
        if (!month1 || !month2) {
            alert("Please select both months for comparison.");
            return;
        }

        const expensesMonth1 = expenses.filter(
            (expense) => expense.date.slice(0, 7) === month1
        );
        const expensesMonth2 = expenses.filter(
            (expense) => expense.date.slice(0, 7) === month2
        );

        function aggregate(arr) {
            return arr.reduce((acc, expense) => {
                const existing = acc.find((item) => item.category === expense.category);
                if (existing) {
                    existing.amountSpent += expense.amount;
                } else {
                    acc.push({ category: expense.category, amountSpent: expense.amount });
                }
                return acc;
            }, []);
        }

        const aggregated1 = aggregate(expensesMonth1);
        const aggregated2 = aggregate(expensesMonth2);

        const combined = [
            ...new Set([
                ...aggregated1.map((i) => i.category),
                ...aggregated2.map((i) => i.category),
            ]),
        ].map((cat) => ({
            category: cat,
            [month1]: aggregated1.find((x) => x.category === cat)?.amountSpent || 0,
            [month2]: aggregated2.find((x) => x.category === cat)?.amountSpent || 0,
        }));

        setComparisonData(combined);
    }

    // -------------------------------------------------------
    // Calendar Day Click
    // -------------------------------------------------------
    function handleDateClick(date) {
        setSelectedDate(date);
        const dateString = date.toISOString().split("T")[0];
        setDailyExpenses(expenses.filter((exp) => exp.date === dateString));
    }

    // -------------------------------------------------------
    // Export / Print
    // -------------------------------------------------------
    function handlePrint() {
        window.print();
    }

    function handleExportCSV() {
        if (!expenses || expenses.length === 0) {
            alert("No expense data to export!");
            return;
        }
        const headers = ["id", "date", "category", "amount", "description"];
        const csvRows = [headers.join(",")];

        expenses.forEach((exp) => {
            const row = [exp.id, exp.date, exp.category, exp.amount, exp.description || ""];
            csvRows.push(row.join(","));
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "expenses.csv";
        link.click();
        window.URL.revokeObjectURL(url);
    }

    async function handleExportPDF() {
        if (!analyticsRef.current) return;
        try {
            const canvas = await html2canvas(analyticsRef.current);
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "pt", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("analytics.pdf");
        } catch (err) {
            console.error("Error exporting PDF:", err);
        }
    }

    const handleJoyrideCallback = (data) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
            setRunGuide(false);
        }
    };


    // -------------------------------------------------------
    // Render
    // -------------------------------------------------------
    const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];

    // Prepare breakdown data for each tab
    const dailyBreakdown = getDailyBreakdown(); // array of today's expenses
    const weeklyBreakdown = getWeeklyBreakdown(); // object grouped by date
    const monthlyBreakdown = getMonthlyBreakdown(); // object grouped by date
    const yearlyBreakdown = getYearlyBreakdown(); // object grouped by "YYYY-MM"

    // Helper: sums up an array of expenses
    function sumExpenses(arr) {
        return arr.reduce((acc, e) => acc + e.amount, 0);
    }

    return (
        <div className="expense-tracker" ref={analyticsRef}>
            <Navbar/>
            {/* Interactive Guide using react-joyride */}
            <Joyride
                steps={analyticsGuideSteps}
                run={runGuide}
                stepIndex={stepIndex}
                continuous
                showSkipButton
                disableBeacon
                callback={handleJoyrideCallback}
                styles={{ options: { zIndex: 10000 } }}
            />

            <h2 className="page-title">Analytics</h2>
            <div className="floating-help-button" onClick={() => {
                setStepIndex(0);
                setRunGuide(true);
            }}>
                <FaQuestionCircle className="help-icon"/>
            </div>


            {/* Export / Print Buttons */}
            <div className="export-bar">
                <div className="export-buttons">
                    <button className="btn" onClick={handlePrint}>
                        Print
                    </button>
                    <button className="btn" onClick={handleExportCSV}>
                        Export CSV
                    </button>
                    <button className="btn" onClick={handleExportPDF}>
                        Export PDF
                    </button>
                </div>
            </div>



            {/* Month Navigation */}
            <div className="month-nav-bar">
                <button className="btn" onClick={handlePrevMonth}>
                    &lt; Previous
                </button>
                <span className="current-month">{formatMonthYear(currentMonth)}</span>
                <button className="btn" onClick={handleNextMonth}>
                    Next &gt;
                </button>
            </div>

            {/* Savings Summary */}
            <div className="savings-summary">
                <h3 className="savings-title">💰 Savings Summary</h3>
                <p className="description">
                    A quick overview of your monthly income, total expenses, allocated budgets,
                    and how much you're effectively saving for the current month.
                </p>
                <div className="savings-card">
                    <div className="savings-item">
                        <i className="fas fa-wallet"></i>
                        <span className="savings-label">Monthly Income:</span>
                        <span className="savings-value">
              {getCurrencySymbol(currency)}
                            {monthlyIncome.toLocaleString()}
            </span>
                    </div>
                    <div className="savings-item">
                        <i className="fas fa-money-bill-wave"></i>
                        <span className="savings-label">Total Expenses:</span>
                        <span className="savings-value">
              {getCurrencySymbol(currency)}
                            {totalExpenses.toLocaleString()}
            </span>
                    </div>
                    <div className="savings-item">
                        <i className="fas fa-chart-pie"></i>
                        <span className="savings-label">Total Budget Allocations:</span>
                        <span className="savings-value">
              {getCurrencySymbol(currency)}
                            {totalBudgets.toLocaleString()}
            </span>
                    </div>
                    <div className="savings-item savings-highlight">
                        <i className="fas fa-piggy-bank"></i>
                        <span className="savings-label">Savings:</span>
                        <span className="savings-value">
              {getCurrencySymbol(currency)}
                            {savings.toLocaleString()}
            </span>
                    </div>
                </div>
            </div>

            {/* Budgets */}
            <div className="chart">
                <h3>Budgets</h3>
                <p className="description">
                    This table shows your monthly budget for each category, how much you've spent,
                    and how much remains.
                </p>
                {filteredBudgets.length === 0 ? (
                    <p>No budgets found for this month.</p>
                ) : (
                    <table className="category-breakdown">
                        <thead>
                        <tr>
                            <th>Category</th>
                            <th>Budget ({getCurrencySymbol(currency)})</th>
                            <th>Spent ({getCurrencySymbol(currency)})</th>
                            <th>Remaining ({getCurrencySymbol(currency)})</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredBudgets.map((budget) => {
                            const spent = filteredExpenses
                                .filter((exp) => exp.category === budget.category)
                                .reduce((sum, exp) => sum + exp.amount, 0);
                            return (
                                <tr key={budget.category}>
                                    <td>{budget.category}</td>
                                    <td>
                                        {getCurrencySymbol(currency)}
                                        {budget.amount.toLocaleString()}
                                    </td>
                                    <td>
                                        {getCurrencySymbol(currency)}
                                        {spent.toLocaleString()}
                                    </td>
                                    <td style={{color: spent > budget.amount ? "red" : "green"}}>
                                        {getCurrencySymbol(currency)}
                                        {(budget.amount - spent).toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Projected Monthly Spend */}
            <div className="chart">
                <h3>🔮 Projected Monthly Spend</h3>
                <p className="description">
                    Estimate how much you might spend by the end of this month, based on current
                    trends.
                </p>
                <p>
                    Based on your spending so far, you are projected to spend{" "}
                    <strong>
                        {getCurrencySymbol(currency)}
                        {projectedMonthlySpend.toLocaleString()}
                    </strong>{" "}
                    this month.
                </p>
            </div>

            {/* Key Insights */}
            {(biggestCategory ||
                overBudgetCategories.length > 0 ||
                underBudgetCategories.length > 0) ? (
                <div className="chart">
                    <h3>💡 Key Insights</h3>
                    <p className="description">
                        A quick breakdown of where your money is going, highlighting your largest
                        expense category and any budgets that need attention.
                    </p>
                    {biggestCategory && (
                        <p>
                            <strong>📊 Largest Expense:</strong> Your biggest spending category so far is{" "}
                            <strong>{biggestCategory.name}</strong>, with a total of{" "}
                            {getCurrencySymbol(currency)}
                            {biggestCategory.amountSpent.toFixed(2)} spent.
                        </p>
                    )}
                    {overBudgetCategories.length > 0 && (
                        <p>
                            <strong>⚠️ Over Budget:</strong> You've exceeded your budget in the following
                            categories: {overBudgetCategories.join(", ")}.
                        </p>
                    )}
                    {underBudgetCategories.length > 0 && (
                        <p>
                            <strong>💰 Savings Opportunity:</strong> You're under budget in these
                            categories: {underBudgetCategories.join(", ")}.
                        </p>
                    )}
                </div>
            ) : (
                <div className="chart">
                    <h3>💡 Key Insights</h3>
                    <p className="description">No expense insights available yet.</p>
                </div>
            )}

            {/* Top 3 Expense Categories */}
            <div className="chart">
                <h3>🏆 Top 3 Expense Categories</h3>
                <p className="description">
                    A quick look at the categories where you spent the most in {displayMonth}.
                </p>
                <div style={{display: "flex", justifyContent: "center"}}>
                    {topCategories.length === 0 ? (
                        <p>No expenses recorded yet.</p>
                    ) : (
                        <ResponsiveContainer width={400} height={250}>
                            <BarChart data={topCategories}>
                                <XAxis dataKey="name" stroke="#333"/>
                                <YAxis stroke="#333"/>
                                <Tooltip/>
                                <Legend/>
                                <Bar dataKey="amountSpent" minBarSize={10}>
                                    {topCategories.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]}/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="chart">
                <h3>📈 Spending Capacity</h3>
                <p className="description">How much of your total budget is left in {displayMonth}</p>
                <div className="progress-bar-container">
                    <div
                        className="progress-bar"
                        style={{
                            width: `${spendingCapacity}%`,
                            backgroundColor:
                                spendingCapacity < 20
                                    ? "red"
                                    : spendingCapacity < 50
                                        ? "orange"
                                        : "green",
                        }}
                        title={`${spendingCapacity.toFixed(2)}% Remaining`}
                    ></div>
                </div>
                <p className="utilization-text">{spendingCapacity.toFixed(2)}% Remaining</p>
            </div>

            {/*
        TABBED BREAKDOWN:
        "Daily", "Weekly", "Monthly", "Yearly"
      */}
            <div className="chart">
                <h3>Expense Breakdown</h3>
                <p className="description">
                    View your <strong>Daily</strong>, <strong>Weekly</strong>,{" "}
                    <strong>Monthly</strong>, and <strong>Yearly</strong> expenses in a sleek,
                    card-based layout.
                </p>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab-button ${activeTab === "daily" ? "active" : ""}`}
                        onClick={() => setActiveTab("daily")}
                    >
                        Daily
                    </button>
                    <button
                        className={`tab-button ${activeTab === "weekly" ? "active" : ""}`}
                        onClick={() => setActiveTab("weekly")}
                    >
                        Weekly
                    </button>
                    <button
                        className={`tab-button ${activeTab === "monthly" ? "active" : ""}`}
                        onClick={() => setActiveTab("monthly")}
                    >
                        Monthly
                    </button>
                    <button
                        className={`tab-button ${activeTab === "yearly" ? "active" : ""}`}
                        onClick={() => setActiveTab("yearly")}
                    >
                        Yearly
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* 1) DAILY */}
                    {activeTab === "daily" && (
                        <div className="tab-panel">
                            <h4>Today’s Total:
                                {` ${getCurrencySymbol(currency)}${sumExpenses(dailyBreakdown).toFixed(2)}`}
                            </h4>
                            {dailyBreakdown.length === 0 ? (
                                <p>No expenses recorded today.</p>
                            ) : (
                                <div className="card-grid">
                                    {dailyBreakdown.map((exp) => (
                                        <div className="card" key={exp.id}>
                                            <div className="card-header">{exp.category}</div>
                                            <div className="card-body">
                                                <p>Description: {exp.description || "—"}</p>
                                                <p>
                                                    Amount: {getCurrencySymbol(currency)}
                                                    {exp.amount.toLocaleString()}
                                                </p>
                                                <p>Date: {exp.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2) WEEKLY */}
                    {activeTab === "weekly" && (
                        <div className="tab-panel">
                            {/* Sum all expenses in weeklyBreakdown */}
                            <h4>
                                This Week’s Total:{" "}
                                {getCurrencySymbol(currency)}
                                {Object.values(weeklyBreakdown).reduce(
                                    (sum, arr) => sum + sumExpenses(arr),
                                    0
                                ).toFixed(2)}
                            </h4>
                            {Object.keys(weeklyBreakdown).length === 0 ? (
                                <p>No expenses recorded this week.</p>
                            ) : (
                                <div className="card-grid">
                                    {Object.keys(weeklyBreakdown)
                                        .sort()
                                        .map((dateStr) => {
                                            const dailyArr = weeklyBreakdown[dateStr];
                                            return (
                                                <div className="card" key={dateStr}>
                                                    <div className="card-header">
                                                        {getDayOfWeek(new Date(dateStr))}, {dateStr}
                                                    </div>
                                                    <div className="card-body">
                                                        {dailyArr.map((exp) => (
                                                            <div key={exp.id} className="expense-item">
                                                                <strong>{exp.category}</strong> - {exp.description} -{" "}
                                                                {getCurrencySymbol(currency)}
                                                                {exp.amount}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3) MONTHLY */}
                    {activeTab === "monthly" && (
                        <div className="tab-panel">
                            <h4>
                                This Month’s Total:{" "}
                                {getCurrencySymbol(currency)}
                                {Object.values(monthlyBreakdown).reduce(
                                    (sum, arr) => sum + sumExpenses(arr),
                                    0
                                ).toFixed(2)}
                            </h4>
                            {Object.keys(monthlyBreakdown).length === 0 ? (
                                <p>No expenses recorded this month.</p>
                            ) : (
                                <div className="card-grid">
                                    {Object.keys(monthlyBreakdown)
                                        .sort()
                                        .map((dateStr) => {
                                            const dailyArr = monthlyBreakdown[dateStr];
                                            return (
                                                <div className="card" key={dateStr}>
                                                    <div className="card-header">{dateStr}</div>
                                                    <div className="card-body">
                                                        {dailyArr.map((exp) => (
                                                            <div key={exp.id} className="expense-item">
                                                                <strong>{exp.category}</strong> - {exp.description} -{" "}
                                                                {getCurrencySymbol(currency)}
                                                                {exp.amount}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4) YEARLY */}
                    {activeTab === "yearly" && (
                        <div className="tab-panel">
                            <h4>
                                This Year’s Total:{" "}
                                {getCurrencySymbol(currency)}
                                {Object.values(yearlyBreakdown).reduce(
                                    (sum, arr) => sum + sumExpenses(arr),
                                    0
                                ).toFixed(2)}
                            </h4>
                            {Object.keys(yearlyBreakdown).length === 0 ? (
                                <p>No expenses recorded this year.</p>
                            ) : (
                                <div className="card-grid">
                                    {Object.keys(yearlyBreakdown)
                                        .sort()
                                        .map((monthKey) => {
                                            const monthlyArr = yearlyBreakdown[monthKey];
                                            return (
                                                <div className="card" key={monthKey}>
                                                    <div className="card-header">{monthKey}</div>
                                                    <div className="card-body">
                                                        {monthlyArr.map((exp) => (
                                                            <div key={exp.id} className="expense-item">
                                                                <strong>{exp.category}</strong> - {exp.description} -{" "}
                                                                {getCurrencySymbol(currency)}
                                                                {exp.amount}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar for Daily Expenses */}
            <div
                style={{
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                    textAlign: "center",
                    marginTop: "1rem",
                }}
            >
                <h3>📅 Expense Calendar</h3>
                <p className="description">
                    Click on a date to see the expenses for that specific day.
                </p>
                <Calendar onClickDay={handleDateClick} showNeighboringMonth={false}/>
                {dailyExpenses.length > 0 ? (
                    <ul style={{listStyle: "none", padding: "10px", textAlign: "left"}}>
                        {dailyExpenses.map((exp) => (
                            <li
                                key={exp.id}
                                style={{
                                    background: "#f4f4f4",
                                    padding: "8px",
                                    borderRadius: "5px",
                                    margin: "5px 0",
                                }}
                            >
                                <strong>{exp.category}</strong> ({exp.description}):{" "}
                                {getCurrencySymbol(currency)}
                                {exp.amount.toLocaleString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No expenses for this date.</p>
                )}
            </div>

            {/* Compare Two Months */}
            <div className="comparison">
                <h3>Compare Expenses Between Two Months</h3>
                <p className="description">
                    Choose two different months to see how your spending differs by category.
                </p>
                <div className="comparison-inputs">
                    <label>
                        Select First Month:
                        <input type="month" value={month1} onChange={(e) => setMonth1(e.target.value)}/>
                    </label>
                    <label>
                        Select Second Month:
                        <input type="month" value={month2} onChange={(e) => setMonth2(e.target.value)}/>
                    </label>
                </div>
                <button className="compare-btn" onClick={handleCompareMonths}>
                    Compare
                </button>
            </div>
            {/* Comparison Result Chart */}
            {comparisonData.length > 0 && (
                <div className="chart">
                    <h3>Monthly Comparison</h3>
                    <p className="description">
                        This line chart compares the total spent in each category between the two
                        selected months.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={comparisonData}>
                            <XAxis dataKey="category"/>
                            <YAxis/>
                            <Tooltip/>
                            <Legend/>
                            <Line
                                type="monotone"
                                dataKey={month1}
                                stroke="#36A2EB"
                                name={`Expenses (${month1})`}
                            />
                            <Line
                                type="monotone"
                                dataKey={month2}
                                stroke="#FF6384"
                                name={`Expenses (${month2})`}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}


            {/* Daily Spending Trend */}
            {dailySpendingData.length > 0 ? (
                <div className="chart">
                    <h3>📈 Daily Spending Trend</h3>
                    <p className="description">
                        Track your daily spending pattern for {displayMonth}.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailySpendingData}>
                            <XAxis dataKey="date"
                                   tickFormatter={(dateStr) => {
                                       const parsedDate = parseISO(dateStr);
                                       return format(parsedDate, "MMM d");
                                   }}/>
                            <YAxis/>
                            <Tooltip/>
                            <Legend/>
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#82ca9d"
                                name="Daily Spend"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="chart">
                    <h3>📈 Daily Spending Trend</h3>
                    <p className="description">No data yet for daily spending.</p>
                </div>
            )}

            <div className="date-range-container">
                <label htmlFor="start-month">Start Month:</label>
                <input
                    type="month"
                    id="start-month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                />

                <label htmlFor="end-month">End Month:</label>
                <input
                    type="month"
                    id="end-month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                />
            </div>


            {/* Monthly Historical Comparison Chart */}
            {monthlyHistoryData.length > 0 ? (
                <div className="chart">
                    <h3>📅 Monthly Historical Comparison</h3>
                    <p className="description">
                        See how this month’s total expenses compare to previous months.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyHistoryData}>
                            <XAxis dataKey="month"/>
                            <YAxis/>
                            <Tooltip/>
                            <Legend/>
                            <Bar dataKey="totalExpenses" fill="#8884d8" name="Total Expenses"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="chart">
                    <h3>📅 Monthly Historical Comparison</h3>
                    <p className="description">No data yet for historical comparison.</p>
                </div>
            )}


            {/* Anomalies / Outliers */}
            <div className="chart">
                <h3>⚠️ Anomalies / Outliers</h3>
                <p className="description">
                    We flag any month that exceeds 120% of your average monthly spending.
                </p>
                {anomalies.length > 0 ? (
                    <ul style={{listStyle: "none"}}>
                        {anomalies.map((item) => (
                            <li key={item.month} style={{color: "red"}}>
                                🚩 {item.month}: {getCurrencySymbol(currency)}
                                {item.totalSpent.toFixed(2)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No anomalies found.</p>
                )}
            </div>

            {/*/!* Income vs. Expense Over Time *!/*/}
            {/*<div className="chart">*/}
            {/*    <h3>💸 Income vs. Expense Over Time</h3>*/}
            {/*    <p className="description">*/}
            {/*        Compare your monthly income against your total monthly expenses.*/}
            {/*    </p>*/}
            {/*    {incomeExpenseHistory.length > 0 ? (*/}
            {/*        <ResponsiveContainer width="100%" height={300}>*/}
            {/*            <LineChart data={incomeExpenseHistory}>*/}
            {/*                <XAxis dataKey="month" />*/}
            {/*                <YAxis />*/}
            {/*                <Tooltip />*/}
            {/*                <Legend />*/}
            {/*                <Line type="monotone" dataKey="income" stroke="#4caf50" name="Income" />*/}
            {/*                <Line type="monotone" dataKey="expense" stroke="#f44336" name="Expense" />*/}
            {/*            </LineChart>*/}
            {/*        </ResponsiveContainer>*/}
            {/*    ) : (*/}
            {/*        <p>No data yet.</p>*/}
            {/*    )}*/}
            {/*</div>*/}

            {/*/!* Category Trend Over Multiple Months *!/*/}
            {/*<div className="chart">*/}
            {/*    <h3>📈 Category Trend Over Time</h3>*/}
            {/*    <p className="description">*/}
            {/*        Select a category to see how your spending changes month to month.*/}
            {/*    </p>*/}
            {/*    {allCategories.length === 0 ? (*/}
            {/*        <p>No categories to show.</p>*/}
            {/*    ) : (*/}
            {/*        <>*/}
            {/*            <label>*/}
            {/*                Select Category:*/}
            {/*                <select*/}
            {/*                    value={selectedCategory}*/}
            {/*                    onChange={(e) => setSelectedCategory(e.target.value)}*/}
            {/*                    style={{ marginLeft: 10 }}*/}
            {/*                >*/}
            {/*                    {allCategories.map((cat) => (*/}
            {/*                        <option key={cat} value={cat}>*/}
            {/*                            {cat}*/}
            {/*                        </option>*/}
            {/*                    ))}*/}
            {/*                </select>*/}
            {/*            </label>*/}

            {/*            {categoryTrendData.length > 0 ? (*/}
            {/*                <ResponsiveContainer width="100%" height={300}>*/}
            {/*                    <LineChart data={categoryTrendData}>*/}
            {/*                        <XAxis dataKey="month" />*/}
            {/*                        <YAxis />*/}
            {/*                        <Tooltip />*/}
            {/*                        <Legend />*/}
            {/*                        <Line*/}
            {/*                            type="monotone"*/}
            {/*                            dataKey="amountSpent"*/}
            {/*                            stroke="#2196f3"*/}
            {/*                            name={selectedCategory}*/}
            {/*                        />*/}
            {/*                    </LineChart>*/}
            {/*                </ResponsiveContainer>*/}
            {/*            ) : (*/}
            {/*                <p style={{ marginTop: 10 }}>*/}
            {/*                    No data for category <strong>{selectedCategory}</strong>.*/}
            {/*                </p>*/}
            {/*            )}*/}
            {/*        </>*/}
            {/*    )}*/}
            {/*</div>*/}
        </div>
    );
};

export default AnalyticsPage;
