import React from 'react';
import './styles.css';

const HomePage = () => {
    return (
        <>
            <nav className="navbar">
                <div className="logo">Budget Tracker</div>
                <div className="nav-links">
                    <a href="/">Logout</a>
                </div>
            </nav>
            <div className="homepage-container">
                <h1>Welcome to Your Budget Tracker!</h1>
                <p>This is the homepage where you can track your finances and plan your budget.</p>
            </div>
        </>
    );
};

export default HomePage;
