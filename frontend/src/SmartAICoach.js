import React, {
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo
} from "react";
import axios from "axios";
import { auth } from "./fireBase";
import "./aicoach.css"; // Your updated CSS file
import { CurrencyContext } from "./CurrencyContext";
import { getCurrencySymbol } from "./settings";
import {
    FaLightbulb,
    FaTimes,
    FaExclamationTriangle,
    FaCheckCircle,
    FaInfoCircle
} from "react-icons/fa";

// --- Helper Link Functions ---
const getBudgetLink = (cat) => (
    <a href={`/budgets?category=${encodeURIComponent(cat)}`} className="extra-link">
        Adjust or Create a Budget
    </a>
);

const getExpensesLink = (cat) => (
    <a href={`/expenses?category=${encodeURIComponent(cat)}`} className="extra-link">
        Review Your Expenses
    </a>
);

const getSavingsLink = () => (
    <a href="/goals" className="extra-link">
        Allocate to Savings
    </a>
);

// --- Helper to get Days in Current Month ---
const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// --- More Detailed Category Tips ---
const categoryTips = {
    groceries: [
        "Plan meals and make a list to avoid impulse buys.",
        "Check unit prices, buy in bulk, and consider store brands.",
        "Use loyalty programs, coupons, and weekly sale flyers.",
        "Reduce food waste by proper storage and freezing leftovers.",
    ],
    dining: [
        "Use meal-prep and batch cooking to save on takeout costs.",
        "Look for restaurant deals, coupons, or discount dining days.",
        "Limit ordering drinks or desserts when eating out—they add up fast.",
        "Try cooking new recipes at home to replace frequent dining out.",
    ],
    entertainment: [
        "Review all subscriptions and pause/cancel underused ones.",
        "Look for free local events, library resources, or discount movie days.",
        "Try rotating streaming services monthly instead of keeping all active.",
        "Set a monthly entertainment cap and track it to avoid overspending.",
    ],
    utilities: [
        "Compare providers for better rates or switch to renewable energy plans.",
        "Install a programmable thermostat to optimize heating/cooling.",
        "Use LED bulbs, unplug electronics, and fix leaks to reduce water/electric costs.",
        "Insulate doors/windows for better temperature regulation.",
    ],
    transport: [
        "Carpool or use public transport to reduce fuel costs and wear on your car.",
        "Shop around for cheaper insurance and maintain your vehicle regularly.",
        "Keep tires inflated to improve mileage and reduce fuel usage.",
        "Plan errands to consolidate trips and avoid unnecessary driving.",
    ],
    // Fallback if no matching category found
    default: [
        "Review your spending for non-essential costs or cheaper alternatives.",
        "Set a realistic limit and track your expenses regularly.",
        "Use budgeting apps or spreadsheets to stay organized.",
        "Look for ways to bundle services or find discounts."
    ]
};

// --- Helper to map a category string to our tips keys ---
function getCategoryKey(cat) {
    const lower = cat.toLowerCase();
    if (lower.includes("grocery") || lower.includes("food")) return "groceries";
    if (lower.includes("dining")) return "dining";
    if (lower.includes("entertainment")) return "entertainment";
    if (lower.includes("utilities")) return "utilities";
    if (lower.includes("transport") || lower.includes("auto")) return "transport";
    return "default";
}

// --- Linear Regression Forecast ---
const predictSpendingUsingRegression = (currentExpenses) => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = getDaysInMonth(today);

    // Prepare data points: x = day of month, y = expense amount
    const dataPoints = currentExpenses.map((exp) => {
        const expenseDate = new Date(exp.date);
        return {
            x: expenseDate.getDate(),
            y: exp.amount,
        };
    });

    // If insufficient data, fallback to average-based prediction
    if (dataPoints.length < 2) {
        const total = currentExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        const avg = total / (currentDay || 1);
        return total + avg * (daysInMonth - currentDay);
    }

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((acc, point) => acc + point.x, 0);
    const sumY = dataPoints.reduce((acc, point) => acc + point.y, 0);
    const sumXY = dataPoints.reduce((acc, point) => acc + point.x * point.y, 0);
    const sumX2 = dataPoints.reduce((acc, point) => acc + point.x * point.x, 0);

    const denominator = n * sumX2 - sumX * sumX;
    let slope = 0;
    let intercept = 0;
    if (denominator !== 0) {
        slope = (n * sumXY - sumX * sumY) / denominator;
        intercept = (sumY - slope * sumX) / n;
    } else {
        // Fallback again if denominator is 0
        const total = currentExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        const avg = total / (currentDay || 1);
        return total + avg * (daysInMonth - currentDay);
    }

    let predictedRemaining = 0;
    for (let day = currentDay + 1; day <= daysInMonth; day++) {
        const predicted = slope * day + intercept;
        predictedRemaining += Math.max(predicted, 0);
    }

    const currentTotal = currentExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    return currentTotal + predictedRemaining;
};

