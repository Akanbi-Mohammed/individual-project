import React from 'react';
import './styles.css'; // Ensure styles are correctly imported
import emailIcon from './images/email.png'; // Your image path
import linkedinIcon from './images/linkedin.png'; // Add LinkedIn icon
import githubIcon from './images/github.png'; // Add GitHub icon

const ContactUs = () => {
    return (
        <>
            <nav className="navbar">
                <div className="logo">Budget Tracker</div>
                <div className="nav-links">
                    <a href="/">Home</a>
                </div>
            </nav>

            <div className="about-section">
                <h2>About Us</h2>
                <p>Welcome to my final year project! If you want to learn more about it, feel free to reach out through the links below.</p>
            </div>

            <div className="contact-section">
                <h2>Contact Us</h2>
                <div className="contact-methods">
                    <div className="contact-item">
                        <img src={emailIcon} alt="Email Icon" />
                        <p><strong>Email</strong></p>
                        <a href="mailto:mohammedakanbi20@gmail.com">mohammedakanbi20@gmail.com</a> {/* Add mailto link */}
                    </div>
                    <div className="contact-item">
                        <img src={linkedinIcon} alt="LinkedIn Icon" />
                        <p><strong>LinkedIn</strong></p>
                        <a href="https://www.linkedin.com/in/mohammed-akanbi-0167291b6?originalSubdomain=uk" target="_blank" rel="noopener noreferrer">linkedin.com/mohammed-akanbi</a> {/* LinkedIn hyperlink */}
                    </div>
                    <div className="contact-item">
                        <img src={githubIcon} alt="GitHub Icon" />
                        <p><strong>GitHub</strong></p>
                        <a href="https://github.com/Akanbi-Mohammed/individual-project/" target="_blank" rel="noopener noreferrer">github.com/Akanbi-Mohammed</a> {/* GitHub hyperlink */}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContactUs;
