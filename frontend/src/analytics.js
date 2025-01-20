import React, { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from "recharts";
import axios from "axios";
import "./analytics.css";
import Navbar from "./navbar";

const AnalyticsPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [monthlyIncome, setMonthlyIncome] = useState(5000);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [month1, setMonth1] = useState(new Date().toISOString().slice(0, 7));
    const [month2, setMonth2] = useState("");
    const [comparisonData, setComparisonData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [filteredBudgets, setFilteredBudgets] = useState([]);

    useEffect(() => {
        fetchExpenses();
        fetchBudgets();
        fetchMonthlyIncome();
    }, []);

    useEffect(() => {
        updateFilteredData();
    }, [currentMonth, expenses, budgets]);
    const fetchMonthlyIncome = () => {
        const incomes = JSON.parse(localStorage.getItem("storedIncomes")) || {};
        const monthKey = currentMonth.toISOString().slice(0, 7);
        setMonthlyIncome(incomes[monthKey] || 0);
    };

    const fetchExpenses = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/expenses");
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    };

    const fetchBudgets = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/budgets");
            setBudgets(response.data);
        } catch (error) {
            console.error("Error fetching budgets:", error);
        }
    };

    const updateFilteredData = () => {
        const monthKey = currentMonth.toISOString().slice(0, 7);
        const filteredExpenses = expenses.filter(
            (expense) => expense.date.slice(0, 7) === monthKey
        );
        const filteredBudgets = budgets.filter(
            (budget) => budget.month === monthKey
        );

        setFilteredExpenses(filteredExpenses);
        setFilteredBudgets(filteredBudgets);

        generateAlerts(filteredBudgets, filteredExpenses);
    };

    const generateAlerts = (budgets, expenses) => {
        const alertsData = budgets.map((budget) => {
            const categoryExpenses = expenses
                .filter((expense) => expense.category === budget.category)
                .reduce((sum, expense) => sum + expense.amount, 0);
            if (categoryExpenses > budget.amount) {
                return `Warning: ${budget.category} has exceeded its budget by £${(
                    categoryExpenses - budget.amount
                ).toFixed(2)}.`;
            } else if (categoryExpenses > budget.amount * 0.8) {
                return `Alert: ${budget.category} is nearing its budget limit.`;
            }
            return null;
        });
        setAlerts(alertsData.filter(Boolean));
    };

    const handleMonthChange = (direction) => {
        setCurrentMonth((prev) => {
            const newMonth = new Date(prev);
            newMonth.setMonth(newMonth.getMonth() + (direction === "next" ? 1 : -1));
            return newMonth;
        });
    };

    const handleCompareMonths = () => {
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

        const aggregateExpenses = (expenses) =>
            expenses.reduce((acc, expense) => {
                const existing = acc.find((item) => item.category === expense.category);
                if (existing) {
                    existing.amount += expense.amount;
                } else {
                    acc.push({ category: expense.category, amount: expense.amount });
                }
                return acc;
            }, []);

        const aggregatedMonth1 = aggregateExpenses(expensesMonth1);
        const aggregatedMonth2 = aggregateExpenses(expensesMonth2);

        const combinedData = [
            ...new Set([
                ...aggregatedMonth1.map((item) => item.category),
                ...aggregatedMonth2.map((item) => item.category),
            ]),
        ].map((category) => ({
            category,
            [month1]: aggregatedMonth1.find((item) => item.category === category)?.amount || 0,
            [month2]: aggregatedMonth2.find((item) => item.category === category)?.amount || 0,
        }));

        setComparisonData(combinedData);
    };

    const pieChartData = filteredExpenses.reduce((acc, expense) => {
        const existingCategory = acc.find((item) => item.name === expense.category);
        if (existingCategory) {
            existingCategory.value += expense.amount;
        } else {
            acc.push({ name: expense.category, value: expense.amount });
        }
        return acc;
    }, []);

    const totalExpenses = pieChartData.reduce((acc, item) => acc + item.value, 0);
    const totalBudgets = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);
    const savings = monthlyIncome - totalBudgets;

    const topCategories = pieChartData
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    const budgetUtilization = totalBudgets
        ? Math.min((totalExpenses / totalBudgets) * 100, 100)
        : 0;

    const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="analytics-page">
            <Navbar/>
            <h2 className="page-title">Analytics</h2>

            <div className="navigation-buttons">
                <button className="nav-btn" onClick={() => handleMonthChange("prev")}>
                    &lt; Previous
                </button>
                <span className="current-month">
                    {currentMonth.toLocaleString("default", {month: "long", year: "numeric"})}
                </span>
                <button className="nav-btn" onClick={() => handleMonthChange("next")}>
                    Next &gt;
                </button>
            </div>

            <div className="savings-summary">
                <h3 className="savings-title">Savings Summary</h3>
                <div className="savings-card">
                    <div className="savings-item">
                        <span className="savings-label">Monthly Income:</span>
                        <span className="savings-value">£{monthlyIncome.toFixed(2)}</span>
                    </div>
                    <div className="savings-item">
                        <span className="savings-label">Total Expenses:</span>
                        <span className="savings-value">£{totalExpenses.toFixed(2)}</span>
                    </div>
                    <div className="savings-item">
                        <span className="savings-label">Total Budget Allocations:</span>
                        <span className="savings-value">£{totalBudgets.toFixed(2)}</span>
                    </div>
                    <div className="savings-item savings-highlight">
                        <span className="savings-label">Savings:</span>
                        <span className="savings-value">£{savings.toFixed(2)}</span>
                    </div>
                </div>
            </div>


            <div className="alerts">
                {alerts.map((alert, index) => (
                    <p key={index} className="alert-text">
                        {alert}
                    </p>
                ))}
            </div>

            <div className="chart-grid">
                <div className="chart">
                    <h3>Expenses Breakdown</h3>
                    <PieChart width={300} height={300}>
                        <Pie
                            data={pieChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={renderCustomizedLabel}
                        >
                            {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                            ))}
                        </Pie>
                        <Tooltip/>
                        <Legend/>
                    </PieChart>
                </div>

                <div className="chart">
                    <h3>Top 3 Expense Categories</h3>
                    <div className="bar-chart">
                        <BarChart
                            width={300} // Adjusted width
                            height={250} // Adjusted height
                            data={topCategories}
                        >
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <Tooltip/>
                            <Bar dataKey="value" fill="#36A2EB"/>
                        </BarChart>
                    </div>
                </div>
                <div className="chart">
                    <h3>Budget Utilization</h3>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{
                                width: `${budgetUtilization}%`, // Bar grows left-to-right
                            }}
                        ></div>
                    </div>
                    <p className="utilization-text">{budgetUtilization.toFixed(2)}% Utilized</p>
                </div>


            </div>

            <div className="comparison">
                <h3>Compare Expenses Between Two Months</h3>
                <div className="comparison-inputs">
                    <label>
                        Select First Month:
                        <input
                            type="month"
                            value={month1}
                            onChange={(e) => setMonth1(e.target.value)}
                        />
                    </label>
                    <label>
                        Select Second Month:
                        <input
                            type="month"
                            value={month2}
                            onChange={(e) => setMonth2(e.target.value)}
                        />
                    </label>
                </div>
                <button className="compare-btn" onClick={handleCompareMonths}>
                    Compare
                </button>
            </div>

            {comparisonData.length > 0 && (
                <div className="chart">
                    <h3>Monthly Comparison</h3>
                    <LineChart width={500} height={300} data={comparisonData}>
                        <XAxis dataKey="category"/>
                        <YAxis/>
                        <Tooltip/>
                        <Legend/>
                        <Line type="monotone" dataKey={month1} stroke="#36A2EB" name={`Expenses (${month1})`}/>
                        <Line type="monotone" dataKey={month2} stroke="#FF6384" name={`Expenses (${month2})`}/>
                    </LineChart>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
