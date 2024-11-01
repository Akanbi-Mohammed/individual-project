import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './fireBase';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import './styles.css';

const SignUp = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Create a navigate function

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/home'); // Navigate to the homepage after successful sign-up
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="logo">Budget Tracker</div>
                <div className="nav-links">
                    <a href="/contactUs">Contact Us</a>
                </div>
            </nav>
            <div className="container">
                <div className="form-wrapper">
                    <h2>Sign Up</h2>
                    <p>Create your account to access Budget Planner.</p>
                    <form onSubmit={handleSignUp}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Sign Up</button>
                    </form>
                    <p>Already have an account? <a href="/">Log in</a></p>
                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </>
    );
};

export default SignUp;
