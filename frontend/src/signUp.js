import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './fireBase';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const SignUp = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store full name in the user's Firebase profile
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
            });

            // Navigate to the homepage after successful sign-up
            navigate('/home');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="logo">Budget Tracker</div>
            </nav>
            <div className="container">
                <div className="form-wrapper">
                    <h2>Sign Up</h2>
                    <p>Create your account to access Budget Planner.</p>
                    <form onSubmit={handleSignUp}>
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
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
