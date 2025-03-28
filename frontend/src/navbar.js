import React, { useState } from "react";
import { FaHome, FaWallet, FaChartPie, FaCog, FaTimes,FaPhone,FaBullseye } from "react-icons/fa";
import "./navbar.css";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">Budget Tracker</div>

            {/* Hamburger Icon (Button) - Hidden on large screens */}
            <button
                className="menu-icon"
                onClick={toggleMenu}
                aria-label="Toggle navigation"
                aria-expanded={isOpen}
            >
                ☰
            </button>

            {/* Overlay (dims background) */}
            <div
                className={`overlay ${isOpen ? "show" : ""}`}
                onClick={toggleMenu}
            ></div>

            {/* Side Drawer / Desktop Nav */}
            <div className={`navbar-links ${isOpen ? "show" : ""}`}>
                {/* Close Button (Only visible on mobile side drawer) */}
                <button className="close-btn" onClick={toggleMenu} aria-label="Close menu">
                    <FaTimes />
                </button>

                <a href="/home">
                    <FaHome className="icon" /> Home
                </a>
                <a href="/budgets" className="navbar-budgets">
                    <FaWallet className="icon" /> Budgets
                </a>
                <a href="/expenses">
                    <FaWallet className="icon" className="navbar-expenses" />  Expenses
                </a>
                <a href="/goals" className="navbar-goals">
                    <FaBullseye className="icon" /> Goals
                </a>
                <a href="/analytics" className="navbar-analytics">
                    <FaChartPie className="icon" /> Analytics
                </a>
                <a href="/settings" className="navbar-settings">
                    <FaCog className="icon" /> Settings
                </a>
                <a href="/contactUs">
                    <FaPhone className="icon flipped-icon" /> Contact Us
                </a>
                <a href="/">
                    <FaTimes className="icon" /> Log Out
                </a>
            </div>
        </nav>
    );
};

export default Navbar;
