import React from 'react';
import './styles.css';
import Navbar from './navbar';
import githubIcon from './images/github.png';
import linkedinIcon from './images/linkedin.png';
import emailIcon from './images/email.png';

const AboutPage = () => {
    return (
        <>
            <Navbar />
            <div className="about-container">
                <h1 className="intro-title">Hi, I'm Mohammed!</h1>
                <p className="intro-subtitle">
                    This budgeting app was developed for my final year project at the University of Glasgow.
                </p>

                <hr className="divider" />

                <div className="about-section">
                    <h2>The Project</h2>
                    <p>
                        This tool was created to help individuals track their finances and build better budgeting habits.
                        It provides insights through analytics and visualisations, and was developed over several months using React and Firebase.
                    </p>
                </div>

                <div className="thanks-section">
                    <h2>Help and Special Mentions</h2>
                    <p>
                        A big thank you to my supervisor, my friends who tested the app, and everyone who supported me
                        throughout the development process.
                    </p>
                </div>
            </div>

            <footer className="contact-footer">
                <p className="connect-text">Feel free to connect with me:</p>
                <div className="social-icons">
                    <a href="mailto:mohammedakanbi20@gmail.com" target="_blank" rel="noopener noreferrer">
                        <img src={emailIcon} alt="Email" />
                    </a>
                    <a href="https://www.linkedin.com/in/mohammed-akanbi-0167291b6" target="_blank" rel="noopener noreferrer">
                        <img src={linkedinIcon} alt="LinkedIn" />
                    </a>
                    <a href="https://github.com/Akanbi-Mohammed/individual-project/" target="_blank" rel="noopener noreferrer">
                        <img src={githubIcon} alt="GitHub" />
                    </a>
                </div>
                <p className="copyright">© 2025 Mohammed Akanbi</p>
            </footer>
        </>
    );
};

export default AboutPage;
