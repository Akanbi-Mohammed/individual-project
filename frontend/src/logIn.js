import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './fireBase';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import './styles.css';

const LogIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Create a navigate function

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home'); // Navigate to the homepage after successful login
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
                    <h2>Log In</h2>
                    <p>Log in to your account</p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Email"
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

                        <button type="submit">Log In</button>

                    </form>
                    <p>Don't have an account? <a href="/signUp">Sign Up</a></p>

                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </>
    );
};

export default LogIn;