const SmartAICoach = ({ budgets = [], expenses = [] }) => {
    const [categories, setCategories] = useState([]);
    const [insights, setInsights] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalInsight, setModalInsight] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const { currency } = useContext(CurrencyContext);

    // Thresholds
    const [nearLimitThreshold] = useState(0.8); // 80% threshold
    const [overspendThreshold] = useState(1.0); // 100% threshold

    // Check if an expense's date is in the current month
    const isCurrentMonth = (dateStr) => {
        const expenseDate = new Date(dateStr);
        const now = new Date();
        return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
        );
    };

    // --- Fetch Categories from Backend ---
    const fetchCategories = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.warn("No user is logged in.");
                return;
            }
            const token = await user.getIdToken();
            const response = await axios.get(
                "https://individual-project-lxa2.onrender.com/api/categories",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200 && Array.isArray(response.data)) {
                setCategories(response.data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [budgets]);

    // --- Compute Insights ---
    const computedInsights = useMemo(() => {
        if (!Array.isArray(categories) || categories.length === 0) return [];

        const noBudgetSet = [];
        const overspendingWarnings = [];
        const potentialSavings = [];
        const largeExpenses = [];
        const forecastWarnings = [];
        const trendingWarnings = [];

        categories.forEach((cat) => {
            const trimmedCat = cat.trim().toLowerCase();
            const budget = budgets.find(
                (b) => b.category.trim().toLowerCase() === trimmedCat
            );

            const currentCatExpenses = expenses.filter(
                (exp) =>
                    exp.category.trim().toLowerCase() === trimmedCat &&
                    isCurrentMonth(exp.date)
            );
            const historicalCatExpenses = expenses.filter(
                (exp) =>
                    exp.category.trim().toLowerCase() === trimmedCat &&
                    !isCurrentMonth(exp.date)
            );

            const currentTotal = currentCatExpenses.reduce(
                (acc, exp) => acc + exp.amount,
                0
            );
            const historicalTotal = historicalCatExpenses.reduce(
                (acc, exp) => acc + exp.amount,
                0
            );
            const historicalCount = historicalCatExpenses.length;
            const historicalAverage =
                historicalCount > 0 ? historicalTotal / historicalCount : 0;

            // A) If no budget is set
            if (!budget) {
                if (currentCatExpenses.length > 0) {
                    noBudgetSet.push({
                        text: `You've spent ${getCurrencySymbol(currency)}${currentTotal.toFixed(
                            2
                        )} in "${cat}" but have no budget set. Consider adding one!`,
                        type: "No Budget Set",
                        category: cat,
                        details: currentCatExpenses.map(
                            (exp) =>
                                `Spent ${getCurrencySymbol(currency)}${exp.amount} on ${new Date(
                                    exp.date
                                ).toLocaleDateString()}`
                        ),
                    });
                } else {
                    noBudgetSet.push({
                        text: `No budget or spending in "${cat}".`,
                        type: "No Budget Set",
                        category: cat,
                        details: [],
                    });
                }
                return; // Move to next category
            }

            const remaining = budget.amount - currentTotal;

            // Overspending or near-limit conditions
            if (currentTotal > budget.amount * overspendThreshold) {
                // Actually overspent
                overspendingWarnings.push({
                    text: `You exceeded your "${cat}" budget by ${getCurrencySymbol(currency)}${(
                        currentTotal - budget.amount
                    ).toFixed(2)}.`,
                    type: "Overspending Warning",
                    category: cat,
                    details: currentCatExpenses.map(
                        (exp) =>
                            `Spent ${getCurrencySymbol(currency)}${exp.amount} on ${new Date(
                                exp.date
                            ).toLocaleDateString()}`
                    ),
                });

                // Additional targeted tips
                const catKey = getCategoryKey(cat);
                if (categoryTips[catKey]) {
                    overspendingWarnings.push({
                        text: `Here are specific suggestions to help reduce ${cat} spending:`,
                        type: "Targeted Recommendations",
                        category: cat,
                        tips: categoryTips[catKey]
                    });
                }
            } else if (remaining < budget.amount * (1 - nearLimitThreshold)) {
                // Near-limit scenario
                overspendingWarnings.push({
                    text: `You're close to exceeding your "${cat}" budget. Only ${getCurrencySymbol(currency)}${remaining.toFixed(
                        2
                    )} left.`,
                    type: "Near-Limit Warning",
                    category: cat,
                    details: currentCatExpenses.map(
                        (exp) =>
                            `Spent ${getCurrencySymbol(currency)}${exp.amount} on ${new Date(
                                exp.date
                            ).toLocaleDateString()}`
                    ),
                });

                // Additional targeted tips
                const catKey = getCategoryKey(cat);
                if (categoryTips[catKey]) {
                    overspendingWarnings.push({
                        text: `Try these specific ideas to stay within your ${cat} budget:`,
                        type: "Targeted Recommendations",
                        category: cat,
                        tips: categoryTips[catKey]
                    });
                }
            } else if (currentTotal < budget.amount * 0.5) {
                // Potential savings if user spent less than half the budget
                potentialSavings.push({
                    text: `You have ${getCurrencySymbol(currency)}${remaining.toFixed(
                        2
                    )} left in "${cat}". Consider saving or reallocating it.`,
                    type: "Potential Savings",
                    category: cat,
                    details: [],
                });
            }

            // Large individual expenses
            currentCatExpenses.forEach((exp) => {
                if (exp.amount > budget.amount * 0.5) {
                    largeExpenses.push({
                        text: `Large expense in "${cat}": ${getCurrencySymbol(currency)}${exp.amount}. Review this purchase.`,
                        type: "Large Expense",
                        category: cat,
                        details: [
                            `Expense on ${new Date(exp.date).toLocaleDateString()}: ${getCurrencySymbol(
                                currency
                            )}${exp.amount}`,
                        ],
                    });
                }
            });

            // Trending higher than historical average
            if (historicalAverage > 0 && currentTotal > historicalAverage * 1.5) {
                trendingWarnings.push({
                    text: `Your spending in "${cat}" is trending higher than your historical average.`,
                    type: "Trending Warning",
                    category: cat,
                    details: [
                        `Historical average: ${getCurrencySymbol(currency)}${historicalAverage.toFixed(2)}`,
                        `Current total: ${getCurrencySymbol(currency)}${currentTotal.toFixed(2)}`,
                    ],
                });
            }

            // Forecasting using regression-based prediction
            if (currentCatExpenses.length > 0) {
                const predictedTotal = predictSpendingUsingRegression(currentCatExpenses);
                if (predictedTotal > budget.amount) {
                    forecastWarnings.push({
                        text: `At your current pace, you'll exceed your "${cat}" budget by month-end. (Predicted: ${getCurrencySymbol(
                            currency
                        )}${(predictedTotal - budget.amount).toFixed(2)} over budget)`,
                        type: "Forecast Warning",
                        category: cat,
                        details: currentCatExpenses.map(
                            (exp) =>
                                `Spent ${getCurrencySymbol(currency)}${exp.amount} on ${new Date(
                                    exp.date
                                ).toLocaleDateString()}`
                        ),
                    });
                }
            }
        });

        return [
            { type: "No Budget Set", messages: noBudgetSet },
            { type: "Overspending Warning", messages: overspendingWarnings },
            { type: "Potential Savings", messages: potentialSavings },
            { type: "Large Expense", messages: largeExpenses },
            { type: "Forecast Warning", messages: forecastWarnings },
            { type: "Trending Warning", messages: trendingWarnings },
        ];
    }, [
        categories,
        budgets,
        expenses,
        currency,
        nearLimitThreshold,
        overspendThreshold
    ]);

    useEffect(() => {
        setInsights(computedInsights);
    }, [computedInsights]);

    // --- Modal Handlers ---
    const openInsightModal = useCallback((insight) => {
        setModalInsight(insight);
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setModalInsight(null);
    }, []);

    // Limit the number of messages if Not Expanded
    const visibleInsights = showAll
        ? insights
        : insights.map((section) => ({
            ...section,
            messages: section.messages.slice(0, 3),
        }));

    // --- Step-by-Step Category Guides (more specific) ---
    const categoryGuide = (cat) => {
        const lowerCat = cat.toLowerCase();

        if (lowerCat.includes("groceries") || lowerCat.includes("food")) {
            return (
                <>
                    <p><strong>3-Step Grocery Optimization:</strong></p>
                    <ol>
                        <li><strong>Plan & Compare:</strong> Make a meal plan and list. Compare store flyers and use coupons.</li>
                        <li><strong>Buy Smart:</strong> Check unit prices, buy in bulk for staples, and try store brands.</li>
                        <li><strong>Track & Adjust:</strong> Monitor weekly spending, reduce waste, and tweak your list.</li>
                    </ol>
                </>
            );
        }

        if (lowerCat.includes("dining")) {
            return (
                <>
                    <p><strong>3-Step Dining Control:</strong></p>
                    <ol>
                        <li><strong>Assess:</strong> Count how often you eat out. Identify your main dining-out triggers.</li>
                        <li><strong>Plan Alternatives:</strong> Try cooking at home more. Look for deals when you do dine out.</li>
                        <li><strong>Set Limits:</strong> Decide on a weekly or monthly cap for restaurants and stick to it.</li>
                    </ol>
                </>
            );
        }

        if (lowerCat.includes("entertainment")) {
            return (
                <>
                    <p><strong>3-Step Entertainment Reset:</strong></p>
                    <ol>
                        <li><strong>Review Services:</strong> List all your subscriptions (Netflix, Hulu, etc.) and usage.</li>
                        <li><strong>Cut or Swap:</strong> Cancel or pause underused subscriptions, try free alternatives.</li>
                        <li><strong>Set a Cap:</strong> Decide a monthly limit. Track spending on concerts, movies, and games.</li>
                    </ol>
                </>
            );
        }

        if (lowerCat.includes("utilities")) {
            return (
                <>
                    <p><strong>3-Step Utility Saver:</strong></p>
                    <ol>
                        <li><strong>Compare & Negotiate:</strong> Look at different energy providers or call your current one for a better rate.</li>
                        <li><strong>Optimize Usage:</strong> Use LED bulbs, fix leaks, and unplug devices to reduce consumption.</li>
                        <li><strong>Track Bills:</strong> Check monthly statements to see if changes are making a difference.</li>
                    </ol>
                </>
            );
        }

        if (lowerCat.includes("transport") || lowerCat.includes("auto") || lowerCat.includes("car"))  {
            return (
                <>
                    <p><strong>3-Step Transportation Trim:</strong></p>
                    <ol>
                        <li><strong>Audit Costs:</strong> Look at your monthly fuel, maintenance, and insurance costs.</li>
                        <li><strong>Reduce & Shop Around:</strong> Carpool, take public transport, or switch to cheaper insurance.</li>
                        <li><strong>Maintain & Monitor:</strong> Keep your vehicle in good shape to avoid bigger repairs.</li>
                    </ol>
                </>
            );
        }

        // Default fallback guide
        return (
            <>
                <p><strong>3-Step Spending Refine:</strong></p>
                <ol>
                    <li><strong>Check:</strong> Compare your actual spending to any budget or average you have.</li>
                    <li><strong>Adjust:</strong> Identify non-essential costs and reduce them. Set a realistic limit.</li>
                    <li><strong>Monitor:</strong> Revisit the category each month to ensure you stay on track.</li>
                </ol>
            </>
        );
    };

    // --- Extra Suggestions with Summary + Guide in Modal ---
    const renderExtraSuggestions = (insight) => {
        if (!insight) return null;
        const cat = insight.category;

        switch (insight.type) {
            case "No Budget Set":
                return (
                    <div className="extra-suggestions">
                        <p>
                            <strong>Action:</strong> You haven’t set a budget for <strong>{cat}</strong>.
                            Creating one helps you track and control spending.
                        </p>
                        {getBudgetLink(cat)}
                        {categoryGuide(cat)}
                    </div>
                );

            case "Overspending Warning":
            case "Near-Limit Warning":
                return (
                    <div className="extra-suggestions">
                        <p>
                            <strong>Action:</strong> You’re at risk of exceeding your <strong>{cat}</strong> budget.
                            Review spending and see where you can cut back.
                        </p>
                        {getBudgetLink(cat)} {getExpensesLink(cat)}
                        {categoryGuide(cat)}
                    </div>
                );

            case "Potential Savings":
                return (
                    <div className="extra-suggestions">
                        <p>
                            <strong>Action:</strong> You have leftover funds in <strong>{cat}</strong>. Consider
                            using them to boost savings or pay down debt.
                        </p>
                        {getSavingsLink()}
                        {categoryGuide(cat)}
                    </div>
                );

            case "Forecast Warning":
                return (
                    <div className="extra-suggestions">
                        <p>
                            <strong>Action:</strong> Your current spending trend suggests you may exceed your{" "}
                            <strong>{cat}</strong> budget soon. Try reducing expenses or adjusting your budget.
                        </p>
                        {getBudgetLink(cat)} {getExpensesLink(cat)}
                        {categoryGuide(cat)}
                    </div>
                );

            case "Targeted Recommendations":
                // Show the bullet list of tips if present
                if (insight.tips && insight.tips.length > 0) {
                    return (
                        <div className="extra-suggestions">
                            <p><strong>Specific Tips:</strong></p>
                            <ul>
                                {insight.tips.map((tip, idx) => (
                                    <li key={idx}>{tip}</li>
                                ))}
                            </ul>
                            {categoryGuide(cat)}
                        </div>
                    );
                }
                return null;

            default:
                return null;
        }
    };

    // --- Card to Display Insights for Each Category "Section" ---
    const InsightCard = ({ section }) => (
        <div className="insight-card" data-type={section.type}>
            <div className="insight-card-header">
                {section.type === "No Budget Set" && (
                    <FaExclamationTriangle style={{ color: "#ff9800" }} />
                )}
                {(section.type === "Overspending Warning" ||
                    section.type === "Near-Limit Warning") && (
                    <FaTimes style={{ color: "#d9534f" }} />
                )}
                {section.type === "Potential Savings" && (
                    <FaCheckCircle style={{ color: "#28a745" }} />
                )}
                {section.type === "Forecast Warning" && (
                    <FaInfoCircle style={{ color: "#ff9800" }} />
                )}
                {section.type === "Trending Warning" && (
                    <FaInfoCircle style={{ color: "#2196f3" }} />
                )}
                <h3>{section.type}</h3>
            </div>
            <ul className="insight-card-list">
                {section.messages.map((insight, i) => (
                    <li key={i} onClick={() => openInsightModal(insight)}>
                        {insight.text}
                    </li>
                ))}
            </ul>
        </div>
    );

    // --- Main Render ---
    return (
        <div className="smart-ai-coach-container">
            <div className="coach-header">
                <FaLightbulb className="coach-header-icon" />
                <h2 className="coach-title">Smart AI Budget Coach</h2>
            </div>
            <p className="coach-subtitle">
                Get personalized budget insights and recommendations.
            </p>

            {/* Empty States */}
            {(!categories || categories.length === 0) && (
                <div className="coach-empty-state">
                    <p>📌 No categories found. Please add categories and budgets first!</p>
                </div>
            )}
            {categories.length > 0 && budgets.length === 0 && expenses.length === 0 && (
                <div className="coach-empty-state">
                    <p>
                        📌 You have categories, but no budgets or expenses. Add a budget to get insights!
                    </p>
                </div>
            )}

            {/* Summary of Total Insights */}
            {categories.length > 0 && (budgets.length > 0 || expenses.length > 0) && (
                <div className="coach-summary">
                    {insights.reduce((sum, sec) => sum + sec.messages.length, 0) > 0 ? (
                        <p>
                            You have{" "}
                            <strong>
                                {insights.reduce((sum, sec) => sum + sec.messages.length, 0)}
                            </strong>{" "}
                            insights across your categories.
                        </p>
                    ) : (
                        <div className="coach-all-good">
                            <FaCheckCircle className="coach-all-good-icon" />
                            <p>Everything looks good! No warnings or insights to show.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Render Insight Cards */}
            {visibleInsights
                .filter((section) => section.messages.length > 0)
                .map((section, idx) => (
                    <InsightCard key={idx} section={section} />
                ))}

            {/* Show More / Less */}
            {insights.some((s) => s.messages.length > 3) && (
                <div className="show-more-container">
                    <button className="show-more-btn" onClick={() => setShowAll(!showAll)}>
                        {showAll ? "Show Less Insights" : "Show More Insights"}
                    </button>
                </div>
            )}

            {/* Modal for Detailed Insight */}
            {modalOpen && modalInsight && (
                <div
                    className="modal-overlay"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                    >
                        <h3 id="modal-title">
                            {modalInsight.type} - {modalInsight.category}
                        </h3>
                        <p>{modalInsight.text}</p>

                        {/* Additional suggestions in the modal */}
                        {renderExtraSuggestions(modalInsight)}

                        <button
                            className="modal-close-btn"
                            onClick={closeModal}
                            aria-label="Close Modal"
                        >
                            <FaTimes /> Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartAICoach;
