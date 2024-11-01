// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LogIn from './logIn';
import HomePage from './homePage';
import SignUp from './signUp';
import ContactUs from './contactUs';

function App() {
  return (
      <Router>
        <nav>
          <Link to="/">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </nav>
        <Routes>
          <Route path="/" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/contactus" element={<ContactUs />} />
        </Routes>
      </Router>
  );
}

export default App;
