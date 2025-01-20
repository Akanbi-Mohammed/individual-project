import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './navbar';
import './goals.css';

const Goals = () => {
    const [goal, setGoal] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [allocatedFunds, setAllocatedFunds] = useState('');
    const [deadline, setDeadline] = useState('');
    const [goals, setGoals] = useState([]);
    const [filteredGoals, setFilteredGoals] = useState([]);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [currentGoal, setCurrentGoal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [currency, setCurrency] = useState("£");


    useEffect(() => {
        fetchGoals();
    }, []);

    useEffect(() => {
        filterGoals();
    }, [searchTerm, startDate, endDate, goals]);
    const saveGoal = async () => {
        if (!goal || !targetAmount || !allocatedFunds || !deadline) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            if (editMode) {
                // Update existing goal
                await axios.put(`http://localhost:8080/api/goals/${currentGoal.id}`, {
                    goal,
                    targetAmount,
                    allocatedFunds,
                    deadline,
                });

                // Update the goal locally
                setGoals(goals.map(g => g.id === currentGoal.id ? {
                    ...g,
                    goal,
                    targetAmount,
                    allocatedFunds,
                    deadline
                } : g));

            } else {
                // Add new goal
                await axios.post('http://localhost:8080/api/goals', {
                    goal,
                    targetAmount,
                    allocatedFunds,
                    deadline,
                });

                fetchGoals(); // Fetch updated goals
            }

            resetForm();
        } catch (error) {
            console.error("Error saving goal:", error);
            setError("Error saving goal. Please try again later.");
        }
    };


    const fetchGoals = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/goals');
            setGoals(response.data);
        } catch (error) {
            console.error("Error fetching goals:", error);
            setError("Error fetching goals. Please try again later.");
        }
    };

    const filterGoals = () => {
        let filtered = goals;

        if (searchTerm) {
            filtered = filtered.filter(goal => goal.goal.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (startDate) {
            filtered = filtered.filter(goal => new Date(goal.deadline) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(goal => new Date(goal.deadline) <= new Date(endDate));
        }

        setFilteredGoals(filtered);
    };

    const addGoal = async () => {
        if (!goal || !targetAmount || !allocatedFunds || !deadline) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/goals', {
                goal,
                targetAmount,
                allocatedFunds,
                deadline,
            });
            fetchGoals();
            resetForm();
        } catch (error) {
            console.error("Error adding goal:", error);
            setError("Error adding goal. Please try again later.");
        }
    };

    const deleteGoal = async (goalId) => {
        try {
            await axios.delete(`http://localhost:8080/api/goals/${goalId}`);
            setGoals(goals.filter(goal => goal.id !== goalId));
        } catch (error) {
            console.error("Error deleting goal:", error);
            setError("Error deleting goal. Please try again later.");
        }
    };

    const startEditing = (goal) => {
        setEditMode(true);
        setCurrentGoal(goal);
        setGoal(goal.goal);
        setTargetAmount(goal.targetAmount);
        setAllocatedFunds(goal.allocatedFunds);
        setDeadline(goal.deadline);
    };

    const resetForm = () => {
        setEditMode(false);
        setCurrentGoal(null);
        setGoal('');
        setTargetAmount('');
        setAllocatedFunds('');
        setDeadline('');
        setError(null);
    };


    const toggleDateFilter = () => {
        setShowDateFilter(!showDateFilter);
    };

    // Calculate progress percentage for the goal
    const calculateProgress = (allocatedFunds, targetAmount) => {
        if (targetAmount === 0) return 0;
        return Math.min((allocatedFunds / targetAmount) * 100, 100);
    };

    return (
        <div className="budget-tracker-container">
            <Navbar/>

            <h2 className="intro-title">Set Your Financial Goals</h2>
            <p className="intro-text">Define your financial targets and track your progress.</p>

            <div className="goal-form">
                <div className="goal-form">


                    <div className="form-group-inline">
                        <label htmlFor="goal" className="field-label">Goal Name:</label>
                        <small className="field-description">A short description of what you want to achieve.</small>
                    </div>
                    <input
                        id="goal"
                        type="text"
                        placeholder="e.g., Save for vacation"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="form-input"
                    />

                    <div className="form-group-inline">
                        <label htmlFor="targetAmount" className="field-label">Target Amount:</label>
                        <small className="field-description">The total amount you aim to save.</small>
                    </div>
                    <input
                        id="targetAmount"
                        type="number"
                        placeholder={`e.g., ${currency}1000`}
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="form-input"
                    />

                    <div className="form-group-inline">
                        <label htmlFor="deadline" className="field-label">Deadline:</label>
                        <small className="field-description">The target date to achieve this goal.</small>
                    </div>
                    <input
                        id="deadline"
                        type="date"
                        placeholder="Select deadline"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="form-input"
                    />
                </div>


                {editMode ? (
                    <>
                        <button onClick={saveGoal} className="form-button">Save Changes</button>
                        <button onClick={resetForm} className="form-button cancel">Cancel</button>
                    </>
                ) : (
                    <button onClick={saveGoal} className="form-button">Add Goal</button>
                )}

            </div>

            {
                error && <p className="error-text">{error}</p>
            }

            <div className="filter-section">
                <input
                    type="text"
                    placeholder="Search by goal name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                />
                <button onClick={toggleDateFilter} className="filter-toggle-button">
                    {showDateFilter ? "Hide Date Range" : "Filter by Date Range"}
                </button>
                {showDateFilter && (
                    <div className="date-filter">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="date-input"
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="date-input"
                            placeholder="End Date"
                        />
                    </div>
                )}
            </div>

            <h2 className="section-title">Your Goals</h2>
            {
                filteredGoals.length > 0 ? (
                    <div className="goals-list">
                        {filteredGoals.map((goal) => (
                            <div key={goal.id} className="goal-card">
                                <div className="goal-card-content">
                                    <p><strong>Goal:</strong> {goal.goal}</p>
                                    <p><strong>Target Amount:</strong> £{goal.targetAmount}</p>
                                    <p><strong>Allocated Funds:</strong> £{goal.allocatedFunds}</p>
                                    <p><strong>Deadline:</strong> {goal.deadline}</p>
                                    {/* Blue Progress bar */}
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                    style={{width: `${calculateProgress(goal.allocatedFunds, goal.targetAmount)}%`}}
                                ></div>
                            </div>
                            <p><small>{calculateProgress(goal.allocatedFunds, goal.targetAmount).toFixed(1)}%
                                complete</small></p>
                        </div>
                        <div className="goal-buttons">
                            <button onClick={() => startEditing(goal)}
                                    className="goal-button goal-edit-button">Edit
                            </button>
                            <button onClick={() => deleteGoal(goal.id)}
                                    className="goal-button goal-delete-button">Delete
                            </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-goals-text">No goals found.</p>
            )}
        </div>
    );
};

export default Goals;
