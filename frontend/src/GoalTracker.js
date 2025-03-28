import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Navbar from './navbar';
import './goals.css';
import Swal from "sweetalert2";
import { FaBullseye, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';
import { CurrencyContext } from "./CurrencyContext";
import { getCurrencySymbol } from "./settings";
import { auth } from "./fireBase";
import Joyride, { STATUS } from "react-joyride";
import { FaQuestionCircle } from "react-icons/fa";


const Goals = () => {
    const { currency } = useContext(CurrencyContext);
    const [goal, setGoal] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [allocatedFunds, setAllocatedFunds] = useState('');
    const [deadline, setDeadline] = useState('');
    const [goals, setGoals] = useState([]);
    const [filteredGoals, setFilteredGoals] = useState([]);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [lastUpdatedGoal, setLastUpdatedGoal] = useState(null);
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [goalEdits, setGoalEdits] = useState({});
    const [runGuide, setRunGuide] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const goalsGuideSteps = [
        {
            target: ".intro-title",
            content: "Welcome to your Goals page! Here you can set your financial targets.",
        },
        {
            target: ".goal-form",
            content: "Use this form to add a new goal with its target amount, allocated funds, and deadline.",
        },
        {
            target: ".filter-container",
            content: "Filter your goals using the search box and date range options.",
        },
        {
            target: ".goals-list",
            content: "Your existing goals are listed here. Click on any goal to edit or delete it.",
        },
        {
            target: ".navbar-analytics",
            content: "When you're ready, click here to proceed to Analytics and continue the tutorial.",
        },
    ];



    useEffect(() => {
        fetchGoals();
    }, []);

    useEffect(() => {
        filterGoals();
    }, [searchTerm, startDate, endDate, goals]);

    useEffect(() => {
        checkGoalDeadlines();
    }, [goals]);

    useEffect(() => {
        const showMilestoneAfterSuccess = async () => {
            if (lastUpdatedGoal) {
                const updatedGoal = goals.find(g => g.id === lastUpdatedGoal);
                if (updatedGoal) {
                    const result = await Swal.fire({
                        title: "✅ Goal Updated!",
                        text: `Your goal "${updatedGoal.goal}" has been successfully updated.`,
                        icon: "success",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#28a745",
                    });

                    if (result.isConfirmed) {
                        checkMilestones(updatedGoal);
                    }
                }
                setLastUpdatedGoal(null);
            }
        };

        showMilestoneAfterSuccess();
    }, [goals, lastUpdatedGoal]);


    // 1) Fetch all goals
    const fetchGoals = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            const response = await axios.get(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setGoals(response.data);
            filterGoals(response.data);
        } catch (error) {
            console.error("Error fetching goals:", error);
            setError("Error fetching goals. Please try again later.");
        }
    };

    // 2) Filter goals based on search & date range
    const filterGoals = (goalsList = goals) => {
        let filtered = goalsList;
        if (searchTerm) {
            filtered = filtered.filter(goal =>
                goal.goal.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (startDate) {
            filtered = filtered.filter(goal => new Date(goal.deadline) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(goal => new Date(goal.deadline) <= new Date(endDate));
        }
        setFilteredGoals(filtered);
    };

    const toggleDateFilter = () => {
        setShowDateFilter(!showDateFilter);
    };

    // 3) Reset form fields
    const resetForm = () => {
        setGoal('');
        setTargetAmount('');
        setAllocatedFunds('');
        setDeadline('');
        setEditingGoalId(null);
        setError(null);
        setEditMode(false);
        setGoalEdits({});
    };

    // 4) Save new or updated goal
    const saveGoal = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.fire({
                    title: "⚠️ Authentication Required!",
                    text: "You must be logged in to manage your goals.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const token = await user.getIdToken();
            if (!goal || !targetAmount || !allocatedFunds || !deadline) {
                Swal.fire({
                    title: "⚠️ Missing Fields!",
                    text: "Please fill in all fields before saving.",
                    icon: "warning",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const selectedDeadline = new Date(deadline);
            const today = new Date();
            if (selectedDeadline <= today) {
                Swal.fire({
                    title: "🚫 Invalid Deadline!",
                    text: "Please select a future date for your goal.",
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#ff4d4d",
                });
                return;
            }

            const goalData = {
                goal,
                targetAmount: parseFloat(targetAmount),
                allocatedFunds: parseFloat(allocatedFunds),
                deadline,
            };

            if (editingGoalId) {
                // Updating existing goal
                await axios.put(
                    `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals/${editingGoalId}`,
                    goalData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setGoals(prevGoals =>
                    prevGoals.map(g => (g.id === editingGoalId ? { ...g, ...goalData } : g))
                );

                setLastUpdatedGoal(editingGoalId);
                Swal.fire({
                    title: "✅ Goal Updated!",
                    text: `Your goal "${goal}" has been successfully updated.`,
                    icon: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#28a745",
                });
            } else {
                // Creating a new goal
                await axios.post(
                    "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals",
                    goalData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                await fetchGoals();
                Swal.fire({
                    title: "🎯 Goal Added!",
                    text: `Your goal "${goal}" has been successfully created.`,
                    icon: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#007acc",
                });
            }
            resetForm();
        } catch (error) {
            console.error("Error saving goal:", error);
            Swal.fire({
                title: "❌ Error Saving Goal",
                text: "There was an issue saving your goal. Please try again.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };

    // 5) Save goal edits (inline editing)
    const saveGoalEdits = async () => {
        if (!editingGoalId) return;

        const today = new Date();
        const selectedDeadline = new Date(goalEdits.deadline);

        if (selectedDeadline <= today) {
            Swal.fire({
                title: "🚫 Invalid Deadline!",
                text: "You can only set goals with future deadlines.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();

            await axios.put(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals/${editingGoalId}`,
                goalEdits,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setGoals(prevGoals =>
                prevGoals.map(g =>
                    g.id === editingGoalId ? { ...g, ...goalEdits } : g
                )
            );

            setLastUpdatedGoal(editingGoalId);
            setEditingGoalId(null);
            setEditMode(false);

            Swal.fire({
                title: "✅ Goal Updated!",
                text: `Your goal "${goalEdits.goal}" has been successfully updated.`,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });
        } catch (error) {
            console.error("Error updating goal:", error);
        }
    };

    // 6) Check milestones
    const checkMilestones = (goal) => {
        const progress = calculateProgress(goal.allocatedFunds, goal.targetAmount);

        if (progress >= 100) {
            handleGoalCompletion(goal); // Auto-delete at 100%
            return;
        }

        let milestoneMessage = "";
        if (progress >= 95) milestoneMessage = "🔥 95% Almost There! Keep Pushing!";
        else if (progress >= 75) milestoneMessage = "🏆 75% Milestone Reached! You're so close!";
        else if (progress >= 50) milestoneMessage = "🚀 50% Milestone Reached! Keep up the great work!";
        else if (progress >= 25) milestoneMessage = "🎯 25% Milestone Reached! Great start!";

        if (milestoneMessage) {
            Swal.fire({
                title: milestoneMessage,
                text: `Your goal "${goal.goal}" is progressing well!`,
                icon: "info",
                confirmButtonText: "Keep Going!",
                confirmButtonColor: "#007bff",
            });
        }
    };

    // 7) Mark goal as completed
    const handleGoalCompletion = (goal) => {
        Swal.fire({
            title: "🎉 Goal Achieved! 🎉",
            text: `Congratulations! You've successfully reached your goal: "${goal.goal}".`,
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Delete Goal",
            cancelButtonText: "Keep It Active",
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#007bff"
        }).then((result) => {
            if (result.isConfirmed) {
                deleteGoal(goal.id);
            } else {
                setGoals(prevGoals =>
                    prevGoals.map(g => g.id === goal.id ? { ...g, completed: false } : g)
                );
            }
        });
    };

    // 8) Editing helpers
    const startEditing = (goal) => {
        setEditingGoalId(goal.id);
        setGoalEdits({ ...goal });
        setEditMode(true);
    };

    const cancelEditing = () => {
        setEditingGoalId(null);
        setEditMode(false);
    };

    const handleInputChange = (e, field) => {
        setGoalEdits(prev => ({ ...prev, [field]: e.target.value }));
    };

    // 9) Delete single or all goals
    const deleteGoal = async (goalId) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();

            const confirmDelete = await Swal.fire({
                title: "🗑️ Delete Goal?",
                text: "Are you sure you want to delete this goal? This action cannot be undone.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, Delete",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
            });

            if (!confirmDelete.isConfirmed) return;

            await axios.delete(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals/${goalId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));

            Swal.fire({
                title: "✅ Goal Deleted!",
                text: "The goal has been successfully removed.",
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });
        } catch (error) {
            console.error("Error deleting goal:", error);
            Swal.fire({
                title: "❌ Deletion Failed",
                text: "There was an error deleting the goal. Please try again.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#ff4d4d",
            });
        }
    };

    // 🆕 "Delete All Goals" function
    const deleteAllGoals = async () => {
        const confirmDelete = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete all your savings goals.",
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
            await axios.delete(
                "https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals/delete-all",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire(
                "Deleted!",
                "All your savings goals have been removed successfully.",
                "success"
            );
            setGoals([]);
            setFilteredGoals([]);
        } catch (error) {
            console.error("Error deleting goals:", error);
            Swal.fire("Error", "Failed to delete goals. Please try again.", "error");
        }
    };

    // 10) Extend deadline for missed goals
    const checkGoalDeadlines = () => {
        const today = new Date();
        goals.forEach(goal => {
            const goalDeadline = new Date(goal.deadline);
            if (goalDeadline < today && goal.allocatedFunds < goal.targetAmount) {
                Swal.fire({
                    title: "⏳ Goal Missed!",
                    text: `You didn't reach your goal "${goal.goal}" by the deadline. Would you like to extend it?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Extend Deadline",
                    cancelButtonText: "Delete Goal",
                    confirmButtonColor: "#007bff",
                    cancelButtonColor: "#dc3545"
                }).then(result => {
                    if (result.isConfirmed) {
                        extendGoalDeadline(goal.id);
                    } else {
                        deleteGoal(goal.id);
                    }
                });
            }
        });
    };

    const extendGoalDeadline = async (goalId) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();

            const { value: newDeadline } = await Swal.fire({
                title: "📅 Set New Deadline",
                input: "date",
                inputLabel: "Choose a new deadline",
                inputValidator: (value) => {
                    if (!value) {
                        return "You must select a new deadline!";
                    }
                }
            });

            if (!newDeadline) return;

            await axios.put(
                `https://budget-tracker-backend-666575572595.europe-west2.run.app/api/goals/${goalId}/extend`,
                { deadline: newDeadline },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchGoals();

            Swal.fire("✅ Deadline Extended!", "Your goal deadline has been updated.", "success");
        } catch (error) {
            console.error("Error extending goal deadline:", error);
        }
    };

    // 11) Calculate progress bar
    const calculateProgress = (allocatedFunds, targetAmount) => {
        const parsedAllocated = parseFloat(allocatedFunds) || 0;
        const parsedTarget = parseFloat(targetAmount) || 0;
        if (parsedTarget === 0) return 0;
        return Math.min((parsedAllocated / parsedTarget) * 100, 100);
    };

    // 12) Get color for progress bar
    const getProgressColor = (progress) => {
        if (progress < 25) return "#e74c3c"; // Red (Low Progress)
        if (progress < 50) return "#f39c12"; // Orange (Mid Progress)
        if (progress < 75) return "#f1c40f"; // Yellow (Almost there)
        return "#2ecc71"; // Green (High Progress)
    };
    const handleJoyrideCallback = (data) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
            setRunGuide(false);
        }
    };

    return (
        <div className="expense-tracker">
            <Navbar/>
            {/* Interactive Guide using react-joyride */}
            <Joyride
                steps={goalsGuideSteps}
                run={runGuide}
                stepIndex={stepIndex}
                continuous
                showSkipButton
                disableBeacon
                callback={handleJoyrideCallback}
                styles={{ options: { zIndex: 10000 } }}
            />

            <h2 className="intro-title">Set Your Financial Goals</h2>
            <p className="intro-text">Define your financial targets and track your progress.</p>
            <div className="floating-help-button" onClick={() => {
                setStepIndex(0);
                setRunGuide(true);
            }}>
                <FaQuestionCircle className="help-icon"/>
            </div>

            {/* Add/Edit Goal Form */}
            <div className="goal-form">
                <label htmlFor="goal" className="form-label">
                    <div className="form-group-inline">
                        Goal Name: <small className="form-description">A short description of what you want to
                        achieve.</small>
                    </div>
                    <input
                        id="goal"
                        type="text"
                        placeholder="e.g., Save for vacation"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="form-input"
                    />
                </label>

                <label htmlFor="targetAmount" className="form-label">
                    <div className="form-group-inline">
                        Target Amount:
                        <small className="form-description">The total amount you aim to save.</small>
                    </div>
                    <input
                        id="targetAmount"
                        type="text"
                        placeholder={`e.g., ${getCurrencySymbol(currency)} 1,000`}
                        value={targetAmount.toLocaleString()}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, "");
                            if (!isNaN(rawValue) && rawValue !== "") {
                                setTargetAmount(Number(rawValue));
                            } else {
                                setTargetAmount("");
                            }
                        }}
                        className="form-input"
                    />
                </label>

                <label htmlFor="allocatedFunds" className="form-label">
                    <div className="form-group-inline">
                        Allocated Amount:
                        <small className="form-description">The amount you've already set aside or contributed.</small>
                    </div>
                    <input
                        id="allocatedFunds"
                        type="text"
                        placeholder={`e.g., ${getCurrencySymbol(currency)} 1,000`}
                        value={allocatedFunds.toLocaleString()}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, "");
                            if (!isNaN(rawValue) && rawValue !== "") {
                                setAllocatedFunds(Number(rawValue));
                            } else {
                                setAllocatedFunds("");
                            }
                        }}
                        className="form-input"
                    />
                </label>

                <label htmlFor="deadline" className="form-label">
                    <div className="form-group-inline">
                        Deadline:
                        <small className="form-description">The target date to achieve this goal.</small>
                    </div>
                    <input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="form-input"
                    />
                </label>

                <button onClick={saveGoal} className="form-button">Add Goal</button>
                {filteredGoals.length > 0 && (
                    <button onClick={deleteAllGoals} className="budget-tracker-delete-button">
                        Delete All Goals
                    </button>
                )}

            </div>

            {/* Filter Container */}
            <div className="filter-container">
                <input
                    type="text"
                    placeholder="🔍 Search by goal name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button onClick={toggleDateFilter} className="toggle-button">
                    {showDateFilter ? "Hide Date Range ⬆" : "Filter by Date Range ⬇"}
                </button>
                {showDateFilter && (
                    <div className="date-filter">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="date-input"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="date-input"
                        />
                    </div>
                )}
            </div>

            <h2 className="section-title">Your Goals</h2>

            {filteredGoals && filteredGoals.length > 0 ? (
                <>
                    <div className="goals-list">
                        {filteredGoals.map((goalItem) => (
                            <div key={goalItem.id} className="goal-card">
                                {editingGoalId === goalItem.id ? (
                                    <>
                                        <div className="goal-edit-fields">
                                            <label className="form-label">
                                                Goal Name:
                                                <input
                                                    type="text"
                                                    value={goalEdits.goal || ""}
                                                    onChange={(e) => handleInputChange(e, "goal")}
                                                    placeholder="Goal Name"
                                                />
                                            </label>
                                            <label className="form-label">
                                                Target Amount:
                                                <input
                                                    type="text"
                                                    value={goalEdits.targetAmount?.toLocaleString() || ""}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/,/g, "");
                                                        if (!isNaN(rawValue) && rawValue !== "") {
                                                            handleInputChange({target: {value: Number(rawValue)}}, "targetAmount");
                                                        } else {
                                                            handleInputChange({target: {value: ""}}, "targetAmount");
                                                        }
                                                    }}
                                                    placeholder="Target Amount"
                                                />
                                            </label>
                                            <label className="form-label">
                                                Allocated Funds:
                                                <input
                                                    type="text"
                                                    value={goalEdits.allocatedFunds?.toLocaleString() || ""}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/,/g, "");
                                                        if (!isNaN(rawValue) && rawValue !== "") {
                                                            handleInputChange({target: {value: Number(rawValue)}}, "allocatedFunds");
                                                        } else {
                                                            handleInputChange({target: {value: ""}}, "allocatedFunds");
                                                        }
                                                    }}
                                                    placeholder="Allocated Funds"
                                                />
                                            </label>
                                            <label className="form-label">
                                                Deadline:
                                                <input
                                                    type="date"
                                                    value={goalEdits.deadline || ""}
                                                    onChange={(e) => handleInputChange(e, "deadline")}
                                                />
                                            </label>
                                        </div>
                                        <div className="goal-buttons">
                                            <button onClick={saveGoalEdits} className="goal-button save-button">
                                                Save
                                            </button>
                                            <button onClick={cancelEditing} className="goal-button cancel-button">
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="goal-card-content">
                                            <p>
                                                <FaBullseye className="goal-icon"/>
                                                <strong> Goal:</strong> {goalItem.goal}
                                            </p>
                                            <p>
                                                <FaMoneyBillWave/>
                                                <strong> Target Amount:</strong>{" "}
                                                {getCurrencySymbol(currency)}
                                                {goalItem.targetAmount}
                                            </p>
                                            <p>
                                                <FaMoneyBillWave/>
                                                <strong> Allocated Funds:</strong>{" "}
                                                {getCurrencySymbol(currency)}
                                                {goalItem.allocatedFunds}
                                            </p>
                                            <p>
                                                <FaCalendarAlt/>
                                                <strong> Deadline:</strong> {goalItem.deadline}
                                            </p>
                                        </div>
                                        <div className="goal-progress-buttons">
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{
                                                        width: `${calculateProgress(goalItem.allocatedFunds, goalItem.targetAmount)}%`,
                                                        backgroundColor: getProgressColor(
                                                            calculateProgress(goalItem.allocatedFunds, goalItem.targetAmount)
                                                        ),
                                                    }}
                                                ></div>
                                            </div>
                                            <p>
                                                <small>
                                                    {calculateProgress(goalItem.allocatedFunds, goalItem.targetAmount).toFixed(1)}%
                                                    complete
                                                </small>
                                            </p>
                                            <div className="goal-buttons">
                                                <button
                                                    onClick={() => startEditing(goalItem)}
                                                    className="goal-button goal-edit-button"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteGoal(goalItem.id)}
                                                    className="goal-button goal-delete-button"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>


                </>
            ) : (
                <p className="no-goals-text">No goals found.</p>
            )}
        </div>
    );
};

export default Goals;
