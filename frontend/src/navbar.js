import React from 'react';
import './navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <span>Budget Tracker</span>
            </div>
            <div className="navbar-links">
                <a href="/home">Home</a>
                <a href="/expenses">Expenses</a>
                <a href="/budgets">Budgets</a>
                <a href="/goals">Goals</a>
                <a href="/analytics">Analytics</a>
                <a href="/contactUs">Contact Us</a>
            </div>
        </nav>
    );
};

export default Navbar;
